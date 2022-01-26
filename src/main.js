const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const dbal = require('./dbal');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require('fs');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const runtimeArgs =  process.argv.slice(2) || [];
let debugMode = false;
if(runtimeArgs.includes('debug')){
  debugMode = true;
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: debugMode ? 1200 : 600,
    height: 800,
    autoHideMenuBar: true,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#001f27',
      symbolColor: '#e9e9e9'
    },
    icon: `${__dirname}/netgz.ico`,
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
  if(debugMode){
    mainWindow.webContents.openDevTools();
  }
  
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

// Refactor: Hacky, need to learn better ways of parsing binaries
function parseTextFromSave(fileString, name){
  const searchTerm = `tEXt${name}`;
  const indexOfTerm = fileString.indexOf(searchTerm);
  if(indexOfTerm === -1){
    return '';
  }
  let crawlIndex = searchTerm.length + indexOfTerm + 1;
  let result = '';
  while(fileString.charCodeAt(crawlIndex) <= 127){
    result += fileString.charAt(crawlIndex);
    crawlIndex++;
  }
  const resultBleedTextIndex = result.indexOf('tEXt');
  if(resultBleedTextIndex !== -1){
    result = result.substring(0, resultBleedTextIndex);
  }
  return result;
}

function genCommand(cc, modPath = '', savePath = ''){ 
  let command = `gzdoom`;

  if(cc.host_join === 'host'){
    command += ` -host ${cc.players} ${cc.private ? '-private' : ''} -netmode ${cc.netmode}`;
    if(cc.mode !== 'coop'){
      command += ` -${cc.mode}`;
    }
  }else if(cc.host_join === 'join'){
    command += ` -join ${cc.ip}`;
  }

  if(cc.host_join === 'host' || cc.host_join === 'single_player'){
    if(cc.skill > -1){
      command += ` -skill ${cc.skill}`
    }
    if(cc.map){
      command += ` -warp ${cc.map}`;
    }
  }

  if(cc.port){
    command += ` -port ${cc.port}`;
  }

  if(cc.mod_files.length){
    command += ` -file`;
    cc.mod_files.forEach(file => {
      command += ` ${modPath}${file}`;
    })
  }

  if(cc.save_file){
    command += ` -loadgame ${savePath}${cc.save_file}`;
  }

  command += ` ${cc.additional_commands}`;

  return command;
}

ipcMain.handle('addConfig', (event, config) => {
  return dbal.addConfig(config);
})
ipcMain.handle('deleteConfig', (event, id) => {
  return dbal.deleteConfig(id);
})
ipcMain.handle('updateConfig', (event, config) => {
  return dbal.updateConfig(config);
})
ipcMain.handle('getSetting', (event, name) => {
  return dbal.getSetting(name);
})
ipcMain.handle('getAllConfig', (event) => {
  return dbal.getAllConfigs();
})
ipcMain.handle('getAllModFiles', (event) => {
  return new Promise((resolve, reject) => {
    dbal.getSetting('mod_folder')
    .then(folder => {
      if(folder){
        resolve(fs.readdirSync(folder));
      }else{
        resolve([]);
      }
    })
    .catch(error => {
      reject(error);
    })
  })
})
ipcMain.handle('getAllSaveFiles', (event) => {
  return new Promise((resolve, reject) => {
    dbal.getSetting('gzdoom_folder')
    .then(gzdoomPath => {
      
      if(gzdoomPath){
        const savePath = `${gzdoomPath}${path.sep}Save`
        const files = fs.readdirSync(savePath);

        const filesWithMeta = files.map(file => {
          const saveFile = `${savePath}${path.sep}${file}`;
          const stats = fs.statSync(saveFile);
          const buffer = fs.readFileSync(saveFile);
          const fileString = buffer.toString('utf-8');
          const saveName = parseTextFromSave(fileString, 'Title');
          const currentMap = parseTextFromSave(fileString, 'Current Map');
          return {
            name: file, 
            saveName,
            currentMap,
            modified: stats.mtime, 
            created: stats.ctime
          };
        })
        resolve(filesWithMeta);
      }else{
        resolve([]);
      }
    })
    .catch(error => {
      reject(error);
    })
  })
})

// Refactor: can merge the two set folders
ipcMain.handle('setGZDoomFolder', (event) => { 
  return new Promise((resolve, reject) => {
    dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    .then(choice => {
      if(choice.canceled || !choice.filePaths.length){
        reject('Cancelled');
      }else{
        const choosenPath = choice.filePaths[0];
        dbal.setSetting('gzdoom_folder', choosenPath)
        .then(res => { resolve(choosenPath) })
        .catch(err => { reject(err) });
      }
    })
  })
})
ipcMain.handle('setModFolder', (event) => { 
  return new Promise((resolve, reject) => {
    dialog.showOpenDialog({
      properties: ['openDirectory']
    })
    .then(choice => {
      if(choice.canceled || !choice.filePaths.length){
        reject('Cancelled');
      }else{
        const choosenPath = choice.filePaths[0];
        dbal.setSetting('mod_folder', choosenPath)
        .then(res => { resolve(choosenPath) })
        .catch(err => { reject(err) });
      }
    })
  })
})

ipcMain.handle('launch', async (event, config) => {
  try{
    const gzdoomFolder = await dbal.getSetting('gzdoom_folder');
    let modPath = '';
    if(config.mod_files.length){
      const modFolder = await dbal.getSetting('mod_folder');
      if(modFolder != gzdoomFolder){
        modPath = `${modFolder}${path.sep}`;
      }
    }
    let savePath = '';
    if(config.save_file){
      savePath = `${gzdoomFolder}${path.sep}Save${path.sep}`
    }

    const command = `${gzdoomFolder}${path.sep}${genCommand(config, modPath, savePath)}`;
    console.log(`Running Command: ${command}`);
    const { stdout, stderr } = await exec(command);
    return true;
  }catch(error){
    throw error;
  }

  
})
