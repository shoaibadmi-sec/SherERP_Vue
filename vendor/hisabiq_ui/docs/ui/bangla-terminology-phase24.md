# Phase 24 — Shared Excel / CSV Import Wizard language

## Scope
After Party directory and CSV entry Phase 23 (#114), finish the **existing shared ImportWizard** used by Product and Customer/Supplier imports. No duplicated importer.

| Step | UI-only changes |
| --- | --- |
| Upload | Template download buttons, file chooser, constraints, worksheet and detected rows/columns |
| Map columns | Product and Party field labels, required/optional fields, unmapped choices, source preview |
| Review | Ready/error/skipped counts and filters, search, source annotations, conversion previews, duplicate decisions, row edit controls, opening-balance warnings |
| Finish | Result metrics, browser-preview-only disclaimer, error CSV, another-file and view actions |

## Safety boundaries
- Persisted values **never translated**: ImportTarget (product/customer/supplier), mapped field keys, `sourceRow`, `decision` (create/skip/reject/add-role/update-master), CSV headings, category/stock units, dates, amount, Dr/Cr, account IDs.
- No changes to `src/import/` file reader, field schemas, column mapping, Product or Party identity decision algorithms, or their commit adapters; only view messages.
- `ImportWizard`, `ImportUploadStep`, `ImportMappingStep`, `ImportReviewStep` and `ImportFinishStep` are **the same shared components** and use `useUiCopy` and known-message translations. Error text from unknown sources remains unmodified instead of fabricating a meaning.
- Preview-only: Excel/CSV imports change browser preview state; **no backend, cash, bank or mobile payment posting**. Party opening balances remain unverified historical ledger entries; Product opening stock and unit conversions retain original math.
- English remains existing original text. English + Bangla retains English primary labels and optional Bangla helpers. Full Bangla has simple native labels.

## Regression gates
- Source contracts in `tests/banglaPhase24SharedImportContract.test.ts`.
- `npm run test:bangla-shared-import-wizard`: exercise Product opening stock and Customer opening balance with current shared steps and confirmation across English / English + Bangla / Bangla and 390px / 768px / 1440px.
- Existing `scripts/product-import-browser.cjs` and `scripts/party-import-browser.cjs` remain unmodified English workflow gates, including SKU duplicate resolution, merged Party role, document sources and Dr/Cr directions.
- Existing CI TypeScript, lint, `npm test`, build, responsive, theme and POS/UI contract tests must pass before merge.

## Outside this slice
No modifications to re-import idempotency, CSV / XLSX parsing, import adapters, stock valuation, finance posting, tenant data access or product/party data model.
