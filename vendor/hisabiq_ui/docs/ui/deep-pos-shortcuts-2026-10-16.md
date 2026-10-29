# POS blocking overlays and shortcuts — 16 October 2026

## Evidence and root causes

| ID | Priority | Reproduce | Observed | Correction |
| --- | --- | --- | --- | --- |
| DPI11 | P1 | POS → Exact payment → Preview sale → F2 | Focus moves into the background product input, opens its popup over the review, and scrolls the underlying page. | Ignore page shortcuts while a visible blocking dialog/drawer is open. |
| DPI12 | P1 | Fresh POS, walk-in customer with unpaid balance → disabled Preview sale → F9 | F9 opens a review despite the disabled action. | Dispatch F9 through the actual shared CheckoutPanel button ref so native disabled behavior and the existing onComplete action govern both input methods. |

Two corrected 390 × 844 baseline runs, light/dark, reproduce the focus and disabled-action failures separately. An earlier harness attempt omitted payment setup and correctly encountered a disabled Preview button; it is excluded from the defect counts. Screenshots/traces and result JSON are retained under `.superpowers/deep-audit/pos-shortcuts-before-corrected` and `pos-shortcuts-disabled-before`.

History reviewed for Pos and CheckoutPanel, including the transaction-review introduction in `6a11b3a`. PurchaseEditor already suppresses its page shortcuts while dialogs are open; GlobalSearchBox also respects modal drawers. POS now follows that established interaction rule. Nonmodal utility panels remain separate from blocking dialogs. No calculator, payment formula, source data, cart layout or backend operation is introduced or changed.

## Workflow inventory and regression coverage

`scripts/deep-pos-shortcuts-browser.cjs`: 8 requested viewport sizes × 2 themes × 3 language settings = 48 journeys.

| Module | Component/state | Action | Expected result |
| --- | --- | --- | --- |
| POS | Unpaid walk-in checkout | F9 | Disabled preview remains blocked. |
| POS | Sale review | F2, F8, F9 | Focus stays on the review control; no background popup/new overlay; cart and review amounts unchanged. |
| POS | Return from Edit details | F2, F8, F9 | Search and first payment regain shortcut access; enabled preview reopens. |
| POS | Receipt preview, explicitly unposted | F2, F8, F9 | Focus stays inside the receipt; underlying cart and amounts unchanged. |
| POS | New empty sale after closing receipt | F9 | Disabled preview remains blocked. |
| POS | Mobile/tablet navigation drawer | F2, F8, F9, Escape | Page shortcuts do not escape the drawer; Escape closes it. |

Uses real keyboard events, touch activation through tablet portrait and mouse activation at larger sizes. All state changes are frontend previews. Test output includes measured results and failure screenshots/traces. Full module certification, device software keyboards, font download verification and unrelated nested overlays remain outside this slice.

## Acceptance

Recorded final results and required green CI are attached to the PR. Frontend release readiness remains pending the wider inventory; backend readiness is unverified.
