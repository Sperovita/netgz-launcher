const {
    contextBridge,
    ipcRenderer
} = require("electron");

contextBridge.exposeInMainWorld(
    "app", {
        test(payload) {
            return ipcRenderer.invoke('test', payload);
        },
    },

);
