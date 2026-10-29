> Historical research/proposal — retained in full for evidence. Conflicting implementation, visual/navigation and approval instructions are superseded by the [canonical26 October Reports specification](../../../superpowers/specs/2026-10-26-hisabiq-reports-final-uiux-design.md). This is not the current implementation plan.

# HisabIQ Reports — UI-first design specification & quality assurance blueprint

**Status:** Proposed for user review, NOT an approved implementation plan, NOT implemented.  
**Date:** 26 October 2026 · **Project:** HisabIQ UI, Sher Software Solutions  
**Workflow:** Superpowers discovery/design gate + Impeccable shape/visual audit/finish reviews.  
**Scope:** Reports and directly connected Purchases, Purchase Order, Party Ledger, Products, Sales, Expenses and Finance UI workflows. Backend integration and unrelated ERP redesign are excluded.

## 1. Evidence and authority — verified today

- Magic Patterns editor: https://www.magicpatterns.com/c/t6q3mxi6nhuak3qjvx8cwn, connected account `agnishuvo@gmail.com`, active artifact **`b97ce3f5-9aa9-4882-9162-4e53d9be12f7`**, not generating at inspection time.
- The new artifact contains **HisabIQ complete UI design guide v2.1**, 32 sections, at `docs/ui/HISABIQ-DESIGN-GUIDE.md`; `docs/ui/AI-UI-PROMPT.md`, `docs/ui/design-system.json`, `data/designGuide.json`, a visual library, and `hisabiq-library/data/componentCatalog.json` with **11 specimen groups**. It has prototype-only library adapters; do not port those as production code.
- Source-of-truth repository: https://github.com/shuvodelux-commits/hisabiq_ui, connected `shuvodelux@gmail.com`. On **GitHub current default branch**, the three new files `docs/ui/HISABIQ-DESIGN-GUIDE.md`, `docs/ui/AI-UI-PROMPT.md`, and `docs/ui/design-system.json` returned **404**. `package.json` lacked `sync:design-guide` and `export:component-library` at inspection. This is **unsynchronized** even though the Magic Patterns guide describes a GitHub-first export workflow. Verify whether another branch carries it before creating the sync PR. Do not assume generated guide data and source match until checks pass.
- GitHub currently supplies `src/pages/Reports.tsx`, `src/reports/{catalog,model,types}.ts`, `src/components/reports/{ReportToolbar,ReportResults,ReportDetails,ReportOverview}.tsx`. Preserve the existing report library, selectors, saved views, multi-level source-evidence dialogs, drilldown/print and URL state. The report catalog contains 34 views (27 functioning in preview, seven explicit data readiness states) as documented in the repo's prior verification note; retest rather than treating the note as a fresh run.
- The current `src/pages/Purchases.tsx` tabs are purchases/return/return-history; **no Purchase Orders tab** is present there. `src/pages/PurchaseEditor.tsx` already uses `PurchaseCart`, `PurchasePaymentPanel`, shared source correction/review and preview-store handlers; reuse it for actual purchase entry.
- Magic Patterns Reports retains its Basic and Premium pages, including Advisor, Profit, Smart Buying, Cash Forecast, Customers, chart-rich Overview, Party-like `ReportsNav`. Its **Prepare purchase orders** button currently only displays a toast and its advisor `done/dismissed` storage is not tenant/user scoped. Both must be corrected in the full demo experience before claiming interactive completion.
- The v2.1 guide records provenance from a prior Magic Patterns artifact and GitHub SHA at guide-authoring time. Freeze and link the newly observed active artifact in the sync review; avoid silently claiming it was the prior baseline.

## 2. User job, success and exclusions

**Audience:** Busy, usually single-operator Bangladesh SMBs, including hardware/electrical, grocery, pharmacy/medicine, fabric and furniture; often working on limited-width screens and with Bangla help.

**Outcome:** In seconds, an owner sees the condition of the business and one meaningful next step. In a short task chain, the owner can inspect the exact evidence, adjust a simulated decision, take the business action, and return to the same Reports context. Expert users retain source-specific filters, tables, print, saved views and working record details.

**Non-goals for this phase:** Live accounting, ledger correctness against a production database, supplier communication, billing, SMS sending, backend permissions, external purchases or claiming ROI occurred. Coherent seeded demo data, modeled ROI and demo state transitions are in scope and must be visibly labeled **Demo / illustrative**. Prototype actions update the demo state; an informational toast alone is not successful completion.

