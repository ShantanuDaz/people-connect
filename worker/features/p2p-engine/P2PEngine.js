import { createNetwork } from "./NetworkManager.js";
import { createStore } from "./StoreManager.js";
import { RoomManager } from "./RoomManager.js";

/**
 * P2PEngine handles the coordination and lifecycle of core peer-to-peer resources
 * (Hyperswarm and Corestore), allowing multiple RoomManagers or other features to
 * share the same networking and storage instances.
 */
export class P2PEngine {
  /**
   * @param {string} profileName - The name of the active user profile (used to sandbox storage)
   */
  constructor(profileName) {
    this.swarm = createNetwork();
    this.store = createStore(profileName);
    this.rooms = new Map();
  }

  /**
   * Instantiates and joins a RoomManager for a given room topic, using the engine's shared swarm and store.
   * @param {string} roomTopic - The name/topic of the chat room to join
   * @param {Object} options - Room callbacks
   * @param {Function} [options.onMessage] - Callback when message is received (payload)
   * @param {Function} [options.onPeerConnect] - Callback when peer connects (peerIdHex, socket)
   * @param {Function} [options.onPeerDisconnect] - Callback when peer disconnects (socket)
   * @param {Function} [options.onError] - Callback when error occurs (err, socket)
   * @returns {Promise<RoomManager>} The active RoomManager instance
   */
  async joinRoom(roomTopic, options = {}) {
    if (this.rooms.has(roomTopic)) {
      return this.rooms.get(roomTopic);
    }

    const roomManager = new RoomManager(roomTopic, {
      swarm: this.swarm,
      store: this.store,
      onMessage: options.onMessage,
      onPeerConnect: options.onPeerConnect,
      onPeerDisconnect: options.onPeerDisconnect,
      onError: options.onError,
    });

    await roomManager.join();
    this.rooms.set(roomTopic, roomManager);
    return roomManager;
  }

  /**
   * Leaves a room and cleans up its listeners and resources.
   * @param {string} roomTopic - The room topic to leave
   */
  async leaveRoom(roomTopic) {
    const roomManager = this.rooms.get(roomTopic);
    if (roomManager) {
      await roomManager.leave();
      this.rooms.delete(roomTopic);
    }
  }

  /**
   * Gracefully leaves all joined rooms and destroys the store and swarm nodes.
   */
  async close() {
    for (const roomManager of this.rooms.values()) {
      await roomManager.leave();
    }
    this.rooms.clear();

    await this.store.close();
    await this.swarm.destroy();
  }
}
