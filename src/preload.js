const {
    contextBridge,
    ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
    "app", {
        addConfig(config) {
            return ipcRenderer.invoke('addConfig', config);
        },
        deleteConfig(id) {
            return ipcRenderer.invoke('deleteConfig', id);
        },
        updateConfig(config) {
            return ipcRenderer.invoke('updateConfig', config);
        },
        getAllConfigs() {
            return ipcRenderer.invoke('getAllConfig');
        },
        setGZDoomFolder(){
            return ipcRenderer.invoke('setGZDoomFolder');
        },
        setModFolder(){
            return ipcRenderer.invoke('setModFolder');
        },
        getAllModFiles(){
            return ipcRenderer.invoke('getAllModFiles');
        },
        getAllSaveFiles(){
            return ipcRenderer.invoke('getAllSaveFiles');
        },
        getSetting(name){
            return ipcRenderer.invoke('getSetting', name);
        },
        launch(config){
            return ipcRenderer.invoke('launch', config);
        }
    },

);
