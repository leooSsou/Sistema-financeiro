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
  investments: [],
  investmentTransactions: [],
  goals: [],
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

// Market & B3 Quotes IPC Handlers
ipcMain.handle('fetch-market-quote', async (_event, ticker, range = '1mo') => {
  if (!ticker || typeof ticker !== 'string') return { error: 'Ticker inválido' };

  let symbol = ticker.trim().toUpperCase();
  if (!symbol.includes('.')) {
    symbol = `${symbol}.SA`;
  }

  return new Promise((resolve) => {
    const https = require('https');
    const options = {
      hostname: 'query1.finance.yahoo.com',
      path: `/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${encodeURIComponent(range)}`,
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      timeout: 8000,
    };

    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const result = parsed?.chart?.result?.[0];
          if (!result) {
            return resolve({ error: 'Ativo não encontrado ou sem dados no momento' });
          }

          const meta = result.meta || {};
          const timestamps = result.timestamp || [];
          const quote = result.indicators?.quote?.[0] || {};
          const closes = quote.close || [];
          const volumes = quote.volume || [];

          const history = [];
          for (let i = 0; i < timestamps.length; i++) {
            if (closes[i] !== null && closes[i] !== undefined) {
              const d = new Date(timestamps[i] * 1000);
              const dateStr = d.toISOString().slice(0, 10);
              history.push({
                date: dateStr,
                price: Number(closes[i].toFixed(2)),
                volume: volumes[i] || 0,
              });
            }
          }

          const price = meta.regularMarketPrice || (history.length > 0 ? history[history.length - 1].price : 0);
          const changePercent = meta.regularMarketChangePercent !== undefined
            ? Number(meta.regularMarketChangePercent.toFixed(2))
            : meta.chartPreviousClose && price
            ? Number((((price - meta.chartPreviousClose) / meta.chartPreviousClose) * 100).toFixed(2))
            : 0;

          const changeAmount = meta.chartPreviousClose && price
            ? Number((price - meta.chartPreviousClose).toFixed(2))
            : 0;

          resolve({
            success: true,
            symbol: meta.symbol ? meta.symbol.replace('.SA', '') : ticker.toUpperCase(),
            longName: meta.longName || meta.shortName || ticker.toUpperCase(),
            currency: meta.currency || 'BRL',
            price: Number(price.toFixed(2)),
            change: changeAmount,
            changePercent,
            dayHigh: meta.regularMarketDayHigh ? Number(meta.regularMarketDayHigh.toFixed(2)) : undefined,
            dayLow: meta.regularMarketDayLow ? Number(meta.regularMarketDayLow.toFixed(2)) : undefined,
            fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh ? Number(meta.fiftyTwoWeekHigh.toFixed(2)) : undefined,
            fiftyTwoWeekLow: meta.fiftyTwoWeekLow ? Number(meta.fiftyTwoWeekLow.toFixed(2)) : undefined,
            volume: meta.regularMarketVolume || 0,
            history,
          });
        } catch (parseErr) {
          resolve({ error: 'Erro ao interpretar resposta da B3: ' + parseErr.message });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ error: 'Falha de conexão com a B3: ' + err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ error: 'Tempo limite ao consultar cotação da B3' });
    });
  });
});

ipcMain.handle('fetch-market-indicators', async () => {
  return new Promise((resolve) => {
    const https = require('https');
    const options = {
      hostname: 'economia.awesomeapi.com.br',
      path: '/last/USD-BRL,BTC-BRL',
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 6000,
    };

    const req = https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            success: true,
            dolar: parsed.USDBRL ? Number(Number(parsed.USDBRL.bid).toFixed(2)) : 5.50,
            dolarChange: parsed.USDBRL ? Number(Number(parsed.USDBRL.pctChange).toFixed(2)) : 0,
            bitcoin: parsed.BTCBRL ? Number(Number(parsed.BTCBRL.bid).toFixed(0)) : 410000,
            bitcoinChange: parsed.BTCBRL ? Number(Number(parsed.BTCBRL.pctChange).toFixed(2)) : 0,
            selic: 11.25,
            cdi: 11.15,
            ipca: 4.10,
            poupanca: 6.17,
          });
        } catch {
          resolve({
            success: true,
            dolar: 5.50,
            dolarChange: 0.1,
            bitcoin: 410000,
            bitcoinChange: -1.2,
            selic: 11.25,
            cdi: 11.15,
            ipca: 4.10,
            poupanca: 6.17,
          });
        }
      });
    });

    req.on('error', () => {
      resolve({
        success: true,
        dolar: 5.50,
        dolarChange: 0,
        bitcoin: 410000,
        bitcoinChange: 0,
        selic: 11.25,
        cdi: 11.15,
        ipca: 4.10,
        poupanca: 6.17,
      });
    });
  });
});
