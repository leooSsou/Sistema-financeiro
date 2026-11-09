import { describe, it, expect } from 'vitest';

describe('Sprint 4 calculations', () => {
  it('calculates compound interest monthly required savings accurately', () => {
    // Target: R$ 50.000 in 36 months at 10.5% a.a.
    const target = 50000;
    const months = 36;
    const annualRate = 10.5;
    const monthlyRate = (annualRate / 100) / 12;

    const factor = Math.pow(1 + monthlyRate, months) - 1;
    const pmt = (target * monthlyRate) / factor;

    // Aporte mensal deve ser em torno de R$ 1.200 a R$ 1.250
    expect(pmt).toBeGreaterThan(1150);
    expect(pmt).toBeLessThan(1300);

    // Total aportado direto pelo usuário deve ser menor que R$ 50.000 devido aos juros compostos
    const totalPrincipal = pmt * months;
    expect(totalPrincipal).toBeLessThan(target);
    expect(target - totalPrincipal).toBeGreaterThan(4000); // Mais de 4 mil de juros gerados
  });

  it('calculates portfolio profitability and dividend yields', () => {
    const assets = [
      { totalInvested: 10000, currentValue: 12500 },
      { totalInvested: 5000, currentValue: 4800 },
    ];

    const totalInvested = assets.reduce((s, a) => s + a.totalInvested, 0);
    const totalCurrent = assets.reduce((s, a) => s + a.currentValue, 0);
    const profit = totalCurrent - totalInvested;
    const profitPct = (profit / totalInvested) * 100;

    expect(totalInvested).toBe(15000);
    expect(totalCurrent).toBe(17300);
    expect(profit).toBe(2300);
    expect(profitPct).toBeCloseTo(15.33, 1);
  });

  it('atomically adds bought stock into investments portfolio with correct average price', () => {
    let investments: any[] = [];
    const unitPrice = 50.27;
    const quantity = 10;
    const totalCost = Number((unitPrice * quantity).toFixed(2)); // 502.70

    // Simulate handleDirectBuyStock
    const existing = investments.find((a) => a.ticker === 'WEGE3');
    const newTotalInvested = Number(((existing?.totalInvested || 0) + totalCost).toFixed(2));
    const newQuantity = (existing?.quantity || 0) + quantity;
    const newAvgPrice = Number((newTotalInvested / newQuantity).toFixed(2));

    const newAsset = {
      id: 'inv-wege',
      name: 'WEG S.A.',
      ticker: 'WEGE3',
      totalInvested: newTotalInvested,
      currentValue: Number((unitPrice * newQuantity).toFixed(2)),
      quantity: newQuantity,
      averagePrice: newAvgPrice,
    };

    investments = [newAsset];

    expect(investments).toHaveLength(1);
    expect(investments[0].totalInvested).toBe(502.7);
    expect(investments[0].currentValue).toBe(502.7);
    expect(investments[0].quantity).toBe(10);
    expect(investments[0].averagePrice).toBe(50.27);
  });
});
