import data from '../data/income-tax.json' with { type: 'json' };

interface Bracket {
  over: number;
  base: number;
  rate: number;
}
interface Schedule {
  from: string;
  to: string | null;
  legal_basis: string;
  brackets: Bracket[];
}

const schedules: Schedule[] = data.schedules as Schedule[];
const EIGHT = data.eight_percent as {
  rate: number;
  exemption: number;
  gross_cap: number;
  legal_basis: string;
};
const SOURCE = 'NIRC § 24(A)(2), as amended by RA 10963 (TRAIN Law)';

function toDateString(d: Date | string | undefined): string {
  if (d === undefined) return new Date().toISOString().slice(0, 10);
  if (typeof d === 'string') return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function findSchedule(isoDate: string): Schedule {
  for (const s of schedules) {
    if (isoDate >= s.from && (s.to === null || isoDate < s.to)) return s;
  }
  throw new RangeError(
    `incomeTaxGraduated: date ${isoDate} is before the earliest schedule (${schedules[0].from}). ` +
      `Pre-2018 historical computation is not supported by this dataset.`,
  );
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface IncomeTaxResult {
  taxableIncome: number;
  tax: number;
  /** Marginal rate of the applicable bracket. */
  marginalRate: number;
  asOf: string;
  legalBasis: string;
  _source: string;
}

/**
 * Graduated individual income tax (annual) under TRAIN. Rates are looked up by
 * `asOf` date, so the 2018–2022 schedule and the lower 2023-onward schedule both
 * compute correctly. First ₱250,000 is exempt.
 *
 * @example
 *   incomeTaxGraduated(250000);   // 0
 *   incomeTaxGraduated(400000);   // 22,500   (2023-onward)
 *   incomeTaxGraduated(2000000);  // 402,500
 *   incomeTaxGraduated(400000, { asOf: '2022-12-31' }); // 30,000 (2018–2022 schedule)
 */
export function incomeTaxGraduated(
  taxableIncome: number,
  opts: { asOf?: Date | string } = {},
): IncomeTaxResult {
  if (!Number.isFinite(taxableIncome)) {
    throw new TypeError('incomeTaxGraduated: taxableIncome must be a finite number');
  }
  if (taxableIncome < 0) {
    throw new RangeError('incomeTaxGraduated: taxableIncome must be non-negative');
  }
  const asOf = toDateString(opts.asOf);
  const schedule = findSchedule(asOf);

  let applicable = schedule.brackets[0];
  for (const b of schedule.brackets) {
    if (taxableIncome > b.over) applicable = b;
    else break;
  }
  const tax = round2(applicable.base + applicable.rate * (taxableIncome - applicable.over));
  return {
    taxableIncome: round2(taxableIncome),
    tax,
    marginalRate: applicable.rate,
    asOf,
    legalBasis: schedule.legal_basis,
    _source: SOURCE,
  };
}

export interface IncomeTax8Result {
  gross: number;
  rate: number;
  /** Amount the 8% applies to (gross − ₱250k for pure SEP, full gross for mixed-income). */
  base: number;
  tax: number;
  /** False if gross exceeds the ₱3M VAT threshold — the 8% option is not available. */
  eligible: boolean;
  mixedIncome: boolean;
  note: string;
  _source: string;
}

/**
 * The 8% optional flat tax for self-employed individuals / professionals with gross
 * sales/receipts at or below the ₱3M VAT threshold. It is IN LIEU OF the graduated
 * income tax AND the 3% percentage tax.
 *
 * Pure self-employed/professional: 8% × (gross − ₱250,000).
 * Mixed-income (also earns compensation): 8% × gross (the ₱250k is consumed by the
 * compensation computation), via `{ mixedIncome: true }`.
 *
 * @example
 *   incomeTax8(1000000);                       // { tax: 60000, base: 750000, eligible: true }
 *   incomeTax8(1000000, { mixedIncome: true }); // { tax: 80000, base: 1000000 }
 *   incomeTax8(4000000);                       // { eligible: false } (over ₱3M)
 */
export function incomeTax8(
  gross: number,
  opts: { mixedIncome?: boolean } = {},
): IncomeTax8Result {
  if (!Number.isFinite(gross)) {
    throw new TypeError('incomeTax8: gross must be a finite number');
  }
  if (gross < 0) {
    throw new RangeError('incomeTax8: gross must be non-negative');
  }
  const mixedIncome = opts.mixedIncome ?? false;
  const base = mixedIncome ? gross : Math.max(0, gross - EIGHT.exemption);
  return {
    gross: round2(gross),
    rate: EIGHT.rate,
    base: round2(base),
    tax: round2(base * EIGHT.rate),
    eligible: gross <= EIGHT.gross_cap,
    mixedIncome,
    note: 'In lieu of graduated income tax and the 3% percentage tax. Not available if gross > ₱3,000,000 or if VAT-registered.',
    _source: EIGHT.legal_basis,
  };
}
