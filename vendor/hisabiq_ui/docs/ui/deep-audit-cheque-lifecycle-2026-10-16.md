# Cheque lifecycle audit — 16 October 2026

Baseline: main f61a66d6108a490234bb27da47384bd7eaafcf5b. Frontend preview only.

## Browser-reproduced defects

- DPI-23 / P1: edit cheque 458923 bank → Cancel → Edit. UNSAVED BANK is still present and can later be saved accidentally. Cancel now restores all saved metadata fields through the same draft reset used when opening a record.
- DPI-24 / P0: replace its money account with `Nonexistent bank` → save → deposited → cleared. Status becomes Cleared while no account changes. The editor now reuses FormSelect with active bank choices. The shared `chequeMoneyAccount` lookup requires exactly one active bank identity; clearance revalidates it and updates that ID only. Missing, inactive, cash/MFS and ambiguous names cannot certify clearance. An invalid clearance keeps the confirmation open. The existing name-based cheque schema is preserved.

The status handler also checks the current record status and declared lifecycle action before applying a transition. It retains amount, source IDs, direction, party and existing movement formulas. No posting backend is added.

## Action inventory and regression

`scripts/deep-cheque-lifecycle-browser.cjs`: six journeys × eight requested viewports × two themes × three languages = 288 planned journeys; count actual completed results. Touch through 1024px, mouse above. Failing journeys save screenshots and Playwright traces.

| Journey | Checks |
| --- | --- |
| Edit/cancel/save/reopen | Discard bank/party edits, invalid required bank, valid metadata save, source number/amount preserved, Escape closes. |
| Received → Deposited → Cleared | Back/cancel leaves bank unchanged; deposit leaves bank unchanged; clearance adds exactly 35,000 once; terminal reopen exposes no repeat clearance or edit. |
| Presented → Cleared | Account choices exclude cash; missing account blocks clearance and keeps confirmation; valid bank selection subtracts exactly 22,000. |
| Received → Returned; Presented → Stopped | Reasons required; exact reason retained; terminal actions unavailable; bank unchanged. |
| Received → Deposited → Bounced; Received → Cancelled; Deposited → Returned | Each reason-required path changes status without moving funds. Fresh reload per independent branch. |
| New Issued → Presented → Returned; Issued → Stopped; Issued → Cancelled | Actual create/type switch/save actions; all branches preserve bank balances. |

Terminal-dialog axe scans at 390 and 1440 cover both themes/all languages. Unit tests reject missing, unknown, inactive, non-bank and duplicate-name accounts, and preserve the valid bank ID. FormSelect, Input, Dialog and Button remain the existing shared component family.

An initial expanded harness reused the same URL inside a multi-branch journey, so navigation retained terminal React state. Unique query values now guarantee a fresh page per independent branch. That harness failure is excluded from application defect counts. No force-clicks or arbitrary sleeps are used.

## Scope limits

Not complete ERP/Finance certification. Print/download coverage, real software keyboards, downloaded fonts, manual screen readers and backend posting remain unverified. Names remain legacy schema fields; ambiguous names are blocked rather than silently choosing one. Hosted/local results must be linked from completed runs before review readiness. Do not merge without user approval.
