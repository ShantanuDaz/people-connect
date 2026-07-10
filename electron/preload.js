const { contextBridge, ipcRenderer } = require('electron')

// Expose a minimal API to the sandboxed renderer
contextBridge.exposeInMainWorld('connection', {
  sendTo({ topic, payload }) {
    return ipcRenderer.invoke('connection:sendTo', { topic, payload })
  },
  getHistory(topic) {
    return ipcRenderer.invoke('connection:getHistory', topic)
  },
  getConnections() {
    return ipcRenderer.invoke('connection:getConnections')
  },
  requestJoin(peerPubKeyHex, userInfo) {
    return ipcRenderer.invoke('connection:requestJoin', { peerPubKeyHex, userInfo })
  },
  acceptRequest(peerPubKeyHex, userInfo) {
    return ipcRenderer.invoke('connection:acceptRequest', { peerPubKeyHex, userInfo })
  },
  rejectRequest(peerPubKeyHex) {
    return ipcRenderer.invoke('connection:rejectRequest', peerPubKeyHex)
  },
  getPublicKey() {
    return ipcRenderer.invoke('connection:getPublicKey')
  },
  updateProfile(userInfo) {
    return ipcRenderer.invoke('connection:updateProfile', userInfo)
  },
  start(opts) {
    return ipcRenderer.invoke('connection:start', opts)
  },
  onMessage(listener) {
    const wrap = (_evt, payload) => listener(JSON.parse(payload))
    ipcRenderer.on('connection:from-worker', wrap)
    return () => ipcRenderer.removeListener('connection:from-worker', wrap)
  }
})

contextBridge.exposeInMainWorld('store', {
  getProfile() {
    return ipcRenderer.invoke('store:getProfile')
  },
  setProfile(profile) {
    return ipcRenderer.invoke('store:setProfile', profile)
  },
  resetProfile() {
    return ipcRenderer.invoke('store:resetProfile')
  },
  clearChatData() {
    return ipcRenderer.invoke('store:clearChatData')
  }
})
