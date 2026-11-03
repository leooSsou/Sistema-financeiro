import React, { useState } from 'react';
import { RecurringTransaction, BankAccount, Transaction, TransactionType } from '../types/finance';
import { formatCurrency } from '../utils/formatters';
import {
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  Sparkles,
  Building2,
  Play
} from 'lucide-react';

interface RecorrenciasModalProps {
  isOpen: boolean;
  onClose: () => void;
  recurringList: RecurringTransaction[];
  onSaveRecurringList: (list: RecurringTransaction[]) => void;
  onGenerateMonthlyTransactions: (created: Transaction[]) => void;
  existingTransactions: Transaction[];
  currentMonth: string; // YYYY-MM
  categories: string[];
  bankAccounts: BankAccount[];
}

export const RecorrenciasModal: React.FC<RecorrenciasModalProps> = ({
  isOpen,
  onClose,
  recurringList = [],
  onSaveRecurringList,
  onGenerateMonthlyTransactions,
  existingTransactions,
  currentMonth,
  categories,
  bankAccounts,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'entrada' | 'saida'>('saida');
  const [category, setCategory] = useState(categories[0] || 'Habitação & Moradia');
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  const [bankAccountId, setBankAccountId] = useState(
    bankAccounts.length > 0 ? bankAccounts[0].id : ''
  );
  const [dayOfMonth, setDayOfMonth] = useState<number>(10);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (!description.trim()) {
      alert('Informe a descrição da conta recorrente.');
      return;
    }
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Informe um valor válido.');
      return;
    }

    const newItem: RecurringTransaction = {
      id: `rec-${Date.now()}`,
      description: description.trim(),
      amount: parsedAmount,
      type,
      category,
      paymentMethod,
      bankAccountId: bankAccountId || undefined,
      dayOfMonth: Math.max(1, Math.min(31, Number(dayOfMonth) || 10)),
      active: true,
      notes: notes.trim() || undefined,
    };

    onSaveRecurringList([...recurringList, newItem]);
    setIsAdding(false);
    setDescription('');
    setAmount('');
    setNotes('');
  };

  const handleToggleActive = (id: string) => {
    const updated = recurringList.map((item) =>
      item.id === id ? { ...item, active: !item.active } : item
    );
    onSaveRecurringList(updated);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Deseja excluir esta conta recorrente?')) {
      onSaveRecurringList(recurringList.filter((item) => item.id !== id));
    }
  };

  const handleGenerateForCurrentMonth = () => {
    const activeItems = recurringList.filter((i) => i.active);
    if (activeItems.length === 0) {
      alert('Nenhuma conta recorrente ativa para gerar.');
      return;
    }

    const toCreate: Transaction[] = [];

    activeItems.forEach((rec) => {
      const dayStr = String(rec.dayOfMonth).padStart(2, '0');
      const targetDate = `${currentMonth}-${dayStr}`;

      // Check if already created in this month
      const alreadyExists = existingTransactions.some(
        (t) =>
          t.date.startsWith(currentMonth) &&
          t.description.toLowerCase().trim() === rec.description.toLowerCase().trim() &&
          Math.abs(t.amount - rec.amount) < 0.01
      );

      if (!alreadyExists) {
        toCreate.push({
          id: `tx-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          date: targetDate,
          description: rec.description,
          type: rec.type,
          amount: rec.amount,
          category: rec.category,
          paymentMethod: rec.paymentMethod,
          bankAccountId: rec.bankAccountId,
          status: 'pendente',
          isRecurring: true,
          notes: rec.notes ? `${rec.notes} • Recorrência fixa` : 'Lançamento fixo mensal',
        });
      }
    });

    if (toCreate.length === 0) {
      alert('Todas as contas fixas já foram lançadas neste mês!');
      return;
    }

    onGenerateMonthlyTransactions(toCreate);
    alert(`Sucesso! ${toCreate.length} conta(s) recorrente(s) gerada(s) para o mês ${currentMonth}.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-500/20">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                Contas Fixas & Recorrências
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Cadastre contas que repetem todo mês (Salário, Aluguel, Netflix, Internet).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100">
            <div>
              <span className="text-xs font-bold text-indigo-950 block">
                Gerar no Mês Atual ({currentMonth})
              </span>
              <span className="text-[11px] text-indigo-700 font-medium">
                Gera os lançamentos pendentes com um clique sem duplicar o que já existe.
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleGenerateForCurrentMonth}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Lançar no Mês</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>{isAdding ? 'Fechar' : 'Nova Fixa'}</span>
              </button>
            </div>
          </div>

          {/* New Item Form */}
          {isAdding && (
            <form onSubmit={handleCreateSubmit} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Cadastrar Nova Conta Fixa
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Aluguel do Apê, Netflix, Salário..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Valor (R$) *</label>
                  <input
                    type="text"
                    required
                    placeholder="0,00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'entrada' | 'saida')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="saida">Saída (-)</option>
                    <option value="entrada">Entrada (+)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Dia Vencimento</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Conta Bancária</label>
                  <select
                    value={bankAccountId}
                    onChange={(e) => setBankAccountId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="">Nenhuma</option>
                    {bankAccounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm"
                >
                  Salvar Conta Fixa
                </button>
              </div>
            </form>
          )}

          {/* List of Recurring Items */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Suas Contas Fixas Cadastradas ({recurringList.length})
            </h3>

            {recurringList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-400 text-xs">
                Nenhuma conta fixa cadastrada. Cadastre itens como Aluguel, Academia, Salário para automatizar todo mês.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                {recurringList.map((rec) => (
                  <div
                    key={rec.id}
                    className={`p-3.5 flex items-center justify-between gap-3 transition-colors ${
                      rec.active ? 'hover:bg-slate-50/80' : 'bg-slate-50/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleActive(rec.id)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                          rec.active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-200 text-slate-400'
                        }`}
                        title={rec.active ? 'Ativa (clique para pausar)' : 'Pausada'}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-xs">
                            {rec.description}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            Dia {rec.dayOfMonth}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mt-0.5">
                          <span>{rec.category}</span>
                          {rec.bankAccountId && (
                            <span>
                              • {bankAccounts.find((a) => a.id === rec.bankAccountId)?.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`text-sm font-black ${
                          rec.type === 'entrada' ? 'text-emerald-600' : 'text-slate-900'
                        }`}
                      >
                        {rec.type === 'saida' ? '-' : '+'} {formatCurrency(rec.amount)}
                      </span>

                      <button
                        onClick={() => handleDelete(rec.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
