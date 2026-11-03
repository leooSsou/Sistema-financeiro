import React, { useState, useMemo } from 'react';
import { Transaction, BankAccount, TransactionType } from '../types/finance';
import { parseOFX, parseCSV, ParsedStatementTransaction } from '../utils/statementParser';
import { formatCurrency, formatDateBR } from '../utils/formatters';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Check,
  Filter,
  Sparkles,
  HelpCircle
} from 'lucide-react';

interface ImportStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportConfirm: (importedList: Transaction[]) => void;
  existingTransactions: Transaction[];
  bankAccounts: BankAccount[];
  categories: string[];
}

interface EditableImportItem extends ParsedStatementTransaction {
  selected: boolean;
  isDuplicate: boolean;
  chosenCategory: string;
}

export const ImportStatementModal: React.FC<ImportStatementModalProps> = ({
  isOpen,
  onClose,
  onImportConfirm,
  existingTransactions,
  bankAccounts,
  categories,
}) => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<'ofx' | 'csv' | null>(null);
  const [targetAccountId, setTargetAccountId] = useState<string>(
    bankAccounts.length > 0 ? bankAccounts[0].id : ''
  );
  const [items, setItems] = useState<EditableImportItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setFileName(file.name);
    const lower = file.name.toLowerCase();
    const isOfx = lower.endsWith('.ofx');
    const isCsv = lower.endsWith('.csv') || lower.endsWith('.txt');

    if (!isOfx && !isCsv) {
      alert('Por favor, selecione um arquivo no formato .OFX ou .CSV.');
      return;
    }

    setFileType(isOfx ? 'ofx' : 'csv');

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setFileContent(text);

      const parsed = isOfx ? parseOFX(text, categories) : parseCSV(text, categories);

      // Check duplicates against existing transactions
      const mapped: EditableImportItem[] = parsed.transactions.map((tx) => {
        const isDup = existingTransactions.some((ex) => {
          if (ex.externalId && ex.externalId === tx.externalId) return true;
          return (
            ex.date === tx.date &&
            Math.abs(ex.amount - tx.amount) < 0.01 &&
            ex.description.toLowerCase().trim() === tx.description.toLowerCase().trim()
          );
        });

        return {
          ...tx,
          selected: !isDup, // uncheck duplicates by default
          isDuplicate: isDup,
          chosenCategory: tx.suggestedCategory,
        };
      });

      setItems(mapped);
    };

    reader.readAsText(file, 'utf-8');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    setItems((prev) => prev.map((item) => ({ ...item, selected: checked })));
  };

  const handleToggleItem = (index: number) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleCategoryChange = (index: number, newCat: string) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, chosenCategory: newCat } : item))
    );
  };

  // Metrics on selected items
  const selectedItems = items.filter((i) => i.selected);
  const totalEntradas = selectedItems
    .filter((i) => i.type === 'entrada')
    .reduce((acc, i) => acc + i.amount, 0);
  const totalSaidas = selectedItems
    .filter((i) => i.type === 'saida')
    .reduce((acc, i) => acc + i.amount, 0);

  const handleConfirm = () => {
    if (selectedItems.length === 0) {
      alert('Nenhum lançamento selecionado para importação.');
      return;
    }

    const createdList: Transaction[] = selectedItems.map((item, idx) => ({
      id: `tx-import-${Date.now()}-${idx}`,
      externalId: item.externalId,
      date: item.date,
      description: item.description,
      amount: item.amount,
      type: item.type,
      category: item.chosenCategory,
      paymentMethod: targetAccountId ? 'Extrato Bancário' : 'Outros',
      bankAccountId: targetAccountId || undefined,
      status: 'pago',
      notes: `Importado de extrato (${fileName})`,
    }));

    onImportConfirm(createdList);
    onClose();
  };

  const handleReset = () => {
    setFileContent(null);
    setFileName('');
    setFileType(null);
    setItems([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight">
                Importador de Extrato Bancário
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Compatível com arquivos .OFX e .CSV de qualquer banco brasileiro (Nubank, Inter, Itaú, etc.).
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
          {!fileContent ? (
            /* Upload Dropzone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-10 text-center transition-all flex flex-col items-center justify-center gap-4 ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50 scale-[1.01]'
                  : 'border-slate-200 hover:border-blue-400 bg-slate-50/40'
              }`}
            >
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                <FileSpreadsheet className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-slate-800">
                  Arraste seu arquivo .OFX ou .CSV aqui
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Acesse seu banco pelo celular ou internet banking, baixe o extrato no formato <strong>OFX</strong> ou <strong>CSV</strong> e solte aqui.
                </p>
              </div>

              <label className="cursor-pointer px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all hover:scale-105 active:scale-95">
                <span>Selecionar Arquivo no Computador</span>
                <input
                  type="file"
                  accept=".ofx,.csv,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />
              </label>

              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium pt-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span>Detecção inteligente de categorias e prevenção automática de duplicatas</span>
              </div>
            </div>
          ) : (
            /* Review & Reconciliation Area */
            <div className="space-y-5">
              {/* Destination Bank & File Info Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 text-xs font-black uppercase tracking-wider">
                    {fileType?.toUpperCase()}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block truncate max-w-xs">
                      {fileName}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {items.length} lançamentos identificados no arquivo
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold text-slate-700 whitespace-nowrap">
                      Vincular à Conta:
                    </span>
                    <select
                      value={targetAccountId}
                      onChange={(e) => setTargetAccountId(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Nenhuma conta específica</option>
                      {bankAccounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({acc.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleReset}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                  >
                    Trocar arquivo
                  </button>
                </div>
              </div>

              {/* Transactions Reconciliation Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && items.every((i) => i.selected)}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                    />
                    <span>Selecionar Todos ({selectedItems.length}/{items.length})</span>
                  </label>

                  <div className="flex items-center gap-4 text-[11px]">
                    <span className="text-emerald-700 font-bold">
                      + Entradas: {formatCurrency(totalEntradas)}
                    </span>
                    <span className="text-rose-700 font-bold">
                      - Saídas: {formatCurrency(totalSaidas)}
                    </span>
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 sticky top-0 z-10">
                      <tr>
                        <th className="py-2.5 px-4 w-10"></th>
                        <th className="py-2.5 px-3">Data</th>
                        <th className="py-2.5 px-3">Tipo</th>
                        <th className="py-2.5 px-3">Descrição do Banco</th>
                        <th className="py-2.5 px-3">Categoria Sugerida</th>
                        <th className="py-2.5 px-4 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            item.selected ? 'bg-white hover:bg-slate-50/80' : 'bg-slate-50/50 opacity-60'
                          }`}
                        >
                          <td className="py-2.5 px-4">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => handleToggleItem(idx)}
                              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap font-medium text-slate-600">
                            {formatDateBR(item.date)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black inline-flex items-center gap-1 ${
                                item.type === 'entrada'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {item.type === 'entrada' ? (
                                <>
                                  <ArrowUpRight className="w-3 h-3 text-emerald-600" /> Entrada
                                </>
                              ) : (
                                <>
                                  <ArrowDownRight className="w-3 h-3 text-rose-600" /> Saída
                                </>
                              )}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-bold text-slate-900 max-w-xs truncate">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate">{item.description}</span>
                              {item.isDuplicate && (
                                <span
                                  title="Este lançamento parece já existir no sistema"
                                  className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-800 shrink-0"
                                >
                                  Duplicata?
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={item.chosenCategory}
                              onChange={(e) => handleCategoryChange(idx, e.target.value)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[180px] truncate"
                            >
                              {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td
                            className={`py-2.5 px-4 text-right font-black whitespace-nowrap ${
                              item.type === 'entrada' ? 'text-emerald-600' : 'text-slate-900'
                            }`}
                          >
                            {item.type === 'saida' ? '-' : '+'} {formatCurrency(item.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {fileContent && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
            <span className="text-xs font-semibold text-slate-500">
              Pronto para importar <strong>{selectedItems.length}</strong> de {items.length} movimentações.
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={selectedItems.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar e Importar {selectedItems.length} Lançamentos</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
