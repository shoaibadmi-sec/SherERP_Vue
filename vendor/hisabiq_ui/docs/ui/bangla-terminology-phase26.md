# Phase 26 — Party Ledger table and transaction action localization

Baseline: Phase 25 stacked on Phase 24. This Phase 26 branch is stacked on Phase 25 until dependency PRs merge.

## Scope
- Existing `LedgerTable`: opening/period/closing labels, date/particulars/debit/credit/running/actions headers, mobile balance labels and zero-result states.
- Source badges: Invoice, Purchase, Finance, Opening, Note, returns, customer/supplier payments, credit refunds and expenses use consistent simple Bangla wording in Bangla mode.
- Amount captions and accessibility: preserve the existing `ledgerImpact` classification and colors/icons while localizing human-readable captions and `aria-label`.
- Existing `PartyLedgerRowActions` floating action list: View, Edit, Delete/reverse, Reverse, Print, Return, Open original, including group/trigger accessibility names; disabled reason remains original unknown copy.

## Data and safety boundaries
- Reuse existing `LedgerTable`, `PartyLedgerRowActions`, `FloatingPanel`, `StatusBadge`, `Button`, `useUiCopy`; do not duplicate or replace the component family.
- `src/i18n/partyLedgerCopy.ts` changes **only display labels**. The `PartyLedgerRow.source`, `relationship`, `sourceId`, `reference`, `debit`, `credit`, `runningBalance`, `Dr`/`Cr`, print/export source values and transaction actions do not change.
- No new posted invoices, payments, reversals, account movements, backend persistence, tenant reads or source correction implementation.
- Customer due vs Supplier payable directions remain intact. Color is supplementary to text and icon.
- Keep English and English + Bangla existing primary English labels; full Bangla uses the everyday glossary.

## Tests
- `tests/banglaPhase26PartyLedgerContract.test.ts` asserts stable data, source and action enums, amounts and callback wiring.
- `npm run test:bangla-party-ledger-table` exercises customer Party ledger and View source action in all three languages at 390/768/1440px.
- Existing Party ledger date range, source actions, statement print, opening and financial dialogs, Vendor Party projection and shared popup regression tests remain unchanged.
- Finish only with green CI for TS/lint/unit/build/Playwright/mobile/light/dark.

## Outside phase 26
No language-census certification or backend financial posting. Remaining language gaps proceed in Phase 27+, prioritized by the recorded full UI/UX audit rather than counting PRs as proof of release readiness.