**Anti-goals:** Replacing working report details with new decorative overlays; copied parallel Input/Button/Select/Table primitives; a second purchase cart; generic invented UI components; 11 tabs converted to pill-buttons; fake chart drilldowns; hard-coded single-language labels; empty clicks; screenshot-only validation; cascading modal layers; over-decorative motion.

## 3. Approaches and recommended direction

| Approach | Benefits | Risks | Decision |
|---|---|---|---|
| A. Replace GitHub Reports with Magic Patterns prototype code | Fast visual parity | Loses existing record source tree and verified controls; duplicates engines and styles | **Reject** |
| B. Render GitHub Reports and Magic Patterns Premium pages separately | Low immediate integration | Two filter/date/mapping systems and cognitive overload | **Reject** |
| C. **Magic Patterns-first presentation on existing GitHub Reports/ERP component and record architecture** | Best visual fidelity + functional continuity + shared guide | Requires deliberate component mapping and demo action adapters | **Recommend for approval** |

The explicit user-selected visual reference is Magic Patterns Reports; the GitHub source and component contracts remain implementation authority for operational behavior.

## 4. Design-system handoff and drift prevention (must happen before screen implementation)

1. Make a dedicated **guide sync PR** that copies the authored v2.1 Markdown into GitHub, reconciles with the GitHub `AGENTS.md` and recent binding contracts, adds actual generation/check scripts if reviewed, and generates the JSON and Visual Library specimen metadata from **one canonical source**. Generated JSON must never become a second authored rulebook.
2. Add a locked/checkable version/hash of guide plus a mapping from each of the 11 specimens to real shared source components, their actual states, test links, and known gaps. Clearly distinguish `existing`, `prepared` and `gap` statuses.
3. Export only required source-faithful specimen code back to Magic Patterns; do not import its theme wrappers, mock SDK adapters, scaffolding, router or separate Tailwind globals into GitHub production UI.
4. Update the Magic Patterns AI prompt, report workbench reference and GitHub `AGENTS.md` so all agents read the same guide version in the correct order. Display guide version in the visual library.
5. Create a `design-component-map.md` for Reports: each displayed control ↔ GitHub shared component ↔ Magic Patterns specimen ↔ test. No page-local lookalikes without a signed-off GAP.
6. Confirm brand palette/theme source, 36px normal controls, 48px explicitly terminal transaction actions, 13/12/11 table typography, Geist/Hind Siliguri and proportional digits; Party Ledger text tabs with 2px motion underline. Existing tokens, not literal screenshot hexes, control dark and light.

**Gate 0:** `node scripts/sync-design-guide.cjs --check` must exist and pass *after* the sync PR introduces it; `npm run check:ui-contract`, build and specimen smoke must pass. Before that PR lands, do not tell AI agents that sync commands already work on current main.

## 5. Information architecture — retain approved Magic Patterns appearance

**Layout order:** existing AppShell/PageHeader → Magic Patterns-style report header and plan/status → Party Ledger-style scrolling text tabs → date-range/filter strip → top-priority actionable KPIs + charts → focused panels and data tables → contextual record details and operations.

**View preservation:** Magic Patterns Basic screens (Overview, Sales & profit, Stock, Dues, Cash & expenses), Premium screens (Advisor, Profit insights, Smart buying, Cash forecast, Customers), plus `Report library`. Keep its layout, chart types, visual density, brand color treatment and respectful motion. **Tab-count decision remains open:** do not silently replace its current 11 destinations with a new 6-tab IA; test horizontal tab discoverability on phones with realistic bilingual text. Propose a grouped variant only if a comparative usability test clearly improves task discovery without burying Premium features, then secure approval.

**Progressive disclosure:** Basic summary shows business situation; Advisor shows top 3 actionable insights; advanced parameters and detailed report catalogue remain reachable but not dominating. Keep Magic Patterns' information-rich panels with readable 13/12/11 tables, not tiny compressed numerical strings. One primary next action per region; secondary actions under contextual More when appropriate.

