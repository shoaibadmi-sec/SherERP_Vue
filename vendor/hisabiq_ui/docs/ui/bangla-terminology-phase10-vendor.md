# Phase 10 — Vendor ledger statement localization

## Scope and intent
HisabIQ ERP UI preview. Continue the existing English / English + Bangla / Bangla preference in the specialist Vendor ledger statement, including its on-screen preview and printable balance labels. Use ordinary shopkeeper language for **দেনা** (payable to Vendor) and **পাওনা** (receivable from Vendor). Preserve the current statement layout and actions.

### Changed presentation only
- Dialog title and accessibility name; demo-only disclaimer.
- Payable / receivable tabs and account description, including clear direction of money owed.
- Statement columns: date, source, increase, decrease and running balance.
- Opening balance, period movement, closing balance and the unknown-price warning.
- Close, Export CSV and Print action labels.
- Mixed language keeps English primary label and Bangla helper; full Bangla does not repeat an English helper.

### Locked behaviors
- The exact `'payable'` / `'receivable'` IDs and existing `projectVendorStatement` projection must not change.
- Unknown Vendor cost is **not** zero. Preserve `unpricedSources` and the unknown-price warning.
- No changes to Vendor money movement, ledger sign convention, purchase source links, settlements, posted entries, payment reconciliation or invoice state.
- CSV uses `serializeVendorStatementCsv` unchanged, with the same machine-readable data and filename.
- Existing print button still invokes the current browser print flow without a new document backend.
- Continue to use existing shared Dialog, Button, tenant language preference and font system. No monospaced digits.

### Verification
- `tests/banglaPhase10VendorStatementContract.test.ts` checks unchanged projection, CSV and side identifiers.
- `npm run test:bangla-vendor-statement`: English / Mixed / Bangla at 390 and 1440px; open Vendor ledger, check tab labels, balances, preview disclaimer, export and close.
- Keep the existing `vendor-workflow-browser.cjs`, price-later and supplier/party regression suites in CI.

### Follow-ups
Other specialist warranty and quotation printable documents and standalone secondary pages will be handled in subsequent narrow phases. This work deliberately does not change their status or data schemas.
