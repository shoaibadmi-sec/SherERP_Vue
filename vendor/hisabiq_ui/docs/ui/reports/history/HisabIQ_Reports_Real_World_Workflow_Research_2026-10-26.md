> Historical research/proposal — retained in full for evidence. Conflicting implementation, visual/navigation and approval instructions are superseded by the [canonical26 October Reports specification](../../../superpowers/specs/2026-10-26-hisabiq-reports-final-uiux-design.md). This is not the current implementation plan.

# HisabIQ Reports — Evidence-Based Workflow Research & Superpowers Decision Review

**Date:** 26 October 2026  
**Status:** Research and design proposal only; not approved for implementation. No code or GitHub changes.  
**Scope:** HisabIQ UI Reports, Business Advisor, future production data integration and niche Bangladesh SMB workflows.

## Research provenance and limitation

- **Mobbin:** Search attempted using the connected Mobbin plugin. It refused with the explicit message: "Mobbin MCP requires a paid plan. Upgrade at https://mobbin.com/pricing to continue." Consequently no Mobbin screens or flows were inspected and no Mobbin UI claims are made here.
- **GitHub verified (read only):** `shuvodelux-commits/hisabiq_ui`, `src/pages/Reports.tsx`, `src/reports/catalog.ts`, `src/reports/model.ts`, `src/reports/useReportData.ts`, `src/reports/guidance.ts`, `src/components/reports/ReportOverview.tsx`, `ReportToolbar.tsx`, `ReportDetails.tsx`, and `docs/superpowers/specs/2026-10-24-report-workspace-design.md`.
- **Existing baseline:** 34 catalog entries, 27 working **frontend-preview** views, seven explicitly unavailable/source-readiness entries, shared filtering/print/CSV/saved views/drill-down/planner. These are not a live production ledger.
- **Magic Patterns:** prior connected prototype review found five Premium insight themes and synthetic sample transaction history; use concept patterns, not demo records or stubbed actions.
- **External independent evidence:** product documentation from Shopify, Odoo, Square, QuickBooks, Zoho; these are NOT Mobbin observations or proof of live UI pixel layouts.
- **Bangladesh market needs below are design hypotheses informed by HisabIQ's target merchant segments and product requirements, not statistically validated field research.** Conduct moderated task tests with target merchants before asserting market suitability.

## Executive direction

**Report → Insight → Evidence → Reviewable action → Outcome → Learning**. Keep detailed accounting reports as a searchable library. Show only three important business decisions at a time. Each recommendation must say what happened, why, what to do, and how it may help; every numeric assertion must have a recorded source and a basis.

Do not merge the existing GitHub report engine with the Magic Patterns mock report engine. Keep one reporting model, add an adapter/insight evaluator and narrow integrations to existing source modules. Never auto-post a transaction from reporting.

## Approaches assessed — proposed, not approved

| Approach | Advantages | Trade-offs | Disposition |
|---|---|---|---|
| A. Bigger report library with more charts | Fastest superficial expansion | Users still do not know what to do | Reject as main strategy |
| B. **Action-first Advisor + unchanged deep library** | Simple landing; preserves complex reports; reusable actions | Requires reliable source linking and decision-state tracking | **Recommend** |
| C. Fully guided step-by-step daily assistant only | Easy initial experience | Slow for experienced merchants; obscures advanced analyses | Offer optional quick checklist, not sole navigation |

## What to TAKE, ADAPT, DROP

