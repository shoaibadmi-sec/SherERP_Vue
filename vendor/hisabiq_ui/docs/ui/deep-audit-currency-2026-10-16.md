# Paisa display audit — 16 October 2026

Frontend display correction only; no transaction values or calculations are changed.

## DPI-16 — P0: saved paisa displayed as zero

Reproduction: Finance → New transaction → `0.25` → Review. The confirmation showed **৳0** while Bangla words described 25 paisa. Party → Receive payment → `0.25` had the same incorrect review. After correcting the symbol formatter, the actual saved Party payment still displayed **0** in the ledger, confirmed through the visible mobile ledger money element.

Root cause: `taka` and bare monetary calls to the generic `formatNumber` defaulted to zero decimal places. `taka` now preserves two paisa digits for fractional values and keeps whole amounts compact. The shared `formatMoneyNumber` serves Party ledger and statement values without a currency symbol. Generic quantities/counts and explicit precision overrides remain unchanged.

## Browser inventory

| Module | Full interaction chain |
|---|---|
| Finance | New transaction → enter 0.25 → review shows ৳0.25 → confirm → Loans & Owners → new source row shows +৳0.25. |
| Parties → Customer c4 | Receive payment → enter 0.25 → review shows ৳0.25 → confirm → visible ledger shows 0.25 → row menu → Edit preserves source value 0.25 → cancel → Print statement → credit cell shows 0.25 → close. |

`scripts/deep-currency-browser.cjs` defines 96 journeys across all eight requested viewports, both themes and all three language modes, using touch through 1024px and mouse above. Failed journeys save screenshots and traces. Four original review failures and two additional genuine ledger precision failures were recorded. Intermediate strict-locator errors (mobile card vs desktop row; two Close controls) are harness errors, excluded from defect counts.

Unit checks cover positive/negative paisa, whole Taka, lakh/crore grouping, explicit rounding and unchanged generic count formatting. Existing Input/Dialog/ledger/statement components are reused.

## Limits

This slice does not certify every money display or the entire ERP. Daybook bare-number monetary output needs a separate fractional-value browser scenario. Google Fonts are blocked locally; downloaded-font rendering and real software keyboards remain unverified. Required CI and final matrix results are linked from the PR. Backend posting remains unverified.
