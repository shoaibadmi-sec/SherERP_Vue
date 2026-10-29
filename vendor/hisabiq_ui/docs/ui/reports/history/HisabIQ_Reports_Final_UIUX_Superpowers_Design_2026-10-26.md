> Historical research/proposal — retained in full for evidence. Conflicting implementation, visual/navigation and approval instructions are superseded by the [canonical26 October Reports specification](../../../superpowers/specs/2026-10-26-hisabiq-reports-final-uiux-design.md). This is not the current implementation plan.

# HisabIQ Reports & Interconnected Buying — Final UI/UX Design Proposal

**Date:** 26 October 2026  
**Stage:** Superpowers design specification for approval; **UI-first, demo-data phase only**  
**Implementation status:** No product code, backend, routes, or purchase documents have been changed.  
**Repository assessed:** `shuvodelux-commits/hisabiq_ui` current default branch via GitHub connector.  
**Design authorities:** `AGENTS.md`, existing Dashboard/Party Ledger/Products/Purchases, `docs/ui/transaction-cart-design-contract.md`, `docs/ui/2026-10-24-table-typography-contract.md`, `docs/ui/2026-10-25-magic-patterns-brand-realignment.md`, and existing Reports implementation.

## 0. Decision summary

**Product promise:** A shopkeeper sees what matters, understands why, takes the next action, and sees what changed—without learning accounting language or navigating several disjointed modules.

**Chosen recommendation pending user approval:** A **shared reporting engine + action-oriented views + existing domain editors**. Do **not** replace the functioning GitHub report catalog, clone carts, create a parallel purchase accounting module, or make the default UI an enterprise BI builder.

**Confirmed project constraints:** This is the UI/UX design phase. Realistic fake revenue, costs, ROI, cash forecasts, orders and full simulated end-to-end workflows are allowed and desirable. They must be contained in an unmistakably demo-only data provider so they can later be replaced with real tenant data and backend workflows without redesigning screens. Actions must actually change coherent mock state; a success toast alone is not a completed workflow.

**Key structural choices:**
1. **Reports:** six primary underline-tab destinations: Overview; Sales & Profit; Stock & Buying; Money & Dues; Advisor; All Reports. Keep the existing catalog and its seven backend/report group filters inside All Reports, not as seven more top tabs.
2. **Purchases:** extend existing Purchase workspace tabs to Purchases; **Purchase Orders**; Purchase Return; Return History. The Purchase Order lifecycle is owned by Purchases, not Reports.
3. **Purchase chain:** Recommendation → Planner → Saved Plan → Supplier-grouped Purchase Order → Ordered → Receive into existing **PurchaseEditor** → Adjust actual goods/cost/payment → Review and Complete Purchase → Linked stock and supplier ledger → Verify outcome.
4. **Other journeys:** Advisors go to existing Party Ledger, POS/Sales, Product/Offer, Expenses, Finance, and Return workflows with preselected context and reversible navigation.
5. **KISS:** one clear primary action, 3 high-value recommendations at a time, contextual drilldown, filters collapsed by default, no charts without a user question.

## 1. Starting point: verified repository findings

| Existing UI source | Verified relevant behavior | Design treatment |
|---|---|---|
| `src/pages/Reports.tsx` | Grouped reports, report picker/library, filter, saved views, exported CSV/print, existing planner assumptions | Preserve; enhance top-level information architecture and actionable handoffs |
| `src/reports/catalog.ts` and `model.ts` | 34 catalog entries (27 functioning UI-preview views, 7 explicit source-readiness entries), `reorderQuantity()` and reporting calculations | Keep as single reporting core, extend for demo insights |
| `src/components/reports/ReportOverview.tsx` | Dashboard-style report KPIs, sales trend, high-priority alerts, top products and expenses | Reuse cards/panels and detail links; refine priority order |
| `src/pages/Purchases.tsx` | Purchases, Purchase Return, Return History underline tabs | Add Purchase Orders as **one** tab, not separate unrelated navigation |
| `src/pages/PurchaseEditor.tsx` | Actual existing `/app/purchases/new` route, canonical POS-style purchase cart, supplier, cost, lot/serial/expiry, payments, review dialog | Reuse for PO → actual purchase/receipt. Add contextual prefilling only; no cloned editor |
| `src/components/purchases/PurchaseCart.tsx` | Shared purchase-oriented compact product cart and multi-unit handling | Reuse UI primitives for PO line editing, with mode-specific fields |
| `src/components/purchases/PurchasePaymentPanel.tsx` | Cash/bank/MFS split, amounts, review action | **Do not show real payment rows inside PO**; show only in actual purchase flow |
| `src/components/parties/PartyDetail.tsx` / responsive variant | Party Ledger underline tabs, contextual payment/statement actions, separate desktop/mobile behavior | Main reference for actionable tabs and contextual records |
| `src/pages/Products.tsx` and `src/components/Table.tsx` | Compact, horizontally scrollable responsive tables, product metadata, stock and product details | Main table typography/density standard |
| `src/pages/Dashboard.tsx`, `components/dashboard/MetricCard.tsx` | Simple KPIs, panels, trend, widgets | Main report overview KPI hierarchy reference |
| `src/App.tsx` | `/app/purchases`, `/app/purchases/new`, `/app/reports`, no dedicated PO route found | PO screen and links will be new UI additions after approval |

