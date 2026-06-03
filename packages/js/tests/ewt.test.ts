import { describe, it, expect } from 'vitest';
import { listEwtCategories, ewtRate, computeEWT } from '../src/index';

describe('listEwtCategories', () => {
  it('exposes the 8 common categories', () => {
    const cats = listEwtCategories();
    expect(cats).toHaveLength(8);
    expect(cats.map((c) => c.key)).toContain('professional_individual');
    expect(cats.map((c) => c.key)).toContain('services_twa');
  });

  it('returns a fresh array (mutation-safe)', () => {
    const a = listEwtCategories();
    a.pop();
    expect(listEwtCategories()).toHaveLength(8);
  });
});

describe('ewtRate — flat categories', () => {
  it('rental 5%, contractor 2%, TWA goods 1% / services 2%', () => {
    expect(ewtRate('rental')).toBe(0.05);
    expect(ewtRate('contractor')).toBe(0.02);
    expect(ewtRate('goods_twa')).toBe(0.01);
    expect(ewtRate('services_twa')).toBe(0.02);
  });

  it('throws on an unknown category', () => {
    expect(() => ewtRate('nope')).toThrow(/unknown EWT category/);
  });
});

describe('ewtRate — threshold categories', () => {
  it('defaults to the higher rate (must qualify for the lower one)', () => {
    expect(ewtRate('professional_individual')).toBe(0.10);
    expect(ewtRate('professional_corporate')).toBe(0.15);
  });

  it('individual: 5% only with a declaration, gross ≤ ₱3M, and non-VAT', () => {
    expect(ewtRate('professional_individual', { swornDeclaration: true, payeeAnnualGross: 800000 })).toBe(0.05);
    // over the ₱3M threshold → 10% even with a declaration
    expect(ewtRate('professional_individual', { swornDeclaration: true, payeeAnnualGross: 3_500_000 })).toBe(0.10);
    // VAT-registered → 10%
    expect(ewtRate('professional_individual', { swornDeclaration: true, payeeAnnualGross: 800000, vatRegistered: true })).toBe(0.10);
    // no declaration → 10%
    expect(ewtRate('professional_individual', { payeeAnnualGross: 800000 })).toBe(0.10);
  });

  it('corporate: 10% if declaration + gross ≤ ₱720k, else 15%', () => {
    expect(ewtRate('professional_corporate', { swornDeclaration: true, payeeAnnualGross: 500000 })).toBe(0.10);
    expect(ewtRate('professional_corporate', { swornDeclaration: true, payeeAnnualGross: 900000 })).toBe(0.15);
    // VAT registration does NOT force the higher rate for corporations
    expect(ewtRate('professional_corporate', { swornDeclaration: true, payeeAnnualGross: 500000, vatRegistered: true })).toBe(0.10);
  });

  it('commissions mirror professional-fee rules', () => {
    expect(ewtRate('commission_individual', { swornDeclaration: true, payeeAnnualGross: 100000 })).toBe(0.05);
    expect(ewtRate('commission_corporate')).toBe(0.15);
  });
});

describe('computeEWT', () => {
  it('computes tax and net for a flat category', () => {
    const r = computeEWT(50000, 'rental');
    expect(r.rate).toBe(0.05);
    expect(r.tax).toBe(2500);
    expect(r.net).toBe(47500);
    expect(r.label).toMatch(/rental/i);
  });

  it('rounds to centavos', () => {
    const r = computeEWT(33333.33, 'contractor'); // 2%
    expect(r.tax).toBe(666.67);
    expect(r.net).toBe(32666.66);
  });

  it('honors threshold options', () => {
    expect(computeEWT(100000, 'professional_individual').tax).toBe(10000); // default 10%
    expect(computeEWT(100000, 'professional_individual', { swornDeclaration: true, payeeAnnualGross: 800000 }).tax).toBe(5000);
  });

  it('rejects bad input', () => {
    expect(() => computeEWT(-1, 'rental')).toThrow(RangeError);
    expect(() => computeEWT(Number.NaN, 'rental')).toThrow(TypeError);
    expect(() => computeEWT(1000, 'bogus')).toThrow(/unknown EWT category/);
  });
});
