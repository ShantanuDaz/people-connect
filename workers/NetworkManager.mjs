import Hyperswarm from "hyperswarm";
import b4a from "b4a";
import hypercoreCrypto from "hypercore-crypto";

export class NetworkManager {
  constructor(seedHex, dbManager, ipcHandler) {
    this.dbManager = dbManager;
    this.ipcHandler = ipcHandler;
    
    const seed = b4a.from(seedHex, "hex");
    const keyPair = hypercoreCrypto.keyPair(seed);
    this.publicKeyHex = b4a.toString(keyPair.publicKey, "hex");
    
    this.swarm = new Hyperswarm({ keyPair });
    this.activeTopics = new Set();
    this.activeConnections = new Map(); // peerPubKeyHex -> conn
    
    // For pending inbox connections
    this.pendingInboxMessages = new Map(); // peerPubKeyHex -> messageObject

    this.swarm.on("connection", this.handleConnection.bind(this));
  }

  async init() {
    this.ipcHandler.sendLog("[Worker] Initializing NetworkManager with new DB Architecture");
    // 1. Join our own public key as an inbox
    const topicBuffer = b4a.from(this.publicKeyHex, "hex");
    this.swarm.join(topicBuffer, { client: true, server: true });
    
    // 2. Read DB and restore connections
    const conns = await this.dbManager.getAllConnections();
    
    // Join accepted pairwise topics
    for (const c of conns.connections) {
      if (c.pairwiseTopic) await this.joinTopic(c.pairwiseTopic, c.peerPubKeyHex, c.peerDbKey);
    }
    
    // Retry requested
    for (const r of conns.requested) {
      if (r.pairwiseTopic) {
        this.sendInboxMessage(r.peerPubKeyHex, { type: 'incoming_request', peerPubKey: this.publicKeyHex, pairwiseTopic: r.pairwiseTopic });
      }
    }
    
    await this.swarm.flush();
    this.ipcHandler.sendPublicKey(this.publicKeyHex);
    // Send initial DB state to UI
    this.ipcHandler.sendDbState({ type: 'init', connections: conns });
  }

  async joinTopic(topicHex, peerPubKeyHex, peerDbKey) {
    this.ipcHandler.sendLog(`[Worker] joinTopic called for topic: ${topicHex}`);
    if (this.activeTopics.has(topicHex)) return;
    
    this.activeTopics.add(topicHex);
    await this.dbManager.setupOutgoing(topicHex);
    
    if (peerPubKeyHex && peerDbKey) {
      const { incomingCore, incomingDb } = await this.dbManager.setupIncoming(topicHex, peerPubKeyHex, peerDbKey);
      incomingCore.on('append', async () => {
        const seq = incomingCore.length - 1;
        const entry = await incomingDb.getBySeq(seq);
        if (entry && entry.value) {
          const state = await this.dbManager.getConnectionState(peerPubKeyHex);
          const peerName = state?.peerName || peerPubKeyHex.slice(0, 6);
          this.ipcHandler.sendPayload(topicHex, peerName, entry.value);
        }
      });
      this.ipcHandler.sendPeersUpdate(topicHex, 1);
    }

    const topicBuffer = b4a.from(topicHex, "hex");
    this.swarm.join(topicBuffer, { client: true, server: true });
    
    // Not awaiting flush here to be non-blocking
    this.swarm.flush().then(() => {
      this.ipcHandler.sendReady(topicHex);
    });
  }

  sendInboxMessage(peerPubKeyHex, messageObj) {
    if (this.activeConnections.has(peerPubKeyHex)) {
      this.ipcHandler.sendLog(`[Worker] Sending '${messageObj.type}' over existing connection to ${peerPubKeyHex}`);
      const conn = this.activeConnections.get(peerPubKeyHex);
      conn.write(JSON.stringify(messageObj) + '\\n');
    } else {
      this.pendingInboxMessages.set(peerPubKeyHex, messageObj);
      const peerTopicBuffer = b4a.from(peerPubKeyHex, "hex");
      this.swarm.join(peerTopicBuffer, { client: true, server: false });
    }
  }

  handleConnection(conn, info) {
    const topicBuffer = info.topics && info.topics.length > 0 ? info.topics[0] : null;
    const topicHex = topicBuffer ? b4a.toString(topicBuffer, "hex") : "unknown";
    const peerId = b4a.toString(conn.remotePublicKey, "hex");
    
    this.activeConnections.set(peerId, conn);
    
    // Check if we connected to THEIR inbox to send a message
    if (this.pendingInboxMessages.has(peerId) || this.pendingInboxMessages.has(topicHex)) {
      const targetId = this.pendingInboxMessages.has(peerId) ? peerId : topicHex;
      const msg = this.pendingInboxMessages.get(targetId);
      this.ipcHandler.sendLog(`[Worker] Sending '${msg.type}' to peer's inbox!`);
      conn.write(JSON.stringify(msg) + '\\n');
      this.pendingInboxMessages.delete(targetId);
    }

    // Check if THEY connected to OUR inbox (or any active pairwise topic) to receive messages
    this.listenForIncoming(conn, info, topicHex, peerId);
    
    // Only replicate Hypercores if this connection is for an active pairwise chat topic
    // We do NOT replicate hypercores on inbox connections
    if (this.activeTopics.has(topicHex)) {
      this.replicateOutgoing(conn, info, topicHex);
    }

    conn.on("error", () => {});
    conn.on("close", () => {
      this.activeConnections.delete(peerId);
    });
  }

