import React, { useState, useMemo } from 'react';
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
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from 'recharts';
import { InvestmentAsset, InvestmentTransaction, AssetType } from '../types/finance';
import { formatCurrency } from '../utils/formatters';

interface InvestimentosProps {
  investments: InvestmentAsset[];
  transactions: InvestmentTransaction[];
  onSaveAsset: (asset: InvestmentAsset) => void;
  onDeleteAsset: (id: string) => void;
  onSaveTx: (tx: InvestmentTransaction) => void;
  onDeleteTx: (id: string) => void;
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
  onSaveAsset,
  onDeleteAsset,
  onSaveTx,
  onDeleteTx,
}) => {
  const [activeTab, setActiveTab] = useState<'ativos' | 'operacoes'>('ativos');

  // Modals state
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<InvestmentAsset | null>(null);

  const [isTxModalOpen, setIsTxModalOpen] = useState(false);

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
  const [txNotes, setTxNotes] = useState('');

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

  // Asset allocation pie data
  const pieData = useMemo(() => {
    const map: Record<string, number> = {};
    investments.forEach((a) => {
      const typeKey = a.type || 'outros';
      map[typeKey] = (map[typeKey] || 0) + (a.currentValue || 0);
    });

    return Object.entries(map).map(([type, value]) => ({
      name: ASSET_TYPE_LABELS[type as AssetType]?.label || type,
      value,
      color: ASSET_TYPE_LABELS[type as AssetType]?.color || '#64748b',
    })).filter((d) => d.value > 0);
  }, [investments]);

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

    onSaveTx(newTx);

    // If aporte, optionally update totalInvested and currentValue of the asset
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-900/40 p-6 rounded-3xl shadow-xl text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <TrendingUp className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
              Gestão de Patrimônio & Carteira
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Carteira de Investimentos
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Acompanhe a alocação de ativos entre Renda Fixa, Ações, FIIs e Cripto, sua rentabilidade
            global e o fluxo de dividendos e proventos recebidos.
          </p>
        </div>

        <div className="flex items-center gap-2">
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
        {/* Patrimônio Atual */}
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Patrimônio Investido</span>
            <Wallet className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalCurrent)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Custo aportado: {formatCurrency(totalInvested)}
          </p>
        </div>

        {/* Lucro / Rentabilidade Total */}
        <div
          className={`p-5 rounded-3xl border ${
            totalProfit >= 0
              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-700'
              : 'bg-rose-50/50 border-rose-200 text-rose-700'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Rentabilidade Total</span>
            {totalProfit >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          </div>
          <div className="text-2xl font-black">
            {formatCurrency(totalProfit)} ({totalProfitPercent >= 0 ? '+' : ''}
            {totalProfitPercent.toFixed(2)}%)
          </div>
          <p className="text-[11px] opacity-80 mt-1">Valorização patrimonial líquida.</p>
        </div>

        {/* Proventos & Dividendos */}
        <div className="p-5 rounded-3xl bg-indigo-50/50 border border-indigo-200 text-indigo-900">
          <div className="flex items-center justify-between text-indigo-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Proventos & Dividendos</span>
            <Sparkles className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-700">{formatCurrency(totalDividends)}</div>
          <p className="text-[11px] text-indigo-600/80 mt-1">
            Renda passiva gerada pelos seus ativos.
          </p>
        </div>

        {/* Quantidade de Ativos */}
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Diversificação</span>
            <PieIcon className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{investments.length} Ativos</div>
          <p className="text-[11px] text-slate-500 mt-1">Distribuídos em diferentes classes.</p>
        </div>
      </div>

      {/* Main Layout: Chart & Asset List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Allocation Donut Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm">Alocação por Classe</h3>
            <span className="text-xs text-slate-400">Distribuição %</span>
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

        {/* Right: List of Assets or Operations (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('ativos')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'ativos'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Meus Ativos ({investments.length})
              </button>
              <button
                onClick={() => setActiveTab('operacoes')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  activeTab === 'operacoes'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Histórico de Proventos & Aportes ({transactions.length})
              </button>
            </div>
          </div>

          {/* TAB 1: ASSETS */}
          {activeTab === 'ativos' && (
            <div className="space-y-3">
              {investments.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Sua carteira está vazia. Clique em <strong>+ Novo Ativo</strong> para cadastrar seu primeiro investimento!
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="p-3">Ativo / Código</th>
                        <th className="p-3">Tipo / Instituição</th>
                        <th className="p-3 text-right">Aportado</th>
                        <th className="p-3 text-right">Valor Atual</th>
                        <th className="p-3 text-right">Rentabilidade</th>
                        <th className="p-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {investments.map((asset) => {
                        const profit = (asset.currentValue || 0) - (asset.totalInvested || 0);
                        const pct = asset.totalInvested > 0 ? (profit / asset.totalInvested) * 100 : 0;
                        const meta = ASSET_TYPE_LABELS[asset.type] || ASSET_TYPE_LABELS.outros;

                        return (
                          <tr key={asset.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3">
                              <div className="font-bold text-slate-900">{asset.name}</div>
                              {asset.ticker && (
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">
                                  {asset.ticker}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <div
                                className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                                style={{ backgroundColor: meta.color }}
                              >
                                {meta.label.split(' ')[0]}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {asset.institution || 'Geral'}
                              </div>
                            </td>
                            <td className="p-3 text-right font-medium text-slate-600">
                              {formatCurrency(asset.totalInvested)}
                            </td>
                            <td className="p-3 text-right font-black text-slate-900">
                              {formatCurrency(asset.currentValue)}
                            </td>
                            <td className="p-3 text-right">
                              <span
                                className={`font-bold ${
                                  profit >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {profit >= 0 ? '+' : ''}
                                {formatCurrency(profit)} ({pct >= 0 ? '+' : ''}
                                {pct.toFixed(1)}%)
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenAssetModal(asset)}
                                  className="text-slate-400 hover:text-indigo-600 p-1 rounded hover:bg-slate-100"
                                  title="Editar ativo"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onDeleteAsset(asset.id)}
                                  className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100"
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
          )}

          {/* TAB 2: TRANSACTIONS / DIVIDENDS */}
          {activeTab === 'operacoes' && (
            <div className="space-y-3">
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
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((tx) => {
                        const asset = investments.find((a) => a.id === tx.assetId);
                        return (
                          <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-slate-600">{tx.date}</td>
                            <td className="p-3 font-bold text-slate-900">
                              {asset ? asset.name : 'Ativo Removido'}
                            </td>
                            <td className="p-3">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  tx.type === 'dividendo'
                                    ? 'bg-purple-100 text-purple-700'
                                    : tx.type === 'aporte'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {tx.type.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-3 text-right font-black text-slate-900">
                              {formatCurrency(tx.amount)}
                            </td>
                            <td className="p-3 text-slate-500">{tx.notes || '-'}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => onDeleteTx(tx.id)}
                                className="text-slate-400 hover:text-rose-600 p-1"
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
        </div>
      </div>

      {/* MODAL 1: CADASTRAR / EDITAR ATIVO */}
      {isAssetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {assetToEdit ? 'Editar Ativo' : 'Novo Ativo na Carteira'}
              </h3>
              <button
                onClick={() => setIsAssetModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAssetSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Nome do Investimento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tesouro Selic 2029, Itaú Unibanco, MXRF11"
                  value={aName}
                  onChange={(e) => setAName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Código / Ticker (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: ITUB4, MXRF11"
                    value={aTicker}
                    onChange={(e) => setATicker(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Classe do Ativo</label>
                  <select
                    value={aType}
                    onChange={(e) => setAType(e.target.value as AssetType)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="renda_fixa">🟢 Renda Fixa (CDB / Tesouro)</option>
                    <option value="acoes">🔵 Ações (B3)</option>
                    <option value="fiis">🟣 Fundos Imobiliários (FIIs)</option>
                    <option value="cripto">🟠 Criptoativos</option>
                    <option value="fundos">🔷 Fundos Multimercado</option>
                    <option value="outros">⚪ Outros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Corretora / Banco</label>
                  <input
                    type="text"
                    placeholder="Ex: XP, BTG, NuInvest, Inter"
                    value={aInstitution}
                    onChange={(e) => setAInstitution(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Rendimento Est. (% a.a.)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={aReturn}
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
                    value={aInvested || ''}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setAInvested(val);
                      if (!aCurrent || aCurrent === 0) setACurrent(val);
                    }}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Valor Atual de Mercado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={aCurrent || ''}
                    onChange={(e) => setACurrent(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold text-emerald-600"
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

      {/* MODAL 2: LANÇAR OPERAÇÃO / DIVIDENDO */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Lançar Provento / Operação</h3>
              <button
                onClick={() => setIsTxModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTxSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Ativo</label>
                <select
                  required
                  value={txAssetId}
                  onChange={(e) => setTxAssetId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  {investments.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.ticker || a.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Tipo de Operação</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-bold"
                  >
                    <option value="dividendo">🟣 Dividendo / Rendimento</option>
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
