import { describe, it, expect } from 'vitest';
import { addVat, extractVat, isVatRegistrationRequired, VAT_RATE, VAT_THRESHOLD } from '../src/vat';

describe('VAT constants', () => {
  it('rate is 12%', () => {
    expect(VAT_RATE).toBe(0.12);
  });
  it('threshold is ₱3,000,000 (TRAIN)', () => {
    expect(VAT_THRESHOLD).toBe(3_000_000);
  });
});

describe('addVat', () => {
  it('1,000 + VAT → 1,120', () => {
    expect(addVat(1000)).toMatchObject({ net: 1000, vat: 120, gross: 1120, rate: 0.12 });
  });
  it('250.50 + VAT → 280.56', () => {
    const r = addVat(250.50);
    expect(r.vat).toBe(30.06);
    expect(r.gross).toBe(280.56);
  });
  it('throws on non-finite', () => {
    expect(() => addVat(NaN)).toThrow(TypeError);
  });
});

describe('extractVat', () => {
  it('1,120 inclusive → net 1,000 + VAT 120', () => {
    const r = extractVat(1120);
    expect(r.net).toBe(1000);
    expect(r.vat).toBe(120);
    expect(r.gross).toBe(1120);
  });
  it('round-trips addVat for a clean value', () => {
    const net = 500;
    const added = addVat(net);
    const extracted = extractVat(added.gross);
    expect(extracted.net).toBe(net);
  });
  it('includes source attribution', () => {
    expect(extractVat(1120)._source).toContain('RA 9337');
  });
});

describe('isVatRegistrationRequired', () => {
  it('false at exactly the ₱3M threshold (must exceed)', () => {
    expect(isVatRegistrationRequired(3_000_000)).toBe(false);
  });
  it('true at ₱3,000,001', () => {
    expect(isVatRegistrationRequired(3_000_001)).toBe(true);
  });
  it('false for zero or negative', () => {
    expect(isVatRegistrationRequired(0)).toBe(false);
    expect(isVatRegistrationRequired(-100)).toBe(false);
  });
});
