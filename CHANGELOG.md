# Changelog

## [Unreleased]

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

[0.1.0]: https://github.com/kon2raya24/ph-bir/releases/tag/v0.1.0
