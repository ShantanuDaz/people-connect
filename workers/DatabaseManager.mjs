import Hypercore from "hypercore";
import Hyperbee from "hyperbee";
import b4a from "b4a";
export class DatabaseManager {
  constructor(storagePath) {
    this.storagePath = storagePath;
    this.outgoingDbs = new Map(); // topicHex -> Hyperbee (our outgoing)
    this.incomingDbs = new Map(); // topicHex -> peerPubKeyHex -> Hyperbee (their incoming)
    this.systemDb = null;
    this.onDbChange = null;
  }

  async initSystemDb() {
    const core = new Hypercore(`${this.storagePath}/system`);
    this.systemDb = new Hyperbee(core, { keyEncoding: 'utf-8', valueEncoding: 'json' });
    await this.systemDb.ready();
  }

  async updateConnectionState(peerPubKeyHex, stateData) {
    await this.systemDb.put(`connection:${peerPubKeyHex}`, stateData);
    if (this.onDbChange) {
      this.onDbChange({ type: 'connection_state', peerPubKeyHex, stateData });
    }
  }

  async getConnectionState(peerPubKeyHex) {
    const entry = await this.systemDb.get(`connection:${peerPubKeyHex}`);
    return entry ? entry.value : null;
  }

  async getAllConnections() {
    const connections = {
      pending: [],
      requested: [],
      connections: [],
      rejected: []
    };
    for await (const { key, value } of this.systemDb.createReadStream({ gte: 'connection:', lt: 'connection;'})) {
      const peerPubKeyHex = key.split(':')[1];
      if (connections[value.status]) {
        connections[value.status].push({ peerPubKeyHex, ...value });
      }
    }
    return connections;
  }

  async setupOutgoing(topicHex) {
    if (this.outgoingDbs.has(topicHex)) return this.outgoingDbs.get(topicHex);
    
    const outCore = new Hypercore(`${this.storagePath}/${topicHex}/outgoing`);
    const outDb = new Hyperbee(outCore, { keyEncoding: 'utf-8', valueEncoding: 'json' });
    await outDb.ready();
    this.outgoingDbs.set(topicHex, outDb);
    return outDb;
  }

  getOutgoing(topicHex) {
    return this.outgoingDbs.get(topicHex);
  }

  async setupIncoming(topicHex, peerIdHex, dbKeyHex) {
    let peerMap = this.incomingDbs.get(topicHex);
    if (!peerMap) {
      peerMap = new Map();
      this.incomingDbs.set(topicHex, peerMap);
    }

    if (peerMap.has(peerIdHex)) return peerMap.get(peerIdHex);

    const incomingCore = new Hypercore(
      `${this.storagePath}/${topicHex}/peers/${peerIdHex}`, 
      b4a.from(dbKeyHex, 'hex')
    );
    const incomingDb = new Hyperbee(incomingCore, { keyEncoding: 'utf-8', valueEncoding: 'json' });
    await incomingDb.ready();
    
    peerMap.set(peerIdHex, incomingDb);
    return { incomingDb, incomingCore };
  }

  getIncomingPeers(topicHex) {
    return this.incomingDbs.get(topicHex); // Map<peerId, Hyperbee>
  }

  async getHistory(topicHex, myName) {
    const history = [];
      
    const outDb = this.getOutgoing(topicHex);
    if (outDb) {
      for await (const { key, value } of outDb.createReadStream()) {
        history.push({ payload: value, from: myName, isOwn: true, timestamp: parseInt(key) });
      }
    }

    const peersMap = this.getIncomingPeers(topicHex);
    if (peersMap) {
      for (const [peerId, incDb] of peersMap) {
        for await (const { key, value } of incDb.createReadStream()) {
          history.push({ payload: value, from: peerId.slice(0, 6), isOwn: false, timestamp: parseInt(key) });
        }
      }
    }

    history.sort((a, b) => a.timestamp - b.timestamp);
    return history;
  }

  async insertPayload(topicHex, payload) {
    const outDb = this.getOutgoing(topicHex);
    if (outDb) {
      const timestamp = Date.now().toString();
      await outDb.put(timestamp, payload);
      return true;
    }
    return false;
  }
}
