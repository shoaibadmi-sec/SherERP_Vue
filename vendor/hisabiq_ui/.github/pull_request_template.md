## What changed?
<!-- User-facing behavior and why this is needed. -->

## Design-system compliance — required for UI changes
Read [AGENTS.md](../AGENTS.md) and [Transaction UI Design Contract](../docs/ui/transaction-cart-design-contract.md).

- [ ] Reused existing shared shadcn-style controls, tokens and Magic Patterns visual language.
- [ ] For product lines: reused the approved POS V2 add-product/cart interaction **via shared components**; did not create a page-local `AppSelect`, picker, unit row or quick-add.
- [ ] Preserved the inline Add Product row, English/Bangla search, keyboard/touch entry, large+small units, price-in-unit and meaningful row actions.
- [ ] If flow takes payment: multi-method payment/account/discount and Paid/Due mirror POS layout, while remaining accounting-correct.
- [ ] Verified English+Bangla labels, light+dark fields/popovers/date pickers, compact mobile and desktop, focus and accessible labels.
- [ ] Added/updated tests (including Playwright for visual/interaction changes); `npm run check:ui-contract` passes.
- [ ] No mock UI falsely reports actual stock, money, invoice, SMS or courier posting.

## Context completeness and workflow honesty (required for UI and ERP changes)
- [ ] Common next tasks can be completed from the current record (or a context-preserving shared editor), with the correct party/product/supplier preselected and returnTo behavior.
- [ ] Missing payee/category/unit/brand/customer/account can be Quick Added without leaving or resetting a half-completed form; created item is selected.
- [ ] Every displayed button, row action, dropdown and filter is wired or intentionally disabled with a visible reason. No fake success, “dialog opened” toast or print/export claim without an actual effect.
- [ ] Financial edits/reversals/returns show source, permission, impact, date and audit reason; no destructive deletion of posted ledgers or double-posting.
- [ ] Source date ranges, list filters, scroll and selected Party role remain intact through contextual operations.
- [ ] Tested keyboard/Enter/Escape, touch/mobile, compound units and dark/light; status clearly distinguishes UI preview from real server work.

### Workflow coverage
<!-- Starting module and record; three most common next tasks; missing-dependency Quick Add; all action-menu items (working/disabled with why); source/return context; Playwright tests. -->
<!-- Link audit issue IDs from docs/ui/erp-workflow-audit-2026-10-09.md; explain any approved deviation. -->

### Shared components and helpers used
<!-- List concrete components, e.g. CartTable / ProductCombobox / PurchaseCart. -->

### Deviations / exceptions
<!-- Explain any deviation and reference explicit user approval. "Looks similar" is not an acceptable reason to fork. -->

### Screens tested
<!-- Desktop/mobile, keyboard/touch, light/dark. -->
