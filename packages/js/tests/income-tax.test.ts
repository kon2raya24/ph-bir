import { describe, it, expect } from 'vitest';
import { incomeTaxGraduated, incomeTax8 } from '../src/income-tax';

describe('incomeTaxGraduated — 2023-onward schedule', () => {
  it('₱250,000 is the exempt ceiling → 0', () => {
    expect(incomeTaxGraduated(250000).tax).toBe(0);
    expect(incomeTaxGraduated(0).tax).toBe(0);
    expect(incomeTaxGraduated(100000).tax).toBe(0);
  });
  it('bracket boundaries match the TRAIN table', () => {
    expect(incomeTaxGraduated(400000).tax).toBe(22500);
    expect(incomeTaxGraduated(800000).tax).toBe(102500);
    expect(incomeTaxGraduated(2000000).tax).toBe(402500);
    expect(incomeTaxGraduated(8000000).tax).toBe(2202500);
  });
  it('mid-bracket computation (₱500k → 42,500)', () => {
    const r = incomeTaxGraduated(500000);
    expect(r.tax).toBe(42500); // 22,500 + 20% × 100,000
    expect(r.marginalRate).toBe(0.2);
  });
  it('top bracket (₱10M → 2,902,500)', () => {
    expect(incomeTaxGraduated(10000000).tax).toBe(2902500); // 2,202,500 + 35% × 2,000,000
  });
  it('rejects negative / non-finite', () => {
    expect(() => incomeTaxGraduated(-1)).toThrow(RangeError);
    expect(() => incomeTaxGraduated(Number.NaN)).toThrow(TypeError);
  });
});

describe('incomeTaxGraduated — 2018–2022 historical schedule (asOf)', () => {
  it('₱400k was 30,000 under the old rates', () => {
    expect(incomeTaxGraduated(400000, { asOf: '2022-12-31' }).tax).toBe(30000);
  });
  it('₱800k was 130,000 under the old rates', () => {
    expect(incomeTaxGraduated(800000, { asOf: '2020-06-01' }).tax).toBe(130000);
  });
  it('boundary: 2023-01-01 uses the new (lower) schedule', () => {
    expect(incomeTaxGraduated(400000, { asOf: '2023-01-01' }).tax).toBe(22500);
  });
});

describe('incomeTax8 — optional 8% flat tax', () => {
  it('pure SEP: 8% of (gross − ₱250k)', () => {
    const r = incomeTax8(1000000);
    expect(r.base).toBe(750000);
    expect(r.tax).toBe(60000);
    expect(r.eligible).toBe(true);
    expect(r.mixedIncome).toBe(false);
  });
  it('mixed-income: 8% of full gross (no ₱250k deduction)', () => {
    const r = incomeTax8(1000000, { mixedIncome: true });
    expect(r.base).toBe(1000000);
    expect(r.tax).toBe(80000);
  });
  it('not eligible above the ₱3M VAT threshold', () => {
    expect(incomeTax8(4000000).eligible).toBe(false);
    expect(incomeTax8(3000000).eligible).toBe(true);
  });
  it('gross at/under ₱250k → 0 for pure SEP', () => {
    expect(incomeTax8(250000).tax).toBe(0);
  });
});
