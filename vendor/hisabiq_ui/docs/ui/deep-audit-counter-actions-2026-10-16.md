# Counter search and payment-source audit — 16 October 2026

Baseline: main f61a66d6108a490234bb27da47384bd7eaafcf5b. This is a frontend preview audit.

## Browser observations and correction

DPI-25 / P1: search Rahman → Escape → list disappears → Enter selects Rahman Hardware from the hidden results. The handler did not check whether suggestions were open. After Escape, tapping the already-focused input also did not reopen the list. A subsequent real Tab journey exposed Escape from a focused suggestion leaving the list visible.

The existing Counter search now selects on input Enter only while open, reopens on click/tap, handles Escape from its owned input/results with focus return, and dismisses when focus leaves its container. No replacement picker, cart, money formula, ledger command, navigation or source IDs change. The same search serves customer and supplier modes.

Baseline smoke: four genuine failures across both phone themes (hidden selection and pointer reopening), with two successful payment workflows. After the first two fixes, focused-result Escape reproduced in the expanded keyboard chain. Final smoke: six journeys passed.

## Regression inventory

`scripts/deep-counter-actions-browser.cjs`: three journeys × eight requested sizes × both themes × English/bilingual/Bangla = 144 planned journeys. Actual results are counted in JSON. Touch through 1024px, mouse above; failure screenshots and traces retained.

| Journey | Outcome verified |
| --- | --- |
| Escape → Enter | Hidden results cannot select a customer; original search text remains. |
| Pointer reopen / Tab / Escape | Real tap/click reopens the focused input; Tab reaches Clear and suggestions; suggestion Escape closes and returns focus; Tab out of the complete list dismisses it. |
| Payment sources → review/edit/record | Zero second row blocks review; Cash 100 + BRAC Bank 50.25 and settlement 25 with reason survive Edit details; cancel creates no payment; confirm creates exactly one c1 source with unchanged account IDs, amounts and discount; inputs reset and sole row cannot be removed. |

Review-dialog axe scans at 390 and 1440 cover both themes and all languages. Reuses existing Input, AppSelect, Button, Dialog and CounterWorkspace. No force clicks or arbitrary delays.

## Remaining scope

Supplier, Expense and Bank Transfer action outcomes, Counter contextual Quick Add, invoice-specific allocation, and account lifecycle conflicts need additional measured follow-up. Passing customer split-payment tests does not certify every Counter mode. Real software keyboards, downloaded fonts, manual screen readers, backend posting and the complete ERP audit remain open. Do not merge without user approval.
