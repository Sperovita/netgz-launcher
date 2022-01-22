const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const dbal = require('./dbal');
const os = require('os');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true, 
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
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

ipcMain.handle('addConfig', (event, config) => {
  return dbal.addConfig(config);
})
ipcMain.handle('deleteConfig', (event, id) => {
  return dbal.deleteConfig(id);
})
ipcMain.handle('updateConfig', (event, config) => {
  return dbal.updateConfig(config);
})
ipcMain.handle('getAllConfig', (event) => {
  return dbal.getAllConfigs();
})
