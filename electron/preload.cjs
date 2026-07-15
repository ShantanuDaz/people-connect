const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  ping: () => ipcRenderer.invoke("ping"),
  profile: {
    get: () => ipcRenderer.invoke("api:get-profile"),
    save: (name, displayName) => ipcRenderer.invoke("api:save-profile", name, displayName),
    clear: () => ipcRenderer.invoke("api:clear-profile"),
  },
  account: {
    get: () => ipcRenderer.invoke("api:account-get"),
    create: (payload) => ipcRenderer.invoke("api:account-create", payload),
    update: (payload) => ipcRenderer.invoke("api:account-update", payload),
    delete: () => ipcRenderer.invoke("api:account-delete"),
  },
  pairing: {
    host: (bootstrapKeyHex) => ipcRenderer.invoke("api:pairing-host", bootstrapKeyHex),
    client: (roomCode) => ipcRenderer.invoke("api:pairing-client", roomCode),
    requestCopy: () => ipcRenderer.invoke("api:pairing-request-copy"),
    approve: (deviceKeyHex, inputCoreKeyHex) => ipcRenderer.invoke("api:pairing-approve", deviceKeyHex, inputCoreKeyHex),
    cleanup: () => ipcRenderer.invoke("api:pairing-cleanup"),
    onWorkerEvent: (callback) => {
      ipcRenderer.on("worker:event", (_, message) => {
        if (message && message.type && message.type.startsWith("pairing:")) {
          callback(message);
        }
      });
    }
  },
  network: {
    joinSwarm: (keyPair) => ipcRenderer.invoke("api:join-swarm", keyPair),
  }
});
