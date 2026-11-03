import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType, PaymentStatus, CreditCardItem, BankAccount, RecurringTransaction } from '../types/finance';
import { formatCurrency, formatDate, formatMonthYear } from '../utils/formatters';
import { ImportStatementModal } from './ImportStatementModal';
import { RecorrenciasModal } from './RecorrenciasModal';
import {
  Plus,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  X,
  FileText,
  BarChart3,
  Sparkles,
  Save,
  Check,
  Percent,
  Wallet,
  Upload,
  RotateCcw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';

interface MovimentacoesProps {
  transactions: Transaction[];
  categories: string[];
  creditCards?: CreditCardItem[];
  bankAccounts?: BankAccount[];
  recurringList?: RecurringTransaction[];
  monthlyNotes?: Record<string, string>;
  onSaveMonthlyNote?: (month: string, note: string) => void;
  onAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onImportStatementTransactions?: (list: Transaction[]) => void;
  onSaveRecurringList?: (list: RecurringTransaction[]) => void;
  onGenerateMonthlyTransactions?: (list: Transaction[]) => void;
}

function getNextMonth(current: string): string {
  const [y, m] = current.split('-').map(Number);
  const nextDate = new Date(y, m, 1);
  const nextY = nextDate.getFullYear();
  const nextM = String(nextDate.getMonth() + 1).padStart(2, '0');
  return `${nextY}-${nextM}`;
}

function getPrevMonth(current: string): string {
  const [y, m] = current.split('-').map(Number);
  const prevDate = new Date(y, m - 2, 1);
  const prevY = prevDate.getFullYear();
  const prevM = String(prevDate.getMonth() + 1).padStart(2, '0');
  return `${prevY}-${prevM}`;
}

function getLastDayOfMonth(monthStr: string): number {
  const [y, m] = monthStr.split('-').map(Number);
  return new Date(y, m, 0).getDate();
}

export const Movimentacoes: React.FC<MovimentacoesProps> = ({
  transactions,
  categories,
  creditCards = [],
  bankAccounts = [],
  recurringList = [],
  monthlyNotes = {},
  onSaveMonthlyNote,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onToggleStatus,
  onImportStatementTransactions,
  onSaveRecurringList,
  onGenerateMonthlyTransactions,
}) => {
  const todayMonth = new Date().toISOString().slice(0, 7);
  const [currentMonth, setCurrentMonth] = useState<string>(todayMonth);
  const [showAllMonths, setShowAllMonths] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isRecorrenciasModalOpen, setIsRecorrenciasModalOpen] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Notes state for selected month
  const [noteText, setNoteText] = useState<string>('');
  const [isSavedNote, setIsSavedNote] = useState<boolean>(false);

  useEffect(() => {
    setNoteText(monthlyNotes[currentMonth] || '');
    setIsSavedNote(false);
  }, [currentMonth, monthlyNotes]);

  const handleSaveNote = () => {
    if (onSaveMonthlyNote) {
      onSaveMonthlyNote(currentMonth, noteText);
      setIsSavedNote(true);
      setTimeout(() => setIsSavedNote(false), 2500);
    }
  };

  const handlePrevMonth = () => {
    setShowAllMonths(false);
    setCurrentMonth((prev) => getPrevMonth(prev));
  };

  const handleNextMonth = () => {
    setShowAllMonths(false);
    setCurrentMonth((prev) => getNextMonth(prev));
  };

  const handleTodayMonth = () => {
    setShowAllMonths(false);
    setCurrentMonth(todayMonth);
  };

  // Filtered transactions (Strictly separates by month: 01 to 30/31, others remain hidden)
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Month filter: strictly matches selected month unless showAllMonths is explicitly chosen
      if (!showAllMonths && t.date && !t.date.startsWith(currentMonth)) {
        return false;
      }

      // Search text
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesDesc = t.description.toLowerCase().includes(query);
        const matchesCat = t.category.toLowerCase().includes(query);
        const matchesNotes = t.notes?.toLowerCase().includes(query);
        if (!matchesDesc && !matchesCat && !matchesNotes) return false;
      }

      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;

      // Status filter
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;

      return true;
    });
  }, [
    transactions,
    showAllMonths,
    currentMonth,
    searchTerm,
    typeFilter,
    statusFilter,
    categoryFilter,
  ]);

  // Automatic sum calculations on filtered list
  const totals = useMemo(() => {
    let entradas = 0;
    let saidas = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === 'entrada') entradas += t.amount;
      else saidas += t.amount;
    });

    const saldo = entradas - saidas;
    const comprometimento = entradas > 0 ? Math.min(100, (saidas / entradas) * 100) : 0;
    const taxaSobra = entradas > 0 && saldo > 0 ? (saldo / entradas) * 100 : 0;

    return {
      entradas,
      saidas,
      saldo,
      comprometimento,
      taxaSobra,
      count: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Data for the Monthly Total Chart (Entrada vs Saída Total) requested in Audio 2
  const monthlyTotalChartData = useMemo(() => {
    return [
      { name: 'Entradas', valor: totals.entradas, fill: '#10b981' },
      { name: 'Saídas', valor: totals.saidas, fill: '#f43f5e' },
      { name: 'Saldo', valor: Math.max(0, totals.saldo), fill: '#6366f1' },
    ];
  }, [totals]);

  const isCurrentTodayMonth = currentMonth === todayMonth && !showAllMonths;
  const monthNumber = currentMonth.slice(5, 7);
  const lastDay = getLastDayOfMonth(currentMonth);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-slate-200/80">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-black uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Fechamento & Movimentações Mensais</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">
            Extrato de Movimentações
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Tudo o que você lançar do dia 01 a {lastDay} é automaticamente agrupado e calculado no mês {monthNumber}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-2xl font-bold text-xs transition-all hover:scale-105 active:scale-95"
            title="Importar extrato bancário em formato .OFX ou .CSV"
          >
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Importar Extrato</span>
          </button>

          <button
            onClick={() => setIsRecorrenciasModalOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-2xl font-bold text-xs transition-all hover:scale-105 active:scale-95"
            title="Gerenciar contas que repetem todo mês (Aluguel, Salário, Internet...)"
          >
            <RotateCcw className="w-4 h-4 text-indigo-600" />
            <span>Contas Fixas</span>
          </button>

          <button
            onClick={onAddTransaction}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-black text-xs shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Movimentação</span>
          </button>
        </div>
      </div>

      {/* Prominent Month Navigator (Garante a separação e virada de mês) */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Navigation buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-start">
          <button
            onClick={handlePrevMonth}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 active:scale-95 transition-all shadow-2xs cursor-pointer"
            title="Ver mês anterior"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
            <span>Mês Anterior</span>
          </button>

          <button
            onClick={handleTodayMonth}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
              isCurrentTodayMonth
                ? 'bg-emerald-600 text-white shadow-emerald-600/20 shadow-md font-black'
                : 'bg-slate-100/80 text-slate-700 hover:bg-slate-200/80'
            }`}
          >
            Mês Atual ({todayMonth.slice(5, 7)}/{todayMonth.slice(0, 4)})
          </button>

          <button
            onClick={handleNextMonth}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 bg-slate-100/80 hover:bg-slate-200/80 active:scale-95 transition-all shadow-2xs cursor-pointer"
            title="Ver próximo mês"
          >
            <span>Próximo Mês</span>
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Selected Month Title */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 shadow-2xs font-black">
            {showAllMonths ? 'ALL' : monthNumber}
          </div>
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <span className="text-lg sm:text-xl font-black text-slate-900 capitalize tracking-tight">
                {showAllMonths ? 'Todo o Histórico' : formatMonthYear(currentMonth)}
              </span>
              {!showAllMonths && (
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-wider border border-slate-200">
                  Mês {monthNumber}
                </span>
              )}
              {isCurrentTodayMonth && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                  Mês Presente
                </span>
              )}
            </div>
            <span className="text-xs text-slate-400 font-medium block">
              {showAllMonths
                ? 'Exibindo todos os lançamentos sem filtro de data'
                : `Período: 01/${monthNumber} a ${lastDay}/${monthNumber} • Outros meses estão ocultos`}
            </span>
          </div>
        </div>

        {/* Toggle to see all months */}
        <button
          onClick={() => setShowAllMonths(!showAllMonths)}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border cursor-pointer ${
            showAllMonths
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200/80'
          }`}
        >
          {showAllMonths ? 'Voltar para Visão Mensal' : 'Ver Todo o Histórico'}
        </button>
      </div>

      {/* Financial Summary Cards for the active month */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Entradas */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white border border-emerald-200/70 p-5 rounded-3xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800">
              Entradas do Mês {monthNumber} (+)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1 tracking-tight">
              {formatCurrency(totals.entradas)}
            </div>
            <span className="text-xs text-emerald-600/80 font-semibold block mt-0.5">
              Receitas somadas neste mês
            </span>
          </div>
          <div className="w-11 h-11 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-emerald-500/25">
            <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        {/* Saídas */}
        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-white border border-rose-200/70 p-5 rounded-3xl shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-800">
              Saídas do Mês {monthNumber} (-)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-700 mt-1 tracking-tight">
              {formatCurrency(totals.saidas)}
            </div>
            <span className="text-xs text-rose-600/80 font-semibold block mt-0.5">
              Despesas e faturas deste mês
            </span>
          </div>
          <div className="w-11 h-11 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-md shadow-rose-500/25">
            <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
          </div>
        </div>

        {/* Saldo Líquido */}
        <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-md border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Saldo Líquido de {formatMonthYear(currentMonth)}
            </span>
            <div
              className={`text-2xl sm:text-3xl font-black mt-1 tracking-tight ${
                totals.saldo >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {formatCurrency(totals.saldo)}
            </div>
            <span className="text-xs text-slate-400 font-medium block mt-0.5">
              {totals.count} {totals.count === 1 ? 'lançamento no mês' : 'lançamentos no mês'}
            </span>
          </div>
          <div className="w-11 h-11 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700 text-emerald-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* NOVO: SEÇÃO DE GRÁFICO DO MÊS + ANOTAÇÕES MENSAIS (Solicitadas nos Áudios 1 e 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Gráfico de Entrada e Saída Total do Mês (Áudio 2 da Gabi) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Gráfico do Mês: Entrada vs. Saída Total
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Comparativo direto das entradas e despesas de {formatMonthYear(currentMonth)}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-black">
                Mês {monthNumber}
              </span>
            </div>

            {/* Barra de comprometimento da renda */}
            {totals.entradas > 0 && (
              <div className="mb-4 p-3.5 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-indigo-600" /> Comprometimento da Renda
                  </span>
                  <span
                    className={
                      totals.comprometimento > 90
                        ? 'text-rose-600 font-black'
                        : totals.comprometimento > 70
                        ? 'text-amber-600 font-black'
                        : 'text-emerald-600 font-black'
                    }
                  >
                    {totals.comprometimento.toFixed(1)}% utilizado
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-700 ${
                      totals.comprometimento > 90
                        ? 'bg-rose-500'
                        : totals.comprometimento > 70
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, totals.comprometimento)}%` }}
                  />
                </div>
                <span className="text-[11px] text-slate-400 block pt-0.5">
                  {totals.saldo >= 0
                    ? `Sobrou ${totals.taxaSobra.toFixed(1)}% (${formatCurrency(totals.saldo)}) da renda neste mês.`
                    : `Gastos superaram as receitas em ${formatCurrency(Math.abs(totals.saldo))}.`}
                </span>
              </div>
            )}

            {/* Gráfico de Barras do Mês */}
            {totals.entradas > 0 || totals.saidas > 0 ? (
              <div className="h-52 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTotalChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }} stroke="#e2e8f0" />
                    <YAxis tick={{ fill: '#64748b', fontSize: 11 }} stroke="#e2e8f0" />
                    <Tooltip
                      formatter={(val: number) => formatCurrency(val)}
                      contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                    />
                    <Bar dataKey="valor" radius={[8, 8, 0, 0]} barSize={48}>
                      {monthlyTotalChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-52 flex flex-col items-center justify-center text-slate-400 text-xs">
                <BarChart3 className="w-8 h-8 text-slate-300 mb-2" />
                Sem movimentações registradas para gerar o gráfico deste mês.
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Campo de Observação Mensal (Áudio 1 da Gabi) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Observações de {formatMonthYear(currentMonth)}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Caixinha para anotações manuais sobre o que movimentou neste mês
                  </p>
                </div>
              </div>

              {isSavedNote && (
                <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-bold animate-in fade-in">
                  <Check className="w-3.5 h-3.5" /> Salvo!
                </span>
              )}
            </div>

            <div className="relative mt-2">
              <textarea
                rows={7}
                placeholder={`Escreva aqui suas observações sobre o mês de ${formatMonthYear(currentMonth)}...\n\nExemplo:\n- Paguei a parcela do cartão antecipada;\n- Renda extra com projeto no dia 15;\n- Mês focado na compra dos materiais da obra.`}
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                className="w-full p-4 rounded-2xl border border-slate-200/80 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none bg-amber-50/20 font-medium leading-relaxed"
              />
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-100">
            <span className="text-[11px] text-slate-400 font-medium">
              * Fica salvo exclusivamente para {formatMonthYear(currentMonth)}.
            </span>

            <button
              onClick={handleSaveNote}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>Salvar Observação</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por descrição, categoria, observações..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3.5 py-2 rounded-2xl">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer pr-2"
            >
              <option value="all">Todas as Categorias</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter chips (Type & Status) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          {/* Type filters */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-slate-400 mr-1 uppercase tracking-wider">
              Tipo:
            </span>
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTypeFilter('entrada')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                typeFilter === 'entrada'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" /> Entradas
            </button>
            <button
              onClick={() => setTypeFilter('saida')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                typeFilter === 'saida'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5]" /> Saídas
            </button>
          </div>

          {/* Status filters */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black text-slate-400 mr-1 uppercase tracking-wider">
              Status:
            </span>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStatusFilter('pago')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === 'pago'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Pagos
            </button>
            <button
              onClick={() => setStatusFilter('pendente')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                statusFilter === 'pendente'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-amber-700 hover:bg-amber-50'
              }`}
            >
              <Clock className="w-3.5 h-3.5" /> Pendentes
            </button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-sm">
              Lançamentos de {showAllMonths ? 'Todo o Histórico' : formatMonthYear(currentMonth)}
            </span>
            <span className="text-xs text-slate-400">
              ({filteredTransactions.length} {filteredTransactions.length === 1 ? 'item' : 'itens'})
            </span>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            {showAllMonths ? 'Visualizando todos' : `Mês ${monthNumber} isolado`}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 text-[11px] font-black uppercase tracking-wider">
                <th className="py-4 px-5">Data</th>
                <th className="py-4 px-5">Tipo</th>
                <th className="py-4 px-5">Descrição</th>
                <th className="py-4 px-5">Categoria</th>
                <th className="py-4 px-5">Pagamento</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5 text-right">Valor</th>
                <th className="py-4 px-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredTransactions.map((tx) => (
                <tr
                  key={tx.id}
                  className="hover:bg-slate-50/70 transition-colors group"
                >
                  <td className="py-4 px-5 font-bold text-slate-600 whitespace-nowrap text-xs">
                    {formatDate(tx.date)}
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-black tracking-tight ${
                        tx.type === 'entrada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tx.type === 'entrada' ? (
                        <>
                          <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5] text-emerald-600" /> Entrada
                        </>
                      ) : (
                        <>
                          <ArrowDownRight className="w-3.5 h-3.5 stroke-[2.5] text-rose-600" /> Saída
                        </>
                      )}
                    </span>
                  </td>
                  <td className="py-4 px-5 font-bold text-slate-800">
                    <div className="text-slate-900 font-extrabold">{tx.description}</div>
                    {tx.notes && (
                      <div className="text-xs text-slate-400 font-medium mt-0.5 max-w-sm truncate">
                        {tx.notes}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold">
                      {tx.category}
                    </span>
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <div className="font-semibold text-slate-700 text-xs">{tx.paymentMethod}</div>
                    {(() => {
                      if (tx.creditCardId) {
                        const card = creditCards.find((c) => c.id === tx.creditCardId);
                        if (card) {
                          return (
                            <div className="text-[11px] font-black text-indigo-700 flex items-center gap-1.5 mt-0.5">
                              <span
                                className="w-2 h-2 rounded-full inline-block shadow-2xs"
                                style={{ backgroundColor: card.color || '#6366f1' }}
                              />
                              <span>{card.name} (••{card.lastFourDigits})</span>
                            </div>
                          );
                        }
                      }
                      if (tx.bankAccountId && bankAccounts.length > 0) {
                        const acc = bankAccounts.find((a) => a.id === tx.bankAccountId);
                        if (acc) {
                          return (
                            <div className="text-[11px] font-black text-blue-700 flex items-center gap-1.5 mt-0.5">
                              <span
                                className="w-2 h-2 rounded-full inline-block shadow-2xs"
                                style={{ backgroundColor: acc.color || '#2563eb' }}
                              />
                              <span>{acc.name}</span>
                            </div>
                          );
                        }
                      }
                      return null;
                    })()}
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <button
                      onClick={() => onToggleStatus(tx.id)}
                      title="Clique para alternar entre Pago e Pendente"
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs ${
                        tx.status === 'pago'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {tx.status === 'pago' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Pago
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> Pendente
                        </>
                      )}
                    </button>
                  </td>
                  <td
                    className={`py-4 px-5 font-black text-right whitespace-nowrap ${
                      tx.type === 'entrada' ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {tx.type === 'entrada' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </td>
                  <td className="py-4 px-5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Editar lançamento"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Excluir lançamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400 font-medium">
                    <div className="max-w-sm mx-auto space-y-2">
                      <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-slate-600 font-bold">
                        Nenhuma movimentação em {showAllMonths ? 'todo o histórico' : formatMonthYear(currentMonth)}.
                      </p>
                      <p className="text-xs text-slate-400">
                        {showAllMonths
                          ? 'Cadastre novos lançamentos no botão acima.'
                          : `As movimentações de outros meses estão ocultas. Tudo o que lançar com data de ${monthNumber}/${currentMonth.slice(0, 4)} aparecerá automaticamente aqui.`}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Importar Extrato (.OFX e .CSV) */}
      <ImportStatementModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportConfirm={(list) => {
          if (onImportStatementTransactions) {
            onImportStatementTransactions(list);
          }
        }}
        existingTransactions={transactions}
        bankAccounts={bankAccounts}
        categories={categories}
      />

      {/* Modal: Contas Fixas & Recorrências */}
      <RecorrenciasModal
        isOpen={isRecorrenciasModalOpen}
        onClose={() => setIsRecorrenciasModalOpen(false)}
        recurringList={recurringList}
        onSaveRecurringList={(list) => {
          if (onSaveRecurringList) {
            onSaveRecurringList(list);
          }
        }}
        onGenerateMonthlyTransactions={(list) => {
          if (onGenerateMonthlyTransactions) {
            onGenerateMonthlyTransactions(list);
          }
        }}
        existingTransactions={transactions}
        currentMonth={currentMonth}
        categories={categories}
        bankAccounts={bankAccounts}
      />
    </div>
  );
};
