# HisabIQ — Bangla Phase 4 (stacked on Phase 3)

## Scope
- Audit Ledger filter values displayed in Bangla without changing filter IDs
- Audit Ledger list, delete-impact review, correction dialog, details and print report
- Accounts overview, entry/voucher list, date/status labels and summary cards
- Account ledger, Trial Balance and Profit & Loss / Balance Sheet views with isolated localized printed reports
- Party statement, vendor payables/receivables, ledger toolbar, and print-view labels

## Accounting invariants
- Never translate or swap stored debits/credits; **ডেবিট/ক্রেডিট** are labels, not a sign inversion
- Customer balance owed to the business is **পাওনা**, supplier/vendor amount owed by the business is **দেনা**
- Keep original posting IDs, statuses, audit history, reversal safeguards, date filters, calculations, totals and tenant context unchanged
- Keep original CSV headers/record values for existing external integrations
- Print documents use the current existing language preference, not a second option
- The UI is still a preview, not a live accounting backend; never imply that a source record is actually posted to a bank

## Stacking
This branch depends on Phase 3's `documentCopy` and print infrastructure. Merge PR #92 before merging this PR; retarget it to main once its base is available. Neither PR should be merged without approval.

## Deferred
The complete Finance forms and reconciliation details, deeper Party dialogs, and every advanced audit error message still require a separately scoped translation pass.
