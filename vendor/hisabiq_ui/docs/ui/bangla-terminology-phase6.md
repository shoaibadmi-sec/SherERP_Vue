# HisabIQ Bangla Phase 6 — Cheques, cash sessions, advanced Finance

## Implemented
- Cheque creation and lifecycle actions (received/issued/deposited/presented/cleared/returned/bounced/cancelled/stopped)
- Cash session detail, current drawer overview and session history
- Finance transaction correction and reversal, account ledger/manual money movement, transfers, and Finance people management
- Isolated language-aware print for cheque, cash session, recent money-account entries, Finance transactions and transfers
- Existing English, Bangla-helper and Bangla settings reused without adding a preference

## Locked financial contract
- Cheque lifecycle **statuses and action IDs are never translated in state or saved records**. Display text only.
- Bank balance changes only after a cheque clears; translation does not change clearance logic.
- Cash variance remains counted minus expected, with no automatic balancing transaction.
- Transaction type, payment split total, role IDs, account IDs, sign/direction, reversal safeguards and audit state unchanged.
- Existing machine-readable CSV export columns stay English.
- Isolated print files carry an explicit **UI preview** warning; no representation of actual bank confirmation.
- Do not alter tenant or permission behavior.

## Validation
Run strict TS, lint, Node contracts and Phase 6 Playwright checks at 390px and 1440px for English / English + Bangla / Bangla. Re-run POS, Vendor, Party, Finance and responsive suites.

## Remaining localization
Some specialist cash drawer inputs in global CashSessionContext dialogs, backend/provider errors, cheque statuses in other list views, and scheduled message templates remain outside this phase. Whole-ERP localization is not yet complete.
