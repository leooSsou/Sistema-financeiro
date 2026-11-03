import React, { useState, useEffect } from 'react';
import { ObraEntry, PaymentStatus } from '../types/finance';
import { X, HardHat } from 'lucide-react';

interface ObraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: ObraEntry) => void;
  entryToEdit?: ObraEntry | null;
}

export const ObraModal: React.FC<ObraModalProps> = ({
  isOpen,
  onClose,
  onSave,
  entryToEdit,
}) => {
  const [referenceMonth, setReferenceMonth] = useState(new Date().toISOString().slice(0, 7));
  const [amount, setAmount] = useState<string>('');
  const [evolutionPercent, setEvolutionPercent] = useState<string>('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<PaymentStatus>('pago');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (entryToEdit) {
      setReferenceMonth(entryToEdit.referenceMonth);
      setAmount(entryToEdit.amount.toString());
      setEvolutionPercent(entryToEdit.evolutionPercent.toString());
      setDueDate(entryToEdit.dueDate);
      setStatus(entryToEdit.status);
      setNotes(entryToEdit.notes || '');
    } else {
      setReferenceMonth(new Date().toISOString().slice(0, 7));
      setAmount('');
      setEvolutionPercent('');
      setDueDate(new Date().toISOString().slice(0, 10));
      setStatus('pago');
      setNotes('');
    }
  }, [entryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    const parsedPercent = parseFloat(evolutionPercent.replace(',', '.'));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('Informe um valor de taxa de obra válido.');
      return;
    }
    if (isNaN(parsedPercent) || parsedPercent < 0 || parsedPercent > 100) {
      alert('Informe uma porcentagem de evolução de obra entre 0% e 100%.');
      return;
    }

    const newEntry: ObraEntry = {
      id: entryToEdit ? entryToEdit.id : `obra-${Date.now()}`,
      referenceMonth,
      amount: parsedAmount,
      evolutionPercent: parsedPercent,
      dueDate,
      status,
      notes: notes.trim(),
    };

    onSave(newEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-amber-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
              <HardHat className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              {entryToEdit ? 'Editar Taxa de Obra' : 'Nova Taxa de Evolução de Obra'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Mês de Referência
              </label>
              <input
                type="month"
                required
                value={referenceMonth}
                onChange={(e) => setReferenceMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Data de Vencimento
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Valor Cobrado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="Ex: 1250.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                % Evolução Medida
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                placeholder="Ex: 45.8"
                value={evolutionPercent}
                onChange={(e) => setEvolutionPercent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Status do Pagamento
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PaymentStatus)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm font-medium bg-white"
            >
              <option value="pago">Pago / Quitado</option>
              <option value="pendente">Pendente / A Pagar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Observações / Detalhes da Medição
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Medição da Caixa referente à laje e paredes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-800 text-sm resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-md shadow-amber-600/20 transition-all"
            >
              Salvar Registro de Obra
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
