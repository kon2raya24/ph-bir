import { describe, it, expect } from 'vitest';
import { percentageTax, percentageTaxRate } from '../src/percentage-tax';

describe('percentageTax — current rate (3%)', () => {
  it('100,000 gross → 3,000 tax', () => {
    const r = percentageTax(100000);
    expect(r.rate).toBe(0.03);
    expect(r.tax).toBe(3000);
  });
  it('250,000 gross → 7,500 tax', () => {
    expect(percentageTax(250000).tax).toBe(7500);
  });
  it('zero gross → zero tax', () => {
    expect(percentageTax(0).tax).toBe(0);
  });
});

describe('percentageTax — historical CREATE-era 1% rate', () => {
  it('mid-2022 returns 1% rate', () => {
    const r = percentageTax(100000, { asOf: new Date('2022-06-15') });
    expect(r.rate).toBe(0.01);
    expect(r.tax).toBe(1000);
    expect(r.legalBasis).toContain('RA 11534');
  });
  it('2023-06-30 (last day of 1%) — still 1%', () => {
    expect(percentageTax(100000, { asOf: '2023-06-30' }).rate).toBe(0.01);
  });
  it('2023-07-01 (revert day) — 3%', () => {
    expect(percentageTax(100000, { asOf: '2023-07-01' }).rate).toBe(0.03);
  });
  it('2020-07-01 (start of 1%) — 1%', () => {
    expect(percentageTax(100000, { asOf: '2020-07-01' }).rate).toBe(0.01);
  });
});

describe('percentageTax — input validation', () => {
  it('throws on non-finite', () => {
    expect(() => percentageTax(NaN)).toThrow(TypeError);
  });
  it('throws on negative', () => {
    expect(() => percentageTax(-1)).toThrow(RangeError);
  });
  it('throws on pre-2020 dates (no historical data)', () => {
    expect(() => percentageTax(100000, { asOf: '2019-01-01' })).toThrow(RangeError);
  });
});

describe('percentageTaxRate', () => {
  it('returns current rate without asOf', () => {
    expect(percentageTaxRate()).toBe(0.03);
  });
  it('returns 1% for a 2021 date', () => {
    expect(percentageTaxRate('2021-03-15')).toBe(0.01);
  });
});