| Pattern | Evidence | Decision | HisabIQ-specific treatment |
|---|---|---|---|
| Summary metric → detailed report | Shopify analytics | TAKE | KPI is a deep link; keep prior filters and history |
| Product sell-through and stock cover | Square; Shopify | TAKE | Account for negative stock and out-of-stock distorted demand |
| Inventory ageing | Zoho Books | TAKE | Actual receipt lots and batch expiry; never use a product's edit date |
| Manual replenishment proposals | Odoo | TAKE | Purchase editor draft; never automatically post |
| Stock lead time/pack size | Odoo | TAKE | Supplier/vendor-specific; normalize multi-units |
| Cash-flow hypothetical scenarios | QuickBooks | TAKE | Separate planning state from accounting ledgers |
| A/R ageing | QuickBooks; Zoho Inventory | ADAPT | Distinguish actual contractual due date from invoice age; quick Party Ledger and call/SMS review |
| Report filter builder | Shopify | ADAPT | Advanced drawer only; ordinary default = date + search |
| Premium advisor from Magic Patterns | Prototype | ADAPT | Rules and transparent source evidence, not confident fictitious ROI |
| AI-generated financial numbers | Not credible | DROP | Numbers computed deterministically, language assistance optional |
| Predictive ML on tiny data | Weak evidence | DEFER | Start with transparent rule estimates after data-quality gates |
| Second report engine/mock history | Magic Patterns prototype | DROP | One `src/reports` engine only |
| Dense 11+ global tabs | Magic Patterns prototype | DROP | 5–6 grouped destinations, Party Ledger underline tabs |
| Duplicate payment/purchase modal inside Reports | Feature temptation | DROP | Navigate to existing source workflows |
| Color-only priority badges everywhere | Visual overload | DROP | One meaningful severity when necessary, body text explains |
| Arbitrary ROI percentages and false savings | Risk | DROP | Estimates as ranges/conditions, verified outcomes separately |
| Global 'done' status in localStorage | Prototype | DROP | Tenant/business/user-scoped, stable id, persisted server-side when ready |
| Auto upgrade toast | Prototype | DROP | Actual billing entitlement/checkout route with verification |

## User journey A — Morning owner check (everyday, 45–90 seconds target; hypothesis)

**Who:** owner with little accounting knowledge.  
**Trigger:** opens Reports after yesterday's work, daily cash review.  
**Default:** `Overview` with date Today / Yesterday / 7 days; net recorded sales, cash received, customer due, cash/bank/MFS snapshot; separate gross-profit indicator only with historical cost coverage.  
**Insight surface:** no more than three ranked advice cards: collect due, reorder stock, check unexplained expense.  
**One-tap action:** open relevant source screen; carry date/party/product filter; Back returns to advisor and scroll position.  
**Fallback:** no records ⇒ 'Record your first sale' link; incomplete cost ⇒ 'Gross profit unavailable: add cost evidence', not zero profit.  
**Outcome:** owner opens a real task or dismisses with reason; next visit shows progress instead of repeating a stale warning.  
**Avoid:** 12 KPIs, pie-chart wall, mandatory onboarding wizard, speculative 'business health score'.

## User journey B — Collect an overdue customer's money (highest short-term utility)

**Trigger:** unpaid balances above chosen amount or aged beyond policy.  
**Card:** 'Rahman Hardware owes ৳X' / 'রহমান হার্ডওয়্যারের কাছে পাওনা'; show number of invoices and days since sale, not 'overdue' without due date.  
**Evidence:** open invoices, receipts, customer balance, verified phone, most recent contact. Respect walk-in invoices grouped by verified phone; do not silently merge distinct customers with same phone.  
**Action flow:** Advisor → 'Review due' → existing Party Ledger with invoice list → Call / open SMS composition with clear paid SMS charge & explicit recipient confirmation → record follow-up note/next date if supported → collect in existing Counter/Party payment dialog → confirm posted receipt → advisor reflects new balance and closes only when reconciled.  
**Edge cases:** advance credit, partial allocations, disputed invoices, multiple split accounts, cancelled returns, write-offs, old payments without settlement dates.  
**Measure:** verified cash received after recommendation (not all receipts automatically attributable to the card), follow-up completion, time to reach ledger, false-overdue rate.

## User journey C — What should I buy today? (hardware/electrical/fabric)

