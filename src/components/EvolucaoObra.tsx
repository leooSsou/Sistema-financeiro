import React, { useState, useMemo } from 'react';
import { ObraEntry } from '../types/finance';
import { formatCurrency, formatDate, formatMonthYear } from '../utils/formatters';
import {
  HardHat,
  Plus,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Activity,
  Layers,
  Sparkles,
  Key,
  Calendar,
  X,
  Save,
  Check
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

interface EvolucaoObraProps {
  obraEntries: ObraEntry[];
  deliveryDate?: string;
  onUpdateDeliveryDate?: (date: string) => void;
  onAddEntry: () => void;
  onEditEntry: (entry: ObraEntry) => void;
  onDeleteEntry: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export const EvolucaoObra: React.FC<EvolucaoObraProps> = ({
  obraEntries,
  deliveryDate,
  onUpdateDeliveryDate,
  onAddEntry,
  onEditEntry,
  onDeleteEntry,
  onToggleStatus,
}) => {
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [inputDate, setInputDate] = useState(deliveryDate || '');
  const [isSavedTemp, setIsSavedTemp] = useState(false);

  const sortedEntries = useMemo(() => {
    return [...obraEntries].sort((a, b) => a.referenceMonth.localeCompare(b.referenceMonth));
  }, [obraEntries]);

  const displayEntries = useMemo(() => {
    return [...sortedEntries].reverse();
  }, [sortedEntries]);

  // Delivery Date Calculation
  const deliveryInfo = useMemo(() => {
    if (!deliveryDate) return null;
    const today = new Date();
    const parts = deliveryDate.split('-').map(Number);
    const y = parts[0];
    const m = parts[1];
    const d = parts[2] || 28;
    const targetDate = new Date(y, m - 1, d);

    const diffMs = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.max(0, (y - today.getFullYear()) * 12 + (m - 1 - today.getMonth()));

    const isDelivered = diffDays <= 0;

    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const formattedMonth = `${monthNames[m - 1] || ''} de ${y}`;

    return {
      dateStr: deliveryDate,
      formattedMonth,
      diffDays,
      diffMonths,
      isDelivered,
    };
  }, [deliveryDate]);

  const handleSaveDeliveryDate = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateDeliveryDate) {
      onUpdateDeliveryDate(inputDate);
    }
    setIsSavedTemp(true);
    setTimeout(() => {
      setIsSavedTemp(false);
      setIsDateModalOpen(false);
    }, 700);
  };

  const stats = useMemo(() => {
    const totalPago = sortedEntries
      .filter((e) => e.status === 'pago')
      .reduce((acc, e) => acc + e.amount, 0);

    const countPagos = sortedEntries.filter((e) => e.status === 'pago').length;
    const mediaMensal = countPagos > 0 ? totalPago / countPagos : 0;
    const latest = sortedEntries.length > 0 ? sortedEntries[sortedEntries.length - 1] : null;

    return {
      totalPago,
      mediaMensal,
      latestPercent: latest ? latest.evolutionPercent : 0,
      latestAmount: latest ? latest.amount : 0,
      totalRegistros: sortedEntries.length,
    };
  }, [sortedEntries]);

  const chartData = useMemo(() => {
    return sortedEntries.map((e) => {
      const [year, month] = e.referenceMonth.split('-');
      return {
        month: `${month}/${year.slice(2)}`,
        valor: e.amount,
        porcentagem: e.evolutionPercent,
      };
    });
  }, [sortedEntries]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/25">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Evolução de Obra & Medições
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Controle das taxas de medição e juros de obra da Caixa Econômica / Construtora.
            </p>
          </div>
        </div>

        <button
          onClick={onAddEntry}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-2xl font-black text-xs shadow-md shadow-amber-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Taxa de Obra</span>
        </button>
      </div>

      {/* Progress Milestone Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 rounded-3xl text-white shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Progresso da Construção
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
              {stats.latestPercent}% da obra concluída
            </h3>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Key Delivery Date Button/Badge */}
            <button
              onClick={() => {
                setInputDate(deliveryDate || '');
                setIsDateModalOpen(true);
              }}
              title="Clique para definir ou alterar a previsão de entrega das chaves"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-black border border-amber-500/40 transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
            >
              <Key className="w-4 h-4 text-amber-400 shrink-0" />
              {deliveryInfo ? (
                <span>
                  Chaves: {deliveryInfo.formattedMonth} •{' '}
                  <span className={deliveryInfo.isDelivered ? 'text-emerald-400' : 'text-amber-200 font-bold'}>
                    {deliveryInfo.isDelivered ? 'Entregues! 🎉' : `Faltam ${deliveryInfo.diffMonths} meses (${deliveryInfo.diffDays} dias)`}
                  </span>
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-300 font-bold">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Definir Previsão de Entrega das Chaves ➔</span>
                </span>
              )}
            </button>

            <span className="px-3 py-1.5 rounded-full bg-white/10 text-amber-200 text-xs font-black border border-white/10">
              Faltam {(100 - stats.latestPercent).toFixed(1)}% físico 🏗️
            </span>
          </div>
        </div>

        {/* Milestone Bar */}
        <div className="space-y-2">
          <div className="w-full bg-white/10 rounded-full h-3.5 overflow-hidden p-0.5">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-500 h-2.5 rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${Math.min(100, stats.latestPercent)}%` }}
            />
          </div>

          <div className="grid grid-cols-4 text-[11px] font-bold text-slate-400 pt-1">
            <span>Fundação (0%)</span>
            <span className="text-center">Estrutura (25%)</span>
            <span className="text-center">Alvenaria (50%)</span>
            <span className="text-right text-amber-300 flex items-center justify-end gap-1">
              <span>Entrega (100%)</span>
              {deliveryInfo && <span className="text-[10px] text-amber-400/80">({deliveryInfo.formattedMonth})</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Total Já Pago em Taxas
          </span>
          <div className="text-2xl font-black text-amber-800 mt-1 tracking-tight">
            {formatCurrency(stats.totalPago)}
          </div>
          <span className="text-xs font-medium text-slate-400 mt-0.5 block">
            Soma das medições quitadas
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Média Mensal da Taxa
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            {formatCurrency(stats.mediaMensal)}
          </div>
          <span className="text-xs font-medium text-slate-400 mt-0.5 block">
            Custo médio por mês
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Última Taxa Cobrada
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            {formatCurrency(stats.latestAmount)}
          </div>
          <span className="text-xs font-medium text-slate-400 mt-0.5 block">
            Referente à medição mais recente
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Total de Meses Registrados
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            {stats.totalRegistros} {stats.totalRegistros === 1 ? 'mês' : 'meses'}
          </div>
          <span className="text-xs font-medium text-slate-400 mt-0.5 block">
            Acompanhamento contínuo
          </span>
        </div>
      </div>

      {/* Evolution Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-600" />
              Histórico de Evolução: % Concluído vs. Taxa Cobrada (R$)
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              A taxa de juros de obra aumenta progressivamente conforme a medição física avança.
            </p>
          </div>
        </div>

        {chartData.length > 0 ? (
          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} stroke="#e2e8f0" />
                <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 11 }} stroke="#e2e8f0" />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  unit="%"
                  tick={{ fill: '#d97706', fontSize: 12, fontWeight: 700 }}
                  domain={[0, 100]}
                  stroke="#fef3c7"
                />
                <Tooltip
                  formatter={(val: number, name: string) =>
                    name === '% Concluído' ? `${val}%` : formatCurrency(val)
                  }
                  contentStyle={{ borderRadius: '16px', border: '1px solid #e2e8f0', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
                />
                <Legend wrapperStyle={{ paddingTop: '8px' }} />
                <Bar
                  yAxisId="left"
                  dataKey="valor"
                  name="Taxa de Obra (R$)"
                  fill="#f59e0b"
                  radius={[6, 6, 0, 0]}
                  barSize={32}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="porcentagem"
                  name="% Concluído"
                  stroke="#b45309"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#b45309' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-sm">
            <HardHat className="w-8 h-8 text-slate-300 mb-2" />
            Nenhum registro de taxa de obra cadastrado.
          </div>
        )}
      </div>

      {/* Obra Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
            Tabela de Medições e Mensalidades
          </h3>
          <span className="text-xs font-bold text-slate-400">
            {displayEntries.length} meses registrados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-400 text-[11px] font-black uppercase tracking-wider">
                <th className="py-4 px-5">Mês de Referência</th>
                <th className="py-4 px-5">% Obra Medida</th>
                <th className="py-4 px-5">Vencimento</th>
                <th className="py-4 px-5">Status</th>
                <th className="py-4 px-5">Observações</th>
                <th className="py-4 px-5 text-right">Valor Cobrado</th>
                <th className="py-4 px-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {displayEntries.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="py-4 px-5 font-black text-slate-900 whitespace-nowrap">
                    {formatMonthYear(entry.referenceMonth)}
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-24 bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-amber-500 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, entry.evolutionPercent)}%` }}
                        />
                      </div>
                      <span className="font-black text-amber-700 text-xs">
                        {entry.evolutionPercent}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-5 font-bold text-slate-600 whitespace-nowrap text-xs">
                    {formatDate(entry.dueDate)}
                  </td>
                  <td className="py-4 px-5 whitespace-nowrap">
                    <button
                      onClick={() => onToggleStatus(entry.id)}
                      title="Clique para alternar status"
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-2xs ${
                        entry.status === 'pago'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {entry.status === 'pago' ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Quitado
                        </>
                      ) : (
                        <>
                          <Clock className="w-3.5 h-3.5 text-amber-600" /> A Pagar
                        </>
                      )}
                    </button>
                  </td>
                  <td className="py-4 px-5 text-slate-500 text-xs max-w-xs truncate font-medium">
                    {entry.notes || '-'}
                  </td>
                  <td className="py-4 px-5 font-black text-right text-slate-900 whitespace-nowrap">
                    {formatCurrency(entry.amount)}
                  </td>
                  <td className="py-4 px-5 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEditEntry(entry)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteEntry(entry.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {displayEntries.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400 font-medium">
                    Nenhum registro de taxa de evolução de obra inserido até o momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Definir Previsão de Entrega das Chaves */}
      {isDateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2 text-amber-800">
                <Key className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-base">Previsão de Entrega das Chaves</h3>
              </div>
              <button
                onClick={() => setIsDateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDeliveryDate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Mês e Ano Previsto de Conclusão / Entrega *
                </label>
                <input
                  type="month"
                  required
                  value={inputDate}
                  onChange={(e) => setInputDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                  Consulte a data prevista no contrato da Caixa ou da construtora. O sistema calculará automaticamente os meses e dias restantes até a entrega das chaves.
                </p>
              </div>

              {inputDate && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200/60 text-xs text-amber-900 font-medium">
                  🔑 Data selecionada:{' '}
                  <strong>
                    {formatMonthYear ? formatMonthYear(inputDate) : inputDate}
                  </strong>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {isSavedTemp ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  <span>{isSavedTemp ? 'Salvo!' : 'Salvar Previsão'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
