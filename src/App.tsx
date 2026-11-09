import React, { useState, useEffect, useCallback } from 'react';
import { AppData, Transaction, ObraEntry, HouseInstallment, CreditCardItem, BankAccount, PaymentStatus, CategoryBudget, RecurringTransaction, Vehicle, VehicleExpense, AmortizationSimulation, InvestmentAsset, InvestmentTransaction, FinancialGoal } from './types/finance';
import { storageService } from './services/storageService';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Movimentacoes } from './components/Movimentacoes';
import { EvolucaoObra } from './components/EvolucaoObra';
import { CasaParcelamentos } from './components/CasaParcelamentos';
import { ContasBancarias } from './components/ContasBancarias';
import { OrcamentoTeto } from './components/OrcamentoTeto';
import { Veiculos } from './components/Veiculos';
import { SimuladorAmortizacao } from './components/SimuladorAmortizacao';
import { Investimentos } from './components/Investimentos';
import { MetasFinanceiras } from './components/MetasFinanceiras';
import { VisaoAnual } from './components/VisaoAnual';
import { Configuracoes } from './components/Configuracoes';
import { TransactionModal } from './components/TransactionModal';
import { ObraModal } from './components/ObraModal';
import { InstallmentModal } from './components/InstallmentModal';
import { UpdateNotification } from './components/UpdateNotification';
import { UpdateModal } from './components/UpdateModal';
import { checkGitHubRelease, UpdateInfo, CURRENT_APP_VERSION } from './services/updateService';
import { Sparkles } from 'lucide-react';

