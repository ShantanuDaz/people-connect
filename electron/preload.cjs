const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  ping: () => ipcRenderer.invoke("ping"),
  profile: {
    get: () => ipcRenderer.invoke("api:get-profile"),
    save: (seedHex, name, mnemonic) => ipcRenderer.invoke("api:save-profile", seedHex, name, mnemonic),
    clear: () => ipcRenderer.invoke("api:clear-profile"),
  },
  network: {
    joinSwarm: (keyPair) => ipcRenderer.invoke("api:join-swarm", keyPair),
  }
});
