import React, { useState, useMemo } from 'react';
import { AppData, CreditCardItem, EnabledModules } from '../types/finance';
import { storageService } from '../services/storageService';
import { formatCurrency } from '../utils/formatters';
import {
  Settings,
  Download,
  Upload,
  FileSpreadsheet,
  FolderOpen,
  ShieldCheck,
  Plus,
  Trash2,
  HardDrive,
  CreditCard,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
  User,
  SlidersHorizontal,
  LayoutDashboard,
  Receipt,
  Wallet,
  HardHat,
  Home,
  Check,
  Save,
  Car,
  TrendingUp,
  RefreshCw,
  Target,
  BarChart3
} from 'lucide-react';

interface ConfiguracoesProps {
  data: AppData;
  onUpdateData: (newData: AppData) => void;
  onAddCategory: (cat: string) => void;
  onDeleteCategory: (cat: string) => void;
  onAddCard: (card: CreditCardItem) => void;
  onDeleteCard: (id: string) => void;
}

const CARD_COLORS = [
  { name: 'Roxo (Nubank)', value: '#8b5cf6', bg: 'bg-purple-600' },
  { name: 'Laranja (Inter/Itaú)', value: '#f97316', bg: 'bg-orange-500' },
  { name: 'Azul (Caixa/BB)', value: '#2563eb', bg: 'bg-blue-600' },
  { name: 'Grafite / Preto (Black)', value: '#1e293b', bg: 'bg-slate-800' },
  { name: 'Esmeralda (Verde)', value: '#059669', bg: 'bg-emerald-600' },
  { name: 'Dourado (Gold)', value: '#d97706', bg: 'bg-amber-600' },
];

