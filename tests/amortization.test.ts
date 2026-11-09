import { describe, it, expect } from 'vitest';
import { calculateAmortization } from '../src/utils/amortizationCalculator';

describe('amortizationCalculator', () => {
  it('calculates standard SAC financing without extras', () => {
    // 200.000 R$, 10% a.a., 360 months
    const { standard } = calculateAmortization(200000, 10, 360, 'SAC', 0);
    expect(standard.actualMonths).toBe(360);
    expect(standard.schedule[0].amortization).toBeCloseTo(200000 / 360, 1);
    expect(standard.actualTotalPaid).toBeGreaterThan(200000);
  });

  it('proves extra monthly amortization drastically saves interest and cuts years in SAC', () => {
    // 200.000 R$, 10% a.a., 360 months, extra R$ 1.000/month
    const { standard, accelerated } = calculateAmortization(200000, 10, 360, 'SAC', 1000, 'prazo');
    expect(accelerated.actualMonths).toBeLessThan(standard.actualMonths);
    expect(accelerated.monthsSaved).toBeGreaterThan(150); // Saves over 12 years!
    expect(accelerated.totalInterestSaved).toBeGreaterThan(100000); // Saves > R$ 100.000 in interest
  });

  it('calculates PRICE amortization and extra payments', () => {
    const { standard, accelerated } = calculateAmortization(100000, 12, 120, 'PRICE', 500, 'prazo');
    expect(accelerated.actualMonths).toBeLessThan(120);
    expect(accelerated.totalInterestSaved).toBeGreaterThan(0);
  });
});
