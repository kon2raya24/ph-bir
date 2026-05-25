import vatData from '../data/vat.json' with { type: 'json' };

export const VAT_RATE: number = vatData.rate;
export const VAT_THRESHOLD: number = vatData.threshold_annual_gross;

const SOURCE = 'BIR Tax Code § 106-108 (VAT), as amended by RA 9337 + RA 10963 (TRAIN)';

export interface VatResult {
  gross: number;
  net: number;
  vat: number;
  rate: number;
  _source: string;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Add 12% VAT to a net amount.
 * @example addVat(1000) → { gross: 1120, net: 1000, vat: 120, rate: 0.12 }
 */
export function addVat(net: number): VatResult {
  if (!Number.isFinite(net)) throw new TypeError('addVat: amount must be a finite number');
  const vat = round2(net * VAT_RATE);
  const gross = round2(net + vat);
  return { gross, net: round2(net), vat, rate: VAT_RATE, _source: SOURCE };
}

/**
 * Extract the VAT portion from a VAT-inclusive amount.
 * @example extractVat(1120) → { gross: 1120, net: 1000, vat: 120, rate: 0.12 }
 */
export function extractVat(gross: number): VatResult {
  if (!Number.isFinite(gross)) throw new TypeError('extractVat: amount must be a finite number');
  const net = round2(gross / (1 + VAT_RATE));
  const vat = round2(gross - net);
  return { gross: round2(gross), net, vat, rate: VAT_RATE, _source: SOURCE };
}

/**
 * Check whether a business is required to register for VAT based on annual gross sales.
 * Threshold is ₱3,000,000 (TRAIN, RA 10963, effective 2018-01-01).
 */
export function isVatRegistrationRequired(annualGross: number): boolean {
  if (!Number.isFinite(annualGross)) return false;
  return annualGross > VAT_THRESHOLD;
}
