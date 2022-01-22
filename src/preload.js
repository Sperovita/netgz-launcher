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
        setModFolder(){
            return ipcRenderer.invoke('setModFolder');
        },
        getAllModFiles(){
            return ipcRenderer.invoke('getAllModFiles');
        }
    },

);