**Important:** The existing Reports planner exports a suggested purchase CSV; it does not currently create Purchase Orders. Current PurchaseEditor makes a preview purchase. The proposed PO + partial-receipt workflow is **new design**, not a claim it already works.

## 2. Approaches considered (Superpowers design-it-twice review)

**A. Copy the whole Magic Patterns Reports prototype.** Fast screen variety, but duplicates report data, creates separate navigation and loses existing cart/ledger behavior. **Rejected.**

**B. Add every decision feature as a new top-level report and wizard.** Appears comprehensive but overloads beginners and duplicates actions. **Rejected.**

**C. Keep GitHub's core; introduce action-first sections and explicit handoffs to the canonical ERP modules.** One source of business records, detailed reports retained for experts, high-value decisions front-and-center. **Recommended pending user approval.**

**Rejected shortcuts:** PO equal to Purchase; fake success toast; full purchase payment panel inside PO; automatic invisible conversion; report-specific product picker; arbitrary AI numbers in production; 11–15 top tabs.

## 3. Reports information architecture and screen tree

### 3.1 Six destinations (one underline-tab row)

| Primary tab | First thing shown | Primary use | Scope |
|---|---|---|---|
| **Overview** (default) | Business health and 3 recommended actions | Answer 'How is business today; what needs attention?' | Accessible to all users |
| **Sales & Profit** | Sales, cost coverage, margins, returns and opportunities | 'What sells, what earns, what leaks?' | Simple plus advanced progressive panels |
| **Stock & Buying** | Stock health and direct Purchase Planner entry | 'What and how much should I buy?' | Smart-buying deeper insights gated by entitlement later |
| **Money & Dues** | Cash position, customer dues, supplier dues, expense summary | 'Who to collect from, who to pay, can I afford inventory?' | Advanced scenario only when needed |
| **Advisor** | Top actionable prioritized insight cards | 'Tell me what to do and why' | Basic clear tips; Premium deep strategies/ROI |
| **All Reports** | Searchable library retaining existing report catalog | 'Find a precise detailed report' | All 34 catalog entries with capability/data states |

**Avoid a nested primary navigation explosion.** Use thin Party Ledger-style teal underline tabs via existing `MotionTabList` / `MotionTabIndicator`. The existing 7 report group labels remain as categories in the All Reports library, not an additional conflicting master navigation. On a phone, use the project's scrollable/accessible tab row or a compact section picker with current state; do not squeeze 6 illegible labels into one line.

### 3.2 Desktop layout (logical regions, not a new visual system)

```
Reports · রিপোর্ট                             [Period ▼] [Search] [More ⋯]
Overview | Sales & Profit | Stock & Buying | Money & Dues | Advisor | All Reports
──────────────────── teal underline ───────────────────────────────────────────

[Sales]   [Recorded gross profit*]   [Receivable]   [Usable stock value]

Important today (maximum 3)              Business trend / comparison
┌─────────────────────────────────┐       ┌─────────────────────────────┐
│ Supplier price has risen        │       │ Relevant compact trend      │
│ Why · suggested action          │       │ chart, linked to source     │
│ [Review price] [Evidence]       │       │ report                      │
└─────────────────────────────────┘       └─────────────────────────────┘

Compact detail cards / tables for top products, ageing, dues, cash
[All reports] [Show more insights]
```

`*` In the demo stage show sample ROI/profit with a visible Demo identifier and optional sample calculation explanation. The production source provider must not silently use today's master price as historical cost.

