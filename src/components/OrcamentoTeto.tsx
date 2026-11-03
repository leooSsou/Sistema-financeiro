import React, { useState, useMemo } from 'react';
import { CategoryBudget, Transaction } from '../types/finance';
import { formatCurrency, formatMonthYear } from '../utils/formatters';
import {
  Target,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  X,
  Sparkles,
  PieChart as PieIcon,
  Info
} from 'lucide-react';

interface OrcamentoTetoProps {
  categoryBudgets: CategoryBudget[];
  transactions: Transaction[];
  categories: string[];
  onSaveBudgets: (budgets: CategoryBudget[]) => void;
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

export const OrcamentoTeto: React.FC<OrcamentoTetoProps> = ({
  categoryBudgets = [],
  transactions = [],
  categories = [],
  onSaveBudgets,
}) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string>('');
  const [inputLimit, setInputLimit] = useState<string>('');

  // Map of spent amount by category in selected month
  const spentByCategory = useMemo(() => {
    const map = new Map<string, number>();

    transactions
      .filter((t) => t.type === 'saida' && t.date && t.date.startsWith(selectedMonth))
      .forEach((t) => {
        map.set(t.category, (map.get(t.category) || 0) + t.amount);
      });

    return map;
  }, [transactions, selectedMonth]);

  // Merge categories with their configured budgets
  const budgetData = useMemo(() => {
    const budgetMap = new Map<string, number>();
    categoryBudgets.forEach((b) => budgetMap.set(b.category, b.monthlyLimit));

    return categories.map((cat) => {
      const limit = budgetMap.get(cat) || 0;
      const spent = spentByCategory.get(cat) || 0;
      const remaining = limit > 0 ? limit - spent : 0;
      const percent = limit > 0 ? (spent / limit) * 100 : 0;
      const isExceeded = limit > 0 && spent > limit;
      const isWarning = limit > 0 && percent >= 80 && !isExceeded;

      return {
        category: cat,
        limit,
        spent,
        remaining,
        percent,
        isExceeded,
        isWarning,
        hasLimit: limit > 0,
      };
    });
  }, [categories, categoryBudgets, spentByCategory]);

  // Overall totals
  const overallMetrics = useMemo(() => {
    const totalOrçado = budgetData.reduce((acc, b) => acc + b.limit, 0);
    const totalGasto = Array.from(spentByCategory.values()).reduce((acc, v) => acc + v, 0);
    const saldo = totalOrçado - totalGasto;
    const percentComprometido = totalOrçado > 0 ? (totalGasto / totalOrçado) * 100 : 0;
    const estouradasCount = budgetData.filter((b) => b.isExceeded).length;

    return {
      totalOrçado,
      totalGasto,
      saldo,
      percentComprometido,
      estouradasCount,
    };
  }, [budgetData, spentByCategory]);

  const handleOpenEdit = (catName: string, currentLim: number) => {
    setEditingCategory(catName);
    setInputLimit(currentLim > 0 ? currentLim.toString() : '');
    setIsEditModalOpen(true);
  };

  const handleSaveBudgetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(inputLimit.replace(',', '.')) || 0;

    const existingIndex = categoryBudgets.findIndex((b) => b.category === editingCategory);
    let updated: CategoryBudget[];

    if (existingIndex >= 0) {
      updated = [...categoryBudgets];
      if (parsed <= 0) {
        updated = updated.filter((b) => b.category !== editingCategory);
      } else {
        updated[existingIndex] = { category: editingCategory, monthlyLimit: parsed };
      }
    } else if (parsed > 0) {
      updated = [...categoryBudgets, { category: editingCategory, monthlyLimit: parsed }];
    } else {
      updated = [...categoryBudgets];
    }

    onSaveBudgets(updated);
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Month Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
              Orçamento & Teto de Gastos
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Defina tetos por categoria (Sistema de Envelopes) e receba alertas automáticos contra estouros.
            </p>
          </div>
        </div>

        {/* Month Selector Carousel */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setSelectedMonth(getPrevMonth(selectedMonth))}
            className="p-1.5 rounded-xl hover:bg-white text-slate-600 transition-colors"
            title="Mês Anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-black text-slate-800 px-3 min-w-[130px] text-center">
            {formatMonthYear(selectedMonth)}
          </span>
          <button
            onClick={() => setSelectedMonth(getNextMonth(selectedMonth))}
            className="p-1.5 rounded-xl hover:bg-white text-slate-600 transition-colors"
            title="Próximo Mês"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Orçado */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Teto Total Planejado
            </span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-800">
              {formatCurrency(overallMetrics.totalOrçado)}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Soma dos limites mensais definidos
            </p>
          </div>
        </div>

