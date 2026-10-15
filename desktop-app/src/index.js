const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
  
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    icon: path.join(__dirname, "/icons/512x512.png"),
    width: 1200,
    height: 700,
    minWidth: 475,
    minHeight: 450,
    autoHideMenuBar: true,
    titleBarOverlay: {
      color: '#2f3241',
      symbolColor: '#7669e7'
    },
    backgroundColor: '#000000',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js')
    }
  });
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

  var handleRedirect = (e, url) => {
    if(url != mainWindow.webContents.getURL()) {
      e.preventDefault()
      require('electron').shell.openExternal(url)
    }
  }
  mainWindow.webContents.on('will-navigate', handleRedirect)
  mainWindow.webContents.on('new-window', handleRedirect)
};



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

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
