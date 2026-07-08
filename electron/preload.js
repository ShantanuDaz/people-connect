const { contextBridge, ipcRenderer } = require('electron')

// Expose a minimal API to the sandboxed renderer
contextBridge.exposeInMainWorld('chat', {
  send(text) {
    return ipcRenderer.invoke('chat:send', text)
  },
  start(opts) {
    return ipcRenderer.invoke('chat:start', opts)
  },
  onMessage(listener) {
    const wrap = (_evt, payload) => listener(JSON.parse(payload))
    ipcRenderer.on('chat:from-worker', wrap)
    return () => ipcRenderer.removeListener('chat:from-worker', wrap)
  }
})

contextBridge.exposeInMainWorld('store', {
  getProfile() {
    return ipcRenderer.invoke('store:getProfile')
  },
  setProfile(profile) {
    return ipcRenderer.invoke('store:setProfile', profile)
  }
})
