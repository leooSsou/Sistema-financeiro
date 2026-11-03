import React, { useState, useMemo } from 'react';
import { AppData } from '../types/finance';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  HardHat,
  Home,
  Calendar,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  Sparkles,
  CreditCard,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';

interface DashboardProps {
  data: AppData;
  onNavigateTab: (tab: string) => void;
  onOpenNewTx: () => void;
}

const CATEGORY_COLORS = [
  '#10b981', '#6366f1', '#f59e0b', '#ec4899', '#3b82f6',
  '#8b5cf6', '#14b8a6', '#f97316', '#64748b', '#06b6d4'
];

export const Dashboard: React.FC<DashboardProps> = ({
  data,
  onNavigateTab,
  onOpenNewTx,
}) => {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedPeriod, setSelectedPeriod] = useState<string>(currentMonthStr);

  // Available months
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(currentMonthStr);
    data.transactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        months.add(t.date.slice(0, 7));
      }
    });
    return Array.from(months).sort().reverse();
  }, [data.transactions, currentMonthStr]);

  // Filtered transactions according to selected period
  const filteredTransactions = useMemo(() => {
    if (selectedPeriod === 'all') return data.transactions;
    return data.transactions.filter((t) => t.date && t.date.startsWith(selectedPeriod));
  }, [data.transactions, selectedPeriod]);

  // Financial calculations
  const totalEntradas = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'entrada')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const totalSaidas = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === 'saida')
      .reduce((acc, t) => acc + t.amount, 0);
  }, [filteredTransactions]);

  const saldo = totalEntradas - totalSaidas;

  // Evolução de Obra calculations
  const totalObraPago = useMemo(() => {
    return data.obraEntries
      .filter((o) => o.status === 'pago')
      .reduce((acc, o) => acc + o.amount, 0);
  }, [data.obraEntries]);

  const latestObra = useMemo(() => {
    if (data.obraEntries.length === 0) return null;
    return [...data.obraEntries].sort((a, b) => b.referenceMonth.localeCompare(a.referenceMonth))[0];
  }, [data.obraEntries]);

  // Casa & Parcelamentos calculations
  const houseStats = useMemo(() => {
    let totalContratado = 0;
    let totalPago = 0;
    let totalRestante = 0;
    let parcelasRestantesCount = 0;

    data.houseInstallments.forEach((item) => {
      totalContratado += item.totalAmount;
      const paid = item.paidInstallments * item.installmentValue;
      const remainingInstallments = Math.max(0, item.totalInstallments - item.paidInstallments);
      const remainingAmount = remainingInstallments * item.installmentValue;

      totalPago += paid;
      totalRestante += remainingAmount;
      parcelasRestantesCount += remainingInstallments;
    });

    const percentAmortizado = totalContratado > 0 ? (totalPago / totalContratado) * 100 : 0;

    return {
      totalContratado,
      totalPago,
      totalRestante,
      parcelasRestantesCount,
      percentAmortizado,
    };
  }, [data.houseInstallments]);

  // Chart data: Monthly comparison (Last 6 months)
  const monthlyChartData = useMemo(() => {
    const map = new Map<string, { month: string; entradas: number; saidas: number }>();

    data.transactions.forEach((t) => {
      const m = t.date.slice(0, 7);
      if (!map.has(m)) {
        map.set(m, { month: m, entradas: 0, saidas: 0 });
      }
      const entry = map.get(m)!;
      if (t.type === 'entrada') entry.entradas += t.amount;
      else entry.saidas += t.amount;
    });

    return Array.from(map.values())
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6)
      .map((item) => {
        const [year, month] = item.month.split('-');
        return {
          ...item,
          displayName: `${month}/${year.slice(2)}`,
        };
      });
  }, [data.transactions]);

  // Chart data: Expenses by Category
  const categoryChartData = useMemo(() => {
    const map = new Map<string, number>();

    filteredTransactions
      .filter((t) => t.type === 'saida')
      .forEach((t) => {
        map.set(t.category, (map.get(t.category) || 0) + t.amount);
      });

    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  return (
    <div className="space-y-7">
      {/* Welcome & Filter Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-7 rounded-3xl shadow-xl text-white border border-slate-700/50">
        {/* Ambient decorative blurs */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -top-10 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Painel de Controle Financeiro</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Olá, {data.appSettings?.userName || 'Bem-vindo'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl">
              Acompanhe suas entradas, contas mensais, contas bancárias e evolução patrimonial em um único lugar.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Period Selector */}
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 text-white text-xs font-bold shadow-inner">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-white text-xs font-bold cursor-pointer pr-2"
              >
                <option value="all" className="text-slate-900 font-semibold">Todo o Histórico</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m} className="text-slate-900 font-semibold">
                    Mês: {m.slice(5, 7)}/{m.slice(0, 4)}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onOpenNewTx}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Saldo Líquido Card */}
        <div className="group relative overflow-hidden bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Saldo Líquido ({selectedPeriod === 'all' ? 'Geral' : 'Mês'})
            </span>
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${
                saldo >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
              }`}
            >
              <Wallet className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-3">
            <div
              className={`text-3xl font-black tracking-tight ${
                saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {formatCurrency(saldo)}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs font-semibold text-slate-500">
              <span>{saldo >= 0 ? 'Superávit positivo' : 'Déficit no período'}</span>
              <span className="text-slate-300">•</span>
              <span>Entradas − Saídas</span>
            </div>
          </div>
        </div>

        {/* Total Entradas Card */}
        <div className="group relative overflow-hidden bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Receitas / Entradas
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center transition-transform group-hover:scale-110">
              <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-slate-900">
              {formatCurrency(totalEntradas)}
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-xs font-bold text-emerald-600">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Receitas somadas automaticamente</span>
            </div>
          </div>
        </div>

        {/* Total Saídas Card */}
        <div className="group relative overflow-hidden bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Despesas / Saídas
            </span>
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center transition-transform group-hover:scale-110">
              <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
            </div>
          </div>

          <div className="mt-3">
            <div className="text-3xl font-black tracking-tight text-slate-900">
              {formatCurrency(totalSaidas)}
            </div>
            <div className="flex items-center gap-1 mt-1.5 text-xs font-bold text-rose-600">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Gastos consolidados no período</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Specialty Cards: Obra & Casa */}
      {(data.appSettings?.enabledModules?.obra !== false || data.appSettings?.enabledModules?.casa !== false) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Evolução de Obra Hero */}
          {data.appSettings?.enabledModules?.obra !== false && (
            <div
              onClick={() => onNavigateTab('obra')}
              className="group relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-white p-6 rounded-3xl border border-amber-200/80 shadow-xs hover:shadow-md hover:border-amber-400 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/25 group-hover:scale-105 transition-transform">
                    <HardHat className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base group-hover:text-amber-800 transition-colors">
                      Evolução de Obra
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Juros e medições da Caixa / Construtora</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  {data.appSettings?.houseDeliveryDate && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100/80 text-amber-900 border border-amber-300 text-[11px] font-black">
                      🔑 Chaves: {data.appSettings.houseDeliveryDate.slice(5, 7)}/{data.appSettings.houseDeliveryDate.slice(0, 4)}
                    </span>
                  )}
                  {latestObra && (
                    <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black shadow-xs">
                      {latestObra.evolutionPercent}% Concluído
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 pt-4 border-t border-amber-200/60">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Total Acumulado em Taxas
                  </span>
                  <p className="text-2xl font-black text-amber-800 mt-0.5">
                    {formatCurrency(totalObraPago)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Última Medição Mensal
                  </span>
                  <p className="text-2xl font-black text-slate-800 mt-0.5">
                    {latestObra ? formatCurrency(latestObra.amount) : 'R$ 0,00'}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end text-xs font-bold text-amber-700 group-hover:translate-x-1 transition-transform">
                <span>Acessar cronograma da obra →</span>
              </div>
            </div>
          )}

          {/* Financiamentos da Casa Hero */}
          {data.appSettings?.enabledModules?.casa !== false && (
            <div
              onClick={() => onNavigateTab('casa')}
              className="group relative overflow-hidden bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-white p-6 rounded-3xl border border-indigo-200/80 shadow-xs hover:shadow-md hover:border-indigo-400 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/25 group-hover:scale-105 transition-transform">
                    <Home className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-800 transition-colors">
                      Contratos da Casa
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">Móveis planejados, eletros e reformas</p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-indigo-100 text-indigo-900 text-xs font-black shadow-xs">
                  {houseStats.parcelasRestantesCount} parcelas a vencer
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4 pt-4 border-t border-indigo-200/60">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Saldo Devedor Restante
                  </span>
                  <p className="text-2xl font-black text-indigo-800 mt-0.5">
                    {formatCurrency(houseStats.totalRestante)}
                  </p>
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Progresso Quitado
                  </span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, houseStats.percentAmortizado)}%` }}
                      />
                    </div>
                    <span className="text-xs font-black text-indigo-800">
                      {houseStats.percentAmortizado.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-end text-xs font-bold text-indigo-700 group-hover:translate-x-1 transition-transform">
                <span>Ver parcelamentos da casa →</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Visual Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Entradas vs Saídas */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Comparativo Mensal
              </h3>
              <p className="text-xs text-slate-400 font-medium">Entradas vs. Saídas nos últimos meses</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
              Histórico
            </span>
          </div>

          {monthlyChartData.length > 0 ? (
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="displayName" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} stroke="#e2e8f0" />
                  <YAxis tick={{ fill: '#64748b', fontSize: 11 }} stroke="#e2e8f0" />
                  <Tooltip
                    formatter={(val: number) => formatCurrency(val)}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '8px' }} />
                  <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="saidas" name="Saídas" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
              <Clock className="w-8 h-8 text-slate-300 mb-2" />
              Nenhuma movimentação registrada no período.
            </div>
          )}
        </div>

        {/* Donut Chart: Despesas por Categoria */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">
                Despesas por Categoria
              </h3>
              <p className="text-xs text-slate-400 font-medium">Distribuição dos seus gastos</p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
              Categorias
            </span>
          </div>

          {categoryChartData.length > 0 ? (
            <div className="h-64 w-full flex items-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryChartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => formatCurrency(val)}
                    contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                  />
                  <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
              <Clock className="w-8 h-8 text-slate-300 mb-2" />
              Nenhuma despesa para exibir no período selecionado.
            </div>
          )}
        </div>
      </div>

      {/* Bottom Grid: Contratos Ativos & Últimos Lançamentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contratos da Casa */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Contratos da Casa em Andamento
            </h3>
            <button
              onClick={() => onNavigateTab('casa')}
              className="text-xs font-extrabold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-0.5"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {data.houseInstallments
              .filter((i) => i.paidInstallments < i.totalInstallments)
              .slice(0, 4)
              .map((item) => {
                const remaining = item.totalInstallments - item.paidInstallments;
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl border border-slate-100 bg-slate-50/70 flex items-center justify-between hover:bg-white hover:border-slate-200 transition-all duration-200 shadow-2xs"
                  >
                    <div>
                      <h5 className="font-extrabold text-slate-800 text-sm">{item.title}</h5>
                      <span className="text-xs text-slate-400 font-medium">
                        Dia {item.dueDay} • {item.supplier || item.category}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-slate-900 text-sm block">
                        {formatCurrency(item.installmentValue)}/mês
                      </span>
                      <span className="text-[11px] font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full inline-block mt-0.5">
                        Faltam {remaining} parcelas
                      </span>
                    </div>
                  </div>
                );
              })}

            {data.houseInstallments.every((i) => i.paidInstallments >= i.totalInstallments) && (
              <div className="p-8 text-center text-slate-400 text-sm font-medium">
                🎉 Todos os parcelamentos da casa estão quitados!
              </div>
            )}
          </div>
        </div>

        {/* Últimas Movimentações */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Últimas Movimentações
            </h3>
            <button
              onClick={() => onNavigateTab('movimentacoes')}
              className="text-xs font-extrabold text-emerald-600 hover:text-emerald-800 transition-colors flex items-center gap-0.5"
            >
              <span>Extrato completo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {filteredTransactions.slice(0, 4).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 bg-slate-50/60 hover:bg-white hover:border-slate-200 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                      tx.type === 'entrada'
                        ? 'bg-emerald-100/80 text-emerald-700'
                        : 'bg-rose-100/80 text-rose-700'
                    }`}
                  >
                    {tx.type === 'entrada' ? (
                      <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm leading-tight">
                      {tx.description}
                    </h5>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formatDate(tx.date)} • {tx.category}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-black text-sm block ${
                      tx.type === 'entrada' ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {tx.type === 'entrada' ? '+' : '-'} {formatCurrency(tx.amount)}
                  </span>
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      tx.status === 'pago'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                        : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                    }`}
                  >
                    {tx.status === 'pago' ? 'Pago' : 'Pendente'}
                  </span>
                </div>
              </div>
            ))}

            {filteredTransactions.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm font-medium">
                Nenhuma movimentação para exibir no período.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
