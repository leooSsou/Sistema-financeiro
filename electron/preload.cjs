const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getData: () => ipcRenderer.invoke('get-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  openDataFolder: () => ipcRenderer.invoke('open-data-folder'),
  exportBackup: (data) => ipcRenderer.invoke('export-backup-dialog', data),
  importBackup: () => ipcRenderer.invoke('import-backup-dialog')
});
