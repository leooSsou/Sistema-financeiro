import { describe, it, expect } from 'vitest';
import { formatCurrency, formatDate, formatDateBR, formatMonthYear } from '../src/utils/formatters';

describe('formatters', () => {
  it('formatCurrency formats BRL values correctly', () => {
    const formatted = formatCurrency(1250.5);
    // Should contain R$, 1.250 and 50
    expect(formatted).toContain('1.250,50');
    expect(formatted).toMatch(/R\$/);
  });

  it('formatCurrency handles 0 and falsy values', () => {
    const zero = formatCurrency(0);
    expect(zero).toContain('0,00');
  });

  it('formatDate formats YYYY-MM-DD to DD/MM/YYYY', () => {
    expect(formatDate('2026-11-04')).toBe('04/11/2026');
    expect(formatDateBR('2026-05-15')).toBe('15/05/2026');
  });

  it('formatDate returns original string if not YYYY-MM-DD', () => {
    expect(formatDate('04/11/2026')).toBe('04/11/2026');
    expect(formatDate('')).toBe('');
  });

  it('formatMonthYear formats YYYY-MM to localized Brazilian month and year', () => {
    expect(formatMonthYear('2026-11')).toBe('Novembro de 2026');
    expect(formatMonthYear('2026-01')).toBe('Janeiro de 2026');
  });
});
