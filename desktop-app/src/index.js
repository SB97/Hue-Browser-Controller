const { app, BrowserWindow, ipcMain, screen, session, shell } = require('electron');
const path = require('path');

const createWindow = () => {
  const title = `Open Hue Controller ${app.getVersion()}`;
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: title,
    icon: path.join(__dirname, "/icons/512x512.png"),
    width: 1200,
    height: 700,
    minWidth: 475,
    minHeight: 450,
    autoHideMenuBar: true,
    // Hide the native Windows title bar and draw dark window controls instead
    // (the drag bar itself is added in preload.js)
    ...(process.platform === 'win32' && {
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#202020',
        symbolColor: '#ffffff',
        height: 32
      }
    }),
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // Read by preload.js and shown in the title bar and the settings
      additionalArguments: [
        `--app-version=${app.getVersion()}`,
        `--app-exe-path=${process.execPath}`
      ]
    }
  });
  // Keep the version in the title instead of the page's <title>
  mainWindow.on('page-title-updated', (e) => e.preventDefault());
  // Stay hidden until the page reports that the dashboard (or login) is rendered.
  let shown = false;
  const showWindow = () => {
    if (shown || mainWindow.isDestroyed()) return;
    shown = true;
    mainWindow.show();
  };
  const onAppReady = (e) => {
    if (e.sender === mainWindow.webContents) showWindow();
  };
  ipcMain.on('app-ready', onAppReady);
  mainWindow.on('closed', () => ipcMain.removeListener('app-ready', onAppReady));
  // Fallback in case the page never reports ready (e.g. script error)
  setTimeout(showWindow, 10000);
  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  //mainWindow.webContents.openDevTools();

  // Open external links (e.g. target="_blank") in the default browser instead of the app
  var isExternal = (url) => url != mainWindow.webContents.getURL()
  mainWindow.webContents.on('will-navigate', (e, url) => {
    if(isExternal(url)) {
      e.preventDefault()
      shell.openExternal(url)
    }
  })
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if(!isExternal(url)) return { action: 'allow' }
    shell.openExternal(url)
    return { action: 'deny' }
  })
};



// Moves the window while the custom title bar from preload.js is dragged.
// -webkit-app-region alone doesn't work reliably for windows created hidden.
let dragTimer = null;
const stopDrag = () => {
  clearInterval(dragTimer);
  dragTimer = null;
};
ipcMain.on('titlebar-drag-start', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win) return;
  stopDrag();
  const start = screen.getCursorScreenPoint();
  if (win.isMaximized()) {
    // Restore and keep the cursor at the same relative spot on the bar
    const maxBounds = win.getBounds();
    const ratio = (start.x - maxBounds.x) / maxBounds.width;
    win.unmaximize();
    const b = win.getBounds();
    win.setBounds({ x: Math.round(start.x - b.width * ratio), y: start.y - 16, width: b.width, height: b.height });
  }
  // Keep width/height fixed, setPosition can grow the window on fractional DPI scaling
  const bounds = win.getBounds();
  const offsetX = start.x - bounds.x;
  const offsetY = start.y - bounds.y;
  dragTimer = setInterval(() => {
    if (win.isDestroyed()) return stopDrag();
    const p = screen.getCursorScreenPoint();
    win.setBounds({ x: p.x - offsetX, y: p.y - offsetY, width: bounds.width, height: bounds.height });
  }, 10);
});
ipcMain.on('titlebar-drag-end', stopDrag);
ipcMain.on('titlebar-toggle-maximize', (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win) return;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  // Protocol-relative URLs in the website ("//host/...") become file://host/... in the app,
  // which Windows tries to open as a network share (\\host\...). That blocks page loading
  // for ~10s, so cancel them right away.
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['file://*/*'] }, (details, callback) => {
    callback({ cancel: new URL(details.url).host !== '' });
  });
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