export const Configuracoes: React.FC<ConfiguracoesProps> = ({
  data,
  onUpdateData,
  onAddCategory,
  onDeleteCategory,
  onAddCard,
  onDeleteCard,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'perfil' | 'modulos' | 'cartoes' | 'categorias' | 'backup'>('perfil');

  // Profile state
  const [userName, setUserName] = useState(data.appSettings?.userName || 'Meu Usuário');
  const [systemTitle, setSystemTitle] = useState(data.appSettings?.systemTitle || 'FinanPro Suite');
  const [isSavedProfile, setIsSavedProfile] = useState(false);

  // Category form state
  const [newCat, setNewCat] = useState('');
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Card form state
  const [cardName, setCardName] = useState('');
  const [cardDigits, setCardDigits] = useState('');
  const [cardLimit, setCardLimit] = useState('');
  const [cardColor, setCardColor] = useState(CARD_COLORS[0].value);

  // Enabled modules
  const currentModules: EnabledModules = Object.assign(
    {
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
    data.appSettings?.enabledModules || {}
  );

  // Calculate card usage
  const cardsWithUsage = useMemo(() => {
    const list = data.creditCards || [];
    return list.map((card) => {
      const pendingExpenses = data.transactions
        .filter((t) => t.type === 'saida' && t.creditCardId === card.id && t.status === 'pendente')
        .reduce((acc, t) => acc + t.amount, 0);

      const availableLimit = Math.max(0, card.limit - pendingExpenses);
      const usedPercent = card.limit > 0 ? (pendingExpenses / card.limit) * 100 : 0;

      return {
        ...card,
        pendingExpenses,
        availableLimit,
        usedPercent,
      };
    });
  }, [data.creditCards, data.transactions]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      alert('Informe um nome de usuário.');
      return;
    }
    const updatedData: AppData = {
      ...data,
      appSettings: {
        ...data.appSettings,
        userName: userName.trim(),
        systemTitle: systemTitle.trim() || 'FinanPro Suite',
      },
    };
    onUpdateData(updatedData);
    setIsSavedProfile(true);
    setTimeout(() => setIsSavedProfile(false), 2500);
  };

  const handleToggleModule = (key: keyof EnabledModules) => {
    const updatedModules: EnabledModules = {
      ...currentModules,
      [key]: !currentModules[key],
    };
    const updatedData: AppData = {
      ...data,
      appSettings: {
        ...data.appSettings,
        enabledModules: updatedModules,
      },
    };
    onUpdateData(updatedData);
  };

  const handleExportExcel = () => {
    try {
      setIsExportingExcel(true);
      storageService.exportToExcel(data);
    } catch (err) {
      alert('Erro ao exportar Excel: ' + err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportBackup = async () => {
    try {
      await storageService.exportBackup(data);
    } catch (err) {
      alert('Erro ao exportar backup: ' + err);
    }
  };

  const handleImportBackup = async () => {
    if (
      !window.confirm(
        'Atenção: Ao restaurar um backup, os dados atuais serão substituídos pelo arquivo importado. Deseja continuar?'
      )
    ) {
      return;
    }

    try {
      const imported = await storageService.importBackup();
      if (imported) {
        onUpdateData(imported);
        alert('Backup restaurado com sucesso!');
      }
    } catch (err) {
      alert('Erro ao importar backup: ' + err);
    }
  };

  const handleOpenFolder = async () => {
    try {
      await storageService.openDataFolder();
    } catch (err) {
      alert('Não foi possível abrir a pasta automaticamente.');
    }
  };

  const handleResetAllData = () => {
    const confirmed = window.confirm(
      '⚠️ ATENÇÃO: Tem certeza que deseja zerar todos os dados do sistema?\n\nTodas as movimentações, registros de obra, parcelamentos de casa, cartões e anotações serão apagados permanentemente para entregar o sistema zerado.'
    );
    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      'Confirmação Final: Deseja realmente esvaziar todo o banco de dados agora?'
    );
    if (!doubleConfirmed) return;

    const cleanData: AppData = {
      transactions: [],
      obraEntries: [],
      houseInstallments: [],
      creditCards: [],
      bankAccounts: data.bankAccounts || [],
      monthlyNotes: {},
      categories: data.categories || [],
      appSettings: {
        ...data.appSettings,
        lastSaved: new Date().toISOString(),
      },
    };

    onUpdateData(cleanData);
    alert('Banco de dados zerado com sucesso! O sistema está pronto e totalmente limpo.');
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    if (data.categories.includes(newCat.trim())) {
      alert('Esta categoria já existe!');
      return;
    }
    onAddCategory(newCat.trim());
    setNewCat('');
  };

  const handleAddCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanDigits = cardDigits.replace(/\D/g, '');
    const parsedLimit = parseFloat(cardLimit.replace(',', '.'));

    if (!cardName.trim()) {
      alert('Informe o apelido do cartão (ex: Nubank, Inter, Itaú).');
      return;
    }
    if (cleanDigits.length < 2 || cleanDigits.length > 4) {
      alert('Informe os 4 últimos dígitos do cartão (ex: 4821).');
      return;
    }
    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      alert('Informe um limite total válido para o cartão.');
      return;
    }

    const newCard: CreditCardItem = {
      id: `card-${Date.now()}`,
      name: cardName.trim(),
      lastFourDigits: cleanDigits,
      limit: parsedLimit,
      color: cardColor,
    };

    onAddCard(newCard);
    setCardName('');
    setCardDigits('');
    setCardLimit('');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-slate-800 text-white rounded-xl shadow-md">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
              Ajustes & Central de Módulos
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Personalize sua identidade, ative ou desative módulos e gerencie backups.
            </p>
          </div>
        </div>

        <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Sem dados sensíveis • 100% Local
        </span>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('perfil')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'perfil'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Perfil & Marca</span>
        </button>

        <button
          onClick={() => setActiveSubTab('modulos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'modulos'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Central de Módulos</span>
        </button>

        <button
          onClick={() => setActiveSubTab('cartoes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'cartoes'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Cartões de Crédito ({data.creditCards?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categorias')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'categorias'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Categorias ({data.categories.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeSubTab === 'backup'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Backup & Dados</span>
        </button>
      </div>

      {/* SUBTAB 1: PERFIL & MARCA (White-label) */}
      {activeSubTab === 'perfil' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-600" />
              <span>Personalização de Identidade (White-Label)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Altere o nome do usuário e o título do aplicativo para seu uso pessoal ou para entregar a clientes.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nome do Usuário / Titular
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Carlos, Alexandre, Família Oliveira..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Aparece no rodapé da barra lateral e nos relatórios.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Título do Sistema / Marca
              </label>
              <input
                type="text"
                required
                placeholder="Ex: FinanPro Suite, Gestão Financeira Pessoal..."
                value={systemTitle}
                onChange={(e) => setSystemTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">
                Nome do software exibido no topo da navegação.
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSavedProfile ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>{isSavedProfile ? 'Alterações Salvas!' : 'Salvar Identidade'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBTAB 2: CENTRAL DE MÓDULOS */}
      {activeSubTab === 'modulos' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-blue-600" />
              <span>Central de Módulos (Ligar / Desligar Recursos)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Ative ou oculte abas na barra lateral conforme o seu momento ou o perfil do seu cliente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dashboard */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-800 text-white rounded-xl">
                  <LayoutDashboard className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Painel Geral (Dashboard)</h4>
                  <p className="text-xs text-slate-400">Resumo visual de saldos e gráficos rápidos.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={currentModules.dashboard !== false}
                onChange={() => handleToggleModule('dashboard')}
                className="w-5 h-5 accent-emerald-600 cursor-pointer rounded"
              />
            </div>

            {/* Movimentações */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Movimentações & Lançamentos</h4>
                  <p className="text-xs text-slate-400">Entradas, saídas e isolamento por mês.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={currentModules.movimentacoes !== false}
                onChange={() => handleToggleModule('movimentacoes')}
                className="w-5 h-5 accent-emerald-600 cursor-pointer rounded"
              />
            </div>

            {/* Contas Bancárias */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Contas & Saldos Reais</h4>
                  <p className="text-xs text-slate-400">Conciliação bancária e transferências.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={currentModules.contas !== false}
                onChange={() => handleToggleModule('contas')}
                className="w-5 h-5 accent-emerald-600 cursor-pointer rounded"
              />
            </div>

            {/* Orçamento & Tetos */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-600 text-white rounded-xl">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Orçamento & Teto de Gastos</h4>
                  <p className="text-xs text-slate-400">Sistema de envelopes com alertas de estouro.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={currentModules.orcamento !== false}
                onChange={() => handleToggleModule('orcamento')}
                className="w-5 h-5 accent-emerald-600 cursor-pointer rounded"
              />
            </div>

            {/* Evolução de Obra */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-600 text-white rounded-xl">
                  <HardHat className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Evolução de Obra (Caixa)</h4>
                  <p className="text-xs text-slate-400">Controle de medição de obras e taxas.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={currentModules.obra !== false}
                onChange={() => handleToggleModule('obra')}
                className="w-5 h-5 accent-emerald-600 cursor-pointer rounded"
              />
            </div>

            {/* Contratos da Casa */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                  <Home className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">Contratos da Casa & Reforma</h4>
                  <p className="text-xs text-slate-400">Móveis planejados, acabamentos e parcelas.</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={currentModules.casa !== false}
                onChange={() => handleToggleModule('casa')}
                className="w-5 h-5 accent-emerald-600 cursor-pointer rounded"
              />
            </div>

            {/* Previews dos Módulos Próximos */}
            <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/20 flex items-center justify-between opacity-75">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/20 text-orange-600 rounded-xl">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-sm">Veículos & Financiamentos</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-black">
                      Sprint 3
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">IPVA, amortização SAC e custos operacionais.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400">Em Breve</span>
            </div>

            <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/20 flex items-center justify-between opacity-75">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/20 text-purple-600 rounded-xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-sm">Investimentos & Mercado</h4>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 font-black">
                      Sprint 4
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">Ações, FIIs, Tesouro e Dividendos.</p>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400">Em Breve</span>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: CARTÕES DE CRÉDITO */}
      {activeSubTab === 'cartoes' && (
        <div className="space-y-6">
          {/* Card Registration Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <div>
              <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Cadastrar Novo Cartão de Crédito
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Cadastre os cartões para controlar limite e faturas. Não solicitamos dados sensíveis (CVV, senhas ou número completo).
              </p>
            </div>

            <form onSubmit={handleAddCardSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Apelido do Cartão *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nubank, Inter, XP Visa..."
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Final do Cartão (4 Dígitos) *
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    required
                    placeholder="Ex: 4821"
                    value={cardDigits}
                    onChange={(e) => setCardDigits(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium tracking-widest"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Limite Total (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 5000,00"
                    value={cardLimit}
                    onChange={(e) => setCardLimit(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Cor de Identificação
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  {CARD_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCardColor(c.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                        cardColor === c.value
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs scale-105'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${c.bg} shrink-0`} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Cartão</span>
                </button>
              </div>
            </form>
          </div>

          {/* Cards List with Limit Gauges */}
          <div>
            <h3 className="font-extrabold text-slate-800 text-base mb-3 flex items-center justify-between">
              <span>Cartões Cadastrados</span>
              <span className="text-xs font-bold text-slate-400">
                {cardsWithUsage.length} {cardsWithUsage.length === 1 ? 'cartão' : 'cartões'}
              </span>
            </h3>

            {cardsWithUsage.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-400 text-xs">
                Nenhum cartão cadastrado. Adicione seus cartões acima para vincular às despesas parceladas.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cardsWithUsage.map((card) => (
                  <div
                    key={card.id}
                    className="p-5 rounded-2xl bg-white border border-slate-100 shadow-sm relative overflow-hidden flex flex-col justify-between"
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-1.5"
                      style={{ backgroundColor: card.color || '#8b5cf6' }}
                    />

                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs"
                            style={{ backgroundColor: card.color || '#8b5cf6' }}
                          >
                            <CreditCard className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-slate-800 text-base leading-tight">
                              {card.name}
                            </h4>
                            <span className="text-xs text-slate-400 font-mono font-bold tracking-wider">
                              •••• {card.lastFourDigits}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Deseja realmente remover o cartão ${card.name}?`)) {
                              onDeleteCard(card.id);
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Excluir cartão"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-xl bg-slate-50">
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">
                            Limite Total
                          </span>
                          <span className="text-xs font-black text-slate-700 mt-0.5 block">
                            {formatCurrency(card.limit)}
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-amber-50/60">
                          <span className="text-[10px] font-bold text-amber-700 uppercase block">
                            Fatura / Aberto
                          </span>
                          <span className="text-xs font-black text-amber-700 mt-0.5 block">
                            {formatCurrency(card.pendingExpenses)}
                          </span>
                        </div>

                        <div className="p-2 rounded-xl bg-emerald-50/60">
                          <span className="text-[10px] font-bold text-emerald-700 uppercase block">
                            Disponível
                          </span>
                          <span className="text-xs font-black text-emerald-700 mt-0.5 block">
                            {formatCurrency(card.availableLimit)}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                          <span className="text-slate-500">Uso do Limite</span>
                          <span
                            className={
                              card.usedPercent > 80
                                ? 'text-rose-600'
                                : card.usedPercent > 50
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }
                          >
                            {card.usedPercent.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              card.usedPercent > 80
                                ? 'bg-rose-500'
                                : card.usedPercent > 50
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.min(100, card.usedPercent)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 4: CATEGORIAS */}
      {activeSubTab === 'categorias' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">
              Categorias de Lançamentos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Personalize as categorias que aparecem no cadastro de movimentações.
            </p>
          </div>

          <form onSubmit={handleAddCategorySubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Nova categoria (ex: Academia, Combustível, Pets...)"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar</span>
            </button>
          </form>

          <div className="flex flex-wrap gap-2 pt-2">
            {data.categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200"
              >
                {cat}
                <button
                  type="button"
                  onClick={() => onDeleteCategory(cat)}
                  className="text-slate-400 hover:text-rose-600 transition-colors"
                  title={`Excluir categoria ${cat}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 5: BACKUP & DADOS */}
      {activeSubTab === 'backup' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export Excel */}
            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Exportar para Excel (.xlsx)
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Gera uma planilha completa com abas separadas para Movimentações, Contas, Evolução de Obra e Parcelamentos.
                </p>
              </div>
              <button
                onClick={handleExportExcel}
                disabled={isExportingExcel}
                className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>{isExportingExcel ? 'Exportando...' : 'Baixar Planilha Excel'}</span>
              </button>
            </div>

            {/* Export JSON Backup */}
            <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
                  <Download className="w-5 h-5 text-indigo-600" />
                  Backup Seguro Completo (.json)
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Salva todos os registros em um arquivo de backup que pode ser restaurado a qualquer
                  momento ou transferido para outro computador.
                </p>
              </div>
              <button
                onClick={handleExportBackup}
                className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="w-4 h-4" />
                <span>Gerar Arquivo de Backup</span>
              </button>
            </div>

            {/* Import JSON Backup */}
            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Upload className="w-5 h-5 text-amber-600" />
                  Restaurar Backup Anterior
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Carrega um arquivo de backup prévio para restaurar suas finanças.
                </p>
              </div>
              <button
                onClick={handleImportBackup}
                className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Upload className="w-4 h-4" />
                <span>Importar Arquivo de Backup</span>
              </button>
            </div>

            {/* Open Local Folder */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                  <FolderOpen className="w-5 h-5 text-slate-600" />
                  Pasta de Armazenamento Local
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Abre a pasta interna onde o arquivo de banco de dados do sistema fica gravado no seu
                  computador.
                </p>
              </div>
              <button
                onClick={handleOpenFolder}
                className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Abrir Pasta de Dados</span>
              </button>
            </div>

            {/* Zerar Banco de Dados */}
            <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-col justify-between md:col-span-2">
              <div>
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                  Zerar / Limpar Banco de Dados
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Apaga todas as movimentações, registros de obra, parcelamentos e cartões para entregar o sistema totalmente limpo.
                </p>
              </div>
              <button
                onClick={handleResetAllData}
                className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition-all hover:scale-[1.02] active:scale-[0.98] w-fit"
              >
                <Trash2 className="w-4 h-4" />
                <span>Zerar Todos os Dados</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* System info & Updates */}
      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-600 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <Info className="w-4 h-4 text-indigo-600" /> Informações do Sistema
          </div>
          <p>• Software: {data.appSettings?.systemTitle || 'FinanPro Suite'} (v2.0.0 Modular)</p>
          <p>• Titular: {data.appSettings?.userName || 'Meu Usuário'}</p>
          <p>• Suporte Nativo: Linux e Windows (100% Portável & Local)</p>
          <p>• Repositório: github.com/leooSsou/Sistema-financeiro</p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-2">
          <button
            onClick={async () => {
              if (window.electronAPI?.checkForUpdates) {
                const res = await window.electronAPI.checkForUpdates();
                if (res?.dev) {
                  alert(res.message);
                } else if (res?.error) {
                  alert('Erro ao verificar atualizações: ' + res.error);
                }
              } else {
                alert('Verificação de atualizações disponível no aplicativo desktop.');
              }
            }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Verificar Atualizações</span>
          </button>
          <span className="text-[11px] text-slate-500">
            Checagem automática ao iniciar
          </span>
        </div>
      </div>
    </div>
  );
};