**Trigger:** stock coverage less than lead time + configurable buffer, or min-stock policy.  
**Card:** item, available stock, recorded sales/day, supplier lead-time source, suggested quantity in chosen purchase unit; optional confidence/insufficient-history note.  
**Flow:** Advisor → Review buying evidence → adjust lead days, budget, buffer, pack → check incoming/reserved stock → select items → group by supplier → open existing Purchase Editor with reviewable draft, supplier, unit, lot/expiry and totals prefilled → user edits and confirms via normal purchase posting → card moves to 'Ordered' after real source event; becomes 'Received' after goods receipt.  
**Multi-unit invariant:** canonical base unit used for math, display user-facing compound units such as 1 carton=12 boxes; 1 box=20 pcs; 1 pcs=120 feet; preserve frozen conversions from source transactions, not today's master where changed.  
**Stock constraints:** vendor/negative sale, returns, bundle components, fractional base quantities, out-of-stock suppressing observed sales, demand seasonality, cost missing, supplier pack rounding, multi-vendor costs.  
**Fallback:** missing conversion/lead time/cost ⇒ ask owner for the missing field, show simple low-stock report, disable numeric suggested purchase where unreliable.  
**Measure:** reviewed drafts, posted purchase orders, avoided excess-stock purchases (requires counterfactual caveat), observed subsequent stockouts and shelf-age; don't claim 'profit saved' as verified.

## User journey D — Recover money stuck in stock (fabric/furniture/hardware)

**Trigger:** older unconsumed receiving lots, large inventory cover, low recent sales velocity.  
**Evidence:** receipt lot dates, quantities, true lot purchase cost, sale/return movement, current available stock.  
**Flow:** Advisor → 'Slow stock' → prefiltered stock-age report → owner selects a product → compare last 30/90 days demand + carrying value → choose action 'Avoid reorder' / 'Review selling price' / 'Create offer draft' → existing Products/Offers interface → user confirms → only actual offer/sale changes source data.  
**Guardrail:** a high-value but intentionally slow item (e.g. machinery) may be normal. Per-category policies and merchant suppression; don't rank purely on sales turnover.  
**Metric:** reduction in verified ageing stock value and unsold units, with attribution uncertainty.

## User journey E — Protect margin when supplier costs change (electrical/hardware)

**Trigger:** last paid purchase cost increased relative to comparable earlier lot costs, while sell price remains unchanged.  
**Flow:** Advisor → profitability drill-down → show exact supplier invoices, same base unit costs, discounts, net sales → what-if suggested price/margin → 'Review price' opens existing Products price editor (not auto-applied).  
**Missing historical cost:** show 'Cost evidence missing' and no asserted past profit. Package/bundle historical components need frozen issue costs. Returns above historical net price require separate expense postings before P&L can be certified.  
**Metric:** effective price change, margin improvement from settled source costs; no automatic estimate of future profit without demand assumptions.

## User journey F — Prevent cash shortfall before purchasing (medicine/grocery/furniture)

**Trigger:** forecasted low available cash within 7/14/30 days.  
**Flow:** Advisor → Cash plan → verify cash/bank/MFS starting balances + confirmed incoming customer commitments + supplier due dates + known recurring expenses → scenario toggles 'customer pays 7 days late', 'purchase this week', 'delay supplier bill' → review high and low scenarios → choose 'Review collection', 'Review planned purchase', or 'Open money accounts'.  
**Safety:** hypothetical records NEVER post or mutate accounting. Separate known committed entries from estimates and optional expected payments; no false promise of cash availability. MFS transfers and owner loans are not sales.  
**Data gate:** if scheduled receivables/payables or verified starting balances are absent, offer a cash commitments list instead of a precise day-by-day line chart.  
**Metric:** actual minimum cleared cash balance versus forecast band; calibration across completed periods.

## Optional niche presets, NOT separate report engines

