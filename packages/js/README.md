# @ph-dev-utils/bir

[![npm version](https://img.shields.io/npm/v/@ph-dev-utils/bir?label=npm&color=cb3837&logo=npm)](https://www.npmjs.com/package/@ph-dev-utils/bir)
[![Packagist version](https://img.shields.io/packagist/v/phdevutils/bir?label=Packagist&color=f28d1a&logo=packagist&logoColor=white)](https://packagist.org/packages/phdevutils/bir)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](../../LICENSE)
[![Made in PH](https://img.shields.io/badge/made%20in-🇵🇭%20Philippines-0038A8)](https://github.com/kon2raya24)

**BIR (Bureau of Internal Revenue) tax utilities for the Philippines** — VAT, percentage tax, individual income tax, expanded withholding tax (EWT), and a reference list of common BIR forms. JavaScript + PHP, MIT-licensed.

Companion to [ph-payroll](https://github.com/kon2raya24/ph-payroll), which covers the employee side (SSS / PhilHealth / Pag-IBIG / 13th-month / BIR withholding tax on compensation). This package covers the **non-employee** side: VAT on goods and services, percentage tax for small non-VAT businesses, graduated/8% income tax, creditable withholding on income payments, and form references.

## Packages

| Language | Package | Install |
|----------|---------|---------|
| JavaScript / TypeScript | `@ph-dev-utils/bir` | `npm i @ph-dev-utils/bir` |
| PHP | `phdevutils/bir` | `composer require phdevutils/bir` |

## JS usage

```ts
import {
  addVat, extractVat, isVatRegistrationRequired,
  percentageTax, percentageTaxRate,
  incomeTaxGraduated, incomeTax8,
  computeEWT, ewtRate, listEwtCategories,
  listForms, findForm,
} from '@ph-dev-utils/bir';

// VAT
addVat(1000);          // { gross: 1120, net: 1000, vat: 120, rate: 0.12 }
extractVat(1120);      // { gross: 1120, net: 1000, vat: 120, rate: 0.12 }
isVatRegistrationRequired(3_500_000); // true (above ₱3M threshold)

// Percentage tax — date-aware
percentageTax(100000);                                  // 3,000 (3% current)
percentageTax(100000, { asOf: new Date('2022-06-15') }); // 1,000 (1% CREATE-era)
percentageTax(100000, { asOf: '2023-07-01' });           // 3,000 (revert date)

// Individual income tax — graduated TRAIN vs 8% option
incomeTaxGraduated(500000).tax;   // 42,500
incomeTax8(500000);               // { tax: 20000, eligible: true, ... }

// Expanded withholding tax (creditable) on income payments
computeEWT(50000, 'rental');                      // { rate: 0.05, tax: 2500, net: 47500, ... }
computeEWT(100000, 'professional_individual');    // 10% by default (must qualify for 5%)
computeEWT(100000, 'professional_individual',
  { swornDeclaration: true, payeeAnnualGross: 800_000 }); // 5%
listEwtCategories().map((c) => c.key);            // 8 common categories

// BIR forms reference
findForm('2316');                       // { name: 'Certificate of Compensation Payment / Tax Withheld …', frequency: 'annual', status: 'active' }
findForm('2550M');                      // status: 'superseded', superseded_by: '2550Q' (EOPT Act RA 11976)
listForms({ frequency: 'quarterly' });  // 1701Q, 1702Q, 2550Q, 2551Q, …
```

## PHP usage

```php
use PhDevUtils\Bir\{Vat, PercentageTax, IncomeTax, Ewt, Forms};

// VAT
Vat::add(1000.0);           // ['gross' => 1120.0, 'net' => 1000.0, 'vat' => 120.0, …]
Vat::extract(1120.0);       // ['gross' => 1120.0, 'net' => 1000.0, 'vat' => 120.0, …]
Vat::isRegistrationRequired(3_500_000.0); // true

// Percentage tax
PercentageTax::compute(100000.0);                    // 3,000 (current)
PercentageTax::compute(100000.0, '2022-06-15');      // 1,000 (CREATE-era)
PercentageTax::rate('2023-07-01');                   // 0.03

// Income tax — graduated vs 8%
IncomeTax::graduated(500000.0)['tax'];               // 42500.0
IncomeTax::eightPercent(500000.0);                   // ['tax' => 20000.0, 'eligible' => true, …]

// Expanded withholding tax (creditable)
Ewt::compute(50000.0, 'rental');                     // ['rate' => 0.05, 'tax' => 2500.0, 'net' => 47500.0, …]
Ewt::compute(100000.0, 'professional_individual',
  ['swornDeclaration' => true, 'payeeAnnualGross' => 800000]); // 5%

// Forms
Forms::find('2316');
Forms::list(['frequency' => 'quarterly']);
```

## What's verified

| Capability | Rate / Value | Legal basis | Effective |
|---|---|---|---|
| VAT rate | 12% | RA 9337 | 2005-11-01 |
| VAT threshold | ₱3,000,000 | TRAIN RA 10963 | 2018-01-01 |
| Percentage tax | 3% | Tax Code § 116 | reverted 2023-07-01 |
| Percentage tax (historical) | 1% | RA 11534 (CREATE) | 2020-07-01 → 2023-06-30 |
| Individual income tax | graduated + 8% option | TRAIN RA 10963 | 2018 & 2023 tables |
| EWT — professional/commission (individual) | 5% / 10% | RR 11-2018 | TRAIN era |
| EWT — professional/commission (corporate) | 10% / 15% | RR 11-2018 | TRAIN era |
| EWT — rental | 5% | RR 11-2018 | TRAIN era |
| EWT — contractors/subcontractors | 2% | RR 11-2018 | TRAIN era |
| EWT — top withholding agent (goods / services) | 1% / 2% | RR 11-2018 | TRAIN era |
| Form 2550M supersession | retired | EOPT Act RA 11976 | 2024-01-22 |

Each rate is sourced to the originating Republic Act / Revenue Regulation, with `_meta` on each data file recording `source`, `source_url`, and `verified_on`.

## Deferred

- **Documentary Stamp Tax (DST)** — deferred pending verification of the 2025 **CMEPA (RA 12214)** rate revisions (the rate schedule is currently in flux and online sources disagree; not worth shipping uncertain figures).
- **ATC (Alphanumeric Tax Code) reference** — confirm the current ATC for EWT against BIR Form 0619-E / 1601-EQ.
- **Full EWT schedule** — the bundled table covers the common categories; the complete RR 2-98/11-2018 list has more.
- **BIR RDO (Revenue District Office) directory.**

## Family

This is part of the `@ph-dev-utils` family for Filipino devs:

- [`@ph-dev-utils/core`](https://github.com/kon2raya24/ph-dev-utils) — peso (incl. Tagalog `pesoToWordsFilipino`), govt IDs, phone, regions/provinces/cities, holidays
- [`@ph-dev-utils/payroll`](https://github.com/kon2raya24/ph-payroll) — SSS, PhilHealth, Pag-IBIG, 13th-month, BIR withholding tax on compensation, de minimis caps, ₱90k exemption
- [`@ph-dev-utils/psgc-barangays`](https://github.com/kon2raya24/ph-psgc-barangays) — full PSGC barangay dataset (42,046 entries)
- [`@ph-dev-utils/faker`](https://github.com/kon2raya24/ph-faker) — PH-localized fake-data generator including `faker.payslip()`
- **`@ph-dev-utils/bir`** — this one

## ⚠️ Disclaimer

Real-money tax math. Verify outputs against official BIR calculators before production use. PRs welcome for additions, corrections, and EWT/DST/ATC contributions.

## License

MIT