        {/* Total Real Gasto */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Gasto Real no Mês
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900">
              {formatCurrency(overallMetrics.totalGasto)}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Despesas efetivas de {formatMonthYear(selectedMonth)}
            </p>
          </div>
        </div>

        {/* Saldo Restante / Economia */}
        <div
          className={`p-5 rounded-3xl border shadow-sm flex flex-col justify-between ${
            overallMetrics.saldo >= 0
              ? 'bg-emerald-50/40 border-emerald-100'
              : 'bg-rose-50/50 border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-bold uppercase tracking-wider ${
                overallMetrics.saldo >= 0 ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              {overallMetrics.saldo >= 0 ? 'Margem Livre (Sobra)' : 'Estouro do Orçamento!'}
            </span>
            <div
              className={`p-2 rounded-xl ${
                overallMetrics.saldo >= 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {overallMetrics.saldo >= 0 ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-4">
            <h3
              className={`text-2xl font-black ${
                overallMetrics.saldo >= 0 ? 'text-emerald-700' : 'text-rose-600'
              }`}
            >
              {formatCurrency(Math.abs(overallMetrics.saldo))}
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              {overallMetrics.saldo >= 0 ? 'Dentro da meta planejada' : 'Atenção aos cortes de gastos!'}
            </p>
          </div>
        </div>

        {/* Comprometimento % */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-3xl text-white shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Uso do Orçamento
            </span>
            <div className="p-2 bg-white/10 rounded-xl">
              <PieIcon className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-white">
              {overallMetrics.percentComprometido.toFixed(1)}%
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              {overallMetrics.estouradasCount > 0
                ? `⚠️ ${overallMetrics.estouradasCount} categoria(s) estourada(s)`
                : 'Todas as categorias dentro do teto'}
            </p>
          </div>
        </div>
      </div>

      {/* Categories Budgets Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
            <span>Envelopes por Categoria</span>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
              {budgetData.length}
            </span>
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Clique no botão de lápis para alterar o limite de qualquer categoria.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetData.map((item) => {
            const hasLimit = item.hasLimit;
            const barColor = item.isExceeded
              ? 'bg-rose-500'
              : item.isWarning
              ? 'bg-amber-500'
              : 'bg-emerald-500';

            return (
              <div
                key={item.category}
                className={`bg-white p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-xs ${
                  item.isExceeded
                    ? 'border-rose-300 ring-1 ring-rose-300'
                    : 'border-slate-100 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-sm">{item.category}</h3>
                      <span className="text-xs text-slate-400 font-medium">
                        {hasLimit ? `Teto: ${formatCurrency(item.limit)}` : 'Sem teto definido'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {item.isExceeded && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Estourado!
                        </span>
                      )}
                      <button
                        onClick={() => handleOpenEdit(item.category, item.limit)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Definir / Editar Teto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Values Breakdown */}
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">
                        Gasto no Mês
                      </span>
                      <span className="text-lg font-black text-slate-900 mt-0.5 block">
                        {formatCurrency(item.spent)}
                      </span>
                    </div>

                    {hasLimit && (
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          {item.isExceeded ? 'Excedente' : 'Disponível'}
                        </span>
                        <span
                          className={`text-sm font-black mt-0.5 block ${
                            item.isExceeded ? 'text-rose-600' : 'text-emerald-700'
                          }`}
                        >
                          {formatCurrency(Math.abs(item.remaining))}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar Gauge */}
                  {hasLimit && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                        <span className="text-slate-500">Progresso do envelope</span>
                        <span
                          className={
                            item.isExceeded
                              ? 'text-rose-600'
                              : item.isWarning
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }
                        >
                          {item.percent.toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${Math.min(100, item.percent)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {!hasLimit && (
                    <button
                      onClick={() => handleOpenEdit(item.category, item.limit)}
                      className="mt-3 w-full py-2 border border-dashed border-slate-200 hover:border-blue-400 text-slate-400 hover:text-blue-600 text-xs font-bold rounded-xl transition-all"
                    >
                      + Definir teto para {item.category}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Definir Teto da Categoria */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-slate-800 text-base">Teto de Gastos</h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBudgetSubmit} className="p-6 space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Categoria
                </span>
                <span className="text-base font-black text-slate-900 block mt-0.5">
                  {editingCategory}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Limite Mensal Planejado (R$) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 800,00"
                  value={inputLimit}
                  onChange={(e) => setInputLimit(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Deixe em branco ou 0 para remover o teto desta categoria.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Salvar Teto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