### 3.3 Visual hierarchy

- Page header: `PageHeader` and two-line optional explanatory copy; don't use marketing hero cards.
- Metrics: reuse Dashboard `MetricCard`/`Panel`, max 4 key metrics at the first glance on desktop and max 2 per row on phones.
- Insights: priority, recommendation title, one-line Bangla helper, **What happened / Why / What to do / Expected benefit**; source evidence and calculation as understated underline sub-tabs or expandable section, **not nested modals**.
- Detailed data: Products table typography and standard compact row actions; selected report opens inside All Reports with filters, columns, print, CSV and source detail.
- Filters: simple period chips at top when relevant; advanced filters collapsed. Snapshot reports say 'Current snapshot'; historic date filter must not imply historic stock reconstruction.
- A single primary contextual action per card or screen; other actions under More.
- Link backwards into the exact originating report, selection, date range, and scroll position via URL or route state.
- Empty/slow/insufficient data: show explanation, sample mode when explicitly enabled, and one valid next action; never blank/dummy success.

### 3.4 Section-level detail

**Overview:** top metrics → three important actions → one trend chart → small top-selling/stock/dues sections → All Reports link. Do not place all report categories here.

**Sales & Profit:** sales trend, revenue vs returns, recorded gross profit (demo ROI permitted), product/category/customer profitability, discount/returns leakage, supplier cost impact; actions open Sales history, product pricing editor, actual invoice and Product Details. Advanced detail is under in-place report selection, not new screen categories.

**Stock & Buying:** stock health KPIs, replenishment alert, slow stock, expiring lots, **Purchase Planner** as strongest feature, compact buying opportunities, existing source reports. 'View Purchase Orders' opens `/app/purchases?tab=orders` instead of duplicating order management.

**Money & Dues:** cash/bank/MFS totals correctly separated from sales and loans, receivables, supplier payable, expense trend, collection priority, optional 7/30/90-day what-if drawer; action enters selected Party Ledger or payment/expense workspaces.

**Advisor:** max 3 visible recommendations by priority, sorted by materiality, urgency, recency and actionable confidence; optional See all/Done/Snoozed. Each card: Advice | Source | Calculation/Scenario. Lifecycle derived from demo source changes; do not mark complete at click time.

**All Reports:** preserve existing 34 reports, favorites, saved views, Search, category grouping, date filters, columns, print/export and source drill-down. Show the 7 currently data-unready reports as interactive **demo examples** when Demo Mode is enabled, while keeping production source requirements documented. One reusable report container/table/filter pattern.

## 4. Purchasing user journey — authoritative UX contract

### 4.1 Document semantics (must never be confused)

| Document | Meaning | Affects stock? | Affects payable/cash? | UX owner |
|---|---|---|---|---|
| **Purchase suggestion** | Algorithm recommends item/quantity | No | No | Reports → Stock & Buying |
| **Saved Purchase Plan** | Curated shopping shortlist/budget, may include multiple suppliers | No | No | Reports → Planner |
| **Purchase Order (PO)** | Intent/commitment to buy from **one** supplier, expected prices/quantities | No | No | Purchases → Purchase Orders |
| **Purchase (received/recorded bill)** | Actual items received and purchase costs/payments recorded in canonical editor | Yes, on completing purchase | Yes, on completing actual transaction | Existing `PurchaseEditor`/Purchases |
| **Return/Correction/Payment** | Post-purchase adjustments tied to source | As relevant, after confirmed source action | As relevant | Existing Purchases/Party Ledger |

**Never auto-post stock on PO issue and never show PO as supplier payable.** If future backend adds legitimate supplier advances against an order, create a separate explicit advance workflow. In current UI, show a planned deposit as informative text only.

### 4.2 Purchase Planner (in Reports > Stock & Buying)

**Entry points:** Stock alerts, Advisor insight, Products low-stock row, All Reports > Purchase planner, and Saved Plan reopen.

**Landing:** compact KPIs: Needs buying, Expected spend, Available purchasing budget (optional), Already ordered. Below: product search, category/brand, supplier filter, stocks and velocity period.

**Planner table** follows Products table visual standard, with columns: checkbox, Product (+ Bengali helper), usable stock, average sold/day, incoming PO, projected cover, suggested qty in user-friendly buying unit, latest supplier price, estimated total, Reason, More. Quantity and currency right aligned. On phone: compact product name/stock/suggested/amount and More; details expandable.

