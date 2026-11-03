import React, { useState, useMemo } from 'react';
import { BankAccount, BankAccountType, Transaction } from '../types/finance';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import {
  Wallet,
  Building2,
  PiggyBank,
  TrendingUp,
  Plus,
  ArrowRightLeft,
  Edit2,
  Trash2,
  CreditCard,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  X,
  Search,
  Filter
} from 'lucide-react';

interface ContasBancariasProps {
  accounts: BankAccount[];
  transactions: Transaction[];
  onAddAccount: (account: BankAccount) => void;
  onEditAccount: (account: BankAccount) => void;
  onDeleteAccount: (id: string) => void;
  onTransfer: (data: {
    originAccountId: string;
    destinationAccountId: string;
    amount: number;
    date: string;
    notes?: string;
  }) => void;
}

const ACCOUNT_COLORS = [
  { name: 'Azul', value: '#2563eb' },
  { name: 'Roxo (Nubank)', value: '#8b5cf6' },
  { name: 'Laranja (Inter/Itaú)', value: '#f97316' },
  { name: 'Verde Esmeralda', value: '#059669' },
  { name: 'Vermelho / Coral', value: '#dc2626' },
  { name: 'Grafite Escuro', value: '#334155' },
  { name: 'Dourado / Âmbar', value: '#d97706' },
  { name: 'Ciano / Turquesa', value: '#0891b2' },
];

