import { describe, it, expect } from 'vitest';
import { listForms, findForm } from '../src/forms';

describe('listForms', () => {
  it('returns all curated forms', () => {
    expect(listForms().length).toBeGreaterThanOrEqual(20);
  });
  it('filters by status — active excludes 2550M', () => {
    const active = listForms({ status: 'active' });
    expect(active.find(f => f.number === '2550M')).toBeUndefined();
    expect(active.find(f => f.number === '2550Q')).toBeDefined();
  });
  it('filters by status — superseded includes 2550M', () => {
    const superseded = listForms({ status: 'superseded' });
    expect(superseded.length).toBeGreaterThanOrEqual(1);
    expect(superseded.find(f => f.number === '2550M')).toBeDefined();
  });
  it('filters by frequency', () => {
    const annual = listForms({ frequency: 'annual' });
    expect(annual.every(f => f.frequency === 'annual')).toBe(true);
    expect(annual.find(f => f.number === '2316')).toBeDefined();
    expect(annual.find(f => f.number === '1700')).toBeDefined();
  });
  it('returns a copy (mutation-safe)', () => {
    const a = listForms();
    a.pop();
    expect(listForms().length).toBeGreaterThanOrEqual(20);
  });
});

describe('findForm', () => {
  it('finds 2316 (the employee tax cert)', () => {
    const f = findForm('2316');
    expect(f).not.toBeNull();
    expect(f!.frequency).toBe('annual');
    expect(f!.name).toContain('Compensation');
  });
  it('finds 1601-C (case-insensitive)', () => {
    expect(findForm('1601-c')?.number).toBe('1601-C');
    expect(findForm('1601-C')?.number).toBe('1601-C');
  });
  it('tolerates separator variations: "2550Q" === "2550-Q"', () => {
    expect(findForm('2550-Q')?.number).toBe('2550Q');
    expect(findForm('2550 Q')?.number).toBe('2550Q');
  });
  it('returns superseded status + supersession metadata for 2550M', () => {
    const f = findForm('2550M');
    expect(f?.status).toBe('superseded');
    expect(f?.superseded_by).toBe('2550Q');
    expect(f?.superseded_basis).toContain('EOPT');
  });
  it('returns null for unknown form', () => {
    expect(findForm('9999')).toBeNull();
    expect(findForm('')).toBeNull();
  });
});
