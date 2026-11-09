const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getData: () => ipcRenderer.invoke('get-data'),
  saveData: (data) => ipcRenderer.invoke('save-data', data),
  openDataFolder: () => ipcRenderer.invoke('open-data-folder'),
  exportBackup: (data) => ipcRenderer.invoke('export-backup-dialog', data),
  importBackup: () => ipcRenderer.invoke('import-backup-dialog'),
  // Auto-Update APIs
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: () => ipcRenderer.invoke('download-update'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  // Market & B3 Quotes APIs
  fetchMarketQuote: (ticker, range) => ipcRenderer.invoke('fetch-market-quote', ticker, range),
  fetchMarketIndicators: () => ipcRenderer.invoke('fetch-market-indicators'),
  onUpdaterEvent: (channel, callback) => {
    const validChannels = [
      'updater-checking',
      'updater-available',
      'updater-not-available',
      'updater-error',
      'updater-progress',
      'updater-downloaded'
    ];
    if (validChannels.includes(channel)) {
      const subscription = (_event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      return () => ipcRenderer.removeListener(channel, subscription);
    }
    return () => {};
  }
});
