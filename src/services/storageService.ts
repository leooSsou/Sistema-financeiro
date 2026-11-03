import { AppData, Transaction, ObraEntry, HouseInstallment } from '../types/finance';
import * as XLSX from 'xlsx';

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      getData: () => Promise<AppData>;
      saveData: (data: AppData) => Promise<{ success: boolean; error?: string }>;
      openDataFolder: () => Promise<boolean>;
      exportBackup: (data: AppData) => Promise<{ success?: boolean; path?: string; canceled?: boolean; error?: string }>;
      importBackup: () => Promise<{ success?: boolean; data?: AppData; canceled?: boolean; error?: string }>;
    };
  }
}

const STORAGE_KEY = 'SISTEMA_FINANCEIRO_GABI_DATA';

const defaultInitialData: AppData = {
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
  categoryBudgets: [],
  recurringTransactions: [],
  monthlyNotes: {},
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
    'Outros',
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
  },
};

const normalizeData = (data: AppData): AppData => {
  data.creditCards = data.creditCards || [];
  data.bankAccounts =
    data.bankAccounts && data.bankAccounts.length > 0
      ? data.bankAccounts
      : [
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
        ];
  data.monthlyNotes = data.monthlyNotes || {};
  data.categoryBudgets = data.categoryBudgets || [];
  data.recurringTransactions = data.recurringTransactions || [];
  if (!data.appSettings) {
    data.appSettings = {
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
    };
  } else {
    data.appSettings.userName = data.appSettings.userName || 'Meu Usuário';
    data.appSettings.systemTitle = data.appSettings.systemTitle || 'FinanPro Suite';
    data.appSettings.enabledModules = Object.assign(
      {
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
      data.appSettings.enabledModules || {}
    );
  }
  return data;
};

export const storageService = {
  isElectron: (): boolean => {
    return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
  },

  async loadData(): Promise<AppData> {
    if (this.isElectron() && window.electronAPI?.getData) {
      try {
        const data = await window.electronAPI.getData();
        if (data && data.transactions) {
          return normalizeData(data);
        }
      } catch (err) {
        console.error('Failed to load data from Electron:', err);
      }
    }

    // Fallback to localStorage
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return normalizeData(parsed);
      } catch (e) {
        console.error('Failed to parse localStorage data:', e);
      }
    }
    return defaultInitialData;
  },

  async saveData(data: AppData): Promise<boolean> {
    data.appSettings.lastSaved = new Date().toISOString();

    if (this.isElectron() && window.electronAPI?.saveData) {
      try {
        const res = await window.electronAPI.saveData(data);
        return !!res?.success;
      } catch (err) {
        console.error('Failed to save data via Electron:', err);
        return false;
      }
    }

    // LocalStorage fallback
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
      return false;
    }
  },

  async exportBackup(data: AppData): Promise<void> {
    if (this.isElectron() && window.electronAPI?.exportBackup) {
      await window.electronAPI.exportBackup(data);
      return;
    }

    // Browser download fallback
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Financeiro_Gabi_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async importBackup(): Promise<AppData | null> {
    if (this.isElectron() && window.electronAPI?.importBackup) {
      const res = await window.electronAPI.importBackup();
      if (res?.success && res.data) {
        return res.data;
      }
      return null;
    }

    // Browser file picker fallback
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      input.onchange = async (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const parsed = JSON.parse(event.target?.result as string);
            if (parsed.transactions && parsed.obraEntries && parsed.houseInstallments) {
              resolve(parsed);
            } else {
              alert('Arquivo de backup inválido.');
              resolve(null);
            }
          } catch (err) {
            alert('Erro ao carregar o arquivo JSON.');
            resolve(null);
          }
        };
        reader.readAsText(file);
      };
      input.click();
    });
  },

  async openDataFolder(): Promise<void> {
    if (this.isElectron() && window.electronAPI?.openDataFolder) {
      await window.electronAPI.openDataFolder();
    }
  },

  exportToExcel(data: AppData): void {
    const wb = XLSX.utils.book_new();

    // 1. Sheet Movimentacoes
    const txData = data.transactions.map((t) => ({
      Data: t.date,
      Tipo: t.type === 'entrada' ? 'Entrada (+)' : 'Saída (-)',
      Descrição: t.description,
      'Valor (R$)': t.amount,
      Categoria: t.category,
      'Forma de Pagamento': t.paymentMethod,
      Status: t.status === 'pago' ? 'Pago' : 'Pendente',
      Observações: t.notes || ''
    }));
    const wsTx = XLSX.utils.json_to_sheet(txData);
    XLSX.utils.book_append_sheet(wb, wsTx, 'Movimentações');

    // 2. Sheet Evolução de Obra
    const obraData = data.obraEntries.map((o) => ({
      'Mês de Referência': o.referenceMonth,
      'Valor Cobrado (R$)': o.amount,
      'Evolução Medida (%)': `${o.evolutionPercent}%`,
      'Vencimento': o.dueDate,
      Status: o.status === 'pago' ? 'Pago' : 'Pendente',
      Observações: o.notes || ''
    }));
    const wsObra = XLSX.utils.json_to_sheet(obraData);
    XLSX.utils.book_append_sheet(wb, wsObra, 'Evolução de Obra');

    // 3. Sheet Casa e Parcelamentos
    const instData = data.houseInstallments.map((i) => {
      const remaining = Math.max(0, i.totalInstallments - i.paidInstallments);
      const paidAmount = i.paidInstallments * i.installmentValue;
      const remainingAmount = remaining * i.installmentValue;
      return {
        Item: i.title,
        Categoria: i.category,
        Fornecedor: i.supplier,
        'Valor Total (R$)': i.totalAmount,
        'Valor Parcela (R$)': i.installmentValue,
        'Total Parcelas': i.totalInstallments,
        'Parcelas Pagas': i.paidInstallments,
        'Parcelas Restantes': remaining,
        'Total Pago (R$)': paidAmount,
        'Saldo Devedor (R$)': remainingAmount,
        'Dia Vencimento': i.dueDay,
        'Início': i.startDate,
        Observações: i.notes || ''
      };
    });
    const wsInst = XLSX.utils.json_to_sheet(instData);
    XLSX.utils.book_append_sheet(wb, wsInst, 'Parcelamentos da Casa');

    // 4. Sheet Contas Bancárias
    if (data.bankAccounts && data.bankAccounts.length > 0) {
      const accData = data.bankAccounts.map((a) => ({
        Conta: a.name,
        Tipo: a.type,
        'Saldo Inicial (R$)': a.initialBalance,
        Agência: a.agency || '',
        'Número da Conta': a.accountNumber || '',
      }));
      const wsAcc = XLSX.utils.json_to_sheet(accData);
      XLSX.utils.book_append_sheet(wb, wsAcc, 'Contas Bancárias');
    }

    // 5. Sheet Anotações Mensais
    if (data.monthlyNotes && Object.keys(data.monthlyNotes).length > 0) {
      const notesData = Object.entries(data.monthlyNotes).map(([month, note]) => ({
        'Mês': month,
        'Anotações e Observações': note
      }));
      const wsNotes = XLSX.utils.json_to_sheet(notesData);
      XLSX.utils.book_append_sheet(wb, wsNotes, 'Anotações Mensais');
    }

    XLSX.writeFile(wb, `Controle_Financeiro_Gabi_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
};
