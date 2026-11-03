import React, { useState, useMemo } from 'react';
import { HouseInstallment } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import {
  Home,
  Plus,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  MinusCircle,
  PlusCircle,
  Sparkles,
  ShoppingBag
} from 'lucide-react';

interface CasaParcelamentosProps {
  installments: HouseInstallment[];
  onAddInstallment: () => void;
  onEditInstallment: (item: HouseInstallment) => void;
  onDeleteInstallment: (id: string) => void;
  onPayNextInstallment: (item: HouseInstallment, registerExpense: boolean) => void;
  onUndoInstallment: (item: HouseInstallment) => void;
}

export const CasaParcelamentos: React.FC<CasaParcelamentosProps> = ({
  installments,
  onAddInstallment,
  onEditInstallment,
  onDeleteInstallment,
  onPayNextInstallment,
  onUndoInstallment,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ativos' | 'quitados'>('all');

  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    installments.forEach((i) => cats.add(i.category));
    return Array.from(cats);
  }, [installments]);

  const filteredItems = useMemo(() => {
    return installments.filter((item) => {
      const isCompleted = item.paidInstallments >= item.totalInstallments;
      if (filterStatus === 'ativos' && isCompleted) return false;
      if (filterStatus === 'quitados' && !isCompleted) return false;
      if (filterCategory !== 'all' && item.category !== filterCategory) return false;
      return true;
    });
  }, [installments, filterCategory, filterStatus]);

  const stats = useMemo(() => {
    let totalInvestido = 0;
    let totalPago = 0;
    let totalRestante = 0;
    let parcelasRestantes = 0;
    let parcelasPagasCount = 0;

    installments.forEach((i) => {
      totalInvestido += i.totalAmount;
      const paid = i.paidInstallments * i.installmentValue;
      const remainingCount = Math.max(0, i.totalInstallments - i.paidInstallments);
      const remainingVal = remainingCount * i.installmentValue;

      totalPago += paid;
      totalRestante += remainingVal;
      parcelasRestantes += remainingCount;
      parcelasPagasCount += i.paidInstallments;
    });

    const percentGeral = totalInvestido > 0 ? (totalPago / totalInvestido) * 100 : 0;

    return {
      totalInvestido,
      totalPago,
      totalRestante,
      parcelasRestantes,
      parcelasPagasCount,
      percentGeral,
      totalItens: installments.length,
    };
  }, [installments]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-xs border border-slate-200/80">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-indigo-600/25">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Contratos & Financiamentos da Casa
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Controle de compras parceladas, móveis planejados, eletros e reformas.
            </p>
          </div>
        </div>

        <button
          onClick={onAddInstallment}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-2xl font-black text-xs shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Item / Contrato</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
            Total Contratado na Casa
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1 tracking-tight">
            {formatCurrency(stats.totalInvestido)}
          </div>
          <span className="text-xs font-medium text-slate-400 mt-0.5 block">
            {stats.totalItens} contratos registrados
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
            Total Já Quitado
          </span>
          <div className="text-2xl font-black text-emerald-600 mt-1 tracking-tight">
            {formatCurrency(stats.totalPago)}
          </div>
          <span className="text-xs font-medium text-slate-400 mt-0.5 block">
            {stats.parcelasPagasCount} parcelas pagas
          </span>
        </div>

        <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-white p-5 rounded-3xl border border-indigo-200/80 shadow-xs">
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700">
            Saldo Restante a Pagar
          </span>
          <div className="text-2xl font-black text-indigo-800 mt-1 tracking-tight">
            {formatCurrency(stats.totalRestante)}
          </div>
          <span className="text-xs font-black text-amber-600 mt-0.5 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Faltam {stats.parcelasRestantes} parcelas
          </span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Quitação Global
            </span>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
              {stats.percentGeral.toFixed(0)}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-indigo-700 h-3 rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, stats.percentGeral)}%` }}
            />
          </div>
          <span className="text-xs font-medium text-slate-400 mt-1 block text-right">
            {formatCurrency(stats.totalPago)} de {formatCurrency(stats.totalInvestido)}
          </span>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-black text-slate-400 uppercase mr-1 tracking-wider">
            Status:
          </span>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({installments.length})
          </button>
          <button
            onClick={() => setFilterStatus('ativos')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'ativos'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Em Aberto ({installments.filter((i) => i.paidInstallments < i.totalInstallments).length})
          </button>
          <button
            onClick={() => setFilterStatus('quitados')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'quitados'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Quitados ({installments.filter((i) => i.paidInstallments >= i.totalInstallments).length})
          </button>
        </div>

        {availableCategories.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
              Categoria:
            </span>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas as categorias</option>
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Grid of Contracts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredItems.map((item) => {
          const remainingCount = Math.max(0, item.totalInstallments - item.paidInstallments);
          const paidAmount = item.paidInstallments * item.installmentValue;
          const remainingAmount = remainingCount * item.installmentValue;
          const progressPercent = item.totalInstallments > 0 ? (item.paidInstallments / item.totalInstallments) * 100 : 0;
          const isFinished = remainingCount === 0;

          return (
            <div
              key={item.id}
              className={`rounded-3xl border p-6 shadow-xs transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                isFinished
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : 'bg-white border-slate-200/80 hover:border-indigo-300 hover:shadow-md'
              }`}
            >
              <div>
                {/* Title & Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-900 text-base leading-snug">
                        {item.title}
                      </h4>
                      {isFinished && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center gap-1 uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Quitado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">
                      {item.supplier ? `${item.supplier} • ` : ''}Vence dia {item.dueDay}
                    </p>
                  </div>

                  <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-black whitespace-nowrap shadow-2xs">
                    {item.category}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-5 p-4 bg-slate-50/80 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-slate-800">
                      {item.paidInstallments} de {item.totalInstallments} parcelas pagas
                    </span>
                    <span className="font-black text-indigo-700">{progressPercent.toFixed(0)}%</span>
                  </div>

                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        isFinished ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                      }`}
                      style={{ width: `${Math.min(100, progressPercent)}%` }}
                    />
                  </div>

                  <div className="mt-2 flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 font-medium">
                      Já pago: <strong className="text-slate-800">{formatCurrency(paidAmount)}</strong>
                    </span>
                    {remainingCount > 0 ? (
                      <span className="font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md text-[11px]">
                        Faltam {remainingCount} parcelas ({formatCurrency(remainingAmount)})
                      </span>
                    ) : (
                      <span className="font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md text-[11px]">
                        Totalmente Quitado!
                      </span>
                    )}
                  </div>
                </div>

                {/* Values footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Valor da Parcela
                    </span>
                    <span className="text-lg font-black text-slate-900">
                      {formatCurrency(item.installmentValue)}/mês
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block text-right">
                      Valor Contratado Total
                    </span>
                    <span className="text-lg font-black text-slate-600 block text-right">
                      {formatCurrency(item.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEditInstallment(item)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Editar contrato"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteInstallment(item.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  {item.paidInstallments > 0 && (
                    <button
                      onClick={() => onUndoInstallment(item)}
                      className="p-2 rounded-xl text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Desfazer 1 parcela paga"
                    >
                      <MinusCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {!isFinished ? (
                  <button
                    onClick={() => {
                      const confirmExpense = window.confirm(
                        `Confirmar pagamento da parcela ${item.paidInstallments + 1} de ${item.totalInstallments} (${formatCurrency(item.installmentValue)})?\n\nDeseja registrar essa saída no extrato de movimentações também?`
                      );
                      onPayNextInstallment(item, confirmExpense);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white rounded-2xl text-xs font-black shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Pagar Parcela (+1)</span>
                  </button>
                ) : (
                  <span className="text-xs font-black text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Contrato Finalizado
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredItems.length === 0 && (
          <div className="col-span-2 bg-white rounded-3xl p-14 text-center text-slate-400 font-medium border border-slate-200/80">
            Nenhum contrato de financiamento encontrado com os filtros selecionados.
          </div>
        )}
      </div>
    </div>
  );
};