| Merchant type | Turn on by relevant existing product metadata (not mandatory vertical signup) | Priority cards |
|---|---|---|
| Hardware and electrical | chain units, stockouts, supplier packs, replacements | buy coverage, margin erosion, supplier costs |
| Medicine | lot expiry, batch, replacement restrictions | expiry exposure and stockout; do not suggest medical usage |
| Grocery | fast turnover, near-expiry lots where tracked | sell-through, ageing, rapid reorder |
| Furniture | custom orders, advances, bulky stock | working capital, customer dues, special-order commitments |
| Fabric | roll/meter, cutting loss if reliably recorded | multi-unit coverage, stock ageing and true shrinkage |
| Battery / warranty | serial, warranty/returns | claim follow-up and returns cost; warranty case types |

## UI contract

- **Top navigation (proposal):** Overview / Sales & Profit / Stock & Buying / Money & Dues / Advisor / All Reports. User sees no more than six grouped destinations. On narrower screens prefer scannable underline tabs and one searchable report selector.
- **Default owner Overview:** four to six actual KPIs, 1 trend and 3 meaningful next actions max. Other alerts in 'See all' filtered list. No fixed grid of empty charts.
- **Insights:** one compact card per recommendation; state + severity only if meaningful. Four-part explanation (What / Why / Do / Benefit), with Advice, Evidence, Calculation as optional thin-underline inner tabs; evidence and assumptions compact by default.
- **Source verification:** source type, references, exact as-of period, selection criteria, calculation version, assumed values, missing data, owner vs cashier visibility.
- **Global design:** HisabIQ Brand Guide, Geist + Hind Siliguri, Ink/Teal/Mint, Party Ledger-style active underline, 36px ordinary controls, Products report table typography 13px data / 12px headings / 11px helpers, no monospaced digits, bilingual helpers, shared shadcn-style components.
- **Microcopy:** action verbs 'Review due', 'Review buying', 'Check stock', 'See source'; avoid 'Optimize working capital' as primary copy. Explain estimates in simple Bangla when helper language enabled.
- **Responsive:** phone prioritizes result and action; source records via sheet/dialog or named keyboard-scrollable table; no global 44px row minimum; maintain accessible touch reach without whitespace inflation.
- **State:** advisor tabs active, recommendation statuses New / Reviewed / Action started / Completed (from actual source) / Snoozed / Not applicable; source-drift triggers reevaluation, dedupe to avoid card spam.

## Engineering seam — one engine, rule-based advisor

1. Keep `src/reports/catalog.ts`, `model.ts`, `useReportData.ts`, existing `ReportToolbar/Overview/Results/Details`. Avoid a replacement BI backend inside UI.
2. Create pure rule evaluators working over a normalized tenant-scoped projection with as-of timestamps; no React-specific math. Prefer deterministic source IDs and the current `ReportData`/`ReportRow` lineage rather than duplicate mock model types.
3. Each `Insight` should carry `id`, `tenantId`, `kind`, `priority`, `state`, `triggerPeriod`, `asOf`, `entityIds`, `sourceRefs`, `numbers`, `assumptions`, `dataStatus`, `explanation`, `suggestedAction` and `actionTarget`, as well as `version`.
4. Data status is `verified` / `estimate` / `insufficient`. The label must be attached to each key claim; a card can contain verified stock and estimated future demand at the same time.
5. For source access, use a single deep-link contract from Advisor to existing module/record. Revalidate eligibility immediately before draft creation or posting; never infer authorized tenant from a URL.
6. Advisor state scoped to tenant/user and stable rule+entity+period. No shared `localStorage` key. When production, backend authorization, atomic posting and durable audit trail are implemented in backend repo separately.
7. Frontend may prototype with preview stores; it must continue to show preview label and cannot claim actual server accounting until verified data source adapters exist.
8. Existing SaaS entitlements govern premium insights; avoid using a hardcoded report plan for access; verify paid state before unlocking and take no paid action based solely on toast or frontend state.
9. Avoid fake empty outcomes, profit inference from today's price, duplicate modules, data entered from reports and unreviewed automatic purchase/payment activity.
10. Test demand math and financial invariants including timezones, fractional units, changed conversions, returns, advance credit, deleted/reversed records, multiple accounts, current vs historical snapshots, missing cost, forecast assumptions and feature expiry.