**Use existing GitHub Record Details as common insight-evidence surface:** customer, supplier, product, invoice, purchase, expense, stock record, price-change data point, chart segment and Advisor insight open context-specific source details using `src/components/reports/ReportDetails.tsx` as reusable backbone. Retain the screenshot-approved multi-column labelled facts, status, bilingual helper, contributing records table, print and Open source module. Extend for appropriate record facts or nested contributing rows; avoid making every field always visible. Modal close/Back preserves report tab, filters, date, row selection, scroll and chart. Source details are read-only; editing/navigation opens the canonical domain workspace with safe return context.

## 6. Cross-module UX and demo state

**Shared story:** same product/supplier/customer IDs, units, prices, dates, accounting previews and source references must flow across every screen. Start with a coherent seeded *demo store* instead of individual screenshot-only arrays. When a demo purchase is completed, stock, purchase history, supplier payable and Advisor insights update together; report filters remain intact. Demo store is tenant-scoped and seeded deterministically to make screenshots reproducible. If persistence is provided, explicitly test reload; if not, label the session boundary.

### 6A. Purchase plan → PO → actual purchase → follow-through (flagship journey)

**Entry points:** Stock & Buying row, Smart Buying row/insight, Advisor card or Product detail. In all cases preserve source product, supplier when known, unit, evidence, filters and user-modified assumptions.

1. **Smart Buying/Planner**: compact Product-table-based editable list with stock, selling speed, lead days, incoming/open PO qty, selected purchase unit, conversion, pack, stock target, suggested qty, editable buy qty, supplier, editable expected unit cost, estimated total and reason. Relevant warning badge; optional advanced assumptions (lead/review/safety/budget). Multi-unit display like `3 pipe 10 feet` while calculations use exact recorded base conversions. Cart remains familiar and editable, not a second custom cart. Support select all, manual add, skip, budget recalculation, supplier changes.
2. **Save Plan**: a plan is a simulation/draft; does not post inventory, cash or payable. Save, reopen, duplicate, rename, revise, archive and compare to later PO from a demo plan list. Stable `planId`, `planLineId` and originating `insightId`/record refs.
3. **Create Purchase Orders**: supplier-grouped order proposals; each supplier produces its own editable PO draft. Show estimated total, line selected units, supplier price, expected delivery, note and linked source plan. Cannot merge suppliers into one PO unless user explicitly reassigns. Reuse Purchases workspace and Party tabs to add a `Purchase orders` section and order detail; do not add an independent sidebar feature or copy POS cart controls. PO states: Draft → Placed (demo) → Partially received → Received/Closed; Cancelled from allowed states. Only actual purchase updates stock/paid/payable. PO document/print shows **sample purchase order**, not a verified sent supplier message.
4. **Receive goods / Create Purchase**: from PO, prefill the existing `PurchaseEditor` with chosen unreceived lines and supplier, linked PO reference. User can change received qty, purchase unit, cost, lot selling price, batch, expiry, serials, notes, attachment, split payment, discount and dates. Show `ordered | previously received | receiving now | remaining` and cost variance. Partial receipt creates one linked purchase; repeat until complete. Do not overwrite the source PO terms when actual cost differs.
5. **Review and Complete Purchase (demo)**: use actual Purchase cart/payment/review dialog; simulate transaction in shared demo store, update stock lots/receipts, supplier payable/payment and PO fulfilment. Never count the same PO line twice; check incoming quantities against fulfilled state and disable invalid over-receipts unless an explicit revision. Store `poId`, `poLineId`, `purchaseId`, `receiptId`, `baseQty`, `sourceUnit`, `conversionSnapshot`, amount and payment refs.
6. **Edit/Adjust actual Purchase**: after posting a simulated purchase, take the current source correction flow; show original vs revised lot, qty, unit cost, discount, payment and stock/payable impact; require reason/confirmation where appropriate. Keep edit of PO promises distinct from correction of a completed purchase. Preserve linkage and add a demo audit entry; do not silently mutate old PO lines.
7. **Return to Reports**: same tab/filter/scroll; Planner shows less incoming, new received stock, revised recommendations; product details show linked PO and purchase; supplier view/ledger show purchase and payable. Insight moves to fulfilled/updated only after the event, not after clicking a button. Display this as a **demo simulation**.

**Negative scenarios:** no selected lines, no supplier, invalid conversion, zero/negative qty, missing cost, insufficient demo budget, empty inventory, multiple suppliers, partial receipt, PO cancellation, stale planner proposal, expiry/serial constraints, duplicate Complete click, lost draft, direct deep link after refresh, dark mode and mobile keyboard.