**Controls (progressive):** Lead time, review window, safety buffer, pack-size rounding, budget, supplier selection. Use existing shared input controls; advanced assumptions collapsed. Unit conversion displayed e.g. `1 carton = 12 box` or `1 pipe = 20 feet`, while all computations use frozen base quantities. Include sales returns, expected purchases, expiry, stock issues only when documented/available; demo dataset can simulate these.

**Interaction:**
1. Open from insight with product preselected and source explanation visible.
2. Review suggestion; edit quantity, unit, supplier, expected unit cost. Editing updates selected totals and coverage simulation immediately, not historical source data.
3. Filter/sort/select rows. Unassigned suppliers remain in `Needs supplier`; block PO issuance until assigned (Quick Add Supplier available in contextual selector).
4. Show `Budget left / Over budget`, not a forced stop unless the user explicitly sets a hard limit. Provide adjust/skip alternatives; never silently cut quantities.
5. Save Plan as draft (tenant-scoped coherent mock state); allow resume, duplicate, archive and reset.
6. **Create Purchase Orders** groups selected items by supplier. Show confirmation summary **N suppliers → N POs**, estimated spend, excluded/unassigned rows. Create one PO per supplier; preserve originating plan and reference/insight context.
7. Redirect into Purchases > Purchase Orders with created drafts selected and a clear `Back to Plan` link. An alternate 'Create one PO' action when exactly one supplier is chosen avoids unnecessary selection.

**Important duplicate protection:** same product/source suggestion already in another open plan or unreceived PO gets `Already planned/ordered` indicator and is excluded or explicitly overridden with a clear reason. Replanning should use outstanding PO quantities, not duplicate them.

### 4.3 Purchase Orders inside Purchases

**Purchases tabs:** `Purchases | Purchase Orders | Purchase Return | Return History`, all using the approved Party Ledger underline tab style. No separate top-level sidebar destination in v1. Suggested route: `/app/purchases?tab=orders`; actual canonical route names finalized when code is inspected for link changes.

**PO list** (Products table style): PO number, supplier, created date, expected date, ordered items, estimated total, received progress, status, More. Filters: search, supplier, status, date, expected delivery. One main `New PO` action, plus `Open from Plan` on planner-linked item. Rows open a full-page PO detail/editor (complex workflow should not be squeezed into modal).

**PO states:**
- `Draft` — editable completely; no impact on stock/dues; Save/duplicate/delete as permitted.
- `Ordered` — user explicitly confirms/places order; keep revision or change reason for changed terms. Actual sending via SMS/WhatsApp/print has a separate delivery/result state, never implied by `Ordered`.
- `Partially received` — at least one actual linked purchase has been completed and there is outstanding quantity.
- `Received` — all outstanding quantities received to tolerance or explicitly resolved; linked actual purchases visible.
- `Closed/Cancelled` — explicit close remainder or cancel with reason; partial receipt history survives.

Overdue expected date is a derived warning, **not another workflow state**. The precise distinction between `Received` and `Closed` may be simplified further during usability testing, but must not conflate cancellation with receipt.

**PO editor screen:** PageHeader, breadcrumb `Purchases > Purchase Orders > PO-…`, compact supplier+expected date+reference+notes, POS/Purchase-style editable cart, expected price/unit and quantity, totals, optional delivery/discount/terms under More. **No actual payment panel**, no claim about stock increase, no lot/serials required at order time. Primary action `Save Draft` or `Place Order` as appropriate; print/share preview with explicit delivery status. Supplier Quick Add without leaving editor.

**PO detail read mode:** Header/status and progress; original ordered vs received vs remaining quantities table, linked purchase documents/receipts, notes/attachments, activity log. Actions: Edit permitted terms, Copy, Print, Record Purchase / Receive Goods, Close remainder, Cancel when eligible. Always return to this PO after completing the linked purchase.

### 4.4 Convert PO to real purchase (critical full flow)

