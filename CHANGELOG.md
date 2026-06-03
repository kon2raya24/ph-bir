# Changelog

## [Unreleased]

## [0.3.0] - 2026-06-03

### Added

- **Expanded Withholding Tax (EWT)** — `computeEWT(amount, category, opts?)`, `ewtRate(category, opts?)`, `listEwtCategories()` (JS) and `Ewt::compute()` / `Ewt::rate()` / `Ewt::listCategories()` (PHP), plus `EWT_META` / `Ewt::meta()`.
  - **8 common creditable-withholding categories** under RR 11-2018 (TRAIN era): professional & commission fees for individuals (5% / 10%) and non-individuals (10% / 15%), rental (5%), contractors/subcontractors (2%), and top-withholding-agent purchases of goods (1%) and services (2%).
  - **Threshold logic** encoded: the lower professional/commission rate applies only with a sworn declaration on file and the payee's annual gross at or below the threshold (₱3M individuals / ₱720k non-individuals), and — for individuals — a non-VAT-registered payee. With no options the higher rate is returned (the conservative default).
  - Data: `data/ewt.json` with `_meta` (source RR 11-2018, source URL, `verified_on`).
- Tests: new vitest + PHPUnit covering every category's rate, the threshold/sworn-declaration/VAT conditions, centavo rounding, and input validation.

### Notes

- **ATC (Alphanumeric Tax Code)** values are intentionally omitted — confirm against BIR Form 0619-E / 1601-EQ before filing.
- **Documentary Stamp Tax (DST)** remains deferred pending verification of the 2025 **CMEPA (RA 12214)** rate revisions (the schedule is currently in flux and public sources disagree).

## [0.2.0] - 2026-05-28

### Added

- **Individual income tax** — `incomeTaxGraduated(taxableIncome, { asOf? })` / `IncomeTax::graduated()` and `incomeTax8(gross, { mixedIncome? })` / `IncomeTax::eightPercent()` (JS + PHP).
  - **Graduated TRAIN rates**, date-aware: the lower **2023-onward** schedule and the **2018–2022** schedule (looked up by `asOf`). First ₱250,000 exempt. Boundaries verified: ₱400k→22,500 · ₱800k→102,500 · ₱2M→402,500 · ₱8M→2,202,500 (2023-onward).
  - **8% optional flat tax** for self-employed/professionals with gross ≤ ₱3M, in lieu of graduated income tax + the 3% percentage tax. Pure SEP = 8% × (gross − ₱250k); mixed-income = 8% × gross. Flags ineligibility above ₱3M.
  - Data: `data/income-tax.json` with `_meta` (NIRC § 24(A)(2), RA 10963 / TRAIN; source URL; `verified_on`).
- Tests: new vitest + PHPUnit covering bracket boundaries, mid-bracket math, the 2018–2022 vs 2023 boundary, and the 8% pure-SEP/mixed/eligibility cases.

## [0.1.1] - 2026-05-28

### Fixed

- **Blank README on npmjs.com.** The published npm tarball declared `README.md` in `files` but had no per-package `packages/js/README.md`, so the npm page rendered empty. Added the package README (install, JS + PHP usage, verified-rates table, family links). No code or API change.

## [0.1.0] - 2026-05-25

Initial release. BIR (Bureau of Internal Revenue) tax utilities for the Philippines, JS + PHP parity.

### Added

- **VAT** — `addVat`, `extractVat`, `isVatRegistrationRequired`. Rate 12% (RA 9337); threshold ₱3,000,000 (TRAIN RA 10963).
- **Percentage tax** — `percentageTax(grossReceipts, { asOf? })` with date-aware rate lookup. 3% standing rate (Tax Code § 116); 1% temporary rate honored for the 2020-07-01 → 2023-06-30 CREATE-era window (RA 11534).
- **BIR forms** — `listForms(filter?)`, `findForm(numberOrName)`. Curated reference list of the ~20 most-commonly-used BIR forms, with status field flagging EOPT-era supersessions (e.g., Form 2550M → 2550Q under RA 11976).

### Verified

- All rates cross-referenced against the originating Republic Acts (RA 9337, RA 10963, RA 11534, RA 11976) via Lawphil before shipping.
- Each data file carries `_meta` with `source`, `source_url`, `verified_on`, and `effective_from`.
- 33 vitest + 29 PHPUnit = 62 tests green, including date-boundary tests for the percentage-tax revert (last day of 1%, first day of 3%).

### Deferred to v0.2+

- **Expanded Withholding Tax (EWT) rates** — needs careful sourcing against the current BIR EWT table (RR 11-2018 and updates).
- **ATC code reference** — large lookup table requiring separate curation pass.
- **Documentary Stamp Tax (DST)** — multiple sub-rates, careful sourcing needed.
- **BIR RDO (Revenue District Office) directory**.
- **BIR Form 2316 generator** — planned for `@ph-dev-utils/payroll` v0.4 (employee/payroll-coupled).

[0.3.0]: https://github.com/kon2raya24/ph-bir/releases/tag/v0.3.0
[0.1.0]: https://github.com/kon2raya24/ph-bir/releases/tag/v0.1.0
