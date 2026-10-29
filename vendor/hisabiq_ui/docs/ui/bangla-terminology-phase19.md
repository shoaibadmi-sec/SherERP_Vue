# HisabIQ Phase 19 — Expenses list and management language coverage

## Baseline and scope
Phase 17 Sales, Phase 18 Purchases and the ERP-wide coverage audit are merged. Continue the audit with the routine **Expenses** module using the existing `useUiCopy`, `text` and shared input/dialog/Table components.

This phase localizes previously English-only copy in:
- expense summary cards, receipt action, search/filter accessibility, payment method presentation and action menu accessibility;
- category management headings, history-safety explanation, headers, statuses and Edit/Activate/Deactivate;
- payee management headings, status and action names, linked-transaction disabled reason and fallback error;
- success and error feedback for preview-only saving, correction, category changes and cancellation.

## Data and UX safeguards
- Retain existing `Expense`, `Party`, `PaymentMethod`, category name, payee name, record ID, reference/date, ledger/stock/business data.
- Preserve `All categories`, `All payees`, `All payment methods`, `Active`, `Cancelled` **filter IDs** in state.
- Preserve machine-readable CSV header names/field order and monetary values. Print rendering already delegates through `documentLabel` and `documentMethod`.
- The summary totals and `paymentLabel` computation are unchanged; only the shown copy is translated.
- Preview-only toasts explicitly say preview. **No cash/bank/ledger posting** is added, changed or implied.
- Reuse existing shared BillDialog, BillDetailDialog and PartyEditorDialog; do not introduce another editor/cart, override purchase semantics or alter source mutation rules.
- English and English + Bangla retain English primary labels; Bangla uses everyday language. No additional inline Bangla helper in the full Bangla mode.

## Tests
- `tests/banglaPhase19ExpensesContract.test.ts` checks mode output and domain/filter/CSV/payment/store invariants.
- `npm run test:bangla-expenses`: English, English + Bangla and Bangla at 390px / 1440px; cards, category/payee settings, filters, action menu, CSV filename and runtime errors.
- CI includes the new browser suite alongside all POS, Purchases, product, accessibility and responsive tests.

## Remaining audit items
- Shared BillDialog/PartyEditorDialog may have independent untranslated help and validation; audit as their own component-level slices to avoid cross-module regressions.
- `Parties.tsx` still has English-only preview mutation feedback. Prioritize it as **Phase 20 — Party source and financial action feedback**; do not localize raw server validation errors by replacing content blindly.
- Audit all routed modules at 390, 768 and 1440px, dark/light, keyboard and print before declaring full language coverage.