1. On an `Ordered` or `Partially received` PO, click **Receive Goods / Record Purchase**.
2. Open the **existing `PurchaseEditor`**, not a second editor. Prefill supplier, reference and outstanding PO item lines, unit conversions and expected cost. Show a small `From PO-…` context bar with expected vs received progress.
3. User edits **actual received quantity**, unit, invoice number, actual unit cost, lot selling price, batch, expiry, serial, discount and expenses where existing editor supports them. Adjust the payment split and supplier credit using canonical PurchasePaymentPanel. Do not overwrite original PO expected terms merely because invoice facts differ.
4. Allow **partial receipt** by reducing received quantities or removing a line from this receipt; residual stays outstanding on the PO. Default not to exceed outstanding. Surplus requires an explicit `Accept extra` confirmation/reason, while actual received quantities remain inspectable.
5. Compare `Ordered / Receiving now / Already received / Remaining` and `Expected vs actual cost` before completion. Zero quantities and invalid conversions cannot be posted. If actual price changes, show difference; never silently change supplier quotations.
6. User clicks canonical 48px **Review/Complete Purchase** action and confirms the transaction. Demo store writes a linked purchase and updates sample stock, lots, supplier due, payment and PO progress coherently; **no production backend**.
7. Return to PO details with an activity timeline and links to newly created purchase, supplier ledger and affected product stock. A `Receive remaining` action remains for outstanding items.
8. If completed receipt requires correction/return, use the **existing purchase correction/return flow**, with source linkage and visible effect on PO received position. Never directly mutate a completed purchase from PO editor.
9. If the supplier does not send the balance, `Close remaining` with reason. Do not fabricate receipt or payable for missing items.

**Default merge policy:** One PO may produce **many actual purchases** (partial receipts). One actual purchase originates from **one PO** in the initial UI to keep editing, tracing and reversal simple. Multi-PO consolidated receipts are a deferred enhancement.

**Data semantics:** PO `orderedBaseQty`, `receivedBaseQty`, `remainingBaseQty`; costs and unit snapshots for both original plan and confirmed purchase. `Received` progress is calculated from *linked non-reversed actual purchases*, not manually edited counters.

### 4.5 Demonstration example (fully interactive mock fixture)

Hardware shop: PVC pipe planned 120 feet as six 20-foot pipes, 8-day supplier lead time. Plan selects 6 pipes at sample cost ৳1,200/pipe, PO to Supplier A with expected total ৳7,200. On first delivery only 4 pipes arrive; opening the PO prefills 6, user changes to 4 and updates actual cost to ৳1,250/pipe. Completing purchase creates sample purchase ৳5,000 (subject to checkout adjustments), receives 4 pipes into stock, updates supplier due according to demo payment, and leaves 2 pipes outstanding. Second purchase of 2 pipes completes the PO. Original estimate remains visible, as does actual spend. **Every number labeled Demo; no claim of a real supplier, stock or payment.**

## 5. Other interconnected reports — action mapping

| Insight / report | Simple explanation | Primary action → canonical module | Follow-through in demo UI |
|---|---|---|---|
| Customer outstanding | 'These invoices have money left to collect' | **Receive Payment** → selected Party Ledger/Counter payment dialog | Prefilled invoice(s), partial/full split payment, updated demo ledger, return to insight |
| Unpaid invoice ageing | 'This invoice is 42 days old' (not automatically overdue) | **Open Invoice** → Sales source → Party Ledger | View facts, payment history, record payment, evidence refresh |
| Supplier payable | 'Supplier payment is coming up' | **Pay Supplier** → existing Party/Vendor payment context | Show exact invoices, split cash/bank/MFS, update demo due |
| Fast sales / pricing opportunity | 'These items sell strongly; review margin' | **Review Product Price** → Product Details editor | What-if estimate, manual save, dashboard source refresh; no auto price change |
| Supplier price rise | 'Recent cost per comparable base unit increased' | **Compare Purchases** → supplier price report → Product price review | Source purchase refs, suggested review, user-controlled edit |
| Slow/dead stock | 'Units have remained unsold' | **Review Stock / Create Offer** → Products/Offers when present | Sample offer preview with eligibility, preserve stock controls |
| Near-expiry stock | 'Batch expires soon' | **View Batch** → Product Inventory lots | Batch-aware action; avoid generic promotions for medicine without controls |
| Stock shortage | 'Stock cover shorter than supplier lead time' | **Open Purchase Planner** → Selected product | Plan→PO→Purchase chain in §4 |
| Expense increase | 'Expense category is above typical' | **View Expenses** → filtered expense list | Compare contributing sample expenses, open detail/correct/create expense |
| Cash shortage scenario | 'Expected commitments may exceed available balance' | **Review Cash Plan** → Finance/Counter context | What-if panel doesn't post, link to actual payment/purchasing records |
| Customer inactivity | 'Customer hasn't purchased recently' | **Open Customer** → Party Ledger / Sales History | Optional sale or approved message preview only; avoid fabricated SMS success |
| Product/Bundle profitability | 'Potential margin issue' | **Inspect Product/Bundle** → Products/Sales records | Show realistic demo ROI plus cost coverage and conversion assumptions |
| Returns / warranty | 'High returns or active claim' | **Open source Return / Warranty** | Correct existing return/service workflow, not a new report-specific form |

