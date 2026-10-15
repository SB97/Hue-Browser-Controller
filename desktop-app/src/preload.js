const { contextBridge, ipcRenderer } = require('electron');

// Lets the page tell the main process it has rendered its first real view
contextBridge.exposeInMainWorld('desktopApp', {
  ready: () => ipcRenderer.send('app-ready')
});
