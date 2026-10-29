# HisabIQ Bangla Phase 5 — Finance, reconciliation and Party settlements

## Scope
- Finance transaction, money-account and account-transfer forms with amount-in-words and review safeguards
- Reused payment split editor (display labels, without changing Cash / Bank / Mobile Banking IDs)
- Finance dashboard cards, table headings and module tabs
- Bank reconciliation statement import notice, matching, candidate review, mobile selection, history, status filters
- Party customer receipts, supplier payments, refundable-advance review, corrections/reversals and Owner/Lender/Borrower entries

## Locked financial behavior
- Never change payment methods, posting types, directions, payment account IDs, bank match IDs or status identifiers.
- Customer owed-to-business is **পাওনা**; supplier owed-by-business is **দেনা**.
- Refund can use verified available credit only, never unverified credit.
- Payment split sum must match the entered amount; discount must have a reason and cannot exceed due.
- Reconciliation is a preview: no statement PDF is imported and no real bank/ledger posting occurs.
- CSV fields and amounts remain machine-stable; translations only appear in presentation and accessible labels.

## PR dependency
Phase 5 is stacked after Phase 4 and Phase 3:
1. PR #92, then PR #93, then this PR.
Do not merge any without explicit user authorization. Retarget PRs to main after earlier phases merge.

## Remaining localization
Cheque-related specialist dialogs, cash-session details, advanced Finance Record dialogs, SMS/print templates and provider-specific messages are separate work. Phase 5 must not be presented as complete ERP localization.
