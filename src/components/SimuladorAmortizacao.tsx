import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Clock,
  PiggyBank,
  Sparkles,
  Calculator,
  ArrowRight,
  Plus,
  Trash2,
  BookmarkCheck,
  CheckCircle2,
  FileText,
  Sliders,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { AmortizationSimulation, OneTimeAmortization } from '../types/finance';
import { calculateAmortization } from '../utils/amortizationCalculator';
import { formatCurrency } from '../utils/formatters';

interface SimuladorAmortizacaoProps {
  simulations: AmortizationSimulation[];
  onSaveSimulation: (sim: AmortizationSimulation) => void;
  onDeleteSimulation: (id: string) => void;
}

export const SimuladorAmortizacao: React.FC<SimuladorAmortizacaoProps> = ({
  simulations,
  onSaveSimulation,
  onDeleteSimulation,
}) => {
  // Input parameters state
  const [title, setTitle] = useState('Financiamento Caixa (Exemplo)');
  const [financedAmount, setFinancedAmount] = useState<number>(250000);
  const [annualRate, setAnnualRate] = useState<number>(9.8);
  const [totalMonths, setTotalMonths] = useState<number>(360);
  const [financingType, setFinancingType] = useState<'SAC' | 'PRICE'>('SAC');
  const [monthlyExtra, setMonthlyExtra] = useState<number>(600);
  const [strategy, setStrategy] = useState<'prazo' | 'parcela'>('prazo');
  const [oneTimes, setOneTimes] = useState<OneTimeAmortization[]>([]);

  // UI state
  const [showTable, setShowTable] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New One-Time aporte inputs
  const [newOneTimeMonth, setNewOneTimeMonth] = useState<number>(12);
  const [newOneTimeAmount, setNewOneTimeAmount] = useState<number>(5000);
  const [newOneTimeDesc, setNewOneTimeDesc] = useState<string>('FGTS / 13º Salário');

  // Compute live simulation
  const { standard, accelerated } = useMemo(() => {
    return calculateAmortization(
      financedAmount || 0,
      annualRate || 0,
      totalMonths || 1,
      financingType,
      monthlyExtra || 0,
      strategy,
      oneTimes
    );
  }, [financedAmount, annualRate, totalMonths, financingType, monthlyExtra, strategy, oneTimes]);

  const yearsSaved = Math.floor(accelerated.monthsSaved / 12);
  const remainingMonthsSaved = accelerated.monthsSaved % 12;

  // Chart data: sample every 12 months (or every month if short)
  const chartData = useMemo(() => {
    const data: { month: number; label: string; padrao: number; comAporte: number }[] = [];
    const maxM = standard.schedule.length;
    const step = maxM > 60 ? 6 : 1;

    for (let m = 0; m <= maxM; m += step) {
      const monthNum = m === 0 ? 1 : m;
      const stdRow = standard.schedule[monthNum - 1];
      const accRow = accelerated.schedule[monthNum - 1];

      data.push({
        month: monthNum,
        label: `Mês ${monthNum}`,
        padrao: m === 0 ? financedAmount : (stdRow ? Math.round(stdRow.remainingBalance) : 0),
        comAporte: m === 0 ? financedAmount : (accRow ? Math.round(accRow.remainingBalance) : 0),
      });
    }

    // Ensure final month is included
    const lastStd = standard.schedule[standard.schedule.length - 1];
    if (lastStd && !data.some((d) => d.month === standard.schedule.length)) {
      data.push({
        month: standard.schedule.length,
        label: `Mês ${standard.schedule.length}`,
        padrao: 0,
        comAporte: 0,
      });
    }

    return data;
  }, [standard, accelerated, financedAmount]);

  const handleAddOneTime = () => {
    if (newOneTimeAmount <= 0 || newOneTimeMonth <= 0) return;
    const newAporte: OneTimeAmortization = {
      id: `aporte-${Date.now()}`,
      monthIndex: Number(newOneTimeMonth),
      amount: Number(newOneTimeAmount),
      description: newOneTimeDesc || 'Aporte Extra',
    };
    setOneTimes([...oneTimes, newAporte]);
    setNewOneTimeAmount(5000);
  };

  const handleRemoveOneTime = (id: string) => {
    setOneTimes(oneTimes.filter((o) => o.id !== id));
  };

  const handleSaveCurrent = () => {
    const sim: AmortizationSimulation = {
      id: `sim-${Date.now()}`,
      title: title || 'Simulação de Financiamento',
      financingType,
      financedAmount,
      annualInterestRate: annualRate,
      totalMonths,
      monthlyExtraAmortization: monthlyExtra,
      amortizationStrategy: strategy,
      oneTimeAmortizations: oneTimes,
    };
    onSaveSimulation(sim);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLoadSimulation = (sim: AmortizationSimulation) => {
    setTitle(sim.title);
    setFinancedAmount(sim.financedAmount);
    setAnnualRate(sim.annualInterestRate);
    setTotalMonths(sim.totalMonths);
    setFinancingType(sim.financingType);
    setMonthlyExtra(sim.monthlyExtraAmortization);
    setStrategy(sim.amortizationStrategy);
    setOneTimes(sim.oneTimeAmortizations || []);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 p-6 rounded-3xl shadow-xl text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400">
              Planejamento de Quitação Acelerada
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Super Simulador de Amortização
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Descubra como pequenos aportes extras mensais ou pontuais (FGTS, 13º) podem eliminar
            anos de dívida e economizar centenas de milhares de reais em juros bancários.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveCurrent}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            {savedSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-slate-950" />
                <span>Salvo com Sucesso!</span>
              </>
            ) : (
              <>
                <BookmarkCheck className="w-4 h-4" />
                <span>Salvar Cenário</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* KPI Savings Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Economia de Juros */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 backdrop-blur-sm">
          <div className="flex items-center justify-between text-emerald-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Economia em Juros</span>
            <PiggyBank className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {formatCurrency(accelerated.totalInterestSaved)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Dinheiro que deixa de ir para o banco e fica no seu bolso.
          </p>
        </div>

        {/* Tempo Reduzido */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-transparent border border-indigo-500/20 backdrop-blur-sm">
          <div className="flex items-center justify-between text-indigo-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Tempo Eliminado</span>
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-2xl font-black text-indigo-600">
            {yearsSaved > 0 && `${yearsSaved} ano${yearsSaved > 1 ? 's' : ''} `}
            {remainingMonthsSaved > 0 && `${remainingMonthsSaved} m${remainingMonthsSaved > 1 ? 'eses' : 'ês'}`}
            {yearsSaved === 0 && remainingMonthsSaved === 0 && '0 meses'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            De {standard.actualMonths} meses para {accelerated.actualMonths} meses (
            {(accelerated.actualMonths / 12).toFixed(1)} anos).
          </p>
        </div>

        {/* Total Pago Sem Amortização */}
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Custo Original (Sem Extras)</span>
            <Calculator className="w-5 h-5 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {formatCurrency(standard.actualTotalPaid)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Sendo {formatCurrency(standard.actualTotalInterest)} apenas em juros.
          </p>
        </div>

        {/* Total Pago Com Amortização */}
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-600 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Custo Com Aportes</span>
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="text-xl font-bold text-slate-800">
            {formatCurrency(accelerated.actualTotalPaid)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Inclui {formatCurrency(accelerated.totalExtraInvested)} de aportes extras.
          </p>
        </div>
      </div>

      {/* Main Simulator Form & Chart Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">Parâmetros do Financiamento</h3>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-slate-600">Título / Descrição</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Financed Amount */}
          <div>
            <div className="flex justify-between">
              <label className="text-xs font-semibold text-slate-600">Saldo Devedor / Valor Financiado</label>
              <span className="text-xs font-bold text-indigo-600">{formatCurrency(financedAmount)}</span>
            </div>
            <input
              type="number"
              min="1000"
              step="1000"
              value={financedAmount}
              onChange={(e) => setFinancedAmount(Math.max(0, Number(e.target.value)))}
              className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Grid: Rate & Months */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Taxa Juros Anual (% a.a.)</label>
              <input
                type="number"
                step="0.1"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-600">Prazo (Meses)</label>
              <input
                type="number"
                value={totalMonths}
                onChange={(e) => setTotalMonths(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-slate-400">{(totalMonths / 12).toFixed(1)} anos</span>
            </div>
          </div>

          {/* Financing Type Toggle (SAC vs PRICE) */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
              Sistema de Amortização
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFinancingType('SAC')}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                  financingType === 'SAC'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tabela SAC (Caixa)
                <span className="block text-[10px] font-normal opacity-80">Parcelas decrescentes</span>
              </button>
              <button
                type="button"
                onClick={() => setFinancingType('PRICE')}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all ${
                  financingType === 'PRICE'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Tabela PRICE
                <span className="block text-[10px] font-normal opacity-80">Parcelas fixas</span>
              </button>
            </div>
          </div>

          {/* Interactive Monthly Extra Slider */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-indigo-600" />
                Aporte Extra Recorrente Todo Mês
              </label>
              <span className="text-sm font-black text-indigo-700">
                {formatCurrency(monthlyExtra)}/mês
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="5000"
              step="50"
              value={monthlyExtra}
              onChange={(e) => setMonthlyExtra(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>R$ 0</span>
              <span>R$ 1.500</span>
              <span>R$ 3.000</span>
              <span>R$ 5.000+</span>
            </div>
          </div>

          {/* Strategy: Prazo vs Parcela */}
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">
              Estratégia ao Amortizar
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStrategy('prazo')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  strategy === 'prazo'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                Reduzir Prazo ⚡
                <span className="block text-[10px] font-normal opacity-90">Maior economia de juros</span>
              </button>
              <button
                type="button"
                onClick={() => setStrategy('parcela')}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  strategy === 'parcela'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                Reduzir Parcela 📉
                <span className="block text-[10px] font-normal opacity-90">Aliviar fluxo de caixa</span>
              </button>
            </div>
          </div>

          {/* One-Time Amortizations (FGTS, 13º) */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <span className="text-xs font-bold text-slate-700 flex items-center justify-between">
              <span>Aportes Pontuais (FGTS / 13º / Bônus)</span>
              <span className="text-[11px] font-normal text-slate-400">
                {oneTimes.length} cadastrado(s)
              </span>
            </span>

            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Mês (ex: 12)"
                title="No qual mês acontecerá o aporte"
                value={newOneTimeMonth}
                onChange={(e) => setNewOneTimeMonth(Number(e.target.value))}
                className="w-20 px-2 py-1.5 text-xs rounded-lg border border-slate-200"
              />
              <input
                type="number"
                placeholder="Valor (R$)"
                value={newOneTimeAmount}
                onChange={(e) => setNewOneTimeAmount(Number(e.target.value))}
                className="w-28 px-2 py-1.5 text-xs rounded-lg border border-slate-200"
              />
              <button
                type="button"
                onClick={handleAddOneTime}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-all"
              >
                + Adicionar
              </button>
            </div>

            {oneTimes.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {oneTimes.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between text-xs p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <div>
                      <span className="font-bold text-slate-700">Mês {o.monthIndex}: </span>
                      <span className="text-emerald-600 font-semibold">{formatCurrency(o.amount)}</span>
                      {o.description && (
                        <span className="text-[10px] text-slate-400 ml-1.5">({o.description})</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveOneTime(o.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Graph & Details (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Comparison Graph */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Curva de Quitação do Saldo Devedor
                </h3>
                <p className="text-xs text-slate-400">
                  Comparação do saldo devedor restante ao longo do tempo.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" />
                  Sem Aporte
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
                  Com Aportes Extras
                </span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPadrao" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorComAporte" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis
                    tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                  />
                  <Tooltip
                    formatter={(val: any) => formatCurrency(Number(val))}
                    labelFormatter={(label) => `${label}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="padrao"
                    name="Padrão"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPadrao)"
                  />
                  <Area
                    type="monotone"
                    dataKey="comAporte"
                    name="Com Aportes"
                    stroke="#10b981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorComAporte)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Saved Scenarios List */}
          {simulations.length > 0 && (
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <BookmarkCheck className="w-4 h-4 text-indigo-600" />
                  Cenários Salvos ({simulations.length})
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {simulations.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleLoadSimulation(s)}
                    className="p-3 rounded-2xl border border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-indigo-50/30 cursor-pointer transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-800 group-hover:text-indigo-900">
                        {s.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {formatCurrency(s.financedAmount)} • {s.financingType} • +{formatCurrency(s.monthlyExtraAmortization)}/mês
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSimulation(s.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Excluir cenário"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toggle Evolution Table */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowTable(!showTable)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
            >
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>{showTable ? 'Ocultar Tabela Mês a Mês' : 'Ver Tabela Completa Mês a Mês'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Evolution Table (Collapsible) */}
      {showTable && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Cronograma Detalhado da Dívida</h3>
              <p className="text-xs text-slate-400">
                Mostra como cada parcela amortiza a dívida e reduz os juros mês a mês.
              </p>
            </div>
            <input
              type="text"
              placeholder="Buscar mês (ex: 12)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 w-48"
            />
          </div>

          <div className="max-h-96 overflow-y-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="p-3">Mês</th>
                  <th className="p-3">Parcela Base</th>
                  <th className="p-3">Juros</th>
                  <th className="p-3">Amortização</th>
                  <th className="p-3">Aporte Extra</th>
                  <th className="p-3">Saldo Devedor Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {accelerated.schedule
                  .filter((row) => (!searchTerm ? true : String(row.month).includes(searchTerm)))
                  .slice(0, 120)
                  .map((row) => (
                    <tr key={row.month} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-semibold text-slate-700">Mês {row.month}</td>
                      <td className="p-3 text-slate-600">{formatCurrency(row.installment)}</td>
                      <td className="p-3 text-rose-600 font-medium">{formatCurrency(row.interest)}</td>
                      <td className="p-3 text-indigo-600 font-medium">{formatCurrency(row.amortization)}</td>
                      <td className="p-3 text-emerald-600 font-bold">
                        {row.extraAmortization > 0 ? formatCurrency(row.extraAmortization) : '-'}
                      </td>
                      <td className="p-3 font-bold text-slate-800">
                        {formatCurrency(row.remainingBalance)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {accelerated.schedule.length > 120 && (
            <p className="text-[11px] text-slate-400 text-center">
              Mostrando os primeiros 120 meses da projeção. O empréstimo encerra no mês {accelerated.actualMonths}!
            </p>
          )}
        </div>
      )}
    </div>
  );
};
