# Product picker keyboard continuation audit — 16 October 2026

Scope: shared `ProductCombobox`, used by POS, Purchase, Quotation and Online Order carts. This is a dependency-ordered continuation of PR #121, not completion of the ERP audit.

## Reproduced defects

| ID | Priority | Reproduction | Observed failure | Shared correction |
| --- | --- | --- | --- | --- |
| DPI09 | P1 | Search LED → Escape → Enter | A dismissed, hidden product is selected. Purchase/Quotation/Online add a line; POS acts on its existing LED line and clears the query. | Keep Enter consumed, but select/create only when the list is open. |
| DPI13 | P1 | Search LED → Escape → click/tap the still-focused input | Suggestions stay closed because neither focus nor value changes. | Reopen on the input's existing click interaction. |
| DPI10 | P1 | Search LED → Tab through Clear → Tab to next form field | Suggestions remain floating over unrelated form content. In Quotations, they cover the terms area while the textarea has focus. | Reuse the existing outside-interaction guard for document `focusin`, including the portaled list in the ownership boundary. |

The original Enter handler selected `results[active]` without checking visibility. The outside-dismissal effect watched mouse presses only. The input now also opens on click/tap without requiring a blur or query change. No cart calculator, price, source data, posting operation or layout is changed. Focus on Clear and the popup's Create button remains inside the picker boundary.

Baseline: two separate browser runs at 390 × 844, light/dark, four workflows each: 8 hidden-selection failures and 8 focus-dismissal failures. Screenshots and traces are in `.superpowers/deep-audit/picker-focus-before` and `picker-blur-before`. A further 2/2 Purchase baseline failures verify click/tap reopening in `picker-reopen-before`. The POS baseline was detected by the cleared query; its existing row count alone does not detect selection of a product already in the cart.

## Reusable interaction inventory

`scripts/deep-picker-focus-browser.cjs` runs four workflows at all eight requested viewports in both themes (64 journeys). Every journey checks:

1. Search → Escape → Enter preserves the query, row count and existing cart inputs.
2. Arrow Down and then click/tap on the already-focused input reopen suggestions; Tab reaches Clear without closing them.
3. Tab reaches the next actual form control and closes the suggestions.
4. Refocusing search reopens the same query; selecting a visible result changes the cart.
5. Where supported (Purchase, Quotation, Online), keyboard focus enters the portaled Create button, Enter opens Add Product, Cancel returns without changing the cart.

Uses actual keyboard transitions, touch selection up to tablet sizes and mouse selection on laptops/desktops. The existing POS cart does not expose on-picker Quick Add; this test does not claim that missing path is covered or add a new workflow. Product creation and nested category validation remain covered by PR #121's dedicated suite.

The new CI job retains result JSON and failed screenshots/traces. Google Fonts requests are aborted locally for deterministic execution in the restricted network; font-rendering and actual Android/iOS software keyboards require separate device verification. These tests use English plus the existing Bangla helpers; full Bangla interaction coverage remains in the broader audit backlog.

The full UI gate initially caught an old Purchase test selecting via Enter after Escape and an unchanged fill, with no visible list. It now explicitly clicks to reopen and waits for the visible suggestions before Enter; all compound-unit, cost, focus and posting-preview assertions remain.

## Related investigation

Sales row menu → View invoice initially produced axe contrast failures while the outgoing menu was fading. Waiting for the outgoing menu to detach produced zero color-contrast violations in the isolated desktop recheck. That transient observation is not classified as a stable palette defect. No palette change is included in this slice.

## Release gate

The strengthened local smoke run passed 8/8 journeys. The full matrix and required CI gate are recorded in the PR evidence. This slice does not establish frontend release readiness. Backend transactions remain unverified.
