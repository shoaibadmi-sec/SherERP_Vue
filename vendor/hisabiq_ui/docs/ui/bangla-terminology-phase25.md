# Phase 25 — Source-safe localized Excel/CSV import issues

Phase 24 adds three-language UI copy to the shared Product/Party Import Wizard. Phase 25 localizes **import validation feedback** without changing the import engine, calculations or exported source error data.

## Scope
- UI-facing known CSV/XLSX file-reader errors: unsupported format, 1/5 MB limits, empty sheet, wrong quoting, too many rows.
- Column mapping errors: duplicate source selection, required fields, spreadsheet formula-like text.
- Product preview errors: duplicate SKU, unsafe master updates, invalid unit conversion, stock/serial/expiry and warranty constraints.
- Party preview errors: identity, duplicate phone/ID, missing phone's leading zero, opening amount/date/direction and linked opening-balance conflicts.
- Dynamic values such as SKU, product name, source row number, relationship enum and serial values remain unchanged inside translated messages; unknown errors pass through without a fabricated translation.

## Invariants
- Reuse **unchanged** `ImportWizard`, `ImportUploadStep`, `ImportMappingStep`, `ImportReviewStep`, `ImportFinishStep`, `AppSelect`, `Input`, `Button`.
- Add only `importValidationCopy.ts` as a display-only dictionary behind existing `importWizardError`. English + Bangla remains English primary, English unchanged, Bangla gets familiar wording.
- No modifications to `src/import/{fileReader,columnMapping,productImport,partyImport,fieldSchemas}`, product lots, Party identity rules, financial columns, 0-prefix phone validation, record authorization, or import targets/decisions.
- Generated `makeImportErrorCsv` and original `ImportIssue.message` stay machine-readable source English. Do not translate values used for retries or duplicate resolution.
- No backend writes; all operations remain browser UI preview. Historical Party opening entries never move Cash/Bank/Mobile accounts.

## Gates
- `tests/banglaPhase25ImportValidationContract.test.ts` validates source-preserving connections.
- `npm run test:bangla-import-validation` tries unsupported file and invalid Product Name on Product Import at 390px/1440px in English, English + Bangla and Bangla; confirms no import can be submitted.
- Existing Product, Customer/Supplier and shared Import Wizard journeys as well as strict TS, lint, unit, browser responsiveness, theme and POS remain required.
- No merge before CI passes and Phase 24 is merged.