### 6B. Other insight-to-action flows

| Trigger in Magic Patterns view | Details modal content | Next step via existing workflow | Required demo outcome |
|---|---|---|---|
| Customer outstanding / Advisor | Invoice, dates, payments, notes, source children | Party Ledger → Receive money / draft reminder | Customer due and related report refresh; no claim SMS was sent |
| Supplier balance / Cash | Source purchases, split accounts, ageing | Party Ledger supplier → Pay vendor | Supplier payable and cash source preview update |
| Profit leak / margin quadrant | Sale-time cost, discount, return, relevant invoices | Product pricing review / sales source | Changed product pricing preview; historical transactions not rewritten |
| Slow/expiring stock | Lots, ageing, sales rate, inventory movement | Product / Offer draft review | Draft offer and decision tracked; no real customer offer sent |
| Expense spike | Expense source, payee, category, account split and comparison | Expense module view / eligible edit | Demo correction updates affected report, not cash and expense double-counting |
| Cash buffer risk | Confirmed inflow/outflow and clearly sample projected entries | Cash scenario, planned purchases/collections | Scenario changes projections only; no actual finance ledger posting |
| Customer inactivity | Prior orders and elapsed interval | Customer Ledger / planned outreach | Follow-up draft and insight state, no fake communication success |

## 7. Shared visual quality contract (Impeccable Operate mode)

- **Visual world:** Magic Patterns' brand-consistent Reports hierarchy, dense but breathable KPI cards, chart panels, Premium Advisor Ink summary, restrained Teal/Mint accent, quiet semantic success/warning/danger. Real theme tokens win over screenshot literal values; dark theme uses correct card, tooltip and chart foreground contrast.
- **Charts:** Reuse the Magic Patterns plot types (area for sales/profit trend, scatter for profitability quadrant, composed chart for forecast, comparison bars where semantically valid). Axes, period, units and legend are legible; chart selections open GitHub-style contributing record lists. Hover tooltips alone are insufficient; keyboard/touch accessible table/detail alternative. Chart animation reports state, does not stage fake loading or count-up monetary values.
- **Motion:** Use Framer Motion and v2.1 tokens (nav hover 110ms, nav indicator 190ms, number stepper 120ms, sidebar 220ms, tab underline 200ms, dialog entry 220ms and veil 180ms). Implement reduced-motion alternatives; no modal width shifts, no page scroll jump when overlay opens/closes; do not animate expensive chart work on every filter keystroke.
- **Typography:** Geist/Hind Siliguri; page title about 20/28, panel heading 14/20, body 14/20, table 13px cell / 12px heading / 11px helper. Right-align monetary/quantity columns, preserve proportional digits (no `font-mono` / `tabular-nums` in tables per v2.1), wrap long Bangla and use readable helpers rather than tiny blanket fonts.
- **Controls and geometry:** shared Button/Input/AppSelect/SearchSelect/Table/Popup/Date/Quick Add components. 36px normal controls, 48px only final Purchase completion/review actions. Background, card, border, input, ring and semantic palette from tokens. Do not invent page-local toggles or secondary design systems. Panel/card radius 12px, fields ~8px, modal 12px from the shared primitive. Contextual full editor rather than a giant nested modal.
- **Usability:** relevant information first, one prominent next action, names always keyboard-clickable, no hover-exclusive workflow, active filter chips/clear, no false success, no silent lost drafts, not over 3 priority cards above the fold in compact layout.

## 8. Exact review and verification gates

### Gate 0 — Version and component authority (blocking)

**Procedure:** compare Magic Patterns v2.1 authored Markdown + version/hash with GitHub canonical source; reconcile `AGENTS.md`/token contracts; introduce `scripts/sync-design-guide.cjs` only as actually implemented; check `node scripts/sync-design-guide.cjs --check` after adding it. Prove the 11 catalog groups render with real component states, and future `prepared` patterns are not misclassified as installed. Screenshot library in light and dark.

**Pass:** Same guide version/hash and known source component map in both environments; no uncontrolled prototype SDK code in GitHub; chosen GitHub controls render as documented. **Fail:** mismatched guide versions, orphaned icons or missing scripts claimed as present.

### Gate 1 — Visual approval against reference (blocking)

