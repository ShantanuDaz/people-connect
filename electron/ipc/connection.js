const { ipcMain, app, BrowserWindow } = require('electron')
const path = require('path')
const PearRuntime = require('pear-runtime')

const EventEmitter = require('events')
const workerEvents = new EventEmitter()

let worker = null
let cachedPubKey = null

function setupConnectionIpc() {
  const storagePath = path.join(app.getPath('userData'), 'hyperbee-data')

  ipcMain.handle('connection:start', (_evt, opts) => {
    if (worker) return
    const { seedHex, name } = opts
    // Resolve the worker path correctly from within the ipc folder
    const workerPath = path.join(__dirname, '..', '..', 'workers', 'main.mjs')
    worker = PearRuntime.run(workerPath, [seedHex, name, storagePath])

    let buffer = ''
    worker.on('data', (data) => {
      buffer += data.toString()
      const parts = buffer.split('\\n')
      buffer = parts.pop() // Keep the incomplete part

      const windows = BrowserWindow.getAllWindows()
      for (const part of parts) {
        if (!part.trim()) continue
        
        try {
          const msg = JSON.parse(part)
          if (msg.type === 'history') {
            workerEvents.emit(`history:${msg.topic}`, msg.history)
          } else if (msg.type === 'public_key') {
            cachedPubKey = msg.publicKeyHex
            workerEvents.emit('public_key', msg.publicKeyHex)
          }
        } catch(e) {}

        windows.forEach(w => {
          if (!w.isDestroyed()) w.webContents.send('connection:from-worker', part)
        })
      }
    })

    worker.stderr.on('data', (data) => {
      console.error('[worker]', data.toString())
    })
  })

  ipcMain.handle('connection:getPublicKey', async () => {
    if (cachedPubKey) return cachedPubKey
    return new Promise((resolve) => {
      workerEvents.once('public_key', resolve)
    })
  })

  ipcMain.handle('connection:sendTo', (_evt, { topic, payload }) => {
    if (worker) {
      worker.write(Buffer.from(JSON.stringify({ action: 'send', topic, payload }) + '\\n'))
    }
  })

  ipcMain.handle('connection:getConnections', () => {
    if (worker) worker.write(Buffer.from(JSON.stringify({ action: 'getConnections' }) + '\\n'))
  })
  
  ipcMain.handle('connection:requestJoin', (_evt, data) => {
    const { peerPubKeyHex, userInfo } = data
    if (worker) worker.write(Buffer.from(JSON.stringify({ action: 'requestJoin', peerPubKeyHex, userInfo }) + '\\n'))
  })
  
  ipcMain.handle('connection:acceptRequest', (_evt, data) => {
    const { peerPubKeyHex, userInfo } = data
    if (worker) worker.write(Buffer.from(JSON.stringify({ action: 'acceptRequest', peerPubKeyHex, userInfo }) + '\\n'))
  })
  
  ipcMain.handle('connection:rejectRequest', (_evt, peerPubKeyHex) => {
    if (worker) worker.write(Buffer.from(JSON.stringify({ action: 'rejectRequest', peerPubKeyHex }) + '\\n'))
  })

  ipcMain.handle('connection:updateProfile', (_evt, userInfo) => {
    if (worker) worker.write(Buffer.from(JSON.stringify({ action: 'updateProfile', userInfo }) + '\\n'))
  })

  ipcMain.handle('connection:getHistory', async (_evt, topic) => {
    if (!worker) return []
    return new Promise((resolve) => {
      workerEvents.once(`history:${topic}`, (history) => {
        resolve(history)
      })
      worker.write(Buffer.from(JSON.stringify({ action: 'getHistory', topic }) + '\\n'))
    })
  })
}

function cleanupWorker() {
  if (worker) {
    worker.destroy()
    worker = null
  }
  cachedPubKey = null
}

module.exports = { setupConnectionIpc, cleanupWorker }
