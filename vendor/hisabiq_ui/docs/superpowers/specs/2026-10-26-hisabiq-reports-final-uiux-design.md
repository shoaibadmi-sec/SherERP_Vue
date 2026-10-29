# HisabIQ Reports — canonical UI/UX design specification

**Date:** 26 October 2026, Asia/Dhaka. **Status:** Consolidated specification for review; documentation is authorized, Reports implementation is not. **Scope:** Complete interactive frontend demo and connected workflows; no backend, authentication service, database, payment gateway, production accounting or message delivery.

Read the [Reports index](../../ui/reports/README.md), [implementation plan](../plans/2026-10-26-hisabiq-reports-uiux-implementation-plan.md), [component mapping](../../ui/reports-magicpatterns-github-component-mapping.md) and [QA matrix](../../ui/reports-uiux-workflow-test-matrix.md) together. This specification replaces conflicting Reports guidance in the five archived 26 October proposals and the 24 October design/plan; their useful source evidence remains available. Approval of this documentation does not imply that proposed product choices or UI implementation have been approved.

## 1. Evidence, authority and settled direction

GitHub `main` was inspected at `79c51fdbbc8ce47364488127a1e2c5762f6526d9`. Open [PR #206](https://github.com/shuvodelux-commits/hisabiq_ui/pull/206), branch `docs/complete-hisabiq-design-guide-20261026`, already supplies the current guide and library at `6758e2cf0b6a68f80563918e6f8168928e0529ab`. This documentation branch is stacked on that commit. It does not duplicate or reimplement #206. Merge #206 first when separately approved, then retarget this PR to main and recheck the diff.

The live [Magic Patterns editor](https://www.magicpatterns.com/c/t6q3mxi6nhuak3qjvx8cwn) was read at active artifact `5b1f6ae5-d2c4-4e7b-8756-b74ffdb8f872`. Its current **HisabIQ · Visual component library** and guide are **v2.2**, superseding the brief's v2.1 reference. The attached ZIP is an older starter; it lacks the later Reports, library, Settings and SaaS work. The guide's embedded older artifact is historical provenance, not the current capture. See the [source and verification record](../../ui/reports/2026-10-26-consolidation-review.md).

Authority is resolved by concern:

| Concern | Binding source |
| --- | --- |
| Product scope and approved decisions | Current user instruction, then the latest explicit earlier user decisions |
| Controls, typography, tokens and specimen behavior | Current Visual component library; [v2.2 guide](../../ui/HISABIQ-DESIGN-GUIDE.md), repository AGENTS and narrower binding contracts; actual shared source |
| Reports page composition and chart vocabulary | Live Magic Patterns `pages/Reports.tsx`, Basic/Premium views; adapt incidental prototype defects to the library |
| Implementation and working functionality | Actual GitHub code, existing report engine, details, domain editors and source safeguards |
| Older proposals | Evidence only when compatible with this specification |

The chosen direction follows the user's brief: **Magic Patterns presentation, actual HisabIQ components, existing report functionality, one coherent demo record model and canonical domain actions.** Literal prototype transplantation, keeping two reporting engines, replacing working details, and a generic dashboard are rejected. KISS means easy frequent tasks, progressive assumptions and one clear next action; it does not justify deleting useful Premium information.

## 2. Requirement and decision inventory

| ID | Requirement | Delivery / proof |
| --- | --- | --- |
| R01 | Visual library v2.2, actual component reuse, no competing primitives | Guide gate; mapping; all UI tasks |
| R02 | Preserve five Basic, five Premium and Report library destinations | Tasks 3–4; NAV matrix |
| R03 | Preserve all 34 report IDs, seven readiness entries, filters/output/preferences | Tasks 3–4; LIB/OUT tests |
| R04 | Shared nested Report Details from every relevant record and analytical claim | Task 4; DET matrix |
| R05 | Realistic linked demo records, projections, ROI and responsive state changes | Tasks 1–2, 5–9; DATA matrix |
| R06 | Multi-product/supplier planner, units, packs, editable costs and budget | Task 6; BUY matrix |
| R07 | Saved plans → supplier POs inside Purchases | Tasks 6–7; PO matrix |
| R08 | Partial receipts → existing PurchaseEditor → review → stock/ledger/reports | Task 8; REC matrix |
| R09 | Correct cancellation, variance, correction/return, retry and source linkage | Tasks 2, 7–8; REC/SAFE matrix |
| R10 | Dues, pricing, suppliers, expenses, slow stock, forecast and customers actions | Tasks 5, 9; ACT matrix |
| R11 | English/Bangla/bilingual, themes, devices, keyboard, chart alternatives, motion | All UI tasks; VIS/A11Y matrix |
| R12 | Separate branch/PR, traceable history, honest verification; no implementation now | This documentation PR |

Resolved contradictions:

| Previous guidance | Resolution |
| --- | --- |
| GitHub Reports is the visual target | Superseded; preserve its behavior under Magic Patterns composition and current library styling |
| Never use synthetic history or ROI | Production restriction remains. Explicitly labeled, interconnected demo history/ROI is authorized now |
| Six primary tabs; later seven plus five nested Premium tabs | Neither regrouping is approved. Preserve the current 11 destinations and rail as the initial implementation reference |
| Four Overview KPIs only | Preserve the current eight-tile composition; do not delete metrics to simplify layout |
| v2.1 synchronization absent everywhere | v2.2 exists on #206, absent from inspected main. Reuse that dependency; do not start another guide-sync implementation |
| Prepare PO / upgrade success toast | Success requires a created demo record; otherwise show an honest preview or unavailable explanation |
| Safety means days in one plan and base quantity in another | Separate `safetyDays` from existing base-unit safety; explicit conversion, §8 |
| Receiving and creating a purchase both increase stock | Only confirmed linked purchase commit projects accepted stock once, §9 |
| New guide or library names imply installed wrappers | Reuse real named components; prepared specimens and missing domain surfaces are labeled gaps |

## 3. Audience, information architecture and navigation

Audience: Bangladesh shop owners, often one operator, using keyboard, tablet or inexpensive phone, with limited software experience. The main loop is **understand → inspect evidence → adjust decision → act → return and see the result**.

Preserve these live Magic Patterns IDs and visible destinations:

| Group | ID | Label | Main question |
| --- | --- | --- | --- |
| Basic | overview | Overview | How is the business doing? |
| Basic | sales | Sales & profit | What sold and what earned? |
| Basic | stock | Stock | What is available or at risk? |
| Basic | dues | Dues | Who owes and who must be paid? |
| Basic | money | Cash & expenses | Where did money go? |
| Premium | advisor | Advisor | What should I do next and why? |
| Premium | profit | Profit insights | Where can margin improve? |
| Premium | buying | Smart buying | What should I purchase within my budget? |
| Premium | cashflow | Cash forecast | What might cause a cash shortfall? |
| Premium | customers | Customers | Who needs collection or follow-up? |
| Library | library | Report library | Where is the detailed report? |

Observed live rail: Premium plan places five Premium entries first, then Basic, then library; other plans place Basic first with Premium previews. Initially preserve that presentation and all destinations. Use Party Ledger text tabs, not pills. Keep the active tab visible, show a subtle overflow affordance, support Arrow/Home/End and associated tabpanels. On phones, keep the scrollable rail; a compact searchable destination chooser may supplement it after review, never hide destinations.

**Default choice:** The 24 October repository spec records the user's Business overview default. Retain Overview as first entry behavior for GitHub, while documenting that the live Premium prototype currently starts at Advisor. Automatic last-view resume, Premium-first default and grouped navigation are proposed alternatives requiring review; do not infer approval from prototype code.

Use existing `react-router-dom` HashRouter and `/app/reports`. Retain old `?report=<ReportKey>` links and saved views. New URL parameter `screen` selects the eleven surfaces; `screen=library&report=...` selects the detailed report. When only legacy `report` is supplied, open that library report, except `report=overview` which opens Overview. Invalid screen/report falls back safely. Keep `from`, `to`, filters, comparison and columns compatible with `paramsForReport`/`filtersFromParams`; extend rather than discard them. Frequent search/sort changes replace history; deliberate navigation creates a history entry.

Basic/Premium here describes presentation. Existing GitHub copy says Medium and Premium share reports; the prototype visually gates Premium. Preserve the raw catalog and demo all states without changing commercial rights. Entitlement mapping, prices and production access enforcement remain a separately proposed business decision. Feature hidden, permission denied, plan preview and missing data are distinct states; CSS hiding is not security.

## 4. Screen composition and analytical interactions

All screens share PageHeader → underline rail → period/as-of and active filters → compact KPIs → principal chart/decision panel → supporting tables. Reports and linked Planner/PO/Purchase headers show a visible translated **Demo data** status; modeled ROI/forecast panels also say illustrative. Do not hide sample provenance only in a tooltip or repeat warning badges in every cell. Put **Reset demo data** under More, with confirmation explaining the linked records/drafts it resets. Reuse ReportToolbar, shared dates, saved views and columns. Ordinary advanced filters collapse; active chips and Clear stay visible. Snapshot stock/dues show **Current position as of…**; the sales-demand lookback never pretends to reconstruct historical balances.

| Screen | Preserve visual content | Required interaction |
| --- | --- | --- |
| Overview | Eight KPIs, desktop 4×2; Sales/profit area chart ~250 px; attention panel; compact product/expense evidence | KPI/series/attention item opens contributing evidence; period changes the corresponding metrics |
| Sales & profit | Trend, category/product/customer contributions, returns/discounts, cost coverage | Open source invoice/product/customer; compare previous equal-length period; missing costs remain unknown |
| Stock | Stock value/cover, low/slow/expiry stock and replenishment evidence | Product/lot/movement details; selected item → Planner |
| Dues | Receivable/payable and collection focus | Party/invoice evidence → correct role payment dialog; invoice age is not overdue without terms |
| Cash & expenses | Cash/Bank/MFS, expense and category panels | Source split accounts and expenses; avoid counting transfers as operating inflow/outflow |
| Advisor | One Ink/Mint summary focal card; health tiles; initially three priority recommendations; expandable Sources/Calculation | Four-part narrative and supported action; reviewed/started/resolved lifecycle |
| Profit insights | Income-to-profit bridge, revenue/margin scatter ~230 px, opportunities/product table | Point → product plus sales/cost evidence; editable what-if pricing; historical cost unchanged |
| Smart buying | Budget/remaining KPIs, dense ranked replenishment, supplier subtotals, slow stock | Edit and save actual plan records; create linked PO drafts |
| Cash forecast | ~260 px composed cash area plus in/out bars, buffer/scenario, weekly table | Recompute assumptions, inspect projected vs recorded sources; saving scenario never posts cash |
| Customers | Purchase cadence, concentration, due/risk and inactivity table | Party ledger/invoices, collection or follow-up draft |
| Report library | Existing 34 entries, seven groups, favorites, saved views, filters, table/detail/output | Existing engine remains single detailed-report engine; discard older Magic Patterns ReportsWorkbench engine |

Charts use installed Recharts. Theme-aware series, 11–12 px annotations, labeled axes/units/period, non-color legend cues and full values in details. Every relevant point, bar, segment or KPI aggregate resolves to a source set, not only a destination tab. A nearby accessible table/list or explicit “View records” control supports keyboard and touch; hover-only SVG interaction is insufficient. Do not nest an InfoTip button inside a clickable KPI button. Filter/chart/table totals must reconcile. Forecast uses 30-day current prototype behavior initially; 7/90-day horizons are proposed later additions, not inspected functionality.

## 5. Common Report Details and context preservation

Extend `src/components/reports/ReportDetails.tsx`; retain its current `row`, `onClose`, `onPrint` contract and nested `ReportRow.children` trail. A typed evidence adapter can supply additional facts without replacing the existing record surface. Relevant customer, supplier, product, invoice, purchase, expense, payment, finance, stock, chart and recommendation details must be accessible from each corresponding Basic/Premium screen.

Details shows relevant labeled facts, status, bilingual helper/tooltips, as-of/data basis, calculation inputs when relevant, contributing rows, nested child→Back, **Print details**, **Open source module**, and Close. Print the current child, not the initial parent. Facts are read-only; edit actions open the canonical domain editor. Unknown/missing fields have an explanation, not a fabricated value or irrelevant empty grid.

Context includes screen/report ID, period, all filters, sort/direction, columns, page/pageSize, selected insight/entity/chart series and point, detail trail and scroll anchor. Closing restores the connected trigger and exact workspace context. If the trigger disappeared, focus the report heading/result summary. Preserve both outer document scroll and internal table/detail scroll as relevant.

Opening a source closes the evidence dialog and passes exact source identity plus validated internal `returnTo`. A search `?q=` alone is not record opening. Destination resolves the source ID and opens its canonical detail/editor; missing/reversed/deleted/inaccessible source shows reason and return action. Never route to another tenant's source or accept external return URLs. Back/Return restores context after reload where persisted; a missing context safely returns to Reports. Guard dirty drafts with Save Draft & Continue / Discard & Continue / Stay. Do not create cascading financial modals; use one domain workspace with its normal short Quick Add overlay.

## 6. Shared frontend demo architecture

Preserve current stores and calculations; do not copy `prototype/DemoStore.tsx` or maintain a report-only transaction universe. Introduce a small demo command/selector boundary that adapts current preview stores and owns the missing plan/PO/receipt/scenario/insight state, plus shared offer/follow-up/request records needed for the specified actions. Product offers currently live in Products page-local state; move that ownership behind the shared adapter so navigating away does not erase a saved action. It must make connected module projections agree, with one observable revision after a successful command. Current purchase arrays are imperative; Reports lacks purchase/party subscriptions and created purchases do not appear in purchase stock movements. Sales preview alone does not project all stock/cash/ledger effects. These are implementation gaps, not guarantees to rely on.

Conceptual provider contract is fixed for planning; Task 1 defines exact TypeScript types:

- `getReportsDemoSnapshot(scope)` returns stable immutable state for demo tenant/actor, dataset version/as-of, revision and entities/projections.
- `subscribeReportsDemo(scope, listener)` notifies once after an accepted command batch.
- `dispatchReportsDemo(scope, command)` validates current revisions, applies one coherent in-memory change and returns a success/result reference or a typed error. UI components never mutate projection arrays directly.
- `resetReportsDemo(scope)` restores the deterministic story after confirmation; no production or other business data is touched.

Transactions use existing money/unit/source helpers. Money is integer paisa at calculations/allocation boundaries; retain fractional base quantities to product precision and existing conversion snapshots. Do not round every fractional unit cost prematurely; use the existing checkout/rounding allocation and assert aggregate totals. Aggregate quantities only across compatible normalized units; never sum different products' feet/boxes/pcs into a single “units/day” KPI. Use item count, money, or explicitly grouped compatible quantities. No new state/data/router library or dependency is required.

Every source includes stable ID, tenant scope, business date, source references and revision. Analytical `DataBasis` is `demo-recorded | demo-scenario | incomplete | unavailable`, with as-of/coverage/assumptions and source IDs. Deterministic synthetic history may generate coherent invoices/payments/lots and estimates for this demo. Do not append it silently to future production data. Missing historical cost is never zero or current product cost. Seven readiness reports retain their current IDs and missing-source explanations; any sample financial statement is explicitly switched to a separate simulated example, not labeled implemented production accounting.

Persist missing workflow records and action deduplication in one versioned demo envelope scoped by tenant; preferences/Advisor resolution additionally scope actor. Store schema version, dataset version, revision and stable operation keys; recover corrupt/unavailable storage with an inline warning and preserved session state. Complete the command before announcing success, and distinguish “saved for this session” if persistence fails. Freeze `asOf` in fixtures to 2026-10-26 Asia/Dhaka; production uses existing business-day helpers. No claim of cross-device/server durability. Existing stores' persistence boundaries must be aligned for connected workflows, not only persist POs while losing their linked purchases. Reset clears this demo story plus its action state coherently.

Future backend integration replaces this boundary and domain mutation adapters. Screens consume domain results; no Worker/Hyperdrive/DB scaffolding or live API implementation belongs in these tasks.

## 7. Advisor and other insight-to-action contracts

Each recommendation answers **What happened? Why does it matter? What should I do? How will it help?** Show source records, relevant inputs/calculation, coverage and an illustrative benefit/range. Never sum overlapping estimated benefits into a guaranteed return. Avoid unsupported confidence percentages. Price/supplier comparisons use compatible base units and explicitly stated landed-cost assumptions.

Lifecycle: `new → reviewed → action-started → resolved`; snoozed/dismissed are reversible personal states. Opening evidence is reviewed; saving a plan is action-started; appropriate linked source change reevaluates resolution. “Mark resolved manually” requires a reason and stays distinguishable from observed demo outcome. Scope by tenant/actor/stable insight ID/source version. Materially changed source evidence resurfaces an applicable insight. Maximum three priority recommendations initially; Show all retains others. Priority uses urgency, materiality, evidence and actionability; no duplicate card spam.

| Trigger | Canonical owner and action | Demo follow-through |
| --- | --- | --- |
| Customer due / credit risk | PartyDetail + PartyPaymentDialog / existing allocation flow | Create linked payment and invoice allocation; reduce customer due and increase the receiving Cash/Bank/MFS balances; report and ledger agree |
| Supplier payable | Role-correct Party payment/source-purchase flow | Reduce supplier payable and cash source once, retain purchase/payment refs |
| Supplier cost increase | Purchase-price report → supplier/purchase details → pricing review | Normalize comparable cost; preserve quoted/order costs and old sale costs |
| Thin margin / price opportunity | Products existing price/offer editor | Preview delta, explicit save affects future price only; no retroactive sale rewrite |
| Slow or expiring stock | Product Inventory/lot and existing offer workflow | Save eligible offer/follow-up draft, preserve expiry/serial constraints; no unsupported medicine promotion |
| Expense spike | Existing Expenses source/detail/correction | Changed expense and payment projection reconcile; no expense/cash double counting |
| Cash buffer risk | Saved what-if scenario plus linked collection/purchasing action | Scenario edits forecast only; separate confirmed payment/purchase command changes records |
| Inactive customer | Customer ledger/Sales history → follow-up draft | Draft/task recorded; no SMS/email/WhatsApp delivery claim |
| Return/warranty/bundle issue | Existing source Return/Warranty/Bundle view | Source-specific limits and one-product bundle behavior remain intact |

**Supplier comparison loop:** Open source purchase/quote evidence for the selected product; compare frozen base-unit price, explicit landed-cost assumptions, supplier pack/minimum quantity, lead time and evidence date. Show unknown/old terms rather than rank them as proven cheapest. Choose supplier and quantity → prefill the same Planner line's supplier, buying unit, expected unit cost and source references → review/save plan → supplier PO. A split across suppliers creates separate stable plan lines whose combined quantity is explicit. Return restores the comparison and selection. Choosing an alternative never changes product master prices, old purchase costs or confirmed PO terms automatically.

Related dependency creation uses actual searchable selectors and inline “+ Add new”; short shared Quick Add, duplicate check, immediate selection and original draft preservation. No new report-specific payment/product form. Simulated upgrade/support requests require a visible persisted demo request record; otherwise the action is an explanatory preview. Shared `offers`, `followUps` and `requests` retain their source refs and draft/status history across navigation/reload and are cleared or reseeded coherently by confirmed reset; no external send is implied.

## 8. Purchase Planner and saved plans

Entry: Smart buying, Advisor, Stock/low-stock source, Product context or library `reorder`. Keep evidence/context. Full-page planner fits the Reports workspace; Purchases owns orders and actual goods entry.

The Products-style editable list contains selection, product/name/helper, usable on-hand, demand/lookback, lead/review/safety, eligible incoming PO, projected cover, suggested and chosen quantity, buying unit/compound values, supplier/pack, expected unit cost/total, reason and More. Phone prioritizes name, selected quantity/unit, amount and status; expandable detail keeps all fields accessible. Add/remove/select/skip/search/filter/sort multiple products; change supplier/unit/expected cost; view source; restore suggestion per line. Recalculate is explicit and does not overwrite manual edits without a diff confirmation.

Define quantities in frozen base units:

`safetyBaseQty = safetyMode === 'days' ? dailyDemand * safetyDays : safetyBaseUnits`

`targetBaseQty = dailyDemand * (leadDays + reviewDays) + safetyBaseQty`

`shortfallBaseQty = max(0, targetBaseQty - usableOnHandBaseQty - eligibleIncomingBaseQty)`

`suggestedBaseQty = ceil(shortfallBaseQty / supplierPackBaseQty) * supplierPackBaseQty`

Usable on-hand excludes separately known reserved/unusable lots once, never twice. Eligible incoming is outstanding confirmed, noncancelled PO quantity expected within the planning horizon; late/unknown delivery is displayed separately, not assumed available. Draft plans/POs are “already planned” warnings, not incoming stock. No-demand, negative stock, unavailable stock or unknown cost show distinct states; zero demand does not cause infinite cover or arbitrary demand. Missing forecast evidence offers an explicit assumption, not invented precision.

Existing `PurchaseAssumptions.safety` is **base units**; preserve old behavior through an adapter, not reinterpret it as days. `pack` is supplier-specific base quantity, independent of displayed purchase unit. Default soft budget shows Budget left / Over budget. An explicit Apply budget proposal shows selected changes and requires acceptance; no silent quantity reduction. Unknown expected cost and explicit zero cost are different planner states. Current PurchaseEditor/source validation requires positive costs and purchase totals: zero-cost/free lines may be kept as labeled planning notes but cannot be confirmed into a PO/receipt in this scope; explain the restriction and let the user defer the line, never substitute a fake positive cost. Zero-value purchase/return support is a separate proposed domain extension. Hard budget mode is proposed and defaults off.

Chain quantities use configured conversion profiles and keep the approved inline family (`1 CT 2 BOX 3 PCS`, like `2 box 5 pcs`) in one 36 px joined control where it fits. Single-unit products remain simple. Returns always expose the chain. Narrow layouts may give the quantity assembly its own row/scroll region; do not stack one large field per unit or change arithmetic for fit. Preserve entered quantities, displayed/price unit, factors and per-unit price semantics. Quantity and cost validation must support intermediate chain units; current source validator only handles base/alternate and must be extended before this journey is claimed complete.

Saved Plan supports save/reopen/rename/duplicate/revise/archive, source insight and version, manual override markers and explicit refresh. Stable plan/line IDs survive edits; converted allocations point to PO lines. Status is derived: draft (not converted), partially converted, converted, archived. Revision preserves already converted allocations; reconvert only remaining selected quantity. Neither plan nor estimate changes stock, cash or supplier payable.

## 9. Purchase Orders, receipts and actual purchase

Recommended initial simplification: one supplier per PO; one PO may create many actual purchases; one actual purchase originates from one PO. Multi-PO consolidated receipts are deferred. This is an implementation recommendation recorded for review, not a claimed earlier user choice.

Proposed canonical URLs inside the current workspace: `/app/purchases?tab=orders`; full-page detail/editor `/app/purchases?tab=orders&po=<id>`; new draft adds `mode=new`; receiving uses existing `/app/purchases/new?receipt=<id>`. These query states are **new**, not currently recognized. Extend Purchases tab parsing, `src/navigation/erpNavigation.ts`, resolver and route tests; never create a disconnected sidebar purchasing system. Existing purchases/return/return-history links remain valid.

### 9.1 Create, edit and confirm orders

From a saved plan, grouping preview shows **N suppliers → N draft POs**, selected amounts, missing suppliers and exclusions. Missing supplier/unit/cost invalidates only affected lines but cannot silently disappear; user assigns/fixes or explicitly excludes them before confirmation. Supplier Quick Add preserves the plan. Stable conversion command ID prevents repeated Create from generating another PO for the same allocated quantities. Unsaved edits are saved/reviewed before conversion.

PO list: reference, supplier, created/expected date, items, expected total, received progress, status, More; search/date/supplier/status filters, column preferences and real sample print. PO detail/editor is full page: source plan, supplier/date/reference/notes, PurchaseCart family for quantity/expected price/unit, totals and optional terms. No actual payment panel; a planned deposit is a term only. Lot/serial/expiry may be expected notes, but actual tracking belongs to received goods.

Canonical display states: **Draft → Ordered → Partially received → Received**; **Cancelled** if no committed receipt, **Closed** if accepted history exists and remainder is intentionally closed. “Placed” in older plans is an alias of Ordered. Expected-date lateness is a warning; printing/ordering is never “sent.” Draft deletion is allowed only before order confirmation/committed receipt; a plan-generated draft must explicitly release its plan allocations, retaining conversion history, before deletion. Reconvert released quantities through a new operation, while retrying the original conversion never recreates deleted drafts. Confirmed-term revision requires reason/history; supplier cannot change after receipt. Confirmed unit profiles remain frozen; a conversion change needs explicit replacement/revision of unreceived lines.

Cancellation/remainder closure retains committed purchases and their ledger effects. Closing an unreceived remainder removes that incoming commitment only. Overdelivery defaults blocked; “Accept extra” requires an explicit PO revision with extra base quantity, reason and reviewed variance before committing the receipt. Original terms remain in revision history. Do not merely bypass a quantity bound.

### 9.2 Receive into existing PurchaseEditor

Receive on Ordered/Partial PO creates a **draft receipt**, with no stock/cash/ledger effect, then opens the existing PurchaseEditor with a new typed receipt seed. Do not misuse `initialPurchase`, which currently means correction of a completed source. Seed supplier and outstanding lines, source PO, original units/expected costs, and return context. Current supplier lock remains appropriate.

Show **Ordered / Previously received / Receiving now / Remaining** per line and **Expected / Actual / Variance** costs. User changes actual quantities/unit, invoice/date/reference, actual costs, lot selling prices, discount/rounding, batch/manufacture/expiry, serials, applicable warranty metadata, notes/attachments and split payments through PurchaseCart/PurchasePaymentPanel. Warranty capture not already available is a named domain gap to extend; never pretend a field is supported. Missing actual tracking blocks completion where required, with actionable errors. Removing a line excludes it from this receipt, not the PO.

Canonical 48 px Review purchase → TransactionReviewDialog → confirm performs one demo commit. Commit revalidates scope, PO/source revisions, remaining quantities, conversions, required tracking, currency and payment splits. A stable operation key maps retries/double-click/back/refresh to the same result. Conflicting concurrent receipt fails with the draft intact and a diff/reload action.

Commit creates linked purchase/receipt/allocation, stock lots and movements, supplier purchase/payment projection and payment-source effects, and advances the shared snapshot **once**. It cannot first post at Receive and then post again at Purchase. Save/Cancel/failed review do not post. Preserve `planId`, `planLineId`, `poId`, `poLineId`, `receiptId`, `receiptLineId`, `purchaseId`, source revision, entered unit map, frozen conversion, accepted base quantity, original expected and actual cost, allocation and operation IDs. Source fields must be stored on canonical purchase/receipt lineage, not URL state alone.

Successful return opens PO detail with purchase and supplier/product links; Report Return restores the originating workspace. Receive remaining stays available where appropriate. PO expected total is not overwritten with actual price; show both and price variance. Future restocking recommendations subtract eligible open commitments, not old planned quantities.

### 9.3 Fulfillment, correction and supplier returns

For each line, `deliveredBaseQty` comes from committed, nonreversed accepted receipts with eligible source corrections; `cancelledBaseQty` is explicitly closed remainder; `remainingBaseQty = max(0, orderedBaseQty - deliveredBaseQty - cancelledBaseQty)`. Drafts never contribute. Track supplier-returned quantity separately and display retained stock = delivered minus returned, while preserving historical delivery evidence.

**Proposed return policy:** A supplier return reduces stock/payable or creates refund/credit through the source return workflow; it does **not** silently reopen expected incoming quantity. A replacement commitment requires an explicit order revision/new linked PO. Reversing an erroneous receipt or correcting its accepted quantity does recompute fulfillment; reopening a closed commitment requires explicit confirmation. This keeps receipt mistakes distinct from business returns.

Existing source correction requires permission, revision/date/reason and impact preview; it currently blocks after later payments/returns. Existing `sourceReturnable` blocks serial/batch/expiry records. These restrictions remain visible until Task 8 adds the required tracked allocation/correction behavior. The final connected demo is incomplete while a required tracking workflow is merely disabled. Never route around guards, directly edit ledger projections or delete completed purchases. Corrections/reversals apply compensating deltas and rebuild affected stock/ledger/cash/PO views once, with audit history and retained original PO terms.

## 10. Concrete, separate demo fixtures

**Fixture A — price variance and partial delivery:** PO six pipes ×20 feet at ৳1,200/pipe = ৳7,200 expected. Receive four pipes (80 feet) at ৳1,250 = ৳5,000 actual; pay ৳2,000 Cash and ৳1,000 Bank → payable ৳2,000, cash sources decrease ৳3,000 total, remaining two pipes/40 feet. Receive final two at ৳1,200 = ৳2,400, unpaid → cumulative accepted 120 feet, actual spend ৳7,400, payable ৳4,400, price variance ৳200, no duplicated stock. Cost per base foot uses frozen conversion. Start stock/payable separately defined by fixture and assert deltas.

**Fixture B — planner arithmetic:** on-hand120 feet, demand 20/day, lead 8 days, review 1 day, safety 2 days → safety 40, target 220, incoming0, shortfall 100; pack 20 feet → five packs/100 feet. Receive40 then60 → on-hand160 then220 with no other fixture movements; PO remaining60 then0. This is a separate reset story from Fixture A, not the same quantities. Add a chain fixture `1 CT=12 BOX; 1 BOX=20 PCS; 1 PCS=120 feet` and confirm intermediate BOX cost unit, fractional feet, frozen history and serial whole-unit limits.

**Fixture C — collection:** seeded invoice due ৳5,000; collect Cash ৳1,000 + MFS ৳500 → remaining due ৳3,500; Cash increases ৳1,000 and MFS increases ৳500; linked invoice/payment/customer ledger and money report update once. A scenario promising collection changes forecast only until this payment is confirmed.

## 11. Visual library and responsive contract

| Element | Required value / behavior |
| --- | --- |
| Fonts and digits | Geist / Hind Siliguri; proportional digits; no font-mono or table tabular-nums/tnum |
| Input/textarea values | **13 px/20 px, 400**, Ink600, regular muted placeholder at all breakpoints; no inherited bold/black values |
| Table roles | Data13/20, headings 12/16, helpers/badges11/16; actual Table or `data-erp-table`, helpers identified |
| Controls | 36 px ordinary controls; standalone icons36×36; 48 px only marked transaction review/completion `data-erp-workflow-action="complete"` |
| Navigation | 13 px text, one 2 px primary underline; MotionTabList/Indicator plus actual keyboard handlers, no filled tab buttons |
| Geometry | Fields8 px radius, buttons10 px, panels/dialogs12 px; panel body16 px; label gap6 px/helper4 px; shared spacing scale |
| Palette | Existing Ink/Teal/Mint and semantic success/warning/danger/info tokens; chart theme tokens; color plus label/icon |
| Motion | `MOTION_MS`: hover110, active190, stepper120, sidebar220, tab200 ms; existing shared dialog/veil timing (guide 220/180 ms); no delayed money/focus |
| Reduced motion | Static underline, immediate stable data/chart update, no slide/financial count-up |
| Overlays | Actual Dialog/Tooltip/select portals, viewport margin, scroll lock without shift, owned Escape and return focus |

Use actual Party role action definitions; Customer collection, Supplier payment and Owner/Lender/Borrower/Vendor operations are determined by relationship and domain capabilities, not amount sign. The library's Party specimen is a dependency, not permission to redesign Party desktop.

At1440×900 retain current max-width1440 composition, rich compact KPI grids and two-column panels. At1024×768 and768×1024 use compact desktop-like transaction family and two-column KPIs where legible; preserve the existing purchase cart breakpoint behavior. At390×844 and360×800 use two KPI columns where content fits, single chart/panel stack, priority table columns plus Details/More, full-page complex editors and internal table overflow. Test normal reflow320 CSS px and200% text zoom. No global44 px row minimum, no body overflow, no font shrinking to fit Bangla. Ordinary36 px controls retain suitable spacing/touch affordance. Multi-unit input must stay compact and readable without masking units.

## 12. States, output, quality gates and approval boundaries

Cover default/hover/focus/selected/disabled/read-only/loading/error/success where applicable; loading geometry stable, no fake live values. Separate no data, filtered-empty, insufficient history, unknown cost, unavailable source, denied permission and locked preview. Keep manual input/drafts on failure. Inline errors identify correction; destructive/correction review shows impact and reason; toast follows a visible result. Test long Bangla, huge amounts, negative stock, zero/fractional values, corrupt URL/storage, stale source, popup blocked and repeated command.

Existing filtered CSV/print pipeline must output the full filtered set, selected columns, period/basis and matching totals, beyond one pagination page. Source details prints current selected child. Print is light/readable in both themes, Bengali fonts intact; blocked popup gives recovery. Sample PO/forecast/ROI output is clearly marked Demo/illustrative. No export bypasses unavailable/permission state.

Quality gates and exact scenario IDs live in the QA matrix: synchronized guide; reference composition; component state integrity; original Details regression; connected partial-receipt demo; language/theme/motion/accessibility; focused automated checks and fresh independent review. Implement in dependency order from the plan. Do not claim rendered parity, app test success or production correctness from this documentation/source review.

**Proposed choices still requiring product review before their implementation:** grouped navigation/last-view resume; final commercial entitlement mapping; one-PO-per-purchase scope; supplier-return replacement policy; optional hard budget and7/90-day forecast expansion. Baseline tasks can use the explicitly stated defaults without asking again about settled styling. Any material alternative must be recorded as proposed, with consequences. This task opens documentation for review; it does not authorize UI code or PR merge.
