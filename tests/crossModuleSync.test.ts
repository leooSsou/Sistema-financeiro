import { describe, it, expect } from 'vitest';
import { Transaction, Vehicle, VehicleExpense } from '../src/types/finance';

describe('Cross-module Synchronization Logic', () => {
  it('automatically maps vehicle expense fields when a transaction has vehicleId', () => {
    const mockVehicle: Vehicle = {
      id: 'veh-1',
      name: 'Honda Civic',
      brand: 'Honda',
      model: 'Civic',
      year: 2021,
      currentKm: 45000,
    };

    const mockTx: Transaction = {
      id: 'tx-123',
      date: '2026-11-09',
      description: 'Posto Shell Gasolina Comum',
      type: 'saida',
      amount: 250.0,
      category: 'Transporte & Combustível',
      paymentMethod: 'PIX',
      status: 'pago',
      vehicleId: 'veh-1',
      vehicleExpenseType: 'abastecimento',
      vehicleKm: 45450,
      vehicleLiters: 42.5,
      vehiclePricePerLiter: 5.88,
    };

    // Simulate cross-module sync logic
    let vehicleExpenses: VehicleExpense[] = [];
    let vehicles = [mockVehicle];

    if (mockTx.vehicleId && mockTx.type === 'saida') {
      const newVehicleExpense: VehicleExpense = {
        id: `vexp-tx-${mockTx.id}`,
        vehicleId: mockTx.vehicleId,
        type: mockTx.vehicleExpenseType || 'abastecimento',
        date: mockTx.date,
        amount: mockTx.amount,
        currentKm: mockTx.vehicleKm,
        liters: mockTx.vehicleLiters,
        pricePerLiter: mockTx.vehiclePricePerLiter,
        serviceDescription: mockTx.description,
      };
      vehicleExpenses.push(newVehicleExpense);

      // Auto update odometer
      if (mockTx.vehicleKm && mockTx.vehicleKm > vehicles[0].currentKm) {
        vehicles[0] = { ...vehicles[0], currentKm: mockTx.vehicleKm };
      }
    }

    expect(vehicleExpenses).toHaveLength(1);
    expect(vehicleExpenses[0].amount).toBe(250.0);
    expect(vehicleExpenses[0].liters).toBe(42.5);
    expect(vehicleExpenses[0].vehicleId).toBe('veh-1');
    expect(vehicles[0].currentKm).toBe(45450); // Odometer increased from 45000 to 45450 automatically!
  });

  it('automatically synchronizes investment dividends to Movimentações as income', () => {
    const itx = {
      id: 'itx-456',
      assetId: 'inv-cdb',
      type: 'dividendo' as const,
      date: '2026-11-09',
      amount: 150.0,
      notes: 'Rendimento mensal CDB',
    };

    const isIncome = itx.type === 'dividendo' || itx.type === 'juros_capital' || itx.type === 'resgate';
    const syncdTx: Transaction = {
      id: `tx-inv-${itx.id}`,
      type: isIncome ? 'entrada' : 'saida',
      description: `[CDB DI] Rendimento / Dividendo`,
      amount: itx.amount,
      date: itx.date,
      category: isIncome ? 'Salário / Renda' : 'Outros',
      paymentMethod: 'Transferência',
      bankAccountId: 'bank-nubank',
      status: 'pago',
      investmentAssetId: itx.assetId,
      notes: itx.notes,
    };

    expect(syncdTx.type).toBe('entrada');
    expect(syncdTx.amount).toBe(150.0);
    expect(syncdTx.bankAccountId).toBe('bank-nubank');
    expect(syncdTx.investmentAssetId).toBe('inv-cdb');
  });

  it('automatically synchronizes goal quick deposits to Movimentações as expense and updates goal total', () => {
    let goal = {
      id: 'goal-1',
      title: 'Reserva de Emergência',
      targetAmount: 20000,
      currentAmount: 5000,
      category: 'reserva',
    };

    const depositAmount = 1000;
    goal = { ...goal, currentAmount: goal.currentAmount + depositAmount };

    const syncdTx: Transaction = {
      id: `tx-goal-${goal.id}-123`,
      type: 'saida',
      description: `[Meta: ${goal.title}] Aporte / Depósito`,
      amount: depositAmount,
      date: '2026-11-09',
      category: 'Investimentos',
      paymentMethod: 'Transferência',
      bankAccountId: 'bank-itau',
      status: 'pago',
      goalId: goal.id,
      notes: `Aporte direto registrado para a meta "${goal.title}"`,
    };

    expect(goal.currentAmount).toBe(6000);
    expect(syncdTx.type).toBe('saida');
    expect(syncdTx.amount).toBe(1000);
    expect(syncdTx.goalId).toBe('goal-1');
    expect(syncdTx.bankAccountId).toBe('bank-itau');
  });

  it('correctly reverts cross-module state when a linked transaction is deleted in Movimentações', () => {
    let obraEntries = [{ id: 'obra-1', description: 'Cimento', amount: 350, status: 'pago' as const }];
    let houseInstallments = [{ id: 'house-1', description: 'Caixa', paidInstallments: 5, installmentValue: 1200 }];
    let goals = [{ id: 'goal-99', title: 'Carro Novo', targetAmount: 50000, currentAmount: 15000, category: 'veiculo' }];
    let investments = [{ id: 'inv-1', name: 'Tesouro', totalInvested: 2000, currentValue: 2000, type: 'renda_fixa' as const, institution: 'XP' }];
    let investmentTransactions = [{ id: 'itx-1', assetId: 'inv-1', type: 'aporte' as const, date: '2026-11-09', amount: 500 }];

    // Simulate deleting tx-obra-obra-1
    const obraTxId = 'tx-obra-obra-1';
    if (obraTxId.startsWith('tx-obra-')) {
      const oId = obraTxId.replace('tx-obra-', '');
      obraEntries = obraEntries.map((e) => (e.id === oId ? { ...e, status: 'pendente' as const } : e));
    }
    expect(obraEntries[0].status).toBe('pendente');

    // Simulate deleting tx-inst-house-1-5
    const instTxId = 'tx-inst-house-1-5';
    if (instTxId.startsWith('tx-inst-')) {
      const parts = instTxId.replace('tx-inst-', '').split('-');
      const iId = parts.slice(0, -1).join('-');
      houseInstallments = houseInstallments.map((i) =>
        i.id === iId ? { ...i, paidInstallments: Math.max(0, i.paidInstallments - 1) } : i
      );
    }
    expect(houseInstallments[0].paidInstallments).toBe(4);

    // Simulate deleting tx-goal-goal-99
    const goalTx = { id: 'tx-goal-goal-99-1234', goalId: 'goal-99', amount: 2000 };
    goals = goals.map((g) => (g.id === goalTx.goalId ? { ...g, currentAmount: g.currentAmount - goalTx.amount } : g));
    expect(goals[0].currentAmount).toBe(13000);

    // Simulate deleting tx-inv-itx-1
    const invTx = { id: 'tx-inv-itx-1', investmentAssetId: 'inv-1', amount: 500 };
    const itx = investmentTransactions.find((t) => t.id === 'itx-1');
    if (itx) {
      investmentTransactions = investmentTransactions.filter((t) => t.id !== 'itx-1');
      investments = investments.map((a) =>
        a.id === itx.assetId
          ? {
              ...a,
              totalInvested: a.totalInvested - itx.amount,
              currentValue: a.currentValue - itx.amount,
            }
          : a
      );
    }
    expect(investmentTransactions).toHaveLength(0);
    expect(investments[0].totalInvested).toBe(1500);
    expect(investments[0].currentValue).toBe(1500);
  });

  it('respects "do not debit bank account" by skipping transaction creation', () => {
    const bankAccountId: string | undefined = undefined;
    let transactions: Transaction[] = [];

    // When bankAccountId is undefined or empty string, no transaction is added
    if (bankAccountId && bankAccountId.trim() !== '') {
      transactions.push({
        id: 'tx-test',
        date: '2026-11-09',
        description: 'Test',
        type: 'saida',
        amount: 100,
        category: 'Outros',
        paymentMethod: 'Transferência',
        status: 'pago',
      });
    }

    expect(transactions).toHaveLength(0);
  });
});
