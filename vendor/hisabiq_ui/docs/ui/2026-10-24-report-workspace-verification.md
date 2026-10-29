> Historical verification from24 October, preserved unchanged below. These results are not fresh runs for the26 October consolidation; see the [current Reports index](reports/README.md) and source/review record.

# Reports workspace verification and scope
24 October 2026 · branch feat/reports-decision-workspace-20261024

## Delivered UI
The Reports route now has 34 catalog entries: 27 working views over existing in-browser records (including Overview), and seven explicit source-readiness states. Available families cover sales/products/categories/customers/returns/gross profit/discounts, purchasing/supplier totals/unit-price evidence, stock/low stock/selling speed/ageing/expiry/movements/reorder planning, customer/supplier outstanding and collection review, cash/bank/MFS/expenses/finance movements, warranty and data completeness.

The seven readiness entries are P&L, Balance Sheet, installment ageing, supplier delivery performance, seasonal comparison, bundle profit and Reconciliation. Reconciliation links to the existing workspace. None are represented as completed live calculations.

## Workflow coverage
| Starting point | Working actions | Scope and safety |
| --- | --- | --- |
| Overview | Select report group; inspect summary; open contributing records | Defaults to Business overview as requested |
| Report table | Date/calendar, comparison, search, relevant entity/status/account filters, clear; sort; paginate | Actual current preview rows, not fixed September panels |
| Report selection | Desktop searchable library; mobile searchable selector; pinned favorites | Keyboard tabs support Left/Right/Home/End |
| Row details | Open source facts; drill into contributing records; print details; open source module | Read-only context; source editor is reused rather than copied |
| Output | Visible-column selection; filtered CSV; real print popup; blocked-popup error | Same full filtered rows, including beyond pagination |
| Saved view | Name/save/open/delete; restore after reload | Browser preferences scoped to current demo business/user; corrupt storage recovers |
| Purchase planner | Adjust lead/review/safety/pack/budget; inspect explanation; download suggested lines | No purchase or stock posting; incoming/reservation source exclusions explicit |
| Data readiness | Explain missing historical costs, ledger/contracts and allocation information | Unknown cost is not zero or today's product price |
| Navigation | Back restores report selection and deliberate filter changes; source visit returns through browser history | Transient search/sort updates replace rather than flood history |

Quick Add and editable carts are intentionally not duplicated in read-only report filters. No payment posting, stock movement, customer creation, message sending or subscription enforcement is introduced.

## Checks and results
- 15 new pure reporting regression tests pass, including fractional quantities, unknown costs, exact discount allocation, supplier return positions and account split amounts.
- Report browser smoke passes: groups, source filters, comparison, clearing, details, columns, saved views/reload, CSV, planner, calendar, malformed dates and Back navigation.
- Print/blocked-popup tests pass in four responsive/theme/language profiles.
- Shared report/document localization checks pass in six profiles (English/Bilingual/Bangla, mobile/desktop).
- Accessibility matrix: 48 axe scans, eight widths × two themes × three languages, zero findings, no document overflow or runtime errors.
- TypeScript and production build pass. Build retains the existing large-chunk warning.
- ESLint completes with zero errors and 220 warnings across the repository; warnings include existing patterns and non-blocking new report warnings.
- UI design contract and input-focus/control inventory checks pass.
- Full unit suite: 711 tests, 709 pass, two fail. Both failures were reproduced before report changes:
  - tests/bundleHandoff.test.ts:20 — quote → accepted order keeps whole Sets, parent agreed price, revision and recipe signature.
  - tests/bundleHandoff.test.ts:54 — stale accepted quote cannot silently create online order with changed components.
  - These dated quotation fixtures are now expired. Quotation behavior was not changed in this report task.

The implementation is suitable for a draft review PR, not a claim of a completely green repository or production reporting/backend readiness.

## Fresh reviews
A fresh code reviewer identified supplier returns, split finance accounts, finance cash-book coverage, quantity precision and report history issues. Each was addressed; source-calculation regressions were observed failing before their fix and passing afterward, with Back covered in the browser smoke.

A separate Impeccable reviewer returned visual SHIP after desktop/tablet/Bangla-dark-mobile and incumbent comparison. Detector ran once and returned no findings. The documentation pass records inherited design-system consistency in 2026-10-24-report-workspace-ui-review.md.

## Minor finish notes
Mobile tab-scroll affordance is subtle; the long record-search placeholder truncates on desktop while the accessible label remains complete; Bangla chart tick dates retain MM-DD. Global body tabular-numeral settings predate this work; no monospaced class or competing typography system was added.

## Deliberate implementation decisions
- Extend the actual repository UI, not create a separate dashboard or new visual system.
- Use existing preview stores and label their status; backend work remains outside this request.
- Do not invent P&L, overdue dates, delivery scores or bundle costs where source contracts are incomplete.
- Keep a small shared report engine instead of separate duplicated table/filter implementations.
- Basic/Counter commercial restrictions are documented but a new entitlement/security system is not implemented in this UI change.

## Follow-up: colors, badges and help
Added semantic totals/status cues, explicit missing-cost badges, bilingual Bangla helper labels and opt-in portal tooltips. Help covers report terms, comparison and buying assumptions; it opens by pointer, focus or touch, stays within the viewport and dismisses before its parent dialog on Escape. Source calculations are unchanged.

The dedicated guidance browser test passes four language/theme/device profiles, including four stock-route axe scans with no findings. Existing report workflow and print/popup tests still pass. TypeScript, build and UI-contract checks pass; the full unit result remains 709 passing and the same two pre-existing quotation failures. Fresh visual review returned SHIP after matching the receivables summary to amber due values; detector returned no findings. The report CI step now includes the guidance check without adding another workflow.

