import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  Plus,
  Trash2,
  Edit2,
  Building,
  Coins,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Wallet,
  Landmark,
  Layers,
  Search,
  RefreshCw,
  Target,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  LineChart as LineChartIcon,
  Percent,
  Award,
  Sliders,
  X,
  Info,
  Clock,
  Briefcase
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar
} from 'recharts';
import {
  InvestmentAsset,
  InvestmentTransaction,
  AssetType,
  BankAccount,
  Transaction,
  FinancialGoal
} from '../types/finance';
import { formatCurrency, formatDate } from '../utils/formatters';
import {
  marketService,
  StockQuote,
  MarketIndicators,
  CuratedAssetOpportunity,
  CURATED_OPPORTUNITIES
} from '../services/marketService';

interface InvestimentosProps {
  investments: InvestmentAsset[];
  transactions: InvestmentTransaction[];
  bankAccounts?: BankAccount[];
  allTransactions?: Transaction[];
  onSaveAsset: (asset: InvestmentAsset) => void;
  onDeleteAsset: (id: string) => void;
  onSaveTx: (tx: InvestmentTransaction, bankAccountId?: string) => void;
  onDeleteTx: (id: string) => void;
  onSaveGoal?: (goal: FinancialGoal) => void;
}

const ASSET_TYPE_LABELS: Record<AssetType, { label: string; color: string }> = {
  renda_fixa: { label: 'Renda Fixa (CDB/Tesouro)', color: '#10b981' },
  acoes: { label: 'Ações & Equities', color: '#3b82f6' },
  fiis: { label: 'Fundos Imobiliários (FIIs)', color: '#8b5cf6' },
  cripto: { label: 'Criptoativos', color: '#f59e0b' },
  fundos: { label: 'Fundos de Investimento', color: '#06b6d4' },
  outros: { label: 'Outros Ativos', color: '#64748b' },
};

