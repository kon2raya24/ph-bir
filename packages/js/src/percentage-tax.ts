import pctData from '../data/percentage-tax.json' with { type: 'json' };

interface PctPeriod {
  rate: number;
  from: string;       // ISO date inclusive
  to: string | null;  // ISO date exclusive, null = current/standing
  legal_basis: string;
  description: string;
}

const periods: PctPeriod[] = pctData.periods as PctPeriod[];
const SOURCE = 'Tax Code § 116, as amended by RA 11534 (CREATE law)';

export interface PercentageTaxResult {
  grossReceipts: number;
  rate: number;
  tax: number;
  asOf: string;
  legalBasis: string;
  description: string;
  _source: string;
}

function toDateString(d: Date | string | undefined): string {
  if (d === undefined) return new Date().toISOString().slice(0, 10);
  if (typeof d === 'string') return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function findPeriod(isoDate: string): PctPeriod {
  for (const p of periods) {
    if (isoDate >= p.from && (p.to === null || isoDate < p.to)) return p;
  }
  // If date is before the first known period (e.g. pre-2020), fall back to the
  // earliest standing rate. We don't extrapolate into pre-CREATE history.
  throw new RangeError(
    `percentageTax: date ${isoDate} is before the earliest period in the dataset (${periods[0].from}). ` +
    `Pre-2020 historical computation is not supported by this dataset.`,
  );
}

/**
 * Compute the percentage tax for a non-VAT-registered taxpayer with annual gross
 * sales/receipts at or below ₱3,000,000. The rate is looked up by date, so historical
 * computations (e.g. for the CREATE-era 1% temporary rate) work correctly.
 *
 * @example
 *   percentageTax(100000);                                         // 3,000 (3% current)
 *   percentageTax(100000, { asOf: new Date('2022-06-15') });       // 1,000 (1% historical)
 *   percentageTax(100000, { asOf: '2023-06-30' });                 // 1,000 (last day of 1%)
 *   percentageTax(100000, { asOf: '2023-07-01' });                 // 3,000 (3% revert)
 */
export function percentageTax(
  grossReceipts: number,
  opts: { asOf?: Date | string } = {},
): PercentageTaxResult {
  if (!Number.isFinite(grossReceipts)) {
    throw new TypeError('percentageTax: grossReceipts must be a finite number');
  }
  if (grossReceipts < 0) {
    throw new RangeError('percentageTax: grossReceipts must be non-negative');
  }
  const asOf = toDateString(opts.asOf);
  const period = findPeriod(asOf);
  const tax = Math.round(grossReceipts * period.rate * 100) / 100;
  return {
    grossReceipts: Math.round(grossReceipts * 100) / 100,
    rate: period.rate,
    tax,
    asOf,
    legalBasis: period.legal_basis,
    description: period.description,
    _source: SOURCE,
  };
}

/** Lowest-level helper — return the percentage-tax rate applicable on a given date. */
export function percentageTaxRate(asOf?: Date | string): number {
  return findPeriod(toDateString(asOf)).rate;
}
