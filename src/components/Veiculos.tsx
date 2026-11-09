import React, { useState, useMemo } from 'react';
import {
  Car,
  Fuel,
  Wrench,
  Shield,
  FileCheck2,
  Plus,
  Trash2,
  Edit2,
  AlertTriangle,
  CheckCircle2,
  Gauge,
  TrendingDown,
  Calendar,
  DollarSign,
  Droplet,
  Layers
} from 'lucide-react';
import { Vehicle, VehicleExpense, VehicleExpenseType } from '../types/finance';
import { formatCurrency, formatDate } from '../utils/formatters';

interface VeiculosProps {
  vehicles: Vehicle[];
  expenses: VehicleExpense[];
  onSaveVehicle: (vehicle: Vehicle) => void;
  onDeleteVehicle: (id: string) => void;
  onSaveExpense: (expense: VehicleExpense) => void;
  onDeleteExpense: (id: string) => void;
}

export const Veiculos: React.FC<VeiculosProps> = ({
  vehicles,
  expenses,
  onSaveVehicle,
  onDeleteVehicle,
  onSaveExpense,
  onDeleteExpense,
}) => {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'veiculos' | 'abastecimento' | 'manutencao' | 'despesas'>('veiculos');

  // Modals state
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);
  const [vehicleToEdit, setVehicleToEdit] = useState<Vehicle | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<VehicleExpense | null>(null);
  const [defaultExpenseType, setDefaultExpenseType] = useState<VehicleExpenseType>('abastecimento');

  // Vehicle form state
  const [vName, setVName] = useState('');
  const [vBrand, setVBrand] = useState('');
  const [vModel, setVModel] = useState('');
  const [vYear, setVYear] = useState<number>(new Date().getFullYear());
  const [vPlate, setVPlate] = useState('');
  const [vColor, setVColor] = useState('#3b82f6');
  const [vKm, setVKm] = useState<number>(0);
  const [vInsuranceDate, setVInsuranceDate] = useState('');
  const [vLicenseDate, setVLicenseDate] = useState('');

  // Expense form state
  const [eType, setEType] = useState<VehicleExpenseType>('abastecimento');
  const [eVehicleId, setEVehicleId] = useState('');
  const [eDate, setEDate] = useState(new Date().toISOString().slice(0, 10));
  const [eAmount, setEAmount] = useState<number>(0);
  const [eKm, setEKm] = useState<number>(0);
  const [eLiters, setELiters] = useState<number>(0);
  const [ePricePerLiter, setEPricePerLiter] = useState<number>(0);
  const [eFuelType, setEFuelType] = useState<'gasolina' | 'etanol' | 'diesel' | 'gnv'>('gasolina');
  const [eIsFullTank, setEIsFullTank] = useState(true);
  const [eServiceDesc, setEServiceDesc] = useState('');
  const [eNextServiceKm, setENextServiceKm] = useState<number>(0);
  const [eNextServiceDate, setENextServiceDate] = useState('');
  const [eWorkshop, setEWorkshop] = useState('');
  const [eNotes, setENotes] = useState('');

  // Filter expenses by selected vehicle
  const filteredExpenses = useMemo(() => {
    if (selectedVehicleId === 'all') return expenses;
    return expenses.filter((e) => e.vehicleId === selectedVehicleId);
  }, [expenses, selectedVehicleId]);

  // KPIs
  const totalSpent = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const fuelSpent = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.type === 'abastecimento')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const maintenanceSpent = useMemo(() => {
    return filteredExpenses
      .filter((e) => e.type === 'manutencao')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Fuel consumption calculation (km/L) for full tank consecutive refills
  const fuelMetrics = useMemo(() => {
    // Only sort abastecimentos with valid km
    const refills = [...filteredExpenses]
      .filter((e) => e.type === 'abastecimento' && e.currentKm && e.liters && e.liters > 0)
      .sort((a, b) => (a.currentKm || 0) - (b.currentKm || 0));

    let totalKmDiff = 0;
    let totalLiters = 0;

    for (let i = 1; i < refills.length; i++) {
      const prev = refills[i - 1];
      const curr = refills[i];
      if (curr.currentKm! > prev.currentKm!) {
        totalKmDiff += curr.currentKm! - prev.currentKm!;
        totalLiters += curr.liters!;
      }
    }

    const avgKmL = totalLiters > 0 ? totalKmDiff / totalLiters : null;
    const costPerKm = totalKmDiff > 0 && fuelSpent > 0 ? fuelSpent / totalKmDiff : null;

    return { avgKmL, costPerKm, totalRefills: refills.length };
  }, [filteredExpenses, fuelSpent]);

  // Open Vehicle Modal
  const handleOpenVehicleModal = (veh?: Vehicle) => {
    if (veh) {
      setVehicleToEdit(veh);
      setVName(veh.name);
      setVBrand(veh.brand);
      setVModel(veh.model);
      setVYear(veh.year);
      setVPlate(veh.plate || '');
      setVColor(veh.color || '#3b82f6');
      setVKm(veh.currentKm || 0);
      setVInsuranceDate(veh.insuranceDueDate || '');
      setVLicenseDate(veh.licenseDueDate || '');
    } else {
      setVehicleToEdit(null);
      setVName('');
      setVBrand('');
      setVModel('');
      setVYear(new Date().getFullYear());
      setVPlate('');
      setVColor('#3b82f6');
      setVKm(0);
      setVInsuranceDate('');
      setVLicenseDate('');
    }
    setIsVehicleModalOpen(true);
  };

  const handleSaveVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName.trim()) return;

    const newVehicle: Vehicle = {
      id: vehicleToEdit ? vehicleToEdit.id : `veh-${Date.now()}`,
      name: vName.trim(),
      brand: vBrand.trim(),
      model: vModel.trim(),
      year: Number(vYear),
      plate: vPlate.trim().toUpperCase(),
      color: vColor,
      currentKm: Number(vKm),
      insuranceDueDate: vInsuranceDate || undefined,
      licenseDueDate: vLicenseDate || undefined,
    };

    onSaveVehicle(newVehicle);
    setIsVehicleModalOpen(false);
  };

  // Open Expense Modal
  const handleOpenExpenseModal = (type: VehicleExpenseType = 'abastecimento', exp?: VehicleExpense) => {
    setDefaultExpenseType(type);
    if (exp) {
      setExpenseToEdit(exp);
      setEType(exp.type);
      setEVehicleId(exp.vehicleId);
      setEDate(exp.date);
      setEAmount(exp.amount);
      setEKm(exp.currentKm || 0);
      setELiters(exp.liters || 0);
      setEPricePerLiter(exp.pricePerLiter || 0);
      setEFuelType(exp.fuelType || 'gasolina');
      setEIsFullTank(exp.isFullTank !== false);
      setEServiceDesc(exp.serviceDescription || '');
      setENextServiceKm(exp.nextServiceKm || 0);
      setENextServiceDate(exp.nextServiceDate || '');
      setEWorkshop(exp.workshop || '');
      setENotes(exp.notes || '');
    } else {
      setExpenseToEdit(null);
      setEType(type);
      setEVehicleId(vehicles[0]?.id || '');
      setEDate(new Date().toISOString().slice(0, 10));
      setEAmount(0);
      setEKm(vehicles[0]?.currentKm || 0);
      setELiters(0);
      setEPricePerLiter(0);
      setEFuelType('gasolina');
      setEIsFullTank(true);
      setEServiceDesc('');
      setENextServiceKm(0);
      setENextServiceDate('');
      setEWorkshop('');
      setENotes('');
    }
    setIsExpenseModalOpen(true);
  };

  const handleSaveExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eVehicleId || eAmount <= 0) return;

    const newExp: VehicleExpense = {
      id: expenseToEdit ? expenseToEdit.id : `vexp-${Date.now()}`,
      vehicleId: eVehicleId,
      type: eType,
      date: eDate,
      amount: Number(eAmount),
      currentKm: eKm ? Number(eKm) : undefined,
      liters: eLiters ? Number(eLiters) : undefined,
      pricePerLiter: ePricePerLiter ? Number(ePricePerLiter) : undefined,
      fuelType: eType === 'abastecimento' ? eFuelType : undefined,
      isFullTank: eType === 'abastecimento' ? eIsFullTank : undefined,
      serviceDescription: eServiceDesc || undefined,
      nextServiceKm: eNextServiceKm ? Number(eNextServiceKm) : undefined,
      nextServiceDate: eNextServiceDate || undefined,
      workshop: eWorkshop || undefined,
      notes: eNotes || undefined,
    };

    onSaveExpense(newExp);

    // If currentKm entered is higher than vehicle's current km, update vehicle's km automatically!
    const targetVeh = vehicles.find((v) => v.id === eVehicleId);
    if (targetVeh && eKm && eKm > targetVeh.currentKm) {
      onSaveVehicle({
        ...targetVeh,
        currentKm: Number(eKm),
      });
    }

    setIsExpenseModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-sky-900/40 p-6 rounded-3xl shadow-xl text-white">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Car className="w-5 h-5" />
            </span>
            <span className="text-xs uppercase tracking-wider font-semibold text-sky-400">
              Gestão de Garagem & Frotas
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            Meus Veículos & Custos
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Acompanhe médias de consumo (km/L), manutenções preventivas, troca de óleo, IPVA, seguro
            e o custo real por quilômetro rodado dos seus carros e motos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleOpenVehicleModal()}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Novo Veículo</span>
          </button>
          <button
            onClick={() => handleOpenExpenseModal('abastecimento')}
            disabled={vehicles.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-sky-500/20 transition-all active:scale-95"
          >
            <Fuel className="w-4 h-4" />
            <span>Abastecer</span>
          </button>
          <button
            onClick={() => handleOpenExpenseModal('manutencao')}
            disabled={vehicles.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Wrench className="w-4 h-4" />
            <span>Manutenção</span>
          </button>
        </div>
      </div>

      {/* Vehicle Filter Selector & Subtabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700">Filtrar por Veículo:</span>
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">Todos os Veículos ({vehicles.length})</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} {v.plate ? `(${v.plate})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Subtabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('veiculos')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'veiculos'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Garagem ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveSubTab('abastecimento')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'abastecimento'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Abastecimentos
          </button>
          <button
            onClick={() => setActiveSubTab('manutencao')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'manutencao'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Revisões & Peças
          </button>
          <button
            onClick={() => setActiveSubTab('despesas')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeSubTab === 'despesas'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            IPVA & Seguro
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Custo Total de Veículos</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-800">{formatCurrency(totalSpent)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Soma de todos os lançamentos registrados.</p>
        </div>

        <div className="p-5 rounded-3xl bg-sky-50/50 border border-sky-100">
          <div className="flex items-center justify-between text-sky-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Combustível Gasto</span>
            <Fuel className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-sky-700">{formatCurrency(fuelSpent)}</div>
          <p className="text-[11px] text-slate-500 mt-1">
            {fuelMetrics.avgKmL
              ? `Média calculada: ${fuelMetrics.avgKmL.toFixed(1)} km/L`
              : 'Cadastre abastecimentos para média km/L'}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-indigo-50/50 border border-indigo-100">
          <div className="flex items-center justify-between text-indigo-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Manutenções & Peças</span>
            <Wrench className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-indigo-700">{formatCurrency(maintenanceSpent)}</div>
          <p className="text-[11px] text-slate-500 mt-1">Revisões, pneus, trocas de óleo e serviços.</p>
        </div>

        <div className="p-5 rounded-3xl bg-emerald-50/50 border border-emerald-100">
          <div className="flex items-center justify-between text-emerald-600 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Custo Estimado por KM</span>
            <Gauge className="w-4 h-4" />
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {fuelMetrics.costPerKm ? formatCurrency(fuelMetrics.costPerKm) + '/km' : 'R$ 0,00/km'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Gasto por cada quilômetro rodado.</p>
        </div>
      </div>

      {/* SUBTAB 1: GARAGEM / VEÍCULOS */}
      {activeSubTab === 'veiculos' && (
        <div className="space-y-4">
          {vehicles.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
              <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-bold text-slate-700 text-sm">Nenhum veículo cadastrado na garagem</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Cadastre seu carro, moto ou utilitário para começar a controlar abastecimentos,
                manutenções e impostos.
              </p>
              <button
                onClick={() => handleOpenVehicleModal()}
                className="mt-4 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold rounded-xl text-xs transition-all"
              >
                + Cadastrar Primeiro Veículo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vehicles.map((v) => {
                const vehExpenses = expenses.filter((e) => e.vehicleId === v.id);
                const vehTotal = vehExpenses.reduce((s, e) => s + e.amount, 0);

                // Check pending maintenance alerts
                const latestMaint = [...vehExpenses]
                  .filter((e) => e.type === 'manutencao' && (e.nextServiceKm || e.nextServiceDate))
                  .sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];

                const isMaintDueSoon =
                  latestMaint &&
                  latestMaint.nextServiceKm &&
                  v.currentKm >= latestMaint.nextServiceKm - 500;

                return (
                  <div
                    key={v.id}
                    className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md font-bold"
                            style={{ backgroundColor: v.color || '#3b82f6' }}
                          >
                            <Car className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{v.name}</h4>
                            <p className="text-xs text-slate-500">
                              {v.brand} {v.model} • {v.year}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenVehicleModal(v)}
                            className="text-slate-400 hover:text-sky-600 p-1 rounded-lg hover:bg-slate-100"
                            title="Editar veículo"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteVehicle(v.id)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-slate-100"
                            title="Excluir veículo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Plate badge & Odômetro */}
                      <div className="flex items-center justify-between mt-4 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        {v.plate ? (
                          <span className="font-mono font-black text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300 tracking-wider">
                            {v.plate}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Sem placa</span>
                        )}
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          <Gauge className="w-3.5 h-3.5 text-slate-400" />
                          {v.currentKm ? `${v.currentKm.toLocaleString('pt-BR')} km` : '0 km'}
                        </span>
                      </div>

                      {/* Maintenance / Service alert if applicable */}
                      {isMaintDueSoon && (
                        <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>
                            Próxima revisão próxima ({latestMaint.nextServiceKm?.toLocaleString('pt-BR')} km)
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Total investido:</span>
                      <span className="font-black text-slate-900">{formatCurrency(vehTotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2, 3, 4: LISTAGEM DE LANÇAMENTOS (ABASTECIMENTOS, MANUTENÇÕES, DESPESAS) */}
      {activeSubTab !== 'veiculos' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm">
              {activeSubTab === 'abastecimento' && 'Histórico de Abastecimentos'}
              {activeSubTab === 'manutencao' && 'Histórico de Revisões & Serviços'}
              {activeSubTab === 'despesas' && 'IPVA, Licenciamento, Seguro e Taxas'}
            </h3>
            <button
              onClick={() => handleOpenExpenseModal(activeSubTab === 'despesas' ? 'ipva' : activeSubTab)}
              disabled={vehicles.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Registro</span>
            </button>
          </div>

          {filteredExpenses.filter((e) =>
            activeSubTab === 'abastecimento'
              ? e.type === 'abastecimento'
              : activeSubTab === 'manutencao'
              ? e.type === 'manutencao'
              : ['ipva', 'seguro', 'licenciamento', 'multa', 'lavagem', 'outros'].includes(e.type)
          ).length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Nenhum lançamento registrado nesta categoria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">Data</th>
                    <th className="p-3">Veículo</th>
                    <th className="p-3">Tipo / Descrição</th>
                    <th className="p-3">Odômetro</th>
                    {activeSubTab === 'abastecimento' && <th className="p-3">Litros / Preço</th>}
                    {activeSubTab === 'manutencao' && <th className="p-3">Oficina / Próxima</th>}
                    <th className="p-3 text-right">Valor</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses
                    .filter((e) =>
                      activeSubTab === 'abastecimento'
                        ? e.type === 'abastecimento'
                        : activeSubTab === 'manutencao'
                        ? e.type === 'manutencao'
                        : ['ipva', 'seguro', 'licenciamento', 'multa', 'lavagem', 'outros'].includes(e.type)
                    )
                    .map((exp) => {
                      const veh = vehicles.find((v) => v.id === exp.vehicleId);
                      return (
                        <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-medium text-slate-600">{formatDate(exp.date)}</td>
                          <td className="p-3 font-bold text-slate-800">
                            {veh ? veh.name : 'Veículo Desconhecido'}
                          </td>
                          <td className="p-3 text-slate-600">
                            {exp.serviceDescription || exp.notes || exp.type.toUpperCase()}
                          </td>
                          <td className="p-3 text-slate-500 font-mono">
                            {exp.currentKm ? `${exp.currentKm.toLocaleString('pt-BR')} km` : '-'}
                          </td>
                          {activeSubTab === 'abastecimento' && (
                            <td className="p-3 text-slate-600">
                              {exp.liters ? `${exp.liters}L` : ''}
                              {exp.pricePerLiter ? ` @ R$ ${exp.pricePerLiter.toFixed(2)}` : ''}
                            </td>
                          )}
                          {activeSubTab === 'manutencao' && (
                            <td className="p-3 text-slate-600">
                              {exp.workshop || ''}
                              {exp.nextServiceKm ? ` (Próx: ${exp.nextServiceKm} km)` : ''}
                            </td>
                          )}
                          <td className="p-3 text-right font-black text-rose-600">
                            {formatCurrency(exp.amount)}
                          </td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => onDeleteExpense(exp.id)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Excluir lançamento"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: CADASTRAR / EDITAR VEÍCULO */}
      {isVehicleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                {vehicleToEdit ? 'Editar Veículo' : 'Novo Veículo na Garagem'}
              </h3>
              <button
                onClick={() => setIsVehicleModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVehicleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Nome / Apelido</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Honda Civic, Yamaha MT, HB20"
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Marca</label>
                  <input
                    type="text"
                    placeholder="Ex: Honda, Toyota, Fiat"
                    value={vBrand}
                    onChange={(e) => setVBrand(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Modelo</label>
                  <input
                    type="text"
                    placeholder="Ex: Civic G10, Onix Plus"
                    value={vModel}
                    onChange={(e) => setVModel(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Ano</label>
                  <input
                    type="number"
                    value={vYear}
                    onChange={(e) => setVYear(Number(e.target.value))}
                    className="mt-1 w-full px-2 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Placa</label>
                  <input
                    type="text"
                    placeholder="ABC-1234"
                    value={vPlate}
                    onChange={(e) => setVPlate(e.target.value)}
                    className="mt-1 w-full px-2 py-2 text-xs rounded-xl border border-slate-200 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">KM Atual</label>
                  <input
                    type="number"
                    value={vKm}
                    onChange={(e) => setVKm(Number(e.target.value))}
                    className="mt-1 w-full px-2 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVehicleModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl shadow-md transition-all"
                >
                  Salvar Veículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: LANÇAR GASTO / ABASTECIMENTO / MANUTENÇÃO */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Registrar Despesa do Veículo</h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpenseSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Veículo</label>
                <select
                  required
                  value={eVehicleId}
                  onChange={(e) => setEVehicleId(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.plate || `${v.brand} ${v.model}`})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Tipo de Lançamento</label>
                  <select
                    value={eType}
                    onChange={(e) => setEType(e.target.value as VehicleExpenseType)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-semibold"
                  >
                    <option value="abastecimento">⛽ Abastecimento</option>
                    <option value="manutencao">🔧 Manutenção / Revisão</option>
                    <option value="ipva">📄 IPVA</option>
                    <option value="seguro">🛡️ Seguro</option>
                    <option value="licenciamento">📋 Licenciamento</option>
                    <option value="lavagem">🧼 Lavagem / Estética</option>
                    <option value="multa">⚠️ Multa</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Data</label>
                  <input
                    type="date"
                    required
                    value={eDate}
                    onChange={(e) => setEDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={eAmount || ''}
                    onChange={(e) => setEAmount(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-bold text-rose-600"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Odômetro (KM)</label>
                  <input
                    type="number"
                    value={eKm || ''}
                    onChange={(e) => setEKm(Number(e.target.value))}
                    className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Specific for Abastecimento */}
              {eType === 'abastecimento' && (
                <div className="p-3 rounded-2xl bg-sky-50/60 border border-sky-100 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Litros</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 42.5"
                        value={eLiters || ''}
                        onChange={(e) => {
                          const l = Number(e.target.value);
                          setELiters(l);
                          if (l > 0 && eAmount > 0) {
                            setEPricePerLiter(Number((eAmount / l).toFixed(2)));
                          }
                        }}
                        className="mt-1 w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Preço / Litro</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Ex: 5.89"
                        value={ePricePerLiter || ''}
                        onChange={(e) => setEPricePerLiter(Number(e.target.value))}
                        className="mt-1 w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="fullTank"
                      checked={eIsFullTank}
                      onChange={(e) => setEIsFullTank(e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <label htmlFor="fullTank" className="text-xs text-slate-600">
                      Tanque cheio (usado para calcular média de km/L)
                    </label>
                  </div>
                </div>
              )}

              {/* Specific for Manutenção */}
              {eType === 'manutencao' && (
                <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                  <div>
                    <label className="text-xs font-semibold text-slate-600">Descrição do Serviço</label>
                    <input
                      type="text"
                      placeholder="Ex: Troca de óleo 5W30 + Filtros"
                      value={eServiceDesc}
                      onChange={(e) => setEServiceDesc(e.target.value)}
                      className="mt-1 w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Oficina / Mecânica</label>
                      <input
                        type="text"
                        placeholder="Ex: Concessionária"
                        value={eWorkshop}
                        onChange={(e) => setEWorkshop(e.target.value)}
                        className="mt-1 w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Próx. Revisão (KM)</label>
                      <input
                        type="number"
                        placeholder="Ex: 60000"
                        value={eNextServiceKm || ''}
                        onChange={(e) => setENextServiceKm(Number(e.target.value))}
                        className="mt-1 w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600">Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Posto Ipiranga da Av. Principal"
                  value={eNotes}
                  onChange={(e) => setENotes(e.target.value)}
                  className="mt-1 w-full px-3 py-2 text-xs rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-xl shadow-md transition-all"
                >
                  Salvar Lançamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
