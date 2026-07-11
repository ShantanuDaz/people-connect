const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  ping: () => ipcRenderer.invoke("ping"),
  profile: {
    get: () => ipcRenderer.invoke("api:get-profile"),
    save: (mnemonic, name) =>
      ipcRenderer.invoke("api:save-profile", mnemonic, name),
  },
  network: {
    joinSwarm: (keyPair) => ipcRenderer.invoke("api:join-swarm", keyPair),
  },
});
