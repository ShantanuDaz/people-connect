const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // We will add our Holepunch commands here soon!
  ping: () => ipcRenderer.invoke("ping"),
});
