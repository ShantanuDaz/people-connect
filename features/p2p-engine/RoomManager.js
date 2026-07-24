import crypto from "hypercore-crypto";
import { AutobaseManager } from "./AutobaseManager.js";

export class RoomManager {
  /**
   * @param {string} topicName - Name of the room/topic to join
   * @param {Object} options
   * @param {Object} options.swarm - Shared Hyperswarm instance (required)
   * @param {Object} options.store - Shared Corestore instance (required)
   * @param {Function} [options.onMessage] - Callback when message is received (payload)
   * @param {Function} [options.onPeerConnect] - Callback when peer connects (peerIdHex, socket)
   * @param {Function} [options.onPeerDisconnect] - Callback when peer disconnects (socket)
   * @param {Function} [options.onError] - Callback when socket error occurs (err, socket)
   */
  constructor(topicName, options = {}) {
    if (!options.swarm) {
      throw new Error(
        "RoomManager requires a shared 'swarm' instance in options.",
      );
    }
    if (!options.store) {
      throw new Error(
        "RoomManager requires a shared 'store' (Corestore) instance in options.",
      );
    }

    this.topicName = topicName;
    this.swarm = options.swarm;
    this.baseStore = options.store;
    this.roomStore = this.baseStore.namespace(this.topicName);

    this.conns = new Set();
    this.onMessage = options.onMessage || null;
    this.onPeerConnect = options.onPeerConnect || null;
    this.onPeerDisconnect = options.onPeerDisconnect || null;
    this.onError = options.onError || null;

    this.topicBuffer = this._getTopicBuffer(this.topicName);
    this.discovery = null;
    this.autobaseManager = new AutobaseManager(this.roomStore, this.topicName);
    this._readIndex = 1;
    this._flushing = null;
    this._activeSessions = [];
    this._storeWatcher = null;

    this._onSwarmConnection = this._handleSwarmConnection.bind(this);
    this._onViewAppend = () => {
      this._flushViewMessages();
    };
  }

  /**
   * Generates a 32-byte topic buffer from a room string using hypercore-crypto.
   * @param {string} topicName
   * @returns {Buffer} 32-byte discovery key buffer
   */
  _getTopicBuffer(topicName) {
    return crypto.data(Buffer.from(topicName));
  }

  /**
   * Joins this room's topic on Hyperswarm and initializes Autobase multiwriter core.
   * @returns {Promise<void>}
   */
  async join() {
    await this.autobaseManager.init();

    // Register swarm connection listener
    this.swarm.on("connection", this._onSwarmConnection);

    // Join topic on DHT
    this.discovery = this.swarm.join(this.topicBuffer, {
      client: true,
      server: true,
    });
    await this.discovery.flushed();

    // Setup store watcher to open all dynamic/remote cores with active: true so they replicate
    this._storeWatcher = async (core) => {
      if (core.key && !this._activeSessions.some((s) => s.discoveryKey.equals(core.discoveryKey))) {
        const session = this.roomStore.get({ key: core.key, active: true });
        this._activeSessions.push({ session, discoveryKey: core.discoveryKey });
        await session.ready().catch(() => {});
      }
    };
    this.roomStore.watch(this._storeWatcher);

    // Setup event-driven subscription to the B-tree linearized view core
    if (this.autobaseManager.view && this.autobaseManager.view.core) {
      this.autobaseManager.view.core.on("append", this._onViewAppend);
    }

    // Initial flush of historical messages
    await this._flushViewMessages();

    console.log(
      `\n--- Joined Room: '${this.topicName}' via Hyperswarm & Autobase ---`,
    );
    console.log("Type your message and press Enter.");
    console.log("Commands: '/exit' to quit.\n");
  }

  /**
   * Reads unread items from the linearized Autobase view and calls onMessage
   */
  async _flushViewMessages() {
    if (!this.autobaseManager || !this.autobaseManager.view) return;

    // Concurrency control to serialize multiple flush invocations
    while (this._flushing) {
      await this._flushing;
    }

    let resolveFlush;
    this._flushing = new Promise((resolve) => {
      resolveFlush = resolve;
    });

    try {
      await this.autobaseManager.update();
      const view = this.autobaseManager.view;
      const history = view.createHistoryStream({ gte: this._readIndex });
      for await (const entry of history) {
        this._readIndex = entry.seq + 1;
        if (entry.type === "put" && entry.key.startsWith("msg!") && entry.value) {
          if (this.onMessage) {
            this.onMessage(entry.value);
          }
        }
      }
    } catch (err) {
      if (this.onError) this.onError(err);
    } finally {
      this._flushing = null;
      resolveFlush();
    }
  }


  /**
   * Handles incoming swarm connections filtered by topic
   */
  _handleSwarmConnection(socket, peerInfo) {
    if (peerInfo.topic && !peerInfo.topic.equals(this.topicBuffer)) {
      return;
    }

    const peerIdHex = peerInfo.publicKey
      ? Buffer.from(peerInfo.publicKey).toString("hex").slice(-6)
      : "peer";

    this.conns.add(socket);

    // Replicate room Corestore over the Hyperswarm raw socket
    this.roomStore.replicate(socket);

    if (this.onPeerConnect) {
      this.onPeerConnect(peerIdHex, socket);
    }

    this._setupSocketListeners(socket);
  }

  /**
   * Sets up individual socket event handlers for close and error
   * @param {import('net').Socket} socket
   */
  _setupSocketListeners(socket) {
    const onClose = () => {
      if (this.conns.has(socket)) {
        this.conns.delete(socket);
        if (this.onPeerDisconnect) {
          this.onPeerDisconnect(socket);
        }
      }
    };

    const onError = (err) => {
      if (this.conns.has(socket)) {
        this.conns.delete(socket);
        if (this.onError) {
          this.onError(err, socket);
        }
      }
    };

    socket.on("close", onClose);
    socket.on("error", onError);
  }

  /**
   * Broadcasts (appends) a payload object to the local Autobase core.
   * Corestore automatically syncs blocks to all connected peers.
   * @param {Object} payload
   * @returns {Promise<boolean>} returns true if appended successfully
   */
  async broadcast(payload) {
    if (!this.autobaseManager) {
      return false;
    }
    const fullPayload = { room: this.topicName, ...payload };
    try {
      await this.autobaseManager.append(fullPayload);
      await this.autobaseManager.update();
      return true;
    } catch (err) {
      if (this.onError) this.onError(err);
      return false;
    }
  }

  /**
   * Gets current connected peers count for this room
   */
  get peerCount() {
    return this.conns.size;
  }

  /**
   * Leaves room topic and cleans up connection listeners
   */
  async leave() {
    if (this._storeWatcher) {
      this.roomStore.unwatch(this._storeWatcher);
      this._storeWatcher = null;
    }
    for (const { session } of this._activeSessions) {
      await session.close().catch(() => {});
    }
    this._activeSessions = [];

    this.swarm.removeListener("connection", this._onSwarmConnection);
    if (this.discovery) {
      await this.discovery.destroy();
      this.discovery = null;
    }
    if (this.autobaseManager) {
      if (this.autobaseManager.view && this.autobaseManager.view.core) {
        this.autobaseManager.view.core.removeListener("append", this._onViewAppend);
      }
      await this.autobaseManager.close();
    }
    this.conns.clear();
  }
}
