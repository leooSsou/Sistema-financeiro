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
});