**Universal loop:** Insights show `Detected → Reviewed → Action created → Actual demo state changed → Re-evaluated`. Merely viewing evidence does not mark the action completed. Opening another module preserves a `returnTo` link and selected filters. User can snooze/dismiss appropriately; more severe repeats resurface.

## 6. Business Advisor design contract

**Card role order:** Context and priority → strong 1-line recommendation → compact supporting metric(s) → four-part explanation → primary action → optional evidence/calculation → secondary More.

**Four-part copy:** 1 What happened? 2 Why is it important? 3 What should I do? 4 Expected benefit (sample ROI acceptable in Demo Mode).

**Evidence region:** use Party Ledger-like short underline tabs `Advice | Sources | Calculation`; real-looking demo source references open supporting demo records. Distinguish facts derived from **demo transactions** and assumptions. The entire demo app clearly identifies the data as sample, rather than filling each cell with warning badges.

**Ranking:** actionable, urgent, financially material, supported; no noisy advice spam. Three cards initially; `Show all` for history and lower-priority suggestions. Snooze/Done scoped to demo tenant/user/insight ID. `Done` means the chosen action actually changed appropriate mock source state or was explicitly marked as manually resolved with a reason; no toast-only success.

**Premium experience:** scenario and ROI comparison, customer patterns, supplier alternatives, dynamic budgets, cash projections. Basic still provides clear practical warnings and relevant reports; the UI doesn't present a completely empty Advisor to free users.

## 7. Cross-module navigation and preservation

**Context envelope fields (conceptual, not prescribed implementation API):** `tenantId`, `origin` (`reportId`, selected date/filter/sort/scroll), `insightId`, `planId`, `poId`, `sourceProductIds`, optional `supplierId`, `returnTo` route. Only pass IDs/context, not stale price totals as authority; linked editors read their current mock state.

- Report summary → source detail should be 1 click; inspect record and return without losing query.
- Plan → PO draft → Purchase receipt should show breadcrumb/source reference, not surprise page jumps.
- Users cancelling an editor should retain draft where appropriate or be offered Save Draft / Discard / Stay.
- Responsive phone uses stack/sheet/full page for complex editor; don't squeeze Purchase into a small modal.
- One component family per domain; reuse `PageHeader`, `MotionTabList`, `Panel`, `MetricCard`, `Table`, `Button`, existing filters/date controls, PurchaseCart and PaymentPanel.

## 8. UI visual specifications — non-negotiable

| Element | Rule / reference |
|---|---|
| Brand | Existing HisabIQ Ink/Teal/Mint tokens, semantic warning/success/danger; derive only from project theme |
| Typography | Geist + Hind Siliguri; no monospace digits |
| Main report table data | **13px** (`Products` table contract) |
| Table header | **12px** |
| Helpers and badges | **11px** |
| KPI numbers | Reuse Dashboard sizing/weight hierarchy, no new arbitrary giant font scale |
| Normal Button/Input/Search/Select | **36px** on desktop/tablet/mobile |
| Final Purchase/POS completion | **48px** only on approved major end-of-transaction CTA, preserving the existing data attribute rule |
| Navigation tabs | Party Ledger text + fine teal sliding underline; not pills, cards or segmented buttons |
| Panels and cards | Subtle borders, shared background/tokens, consistent radius, tight but readable spacing |
| Values | Right-align money and numeric columns; currency with ৳, smart concise formatting; proportional digits |
| Modals | Shared Dialog/AlertDialog; max one level of Quick Add; full-page for complex PO/purchase |
| Tablet | Compact desktop-like tables and shared POS/Purchase cart; responsive as incumbent code permits |
| Mobile | Prioritize product name, status, actionable amount; details via expansion/More; no global min-height 44px on compact rows; touch targets accessible independently |
| Accessibility | Real focus, keyboard nav, selection labels, reduced motion, semantic color + text, stable scroll in dark/light modes |
| Bilingual | English, Bangla, bilingual helper variations; no untranslated prototype-only controls |

