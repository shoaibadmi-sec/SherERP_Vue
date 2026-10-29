> Historical research/proposal — retained in full for evidence. Conflicting implementation, visual/navigation and approval instructions are superseded by the [canonical26 October Reports specification](../../../superpowers/specs/2026-10-26-hisabiq-reports-final-uiux-design.md). This is not the current implementation plan.

# HisabIQ Reports Module — GitHub vs Magic Patterns Comparative Audit

**Review date:** 26 October 2026 (Asia/Dhaka)  
**Scope:** Read-only source review; no commits, UI changes, runtime browser testing or production ledger certification.  
**GitHub source of truth:** [`shuvodelux-commits/hisabiq_ui`](https://github.com/shuvodelux-commits/hisabiq_ui), `main` at `79c51fdbbc8ce47364488127a1e2c5762f6526d9`.  
**Magic Patterns source:** [editor `t6q3mxi6nhuak3qjvx8cwn`](https://www.magicpatterns.com/c/t6q3mxi6nhuak3qjvx8cwn), active artifact `6d7e6f96-3b50-43fb-adb2-d0be21b393b7`, generation idle when read.  
**Verdict:** Retain the GitHub Reports module as the **functional and visual integration baseline**. Selectively adopt the Magic Patterns **decision-assistance concepts**, after replacing seeded history, forecasts and placeholder actions with real, source-proven calculations and ERP workflows. Do **not** wholesale replace the GitHub module.

## 1. Executive findings

GitHub delivers **34 catalog entries, 27 implemented report views and seven explicitly unavailable/source-dependent views**. It offers working filters, configurable columns, search, sorting, pagination, source drill-down, previous-period comparison, CSV, report-specific print, saved views, and a tunable purchase planner over existing **in-browser ERP preview stores**. It is not production accounting. The seven unavailable entries are P&L, Balance Sheet, installment ageing, supplier delivery performance, seasonal comparison, bundle profitability, and reconciliation review (the last links to its existing workspace).

Magic Patterns adds **five Basic screens** (Overview, Sales & profit, Stock, Dues, Cash & expenses) and **five Premium screens** (Advisor, Profit insights, Smart buying, Cash forecast, Customers), plus a separate **Report library** tab embedding an older ReportsWorkbench. It introduces actionable narratives, priority/impact/confidence attributes, estimated missed profit, scenario-based cash forecasts, purchase budgets, slow-stock working capital, and customer retention/credit signals. Those features are valuable *design concepts*, not reliable production calculations yet. Magic Patterns fabricates deterministic **180-day historical transactions**, combines these with entries made in its demo store, and uses hardcoded profiles such as supplier lead times, purchase costs, customer repayment days, daily demand, recurring expenses and initial cash balances.

## 2. Feature-by-feature comparison

| Area | GitHub current `main` | Magic Patterns active artifact | Disposition |
| --- | --- | --- | --- |
| Coverage | 34 entries; 27 available, 7 source-readiness states | Ten primary screens plus older report-library prototype; its `ReportsWorkbench` declares 17 reports missing | **Keep GitHub catalog**; layer insights on top |
| Source integration | Projections of current browser sales/products/import, expenses, finance and available purchase/lot/movement/demo sources | Synthetic 180-day history plus demo transactions and hardcoded analytics profiles | **GitHub safer**; never mix fake history with business figures |
| Daily overview | Source-labeled KPIs, trend, attention panel and drill-down | Richer sales/profit/dues/stock KPIs, next steps | Adopt improved question-first narrative; preserve provenance |
| Filters | Date range, previous period, entity/status/account dimensions, column chooser, saved views, sort/page/search | Quick period presets for some tabs; individual tabs have local filters; legacy library has separate filter logic | Preserve GitHub toolbar and search/deep filters |
| Exports | Filtered CSV and localized report-specific print; popup-blocked recovery; full filtered rows beyond pagination | Per-screen CSV, and `window.print()` on the active screen; old library also exports demo records | Keep GitHub output engine; add premium exports through it |
| Drill-down | Report cell → supporting records → actual source-module link | Cross-tab links, insight action links, some phone links; mostly demo records | Keep GitHub source drill-down; give premium each claim an evidence trail |
| Buying | Editable lead/review/safety/pack/budget assumptions; suggested quantity, estimated costs and CSV | Budget-allocation ranking, supplier grouping, urgency, projected at-risk margin | Combine **only with proven demand, stock and historical costs** |
| Cash | Cash/Bank/MFS and finance movements; explicitly incomplete payment-history warnings | 30-day projected cash with late-payment and purchase scenarios | Premium opportunity; require dated payment/supplier/expense evidence and forecast ranges |
| Profit | Gross profit when costs are known; complete P&L and Balance Sheet are blocked | Estimated net profit, margin changes, profitability quadrants and loss/benefit projections | Treat as scenario/estimate; never imply reconciled profit |
| Customer intelligence | Customer sales, dues and collection priority | Inactivity cohorts, concentration, payment-lateness risk, recovery suggestions | Worth adopting once source history is sufficient |
| Plan separation | Reports source currently states Medium and Premium share reports; subscription enforcement not part of module | Basic/Medium vs Premium navigation and upgrade preview | Define actual tier entitlements; avoid local prop-only access gating |
| Localization | Existing English/Bilingual/Bangla UI contracts and helper patterns | Many hardcoded English labels with Bangla subtitles | Reuse `useUiCopy`/i18n from GitHub |
| Styling | Existing UI tokens, MotionTabList, shared Button/Input/Table/Dialog; 36px controls, Products typography | Teal underline tabs and some matching panels; also standalone prototype controls, inline selects and many literal white/light surfaces | Keep GitHub primitives and design tokens; reuse visual ideas only |
| Responsive/testing | Report tests/documented 48 axe scans across eight widths, two themes and three languages; verified browser journeys | Responsive classes present; no equivalent independently run screenshot/axe matrix in this audit | Retest any ported ideas across all sizes and languages |

## 3. Critical and high-priority risks

### Critical: simulated figures masquerading as business evidence

- Magic Patterns `utils/reports/history.ts` synthesizes 180 days of sales with a seeded pseudo-random generator. The source also manufactures realistic invoice, payment, supplier, purchase and product-history relationships and appends demo-store activity. `data/reportCatalog.ts` supplies fabricated customer habits, product velocity, historic supplier costs and cash/expense profiles. A detailed financial dashboard derived from this cannot be silently integrated with actual tenant records.
- Magic Patterns `pages/Reports.tsx` defaults to Premium Advisor for Premium users and uses copy such as “from your own business data”; while a tooltip mentions the sample history, this can still overstate provenance.
- `components/reports/basic/OverviewReport.tsx` displays **Net profit (estimate)** and `components/reports/premium/ProfitReport.tsx` displays modeled profitability, while complete accounting P&L is deliberately blocked in GitHub because of missing postings and reliable historical costs. Preserve this guard. Unknown cost must not become zero or be reconstructed using today's purchase price.

**Fix:** Design a single reporting source adapter and explicit data-basis labels: recorded / incomplete / scenario / unavailable. Gate calculations on required evidence and display coverage as well as an auditable trail. Do not use `HISTORY_DAYS` seeded demo data for actual ERP reports.

### High: misleading action completion

- Magic Patterns `components/reports/premium/BuyingReport.tsx` presents “Draft purchase orders prepared” via `toast.success(...)`, but the cited click handler does not create an order in the Purchases store or navigate to a saved draft.
- Magic Patterns `components/reports/PremiumLocked.tsx` presents “Upgrade request sent” via a toast without an actual billing/support integration.

**Fix:** Either implement an authenticated, permission-checked workflow that creates an actual draft/request or relabel it as a preview/simulation. Never show success before the backend or state transition actually confirms success.

### High: cross-tenant/user preference isolation

- Magic Patterns `components/reports/premium/AdvisorReport.tsx` persists handled/dismissed recommendations to a single key `hisabiq-reports-advisor-v1`, without tenant or user scope. This can mix UI state among tenants/accounts sharing a browser.
- GitHub `src/pages/Reports.tsx` scopes saved report views by `tenantId` and `actorId`. That is the preferred UI pattern, with real server-side ownership controls still required for production.

**Fix:** Scope recommendation IDs, status and preferences to tenant/user/source-version, and design secure server persistence for cross-device use when available.

### High: feature regression if replacing GitHub wholesale

- Magic Patterns active screen embeds `pages/ReportsWorkbench.tsx` as its library. That legacy workbench has a `missing` set listing 17 report names, while GitHub has 27 implemented views. The ten Basic/Premium overview screens do not provide identical granular report drill-downs or equivalent filters.
- Replacing the current GitHub module with the prototype would risk loss of detailed supplier purchase evidence, expiry/stock ageing and movements, warranty/data quality, extensive filters, saved column preferences, localized print and source detail paths.

**Fix:** Make GitHub's report definitions and result engine the single implementation, with Premium screens consuming derived, evidence-backed selectors; remove duplicate mock/legacy report engines.

### Medium: UX, design and accessibility inconsistencies

- Magic Patterns correctly creates Party Ledger-like **text tabs with a 2px teal underline**, but placing Premium's five tabs *before* five Basic tabs and a Report library produces an 11-tab top bar. It defaults Premium users into Advisor rather than the lightweight Overview. On phone this will require heavy horizontal scanning.
- Magic Patterns frequently uses `prototype/Ui` controls and raw select/input HTML rather than the repository's canonical `Button`, `Input`, `AppSelect`, `Table`, date picker, and `MotionTabList`; some views use literal white/light surfaces and `tabular-nums` while the GitHub report typography contract explicitly preserves the approved proportional numeric style.
- Many Magic Patterns screens use static English explanations plus Bangla secondary text; the GitHub repo handles English, bilingual and Bangla modes. Chart and tooltip behavior in Magic Patterns was source-reviewed, **not runtime tested** here.

**Fix:** Keep the seven GitHub report groups, search library and compact responsive picker. Place **Advisor** as an optional Premium subview/action within the Overview or as one coherent Premium insights entry, not five permanently competing first-level tabs. Make Overview the default for all tiers. Map screens to the existing shared components and 13px body / 12px heading / 11px helper/badge table scale; ordinary controls 36px. Preserve 48px only for the explicitly approved major transaction-completion actions, not reporting tools.

## 4. Valuable Magic Patterns capabilities to adopt

1. **Business Advisor:** A short priority-ordered queue answering “What happened? Why? What next? How does it help?” with evidence links, confidence/coverage, an optional impact range, and tenant-scoped snooze/dismiss/complete states. Avoid adding estimated impacts together if they overlap.
2. **Profit Opportunities:** Supplier price rises vs selling price, thin-margin fast movers, discount leakage and product/category profitability, but only when historical costs are known; otherwise show a data requirement, not profit.
3. **Budget-aware Smart Buying:** Combine GitHub's base-unit-safe reorder planner with pack rounding, genuine supplier lead-time data, item urgency, available cash/budget and “buy now / buy part / wait” choices. Send an approved selection to a **real editable Purchase draft**, not a toast-only action.
4. **Cash & Working-Capital Outlook:** Expected inflow/outflow by due date and account, cash safety buffer, late-collection scenarios, near-term purchase commitments, and uncertainty ranges. Do not conflate invoice date with payment date.
5. **Customer Health:** Repeat-order patterns, recent inactivity, exposure to few large customers, aging receivables and practical follow-up links; confidence should fall when phone/customer identity is incomplete or history short.
6. **Premium Upsell:** Show clear outcomes and one modest entitlement-aware CTA, but do not expose fabricated “extra profit” numbers or suggest an upgrade request was sent until recorded.

## 5. Recommended integration architecture

**Do not copy Magic Patterns source wholesale.** Keep:

- `src/pages/Reports.tsx` for route/layout and preference/URL behavior.
- `src/reports/catalog.ts`, `src/reports/model.ts`, `src/reports/useReportData.ts`, `src/reports/types.ts` for the unified source/readiness reporting contract.
- Existing `ReportToolbar`, `ReportOverview`, `ReportResults`, `ReportDetails` and shared UI primitives.

**Add as isolated, evidence-aware extensions:** a business-insight evaluator, a purchase-priority selector, a scenario forecaster, customer indicators and an Advisor view. Each insight should include `sourceRefs`, `basis`, `coverage`, `assumptions`, `risk/confidence`, `asOf`, `impactKind`, and explicit `actionAvailability`. Only create recommendations when preconditions are satisfied. Hide misleading hard numbers where evidence is missing. An offer/plan entitlement service should decide visibility server-side in production; design-state props alone are not authorization.

## 6. Priority delivery plan (no code approved by this audit)

| Priority | Work | Acceptance condition |
| --- | --- | --- |
| **P0** | Preserve GitHub report module unchanged as baseline; inventory 34 catalog IDs and current tests | No functional regression, no lost filters/exports or source links |
| **P0** | Remove simulated-history dependency from any Premium integration and define source/unknown-cost policy | Zero synthetic figures in tenant reporting; missing cost represented as unknown |
| **P0** | Replace misleading success toasts with real actions or honest previews; enforce tenant scope and entitlement boundaries | Correct UI state transitions; no cross-business saved-action bleed |
| **P1** | Build a small Premium Advisor using the existing Overview and Party Ledger styling | Top decisions answer four simple questions and link to actual records |
| **P1** | Merge budget-priority logic into the existing Purchase planner | Quantities/costs/source units reconcile; preview CSV and real draft handoff work |
| **P2** | Add supplier-cost opportunities and customer risk only when history meets quality thresholds | Explanation, data coverage, confidence and source audit visible |
| **P2** | Add a cash forecast as a clearly labeled **scenario**, not guaranteed cash | Payment dates, payables, recurring outflows and assumptions are traceable |
| **P3** | Apply tier UX, i18n and responsive regression across screens | Basic remains simple; Premium useful; English/Bilingual/Bangla, light/dark, phone/tablet/desktop verified |

## 7. Important limitations and verification work

This was a **read-only code comparison**. The GitHub code was checked at a particular `main` SHA and its repository-authored test records were read; no tests were rerun during this audit. The Magic Patterns active artifact and code were read; rendered screenshots, browser focus behavior, current deployment, live billing and backend were **not** tested. Thus visual judgments about likely crowding or dark-mode inconsistency are engineering findings to validate, not certified pixel defects.

GitHub's recorded report verification states 15 new model tests passed, source/report browser smoke passed, 48 axe scans had no findings, and the wider suite had **709 passed / 2 pre-existing failed** quotation tests. These are repository-documented results, not independently rerun claims. Both systems are UI-preview-oriented; backend-connected accounting requires a separate implementation and reconciliation phase.

## Primary source links

- [GitHub Reports page](https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/src/pages/Reports.tsx)
- [GitHub report catalog](https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/src/reports/catalog.ts)
- [GitHub data source adapter](https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/src/reports/useReportData.ts)
- [GitHub report model](https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/src/reports/model.ts)
- [GitHub report verification](https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/docs/ui/2026-10-24-report-workspace-verification.md)
- [GitHub report readability and typography](https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/docs/ui/2026-10-24-report-table-readability.md)
- [GitHub PR #200 (merged)](https://github.com/shuvodelux-commits/hisabiq_ui/pull/200)
- [Magic Patterns active design](https://www.magicpatterns.com/c/t6q3mxi6nhuak3qjvx8cwn)

**Final recommendation:** Adopt the *business decision-support ideas* from Magic Patterns, but preserve GitHub's report engine, data honesty, filters, source navigation, styling and responsiveness. A reliable report that refuses to guess is more valuable than a polished one showing invented profit.
