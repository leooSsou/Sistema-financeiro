import React, { useState, useEffect, useCallback } from 'react';
import { AppData, Transaction, ObraEntry, HouseInstallment, CreditCardItem, BankAccount, PaymentStatus, CategoryBudget, RecurringTransaction, Vehicle, VehicleExpense, AmortizationSimulation } from './types/finance';
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
import { Configuracoes } from './components/Configuracoes';
import { TransactionModal } from './components/TransactionModal';
import { ObraModal } from './components/ObraModal';
import { InstallmentModal } from './components/InstallmentModal';
import { UpdateNotification } from './components/UpdateNotification';

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

  // Transaction Handlers
  const handleSaveTransaction = (transactionOrList: Transaction | Transaction[]) => {
    const newItems = Array.isArray(transactionOrList) ? transactionOrList : [transactionOrList];
    let updatedTxList = [...data.transactions];

    newItems.forEach((item) => {
      const existingIndex = updatedTxList.findIndex((t) => t.id === item.id);
      if (existingIndex >= 0) {
        updatedTxList[existingIndex] = item;
      } else {
        updatedTxList = [item, ...updatedTxList];
      }
    });

    persist({
      ...data,
      transactions: updatedTxList,
    });
  };

  const handleDeleteTransaction = (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta movimentação?')) return;
    const updatedTxList = data.transactions.filter((t) => t.id !== id);
    persist({
      ...data,
      transactions: updatedTxList,
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

  // Obra Handlers
  const handleSaveObra = (entry: ObraEntry) => {
    const existingIndex = data.obraEntries.findIndex((e) => e.id === entry.id);
    let updatedList: ObraEntry[];

    if (existingIndex >= 0) {
      updatedList = [...data.obraEntries];
      updatedList[existingIndex] = entry;
    } else {
      updatedList = [entry, ...data.obraEntries];
    }

    persist({
      ...data,
      obraEntries: updatedList,
    });
  };

  const handleDeleteObra = (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este registro de obra?')) return;
    const updatedList = data.obraEntries.filter((e) => e.id !== id);
    persist({
      ...data,
      obraEntries: updatedList,
    });
  };

  const handleToggleObraStatus = (id: string) => {
    const updatedList: ObraEntry[] = data.obraEntries.map((e) => {
      if (e.id === id) {
        return {
          ...e,
          status: (e.status === 'pago' ? 'pendente' : 'pago') as PaymentStatus,
        };
      }
      return e;
    });
    persist({
      ...data,
      obraEntries: updatedList,
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
        id: `tx-inst-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        description: `Parcela ${newPaidCount}/${item.totalInstallments} - ${item.title}`,
        type: 'saida',
        amount: item.installmentValue,
        category: 'Casa & Reforma',
        paymentMethod: 'Boleto',
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
    const updatedInstallments = data.houseInstallments.map((i) => {
      if (i.id === item.id) {
        return { ...i, paidInstallments: i.paidInstallments - 1 };
      }
      return i;
    });
    persist({
      ...data,
      houseInstallments: updatedInstallments,
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
    const updated = exists ? current.map((e) => (e.id === exp.id ? exp : e)) : [exp, ...current];
    persist({ ...data, vehicleExpenses: updated });
  };

  const handleDeleteVehicleExpense = (id: string) => {
    if (!data) return;
    const updated = (data.vehicleExpenses || []).filter((e) => e.id !== id);
    persist({ ...data, vehicleExpenses: updated });
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
      />

      <main className="flex-1 h-screen overflow-y-auto p-6 sm:p-8 bg-slate-50/80">
        <div className="max-w-[1500px] w-full mx-auto space-y-6">
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

          {activeTab === 'config' && (
            <Configuracoes
              data={data}
              onUpdateData={persist}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onAddCard={handleAddCard}
              onDeleteCard={handleDeleteCard}
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
    </div>
  );
}

export default App;
