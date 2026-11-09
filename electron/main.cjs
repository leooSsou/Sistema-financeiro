const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
let mainWindow = null;

// Configure autoUpdater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

const DATA_FILE_PATH = path.join(app.getPath('userData'), 'sistema_gabi_data.json');
const BACKUP_FILE_PATH = path.join(app.getPath('userData'), 'sistema_gabi_data.bak.json');

// Default initial database schema (Clean / Ready for Production)
const defaultData = {
  transactions: [],
  obraEntries: [],
  houseInstallments: [],
  creditCards: [],
  bankAccounts: [
    {
      id: 'acc-default-1',
      name: 'Conta Principal',
      type: 'corrente',
      initialBalance: 0,
      color: '#3b82f6',
    },
    {
      id: 'acc-default-2',
      name: 'Carteira / Dinheiro',
      type: 'carteira',
      initialBalance: 0,
      color: '#10b981',
    },
  ],
  monthlyNotes: {},
  vehicles: [],
  vehicleExpenses: [],
  amortizationSimulations: [],
  categories: [
    'Salário / Renda',
    'Renda Extra',
    'Alimentação',
    'Habitação & Moradia',
    'Evolução de Obra',
    'Casa & Reforma',
    'Transporte & Combustível',
    'Saúde & Cuidados',
    'Lazer & Entretenimento',
    'Educação',
    'Outros'
  ],
  appSettings: {
    userName: 'Meu Usuário',
    systemTitle: 'FinanPro Suite',
    currency: 'BRL',
    theme: 'light',
    lastSaved: new Date().toISOString(),
    enabledModules: {
      dashboard: true,
      movimentacoes: true,
      contas: true,
      cartoes: true,
      obra: true,
      casa: true,
      veiculos: true,
      investimentos: true,
      metas: true,
      orcamento: true,
      visaoAnual: true,
    },
  }
};

function readLocalData() {
  try {
    if (!fs.existsSync(DATA_FILE_PATH)) {
      // First run: save default dataset
      fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
      return defaultData;
    }
    const raw = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading data file:', err);
    // Try to load backup if main file is corrupted
    if (fs.existsSync(BACKUP_FILE_PATH)) {
      try {
        const rawBak = fs.readFileSync(BACKUP_FILE_PATH, 'utf-8');
        return JSON.parse(rawBak);
      } catch (bakErr) {
        console.error('Error reading backup file:', bakErr);
      }
    }
    return defaultData;
  }
}

function writeLocalData(data) {
  try {
    // Keep a backup before writing
    if (fs.existsSync(DATA_FILE_PATH)) {
      try {
        fs.copyFileSync(DATA_FILE_PATH, BACKUP_FILE_PATH);
      } catch (bakErr) {
        console.warn('Could not create backup:', bakErr);
      }
    }
    data.appSettings = data.appSettings || {};
    data.appSettings.lastSaved = new Date().toISOString();
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  } catch (err) {
    console.error('Error writing data file:', err);
    return { success: false, error: err.message };
  }
}

function createWindow() {
  const iconPath = path.join(__dirname, '../build/icon.png');

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1024,
    minHeight: 680,
    title: 'FinanPro Suite - Gestão Financeira',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#f8fafc',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    autoHideMenuBar: true,
  });

  const distIndexPath = path.join(__dirname, '../dist/index.html');
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else if (fs.existsSync(distIndexPath)) {
    mainWindow.loadFile(distIndexPath);
  } else {
    mainWindow.loadURL('http://localhost:5173');
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Check for updates after window loads
  mainWindow.webContents.once('did-finish-load', () => {
    if (!isDev) {
      setTimeout(() => {
        autoUpdater.checkForUpdates().catch((err) => {
          console.warn('[AutoUpdater] Erro ao verificar atualizações:', err.message);
        });
      }, 3000);
    }
  });
}

function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater-checking');
    }
  });

  autoUpdater.on('update-available', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater-available', {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: info.releaseNotes,
      });
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater-not-available', info);
    }
  });

  autoUpdater.on('error', (err) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater-error', err ? err.message : 'Erro na atualização');
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater-progress', {
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
        bytesPerSecond: progressObj.bytesPerSecond,
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('updater-downloaded', {
        version: info.version,
      });
    }
  });
}

app.whenReady().then(() => {
  setupAutoUpdater();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for safe communication between renderer and main
ipcMain.handle('get-data', async () => {
  return readLocalData();
});

ipcMain.handle('save-data', async (_event, data) => {
  return writeLocalData(data);
});

ipcMain.handle('open-data-folder', async () => {
  shell.openPath(app.getPath('userData'));
  return true;
});

ipcMain.handle('export-backup-dialog', async (_event, data) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Exportar Backup Financeiro',
    defaultPath: `Backup_Financeiro_Gabi_${new Date().toISOString().slice(0, 10)}.json`,
    filters: [{ name: 'Arquivo de Backup JSON', extensions: ['json'] }]
  });

  if (!result.canceled && result.filePath) {
    try {
      fs.writeFileSync(result.filePath, JSON.stringify(data, null, 2), 'utf-8');
      return { success: true, path: result.filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
  return { canceled: true };
});

ipcMain.handle('import-backup-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Importar Backup Financeiro',
    properties: ['openFile'],
    filters: [{ name: 'Arquivo de Backup JSON', extensions: ['json'] }]
  });

  if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
    try {
      const content = fs.readFileSync(result.filePaths[0], 'utf-8');
      const parsed = JSON.parse(content);
      // Validate structure basics
      if (parsed.transactions && parsed.obraEntries && parsed.houseInstallments) {
        writeLocalData(parsed);
        return { success: true, data: parsed };
      } else {
        return { success: false, error: 'O arquivo selecionado não tem o formato válido do sistema.' };
      }
    } catch (err) {
      return { success: false, error: 'Erro ao ler arquivo: ' + err.message };
    }
  }
  return { canceled: true };
});

// Auto-Updater IPC Handlers
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('check-for-updates', async () => {
  if (isDev) {
    return { dev: true, message: 'Modo de desenvolvimento. Atualizações automáticas disponíveis no app empacotado.' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('download-update', async () => {
  try {
    await autoUpdater.downloadUpdate();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('install-update', () => {
  autoUpdater.quitAndInstall(false, true);
});