**Information-density rule:** rich in meaningful data, not control clutter. The first screen answers a question, the second layer exposes contributing evidence, the third layer exposes complex assumptions and advanced filters.

## 9. Mock functionality specification for UI-first completion

- One consistent `DemoMode` indication on major report/Purchase views and option to reset demo data.
- Deterministic sample dataset with connected invoice IDs, supplier IDs, products, PO IDs, purchases, lots and ledger entries; use realistic Bangladesh taka amounts and niche hardware/fabric/furniture/medicine/electrical/grocery examples where they make sense. Avoid duplicate isolated hardcoded totals that don't reconcile.
- Sample ROI calculations are interactive and may use **explicit illustrative assumptions**. Show delta when parameters change. These demo numbers are **not** production accuracy claims.
- Shared coherent demo state across Reports, Purchases, Products and Parties. PO → completed purchase must visibly update selected tables/stock/payables. Keep within current UI preview provider where possible; if persistence is added, scope it to demo tenant with Reset Demo.
- Functional mock buttons and actions: Save Plan, Create PO, Place Order, Record Partial Purchase, Review Complete, Edit Product Price, Receive Money, Pay Supplier, View/Print source, Export Demo, Snooze Advisor.
- Actions not feasible in current design must be visibly disabled with an explanation, not success toasts; SMS/email/WhatsApp delivery is preview-only unless actual integration exists.
- Source records, audit trail and PO/Purchase cross-links remain navigable after state changes and reload if demo persistence is part of that slice.
- During later backend work: replace demo data provider and action handlers, implement real tenant authorization/audit/reconciliation, and preserve approved UI components. Production source-honesty/data readiness becomes a release gate, not a blocker to drawing the entire UI now.

## 10. Important edge cases and expected UI behavior

1. **Mixed suppliers:** Plan splits into N PO drafts; no silently merged cross-supplier PO.
2. **Unassigned supplier:** warning and Quick Add; no issue without supplier.
3. **Unit chain:** e.g. 1 carton = 12 boxes; 1 box = 20 pcs; 1 pc = 120 ft. Keep base-unit snapshots and human-friendly quantities.
4. **Partial purchase:** 4 of 6 pipes received; status partial and 2 still due; second purchase only 2.
5. **Overdelivery:** incoming 7 against 6; explicit override + reason and visible qty variance.
6. **Different actual price:** PO expected ৳1,200 vs invoice ৳1,250; show variance and keep original PO estimate.
7. **Duplicate buying:** an already ordered/incoming item doesn't trigger blindly duplicated PO recommendation.
8. **Different payment allocation:** split amount correctly, never mark entire receipt paid from one account.
9. **Draft vs actual transaction:** neither Plan nor PO changes inventory, payments or supplier due.
10. **Returned purchase:** tie to purchase source; recalculate received position or show corrected audit status, not silently rewrite history.
11. **Missing historical cost:** production must show insufficient data; demo may show explicit simulated ROI.
12. **Editing an open plan on mobile:** preserve active edits and origin when moving between editor and source details.
13. **No data/zero stock/negative stock:** explanatory empty, zero or shortage state; avoid divide-by-zero and nonsensical infinite cover.
14. **Language/theme:** all screens in English/Bangla/Bilingual and light/dark, 390/768/1440 viewport checks.
15. **Cancellation:** cancelled PO remains in history; actual linked purchases are not deleted automatically.

## 11. UI design delivery stages (dependency order, no backend)

### Stage 1 — Screen skeleton / information architecture
**Deliverables:** six Reports tabs with matching styles, current 34-report library still working, Desktop/Tablet/Mobile views. **Gate:** current report filters, source links, saved views and CSV/print survive.

### Stage 2 — Demo data and actionable insight card family
**Deliverables:** coherent sample business dataset/ROI, reusable Advisor card with Sources/Calculation tabs, mock action state transitions, saved/dismissed insight state. **Gate:** same amount on card, detailed report and source sample record; no toast-only actions.

### Stage 3 — Planner interactive workflow
**Deliverables:** responsive planner with stock, incoming, supplier assignment, unit conversion, budget and multiple selected products; Saved Plans and simulated recalculation. **Gate:** edits recalculate quantities/spend correctly, reload and return preserve state.

