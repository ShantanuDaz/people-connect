const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  request: (channel, data) => ipcRenderer.invoke('request', channel, data),
  sendAction: (channel, data) => ipcRenderer.send('send-action', channel, data),
  onEvent: (callback) => {
    const subscription = (event, value) => callback(value);
    ipcRenderer.on('events', subscription);
    return () => ipcRenderer.removeListener('events', subscription);
  }
});
