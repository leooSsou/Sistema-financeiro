import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, TransactionType, PaymentStatus, CreditCardItem, BankAccount } from '../types/finance';
import { formatCurrency, formatDate } from '../utils/formatters';
import { X, ArrowDownRight, ArrowUpRight, CreditCard, CalendarCheck, Building2 } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionOrList: Transaction | Transaction[]) => void;
  transactionToEdit?: Transaction | null;
  categories: string[];
  creditCards?: CreditCardItem[];
  bankAccounts?: BankAccount[];
}

function addMonthsToDate(dateStr: string, monthsToAdd: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetMonthIndex = month - 1 + monthsToAdd;
  const targetYear = year + Math.floor(targetMonthIndex / 12);
  const normalizedMonth = ((targetMonthIndex % 12) + 12) % 12;

  const maxDays = new Date(targetYear, normalizedMonth + 1, 0).getDate();
  const targetDay = Math.min(day, maxDays);

  const mStr = String(normalizedMonth + 1).padStart(2, '0');
  const dStr = String(targetDay).padStart(2, '0');
  return `${targetYear}-${mStr}-${dStr}`;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transactionToEdit,
  categories,
  creditCards = [],
  bankAccounts = [],
}) => {
  const [type, setType] = useState<TransactionType>('saida');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState(categories[0] || 'Alimentação');
  const [paymentMethod, setPaymentMethod] = useState('Cartão de Crédito');
  const [creditCardId, setCreditCardId] = useState<string>('');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [status, setStatus] = useState<PaymentStatus>('pago');
  const [notes, setNotes] = useState('');
  const [installments, setInstallments] = useState<number>(1);

  useEffect(() => {
    if (transactionToEdit) {
      setType(transactionToEdit.type);
      setDescription(transactionToEdit.description);
      setAmount(transactionToEdit.amount.toString());
      setDate(transactionToEdit.date);
      setCategory(transactionToEdit.category);
      setPaymentMethod(transactionToEdit.paymentMethod);
      setCreditCardId(transactionToEdit.creditCardId || '');
      setBankAccountId(transactionToEdit.bankAccountId || '');
      setStatus(transactionToEdit.status);
      setNotes(transactionToEdit.notes || '');
      setInstallments(1);
    } else {
      setType('saida');
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setCategory(categories[2] || 'Alimentação');
      setPaymentMethod('Cartão de Crédito');
      setCreditCardId(creditCards.length > 0 ? creditCards[0].id : '');
      setBankAccountId(bankAccounts.length > 0 ? bankAccounts[0].id : '');
      setStatus('pago');
      setNotes('');
      setInstallments(1);
    }
  }, [transactionToEdit, isOpen, categories, creditCards, bankAccounts]);

  // Real-time installment calculation
  const parsedTotal = parseFloat(amount.replace(',', '.')) || 0;
  const installmentPreview = useMemo(() => {
    if (installments <= 1 || parsedTotal <= 0) return null;
    const baseValue = Math.floor((parsedTotal / installments) * 100) / 100;
    const remainder = Math.round((parsedTotal - baseValue * installments) * 100) / 100;

    const list = [];
    for (let i = 1; i <= installments; i++) {
      const val = i === installments ? +(baseValue + remainder).toFixed(2) : baseValue;
      const dueDate = addMonthsToDate(date, i - 1);
      list.push({
        num: i,
        val,
        date: dueDate,
      });
    }
    return {
      eachValue: (parsedTotal / installments).toFixed(2),
      list,
    };
  }, [parsedTotal, installments, date]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isNaN(parsedTotal) || parsedTotal <= 0) {
      alert('Por favor, informe um valor válido.');
      return;
    }
    if (!description.trim()) {
      alert('Por favor, informe a descrição da movimentação.');
      return;
    }

    const selectedCardId = paymentMethod === 'Cartão de Crédito' ? creditCardId || undefined : undefined;
    const selectedBankId = paymentMethod !== 'Cartão de Crédito' ? bankAccountId || undefined : undefined;

    // Single transaction (edit mode, or 1 installment)
    if (transactionToEdit || installments <= 1 || type !== 'saida') {
      const newTx: Transaction = {
        id: transactionToEdit ? transactionToEdit.id : `tx-${Date.now()}`,
        type,
        description: description.trim(),
        amount: parsedTotal,
        date,
        category,
        paymentMethod,
        creditCardId: selectedCardId,
        bankAccountId: selectedBankId,
        status,
        notes: notes.trim(),
      };
      onSave(newTx);
      onClose();
      return;
    }

    // Multi-installment distribution (Cartão de Crédito parcelado)
    const baseVal = Math.floor((parsedTotal / installments) * 100) / 100;
    const remainder = Math.round((parsedTotal - baseVal * installments) * 100) / 100;
    const createdList: Transaction[] = [];
    const baseId = Date.now();

    for (let i = 1; i <= installments; i++) {
      const val = i === installments ? +(baseVal + remainder).toFixed(2) : baseVal;
      const installmentDate = addMonthsToDate(date, i - 1);
      const isFirst = i === 1;

      createdList.push({
        id: `tx-${baseId}-${i}`,
        type: 'saida',
        description: `${description.trim()} (${i}/${installments})`,
        amount: val,
        date: installmentDate,
        category,
        paymentMethod,
        creditCardId: selectedCardId,
        bankAccountId: selectedBankId,
        status: isFirst ? status : 'pendente',
        notes: notes.trim()
          ? `${notes.trim()} • Parcela ${i} de ${installments} da compra de ${formatCurrency(parsedTotal)}`
          : `Parcela ${i} de ${installments} da compra no cartão de ${formatCurrency(parsedTotal)}`,
      });
    }

    onSave(createdList);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">
            {transactionToEdit ? 'Editar Movimentação' : 'Nova Movimentação'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          {/* Tipo: Entrada vs Saída */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('entrada');
                setInstallments(1);
              }}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                type === 'entrada'
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              Entrada (Receita)
            </button>
            <button
              type="button"
              onClick={() => setType('saida')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                type === 'saida'
                  ? 'bg-rose-500 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              Saída (Despesa)
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
              Descrição
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Celular, Supermercado, Salário, Loja..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Valor Total (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Data {installments > 1 ? '(1ª Parcela)' : ''}
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-sm font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-sm font-medium bg-white cursor-pointer"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  if (e.target.value !== 'Cartão de Crédito') {
                    setInstallments(1);
                  }
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-sm font-medium bg-white cursor-pointer"
              >
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="PIX">PIX</option>
                <option value="Cartão de Débito">Cartão de Débito</option>
                <option value="Boleto">Boleto</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Transferência">Transferência</option>
              </select>
            </div>
          </div>

          {/* Seleção de Conta Bancária de Origem / Movimentação */}
          {paymentMethod !== 'Cartão de Crédito' && bankAccounts.length > 0 && (
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-600" /> Conta Bancária / Carteira
                </span>
                <span className="text-[10px] text-blue-600 lowercase font-medium">afeta o saldo real</span>
              </label>
              <select
                value={bankAccountId}
                onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-blue-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Nenhuma conta vinculada (avulso)</option>
                {bankAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>
          )}
          {paymentMethod === 'Cartão de Crédito' && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" /> Selecionar Cartão de Crédito
                </span>
                <span className="text-[11px] font-normal text-slate-400">Final • Limite</span>
              </label>

              {creditCards && creditCards.length > 0 ? (
                <select
                  value={creditCardId}
                  onChange={(e) => setCreditCardId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-sm font-bold bg-white cursor-pointer"
                >
                  <option value="">Nenhum cartão específico</option>
                  {creditCards.map((card) => (
                    <option key={card.id} value={card.id}>
                      {card.name} (•••• {card.lastFourDigits}) - Limite: {formatCurrency(card.limit)}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-xs text-slate-500 italic p-1">
                  Nenhum cartão cadastrado ainda. Você pode adicionar em <strong>Backup & Ajustes ➔ Cartões</strong>.
                </div>
              )}
            </div>
          )}

          {/* Opção de Parcelamento para Cartão de Crédito */}
          {type === 'saida' && !transactionToEdit && paymentMethod === 'Cartão de Crédito' && (
            <div className="p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <CreditCard className="w-4 h-4 text-indigo-600" />
                  Quantidade de Parcelas
                </label>
                <select
                  value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value, 10))}
                  className="bg-white border border-indigo-200 rounded-lg px-3 py-1.5 text-xs font-bold text-indigo-950 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value={1}>1x (À vista - sem parcelamento)</option>
                  <option value={2}>2x de R$ {(parsedTotal / 2).toFixed(2)}</option>
                  <option value={3}>3x de R$ {(parsedTotal / 3).toFixed(2)}</option>
                  <option value={4}>4x de R$ {(parsedTotal / 4).toFixed(2)}</option>
                  <option value={5}>5x de R$ {(parsedTotal / 5).toFixed(2)}</option>
                  <option value={6}>6x de R$ {(parsedTotal / 6).toFixed(2)}</option>
                  <option value={7}>7x de R$ {(parsedTotal / 7).toFixed(2)}</option>
                  <option value={8}>8x de R$ {(parsedTotal / 8).toFixed(2)}</option>
                  <option value={9}>9x de R$ {(parsedTotal / 9).toFixed(2)}</option>
                  <option value={10}>10x de R$ {(parsedTotal / 10).toFixed(2)}</option>
                  <option value={12}>12x de R$ {(parsedTotal / 12).toFixed(2)}</option>
                  <option value={18}>18x de R$ {(parsedTotal / 18).toFixed(2)}</option>
                  <option value={24}>24x de R$ {(parsedTotal / 24).toFixed(2)}</option>
                </select>
              </div>

              {installmentPreview && (
                <div className="pt-2 border-t border-indigo-200/60 text-xs text-indigo-900 space-y-1.5">
                  <div className="flex items-center justify-between font-bold">
                    <span>Distribuição automática nos meses:</span>
                    <span className="text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                      {installments}x de R$ {installmentPreview.eachValue}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto pt-1">
                    {installmentPreview.list.map((item) => (
                      <div
                        key={item.num}
                        className="bg-white/80 px-2 py-1 rounded border border-indigo-100 flex items-center justify-between text-[11px]"
                      >
                        <span className="font-semibold text-slate-700">
                          {item.num}ª: {formatDate(item.date)}
                        </span>
                        <span className="font-black text-indigo-900">
                          {formatCurrency(item.val)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-500 italic pt-0.5">
                    * A 1ª parcela usará o status abaixo; as parcelas dos meses seguintes entrarão automaticamente como "Pendente".
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Status {installments > 1 ? '(1ª Parcela)' : ''}
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PaymentStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-sm font-medium bg-white"
              >
                <option value="pago">Pago / Concluído</option>
                <option value="pendente">Pendente / Agendado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Observações
              </label>
              <input
                type="text"
                placeholder="Opcional..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-sm"
              />
            </div>
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
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {installments > 1
                ? `Lançar e Distribuir ${installments} Parcelas`
                : 'Salvar Movimentação'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
