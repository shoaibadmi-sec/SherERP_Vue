# Reports UI — first implementation slice

27 October 2026 · User request: “Start work building the report ui module.”

This implementation starts the canonical Reports plan on `feat/reports-ui-20261027`, stacked on the open documentation and visual-library branches (#207 and #206). It does not merge those branches or change subscription entitlements. It is a frontend demo built from existing operational preview records, not backend accounting.

## Delivered behavior

- Eleven URL-owned destinations: Advisor, Profit insights, Smart buying, Cash forecast, Customers, Overview, Sales & profit, Stock, Dues, Cash & expenses and Report library. Overview stays the default. All 34 existing catalog IDs and their legacy URLs remain available in the library, including seven honest source-readiness explanations.
- Party Ledger underline navigation with arrow/Home/End keyboard support and scrolling; all main controls keep the existing 36px design contract.
- Eight Overview KPIs in a desktop 4×2 arrangement; source-linked metrics; shared 250px sales trend with daily totals and nested source invoices. Sales, Stock, Dues, Money and Customers compose the existing report engine into summaries and evidence tables.
- Advisor has a single Ink/Mint focal panel and initially three priority recommendations. Each includes what happened, why it matters, what to do and how it helps. Sources open shared ReportDetails. Dismiss/restore preferences are scoped to business/user; materially changed source evidence gets a new identity and resurfaces. Reviewed status is session-only; there is no fake resolved or payment state.
- Profit includes a 230px revenue/margin scatter and historical-cost coverage. Unknown sale-time costs remain unknown. No current product price is substituted for missing historical cost. Missing evidence produces an explicit empty chart.
- Cash forecast is an explicitly illustrative, editable 30-day scenario with inflow/outflow bars, modeled balance, buffer and exact weekly checkpoints. Initial amounts are labeled example assumptions, independent of recorded payments. Save/reload is business/user scoped in browser storage; saving never creates a payment, purchase or ledger entry.
- Smart buying retains real existing demand/safety/pack/budget assumptions, suggestions, supplier purchase evidence and CSV purchase-list output. It explicitly explains that saved plans/POs/receipts are not yet part of this slice.
- Saved report views retain their screen, filters and columns. Legacy views still load; essential label columns and the 20-view cap are enforced. Header print/export on analysis screens explicitly says source report/source CSV.
- Review fixes keep each analysis destination bound to its own report definition, including incompatible URL overrides and restored saved views. Related evidence removes unsupported dimensions; expense evidence distinguishes its all-account scope and avoids treating product categories as expense categories. Expiry evidence labels signed days until expiry separately from stock age; scenario checkpoints distinguish cumulative inflow/outflow and modeled closing balance.
- Accepted purchase creation, payment, correction and return publish an observable revision, so Reports refreshes without navigation. Purchase source movements include the original receipt, correction deltas and supplier returns. Duplicate creation does not publish/post twice.
- Frozen full-chain purchase source validation now accepts intermediate price units (CT → BOX → PCS → Feet), including fractional base quantities, while rejecting unknown/cyclic/invalid units. Internal transfers remain visible in Finance evidence and are excluded from operating cash movement rows.

## Component reuse

Existing Button, Input/NumericInput, Panel, StatusBadge, Table, Dialog, SearchSelect, AppDateRangePicker via ReportToolbar, ColumnVisibilityEditor, MotionTabList/Indicator, ReportResults, ReportDetails, runReport, currency/output helpers, Recharts and current domain stores are reused. ReportSalesTrend extracts the existing chart family for Overview and Sales. ReportEvidencePanel composes the existing Table/Panel; it is not another report engine or primitive library. No dependency was added.

## Plan progress and remaining work

| Canonical task | Actual position |
| --- | --- |
| 0 — guide/library | Existing v2.2 adopted; generated source inventory synchronized |
| 1 — coherent demo command boundary | Purchase observation implemented; unified persistence, tenant-scoped operational records, Party/source adapters and deterministic connected fixtures remain |
| 2 — full unit/source projections | Intermediate-unit validation and linked purchase movements implemented; complete tracked receipt/correction acceptance remains |
| 3 — Reports presentation | Eleven destinations, Basic compositions and preserved library implemented; this is the first composition pass |
| 4 — universal evidence/return | Existing nested details reused by new surfaces and trend; exact canonical source opening, full return context/scroll/draft persistence remain |
| 5 — Premium | Initial Advisor/profit/customer analysis and saved scenario implemented; full action lifecycle, observed resolution, supplier comparison and richer connected demo history remain |
| 6–9 — action chain | Editable saved multi-supplier plans → POs → partial receipts → canonical PurchaseEditor → stock/ledger/Reports and other domain actions remain |
| 10 — acceptance | Scoped first-build checks below; full canonical 69-scenario acceptance is not claimed |

Navigation commercial gating, plan pricing, full source permissions and financial backend integration are unchanged. Operational preview stores are still browser-session singletons; only analysis/view preferences introduced here persist locally. No cross-device or server durability is implied.

## Verification

| Check actually run | Result |
| --- | --- |
| Full `npm test` after review fixes | 729 passed, 0 failed |
| TypeScript and production build | Pass; existing large-chunk warning remains |
| Changed-file ESLint | 0 errors, 17 warnings (non-null assertions and external-selector memo dependencies) |
| Guide sync and UI contract | Pass; v2.2 inventory regenerated from current source |
| New `test:reports-analysis` | Pass: all eleven screens, URL/saved-view consistency, oversized-input recovery, scoped expense evidence, source-revision review badge, eight KPIs, nested evidence, saved scenarios/views, CSV and keyboard |
| New-screen responsive/a11y matrix | 55 scans: 11 screens × five device/language/theme profiles; zero axe violations, page overflow or runtime errors |
| Existing Report workspace / guidance / print | Pass; print includes blocked-popup recovery across four profiles |
| Purchases and multi-unit Products/POS/Purchase | Pass; four-unit/custom-price checks at 320, 390 and 1440px |
| Table typography | Pass: 75 route/profile views and 3218 text observations; 13/12/11 roles |
| Motion navigation | Pass: nine module tab strips at 390/1440px with normal/reduced motion |
| Impeccable detector | One scoped run, no findings; not rerun after the review correction batch |
| Independent review | Four Important and one badge issue corrected; all three visual fixes scored resolved, disposition ship at that fix-list scope |

[Review decisions and remaining scope](2026-10-27-first-build-review.md) retain the findings, corrections, all 22 explicit review limits and decisions. [Eight implementation captures](qa-2026-10-27/) include desktop, tablet and dark phone examples. The complete canonical 69-scenario project acceptance remains future work.

The existing global body `tnum`/guide changelog drift was documented by the independent documenter and was not repaired as a side effect. Table and input overrides retain the current guide contract. This is an ordinary extension, so no competing DESIGN.md or design-system sidecar was added.
