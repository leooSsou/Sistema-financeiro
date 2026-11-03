import React, { useState, useEffect } from 'react';
import { HouseInstallment } from '../types/finance';
import { X, Home } from 'lucide-react';

interface InstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (installment: HouseInstallment) => void;
  installmentToEdit?: HouseInstallment | null;
}

export const InstallmentModal: React.FC<InstallmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  installmentToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Móveis Planejados');
  const [supplier, setSupplier] = useState('');
  const [totalAmount, setTotalAmount] = useState<string>('');
  const [installmentValue, setInstallmentValue] = useState<string>('');
  const [totalInstallments, setTotalInstallments] = useState<string>('10');
  const [paidInstallments, setPaidInstallments] = useState<string>('0');
  const [dueDay, setDueDay] = useState<string>('10');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (installmentToEdit) {
      setTitle(installmentToEdit.title);
      setCategory(installmentToEdit.category);
      setSupplier(installmentToEdit.supplier);
      setTotalAmount(installmentToEdit.totalAmount.toString());
      setInstallmentValue(installmentToEdit.installmentValue.toString());
      setTotalInstallments(installmentToEdit.totalInstallments.toString());
      setPaidInstallments(installmentToEdit.paidInstallments.toString());
      setDueDay(installmentToEdit.dueDay.toString());
      setStartDate(installmentToEdit.startDate);
      setNotes(installmentToEdit.notes || '');
    } else {
      setTitle('');
      setCategory('Móveis Planejados');
      setSupplier('');
      setTotalAmount('');
      setInstallmentValue('');
      setTotalInstallments('10');
      setPaidInstallments('0');
      setDueDay('10');
      setStartDate(new Date().toISOString().slice(0, 10));
      setNotes('');
    }
  }, [installmentToEdit, isOpen]);

  if (!isOpen) return null;

  // Auto-calculation helpers
  const handleTotalChange = (val: string) => {
    setTotalAmount(val);
    const parsedTotal = parseFloat(val.replace(',', '.'));
    const parsedCount = parseInt(totalInstallments, 10);
    if (!isNaN(parsedTotal) && !isNaN(parsedCount) && parsedCount > 0) {
      setInstallmentValue((parsedTotal / parsedCount).toFixed(2));
    }
  };

  const handleInstallmentCountChange = (val: string) => {
    setTotalInstallments(val);
    const parsedTotal = parseFloat(totalAmount.replace(',', '.'));
    const parsedCount = parseInt(val, 10);
    if (!isNaN(parsedTotal) && !isNaN(parsedCount) && parsedCount > 0) {
      setInstallmentValue((parsedTotal / parsedCount).toFixed(2));
    }
  };

  const handleInstallmentValueChange = (val: string) => {
    setInstallmentValue(val);
    const parsedVal = parseFloat(val.replace(',', '.'));
    const parsedCount = parseInt(totalInstallments, 10);
    if (!isNaN(parsedVal) && !isNaN(parsedCount) && parsedCount > 0) {
      setTotalAmount((parsedVal * parsedCount).toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTotal = parseFloat(totalAmount.replace(',', '.'));
    const parsedInstVal = parseFloat(installmentValue.replace(',', '.'));
    const parsedTotalCount = parseInt(totalInstallments, 10);
    const parsedPaidCount = parseInt(paidInstallments, 10) || 0;
    const parsedDueDay = parseInt(dueDay, 10);

    if (!title.trim()) {
      alert('Informe o nome do item ou contrato.');
      return;
    }
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      alert('Informe um valor total válido.');
      return;
    }
    if (isNaN(parsedTotalCount) || parsedTotalCount <= 0) {
      alert('Informe o número total de parcelas.');
      return;
    }
    if (parsedPaidCount > parsedTotalCount) {
      alert('O número de parcelas pagas não pode ser maior que o total de parcelas.');
      return;
    }

    const newInst: HouseInstallment = {
      id: installmentToEdit ? installmentToEdit.id : `inst-${Date.now()}`,
      title: title.trim(),
      category,
      supplier: supplier.trim(),
      totalAmount: parsedTotal,
      installmentValue: parsedInstVal || parsedTotal / parsedTotalCount,
      totalInstallments: parsedTotalCount,
      paidInstallments: parsedPaidCount,
      dueDay: parsedDueDay || 10,
      startDate,
      notes: notes.trim(),
    };

    onSave(newInst);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-indigo-50/50">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-lg">
              <Home className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">
              {installmentToEdit ? 'Editar Financiamento / Parcela' : 'Novo Financiamento / Compra da Casa'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Nome do Item / Contrato
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Armários da Cozinha, Geladeira, Porcelanato..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm font-medium bg-white"
              >
                <option value="Móveis Planejados">Móveis Planejados</option>
                <option value="Acabamentos">Acabamentos / Pisos</option>
                <option value="Eletrodomésticos">Eletrodomésticos</option>
                <option value="Mão de Obra">Mão de Obra / Reforma</option>
                <option value="Iluminação">Iluminação & Elétrica</option>
                <option value="Decoração">Decoração & Banheiro</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Fornecedor / Loja
              </label>
              <input
                type="text"
                placeholder="Ex: Marcenaria, Leroy, Magazine Luiza..."
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 p-3 bg-indigo-50/40 rounded-xl border border-indigo-100">
            <div>
              <label className="block text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-1">
                Valor Total (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="10000.00"
                value={totalAmount}
                onChange={(e) => handleTotalChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 text-sm font-bold bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-1">
                Qtd Parcelas
              </label>
              <input
                type="number"
                min="1"
                max="360"
                required
                value={totalInstallments}
                onChange={(e) => handleInstallmentCountChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 text-sm font-bold bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-1">
                Valor Parcela (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="1000.00"
                value={installmentValue}
                onChange={(e) => handleInstallmentValueChange(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 text-sm font-bold bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Parcelas Já Pagas
              </label>
              <input
                type="number"
                min="0"
                max={totalInstallments}
                required
                value={paidInstallments}
                onChange={(e) => setPaidInstallments(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Dia de Vencimento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                required
                placeholder="10"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Data 1ª Parcela
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Observações / Detalhes
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Contrato nº 1234, garantia de 5 anos..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 text-sm resize-none"
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
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
            >
              Salvar Financiamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
