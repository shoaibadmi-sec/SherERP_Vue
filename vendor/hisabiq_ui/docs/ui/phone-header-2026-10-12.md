# Small phone header and layouts

At 320px, the global search input's minimum content width forced the toolbar outside the screen and made every ERP page 384px wide. A second row for search below 640px keeps the existing navigation, logo, appearance, calculator, notifications and user menu visible. At 640px and above the single row remains. All existing handlers and finance/session logic are preserved.

Verified geometry and opening/closing menus/navigation at 320/360/390/640/768/1024/1440, light/dark and touch. Rechecked complete Expense and Purchase workflows at 320px. The header search field retains its current behavior; global search results/shortcut wiring is separate existing frontend debt, not implemented by this layout fix.

The 320px route scan also found Party directory minimum-content sizing, unwrapped report period controls and POS Quick Item offer-price overflow. The directory can shrink, report choices wrap, and Quick Items use a readable number of columns with wrapped offer prices. The actual POS cart and all price calculations remain unchanged. Party tab containment and Panel shrink/wrap classes are identical to PR #69 so this stack can be tested independently.

The combined pending branches pass 510 route renders: 51 routes at 320/390/768/1024/1440 in both themes, without crashes or page overflow. POS reorder/print-order and calculation invariance regression also passes.

This follow-up is stacked on PR #75 to include the workflows which revealed the issue. It also composes with the shared dialog/layout and cash reconciliation PRs. No merge without approval.
