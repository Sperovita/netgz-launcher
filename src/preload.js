const {
    contextBridge,
    ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
    "app", {
        addContext(name, path) {
            return ipcRenderer.invoke('addContext', name, path);
        },
        deleteContext(contextId){
            return ipcRenderer.invoke('deleteContext', contextId);
        },
        getContexts() {
            return ipcRenderer.invoke('getContexts');
        },
        fetchSelectedContext() {
            return ipcRenderer.invoke('getSetting', 'selectedContext');
        },
        updateSelectedContext(selectedContext) {
            return ipcRenderer.invoke('setSetting', 'selectedContext', selectedContext);
        },
        browseFileSystem() {
            return ipcRenderer.invoke('browseFileSystem');
        },
        updateActiveFileAlias(fileAlias, contextId){
            return ipcRenderer.invoke('setActiveFileAlias', fileAlias, contextId);
        },
        getFiles(contextId) {
            return ipcRenderer.invoke('getFiles', contextId);
        },
        swapFile(currentAlias, contextId, targetFileId) {
            return ipcRenderer.invoke('swapFile', currentAlias, contextId, targetFileId)
        },
        updateSelectedTargetFile(fileId) {
            return ipcRenderer.invoke('setSetting', 'selectedTargetFile', fileId);
        },
        fetchSelectedTargetFile() {
            return ipcRenderer.invoke('getSetting', 'selectedTargetFile');
        }
    },

);
