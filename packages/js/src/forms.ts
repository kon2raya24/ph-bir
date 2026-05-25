import formsData from '../data/forms.json' with { type: 'json' };

export type FormFrequency = 'monthly' | 'quarterly' | 'annual' | 'event';
export type FormStatus = 'active' | 'superseded';

export interface BirForm {
  number: string;
  name: string;
  frequency: FormFrequency;
  purpose: string;
  status: FormStatus;
  superseded_by?: string;
  superseded_on?: string;
  superseded_basis?: string;
}

const forms: BirForm[] = formsData.forms as BirForm[];

/**
 * List BIR forms, optionally filtered by status and/or frequency.
 *
 * @example
 *   listForms();                                  // all curated forms
 *   listForms({ status: 'active' });              // excludes superseded forms
 *   listForms({ frequency: 'annual' });           // year-end forms only
 *   listForms({ status: 'active', frequency: 'quarterly' });
 */
export function listForms(filter: { status?: FormStatus; frequency?: FormFrequency } = {}): BirForm[] {
  let out = forms;
  if (filter.status !== undefined) out = out.filter(f => f.status === filter.status);
  if (filter.frequency !== undefined) out = out.filter(f => f.frequency === filter.frequency);
  return out.slice();
}

/**
 * Look up a BIR form by its number. Match is case-insensitive and tolerates
 * surrounding whitespace; "1701", "1701A", "2550-Q" (with separator), etc. all work.
 *
 * Returns null if the form is not in this v0.1 curated set — the dataset isn't
 * exhaustive (~20 most-common forms only).
 */
export function findForm(numberOrName: string): BirForm | null {
  if (typeof numberOrName !== 'string' || !numberOrName.trim()) return null;
  const q = numberOrName.trim().toLowerCase();
  const qNoSep = q.replace(/[\s-]+/g, '');

  // Pass 1: exact number match (with separator-stripping for "2550-M" → "2550M")
  for (const f of forms) {
    const num = f.number.toLowerCase();
    if (num === q) return f;
    if (num.replace(/[\s-]+/g, '') === qNoSep) return f;
  }
  // Pass 2: exact lowercase name match
  for (const f of forms) {
    if (f.name.toLowerCase() === q) return f;
  }
  return null;
}
