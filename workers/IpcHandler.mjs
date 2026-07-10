import b4a from "b4a";

export class IpcHandler {
  constructor(name) {
    this.name = name;
    this.networkManager = null;
    this.dbManager = null;
  }

  setDependencies(networkManager, dbManager) {
    this.networkManager = networkManager;
    this.dbManager = dbManager;
  }

  startListening() {
    Bare.IPC.on("data", this.handleMessage.bind(this));
  }

  async handleMessage(data) {
    try {
      const parts = b4a.toString(data).split('\\n');
      for (const part of parts) {
        if (!part.trim()) continue;
        const cmd = JSON.parse(part);
        
        if (cmd.action === "send") {
          await this.dbManager.insertPayload(cmd.topic, cmd.payload);
        }
        else if (cmd.action === "getHistory") {
          const history = await this.dbManager.getHistory(cmd.topic, this.name);
          this.sendHistory(cmd.topic, history);
        }
        else if (cmd.action === "requestJoin") {
          await this.networkManager.sendJoinRequest(cmd.peerPubKeyHex, cmd.userInfo);
        }
        else if (cmd.action === "acceptRequest") {
          await this.networkManager.acceptRequest(cmd.peerPubKeyHex, cmd.userInfo);
        }
        else if (cmd.action === "rejectRequest") {
          await this.networkManager.rejectRequest(cmd.peerPubKeyHex);
        }
        else if (cmd.action === "updateProfile") {
          await this.networkManager.broadcastProfile(cmd.userInfo);
        }
        else if (cmd.action === "getConnections") {
          const connections = await this.dbManager.getAllConnections();
          Bare.IPC.write(JSON.stringify({ type: "connections_state", connections }) + '\\n');
        }
      }
    } catch (e) {
      console.error("Worker IPC error:", e);
    }
  }

  // --- Outbound Messages ---

  sendPublicKey(publicKeyHex) {
    Bare.IPC.write(JSON.stringify({ type: "public_key", publicKeyHex }) + '\\n');
  }

  sendLog(message) {
    Bare.IPC.write(JSON.stringify({ type: "log", message }) + '\\n');
  }

  sendDbState(event) {
    Bare.IPC.write(JSON.stringify({ type: "db_changed", event }) + '\\n');
  }

  sendReady(topicHex) {
    Bare.IPC.write(JSON.stringify({ type: "ready", topic: topicHex }) + '\\n');
  }

  sendHistory(topicHex, history) {
    Bare.IPC.write(JSON.stringify({ type: "history", topic: topicHex, history }) + '\\n');
  }

  sendPayload(topicHex, from, payload) {
    Bare.IPC.write(JSON.stringify({ type: "payload", topic: topicHex, from, payload }) + '\\n');
  }

  sendPeersUpdate(topicHex, count) {
    Bare.IPC.write(JSON.stringify({ type: "peers", topic: topicHex, count }) + '\\n');
  }
}