Capture stable target references from Magic Patterns and GitHub in the same states. Compare composition, density, field sizes, emphasis, whitespace, chart palette, tab underline, modal and toolbar. Capture at 1440×900 desktop, 1024×768 landscape tablet, 768×1024 portrait tablet, 390×844 and 360×800 phone. Use approved browser/device tool and one batched Impeccable critique with desktop and mobile. Ensure scrolling is inside tables, not the entire body. Allow reflow rather than enforcing pixel-perfect equality.

**Pass:** Same component family and visually coherent Reports on every size; 36px standard/48px terminal heights; 13/12/11 table data; no clipped Bangla, chart labels, callouts, overlays or buttons. **Fail:** wrong shared button or form look, report navigation pill controls, modal shifting page, broken dark theme.

### Gate 2 — Component states and interaction integrity (blocking)

Use a per-action checklist and browser automation to visit default/hover/focus/active/selected/disabled/loading/empty/error states as applicable for every changed shared component. Dropdowns must keyboard navigate, flip away from edges, close Escape inside Dialog, and return focus after close. Tabs support Arrow/Home/End, proper ARIA tabs/panels. Clear filters and dates must update visible numbers and selected records. Save Views must reload correctly. Print must create an actual printable document; CSV must include the visible expected records and units.

**Pass:** Every visible control has an observable outcome, correctly disabled reason or a clearly labelled demo operation. **Fail:** false toast, nested focus trap, changing labels without changing data, inert CTA.

### Gate 3 — GitHub Report Details preservation (blocking)

Automate representative clicks from **all Basic tabs, every Premium tab, Advisor card, charts/table rows and All Reports**. Include customer/supplier/product/sales invoice/purchase/expense/finance/stock examples. Assert correct contextual facts, contributing children where present, nested child→Back, print, Open source module, bilingual helper/status, modal close→focus return, unchanged filter/date/scroll after return. Assert record detail does not mutate financial/stock data.

**Pass:** The screenshot-approved GitHub source detail experience survives the Magic Patterns redesign and extends consistently. **Fail:** only generic Magic Patterns card modal remains, source children missing, lost report filters, dead links.

### Gate 4 — Stateful cross-module transaction demo (blocking)

Run seeded test story: PVC pipe stock=120 feet, demand=20 feet/day, lead=8 days, review=1 day, safety=2 days, pack=20 feet → target 220 feet, suggested 100 feet (5 packs) before incoming/other adjustments. Plan 100 feet across a supplier; save; create PO; confirm **no stock/payable movement on PO**. Receive 40 feet with actual unit cost changed, complete demo Purchase → stock +40 feet (subject to other fixture movements), PO remaining 60; create second Purchase for remaining 60 → PO received, stock accounted once. Verify linked PO/purchases in Product, Supplier Ledger, Reports and Advisor. Change/revise purchase in eligible source correction UI and assert audit/variance and no duplicated receipt. Also test orders split into two suppliers and cancellation.

**Pass:** Correct cross-screen state transitions and stable refs; no posterity implied without demo record. **Fail:** purchase order counted as stock, duplicate receipts, math inconsistent, editing PO mutates posted purchase, auto-closing recommendation too early.

### Gate 5 — Accessibility, language, theme, motion and performance (blocking)

Test full English, bilingual helper, full Bangla across light/dark; tab/order/Enter/Escape, focus and active states, screen-reader labels, chart keyboard alternative, `prefers-reduced-motion`, touch on 360px phone, 200% zoom and 320 CSS px normal reflow. Verify contrast 4.5:1 for ordinary text and 3:1 for large text and essential non-text UI; track exception evidence. Test chart-render performance with 100+, 1000+ and empty rows; infinite values/NaN not shown. Check sticky payment panels, select portals and accessible dialog. Use Impeccable's 5 audit dimensions: accessibility, performance, theme, responsive, implementation integrity, each 0–4; classify P0/P1/P2/P3.

**Pass:** No P0/P1 defects, no critical axe violations, no console errors, no lost task at small screens, no unbounded motion. **Fail:** hover-only details, clipped amount values, inaccessible interaction, offscreen floating picker or foreground/theme contrast break.

### Gate 6 — Automated project checks and independent signoff

**Existing commands confirmed in GitHub `package.json` as of inspection:**

