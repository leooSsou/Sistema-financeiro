import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  HardHat,
  Home,
  Settings,
  Plus,
  Building2,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Wallet,
  Car,
  TrendingUp,
  Target,
  BarChart3,
  SlidersHorizontal
} from 'lucide-react';
import { AppData } from '../types/finance';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewTx: () => void;
  isSaved: boolean;
  data: AppData;
  updateAvailable?: boolean;
  onOpenUpdateModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewTx,
  isSaved,
  data,
  updateAvailable,
  onOpenUpdateModal,
}) => {
  const settings = data.appSettings || {
    userName: 'Meu Usuário',
    systemTitle: 'FinanPro Suite',
    enabledModules: {
      dashboard: true,
      movimentacoes: true,
      contas: true,
      cartoes: true,
      obra: true,
      casa: true,
      veiculos: true,
      investimentos: true,
      metas: true,
      orcamento: true,
      visaoAnual: true,
    },
  };

  const modules = settings.enabledModules || {
    dashboard: true,
    movimentacoes: true,
    contas: true,
    cartoes: true,
    obra: true,
    casa: true,
  };

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const thisMonthTxCount = data.transactions.filter(
    (t) => t.date && t.date.startsWith(currentMonthStr)
  ).length;

  const latestObra =
    data.obraEntries.length > 0
      ? [...data.obraEntries].sort((a, b) => b.referenceMonth.localeCompare(a.referenceMonth))[0]
      : null;

  const pendingHouseCount = data.houseInstallments.filter(
    (i) => i.paidInstallments < i.totalInstallments
  ).length;

  const userInitial = (settings.userName || 'U').trim().charAt(0).toUpperCase();

  // Dynamic navigation groups
  const navSections = [
    {
      section: 'FINANÇAS PESSOAIS',
      items: [
        modules.dashboard !== false && {
          id: 'dashboard',
          label: 'Painel Geral',
          icon: LayoutDashboard,
          badge: null,
        },
        modules.movimentacoes !== false && {
          id: 'movimentacoes',
          label: 'Movimentações',
          icon: Receipt,
          badge: thisMonthTxCount > 0 ? `${thisMonthTxCount}` : null,
        },
        modules.contas !== false && {
          id: 'contas',
          label: 'Contas & Saldos',
          icon: Wallet,
          badge: data.bankAccounts && data.bankAccounts.length > 0 ? `${data.bankAccounts.length}` : null,
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        },
        modules.orcamento !== false && {
          id: 'orcamento',
          label: 'Orçamento & Tetos',
          icon: Target,
          badge: data.categoryBudgets && data.categoryBudgets.length > 0 ? `${data.categoryBudgets.length}` : null,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        },
      ].filter(Boolean) as any[],
    },
    // Construção & Reforma Section (if either is enabled)
    (modules.obra !== false || modules.casa !== false) && {
      section: 'IMÓVEL & REFORMA',
      items: [
        modules.obra !== false && {
          id: 'obra',
          label: 'Evolução de Obra',
          icon: HardHat,
          badge: latestObra ? `${latestObra.evolutionPercent}%` : null,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        },
        modules.casa !== false && {
          id: 'casa',
          label: 'Contratos da Casa',
          icon: Home,
          badge: pendingHouseCount > 0 ? `${pendingHouseCount}` : null,
          badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
        },
      ].filter(Boolean) as any[],
    },
    // Patrimônio & Financiamentos (Veículos & Simulador de Amortização)
    (modules.veiculos !== false || modules.amortizacao !== false) && {
      section: 'PATRIMÔNIO & FINANCIAMENTOS',
      items: [
        modules.veiculos !== false && {
          id: 'veiculos',
          label: 'Meus Veículos',
          icon: Car,
          badge: data.vehicles && data.vehicles.length > 0 ? `${data.vehicles.length}` : null,
          badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
        },
        modules.amortizacao !== false && {
          id: 'amortizacao',
          label: 'Simulador Amortização',
          icon: TrendingUp,
          badge: 'SAC/PRICE',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        },
      ].filter(Boolean) as any[],
    },
    // Investimentos, Metas & DRE Anual (Sprint 4)
    (modules.investimentos !== false || modules.metas !== false || modules.visaoAnual !== false) && {
      section: 'INVESTIMENTOS & FUTURO',
      items: [
        modules.investimentos !== false && {
          id: 'investimentos',
          label: 'Investimentos',
          icon: TrendingUp,
          badge: data.investments && data.investments.length > 0 ? `${data.investments.length}` : null,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        },
        modules.metas !== false && {
          id: 'metas',
          label: 'Metas Financeiras',
          icon: Target,
          badge: data.goals && data.goals.length > 0 ? `${data.goals.length}` : null,
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
        },
        modules.visaoAnual !== false && {
          id: 'visaoAnual',
          label: 'Visão Anual DRE',
          icon: BarChart3,
          badge: '12M',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
        },
      ].filter(Boolean) as any[],
    },
    {
      section: 'SISTEMA',
      items: [
        {
          id: 'config',
          label: 'Ajustes & Módulos',
          icon: Settings,
          badge: updateAvailable
            ? 'Update!'
            : data.creditCards && data.creditCards.length > 0
            ? `${data.creditCards.length} cartões`
            : null,
          badgeColor: updateAvailable ? 'bg-emerald-400 text-slate-950 font-black animate-pulse' : undefined,
        },
      ],
    },
  ].filter(Boolean) as any[];

  return (
    <aside className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none text-slate-300 z-30">
      {/* Top Header & Brand */}
      <div className="p-5 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20 shrink-0 font-black">
            <Building2 className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="font-black text-white tracking-tight text-base truncate">
                {settings.systemTitle || 'FinanPro Suite'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium block truncate">
              {settings.userName || 'Controle Pessoal'}
            </span>
            {updateAvailable && (
              <button
                type="button"
                onClick={onOpenUpdateModal}
                className="mt-1.5 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-[10px] font-black transition-all animate-pulse"
              >
                <Sparkles className="w-3 h-3 text-emerald-300 shrink-0" />
                <span>Atualização Disponível</span>
              </button>
            )}
          </div>
        </div>

        {/* Primary Action Button */}
        <button
          onClick={onOpenNewTx}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl font-black text-xs shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Nova Movimentação</span>
        </button>

        {/* Navigation Sections */}
        <div className="space-y-5 pt-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
          {navSections.map((group) => (
            <div key={group.section} className="space-y-1">
              <span className="px-3 text-[10px] font-black tracking-widest uppercase text-slate-500 block">
                {group.section}
              </span>
              <nav className="space-y-1">
                {group.items.map((item: any) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-400 font-extrabold border border-emerald-500/25 shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          className={`w-4 h-4 transition-colors ${
                            isActive ? 'text-emerald-400' : 'text-slate-400'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>

                      {item.badge && (
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            item.badgeColor ||
                            (isActive
                              ? 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700')
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Profile / Storage Status Card */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs shrink-0">
              {userInitial}
            </div>
            <div className="overflow-hidden">
              <span className="text-xs font-black text-white block leading-tight truncate">
                {settings.userName || 'Meu Usuário'}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isSaved ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
                  }`}
                />
                {isSaved ? 'Salvo Localmente' : 'Gravando...'}
              </span>
            </div>
          </div>

          <div
            title="Seus dados ficam 100% seguros e armazenados no computador"
            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0"
          >
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>
      </div>
    </aside>
  );
};