## Priority and sequencing

**P0 / First vertical slice:** Source-evidence contract, one end-to-end customer-dues advice card → Party Ledger → existing payment flow → after-post refresh; complete actual outcome or accurately record only 'reviewed' when no receipt.

**P1 / High-value core:** Stock reorder end-to-end reviewable purchase draft; cash/inflow separate from revenue; profit evidence/source coverage; compact Overview. Roll out first to hardware/electrical merchants and test with real multi-unit examples.

**P2 / Premium:** Supplier cost/margin advice; slow-stock action; conservative scenario cash planner; simple customer retention insights with sufficient history and consent boundaries.

**P3 / Later:** True P&L and Balance Sheet only after full reconciled ledger, automated reminders with verified SMS charges and consent, tested longer-horizon forecasting, automated periodic digests, industry presets.

## Usability tests to run before implementation approval

Test at least 5–8 merchants across novice and experienced levels and ideally multiple merchandise categories; 5–8 is a proposed study size, not a claim of statistical significance. Ask them to do four tasks in their preferred language, using their own accounting terms: find who to call, reorder low stock, explain an apparent profit change, test whether buying today causes a cash shortage. Observe whether they find the correct source record, understand estimated vs recorded values, complete the action in the existing module, return successfully to Reports, and avoid incorrect financial decisions. Record task success, time, help requests, erroneous purchases/payments, and confusion. Test a no-data and a missing-cost state. No automatic 'success' without observed source transaction.

**Explicit acceptance gates:** 100% of transactions require existing source confirmation; no source-less claimed cash/profit numbers; no cross-tenant state leakage; screenshots at 390/768/1440 across bilingual/dark/light; keyboard and screen-reader labels; existing table typography and 36px controls; all affected report regression tests pass.

## Open design decisions for user approval

1. Choose Action-first Advisor + existing report library (recommend) vs big library vs purely guided checklist.
2. Whether Advisor is a top-level Reports tab visible to every plan with gated suggestions (recommend) or hidden from Basic.
3. Which first journey to build: collections (recommend; strongest source/workflow reuse) versus stock reorder.
4. Whether SMS/call action is in Phase 1 or Phase 2 after paid-message cost and consent verification (recommend Phase 2).

Until these are approved, this is a research recommendation rather than a Superpowers-approved design spec/implementation plan.

## Primary reference sources

- Shopify Analytics — https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports
- Shopify product analytics — https://help.shopify.com/en/manual/products/analytics
- Shopify inventory reports — https://help.shopify.com/en/manual/reports-and-analytics/shopify-reports/report-types/default-reports/inventory-reports
- Square inventory sell-through — https://squareup.com/help/us/en/article/7809-sell-through-report-with-square-for-retail
- Square item/category sales reports — https://squareup.com/help/us/en/article/8363-view-item-category-and-modifiers-sales-reports
- Odoo replenishment — https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/replenishment.html
- Odoo reordering rules — https://www.odoo.com/documentation/19.0/applications/inventory_and_mrp/inventory/warehouses_storage/replenishment/reordering_rules.html
- QuickBooks cash planner — https://quickbooks.intuit.com/learn-support/en-us/help-article/budget-forecast-reports/use-cash-flow-planner-quickbooks-online/L2l59mIqe_US_en_US
- QuickBooks A/R aging — https://quickbooks.intuit.com/learn-support/en-us/help-article/accounts-receivable-reports/run-accounts-receivable-aging-report/L4N7PC2hg_US_en_US
- Zoho Books inventory reports — https://www.zoho.com/us/books/help/reports/inventory.html
- Zoho Inventory receivables — https://www.zoho.com/us/inventory/help/reports/receivables-reports.html
- Nielsen Norman Group progressive disclosure — https://www.nngroup.com/articles/progressive-disclosure/
- HisabIQ main reports — https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/src/pages/Reports.tsx
- HisabIQ reporting engine — https://github.com/shuvodelux-commits/hisabiq_ui/tree/main/src/reports
