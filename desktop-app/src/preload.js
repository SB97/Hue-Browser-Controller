const { contextBridge, ipcRenderer } = require('electron');

// Lets the page tell the main process it has rendered its first real view
contextBridge.exposeInMainWorld('desktopApp', {
  ready: () => ipcRenderer.send('app-ready')
});

// Dark title bar replacing the hidden native one on Windows (see titleBarOverlay in index.js)
if (process.platform === 'win32') {
  window.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
      #desktopTitleBar {
        position: fixed; top: 0; left: 0; right: 0; height: 32px; z-index: 10000;
        background: #202020; color: #ffffff; font: 12px 'Segoe UI', sans-serif;
        display: flex; align-items: center; padding-left: 12px;
        user-select: none;
      }
      body { padding-top: 32px; }
      #overlay { top: 32px; }`;
    document.head.appendChild(style);
    const bar = document.createElement('div');
    bar.id = 'desktopTitleBar';
    bar.textContent = document.title || 'Open Hue Controller';
    document.body.prepend(bar);

    // Window dragging is done by the main process (see titlebar-drag-start in index.js)
    bar.addEventListener('mousedown', (e) => {
      if (e.button === 0 && e.detail === 1) ipcRenderer.send('titlebar-drag-start');
    });
    bar.addEventListener('dblclick', () => ipcRenderer.send('titlebar-toggle-maximize'));
    window.addEventListener('mouseup', () => ipcRenderer.send('titlebar-drag-end'));
    window.addEventListener('blur', () => ipcRenderer.send('titlebar-drag-end'));
  });
}
