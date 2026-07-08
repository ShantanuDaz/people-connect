import Hyperswarm from 'hyperswarm' // topic swarms / DHT discovery
import b4a from 'b4a' // encode/decode binary topic and payloads
import hypercoreCrypto from 'hypercore-crypto'

// Topic hex string comes from Electron via Bare.argv (see main process step)
const topic = b4a.from(Bare.argv[2], 'hex')
const seedHex = Bare.argv[3]
const name = Bare.argv[4]

const seed = b4a.from(seedHex, 'hex')
const keyPair = hypercoreCrypto.keyPair(seed)

const swarm = new Hyperswarm({ keyPair })
const conns = [] // active peer sockets

swarm.on('connection', (conn) => {
  const id = b4a.toString(conn.remotePublicKey, 'hex').slice(0, 6) // short display id
  conns.push(conn)
  Bare.IPC.write(JSON.stringify({ type: 'peers', count: conns.length }))

  conn.on('data', (data) => {
    try {
      const msg = JSON.parse(b4a.toString(data))
      Bare.IPC.write(
        JSON.stringify({ type: 'message', from: msg.name || id, text: msg.text })
      )
    } catch (e) {
      Bare.IPC.write(
        JSON.stringify({ type: 'message', from: id, text: b4a.toString(data) })
      )
    }
  })

  conn.on('error', () => {}) // ignore transient socket errors
  conn.once('close', () => {
    conns.splice(conns.indexOf(conn), 1)
    Bare.IPC.write(JSON.stringify({ type: 'peers', count: conns.length }))
  })
})

// Text from Electron main → broadcast to every peer
Bare.IPC.on('data', (data) => {
  const text = b4a.toString(data)
  const payload = JSON.stringify({ name, text })
  for (const conn of conns) conn.write(payload)
})

await swarm.join(topic, { client: true, server: true }).flushed()
Bare.IPC.write(JSON.stringify({ type: 'ready' }))
