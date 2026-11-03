import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  HardHat,
  Home,
  Settings,
  Plus,
  ShieldCheck,
  Building2,
  Sparkles
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenNewTx: () => void;
  isSaved: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenNewTx,
  isSaved,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'movimentacoes', label: 'Movimentações', icon: Receipt },
    { id: 'obra', label: 'Evolução de Obra', icon: HardHat },
    { id: 'casa', label: 'Contratos da Casa', icon: Home },
    { id: 'config', label: 'Ajustes & Cartões', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500/10">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">
                  Finanças & Obra
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200/60 shadow-xs">
                  Gabi
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium block -mt-0.5">
                Controle Financeiro & Construção
              </span>
            </div>
          </div>

          {/* Center Tabs Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200/50">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-slate-900 shadow-sm shadow-slate-200/80 scale-[1.02]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action & Status */}
          <div className="flex items-center gap-3">
            <div
              title="Seus dados estão protegidos e salvos exclusivamente no computador"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 text-slate-600 text-[11px] font-bold border border-slate-200/60"
            >
              <div
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  isSaved ? 'bg-emerald-500 shadow-xs shadow-emerald-500' : 'bg-amber-500 animate-ping'
                }`}
              />
              <span>{isSaved ? '100% Salvo Local' : 'Gravando...'}</span>
            </div>

            <button
              onClick={onOpenNewTx}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all hover:scale-[1.03] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Lançamento</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-100 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex flex-col items-center py-1 px-2.5 text-[10px] font-bold transition-colors ${
                  isActive ? 'text-emerald-600 font-extrabold' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