```bash
npm run build                              # Vite production build
npm run lint                               # ESLint; identify new vs known warnings
npm test                                   # Repository unit suite; report known baseline failures
npm run check:ui-contract                  # Shared component/control guard
npm run test:field-size-parity             # 36px normal / 48px terminal parity
npm run test:table-typography              # Products-standard 13/12/11 and responsive roles
npm run test:motion-navigation             # Framer Motion and tabs/navigation
npm run test:report-workspace              # Reports library + workflow
npm run test:reports-print                 # Reports print/CSV recovery
npm run test:report-guidance               # Help/accessibility
npm run test:reports-a11y-matrix           # Report language/device accessibility
npm run test:purchases                     # Existing purchase workflows
npm run test:parties                       # Party workspace and ledgers
npm run test:party-ledger                   # Ledger behavior
npm run test:theme                          # Light/dark theme
npm run test:erp-navigation                 # AppShell and route controls
```

**Not in current GitHub main yet; introduce under Gate 0 if accepted:**

```bash
node scripts/sync-design-guide.cjs --check
npm run export:component-library
```

**New tests to add with the UI slices:** a report row/modal reference matrix, interactive chart selection, shared-demo-store source consistency, planner computation and unit/pack conversions, PO supplier split, PO→partial receipts→purchase correction→report update, URL/back/refresh contextual state and mock/production boundary.

Do not call an entire `npm test` run green if baseline issues persist. Record each command's actual result, browser sizes and capture names, screenshot diffs, introduction/regression of warnings, and explicit skipped checks. Independent Superpowers code review verifies task boundaries and safe integrations after Impeccable visual/accessibility review. **Merge only after user acceptance** of the visual design and flagship cross-module demo.

## 9. Delivery order — PR-sized UI slices after design approval

| Slice | UI deliverable | Demo behavior | Proof required |
|---|---|---|---|
| 0 | v2.1 guide/visual specimens sync | Real component specimens; generated guide data checked | Guide hash and version; no component forks |
| 1 | Magic Patterns Reports frame + chart system | Date selection, KPI/chart interaction, restored state | Visual reference + chart/table alternatives |
| 2 | Common ReportDetails integration | All record types open source evidence and drill down | Modal regression matrix including nested children |
| 3 | Advisor/Profit/Customers/Cash views | Coherent simulated ROI, scenario inputs, insight reasoning | Cross-filter math, saved insight states tenant/user scoped |
| 4 | Smart Buying and Saved Plans | Editable suggested qty/cost/supplier/unit, budgets, saved plan | Planner tests incl conversion, pack rounding, budget, no side effects |
| 5 | Purchase Orders in Purchases | Draft/place/cancel/partial/received, print PO | PO status/line linkage and source breadcrumb tests |
| 6 | PO → Purchase Editor → receipts/adjust | Real UI preview mutations, partial receipt, source correction | End-to-end seeded demo, no duplicate stock or payable |
| 7 | Other insight-to-action bridges | Party collections, expenses, price reviews, cash scenarios | Each action changes appropriate demo source and report |
| 8 | QA hardening, docs and final user signoff | Fully responsive, bilingual, light/dark, reduced-motion | All relevant gates + one final independent UX signoff |

Every slice must preserve unrelated ERP behavior, include tests for its own interactions, and report changed files. Use feature branches/PRs, not a massive main-branch rewrite.

## 10. Superpowers approval status / open product decision

**Recommended direction:** Approach C is the strongest fit with the user's expressed choices: Magic Patterns Reports visual style + HisabIQ v2.1 design library + original GitHub ReportDetails + canonical purchase and ledger workflows + coherent demo data.

**Needs explicit final approval before a code implementation plan or commits:**
- Confirm Approach C as design authority.
- Decide whether **Magic Patterns' current 11-tab row remains exact** through the UI prototype, or whether to run an A/B usability review before approving grouped Premium tabs. Default **preserve 11** for this visual-first phase until evidence/decision changes it.

After approval, produce repo design spec at `docs/superpowers/specs/2026-10-26-hisabiq-reports-ui-ux-design.md` and implementation tasks at `docs/superpowers/plans/2026-10-26-hisabiq-reports-ui-implementation.md` following Superpowers TDD/checkable-step format. Verify Guide Gate 0 before other PRs. No production backend writes are authorized by this document.
