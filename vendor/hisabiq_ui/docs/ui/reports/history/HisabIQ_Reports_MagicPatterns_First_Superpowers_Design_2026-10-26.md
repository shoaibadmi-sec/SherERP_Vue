> Historical research/proposal — retained in full for evidence. Conflicting implementation, visual/navigation and approval instructions are superseded by the [canonical26 October Reports specification](../../../superpowers/specs/2026-10-26-hisabiq-reports-final-uiux-design.md). This is not the current implementation plan.

# HisabIQ Reports — Magic Patterns–First Final UI/UX Design Proposal

**Date:** 26 October 2026  
**Status:** Updated Superpowers + Impeccable design brief, **for explicit approval** (not an implemented UI or signed-off coding plan).  
**Phase:** Interactive UI/UX demo only, with coherent mock data, simulated ROI and simulated workflow state. No backend changes.  
**Visual reference:** [Active HisabIQ Reports in Magic Patterns](https://www.magicpatterns.com/c/t6q3mxi6nhuak3qjvx8cwn), artifact `6d7e6f96-3b50-43fb-adb2-d0be21b393b7`, inspected 26 October 2026.  
**Source:** GitHub `shuvodelux-commits/hisabiq_ui`, especially `AGENTS.md`, current Brand Guide, Reports, Party Ledger, Products, Dashboard, Purchases, PurchaseEditor, and UI contracts.  
**Preceding workflow proposal:** `HisabIQ_Reports_Final_UIUX_Superpowers_Design_2026-10-26.md`; this document **supersedes its visual hierarchy, component authority, chart, animation and report-navigation recommendations** while preserving compatible business workflows.

## 1. Definitive direction and precedence

The user's preference is unequivocal: **Magic Patterns is the reference for the Reports module's visual experience**. Do not substitute the incumbent GitHub Reports layout as the design target. Match the Magic Patterns' report composition, information density, chart vocabulary, premium advisor atmosphere, compact data panels, rich comparisons and explanatory helpers. Preserve its recognizable visual hierarchy when integrating with HisabIQ; never rebuild a generic admin dashboard.

Precedence by concern, to resolve design conflicts:

1. **Reports visual appearance, composition and analytical presentation:** active Magic Patterns `pages/Reports.tsx`, `basic/*`, `premium/*`, `ReportBits`, `ReportsNav`; preserve the visual intent and recognizable arrangement.
2. **ERP-wide brand and reusable control semantics:** GitHub `AGENTS.md`, HisabIQ Brand Guide, shared CSS/tokens, shadcn-style components; if Magic Patterns uses an inconsistent local primitive or hardcoded color, **the GitHub control and token wins**, while matching the original appearance as closely as allowed.
3. **Tabs, information table, cart, date, popover and actions:** Party Ledger underline tabs; Products table typography/density; POS/Purchases canonical editable cart and payment forms; Dashboard metric conventions only as consistency constraints rather than a Reports layout template.
4. **Functionality:** preserve GitHub Reports report catalog, source drilldowns, filters, printing, CSV, saved views and preview model; adopt Magic Patterns' decision views and charts; wire real *demo-state* interactions across modules.
5. **Motion:** keep Magic Patterns' sense of polish, implemented via existing Framer Motion / `MotionTabList` & `MotionTabIndicator` and performant Recharts behavior; respect motion reduction and avoid decorative overload.

**Explicitly superseded recommendations:** "GitHub Reports layout is the visual base"; "restrict first-page reports to only four KPI cards regardless of Magic Patterns layout"; "remove Magic Patterns' premium-specific screen layouts". Avoid design simplification by deleting useful information. The goal is **information-rich, visually compact, legible**.

### Verified prototype pieces to retain visually

- `pages/Reports.tsx`: common header, status, date/period line, `ReportsNav` and reports views.
- `components/reports/ReportsNav.tsx`: **13px text tabs, 2px teal underline**, accessible Arrow/Home/End keyboard support, premium marker, discreet group separator.
- `components/reports/ReportBits.tsx`: bordered KPI tiles, hover feedback, concise Bangla sublabels, deltas, evidence/help, right-aligned dense analytical tables.
- `components/reports/basic/OverviewReport.tsx`: 8 selectable metrics organized in a compact two-row desktop grid; 250px two-series area chart; attention panel; compact product/expense evidence.
- `components/reports/premium/AdvisorReport.tsx`: **Ink-dark executive health card with Mint results**, adjacent health check tiles, top recommendations, compact 4-part answer breakdown. The dark card is a purposeful *single focal element*, not a mandate to darken every panel.
- `components/reports/premium/ProfitReport.tsx`: income-to-profit bridge, 230px revenue/margin **scatter plot** with quadrants and a detailed products table.
- `components/reports/premium/BuyingReport.tsx`: budget/remaining summary, supplier-separated procurement totals, dense replenishment table, reasons, slow-moving stock subsection.
- `components/reports/premium/CashflowReport.tsx`: 260px **ComposedChart** with cash balance area and incoming/outgoing bars, buffer, late-payment, and purchasing scenario controls; weekly supporting table.
- `components/reports/premium/CustomersReport.tsx`: at-risk sales, credit risk, customer purchase cadence and appropriate next actions.

**Do not transplant** Magic Patterns' prototype `Button`, `Tabs`, raw browser selects, CSS theme, demo store, `useScreenInit`, stubbed toast-only "purchase orders prepared" operation, localStorage state keyed across all tenants, or fake backend actions. Reproduce their visible interaction intent using the repository components and an explicit demo-data layer. No new dependency required for Recharts, Lucide or Framer Motion if already present in repo.

## 2. Superpowers approach comparison

**A. Literal prototype transplant:** quickest initial visual resemblance, but breaks shared control, router and data contracts and may regress POS/Purchases. Rejected.

**B. Existing GitHub layout, with selected Premium cards borrowed:** minimum coding churn but visibly *does not follow the requested Magic Patterns design*. Rejected.

**C. Magic Patterns-first visual adaptation on GitHub code foundations:** deliberately reproduce every Magic Patterns Reports screen type, chart, spacing rhythm and interaction hierarchy with reused HisabIQ components; connect to current report engine and demo workflows. **Recommended**. This is the design direction requested by the user; code work still awaits formal sign-off.

## 3. Reports information architecture and navigation

**Keep all eleven Magic Patterns destinations:** Basic = Overview / Sales & Profit / Stock / Dues / Cash & Expenses; Premium = Advisor / Profit Insights / Smart Buying / Cash Forecast / Customers; plus Report Library (eleven total). **Do not remove any content or chart.**

For a novice-friendly, compact navigation scheme, propose a progressive two-level presentation **without changing the appearance of `ReportsNav`**:

- **Primary underline row:** `Overview | Sales & Profit | Stock | Dues | Cash & Expenses | Advisor ✦ | All Reports`. This is seven familiar choices, visually matching Magic Patterns' tab rail.
- **When Advisor is open, a second compact text-underlined row appears:** `Advice | Profit Insights | Smart Buying | Cash Forecast | Customers`. This exposes all five Premium Magic Patterns views only when relevant. Keep it anchored below page header, not a pill/segmented control and not a new sidebar.
- **Contextual access:** Stock opens `Smart Buying` from a clear advanced insight link; Money opens `Cash Forecast`; Sales opens `Profit Insights`; Dues opens Customers. The advisor subview can be selected by URL/return context directly, so no unnecessary extra navigational hop.
- **Basic users:** Basic views remain functional; Premium view previews and upgrade affordances may be simulated and clearly labeled. Plan tiers are not yet backend-enforced.
- **Default on first visit:** `Overview` for all; optionally resume the user's last chosen screen, *not* automatic Advisor for Premium. This adjusts Magic Patterns' Premium-first default for the user's KISS principle. Revisit only if user prefers exact 11-item rail.
- **All Reports:** preserve the existing 34-item GitHub report catalog, filters, saved views, print and CSV; mount it as a compact detailed workspace following Magic Patterns' visual framing, not a separate decorative dashboard.

**Open design approval trade-off:** A literal, single scrollable eleven-tab rail would match Magic Patterns exactly but can overwhelm small screens. The proposed two-level rail preserves all visual patterns and screens with fewer choices at once. User should approve this information-architecture adaptation before implementation; visual styling is otherwise fixed.

### Page trees

**Overview (Magic Patterns composition):**
`PageHeader → underline tabs → period/compare strip → eight KPI tiles (desktop 4×2; phone 2 across, visible with efficient scrolling) → 250px dual-area Sales/Profit chart + Needs Attention side panel → dense Top Products + Expenses/dues panels → source links`.

**Advisor (Magic Patterns composition):**
`Premium mini-tab rail → dark Ink/Mint lead insight → 4 business-health tiles → compact filter/priorities/count → 3 prominent expandable recommendation rows → Sources/Calculation sub-tabs for selected insight → real demo action → re-evaluated result → View remaining insights`. Keep the four explanation points: What happened / Why / What to do / Expected benefit (sample ROI supported).

**Profit Insights:** `margin bridge + product revenue/margin scatter chart → top opportunities → details table with historical/source/assumption notes → Product or Sales action`.

**Smart Buying:** `budget KPIs + buying table + slow-stock analysis → Edit Purchase Plan → Supplier-grouped PO drafts → PO detail → Receive Actual Purchase`.

**Cash Forecast:** `cash metrics + balance/positive-negative bar chart + transparent scenario controls → 7/30/90-day comparison → week table → Finance and Purchasing context`.

**Customers:** `risk KPIs + customers list + payment behavior → selected Party Ledger → Receive money or contact preview → updated demo dues`.

**Report Library:** `search/pinned reports → grouped navigation → filters/date/sort/visible columns → data table → source detail → export/print`. Retain GitHub's existing calculations and source identity; don't inject duplicate Magic Patterns report workbench models.

### Responsive adaptation

- **Desktop (~1440):** Honor Magic Patterns' airy outer margins, `max-width ~1440`, information-dense panels and charts, 4-column KPI grid, 2-column feature panels; avoid excessive whitespace inside cards.
- **Tablet (~768):** 2-column KPI tiles, chart 1-column or 2-column if legible, concise labels, chosen premium submenu; Products-like horizontally scrollable tables, preserving purchase cart tablet rules.
- **Phone (~390):** 2-column concise KPI tiles, chart with legible labels/tooltips, most important insight first, no hover-only controls; reveal evidence as inline accordion or accessible sheet. Tabs scroll with active item visible, not 11 tiny tabs. Tables default to priority columns with details on row tap/More; do not use global `min-height:44px` in compact rows.

## 4. Charts — a precise visual and interaction contract

| Screen | Chart type from Magic Patterns | Preferred dimensions/appearance | User action |
|---|---|---|---|
| Overview | Dual-series monotone area | ~250px height; Teal sales, semantic success profit, subtle fill, low-contrast grid | Hover/tap timestamp tooltip; select period; open filtered source sales |
| Profit Insights | Revenue–margin scatter + average reference line | ~230px, compact axes, meaningful quadrant colors; grouped evidence below | Tooltip product/revenue/margin; select point → product evidence/action |
| Cash Forecast | Composed area/positive-negative bars | ~260px; cash balance area, money-in vs money-out bars, buffer threshold | Change payment delay, buffer, purchases; recompute demo chart and weekly rows |
| Stock / Smart Buying | Dense horizontal trends / demand bars only where helpful | Small in-panel chart or progress bars; main product-buying table remains primary | Select product, stock period, supplier and plan row |
| Customers | Compact relative bars/table trend | Prefer information-dense table by default; customer status cannot be conveyed with color alone | Select customer → Party Ledger |

- Reuse project's **Recharts** charts and existing shared tooltip, axis, value formatter and responsive helpers. No chart library rewrite.
- Theme colors via semantic CSS vars (`--chart-*`, Ink/Teal/Mint, `--success`, `--warning`, `--danger`), not hard-coded palette in each component. Avoid gratuitous gradients, neon accents, 3D/glass cards or oversized illustrated graphics.
- On theme switch, axis labels/grid/tooltip backgrounds must adapt; do not keep prototype hardcoded white tooltips in dark mode.
- Limit to one dominant chart per analysis panel; chart and table communicate the same data. Avoid using pie charts for huge supplier/product enumerations or charts with no decisions attached.
- Missing/empty/partial sample data shows believable empty/stale states; source record links are demo records. The sample ROI can be calculated and animated, but always clearly marked **Demo**.
- Tooltips keyboard/touch accessible via nearby linked series summary and table; accessible descriptions and non-color labels required.

## 5. Motion and microinteraction contract (Impeccable Operate mode)

**Visual reference:** Magic Patterns' subtle chart/hover/active-tab feel, not a cinematic dashboard. Reuse `MotionTabList` / `MotionTabIndicator` + Framer Motion where available.

| Interaction | Motion | Duration target | Constraint |
|---|---|---|---|
| Underline tab change | Shared sliding teal active indicator | 160–220ms | No tab-size/scroll jump |
| Reports section change | Very small opacity/vertical enter, no full-page sweep | 140–200ms | Content ready to use immediately |
| Cards / table rows | Token-matched border/color transition | 120–180ms | No scale bounce on dense rows |
| Insight details / Sources / Calculation | Inline height expansion with subtle opacity | 180–240ms | Preserve scroll anchor, no modal layout shift |
| Chart period/data change | Recharts brief data transition | ~180–260ms | Stable axis/domain when possible, no distracting replay on each hover |
| Planner/PO row add/remove | AnimatePresence with calm insertion/removal | 150–220ms | Quantity/total recalculation immediate, no delayed focus |
| Confirmation/dialog | Existing shared overlay motion | Use repository timing | Lock scrollbar width to avoid page shift; focus/escape correct |
| Demo state saved/success | Quiet toast + visibly changed linked record | No blocking animation | Toast is **secondary**, not the action |

- Honor `prefers-reduced-motion`: no sliding/choreographed chart entrances; immediate stable state remains understandable.
- Do not add confetti, looping card pulses, constantly count-up metrics, autoplay demos or scroll-jacking.
- Avoid animating the entire large table when a filter changes; update rows in place with loading/empty feedback.

## 6. Brand Guide / UI consistency acceptance standard

- **Font:** Geist Latin + Hind Siliguri Bangla. Business terminology uses simple optional Bangla helpers. Entire app must work in Full English / Full Bangla / Bilingual modes.
- **Table:** Products contract: 13px main data, 12px column heading, 11px helper/badge. Tables opt into `data-erp-table`; currency and quantity align right and retain readable proportional Geist digits; **never use monospace font**.
- **Buttons and all routine controls:** 36px height; 48px only for actual final POS/Purchase transaction actions. No locally invented select, segmented tab, chart-toolbar control, alert dialog or row action style.
- **Style:** Magic Patterns' 12px-radius-ish bordered white/card panels (mapped to actual theme tokens), restrained shadow, subtly colored values, selected semantic backgrounds, only one Ink-dark highlighted Advisor card where the current design shows it.
- **Tabs:** Party Ledger text + 2px sliding teal underline, 13px text; second level (Advisor) is still an underline tab row.
- **Iconography:** Existing Lucide icons; roughly 16px normal icon; no emoji as control/icon replacements; meaning appears in text for all status values.
- **Color:** Ink/Teal/Mint for hierarchy, success green, warning amber, danger red, informative blue where helpful; all through the theme and accessible in dark mode. Red/green never the sole differentiator.
- **Spacing:** Preserve Magic Patterns' compact `space-y-4`, `gap-3`, card `p-3` / `sm:p-4` rhythm mapped to project spacing tokens; no oversized action bars or uneven input heights.
- **Filters:** Prefer basic date and compare visible, advanced dimension filters under one `Filters` action, with active filter summary, reset and clean saved view. Share AppDateRangePicker / AppSelect / SearchSelect.
- **Popovers:** Portal/reposition at viewport edges, prevent cutoffs; modal opens without horizontal page shift; keyboard focus/escape robust.
- **Table actions:** Product-style dense rows, primary row click opens source, contextual `More` for uncommon operations; no hover-only vital actions.

## 7. Full purchase workflow (retain previous approved business intent; integrate into Magic Patterns UI)

**Business ownership:** Smart Buying is the *decision screen*. The real purchase-planning workflow is opened from Smart Buying (contextual full-page or wide workspace with matching Magic Patterns report framing); **Purchase Orders belong in Purchases**, using existing Purchase cart behavior. A PO is not a completed purchase.

1. **Advisor or Stock / Smart Buying** identifies sample shortage or purchasing opportunity, shows stock cover, demand, supplier lead, estimated buy, budget and expected benefit. Clicking `Plan Purchase` opens a planner prefilled with selected products. Allow add/remove/priority, supplier and unit adjustment, ordered/incoming calculation, budget cap, scenario and allocation between suppliers.
2. **Purchase Planner** provides a Magic Patterns-style compact KPI strip (`Suggested cost | Selected items | Budget left | Stock-out risk`), supplier/priority filters, editable Products-style detail grid (product, available, demand, cover, suggested, supplier, buying unit/qty, unit cost, total, reason), fixed summary and one `Save Plan` / `Create Purchase Orders` primary action. Advanced assumptions collapse.
3. **Saved Plan** stores mock state and context, with status `Draft`, `Prepared`, `Converted`, `Archived`; show source insight and latest refresh. Recalculate on explicit request; do not silently overwrite manual overrides. Plan is not stock or supplier payable.
4. **Create PO:** split selection **by supplier**, create one draft per supplier, flag missing supplier; item quantities retain base-unit conversion snapshots and human buying units. Open PO editor with existing POS/Purchase cart row family (supplier, expected delivery, item qty, price, total, notes, references, terms). **No actual payment editor in PO**.
5. **Place PO:** user reviews and confirms `Ordered` status. Creating or ordering a PO does not change product stock, supplier due, cash, purchase invoice, or SMS status. Optional PDF/print/share preview; do not assert sent to supplier unless connected sending occurs.
6. **Receive / Create Purchase:** from ordered PO, open canonical `src/pages/PurchaseEditor.tsx` via actual `/app/purchases/new` context/handoff. Prefill supplier/products/expected units; user edits **actually received** qty/cost, batch/expiry/serial, discount, paid amount, split cash/bank/MFS, attachments and invoice no. Use existing PurchaseCart/PurchasePaymentPanel.
7. **Partial receipt:** one PO can be received in multiple purchases. Show `Ordered | Previously received | Receiving now | Remaining` in a compact linked source strip; allow four of six pipes received, two outstanding. Cost variance stays explicit and does not overwrite original order estimate. Overdelivery requires visible confirmation/reason.
8. **Confirm actual Purchase:** after existing review confirmation, demo store updates sample stock, supplier ledger, payment and PO progress; actual purchase ref and PO ref link both ways. The report recomputes stock cover/plan suggestions and marks insight appropriately; success toast alone is insufficient.
9. **Correction/return:** open existing purchase source correction or return workflow, preserving PO trace; cancellation of unreceived remainder has a reason. On mobile use full page, not squeezed modal.

**Default simplification:** One PO may create many partial purchase receipts; one purchase originates from one PO in the UI-first scope. Defer multi-PO consolidated receipt to future design; preserve existing non-PO manual purchase creation.

**Concrete interactive demo:** 6 PVC pipes × 20 feet each, expected cost ৳1,200/pipe (PO ৳7,200); receive first 4 at ৳1,250/pipe (actual ৳5,000 before adjustments), remaining 2 displayed; later final receipt. The source plan, PO, Purchase, product stock and supplier ledger must show coherent reconciled demo values.

## 8. Other connected report actions (same visual pattern, not duplicate forms)

| Magic Patterns surface | Main decision and action | Existing ERP owner / demo outcome |
|---|---|---|
| Overview / Needs attention | Act on urgent customer dues | Party Ledger selected customer → payment entry → demo due decreases |
| Sales & Profit / Profit Insights | Investigate margin loss, offer opportunity | Product Details / Sales source → review proposed price/offer → explicit demo save |
| Stock / Smart Buying | Prioritize budget and replenish | Planner → PO → actual Purchase → inventory/ledger update |
| Dues / Customers | Collect unpaid invoice; identify inactive customer | Party Ledger, Sales History, optional SMS preview with consent |
| Cash & Expenses / Cash Forecast | Review cash gap and plausible cost/collection change | Finance/Expenses source and non-posting what-if scenario |
| Report Library | Inspect source row, compare, print, export | GitHub's existing reports engine, records and tools |
| Warranty / Returns / Bundles | Understand special issue or cost | Existing Warranty, source Return or Product/Bundle detail |

Every insight uses the same four-part explanation (`What happened? → Why? → What to do? → Expected benefit`), accessible `Advice | Sources | Calculation` evidence navigation, and a single purposeful action. Show demo ROI and cash projection freely for design testing, with clear `Demo data` labeling. The real backend later replaces one coherent mock provider and all simulated mutations without restyling screens.

## 9. Data/demo state and UX edge cases

- Demo dataset must link consistent tenant, sample customer/supplier, product/unit, sales invoice, return, expense, PO, receipt, lot, payment and report IDs. For simulated ROIs use explicitly adjustable assumptions; numbers recalculate rather than remaining decorative literals.
- Demo persistence, if introduced, is tenant-scoped and resettable. Never write `AdvisorReport` status under a global unscoped `localStorage` key; separate tenant/account/insight state.
- Source history includes date/quantity/unit snapshots. Distinguish known sample transactions vs scenario assumption. Do not let changing a simulation mutate posted demo ledger until an explicit action is confirmed.
- Correct status distinctions: Plan draft ≠ PO ordered ≠ supplier message sent ≠ goods received ≠ money paid. Give each one a visible timeline and linked source reference.
- All significant actions have successful, empty, loading, validation, cancelled, failure, partial and permission-limited preview states. Buttons without a wired workflow are disabled with explanation; no `toast.success('Draft POs prepared')` without creating those demo draft records.
- Stock cover 0/negative/unknown, missing supplier, item discontinued, return, backdate, multiple stock units, mixed suppliers, edited actual purchase prices, cancellation and double-click duplicates must be designed.
- Maintain return context (report ID, filters, date, scroll, selected insight, PO source), with Save Draft / Discard / Stay for unsaved contexts. Browsing a source record returns without losing work.
- If the backend has no cost/lot/due metadata at production rollout, the same visual layout shows `Insufficient data` or assumption indicator instead of fake production facts. The backend phase *replaces fake data*; it does not delete Premium visual features.

## 10. Screen-by-screen visual acceptance

- **Overview:** eight Magic Patterns-inspired KPI tiles, dual area chart, attention panel, dense supporting tables, all grounded in demo state; source clicks work. First visible priority clear.
- **Advisor:** recognizable Ink/Mint hero, 4 health tiles, recommendation priority/filter list, four-part explanation and demo ROI; evidence and source action work.
- **Profit:** revenue-margin scatter + reference lines, readable profit bridge, detailed products table, click chart point → selected product details.
- **Smart Buying:** full compact budget/forecast table, supplier grouping, planner saving, PO creation and linking—not a success toast.
- **Cash:** responsive positive/negative cash bars, 7/30/90-day scenario and weekly detail, safe hypothetical controls; data updates promptly.
- **Customers:** clear customer status, purchase cadence, receivable vs risk distinction, Party Ledger link.
- **Purchase Orders:** uses Magic Patterns density and Projects' table sizes, but existing PurchaseCart row controls; statuses, line edits, partial receipt, source attachments and purchase handoff functional.
- **Accessibility/performance:** keyboard/Arrow/Home/End tabs, chart summary as text, visible focus, no modal-induced page jump, stable chart axis, reduced motion; no layout jank on responsive filter controls.
- **Internationalization:** English, Bangla, bilingual; no hardcoded English-only business terms in critical new flows; data displays ৳ consistently, text/badges remain legible across mobile/desktop/dark/light.
- **Comparison:** evaluate target side by side with **active Magic Patterns Reports** at ~390, ~768 and ~1440 widths, then assess ERP-wide component consistency against Dashboard, Party Ledger and Products. One bounded Impeccable review pass, one repair pass if needed, then verification.

## 11. Superpowers UI-only delivery sequencing after approval

1. **Visual baseline and nav:** Build Magic Patterns-first Reports shell and responsive two-level underline tabs. Keep current report library working. Capture comparison screenshots, confirm chart/KPI placement, enforce 36px controls and Product table scale.
2. **Basic report views and charts:** Port visual layouts/presentation of Overview, Sales, Stock, Dues, Cash & Expenses using *actual* existing shared code and coherent demo report data; complete periods, tooltips and filter actions.
3. **Premium views and motion:** Advisor, Profit Insights, Smart Buying, Cash Forecast and Customers. Add polished dark/Mint hero, scatter/area/composed charts, animate state changes, reduced-motion support, source/assumption tabs.
4. **Smart Buying planner:** Editable detail table, budget scenario, supplier splitting, saved demo plans and source handoff; preserve current report planner arithmetic where reusable.
5. **Purchase Orders:** Add PO tab inside Purchases and full-page PO editor/detail using canonical PurchaseCart controls; demo create/edit/order/cancel/print/partial receipt activity timeline.
6. **PO-to-Purchase and other actions:** Existing PurchaseEditor prefill, actual receipt adjustments, payments, linked demo stock/ledger, real UI preview transitions, customer dues/price/expense/finance action routes.
7. **Impeccable polish and verification:** Single controlled cross-device screenshot review, Brand Guide/component consistency, keyboard/language/theme states, chart readability, mock state coherence, TypeScript/ESLint/UI contract/browsers tests. No backend/database modifications.

**Plan-writing gate:** These are design-level slices, **not** a Superpowers `writing-plans` file-specific test-by-test implementation plan. The latter is created only after user confirms this visual/IA proposal. Use isolated PRs; don't alter source silently.

## 12. Explicit sign-off question

The requested Magic Patterns **visual world is settled**. Please approve whether we may **group the five Premium screens under one Advisor underline tab**, keeping each Premium page intact as a second-tier underline sub-tab for compactness, instead of retaining Magic Patterns' literal eleven-tab horizontal row. The proposed grouped version is preferable for Bangladesh shop owners and mobile layouts, but we will preserve the literal row if the user prefers exact prototype navigation.

## 13. Source references

- Magic Patterns active design: https://www.magicpatterns.com/c/t6q3mxi6nhuak3qjvx8cwn
- GitHub: https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/AGENTS.md
- GitHub: https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/src/pages/Reports.tsx
- GitHub: https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/src/pages/Purchases.tsx
- GitHub: https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/src/pages/PurchaseEditor.tsx
- GitHub: https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/src/components/parties/PartyDetail.tsx
- GitHub: https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/docs/ui/2026-10-24-table-typography-contract.md
- GitHub: https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/docs/ui/2026-10-25-magic-patterns-brand-realignment.md