export function App() {
  const [data, setData] = useState<AppData | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSaved, setIsSaved] = useState<boolean>(true);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<Transaction | null>(null);

  const [isObraModalOpen, setIsObraModalOpen] = useState(false);
  const [obraToEdit, setObraToEdit] = useState<ObraEntry | null>(null);

  const [isInstModalOpen, setIsInstModalOpen] = useState(false);
  const [instToEdit, setInstToEdit] = useState<HouseInstallment | null>(null);

  // Auto-Update State
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isUpdateBannerDismissed, setIsUpdateBannerDismissed] = useState(false);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  // Check for updates function
  const handleCheckForUpdates = useCallback(async (manual = false) => {
    setIsCheckingUpdates(true);
    try {
      // 1. Check GitHub Releases API
      const release = await checkGitHubRelease(CURRENT_APP_VERSION);
      if (release) {
        setUpdateInfo(release);
        setIsUpdateBannerDismissed(false);
        if (manual) {
          setIsUpdateModalOpen(true);
        }
        return;
      }

      // 2. Check Electron autoUpdater if available
      if (window.electronAPI?.checkForUpdates) {
        const res = await window.electronAPI.checkForUpdates();
        if (res?.error && manual) {
          alert('Erro ao verificar atualizações: ' + res.error);
        } else if (res?.dev && manual) {
          alert(`Você está no modo de desenvolvimento local.\nVersão atual: v${CURRENT_APP_VERSION}.\nNenhuma nova versão publicada no GitHub.`);
        } else if (manual) {
          alert(`✨ O ${data?.appSettings?.systemTitle || 'FinanPro Suite'} já está na versão mais recente (v${CURRENT_APP_VERSION})!`);
        }
      } else if (manual) {
        alert(`✨ O ${data?.appSettings?.systemTitle || 'FinanPro Suite'} já está na versão mais recente (v${CURRENT_APP_VERSION})!`);
      }
    } catch (err: any) {
      if (manual) alert('Erro ao verificar atualizações: ' + (err.message || err));
    } finally {
      setIsCheckingUpdates(false);
    }
  }, [data?.appSettings?.systemTitle]);

  // Initial update check & event listeners
  useEffect(() => {
    handleCheckForUpdates(false);

    if (window.electronAPI?.onUpdaterEvent) {
      const unsub = window.electronAPI.onUpdaterEvent('updater-available', (info: any) => {
        if (info?.version) {
          setUpdateInfo({
            version: info.version.startsWith('v') ? info.version : `v${info.version}`,
            releaseNotes: info.releaseNotes,
            isPackagedElectron: true,
          });
          setIsUpdateBannerDismissed(false);
        }
      });
      return () => unsub?.();
    }
  }, [handleCheckForUpdates]);

  // Load initial data
  useEffect(() => {
    async function init() {
      const loaded = await storageService.loadData();
      setData(loaded);
    }
    init();
  }, []);

  // Persistence helper
  const persist = useCallback(async (updated: AppData) => {
    setData(updated);
    setIsSaved(false);
    await storageService.saveData(updated);
    setIsSaved(true);
  }, []);

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 font-medium">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        Carregando dados financeiros locais...
      </div>
    );
  }

  // Transaction Handlers with Full Cross-Module Sync
  const handleSaveTransaction = (transactionOrList: Transaction | Transaction[]) => {
    if (!data) return;
    const newItems = Array.isArray(transactionOrList) ? transactionOrList : [transactionOrList];
    let updatedTxList = [...data.transactions];
    let updatedExpenses = [...(data.vehicleExpenses || [])];
    let updatedVehicles = [...(data.vehicles || [])];

    newItems.forEach((item) => {
      const existingIndex = updatedTxList.findIndex((t) => t.id === item.id);
      if (existingIndex >= 0) {
        updatedTxList[existingIndex] = item;
      } else {
        updatedTxList = [item, ...updatedTxList];
      }

      // INTEGRATION: If transaction is linked to a vehicle, sync with VehicleExpenses & Odometer
      if (item.vehicleId && item.type === 'saida') {
        const expId = `vexp-tx-${item.id}`;
        const existingExpIndex = updatedExpenses.findIndex((e) => e.id === expId || e.id === item.id);
        const newVehicleExpense: VehicleExpense = {
          id: expId,
          vehicleId: item.vehicleId,
          type: item.vehicleExpenseType || 'abastecimento',
          date: item.date,
          amount: item.amount,
          currentKm: item.vehicleKm,
          liters: item.vehicleLiters,
          pricePerLiter: item.vehiclePricePerLiter,
          serviceDescription: item.description,
          notes: item.notes,
        };

        if (existingExpIndex >= 0) {
          updatedExpenses[existingExpIndex] = newVehicleExpense;
        } else {
          updatedExpenses = [newVehicleExpense, ...updatedExpenses];
        }

        // Auto-update vehicle odometer if km is greater
        if (item.vehicleKm) {
          const vIdx = updatedVehicles.findIndex((v) => v.id === item.vehicleId);
          if (vIdx >= 0 && item.vehicleKm > (updatedVehicles[vIdx].currentKm || 0)) {
            updatedVehicles[vIdx] = {
              ...updatedVehicles[vIdx],
              currentKm: item.vehicleKm,
            };
          }
        }
      }
    });

    persist({
      ...data,
      transactions: updatedTxList,
      vehicleExpenses: updatedExpenses,
      vehicles: updatedVehicles,
    });
  };

  const handleDeleteTransaction = (id: string) => {
    if (!data) return;
    if (!window.confirm('Tem certeza que deseja excluir esta movimentação?')) return;
    const updatedTxList = data.transactions.filter((t) => t.id !== id);
    // Also remove matching vehicle expense if created via this transaction
    const updatedExpenses = (data.vehicleExpenses || []).filter(
      (e) => e.id !== `vexp-tx-${id}` && e.id !== id
    );
    persist({
      ...data,
      transactions: updatedTxList,
      vehicleExpenses: updatedExpenses,
    });
  };

  const handleToggleTxStatus = (id: string) => {
    const updatedTxList: Transaction[] = data.transactions.map((t) => {
      if (t.id === id) {
        return {
          ...t,
          status: (t.status === 'pago' ? 'pendente' : 'pago') as PaymentStatus,
        };
      }
      return t;
    });
    persist({
      ...data,
      transactions: updatedTxList,
    });
  };

  // Obra Handlers with Cross-Module Sync
  const handleSaveObra = (entry: ObraEntry) => {
    const existingIndex = data.obraEntries.findIndex((e) => e.id === entry.id);
    let updatedList: ObraEntry[];

    if (existingIndex >= 0) {
      updatedList = [...data.obraEntries];
      updatedList[existingIndex] = entry;
    } else {
      updatedList = [entry, ...data.obraEntries];
    }

    // SYNC: Create or update matching transaction in Movimentações
    const txId = `tx-obra-${entry.id}`;
    let updatedTxList = [...data.transactions];
    const existingTxIndex = updatedTxList.findIndex((t) => t.id === txId);

    const obraTx: Transaction = {
      id: txId,
      type: 'saida',
      description: `Taxa de Obra Caixa - Medição ${entry.evolutionPercent}% (${entry.referenceMonth})`,
      amount: entry.amount,
      date: entry.dueDate || new Date().toISOString().slice(0, 10),
      category: 'Evolução de Obra',
      paymentMethod: 'Boleto',
      bankAccountId: data.bankAccounts?.[0]?.id,
      status: entry.status,
      notes: entry.notes || `Referente à medição física do mês ${entry.referenceMonth}`,
    };

    if (existingTxIndex >= 0) {
      updatedTxList[existingTxIndex] = obraTx;
    } else {
      updatedTxList = [obraTx, ...updatedTxList];
    }

    persist({
      ...data,
      obraEntries: updatedList,
      transactions: updatedTxList,
    });
  };

  const handleDeleteObra = (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro de obra?')) return;
    const updatedList = data.obraEntries.filter((e) => e.id !== id);
    const updatedTxList = data.transactions.filter((t) => t.id !== `tx-obra-${id}`);
    persist({
      ...data,
      obraEntries: updatedList,
      transactions: updatedTxList,
    });
  };

  const handleToggleObraStatus = (id: string) => {
    let nextStatus: PaymentStatus = 'pago';
    const updatedList: ObraEntry[] = data.obraEntries.map((e) => {
      if (e.id === id) {
        nextStatus = (e.status === 'pago' ? 'pendente' : 'pago') as PaymentStatus;
        return {
          ...e,
          status: nextStatus,
        };
      }
      return e;
    });

    const updatedTxList: Transaction[] = data.transactions.map((t) => {
      if (t.id === `tx-obra-${id}`) {
        return { ...t, status: nextStatus };
      }
      return t;
    });

    persist({
      ...data,
      obraEntries: updatedList,
      transactions: updatedTxList,
    });
  };

  // House Installment Handlers
  const handleSaveInstallment = (item: HouseInstallment) => {
    const existingIndex = data.houseInstallments.findIndex((i) => i.id === item.id);
    let updatedList: HouseInstallment[];

    if (existingIndex >= 0) {
      updatedList = [...data.houseInstallments];
      updatedList[existingIndex] = item;
    } else {
      updatedList = [item, ...data.houseInstallments];
    }

    persist({
      ...data,
      houseInstallments: updatedList,
    });
  };

  const handleDeleteInstallment = (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este financiamento?')) return;
    const updatedList = data.houseInstallments.filter((i) => i.id !== id);
    persist({
      ...data,
      houseInstallments: updatedList,
    });
  };

  const handlePayNextInstallment = (item: HouseInstallment, registerExpense: boolean) => {
    const newPaidCount = item.paidInstallments + 1;
    const updatedInstallments = data.houseInstallments.map((i) => {
      if (i.id === item.id) {
        return { ...i, paidInstallments: newPaidCount };
      }
      return i;
    });

    let updatedTransactions = data.transactions;
    if (registerExpense) {
      const newTx: Transaction = {
        id: `tx-inst-${item.id}-${newPaidCount}`,
        date: new Date().toISOString().slice(0, 10),
        description: `Parcela ${newPaidCount}/${item.totalInstallments} - ${item.title}`,
        type: 'saida',
        amount: item.installmentValue,
        category: 'Casa & Reforma',
        paymentMethod: 'Boleto',
        bankAccountId: data.bankAccounts?.[0]?.id,
        status: 'pago',
        notes: `Abatimento automático de parcela (${item.supplier || item.category})`,
      };
      updatedTransactions = [newTx, ...data.transactions];
    }

    persist({
      ...data,
      houseInstallments: updatedInstallments,
      transactions: updatedTransactions,
    });
  };

  const handleUndoInstallment = (item: HouseInstallment) => {
    if (item.paidInstallments <= 0) return;
    const targetCount = item.paidInstallments;
    const updatedInstallments = data.houseInstallments.map((i) => {
      if (i.id === item.id) {
        return { ...i, paidInstallments: Math.max(0, i.paidInstallments - 1) };
      }
      return i;
    });

    // Remove matching transaction
    const updatedTransactions = data.transactions.filter(
      (t) => t.id !== `tx-inst-${item.id}-${targetCount}`
    );

    persist({
      ...data,
      houseInstallments: updatedInstallments,
      transactions: updatedTransactions,
    });
  };

  // Categories
  const handleAddCategory = (cat: string) => {
    if (data.categories.includes(cat)) return;
    persist({
      ...data,
      categories: [...data.categories, cat],
    });
  };

  const handleDeleteCategory = (cat: string) => {
    persist({
      ...data,
      categories: data.categories.filter((c) => c !== cat),
    });
  };

  // Credit Card Handlers
  const handleAddCard = (card: CreditCardItem) => {
    const list = data.creditCards || [];
    persist({
      ...data,
      creditCards: [...list, card],
    });
  };

  const handleDeleteCard = (id: string) => {
    const list = data.creditCards || [];
    persist({
      ...data,
      creditCards: list.filter((c) => c.id !== id),
    });
  };

  // Bank Accounts Handlers
  const handleAddAccount = (acc: BankAccount) => {
    const list = data.bankAccounts || [];
    persist({
      ...data,
      bankAccounts: [...list, acc],
    });
  };

  const handleEditAccount = (acc: BankAccount) => {
    const list = data.bankAccounts || [];
    persist({
      ...data,
      bankAccounts: list.map((a) => (a.id === acc.id ? acc : a)),
    });
  };

  const handleDeleteAccount = (id: string) => {
    const list = data.bankAccounts || [];
    persist({
      ...data,
      bankAccounts: list.filter((a) => a.id !== id),
    });
  };

  const handleTransfer = ({
    originAccountId,
    destinationAccountId,
    amount,
    date,
    notes,
  }: {
    originAccountId: string;
    destinationAccountId: string;
    amount: number;
    date: string;
    notes?: string;
  }) => {
    const origin = (data.bankAccounts || []).find((a) => a.id === originAccountId);
    const dest = (data.bankAccounts || []).find((a) => a.id === destinationAccountId);

    const transferTx: Transaction = {
      id: `tx-trans-${Date.now()}`,
      date,
      description: `Transferência: ${origin?.name || 'Origem'} ➔ ${dest?.name || 'Destino'}`,
      type: 'transferencia',
      amount,
      category: 'Transferência entre Contas',
      paymentMethod: 'Transferência',
      bankAccountId: originAccountId,
      destinationAccountId,
      status: 'pago',
      notes,
    };

    persist({
      ...data,
      transactions: [transferTx, ...data.transactions],
    });
  };

  // Statement Import Handler
  const handleImportStatementTransactions = (imported: Transaction[]) => {
    persist({
      ...data,
      transactions: [...imported, ...data.transactions],
    });
  };

  // Category Budgets Handler
  const handleSaveCategoryBudgets = (budgets: CategoryBudget[]) => {
    persist({
      ...data,
      categoryBudgets: budgets,
    });
  };

  // Recurring Transactions Handlers
  const handleSaveRecurringList = (list: RecurringTransaction[]) => {
    persist({
      ...data,
      recurringTransactions: list,
    });
  };

  const handleGenerateMonthlyTransactions = (generated: Transaction[]) => {
    persist({
      ...data,
      transactions: [...generated, ...data.transactions],
    });
  };

  // Monthly Notes Handler
  const handleSaveMonthlyNote = (month: string, note: string) => {
    const currentNotes = data.monthlyNotes || {};
    persist({
      ...data,
      monthlyNotes: {
        ...currentNotes,
        [month]: note,
      },
    });
  };

  // Vehicles Handlers
  const handleSaveVehicle = (veh: Vehicle) => {
    if (!data) return;
    const current = data.vehicles || [];
    const exists = current.some((v) => v.id === veh.id);
    const updated = exists ? current.map((v) => (v.id === veh.id ? veh : v)) : [...current, veh];
    persist({ ...data, vehicles: updated });
  };

  const handleDeleteVehicle = (id: string) => {
    if (!data) return;
    const updated = (data.vehicles || []).filter((v) => v.id !== id);
    const updatedExpenses = (data.vehicleExpenses || []).filter((e) => e.vehicleId !== id);
    persist({ ...data, vehicles: updated, vehicleExpenses: updatedExpenses });
  };

  const handleSaveVehicleExpense = (exp: VehicleExpense) => {
    if (!data) return;
    const current = data.vehicleExpenses || [];
    const exists = current.some((e) => e.id === exp.id);
    const updatedExpenses = exists ? current.map((e) => (e.id === exp.id ? exp : e)) : [exp, ...current];

    // SYNC: Create or update matching Transaction in Movimentações!
    const targetVeh = (data.vehicles || []).find((v) => v.id === exp.vehicleId);
    const vehName = targetVeh ? targetVeh.name : 'Veículo';
    const txId = `tx-vexp-${exp.id}`;
    let updatedTxList = [...data.transactions];
    const existingTxIndex = updatedTxList.findIndex((t) => t.id === txId || t.id === exp.id);

    const desc = exp.serviceDescription || `Gasto Veículo (${exp.type})`;
    const vehicleTx: Transaction = {
      id: txId,
      type: 'saida',
      description: `[${vehName}] ${desc}`,
      amount: exp.amount,
      date: exp.date,
      category: 'Transporte & Combustível',
      paymentMethod: 'PIX',
      bankAccountId: data.bankAccounts && data.bankAccounts[0] ? data.bankAccounts[0].id : undefined,
      status: 'pago',
      vehicleId: exp.vehicleId,
      vehicleExpenseType: exp.type,
      vehicleKm: exp.currentKm,
      vehicleLiters: exp.liters,
      vehiclePricePerLiter: exp.pricePerLiter,
      notes: exp.notes || 'Lançado via módulo de Veículos',
    };

    if (existingTxIndex >= 0) {
      updatedTxList[existingTxIndex] = vehicleTx;
    } else {
      updatedTxList = [vehicleTx, ...updatedTxList];
    }

    persist({
      ...data,
      vehicleExpenses: updatedExpenses,
      transactions: updatedTxList,
    });
  };

  const handleDeleteVehicleExpense = (id: string) => {
    if (!data) return;
    const updatedExpenses = (data.vehicleExpenses || []).filter((e) => e.id !== id);
    const updatedTx = data.transactions.filter(
      (t) => t.id !== `tx-vexp-${id}` && t.id !== id
    );
    persist({
      ...data,
      vehicleExpenses: updatedExpenses,
      transactions: updatedTx,
    });
  };

  // Amortization Handlers
  const handleSaveSimulation = (sim: AmortizationSimulation) => {
    if (!data) return;
    const current = data.amortizationSimulations || [];
    const exists = current.some((s) => s.id === sim.id);
    const updated = exists ? current.map((s) => (s.id === sim.id ? sim : s)) : [...current, sim];
    persist({ ...data, amortizationSimulations: updated });
  };

  const handleDeleteSimulation = (id: string) => {
    if (!data) return;
    const updated = (data.amortizationSimulations || []).filter((s) => s.id !== id);
    persist({ ...data, amortizationSimulations: updated });
  };

  // Investments Handlers
  const handleSaveInvestmentAsset = (asset: InvestmentAsset) => {
    if (!data) return;
    const current = data.investments || [];
    const exists = current.some((a) => a.id === asset.id);
    const updated = exists ? current.map((a) => (a.id === asset.id ? asset : a)) : [...current, asset];
    persist({ ...data, investments: updated });
  };

  const handleDeleteInvestmentAsset = (id: string) => {
    if (!data) return;
    const updated = (data.investments || []).filter((a) => a.id !== id);
    const updatedTx = (data.investmentTransactions || []).filter((t) => t.assetId !== id);
    persist({ ...data, investments: updated, investmentTransactions: updatedTx });
  };

  const handleSaveInvestmentTx = (tx: InvestmentTransaction, bankAccountId?: string) => {
    if (!data) return;
    const current = data.investmentTransactions || [];
    const exists = current.some((t) => t.id === tx.id);
    const updated = exists ? current.map((t) => (t.id === tx.id ? tx : t)) : [tx, ...current];

    // SYNC: Create matching Transaction in Movimentações!
    const targetAsset = (data.investments || []).find((a) => a.id === tx.assetId);
    const assetName = targetAsset ? targetAsset.name : 'Investimento';
    const txId = `tx-inv-${tx.id}`;
    let updatedTxList = [...data.transactions];

    const isIncome = tx.type === 'dividendo' || tx.type === 'juros_capital' || tx.type === 'resgate';
    const chosenBankId = bankAccountId !== undefined ? (bankAccountId || undefined) : data.bankAccounts?.[0]?.id;

    const newTx: Transaction = {
      id: txId,
      type: isIncome ? 'entrada' : 'saida',
      description: `[${assetName}] ${tx.type === 'dividendo' ? 'Rendimento / Dividendo' : tx.type === 'aporte' ? 'Aporte em Ativo' : 'Resgate'}`,
      amount: tx.amount,
      date: tx.date,
      category: isIncome ? 'Salário / Renda' : 'Outros',
      paymentMethod: 'Transferência',
      bankAccountId: chosenBankId,
      status: 'pago',
      investmentAssetId: tx.assetId,
      notes: tx.notes || 'Lançado via módulo de Investimentos',
    };

    const existingTxIndex = updatedTxList.findIndex((t) => t.id === txId || t.id === tx.id);
    if (existingTxIndex >= 0) {
      updatedTxList[existingTxIndex] = newTx;
    } else {
      updatedTxList = [newTx, ...updatedTxList];
    }

    persist({
      ...data,
      investmentTransactions: updated,
      transactions: updatedTxList,
    });
  };

  const handleDeleteInvestmentTx = (id: string) => {
    if (!data) return;
    const updated = (data.investmentTransactions || []).filter((t) => t.id !== id);
    const updatedTx = data.transactions.filter(
      (t) => t.id !== `tx-inv-${id}` && t.id !== id
    );
    persist({
      ...data,
      investmentTransactions: updated,
      transactions: updatedTx,
    });
  };

  // Goals Handlers
  const handleSaveGoal = (goal: FinancialGoal) => {
    if (!data) return;
    const current = data.goals || [];
    const exists = current.some((g) => g.id === goal.id);
    const updated = exists ? current.map((g) => (g.id === goal.id ? goal : g)) : [...current, goal];
    persist({ ...data, goals: updated });
  };

  const handleDeleteGoal = (id: string) => {
    if (!data) return;
    const updated = (data.goals || []).filter((g) => g.id !== id);
    persist({ ...data, goals: updated });
  };

  const handleDepositGoal = (goalId: string, amount: number, bankAccountId?: string) => {
    if (!data) return;
    const targetGoal = (data.goals || []).find((g) => g.id === goalId);
    if (!targetGoal) return;

    const newCurrent = (targetGoal.currentAmount || 0) + amount;
    const updatedGoals = (data.goals || []).map((g) =>
      g.id === goalId ? { ...g, currentAmount: newCurrent } : g
    );

    let updatedTxList = [...data.transactions];
    if (bankAccountId !== '') {
      const txId = `tx-goal-${goalId}-${Date.now()}`;
      const newTx: Transaction = {
        id: txId,
        type: 'saida',
        description: `[Meta: ${targetGoal.title}] Aporte / Depósito`,
        amount: amount,
        date: new Date().toISOString().slice(0, 10),
        category: 'Investimentos',
        paymentMethod: 'Transferência',
        bankAccountId: bankAccountId || data.bankAccounts?.[0]?.id,
        status: 'pago',
        goalId: goalId,
        notes: `Aporte direto registrado para a meta "${targetGoal.title}"`,
      };
      updatedTxList = [newTx, ...updatedTxList];
    }

    persist({
      ...data,
      goals: updatedGoals,
      transactions: updatedTxList,
    });
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-slate-50 font-sans text-slate-800">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenNewTx={() => {
          setTxToEdit(null);
          setIsTxModalOpen(true);
        }}
        isSaved={isSaved}
        data={data}
        updateAvailable={Boolean(updateInfo)}
        onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
      />

      <main className="flex-1 h-screen overflow-y-auto p-6 sm:p-8 bg-slate-50/80">
        <div className="max-w-[1500px] w-full mx-auto space-y-6">
          {/* Top Update Notification Banner */}
          {updateInfo && !isUpdateBannerDismissed && (
            <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 text-white p-4 sm:p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-400/30 animate-fadeIn">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner shrink-0">
                  <Sparkles className="w-5 h-5 text-emerald-200 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-sm text-white">
                      Nova Versão Disponível: {updateInfo.version}
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-black">
                      Atualização Oficial
                    </span>
                  </div>
                  <p className="text-xs text-emerald-100 font-medium mt-0.5">
                    Novas funcionalidades, otimizações e melhorias no FinanPro Suite prontas para você.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setIsUpdateBannerDismissed(true)}
                  className="px-3 py-1.5 text-xs text-emerald-100 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  Agora Não
                </button>
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  <span>Ver Novidades & Atualizar</span>
                </button>
              </div>
            </div>
          )}
          {activeTab === 'dashboard' && (
            <Dashboard
              data={data}
              onNavigateTab={setActiveTab}
              onOpenNewTx={() => {
                setTxToEdit(null);
                setIsTxModalOpen(true);
              }}
            />
          )}

          {activeTab === 'movimentacoes' && (
            <Movimentacoes
              transactions={data.transactions}
              categories={data.categories}
              creditCards={data.creditCards || []}
              bankAccounts={data.bankAccounts || []}
              recurringList={data.recurringTransactions || []}
              monthlyNotes={data.monthlyNotes || {}}
              onSaveMonthlyNote={handleSaveMonthlyNote}
              onAddTransaction={() => {
                setTxToEdit(null);
                setIsTxModalOpen(true);
              }}
              onEditTransaction={(tx) => {
                setTxToEdit(tx);
                setIsTxModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
              onToggleStatus={handleToggleTxStatus}
              onImportStatementTransactions={handleImportStatementTransactions}
              onSaveRecurringList={handleSaveRecurringList}
              onGenerateMonthlyTransactions={handleGenerateMonthlyTransactions}
            />
          )}

          {activeTab === 'contas' && (
            <ContasBancarias
              accounts={data.bankAccounts || []}
              transactions={data.transactions}
              onAddAccount={handleAddAccount}
              onEditAccount={handleEditAccount}
              onDeleteAccount={handleDeleteAccount}
              onTransfer={handleTransfer}
            />
          )}

          {activeTab === 'orcamento' && (
            <OrcamentoTeto
              categoryBudgets={data.categoryBudgets || []}
              transactions={data.transactions}
              categories={data.categories}
              onSaveBudgets={handleSaveCategoryBudgets}
            />
          )}

          {activeTab === 'obra' && (
            <EvolucaoObra
              obraEntries={data.obraEntries}
              deliveryDate={data.appSettings.houseDeliveryDate}
              onUpdateDeliveryDate={(date) => {
                persist({
                  ...data,
                  appSettings: {
                    ...data.appSettings,
                    houseDeliveryDate: date,
                  },
                });
              }}
              onAddEntry={() => {
                setObraToEdit(null);
                setIsObraModalOpen(true);
              }}
              onEditEntry={(entry) => {
                setObraToEdit(entry);
                setIsObraModalOpen(true);
              }}
              onDeleteEntry={handleDeleteObra}
              onToggleStatus={handleToggleObraStatus}
            />
          )}

          {activeTab === 'casa' && (
            <CasaParcelamentos
              installments={data.houseInstallments}
              onAddInstallment={() => {
                setInstToEdit(null);
                setIsInstModalOpen(true);
              }}
              onEditInstallment={(inst) => {
                setInstToEdit(inst);
                setIsInstModalOpen(true);
              }}
              onDeleteInstallment={handleDeleteInstallment}
              onPayNextInstallment={handlePayNextInstallment}
              onUndoInstallment={handleUndoInstallment}
            />
          )}

          {activeTab === 'veiculos' && (
            <Veiculos
              vehicles={data.vehicles || []}
              expenses={data.vehicleExpenses || []}
              onSaveVehicle={handleSaveVehicle}
              onDeleteVehicle={handleDeleteVehicle}
              onSaveExpense={handleSaveVehicleExpense}
              onDeleteExpense={handleDeleteVehicleExpense}
            />
          )}

          {activeTab === 'amortizacao' && (
            <SimuladorAmortizacao
              simulations={data.amortizationSimulations || []}
              onSaveSimulation={handleSaveSimulation}
              onDeleteSimulation={handleDeleteSimulation}
            />
          )}

          {activeTab === 'investimentos' && (
            <Investimentos
              investments={data.investments || []}
              transactions={data.investmentTransactions || []}
              bankAccounts={data.bankAccounts || []}
              onSaveAsset={handleSaveInvestmentAsset}
              onDeleteAsset={handleDeleteInvestmentAsset}
              onSaveTx={handleSaveInvestmentTx}
              onDeleteTx={handleDeleteInvestmentTx}
            />
          )}

          {activeTab === 'metas' && (
            <MetasFinanceiras
              goals={data.goals || []}
              bankAccounts={data.bankAccounts || []}
              onSaveGoal={handleSaveGoal}
              onDeleteGoal={handleDeleteGoal}
              onDeposit={handleDepositGoal}
            />
          )}

          {activeTab === 'visaoAnual' && (
            <VisaoAnual
              transactions={data.transactions}
              categories={data.categories}
            />
          )}

          {activeTab === 'config' && (
            <Configuracoes
              data={data}
              onUpdateData={persist}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddCard={handleAddCard}
              onDeleteCard={handleDeleteCard}
              updateInfo={updateInfo}
              onCheckUpdates={() => handleCheckForUpdates(true)}
              isCheckingUpdates={isCheckingUpdates}
              onOpenUpdateModal={() => setIsUpdateModalOpen(true)}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setTxToEdit(null);
        }}
        onSave={handleSaveTransaction}
        transactionToEdit={txToEdit}
        categories={data.categories}
        creditCards={data.creditCards || []}
        bankAccounts={data.bankAccounts || []}
        vehicles={data.vehicles || []}
      />

      <ObraModal
        isOpen={isObraModalOpen}
        onClose={() => {
          setIsObraModalOpen(false);
          setObraToEdit(null);
        }}
        onSave={handleSaveObra}
        entryToEdit={obraToEdit}
      />

      <InstallmentModal
        isOpen={isInstModalOpen}
        onClose={() => {
          setIsInstModalOpen(false);
          setInstToEdit(null);
        }}
        onSave={handleSaveInstallment}
        installmentToEdit={instToEdit}
      />

      {/* Auto-Update Notification Banner & Modal */}
      <UpdateNotification />
      <UpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        updateInfo={updateInfo}
        currentVersion={CURRENT_APP_VERSION}
      />
    </div>
  );
}

export default App;
