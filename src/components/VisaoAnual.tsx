import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PiggyBank,
  FileSpreadsheet,
  Layers,
  Sparkles
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
  Line,
  ComposedChart
} from 'recharts';
import { Transaction } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface VisaoAnualProps {
  transactions: Transaction[];
  categories: string[];
}

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export const VisaoAnual: React.FC<VisaoAnualProps> = ({
  transactions,
  categories,
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);

  // Group transactions for the selected year
  const yearData = useMemo(() => {
    // Array of 12 months (0 to 11)
    const months = Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i,
      monthName: MONTH_NAMES[i],
      monthStr: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
      incomes: 0,
      expenses: 0,
      balance: 0,
      savingsRate: 0,
      categoryIncomeMap: {} as Record<string, number>,
      categoryExpenseMap: {} as Record<string, number>,
    }));

    let yearIncomeTotal = 0;
    let yearExpenseTotal = 0;

    transactions.forEach((tx) => {
      if (!tx.date) return;
      const [y, m] = tx.date.split('-');
      if (Number(y) !== selectedYear) return;

      const mIdx = Number(m) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        const cat = tx.category || 'Outros';
        if (tx.type === 'entrada') {
          months[mIdx].incomes += tx.amount;
          yearIncomeTotal += tx.amount;
          months[mIdx].categoryIncomeMap[cat] =
            (months[mIdx].categoryIncomeMap[cat] || 0) + tx.amount;
        } else {
          months[mIdx].expenses += tx.amount;
          yearExpenseTotal += tx.amount;
          months[mIdx].categoryExpenseMap[cat] =
            (months[mIdx].categoryExpenseMap[cat] || 0) + tx.amount;
        }
      }
    });

    months.forEach((m) => {
      m.balance = m.incomes - m.expenses;
      m.savingsRate = m.incomes > 0 ? (m.balance / m.incomes) * 100 : 0;
    });

    const yearBalance = yearIncomeTotal - yearExpenseTotal;
    const yearSavingsRate =
      yearIncomeTotal > 0 ? (yearBalance / yearIncomeTotal) * 100 : 0;

    return {
      months,
      yearIncomeTotal,
      yearExpenseTotal,
      yearBalance,
      yearSavingsRate,
    };
  }, [transactions, selectedYear]);

  // Distinct categories with spending in this year
  const activeExpenseCategories = useMemo(() => {
    const set = new Set<string>();
    yearData.months.forEach((m) => {
      Object.keys(m.categoryExpenseMap).forEach((c) => set.add(c));
    });
    return Array.from(set).sort();
  }, [yearData]);

  const activeIncomeCategories = useMemo(() => {
    const set = new Set<string>();
    yearData.months.forEach((m) => {
      Object.keys(m.categoryIncomeMap).forEach((c) => set.add(c));
    });
    return Array.from(set).sort();
  }, [yearData]);

  // Chart data
  const chartData = useMemo(() => {
    return yearData.months.map((m) => ({
      name: m.monthName,
      Receitas: Math.round(m.incomes),
      Despesas: Math.round(m.expenses),
      Saldo: Math.round(m.balance),
    }));
  }, [yearData]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner with Year Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-900/40 p-6 rounded-3xl shadow-xl text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Calendar className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-purple-400">
              Demonstrativo Consolidado Anual
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Visão Anual & DRE Financeiro ({selectedYear})
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Acompanhe o comportamento das suas receitas e despesas mês a mês ao longo dos 12 meses,
            identificando sazonalidades e sua capacidade anual de poupança.
          </p>
        </div>

        {/* Year Navigator */}
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 p-1.5 rounded-2xl">
          <button
            onClick={() => setSelectedYear((y) => y - 1)}
            className="p-1.5 rounded-xl hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            title="Ano Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="px-3 text-base font-black text-white">{selectedYear}</span>
          <button
            onClick={() => setSelectedYear((y) => y + 1)}
            className="p-1.5 rounded-xl hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
            title="Próximo Ano"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Receita Total do Ano */}
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Receitas no Ano</span>
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {formatCurrency(yearData.yearIncomeTotal)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Média mensal: {formatCurrency(yearData.yearIncomeTotal / 12)}/mês
          </p>
        </div>

        {/* Despesas Totais do Ano */}
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-rose-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Despesas no Ano</span>
            <ArrowDownRight className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {formatCurrency(yearData.yearExpenseTotal)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Média de custos: {formatCurrency(yearData.yearExpenseTotal / 12)}/mês
          </p>
        </div>

        {/* Saldo Líquido do Ano */}
        <div
          className={`p-5 rounded-3xl border ${
            yearData.yearBalance >= 0
              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50/50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Resultado Acumulado</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black">{formatCurrency(yearData.yearBalance)}</div>
          <p className="text-[11px] opacity-80 mt-1">
            {yearData.yearBalance >= 0 ? 'Superávit líquido no ano.' : 'Déficit no ano.'}
          </p>
        </div>

        {/* Taxa de Poupança Média */}
        <div className="p-5 rounded-3xl bg-purple-50/50 border border-purple-200 text-purple-900">
          <div className="flex items-center justify-between text-purple-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Taxa de Poupança</span>
            <PiggyBank className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-700">
            {yearData.yearSavingsRate.toFixed(1)}%
          </div>
          <p className="text-[11px] text-purple-600/80 mt-1">
            Do total faturado, esta fatia foi preservada.
          </p>
        </div>
      </div>

      {/* Chart: Composed Bar & Line (12 Months Evolution) */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Evolução Mensal (Receitas vs Despesas)</h3>
            <p className="text-xs text-slate-400">Comparativo mês a mês dos 12 meses de {selectedYear}.</p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                tick={{ fontSize: 10, fill: '#64748b' }}
              />
              <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="Saldo"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 4, fill: '#8b5cf6' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Complete DRE Horizontal Table (12 Months Side by Side) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Demonstrativo de Resultado do Exercício (DRE)</h3>
            <p className="text-xs text-slate-400">
              Matriz contábil detalhada com todas as categorias de Janeiro a Dezembro.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead className="bg-slate-900 text-white font-bold">
              <tr>
                <th className="p-3 sticky left-0 bg-slate-900 z-10 min-w-[200px]">Categoria / Mês</th>
                {MONTH_NAMES.map((m) => (
                  <th key={m} className="p-3 text-right min-w-[90px]">{m}</th>
                ))}
                <th className="p-3 text-right bg-slate-800 min-w-[110px]">TOTAL ANO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* SECTION: RECEITAS */}
              <tr className="bg-emerald-50/60 font-bold text-emerald-950">
                <td className="p-2.5 sticky left-0 bg-emerald-50/90 z-10 flex items-center gap-1.5">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                  RECEITAS / ENTRADAS
                </td>
                {yearData.months.map((m) => (
                  <td key={m.monthIndex} className="p-2.5 text-right font-black text-emerald-700">
                    {m.incomes > 0 ? formatCurrency(m.incomes) : '-'}
                  </td>
                ))}
                <td className="p-2.5 text-right font-black text-emerald-800 bg-emerald-100/50">
                  {formatCurrency(yearData.yearIncomeTotal)}
                </td>
              </tr>

              {/* Sub-rows: Categories of Income */}
              {activeIncomeCategories.map((cat) => {
                let catYearSum = 0;
                return (
                  <tr key={cat} className="hover:bg-slate-50 text-slate-600">
                    <td className="p-2 pl-6 sticky left-0 bg-white z-10 text-[11px] truncate max-w-[200px]">
                      {cat}
                    </td>
                    {yearData.months.map((m) => {
                      const val = m.categoryIncomeMap[cat] || 0;
                      catYearSum += val;
                      return (
                        <td key={m.monthIndex} className="p-2 text-right text-[11px]">
                          {val > 0 ? formatCurrency(val) : '-'}
                        </td>
                      );
                    })}
                    <td className="p-2 text-right font-bold text-slate-800 bg-slate-50 text-[11px]">
                      {formatCurrency(catYearSum)}
                    </td>
                  </tr>
                );
              })}

              {/* SECTION: DESPESAS */}
              <tr className="bg-rose-50/60 font-bold text-rose-950">
                <td className="p-2.5 sticky left-0 bg-rose-50/90 z-10 flex items-center gap-1.5">
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-600" />
                  DESPESAS / SAÍDAS
                </td>
                {yearData.months.map((m) => (
                  <td key={m.monthIndex} className="p-2.5 text-right font-black text-rose-700">
                    {m.expenses > 0 ? formatCurrency(m.expenses) : '-'}
                  </td>
                ))}
                <td className="p-2.5 text-right font-black text-rose-800 bg-rose-100/50">
                  {formatCurrency(yearData.yearExpenseTotal)}
                </td>
              </tr>

              {/* Sub-rows: Categories of Expense */}
              {activeExpenseCategories.map((cat) => {
                let catYearSum = 0;
                return (
                  <tr key={cat} className="hover:bg-slate-50 text-slate-600">
                    <td className="p-2 pl-6 sticky left-0 bg-white z-10 text-[11px] truncate max-w-[200px]">
                      {cat}
                    </td>
                    {yearData.months.map((m) => {
                      const val = m.categoryExpenseMap[cat] || 0;
                      catYearSum += val;
                      return (
                        <td key={m.monthIndex} className="p-2 text-right text-[11px]">
                          {val > 0 ? formatCurrency(val) : '-'}
                        </td>
                      );
                    })}
                    <td className="p-2 text-right font-bold text-slate-800 bg-slate-50 text-[11px]">
                      {formatCurrency(catYearSum)}
                    </td>
                  </tr>
                );
              })}

              {/* RESULTADO LÍQUIDO MENSAL */}
              <tr className="bg-slate-900 text-white font-bold">
                <td className="p-3 sticky left-0 bg-slate-900 z-10">
                  SALDO OPERACIONAL
                </td>
                {yearData.months.map((m) => (
                  <td
                    key={m.monthIndex}
                    className={`p-3 text-right font-black ${
                      m.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {formatCurrency(m.balance)}
                  </td>
                ))}
                <td
                  className={`p-3 text-right font-black bg-slate-950 ${
                    yearData.yearBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatCurrency(yearData.yearBalance)}
                </td>
              </tr>

              {/* TAXA DE POUPANÇA */}
              <tr className="bg-slate-100 font-bold text-slate-700">
                <td className="p-2.5 sticky left-0 bg-slate-100 z-10 text-[11px]">
                  Taxa de Poupança (%)
                </td>
                {yearData.months.map((m) => (
                  <td key={m.monthIndex} className="p-2.5 text-right text-[11px]">
                    {m.savingsRate.toFixed(0)}%
                  </td>
                ))}
                <td className="p-2.5 text-right font-black bg-slate-200 text-purple-700 text-[11px]">
                  {yearData.yearSavingsRate.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