export const Investimentos: React.FC<InvestimentosProps> = ({
  investments,
  transactions,
  bankAccounts = [],
  allTransactions = [],
  onSaveAsset,
  onDeleteAsset,
  onSaveTx,
  onDeleteTx,
  onSaveGoal,
}) => {
  const [activeTab, setActiveTab] = useState<'ativos' | 'mercado' | 'planejador' | 'operacoes'>('ativos');

  // Modals state
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<InvestmentAsset | null>(null);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

  // Buy Stock Modal
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState<number>(10);
  const [buyBankAccountId, setBuyBankAccountId] = useState<string>(bankAccounts[0]?.id || '');
  const [buyDate, setBuyDate] = useState<string>(new Date().toISOString().slice(0, 10));

  // Form states - Asset
  const [aName, setAName] = useState('');
  const [aTicker, setATicker] = useState('');
  const [aType, setAType] = useState<AssetType>('renda_fixa');
  const [aInstitution, setAInstitution] = useState('XP');
  const [aInvested, setAInvested] = useState<number>(0);
  const [aCurrent, setACurrent] = useState<number>(0);
  const [aQuantity, setAQuantity] = useState<number>(0);
  const [aAvgPrice, setAAvgPrice] = useState<number>(0);
  const [aReturn, setAReturn] = useState<number>(12);
  const [aNotes, setANotes] = useState('');

  // Form states - Transaction (Aporte, Dividendo, Resgate)
  const [txAssetId, setTxAssetId] = useState('');
  const [txType, setTxType] = useState<'aporte' | 'resgate' | 'dividendo' | 'juros_capital'>('dividendo');
  const [txDate, setTxDate] = useState(new Date().toISOString().slice(0, 10));
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txBankAccountId, setTxBankAccountId] = useState<string>(bankAccounts[0]?.id || '');
  const [txNotes, setTxNotes] = useState('');

  // Live Market State
  const [indicators, setIndicators] = useState<MarketIndicators | null>(null);
  const [loadingIndicators, setLoadingIndicators] = useState(false);
  const [assetQuotes, setAssetQuotes] = useState<Record<string, StockQuote>>({});
  const [loadingAssetQuotes, setLoadingAssetQuotes] = useState(false);

  // Market Radar State
  const [selectedTicker, setSelectedTicker] = useState<string>('WEGE3');
  const [radarSearch, setRadarSearch] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'dividendo' | 'crescimento' | 'valor' | 'fiis'>('all');
  const [radarQuote, setRadarQuote] = useState<StockQuote | null>(null);
  const [loadingRadarQuote, setLoadingRadarQuote] = useState(false);

  // Salary & Compound Interest Planner State
  const detectedSalary = useMemo(() => {
    const salaryTxs = allTransactions.filter(
      (t) =>
        t.type === 'entrada' &&
        (t.category === 'Salário / Renda' ||
          t.description.toLowerCase().includes('salário') ||
          t.description.toLowerCase().includes('salario') ||
          t.description.toLowerCase().includes('proventos'))
    );
    if (salaryTxs.length === 0) return 5000;
    const total = salaryTxs.reduce((sum, t) => sum + t.amount, 0);
    return Math.round(total / salaryTxs.length);
  }, [allTransactions]);

  const [salary, setSalary] = useState<number>(detectedSalary);
  const [savePercentage, setSavePercentage] = useState<number>(20); // 20%
  const [targetGoalAmount, setTargetGoalAmount] = useState<number>(200000); // 200k
  const [riskProfile, setRiskProfile] = useState<'conservador' | 'moderado' | 'arrojado'>('moderado');

  // Load Market Indicators on mount
  const loadIndicators = useCallback(async () => {
    setLoadingIndicators(true);
    try {
      const data = await marketService.fetchIndicators();
      setIndicators(data);
    } catch (err) {
      console.warn('Erro ao carregar indicadores:', err);
    } finally {
      setLoadingIndicators(false);
    }
  }, []);

  useEffect(() => {
    loadIndicators();
  }, [loadIndicators]);

  // Load quotes for user's owned assets
  const loadAssetQuotes = useCallback(async () => {
    const tickers = investments
      .map((a) => a.ticker?.trim().toUpperCase())
      .filter((t): t is string => Boolean(t && t.length >= 4));

    if (tickers.length === 0) return;

    setLoadingAssetQuotes(true);
    const newQuotes: Record<string, StockQuote> = {};

    await Promise.all(
      tickers.map(async (ticker) => {
        try {
          const q = await marketService.fetchQuote(ticker, '5d');
          if (q && q.price > 0) {
            newQuotes[ticker] = q;
          }
        } catch (err) {
          console.warn(`Erro ao buscar cotação de ${ticker}:`, err);
        }
      })
    );

    setAssetQuotes((prev) => ({ ...prev, ...newQuotes }));
    setLoadingAssetQuotes(false);
  }, [investments]);

  useEffect(() => {
    loadAssetQuotes();
  }, [loadAssetQuotes]);

  // Load Radar Quote when selectedTicker changes
  useEffect(() => {
    if (!selectedTicker) return;
    let isMounted = true;
    setLoadingRadarQuote(true);

    marketService.fetchQuote(selectedTicker, '1mo').then((q) => {
      if (isMounted) {
        setRadarQuote(q);
        setLoadingRadarQuote(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [selectedTicker]);

  // Calculations & KPIs
  const totalInvested = useMemo(() => {
    return investments.reduce((sum, a) => sum + (a.totalInvested || 0), 0);
  }, [investments]);

  const totalCurrent = useMemo(() => {
    return investments.reduce((sum, a) => sum + (a.currentValue || 0), 0);
  }, [investments]);

  const totalProfit = totalCurrent - totalInvested;
  const totalProfitPercent = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

  const totalDividends = useMemo(() => {
    return transactions
      .filter((t) => t.type === 'dividendo' || t.type === 'juros_capital')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);

  // Real-time Today Gains across portfolio
  const todayGains = useMemo(() => {
    let todayGainAmount = 0;
    let assetsCalculated = 0;

    investments.forEach((asset) => {
      const ticker = asset.ticker?.trim().toUpperCase();
      if (ticker && assetQuotes[ticker]) {
        const q = assetQuotes[ticker];
        const qty = asset.quantity || (asset.averagePrice && asset.averagePrice > 0 ? asset.currentValue / asset.averagePrice : 1);
        const gain = (q.change || 0) * qty;
        todayGainAmount += gain;
        assetsCalculated++;
      }
    });

    const percent = totalCurrent > 0 ? (todayGainAmount / totalCurrent) * 100 : 0;
    return {
      todayGainAmount,
      percent,
      assetsCalculated,
    };
  }, [investments, assetQuotes, totalCurrent]);

  // Asset allocation pie data
  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    investments.forEach((a) => {
      const typeKey = a.type || 'outros';
      map[typeKey] = (map[typeKey] || 0) + (a.currentValue || 0);
    });

    return Object.entries(map)
      .map(([type, value]) => ({
        name: ASSET_TYPE_LABELS[type as AssetType]?.label || type,
        value,
        color: ASSET_TYPE_LABELS[type as AssetType]?.color || '#64748b',
      }))
      .filter((d) => d.value > 0);
  }, [investments]);

  // Handlers
  const handleOpenAssetModal = (asset?: InvestmentAsset) => {
    if (asset) {
      setAssetToEdit(asset);
      setAName(asset.name);
      setATicker(asset.ticker || '');
      setAType(asset.type);
      setAInstitution(asset.institution || '');
      setAInvested(asset.totalInvested || 0);
      setACurrent(asset.currentValue || 0);
      setAQuantity(asset.quantity || 0);
      setAAvgPrice(asset.averagePrice || 0);
      setAReturn(asset.annualExpectedReturn || 12);
      setANotes(asset.notes || '');
    } else {
      setAssetToEdit(null);
      setAName('');
      setATicker('');
      setAType('renda_fixa');
      setAInstitution('XP');
      setAInvested(0);
      setACurrent(0);
      setAQuantity(0);
      setAAvgPrice(0);
      setAReturn(12);
      setANotes('');
    }
    setIsAssetModalOpen(true);
  };

  const handleSaveAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aName.trim()) return;

    const newAsset: InvestmentAsset = {
      id: assetToEdit ? assetToEdit.id : `inv-${Date.now()}`,
      name: aName.trim(),
      ticker: aTicker.trim().toUpperCase() || undefined,
      type: aType,
      institution: aInstitution.trim(),
      totalInvested: Number(aInvested),
      currentValue: Number(aCurrent || aInvested),
      quantity: aQuantity ? Number(aQuantity) : undefined,
      averagePrice: aAvgPrice ? Number(aAvgPrice) : undefined,
      annualExpectedReturn: aReturn ? Number(aReturn) : undefined,
      notes: aNotes || undefined,
    };

    onSaveAsset(newAsset);
    setIsAssetModalOpen(false);
  };

  const handleOpenTxModal = () => {
    if (investments.length === 0) return;
    setTxAssetId(investments[0].id);
    setTxType('dividendo');
    setTxDate(new Date().toISOString().slice(0, 10));
    setTxAmount(0);
    setTxBankAccountId(bankAccounts[0]?.id || '');
    setTxNotes('');
    setIsTxModalOpen(true);
  };

  const handleSaveTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAssetId || txAmount <= 0) return;

    const newTx: InvestmentTransaction = {
      id: `itx-${Date.now()}`,
      assetId: txAssetId,
      type: txType,
      date: txDate,
      amount: Number(txAmount),
      notes: txNotes || undefined,
    };

    onSaveTx(newTx, txBankAccountId || undefined);

    // If aporte, update asset
    const targetAsset = investments.find((a) => a.id === txAssetId);
    if (targetAsset) {
      if (txType === 'aporte') {
        onSaveAsset({
          ...targetAsset,
          totalInvested: targetAsset.totalInvested + Number(txAmount),
          currentValue: targetAsset.currentValue + Number(txAmount),
        });
      } else if (txType === 'resgate') {
        onSaveAsset({
          ...targetAsset,
          currentValue: Math.max(0, targetAsset.currentValue - Number(txAmount)),
        });
      }
    }

    setIsTxModalOpen(false);
  };

  // Sync Asset Current Value with Real-Time Market Price
  const handleSyncAssetWithMarket = (asset: InvestmentAsset) => {
    const ticker = asset.ticker?.trim().toUpperCase();
    if (!ticker || !assetQuotes[ticker]) return;

    const quote = assetQuotes[ticker];
    const qty = asset.quantity || 1;
    const newCurrent = Number((quote.price * qty).toFixed(2));

    onSaveAsset({
      ...asset,
      currentValue: newCurrent,
      averagePrice: asset.averagePrice || quote.price,
    });
  };

  // Buy Stock from Market Radar and Add directly to Portfolio
  const handleExecuteBuyStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!radarQuote || buyQuantity <= 0) return;

    const unitPrice = radarQuote.price;
    const totalCost = Number((unitPrice * buyQuantity).toFixed(2));

    const existing = investments.find(
      (a) => a.ticker?.toUpperCase() === radarQuote.symbol.toUpperCase()
    );

    const targetAssetId = existing ? existing.id : `inv-stock-${Date.now()}`;
    const newTotalInvested = (existing?.totalInvested || 0) + totalCost;
    const newQuantity = (existing?.quantity || 0) + buyQuantity;
    const newAvgPrice = newQuantity > 0 ? newTotalInvested / newQuantity : unitPrice;

    const assetToSave: InvestmentAsset = {
      id: targetAssetId,
      name: radarQuote.longName,
      ticker: radarQuote.symbol.toUpperCase(),
      type: radarQuote.symbol.endsWith('11') ? 'fiis' : 'acoes',
      institution: 'B3 (Corretora)',
      totalInvested: Number(newTotalInvested.toFixed(2)),
      currentValue: Number((unitPrice * newQuantity).toFixed(2)),
      quantity: newQuantity,
      averagePrice: Number(newAvgPrice.toFixed(2)),
      annualExpectedReturn: 12,
      notes: `Compra realizada no Radar B3 (${buyQuantity} cotas a R$ ${unitPrice.toFixed(2)})`,
    };

    onSaveAsset(assetToSave);

    // Record Aporte Transaction
    const newTx: InvestmentTransaction = {
      id: `itx-buy-${Date.now()}`,
      assetId: targetAssetId,
      type: 'aporte',
      date: buyDate,
      amount: totalCost,
      notes: `Compra de ${buyQuantity}x ${radarQuote.symbol} a R$ ${unitPrice.toFixed(2)}`,
    };
    onSaveTx(newTx, buyBankAccountId || undefined);

    setIsBuyModalOpen(false);
    setActiveTab('ativos');
  };

  // Salary & Compound Interest Calculations
  const plannerRate = riskProfile === 'conservador' ? 10.0 : riskProfile === 'moderado' ? 12.0 : 15.0;
  const monthlyContribution = Math.round((salary * savePercentage) / 100);

  const monthsToGoal = useMemo(() => {
    return marketService.monthsToReachGoal(targetGoalAmount, totalCurrent, monthlyContribution, plannerRate);
  }, [targetGoalAmount, totalCurrent, monthlyContribution, plannerRate]);

  const simulationData = useMemo(() => {
    const horizonMonths = Math.min(180, Math.max(12, monthsToGoal));
    return marketService.calculateCompoundInterest(totalCurrent, monthlyContribution, plannerRate, horizonMonths);
  }, [totalCurrent, monthlyContribution, plannerRate, monthsToGoal]);

  const projectedDateStr = useMemo(() => {
    if (!isFinite(monthsToGoal) || monthsToGoal <= 0) return 'Meta Já Alcançada!';
    const now = new Date();
    now.setMonth(now.getMonth() + monthsToGoal);
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${months[now.getMonth()]}/${now.getFullYear()}`;
  }, [monthsToGoal]);

  // Create Goal from Planner
  const handleCreateGoalFromPlanner = () => {
    if (!onSaveGoal) return;
    const now = new Date();
    now.setMonth(now.getMonth() + Math.min(600, monthsToGoal));
    const targetDate = now.toISOString().slice(0, 10);

    const newGoal: FinancialGoal = {
      id: `goal-plan-${Date.now()}`,
      title: `R$ ${targetGoalAmount.toLocaleString('pt-BR')} (Planejador Salarial)`,
      targetAmount: targetGoalAmount,
      currentAmount: totalCurrent,
      deadlineDate: targetDate,
      category: 'investimento',
      notes: `Poupando R$ ${monthlyContribution.toLocaleString('pt-BR')}/mês (${savePercentage}% do salário de R$ ${salary.toLocaleString('pt-BR')}) a ${plannerRate}% a.a.`,
    };

    onSaveGoal(newGoal);
    alert(`🎉 Meta "${newGoal.title}" criada com sucesso no módulo de Metas Financeiras!`);
  };

  // Filter curated opportunities
  const filteredOpportunities = useMemo(() => {
    return CURATED_OPPORTUNITIES.filter((opp) => {
      if (categoryFilter === 'all') return true;
      if (categoryFilter === 'fiis') return opp.type === 'fiis';
      return opp.category === categoryFilter;
    });
  }, [categoryFilter]);

  const selectedOppDetail = useMemo(() => {
    return CURATED_OPPORTUNITIES.find((o) => o.ticker === selectedTicker);
  }, [selectedTicker]);

  return (
    <div className="space-y-6">
      {/* Live Market Indicators Marquee Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-3.5 px-5 rounded-3xl shadow-lg border border-slate-700/60 text-white flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 font-bold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="uppercase tracking-wider text-[10px]">Mercado B3 & Índices:</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 font-semibold">
            <span>🇺🇸 Dólar:</span>
            <strong className="text-white">R$ {indicators?.dolar.toFixed(2) || '5,51'}</strong>
            <span className={indicators && indicators.dolarChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {indicators && indicators.dolarChange >= 0 ? '+' : ''}
              {indicators?.dolarChange || 0}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 font-semibold">
            <span>₿ Bitcoin:</span>
            <strong className="text-white">R$ {indicators?.bitcoin ? indicators.bitcoin.toLocaleString('pt-BR') : '412.800'}</strong>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 font-semibold">
            <span>🏛️ Selic:</span>
            <strong className="text-emerald-300">{indicators?.selic || 11.25}% a.a.</strong>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 font-semibold">
            <span>🏦 CDI:</span>
            <strong className="text-indigo-300">{indicators?.cdi || 11.15}% a.a.</strong>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 font-semibold">
            <span>📊 IPCA:</span>
            <strong className="text-amber-300">{indicators?.ipca || 4.10}%</strong>
          </div>
        </div>

        <button
          onClick={() => {
            loadIndicators();
            loadAssetQuotes();
          }}
          disabled={loadingIndicators || loadingAssetQuotes}
          className="flex items-center gap-1 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[11px] font-bold border border-slate-700 transition-all active:scale-95 disabled:opacity-50"
          title="Recarregar cotações agora"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${loadingIndicators || loadingAssetQuotes ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 rounded-3xl shadow-xl border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
              Gestão de Patrimônio & Terminal B3
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Carteira & Consultor de Investimentos
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Acompanhe suas ações e FIIs em tempo real pela B3, simule o impacto dos juros compostos sobre seu salário e identifique as melhores apostas de valor para o longo prazo.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleOpenAssetModal()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Ativo</span>
          </button>
          <button
            onClick={handleOpenTxModal}
            disabled={investments.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs border border-slate-700 transition-all active:scale-95"
          >
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Lançar Provento / Aporte</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Patrimônio Investido */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Patrimônio Atual</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalCurrent)}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Total aportado: <strong className="text-slate-700">{formatCurrency(totalInvested)}</strong>
          </p>
        </div>

        {/* Ganho do Dia Hoje (B3 API) */}
        <div
          className={`p-5 rounded-3xl border shadow-xs ${
            todayGains.todayGainAmount >= 0
              ? 'bg-emerald-50/60 border-emerald-200 text-emerald-800'
              : 'bg-rose-50/60 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Variação Hoje (B3)</span>
            {todayGains.todayGainAmount >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            ) : (
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
            )}
          </div>
          <div className="text-2xl font-black">
            {todayGains.todayGainAmount >= 0 ? '+' : ''}
            {formatCurrency(todayGains.todayGainAmount)}
            <span className="text-sm font-bold ml-1.5 opacity-90">
              ({todayGains.percent >= 0 ? '+' : ''}
              {todayGains.percent.toFixed(2)}%)
            </span>
          </div>
          <p className="text-[11px] opacity-80 mt-1">
            {todayGains.assetsCalculated > 0
              ? `Calculado via API para ${todayGains.assetsCalculated} ativo(s) da carteira.`
              : 'Adicione ações com ticker (ex: WEGE3) para acompanhar.'}
          </p>
        </div>

        {/* Rentabilidade Total Acumulada */}
        <div
          className={`p-5 rounded-3xl border shadow-xs ${
            totalProfit >= 0
              ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Lucro Histórico</span>
            <LineChartIcon className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-900">
            {totalProfit >= 0 ? '+' : ''}
            {formatCurrency(totalProfit)}
            <span className="text-sm font-bold ml-1.5 opacity-90">
              ({totalProfitPercent >= 0 ? '+' : ''}
              {totalProfitPercent.toFixed(1)}%)
            </span>
          </div>
          <p className="text-[11px] text-indigo-700/70 mt-1">Ganho de capital sobre os aportes.</p>
        </div>

        {/* Proventos & Dividendos */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Dividendos Recebidos</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{formatCurrency(totalDividends)}</div>
          <p className="text-[11px] text-slate-400 mt-1">
            Renda passiva acumulada e reinvestida.
          </p>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-200/70 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('ativos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'ativos'
              ? 'bg-white text-slate-900 shadow-md shadow-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Meus Ativos ({investments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('mercado')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'mercado'
              ? 'bg-white text-indigo-600 shadow-md shadow-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          <span>Radar B3 & Melhores Compras</span>
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">
            API Live
          </span>
        </button>

        <button
          onClick={() => setActiveTab('planejador')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'planejador'
              ? 'bg-white text-emerald-600 shadow-md shadow-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4 text-emerald-600" />
          <span>Planejador Salário ➔ Meta</span>
        </button>

        <button
          onClick={() => setActiveTab('operacoes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            activeTab === 'operacoes'
              ? 'bg-white text-slate-900 shadow-md shadow-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Extrato de Proventos ({transactions.length})</span>
        </button>
      </div>

      {/* TAB 1: MEUS ATIVOS & CARTEIRA */}
      {activeTab === 'ativos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Donut Chart: Alocação */}
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-sm">Alocação por Classe</h3>
              <span className="text-xs text-slate-400 font-medium">Distribuição %</span>
            </div>

            {pieData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
                <PieIcon className="w-8 h-8 text-slate-300 mb-2" />
                Nenhum ativo cadastrado para exibir o gráfico.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Table of Assets */}
          <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Meus Ativos em Carteira</h3>
                <p className="text-xs text-slate-400">Preço médio, cotação atual na B3 e rentabilidade líquida.</p>
              </div>
              <button
                onClick={() => handleOpenAssetModal()}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Ativo</span>
              </button>
            </div>

            {investments.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs space-y-3">
                <p>Sua carteira está vazia.</p>
                <button
                  onClick={() => setActiveTab('mercado')}
                  className="px-4 py-2 bg-indigo-50 text-indigo-700 font-black text-xs rounded-xl hover:bg-indigo-100 transition-all"
                >
                  Explorar Melhores Ações no Radar B3 →
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3">Ativo / Código</th>
                      <th className="p-3">Cotação Atual (B3)</th>
                      <th className="p-3 text-right">Qtd / Preço Médio</th>
                      <th className="p-3 text-right">Total Aportado</th>
                      <th className="p-3 text-right">Saldo Atual</th>
                      <th className="p-3 text-right">Rentabilidade</th>
                      <th className="p-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {investments.map((asset) => {
                      const ticker = asset.ticker?.trim().toUpperCase();
                      const quote = ticker ? assetQuotes[ticker] : null;
                      const profit = (asset.currentValue || 0) - (asset.totalInvested || 0);
                      const pct = asset.totalInvested > 0 ? (profit / asset.totalInvested) * 100 : 0;
                      const meta = ASSET_TYPE_LABELS[asset.type] || ASSET_TYPE_LABELS.outros;

                      return (
                        <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{asset.name}</div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {asset.ticker && (
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-black border border-slate-200">
                                  {asset.ticker}
                                </span>
                              )}
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.2 rounded-full text-white"
                                style={{ backgroundColor: meta.color }}
                              >
                                {meta.label.split(' ')[0]}
                              </span>
                            </div>
                          </td>

                          <td className="p-3">
                            {quote ? (
                              <div>
                                <span className="font-black text-slate-900 block">
                                  {formatCurrency(quote.price)}
                                </span>
                                <span
                                  className={`text-[10px] font-bold flex items-center gap-0.5 ${
                                    quote.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                  }`}
                                >
                                  {quote.changePercent >= 0 ? '▲ +' : '▼ '}
                                  {quote.changePercent}% hoje
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px]">
                                {asset.ticker ? 'Consultando...' : 'Manual'}
                              </span>
                            )}
                          </td>

                          <td className="p-3 text-right">
                            {asset.quantity ? (
                              <div>
                                <span className="font-bold text-slate-800 block">
                                  {asset.quantity} cotas
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  PM: {formatCurrency(asset.averagePrice || 0)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>

                          <td className="p-3 text-right font-medium text-slate-600">
                            {formatCurrency(asset.totalInvested)}
                          </td>

                          <td className="p-3 text-right font-black text-slate-900">
                            {formatCurrency(asset.currentValue)}
                          </td>

                          <td className="p-3 text-right">
                            <span
                              className={`font-black ${
                                profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                              }`}
                            >
                              {profit >= 0 ? '+' : ''}
                              {formatCurrency(profit)}
                              <div className="text-[10px]">
                                ({pct >= 0 ? '+' : ''}
                                {pct.toFixed(1)}%)
                              </div>
                            </span>
                          </td>

                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {quote && asset.quantity && (
                                <button
                                  onClick={() => handleSyncAssetWithMarket(asset)}
                                  className="text-emerald-600 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                                  title="Sincronizar saldo com a cotação de mercado atual"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenAssetModal(asset)}
                                className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                title="Editar ativo"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteAsset(asset.id)}
                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                                title="Excluir ativo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RADAR B3 & MELHORES COMPRAS PARA LONGO PRAZO */}
      {activeTab === 'mercado' && (
        <div className="space-y-6">
          {/* Filter Pills & Custom Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-400 mr-1">Filtrar por:</span>
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  categoryFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todas as Oportunidades
              </button>
              <button
                onClick={() => setCategoryFilter('crescimento')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  categoryFilter === 'crescimento'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                🚀 Crescimento & Qualidade
              </button>
              <button
                onClick={() => setCategoryFilter('dividendo')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  categoryFilter === 'dividendo'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                🥛 Vacas Leiteiras (Dividendos)
              </button>
              <button
                onClick={() => setCategoryFilter('fiis')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  categoryFilter === 'fiis'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                🏢 FIIs (Renda Isenta)
              </button>
            </div>

            {/* Custom Ticker Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Digitar ticker (ex: WEGE3, PETR4)..."
                value={radarSearch}
                onChange={(e) => setRadarSearch(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && radarSearch.trim()) {
                    setSelectedTicker(radarSearch.trim());
                  }
                }}
                className="w-full pl-9 pr-3 py-2 text-xs font-bold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
              />
            </div>
          </div>

          {/* Curated Grid of Assets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {filteredOpportunities.map((opp) => {
              const isSelected = selectedTicker === opp.ticker;
              return (
                <button
                  key={opp.ticker}
                  onClick={() => setSelectedTicker(opp.ticker)}
                  className={`p-3 rounded-2xl text-left border transition-all ${
                    isSelected
                      ? 'bg-gradient-to-b from-indigo-50 to-white border-indigo-500 shadow-md scale-105 ring-2 ring-indigo-500/20'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <span className="font-mono font-black text-sm text-slate-900 block">
                    {opp.ticker}
                  </span>
                  <span className="text-[11px] text-slate-500 truncate block mt-0.5">
                    {opp.name}
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 mt-2 inline-block">
                    {opp.tag.split(' ')[0]} {opp.tag.split(' ')[1]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Asset Deep Dive Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm">
            {/* Left: Chart & Live Quote (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                      {radarQuote?.symbol || selectedTicker}
                    </h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold border border-slate-200">
                      {selectedOppDetail?.sector || 'B3 Brasil'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {radarQuote?.longName || selectedOppDetail?.name || selectedTicker}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-black text-slate-900">
                    {radarQuote ? formatCurrency(radarQuote.price) : 'Carregando...'}
                  </div>
                  {radarQuote && (
                    <span
                      className={`text-xs font-bold inline-flex items-center gap-1 ${
                        radarQuote.changePercent >= 0 ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {radarQuote.changePercent >= 0 ? '▲ +' : '▼ '}
                      {formatCurrency(radarQuote.change)} ({radarQuote.changePercent}%) hoje
                    </span>
                  )}
                </div>
              </div>

              {/* Price Stats Strip */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Mín / Máx Dia
                  </span>
                  <strong className="text-slate-800 font-black">
                    {radarQuote?.dayLow ? formatCurrency(radarQuote.dayLow) : '—'} - {radarQuote?.dayHigh ? formatCurrency(radarQuote.dayHigh) : '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Faixa 52 Semanas
                  </span>
                  <strong className="text-slate-800 font-black">
                    {radarQuote?.fiftyTwoWeekLow ? formatCurrency(radarQuote.fiftyTwoWeekLow) : '—'} - {radarQuote?.fiftyTwoWeekHigh ? formatCurrency(radarQuote.fiftyTwoWeekHigh) : '—'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Volume Hoje
                  </span>
                  <strong className="text-slate-800 font-black">
                    {radarQuote?.volume ? radarQuote.volume.toLocaleString('pt-BR') : '—'}
                  </strong>
                </div>
              </div>

              {/* Chart: Historical Price Evolution */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Evolução da Cotação (Últimos 30 Dias)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Fonte: B3 Oficial</span>
                </div>

                <div className="h-60 w-full pt-2">
                  {loadingRadarQuote ? (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
                      Carregando gráfico da B3...
                    </div>
                  ) : radarQuote?.history && radarQuote.history.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={radarQuote.history}>
                        <defs>
                          <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(d) => d.slice(5)}
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={['auto', 'auto']}
                          tickFormatter={(v) => `R$${v}`}
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          formatter={(value: any) => [formatCurrency(Number(value)), 'Cotação']}
                          labelFormatter={(label) => formatDate(String(label))}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="#10b981"
                          strokeWidth={2.5}
                          fillOpacity={1}
                          fill="url(#priceGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                      Histórico temporariamente indisponível para este ativo.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Fundamentalist Thesis & Buy Button (5 cols) */}
            <div className="lg:col-span-5 bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2.5 py-1 rounded-full border border-emerald-300/50">
                    {selectedOppDetail?.tag || 'Análise Fundamentalista'}
                  </span>

                  <span className="text-xs font-bold text-slate-500">
                    Risco: <strong className="text-slate-800">{selectedOppDetail?.riskLevel || 'Moderado'}</strong>
                  </span>
                </div>

                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    Por que investir para o Longo Prazo?
                  </h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed mt-1.5">
                    {selectedOppDetail?.bullCase ||
                      'Empresa com sólida presença de mercado, geração de fluxo de caixa consistente e perfil atrativo de retorno sobre patrimônio líquido.'}
                  </p>
                </div>

                {/* Fundamental KPIs */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-white rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Dividend Yield Estimado
                    </span>
                    <span className="text-lg font-black text-emerald-600 mt-0.5 block">
                      {selectedOppDetail?.referenceYield || 6.5}% a.a.
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Retorno Anual Esperado
                    </span>
                    <span className="text-lg font-black text-indigo-600 mt-0.5 block">
                      ~{selectedOppDetail?.expectedAnnualReturn || 12.0}% a.a.
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Horizonte Sugerido
                    </span>
                    <span className="text-xs font-black text-slate-800 mt-1 block">
                      {selectedOppDetail?.targetHorizon || '5+ anos'}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-2xl border border-slate-200/80">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Segmento B3
                    </span>
                    <span className="text-xs font-black text-slate-800 mt-1 block truncate">
                      {selectedOppDetail?.sector || 'Ações B3'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button: BUY & ADD TO PORTFOLIO */}
              <div className="pt-4 border-t border-slate-200 space-y-2">
                <button
                  onClick={() => setIsBuyModalOpen(true)}
                  disabled={!radarQuote || radarQuote.price <= 0}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Comprar e Adicionar à Carteira</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center font-medium">
                  Integração automática: debita da conta bancária e atualiza seus ativos.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PLANEJADOR DE SALÁRIO & METAS */}
      {activeTab === 'planejador' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-6 sm:p-7 rounded-3xl text-white border border-emerald-500/20 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs uppercase font-black tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Simulador de Liberdade Financeira
              </span>
              <h3 className="text-2xl font-black tracking-tight text-white">
                Quanto poupar do seu Salário para atingir sua Meta?
              </h3>
              <p className="text-xs text-slate-300 max-w-2xl">
                Descubra em quantos meses ou anos você alcança seu objetivo e veja o poder multiplicador dos juros compostos trabalhando pelo seu dinheiro.
              </p>
            </div>

            <button
              onClick={handleCreateGoalFromPlanner}
              className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs rounded-2xl shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all self-start md:self-center shrink-0"
            >
              <Target className="w-4 h-4" />
              <span>Transformar em Meta Financeira</span>
            </button>
          </div>

          {/* Interactive Controls & Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Controls (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              {/* Salário Líquido Input */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Seu Salário Líquido Mensal (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="100"
                    value={salary || ''}
                    onChange={(e) => setSalary(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-9 pr-3 py-2 text-sm font-black rounded-xl border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Detectado automaticamente das suas movimentações de salário.
                </p>
              </div>

              {/* Meta Final Desejada */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Meta Financeira Desejada (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                  <input
                    type="number"
                    step="5000"
                    value={targetGoalAmount || ''}
                    onChange={(e) => setTargetGoalAmount(Math.max(1000, Number(e.target.value)))}
                    className="w-full pl-9 pr-3 py-2 text-sm font-black rounded-xl border border-slate-200 text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Target Presets */}
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  {[50000, 100000, 250000, 500000, 1000000].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setTargetGoalAmount(preset)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                        targetGoalAmount === preset
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset >= 1000000 ? '1 Milhão' : `R$ ${preset / 1000}k`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider: Quanto Guardar do Salário */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Quanto guardar todo mês:
                  </label>
                  <span className="text-xs font-black text-emerald-600">
                    {savePercentage}% ({formatCurrency(monthlyContribution)}/mês)
                  </span>
                </div>

                <input
                  type="range"
                  min="5"
                  max="60"
                  step="5"
                  value={savePercentage}
                  onChange={(e) => setSavePercentage(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />

                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>5% (Mínimo)</span>
                  <span>20% (Regra 50/30/20)</span>
                  <span>60% (Acelerado)</span>
                </div>
              </div>

              {/* Perfil de Rentabilidade */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 block">
                  Perfil de Rentabilidade Estimada:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setRiskProfile('conservador')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      riskProfile === 'conservador'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-black shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 font-semibold'
                    }`}
                  >
                    <span className="text-xs block">🛡️ Conservador</span>
                    <span className="text-[10px] text-emerald-600">10% a.a. (CDI)</span>
                  </button>

                  <button
                    onClick={() => setRiskProfile('moderado')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      riskProfile === 'moderado'
                        ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-black shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 font-semibold'
                    }`}
                  >
                    <span className="text-xs block">⚖️ Moderado</span>
                    <span className="text-[10px] text-indigo-600">12% a.a. (Misto)</span>
                  </button>

                  <button
                    onClick={() => setRiskProfile('arrojado')}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      riskProfile === 'arrojado'
                        ? 'bg-purple-50 border-purple-400 text-purple-950 font-black shadow-xs'
                        : 'bg-white border-slate-200 text-slate-600 font-semibold'
                    }`}
                  >
                    <span className="text-xs block">🚀 Arrojado</span>
                    <span className="text-[10px] text-purple-600">15% a.a. (Ações)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Projection Graph & Insights (7 cols) */}
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                    Tempo até a Conquista
                  </span>
                  <div className="text-xl font-black text-emerald-950 mt-1">
                    {isFinite(monthsToGoal)
                      ? `${Math.floor(monthsToGoal / 12)}a ${monthsToGoal % 12}m`
                      : 'Indefinido'}
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700">
                    Previsão: {projectedDateStr}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200/80">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 block">
                    Renda Passiva Mensal
                  </span>
                  <div className="text-xl font-black text-indigo-950 mt-1">
                    {formatCurrency(simulationData.monthlyPassiveIncomeEstimate)}/mês
                  </div>
                  <span className="text-[11px] font-bold text-indigo-700">
                    Sem gastar o principal!
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Juros Compostos Gerados
                  </span>
                  <div className="text-xl font-black text-slate-900 mt-1">
                    {formatCurrency(simulationData.totalInterest)}
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600">
                    Dinheiro trabalhando por você
                  </span>
                </div>
              </div>

              {/* Chart: Total Invested vs Total Accumulated */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Curva Exponencial: Aportes vs. Juros Compostos</span>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Do seu bolso
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Saldo com Juros
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={simulationData.timeline}>
                      <defs>
                        <linearGradient id="accumGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis
                        tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`}
                        tick={{ fontSize: 10, fill: '#94a3b8' }}
                      />
                      <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                      <Area
                        type="monotone"
                        dataKey="totalInvested"
                        name="Total que saiu do bolso"
                        stroke="#94a3b8"
                        strokeWidth={2}
                        fill="#f8fafc"
                      />
                      <Area
                        type="monotone"
                        dataKey="totalAccumulated"
                        name="Patrimônio Total Acumulado"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#accumGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: HISTÓRICO DE PROVENTOS & APORTES */}
      {activeTab === 'operacoes' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">Histórico de Proventos & Lançamentos</h3>
              <p className="text-xs text-slate-400">Todos os aportes, dividendos e resgates registrados.</p>
            </div>
            <button
              onClick={handleOpenTxModal}
              disabled={investments.length === 0}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Lançamento</span>
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Nenhum provento ou aporte registrado ainda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Ativo</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3 text-right">Valor</th>
                    <th className="p-3">Observações</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {transactions.map((tx) => {
                    const asset = investments.find((a) => a.id === tx.assetId);
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 text-slate-600">{formatDate(tx.date)}</td>
                        <td className="p-3 font-bold text-slate-900">
                          {asset ? asset.name : 'Ativo Removido'}
                          {asset?.ticker && (
                            <span className="font-mono text-[10px] text-slate-500 ml-1.5 font-semibold">
                              ({asset.ticker})
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <span
                            className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                              tx.type === 'dividendo' || tx.type === 'juros_capital'
                                ? 'bg-purple-100 text-purple-700'
                                : tx.type === 'aporte'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {tx.type === 'dividendo'
                              ? '🟣 Dividendo'
                              : tx.type === 'juros_capital'
                              ? '🔵 JCP'
                              : tx.type === 'aporte'
                              ? '🟢 Aporte'
                              : '🔴 Resgate'}
                          </span>
                        </td>
                        <td
                          className={`p-3 text-right font-black ${
                            tx.type === 'dividendo' || tx.type === 'juros_capital'
                              ? 'text-purple-700'
                              : tx.type === 'aporte'
                              ? 'text-emerald-600'
                              : 'text-rose-600'
                          }`}
                        >
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="p-3 text-slate-500 max-w-xs truncate">
                          {tx.notes || '—'}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => onDeleteTx(tx.id)}
                            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Excluir lançamento"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

      {/* MODAL: DIRECT BUY STOCK FROM RADAR */}
      {isBuyModalOpen && radarQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">Comprar {radarQuote.symbol}</h3>
                  <p className="text-xs text-emerald-100">{radarQuote.longName}</p>
                </div>
              </div>
              <button
                onClick={() => setIsBuyModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteBuyStock} className="p-5 space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs font-bold text-emerald-950">
                <span>Cotação Unitária B3:</span>
                <span className="text-base font-black text-emerald-700">
                  {formatCurrency(radarQuote.price)}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Quantidade de Ações / Cotas
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={buyQuantity}
                  onChange={(e) => setBuyQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-full px-3 py-2 text-sm font-black rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-600">Total do Investimento:</span>
                <span className="text-lg font-black text-slate-900">
                  {formatCurrency(radarQuote.price * buyQuantity)}
                </span>
              </div>

              {bankAccounts.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Conta Bancária para Débito
                  </label>
                  <select
                    value={buyBankAccountId}
                    onChange={(e) => setBuyBankAccountId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
                  >
                    <option value="">Não debitar saldo bancário</option>
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type}) - Saldo: R$ {acc.initialBalance.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Data da Compra</label>
                <input
                  type="date"
                  required
                  value={buyDate}
                  onChange={(e) => setBuyDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBuyModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-md transition-all active:scale-95"
                >
                  Confirmar Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANUAL ASSET CREATE / EDIT */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <h3 className="font-black text-base">
                {assetToEdit ? 'Editar Ativo' : 'Novo Investimento'}
              </h3>
              <button
                onClick={() => setIsAssetModalOpen(false)}
                className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAssetSubmit} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Nome do Ativo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: CDB 120% CDI, WEG ON, MXRF11..."
                  value={aName}
                  onChange={(e) => setAName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Código / Ticker</label>
                  <input
                    type="text"
                    placeholder="Ex: WEGE3, PETR4"
                    value={aTicker}
                    onChange={(e) => setATicker(e.target.value.toUpperCase())}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Classe de Ativo</label>
                  <select
                    value={aType}
                    onChange={(e) => setAType(e.target.value as AssetType)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="renda_fixa">Renda Fixa (CDB/Tesouro)</option>
                    <option value="acoes">Ações & Equities</option>
                    <option value="fiis">Fundos Imobiliários (FIIs)</option>
                    <option value="cripto">Criptoativos</option>
                    <option value="fundos">Fundos Multimercado</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Instituição / Corretora</label>
                  <input
                    type="text"
                    placeholder="Ex: XP, NuInvest, BTG"
                    value={aInstitution}
                    onChange={(e) => setAInstitution(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Retorno Anual Esperado (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="12"
                    value={aReturn || ''}
                    onChange={(e) => setAReturn(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Total Aportado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={aInvested || ''}
                    onChange={(e) => setAInvested(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Saldo Atual (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={aCurrent || ''}
                    onChange={(e) => setACurrent(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-black text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Quantidade de Cotas</label>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Ex: 50"
                    value={aQuantity || ''}
                    onChange={(e) => setAQuantity(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Preço Médio (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 35.50"
                    value={aAvgPrice || ''}
                    onChange={(e) => setAAvgPrice(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssetModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow-md transition-all"
                >
                  Salvar Ativo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROVENTO OU APORTE MANUAL */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <h3 className="font-black text-base">Lançar Operação / Provento</h3>
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="p-1 rounded-xl bg-white/10 hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTxSubmit} className="p-5 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Ativo</label>
                <select
                  value={txAssetId}
                  onChange={(e) => setTxAssetId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold"
                >
                  {investments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} {a.ticker ? `(${a.ticker})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Tipo de Lançamento</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold"
                  >
                    <option value="dividendo">🟣 Dividendo / Rendimento</option>
                    <option value="juros_capital">🔵 JCP (Juros Capital)</option>
                    <option value="aporte">🟢 Novo Aporte (+)</option>
                    <option value="resgate">🔴 Resgate (-)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Data</label>
                  <input
                    type="date"
                    required
                    value={txDate}
                    onChange={(e) => setTxDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={txAmount || ''}
                  onChange={(e) => setTxAmount(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-black text-slate-900"
                />
              </div>

              {bankAccounts.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-600">
                    {txType === 'dividendo' || txType === 'juros_capital' || txType === 'resgate'
                      ? 'Conta Bancária para Crédito (Entrada)'
                      : 'Conta Bancária para Débito (Saída)'}
                  </label>
                  <select
                    value={txBankAccountId}
                    onChange={(e) => setTxBankAccountId(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-800"
                  >
                    <option value="">Não movimentar saldo bancário</option>
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600">Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Rendimento referente ao mês 10/2026"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTxModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl shadow-md transition-all"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
