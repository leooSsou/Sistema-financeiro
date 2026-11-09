import { describe, it, expect } from 'vitest';
import { marketService, CURATED_OPPORTUNITIES } from '../src/services/marketService';

describe('Market Service & Calculations', () => {
  it('correctly calculates compound interest timeline', () => {
    // R$ 1.000 initial, R$ 500/month, 12% a.a. for 24 months
    const result = marketService.calculateCompoundInterest(1000, 500, 12, 24);

    expect(result.finalInvested).toBe(1000 + 500 * 24); // 13.000
    expect(result.finalAccumulated).toBeGreaterThan(result.finalInvested); // Interest earned!
    expect(result.totalInterest).toBeGreaterThan(1000);
    expect(result.timeline.length).toBeGreaterThan(0);
  });

  it('correctly calculates months to reach target financial goal', () => {
    // Target 100.000, initial 10.000, deposit 1.000/month at 12% annual rate
    const months = marketService.monthsToReachGoal(100000, 10000, 1000, 12);

    expect(months).toBeGreaterThan(40);
    expect(months).toBeLessThan(70); // ~5 years with compound interest
  });

  it('contains curated B3 assets with quality metrics', () => {
    expect(CURATED_OPPORTUNITIES.length).toBeGreaterThan(5);
    const wege = CURATED_OPPORTUNITIES.find((a) => a.ticker === 'WEGE3');
    expect(wege).toBeDefined();
    expect(wege?.sector).toContain('Automação');
  });
});
