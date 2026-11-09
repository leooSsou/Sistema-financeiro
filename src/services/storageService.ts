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
      getAppVersion?: () => Promise<string>;
      checkForUpdates?: () => Promise<{ success?: boolean; dev?: boolean; result?: any; error?: string; message?: string }>;
      downloadUpdate?: () => Promise<{ success?: boolean; error?: string }>;
      installUpdate?: () => Promise<void>;
      fetchMarketQuote?: (ticker: string, range?: string) => Promise<any>;
      fetchMarketIndicators?: () => Promise<any>;
      onUpdaterEvent?: (
        channel: string,
        callback: (data?: any) => void
      ) => () => void;
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
  vehicles: [],
  vehicleExpenses: [],
  amortizationSimulations: [],
  investments: [],
  investmentTransactions: [],
  goals: [],
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
      amortizacao: true,
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
  data.vehicles = data.vehicles || [];
  data.vehicleExpenses = data.vehicleExpenses || [];
  data.amortizationSimulations = data.amortizationSimulations || [];
  data.investments = data.investments || [];
  data.investmentTransactions = data.investmentTransactions || [];
  data.goals = data.goals || [];
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
        amortizacao: true,
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
        amortizacao: true,
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

    // 6. Sheet Veículos
    if (data.vehicles && data.vehicles.length > 0) {
      const vehData = data.vehicles.map((v) => ({
        Nome: v.name,
        Marca: v.brand,
        Modelo: v.model,
        Ano: v.year,
        Placa: v.plate || '',
        'KM Atual': v.currentKm,
        'Vencimento Seguro': v.insuranceDueDate || '',
        'Vencimento Licenciamento': v.licenseDueDate || ''
      }));
      const wsVeh = XLSX.utils.json_to_sheet(vehData);
      XLSX.utils.book_append_sheet(wb, wsVeh, 'Veículos');
    }

    // 7. Sheet Despesas de Veículos
    if (data.vehicleExpenses && data.vehicleExpenses.length > 0) {
      const vExpData = data.vehicleExpenses.map((e) => {
        const v = data.vehicles?.find((veh) => veh.id === e.vehicleId);
        return {
          Data: e.date,
          Veículo: v ? v.name : 'Desconhecido',
          Tipo: e.type,
          'Valor (R$)': e.amount,
          Odômetro: e.currentKm || '',
          Litros: e.liters || '',
          'Preço/L': e.pricePerLiter || '',
          'Serviço / Manutenção': e.serviceDescription || '',
          Oficina: e.workshop || '',
          Observações: e.notes || ''
        };
      });
      const wsVExp = XLSX.utils.json_to_sheet(vExpData);
      XLSX.utils.book_append_sheet(wb, wsVExp, 'Despesas Veiculares');
    }

    // 8. Sheet Simulações de Amortização
    if (data.amortizationSimulations && data.amortizationSimulations.length > 0) {
      const simData = data.amortizationSimulations.map((s) => ({
        Título: s.title,
        Sistema: s.financingType,
        'Valor Financiado (R$)': s.financedAmount,
        'Taxa Anual (%)': s.annualInterestRate,
        'Prazo Original (Meses)': s.totalMonths,
        'Aporte Extra Mensal (R$)': s.monthlyExtraAmortization,
        Estratégia: s.amortizationStrategy
      }));
      const wsSim = XLSX.utils.json_to_sheet(simData);
      XLSX.utils.book_append_sheet(wb, wsSim, 'Simulações Amortização');
    }

    // 9. Sheet Investimentos
    if (data.investments && data.investments.length > 0) {
      const invData = data.investments.map((a) => ({
        Nome: a.name,
        Ticker: a.ticker || '',
        Tipo: a.type,
        Instituição: a.institution,
        'Total Aportado (R$)': a.totalInvested,
        'Valor Atual (R$)': a.currentValue,
        'Lucro/Prejuízo (R$)': a.currentValue - a.totalInvested,
        'Rentabilidade Estimada (%)': a.annualExpectedReturn || ''
      }));
      const wsInv = XLSX.utils.json_to_sheet(invData);
      XLSX.utils.book_append_sheet(wb, wsInv, 'Investimentos');
    }

    // 10. Sheet Metas Financeiras
    if (data.goals && data.goals.length > 0) {
      const goalsData = data.goals.map((g) => ({
        Meta: g.title,
        Categoria: g.category,
        'Valor Alvo (R$)': g.targetAmount,
        'Valor Acumulado (R$)': g.currentAmount,
        'Progresso (%)': `${((g.currentAmount / g.targetAmount) * 100).toFixed(1)}%`,
        'Data Limite': g.deadlineDate
      }));
      const wsGoals = XLSX.utils.json_to_sheet(goalsData);
      XLSX.utils.book_append_sheet(wb, wsGoals, 'Metas Financeiras');
    }

    const titlePrefix = data.appSettings?.systemTitle?.replace(/\s+/g, '_') || 'FinanPro';
    XLSX.writeFile(wb, `${titlePrefix}_Backup_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }
};
