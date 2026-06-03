import ewtData from '../data/ewt.json' with { type: 'json' };

/** How a category's rate is determined. */
export type EwtRateKind = 'flat' | 'threshold';

export interface EwtCategory {
  /** Stable category key (e.g. `professional_individual`). */
  key: string;
  label: string;
  kind: EwtRateKind;
  /** Flat categories only: the single rate. */
  rate?: number;
  /** Threshold categories only. */
  lowRate?: number;
  highRate?: number;
  threshold?: number;
  /** Threshold categories: if true, a VAT-registered payee cannot use the lower rate. */
  vatForcesHigh?: boolean;
  thresholdBasis?: string;
  note?: string;
}

const CATEGORIES: EwtCategory[] = ewtData.categories as EwtCategory[];
const BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c]));
const SOURCE = 'BIR RR 11-2018 (amending RR 2-98), TRAIN (RA 10963)';

/** Provenance + scope note for the bundled EWT table. */
export const EWT_META = ewtData._meta;

export interface EwtOptions {
  /** The payee's annual gross income/receipts — decides the rate for threshold categories. */
  payeeAnnualGross?: number;
  /** Payee filed the sworn declaration/statement required to qualify for the lower rate. */
  swornDeclaration?: boolean;
  /** Payee is VAT-registered (forces the higher rate where `vatForcesHigh`). */
  vatRegistered?: boolean;
}

export interface EwtResult {
  amount: number;
  categoryKey: string;
  label: string;
  rate: number;
  /** Tax to withhold (`amount * rate`, rounded to centavos). */
  tax: number;
  /** Amount payable to the payee after withholding (`amount - tax`). */
  net: number;
  _source: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** All EWT categories in the bundled table. Fresh array. */
export function listEwtCategories(): EwtCategory[] {
  return CATEGORIES.map((c) => ({ ...c }));
}

/**
 * The applicable EWT rate for a category. For threshold categories (professional
 * & commission fees), the lower rate applies only when a sworn declaration is on
 * file AND the payee's annual gross is at or below the threshold (and, for
 * individuals, the payee is non-VAT-registered). With no options, the higher
 * rate is returned — the conservative default, since the payee must affirmatively
 * qualify for the lower rate.
 */
export function ewtRate(categoryKey: string, opts: EwtOptions = {}): number {
  const c = BY_KEY.get(categoryKey);
  if (!c) throw new RangeError(`ewtRate: unknown EWT category "${categoryKey}"`);
  if (c.kind === 'flat') return c.rate!;
  const gross = opts.payeeAnnualGross ?? Infinity;
  const qualifiesLow =
    opts.swornDeclaration === true &&
    gross <= c.threshold! &&
    !(c.vatForcesHigh === true && opts.vatRegistered === true);
  return qualifiesLow ? c.lowRate! : c.highRate!;
}

/**
 * Compute the expanded (creditable) withholding tax on an income payment.
 *
 * @example
 *   computeEWT(50000, 'rental');                                   // 5% → tax 2500, net 47500
 *   computeEWT(100000, 'professional_individual');                 // default 10% (no declaration)
 *   computeEWT(100000, 'professional_individual',
 *              { swornDeclaration: true, payeeAnnualGross: 800000 }); // 5%
 */
export function computeEWT(amount: number, categoryKey: string, opts: EwtOptions = {}): EwtResult {
  if (!Number.isFinite(amount)) throw new TypeError('computeEWT: amount must be a finite number');
  if (amount < 0) throw new RangeError('computeEWT: amount must be non-negative');
  const c = BY_KEY.get(categoryKey);
  if (!c) throw new RangeError(`computeEWT: unknown EWT category "${categoryKey}"`);
  const rate = ewtRate(categoryKey, opts);
  const a = round2(amount);
  const tax = round2(a * rate);
  return { amount: a, categoryKey, label: c.label, rate, tax, net: round2(a - tax), _source: SOURCE };
}
