const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  startScare: () => ipcRenderer.send('start-scare'),
  stopScare: () => ipcRenderer.send('stop-scare')
})
