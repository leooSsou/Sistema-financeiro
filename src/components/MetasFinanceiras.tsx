import React, { useState, useMemo } from 'react';
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  Calculator,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Clock,
  Award
} from 'lucide-react';
import { FinancialGoal } from '../types/finance';
import { formatCurrency, formatDate } from '../utils/formatters';

interface MetasFinanceirasProps {
  goals: FinancialGoal[];
  onSaveGoal: (goal: FinancialGoal) => void;
  onDeleteGoal: (id: string) => void;
}

export const MetasFinanceiras: React.FC<MetasFinanceirasProps> = ({
  goals,
  onSaveGoal,
  onDeleteGoal,
}) => {
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<FinancialGoal | null>(null);

  // Quick deposit modal
  const [depositGoalId, setDepositGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState<number>(500);

  // Goal Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Segurança & Reserva');
  const [targetAmount, setTargetAmount] = useState<number>(10000);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [deadlineDate, setDeadlineDate] = useState(
    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [color, setColor] = useState('#10b981');
  const [notes, setNotes] = useState('');

  // Compound Interest / Monthly target calculator state
  const [calcTarget, setCalcTarget] = useState<number>(50000);
  const [calcMonths, setCalcMonths] = useState<number>(36);
  const [calcAnnualRate, setCalcAnnualRate] = useState<number>(10.5);

  // Global KPIs
  const totalTarget = useMemo(() => goals.reduce((s, g) => s + g.targetAmount, 0), [goals]);
  const totalAccumulated = useMemo(() => goals.reduce((s, g) => s + g.currentAmount, 0), [goals]);
  const globalProgress = totalTarget > 0 ? (totalAccumulated / totalTarget) * 100 : 0;
  const completedGoalsCount = goals.filter((g) => g.currentAmount >= g.targetAmount).length;

  // Compound interest calculation for monthly requirement
  const monthlyRequired = useMemo(() => {
    if (calcMonths <= 0 || calcTarget <= 0) return 0;
    const r = (calcAnnualRate / 100) / 12;
    if (r === 0) return calcTarget / calcMonths;
    // FV = PMT * ((1+r)^n - 1) / r => PMT = FV * r / ((1+r)^n - 1)
    const factor = Math.pow(1 + r, calcMonths) - 1;
    return (calcTarget * r) / factor;
  }, [calcTarget, calcMonths, calcAnnualRate]);

  const handleOpenModal = (goal?: FinancialGoal) => {
    if (goal) {
      setGoalToEdit(goal);
      setTitle(goal.title);
      setCategory(goal.category);
      setTargetAmount(goal.targetAmount);
      setCurrentAmount(goal.currentAmount);
      setDeadlineDate(goal.deadlineDate);
      setColor(goal.color || '#10b981');
      setNotes(goal.notes || '');
    } else {
      setGoalToEdit(null);
      setTitle('');
      setCategory('Segurança & Reserva');
      setTargetAmount(10000);
      setCurrentAmount(0);
      setDeadlineDate(
        new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      );
      setColor('#10b981');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSaveGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || targetAmount <= 0) return;

    const newGoal: FinancialGoal = {
      id: goalToEdit ? goalToEdit.id : `goal-${Date.now()}`,
      title: title.trim(),
      category: category.trim(),
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount),
      deadlineDate,
      color,
      notes: notes || undefined,
    };

    onSaveGoal(newGoal);
    setIsModalOpen(false);
  };

  const handleQuickDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoalId || depositAmount <= 0) return;

    const target = goals.find((g) => g.id === depositGoalId);
    if (target) {
      onSaveGoal({
        ...target,
        currentAmount: target.currentAmount + Number(depositAmount),
      });
    }

    setDepositGoalId(null);
    setDepositAmount(500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 border border-teal-900/40 p-6 rounded-3xl shadow-xl text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Target className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-teal-400">
              Planejamento & Objetivos de Vida
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Metas Financeiras & Juros Compostos
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Defina seus objetivos (Reserva de Emergência, Viagens, Imóvel ou Aposentadoria),
            acompanhe seu progresso e simule aportes mensais para realizá-los.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-teal-500/20 transition-all active:scale-95 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Criar Nova Meta</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Acumulado */}
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Acumulado</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalAccumulated)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Guardado em direção aos objetivos.</p>
        </div>

        {/* Meta Global */}
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Meta Total</span>
            <Target className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900">{formatCurrency(totalTarget)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            Faltam {formatCurrency(Math.max(0, totalTarget - totalAccumulated))}
          </p>
        </div>

        {/* Progresso Geral */}
        <div className="p-5 rounded-3xl bg-teal-50/50 border border-teal-200 text-teal-900">
          <div className="flex items-center justify-between text-teal-700 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Progresso Geral</span>
            <Sparkles className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-teal-700">{globalProgress.toFixed(1)}%</div>
          <div className="w-full bg-teal-200/50 rounded-full h-2 overflow-hidden mt-2">
            <div
              className="bg-teal-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, globalProgress)}%` }}
            />
          </div>
        </div>

        {/* Metas Concluídas */}
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Conquistas</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {completedGoalsCount} de {goals.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Objetivos 100% concluídos!</p>
        </div>
      </div>

      {/* Main Grid: Goals Cards (8 cols) & Compound Calculator (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Goals Cards (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-bold text-slate-800 text-sm">Meus Objetivos ({goals.length})</h3>
          </div>

          {goals.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
              <Target className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-sm">Nenhuma meta cadastrada</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Crie sua primeira meta (ex: Reserva de Emergência) para começar a transformar seus sonhos em realidade financeira.
              </p>
              <button
                onClick={() => handleOpenModal()}
                className="mt-4 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-all"
              >
                + Criar Primeira Meta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map((g) => {
                const pct = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
                const isDone = g.currentAmount >= g.targetAmount;

                // Remaining days
                const now = new Date().getTime();
                const deadline = new Date(g.deadlineDate).getTime();
                const diffDays = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));

                return (
                  <div
                    key={g.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md font-bold"
                            style={{ backgroundColor: g.color || '#10b981' }}
                          >
                            <Target className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{g.title}</h4>
                            <span className="text-[10px] text-slate-400 uppercase font-semibold">
                              {g.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenModal(g)}
                            className="text-slate-400 hover:text-teal-600 p-1"
                            title="Editar meta"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteGoal(g.id)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                            title="Excluir meta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Amounts */}
                      <div className="mt-4 flex items-baseline justify-between">
                        <span className="text-xl font-black text-slate-900">
                          {formatCurrency(g.currentAmount)}
                        </span>
                        <span className="text-xs text-slate-400">
                          de {formatCurrency(g.targetAmount)}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-2 w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/60">
                        <div
                          className="h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, pct)}%`,
                            backgroundColor: isDone ? '#10b981' : g.color || '#14b8a6',
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                        <span className="font-bold text-teal-700">{pct.toFixed(0)}% alcançado</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {isDone ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                              <CheckCircle2 className="w-3 h-3" /> Concluída!
                            </span>
                          ) : diffDays > 0 ? (
                            `${diffDays} dias restantes`
                          ) : (
                            'Prazo final atingido'
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Quick deposit action */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => {
                          setCalcTarget(Math.max(1000, g.targetAmount - g.currentAmount));
                          const monthsLeft = Math.max(1, Math.round(diffDays / 30));
                          setCalcMonths(monthsLeft || 12);
                        }}
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <Calculator className="w-3 h-3" />
                        Simular Aportes
                      </button>

                      <button
                        onClick={() => {
                          setDepositGoalId(g.id);
                          setDepositAmount(500);
                        }}
                        className="px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg text-xs font-bold transition-all"
                      >
                        + Aportar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Compound Interest Calculator (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 self-start">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Calculator className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-slate-800 text-sm">Calculadora de Aportes</h3>
          </div>

          <p className="text-xs text-slate-500">
            Descubra quanto você precisa poupar mensalmente aproveitando os juros compostos para
            chegar ao seu objetivo.
          </p>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-600">Valor Desejado (R$)</label>
              <input
                type="number"
                step="500"
                value={calcTarget}
                onChange={(e) => setCalcTarget(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Prazo (Meses)</label>
                <input
                  type="number"
                  value={calcMonths}
                  onChange={(e) => setCalcMonths(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
                <span className="text-[10px] text-slate-400">{(calcMonths / 12).toFixed(1)} anos</span>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Rentabilidade (% a.a.)</label>
                <input
                  type="number"
                  step="0.5"
                  value={calcAnnualRate}
                  onChange={(e) => setCalcAnnualRate(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>
            </div>

            {/* Calculated Monthly Requirement Card */}
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800">
                Aporte Mensal Necessário
              </span>
              <div className="text-2xl font-black text-teal-800">
                {formatCurrency(monthlyRequired)}/mês
              </div>
              <p className="text-[10px] text-teal-700/80">
                Total aportado por você: {formatCurrency(monthlyRequired * calcMonths)}. O restante ({formatCurrency(Math.max(0, calcTarget - monthlyRequired * calcMonths))}) virá dos juros compostos!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: CADASTRAR / EDITAR META */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {goalToEdit ? 'Editar Meta Financeira' : 'Nova Meta Financeira'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGoalSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Nome da Meta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reserva de Emergência 6 meses, Viagem Europa"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Categoria</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Segurança & Reserva">🛡️ Segurança & Reserva</option>
                    <option value="Imóvel & Terreno">🏡 Imóvel & Terreno</option>
                    <option value="Viagem & Lazer">✈️ Viagem & Lazer</option>
                    <option value="Veículo">🚗 Veículo</option>
                    <option value="Independência Financeira">🚀 Independência Financeira</option>
                    <option value="Educação & Projetos">🎓 Educação & Projetos</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Data Limite (Prazo)</label>
                  <input
                    type="date"
                    required
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Valor Alvo (R$)</label>
                  <input
                    type="number"
                    step="50"
                    required
                    value={targetAmount || ''}
                    onChange={(e) => setTargetAmount(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Valor Já Guardado (R$)</label>
                  <input
                    type="number"
                    step="50"
                    value={currentAmount || ''}
                    onChange={(e) => setCurrentAmount(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold text-teal-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Guardado no CDB 110% CDI do Nubank"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl shadow-md transition-all"
                >
                  Salvar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: APORTE RÁPIDO */}
      {depositGoalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Aporte na Meta</h3>
              <button
                onClick={() => setDepositGoalId(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickDeposit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">Valor a Guardar (R$)</label>
                <input
                  type="number"
                  step="10"
                  required
                  value={depositAmount || ''}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="mt-1 w-full px-3 py-2 text-sm rounded-xl border border-slate-200 font-black text-teal-700"
                />
              </div>

              <div className="flex gap-2">
                {[100, 250, 500, 1000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setDepositAmount(val)}
                    className="flex-1 py-1.5 text-xs font-bold bg-slate-100 hover:bg-teal-50 hover:text-teal-800 rounded-lg border border-slate-200 transition-colors"
                  >
                    +{val}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDepositGoalId(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl shadow-md"
                >
                  Confirmar Aporte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