  replicateOutgoing(conn, info, topicHex) {
    this.ipcHandler.sendLog(`[Worker] replicateOutgoing starting for topic: ${topicHex}`);
    const outDb = this.dbManager.getOutgoing(topicHex);
    if (outDb) {
      const stream = outDb.core.replicate(info.client);
      conn.pipe(stream).pipe(conn);

      const incomingMap = this.dbManager.getIncomingPeers(topicHex);
      if (incomingMap) {
        for (const incomingDb of incomingMap.values()) {
          incomingDb.core.replicate(stream);
        }
      }
    }
  }

  listenForIncoming(conn, info, topicHex, peerId) {
    let buffer = '';
    conn.on('data', async (data) => {
      buffer += b4a.toString(data);
      const parts = buffer.split('\\n');
      buffer = parts.pop(); 

      for (const part of parts) {
        if (!part.trim()) continue;
        try {
          const msg = JSON.parse(part);
          
          if (msg.type === 'incoming_request' && msg.peerPubKey) {
            this.ipcHandler.sendLog(`[Worker] Received 'incoming_request' from: ${msg.peerPubKey}`);
            await this.dbManager.updateConnectionState(msg.peerPubKey, { status: 'pending', pairwiseTopic: msg.pairwiseTopic, timestamp: Date.now(), peerDbKey: msg.dbKey, peerInfo: msg.userInfo });
            continue;
          }
          if (msg.type === 'accepted_request' && msg.peerPubKey) {
            this.ipcHandler.sendLog(`[Worker] Received 'accepted_request' from: ${msg.peerPubKey}`);
            const state = await this.dbManager.getConnectionState(msg.peerPubKey);
            if (state) {
              await this.dbManager.updateConnectionState(msg.peerPubKey, { ...state, status: 'connections', peerDbKey: msg.dbKey, peerInfo: msg.userInfo });
              if (state.pairwiseTopic) await this.joinTopic(state.pairwiseTopic, msg.peerPubKey, msg.dbKey);
            }
            continue;
          }
          if (msg.type === 'rejected_request' && msg.peerPubKey) {
            this.ipcHandler.sendLog(`[Worker] Received 'rejected_request' from: ${msg.peerPubKey}`);
            const state = await this.dbManager.getConnectionState(msg.peerPubKey);
            if (state) {
              await this.dbManager.updateConnectionState(msg.peerPubKey, { ...state, status: 'rejected' });
            }
            continue;
          }
          if (msg.type === 'profile_update' && msg.peerPubKey && msg.userInfo) {
            this.ipcHandler.sendLog(`[Worker] Received 'profile_update' from: ${msg.peerPubKey}`);
            const state = await this.dbManager.getConnectionState(msg.peerPubKey);
            if (state) {
              await this.dbManager.updateConnectionState(msg.peerPubKey, { ...state, peerInfo: msg.userInfo });
              this.ipcHandler.sendDbState({ type: 'profile_updated', peerPubKeyHex: msg.peerPubKey });
            }
            continue;
          }
        } catch (e) {
          // not JSON, binary hypercore replication data
        }
      }
    });
  }

  // --- OUTBOX ACTIONS ---

  async broadcastProfile(userInfo) {
    this.ipcHandler.sendLog(`[Worker] Broadcasting profile update to peers`);
    const connections = await this.dbManager.getAllConnections();
    const activePeers = connections.connections.map(c => c.peerPubKeyHex);
    for (const peerId of activePeers) {
      this.sendInboxMessage(peerId, { type: 'profile_update', peerPubKey: this.publicKeyHex, userInfo });
    }
  }

  async sendJoinRequest(peerPubKeyHex, userInfo) {
    if (peerPubKeyHex === this.publicKeyHex) return; 
    this.ipcHandler.sendLog(`[Worker] Initiating join request to ${peerPubKeyHex}`);
    
    const sorted = [this.publicKeyHex, peerPubKeyHex].sort();
    const input = b4a.from(sorted[0] + sorted[1]);
    const pairwiseTopic = b4a.toString(hypercoreCrypto.hash(input), 'hex');
    
    const outDb = await this.dbManager.setupOutgoing(pairwiseTopic);
    const myDbKey = b4a.toString(outDb.core.key, 'hex');
    
    await this.dbManager.updateConnectionState(peerPubKeyHex, { status: 'requested', pairwiseTopic, timestamp: Date.now(), myDbKey });
    this.sendInboxMessage(peerPubKeyHex, { type: 'incoming_request', peerPubKey: this.publicKeyHex, pairwiseTopic, dbKey: myDbKey, userInfo });
  }

  async acceptRequest(peerPubKeyHex, userInfo) {
    this.ipcHandler.sendLog(`[Worker] Accepting request from ${peerPubKeyHex}`);
    const state = await this.dbManager.getConnectionState(peerPubKeyHex);
    if (!state || !state.pairwiseTopic) return;

    const outDb = await this.dbManager.setupOutgoing(state.pairwiseTopic);
    const myDbKey = b4a.toString(outDb.core.key, 'hex');

    await this.dbManager.updateConnectionState(peerPubKeyHex, { ...state, status: 'connections', myDbKey });
    this.sendInboxMessage(peerPubKeyHex, { type: 'accepted_request', peerPubKey: this.publicKeyHex, dbKey: myDbKey, userInfo });
    await this.joinTopic(state.pairwiseTopic, peerPubKeyHex, state.peerDbKey);
  }

  async rejectRequest(peerPubKeyHex) {
    this.ipcHandler.sendLog(`[Worker] Rejecting request from ${peerPubKeyHex}`);
    const state = await this.dbManager.getConnectionState(peerPubKeyHex);
    if (!state) return;

    await this.dbManager.updateConnectionState(peerPubKeyHex, { ...state, status: 'rejected' });
    this.sendInboxMessage(peerPubKeyHex, { type: 'rejected_request', peerPubKey: this.publicKeyHex });
  }
}