### Stage 4 — Purchase Orders in Purchases
**Deliverables:** new underline Purchase Orders tab, list, full-page PO editor/detail, supplier-grouping handoff from Plan, draft/ordered/partial/received/closed states, print-preview. **Gate:** multi-supplier split, full/partial receipts and duplicate protections work in coherent demo state.

### Stage 5 — PO → actual Purchase integration
**Deliverables:** context-prefilled existing PurchaseEditor, editable actual quantities and costs, lot/expiry/serial, real sample split payments, confirmation and linked stock/ledger/history updates. **Gate:** sequential partial receipts, source reconciliation and safe returns/edit flow work without duplicating existing carts.

### Stage 6 — Other report-to-action workflows and Premium polish
**Deliverables:** customer due→Party Ledger, supplier due→payment, profit→Products/Sales, expense→Expenses, cash scenarios→Finance, slow stock→Offers, insight outcome verification. Full bilingual/dark/accessibility/performance testing and final documentation. **Gate:** each major insight can end in a meaningful demo state change and preserved return context.

**Implementation after approval:** Use isolated PRs per stage; TDD/Playwright; preserve repo AGENTS rules. Planned verification: `npm run check:ui-contract`, `npm run test`, `npm run build`, `npm run lint` (zero errors), existing `npm run test:purchases`, report/browser smoke and screenshots at device/language/theme states. Prior repo-authored verification reported 709/711 unit tests passing with two pre-existing stale quotation fixture failures—rebaseline before asserting green.

## 12. Screen-by-screen acceptance tests for the designer

- **Overview:** within 5 seconds a new shopkeeper identifies Sales, Due, Stock concern and the main next action.
- **Advisor:** all four explanations, realistic sample benefit, one main action, source and calculation visible on demand; no stacked banners.
- **Planner:** purchase quantity from selected product can be changed using compound units; expected spend and budget update; supplier assigned in place.
- **PO:** one-click create from planned items with expected terms; quantity/cost editable while Draft; placing PO does not change stock or payable.
- **PO partial receipt:** purchase editor prefills six 20-foot pipes; user actually receives four, edits unit cost, completes; original PO shows ordered 6/received 4/remaining 2 and purchase link.
- **Actual purchase:** posted **demo** receipt updates product stock and supplier ledger, and splits payment using existing PurchasePaymentPanel.
- **Collection:** review due in Reports, open selected Party Ledger, record demo payment, return and see due reduced.
- **Source continuity:** every result has a source reference; back returns to active report filter and selection.
- **Visual consistency:** same table roles and controls as Products/Party Ledger; no unrelated navigation pills; no cloned POS/Purchase cart.
- **Mobile:** 390px view retains core action and understandable numbers without accidental horizontal clipping; 768px/1440px layouts similarly checked.

## 13. Open decisions / user approval gate

This document makes the following **proposed default calls**, not claims of formal approval:
- Reports six tabs; Basic shows useful simplified Advisor, Premium shows simulations and full opportunities.
- PO is part of Purchases tabs, not a top-level module.
- One purchase has one source PO in the first UI design; one PO allows multiple partial purchases.
- PO confirmation means **Ordered**, not 'Supplier received message'; sending status is tracked separately.
- Reports' stock planner owns Saved Plans; Purchases owns POs and actual transactions.
- Proposed demo fixture stores consistent cross-module state and resets to seeded sample data when requested.

**Requested sign-off:** approve this UI-only architecture before code is written. The following Superpowers deliverable after approval is a file-specific implementation plan in `docs/superpowers/plans/2026-10-26-hisabiq-reports-connected-workflows.md`, with independently testable slices and exact interfaces. Backend implementation is explicitly out of scope.

## 14. Source references

- GitHub: `https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/AGENTS.md`
- GitHub: `https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/src/pages/Reports.tsx`
- GitHub: `https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/src/reports/catalog.ts`
- GitHub: `https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/src/reports/model.ts`
- GitHub: `https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/src/pages/Purchases.tsx`
- GitHub: `https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/src/pages/PurchaseEditor.tsx`
- GitHub: `https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/src/components/purchases/PurchaseCart.tsx`
- GitHub: `https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/src/components/parties/PartyDetail.tsx`
- GitHub: `https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/docs/ui/2026-10-24-table-typography-contract.md`
- GitHub: `https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/docs/ui/transaction-cart-design-contract.md`
- GitHub: `https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/docs/superpowers/specs/2026-10-24-report-workspace-design.md`