export const ContasBancarias: React.FC<ContasBancariasProps> = ({
  accounts,
  transactions,
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onTransfer,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State for Account
  const [name, setName] = useState('');
  const [type, setType] = useState<BankAccountType>('corrente');
  const [initialBalance, setInitialBalance] = useState('');
  const [color, setColor] = useState(ACCOUNT_COLORS[0].value);
  const [agency, setAgency] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  // Form State for Transfer
  const [transOrigin, setTransOrigin] = useState('');
  const [transDest, setTransDest] = useState('');
  const [transAmount, setTransAmount] = useState('');
  const [transDate, setTransDate] = useState(new Date().toISOString().slice(0, 10));
  const [transNotes, setTransNotes] = useState('');

  // Calculate real balances for each account
  const accountBalances = useMemo(() => {
    const map = new Map<string, { currentBalance: number; totalIn: number; totalOut: number }>();

    accounts.forEach((acc) => {
      map.set(acc.id, {
        currentBalance: acc.initialBalance || 0,
        totalIn: 0,
        totalOut: 0,
      });
    });

    transactions.forEach((tx) => {
      // Regular income (entrada) into this account
      if (tx.type === 'entrada' && tx.bankAccountId && map.has(tx.bankAccountId)) {
        const item = map.get(tx.bankAccountId)!;
        item.currentBalance += tx.amount;
        item.totalIn += tx.amount;
      }
      // Regular expense (saida) from this account (only if actually paid/debited)
      else if (tx.type === 'saida' && tx.bankAccountId && map.has(tx.bankAccountId)) {
        const item = map.get(tx.bankAccountId)!;
        item.currentBalance -= tx.amount;
        item.totalOut += tx.amount;
      }
      // Transfer between accounts
      else if (tx.type === 'transferencia') {
        if (tx.bankAccountId && map.has(tx.bankAccountId)) {
          const origin = map.get(tx.bankAccountId)!;
          origin.currentBalance -= tx.amount;
          origin.totalOut += tx.amount;
        }
        if (tx.destinationAccountId && map.has(tx.destinationAccountId)) {
          const dest = map.get(tx.destinationAccountId)!;
          dest.currentBalance += tx.amount;
          dest.totalIn += tx.amount;
        }
      }
    });

    return map;
  }, [accounts, transactions]);

  // Overall totals
  const overallMetrics = useMemo(() => {
    let totalAll = 0;
    let totalCorrente = 0;
    let totalPoupanca = 0;
    let totalCarteira = 0;

    accounts.forEach((acc) => {
      const balance = accountBalances.get(acc.id)?.currentBalance || 0;
      totalAll += balance;
      if (acc.type === 'corrente') totalCorrente += balance;
      else if (acc.type === 'poupanca' || acc.type === 'investimento') totalPoupanca += balance;
      else if (acc.type === 'carteira') totalCarteira += balance;
    });

    return { totalAll, totalCorrente, totalPoupanca, totalCarteira };
  }, [accounts, accountBalances]);

  // Transactions filtered by selected account (if any)
  const filteredTransactions = useMemo(() => {
    if (!selectedAccountId) return [];
    return transactions.filter(
      (tx) => tx.bankAccountId === selectedAccountId || tx.destinationAccountId === selectedAccountId
    );
  }, [selectedAccountId, transactions]);

  const handleOpenNewAccount = () => {
    setEditingAccount(null);
    setName('');
    setType('corrente');
    setInitialBalance('');
    setColor(ACCOUNT_COLORS[0].value);
    setAgency('');
    setAccountNumber('');
    setIsModalOpen(true);
  };

  const handleOpenEditAccount = (acc: BankAccount) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setInitialBalance(acc.initialBalance.toString());
    setColor(acc.color || ACCOUNT_COLORS[0].value);
    setAgency(acc.agency || '');
    setAccountNumber(acc.accountNumber || '');
    setIsModalOpen(true);
  };

  const handleSaveAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Informe o nome da conta (ex: Nubank, Itaú, Carteira).');
      return;
    }

    const parsedBalance = parseFloat(initialBalance.replace(',', '.')) || 0;

    if (editingAccount) {
      onEditAccount({
        ...editingAccount,
        name: name.trim(),
        type,
        initialBalance: parsedBalance,
        color,
        agency: agency.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
      });
    } else {
      onAddAccount({
        id: `acc-${Date.now()}`,
        name: name.trim(),
        type,
        initialBalance: parsedBalance,
        color,
        agency: agency.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleOpenTransferModal = () => {
    if (accounts.length < 2) {
      alert('Você precisa ter pelo menos 2 contas cadastradas para realizar uma transferência.');
      return;
    }
    setTransOrigin(accounts[0].id);
    setTransDest(accounts[1].id);
    setTransAmount('');
    setTransDate(new Date().toISOString().slice(0, 10));
    setTransNotes('');
    setIsTransferModalOpen(true);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transOrigin || !transDest) {
      alert('Selecione as contas de origem e destino.');
      return;
    }
    if (transOrigin === transDest) {
      alert('A conta de origem e destino devem ser diferentes.');
      return;
    }
    const parsedAmount = parseFloat(transAmount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Informe um valor válido para transferência.');
      return;
    }

    onTransfer({
      originAccountId: transOrigin,
      destinationAccountId: transDest,
      amount: parsedAmount,
      date: transDate,
      notes: transNotes.trim() || undefined,
    });

    setIsTransferModalOpen(false);
  };

  const getTypeLabel = (t: BankAccountType) => {
    switch (t) {
      case 'corrente':
        return 'Conta Corrente';
      case 'poupanca':
        return 'Poupança';
      case 'investimento':
        return 'Investimentos';
      case 'carteira':
        return 'Carteira / Dinheiro';
      default:
        return 'Outros';
    }
  };

  const getTypeIcon = (t: BankAccountType) => {
    switch (t) {
      case 'corrente':
        return <Building2 className="w-4 h-4" />;
      case 'poupanca':
        return <PiggyBank className="w-4 h-4" />;
      case 'investimento':
        return <TrendingUp className="w-4 h-4" />;
      case 'carteira':
        return <Wallet className="w-4 h-4" />;
      default:
        return <CreditCard className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                Contas Bancárias & Saldos Reais
              </h1>
              <p className="text-sm text-slate-500 font-medium">
                Gerencie seus bancos, contas correntes, poupanças e dinheiro físico em um só lugar.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenTransferModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
          >
            <ArrowRightLeft className="w-4 h-4 text-slate-600" />
            <span>Transferência</span>
          </button>
          <button
            onClick={handleOpenNewAccount}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conta</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Geral */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl text-white shadow-lg shadow-slate-900/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Saldo Total em Contas
            </span>
            <div className="p-2 bg-white/10 rounded-xl">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {formatCurrency(overallMetrics.totalAll)}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Soma total disponível em {accounts.length} conta{accounts.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Conta Corrente */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Contas Correntes
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800">
              {formatCurrency(overallMetrics.totalCorrente)}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">Livre para movimentação diária</p>
          </div>
        </div>

        {/* Poupança / Investimento */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Poupança & Reservas
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-emerald-600">
              {formatCurrency(overallMetrics.totalPoupanca)}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">Reservas de segurança e aportes</p>
          </div>
        </div>

        {/* Carteira / Espécie */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Dinheiro Físico / Carteira
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800">
              {formatCurrency(overallMetrics.totalCarteira)}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">Dinheiro em mãos ou cofre</p>
          </div>
        </div>
      </div>

      {/* Accounts Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <span>Suas Contas Cadastradas</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
              {accounts.length}
            </span>
          </h2>
          {selectedAccountId && (
            <button
              onClick={() => setSelectedAccountId(null)}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Limpar seleção
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const balanceData = accountBalances.get(acc.id) || {
              currentBalance: acc.initialBalance || 0,
              totalIn: 0,
              totalOut: 0,
            };
            const isSelected = selectedAccountId === acc.id;

            return (
              <div
                key={acc.id}
                onClick={() => setSelectedAccountId(isSelected ? null : acc.id)}
                className={`cursor-pointer rounded-2xl p-5 border transition-all relative overflow-hidden bg-white ${
                  isSelected
                    ? 'ring-2 ring-blue-500 border-blue-400 shadow-md'
                    : 'border-slate-100 hover:border-slate-300 shadow-sm'
                }`}
              >
                {/* Top colored accent line */}
                <div
                  className="absolute top-0 left-0 right-0 h-1.5"
                  style={{ backgroundColor: acc.color || '#2563eb' }}
                />

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm"
                      style={{ backgroundColor: acc.color || '#2563eb' }}
                    >
                      {getTypeIcon(acc.type)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{acc.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                        <span>{getTypeLabel(acc.type)}</span>
                        {acc.agency && <span>• Ag: {acc.agency}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleOpenEditAccount(acc)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar Conta"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {accounts.length > 1 && (
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `Deseja realmente excluir a conta "${acc.name}"? As movimentações vinculadas não serão apagadas.`
                            )
                          ) {
                            onDeleteAccount(acc.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir Conta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                    Saldo Atual Conciliado
                  </span>
                  <div className="flex items-baseline justify-between mt-1">
                    <span
                      className={`text-2xl font-black tracking-tight ${
                        balanceData.currentBalance < 0
                          ? 'text-rose-600'
                          : balanceData.currentBalance > 0
                          ? 'text-slate-900'
                          : 'text-slate-500'
                      }`}
                    >
                      {formatCurrency(balanceData.currentBalance)}
                    </span>
                    <span className="text-xs text-slate-400">
                      Inicial: {formatCurrency(acc.initialBalance)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-50">
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <ArrowDownRight className="w-3.5 h-3.5" /> +{formatCurrency(balanceData.totalIn)}
                    </span>
                    <span className="flex items-center gap-1 text-rose-600 font-medium">
                      <ArrowUpRight className="w-3.5 h-3.5" /> -{formatCurrency(balanceData.totalOut)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Account Activity Log */}
      {selectedAccountId && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <Filter className="w-4 h-4 text-blue-600" />
              <span>Extrato da Conta: {accounts.find((a) => a.id === selectedAccountId)?.name}</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {filteredTransactions.length} lançamentos vinculados
            </span>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Nenhuma movimentação vinculada diretamente a esta conta ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="py-2.5">Data</th>
                    <th className="py-2.5">Descrição</th>
                    <th className="py-2.5">Tipo</th>
                    <th className="py-2.5">Categoria</th>
                    <th className="py-2.5 text-right">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTransactions.map((tx) => {
                    const isOrigin = tx.bankAccountId === selectedAccountId;
                    const isTransfer = tx.type === 'transferencia';
                    const isExpense = tx.type === 'saida' || (isTransfer && isOrigin);

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/60 font-medium text-slate-700">
                        <td className="py-2.5 whitespace-nowrap">{formatDateBR(tx.date)}</td>
                        <td className="py-2.5 font-bold text-slate-900">{tx.description}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isTransfer
                                ? 'bg-indigo-50 text-indigo-700'
                                : tx.type === 'entrada'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {isTransfer
                              ? isOrigin
                                ? 'Transf. Enviada'
                                : 'Transf. Recebida'
                              : tx.type === 'entrada'
                              ? 'Entrada'
                              : 'Saída'}
                          </span>
                        </td>
                        <td className="py-2.5 text-slate-500">{tx.category}</td>
                        <td
                          className={`py-2.5 text-right font-black ${
                            isExpense ? 'text-rose-600' : 'text-emerald-600'
                          }`}
                        >
                          {isExpense ? '-' : '+'} {formatCurrency(tx.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modal: Nova / Editar Conta */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-extrabold text-slate-800 text-base">
                {editingAccount ? 'Editar Conta Bancária' : 'Cadastrar Nova Conta'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccountSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Conta / Banco *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank, Itaú Corrente, Carteira..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Conta
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as BankAccountType)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                  >
                    <option value="corrente">Conta Corrente</option>
                    <option value="poupanca">Poupança</option>
                    <option value="investimento">Investimento</option>
                    <option value="carteira">Carteira / Espécie</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Saldo Inicial (R$)
                  </label>
                  <input
                    type="text"
                    placeholder="0,00"
                    value={initialBalance}
                    onChange={(e) => setInitialBalance(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Agência (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 0001"
                    value={agency}
                    onChange={(e) => setAgency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nº da Conta (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 12345-6"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Cor da Conta / Banco
                </label>
                <div className="flex flex-wrap gap-2.5">
                  {ACCOUNT_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setColor(c.value)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        color === c.value ? 'scale-110 border-slate-900 shadow-sm' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {editingAccount ? 'Salvar Alterações' : 'Cadastrar Conta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Transferência Entre Contas */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-800 text-base">Transferência entre Contas</h3>
              </div>
              <button
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Conta de Origem (Sai o dinheiro)
                </label>
                <select
                  value={transOrigin}
                  onChange={(e) => setTransOrigin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({formatCurrency(accountBalances.get(a.id)?.currentBalance || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Conta de Destino (Entra o dinheiro)
                </label>
                <select
                  value={transDest}
                  onChange={(e) => setTransDest(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} disabled={a.id === transOrigin}>
                      {a.name} ({formatCurrency(accountBalances.get(a.id)?.currentBalance || 0)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valor (R$) *</label>
                  <input
                    type="text"
                    required
                    placeholder="0,00"
                    value={transAmount}
                    onChange={(e) => setTransAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-black text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data *</label>
                  <input
                    type="date"
                    required
                    value={transDate}
                    onChange={(e) => setTransDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Aplicação na reserva, resgate..."
                  value={transNotes}
                  onChange={(e) => setTransNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Efetuar Transferência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
