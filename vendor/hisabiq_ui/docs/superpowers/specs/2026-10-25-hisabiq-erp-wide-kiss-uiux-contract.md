# HisabIQ ERP-wide KISS UI/UX Contract

**Date:** 25 October 2026 (Asia/Dhaka).  
**Status:** Applies the owner's instruction to simplify the planned ERP, Settings and SaaS UI/UX. Documentation only; product implementation is a separate step.

## 1. Authority and outcome

**Make HisabIQ easy to understand and easy to operate.** Keep a complete workflow behind a small number of clear choices.

Read this before the Settings, Control Center and commerce UI plans. This contract supersedes their earlier screen composition, tab counts and optional UI-step suggestions. It does not supersede the approved Basic/Medium/Premium feature boundaries, financial correctness, consent, tenant isolation, historical access, paid rights, audit or recovery rules.

The three plans' 28 engineering tasks are not 28 new pages. Preserve their behavior/test coverage while implementing fewer focused screens using existing components.

Approved interface ladder:
- Basic: simple essential information and standard navigation.
- Medium: useful interconnectivity and contextual actions, with limited extra information.
- Premium: full eligible information and controls, revealed when relevant. Premium access does not mean every field/panel must be expanded at once.

Do not add artificial delay, repeated questions or irrelevant forms to make Basic harder. Preserve the owner's paid-shortcut choices while keeping a clear standard Basic route.

## 2. Universal screen rules

1. Give each screen one primary purpose and one obvious primary action. Put secondary actions in the existing More menu; do not hide the daily primary task.
2. Show common fields/information first. Place rare controls in one clearly labeled Advanced disclosure. Do not nest Advanced inside Advanced or add another page for three fields.
3. Avoid competing sidebars, nested cards, duplicate summaries and several rows of tabs. Keep the current application shell.
4. Use the existing Party Ledger-style underline tabs where there are a few peer views. Use a searchable module selector when the choice is long; do not display 15 module tabs across the screen.
5. Default optional filters to collapsed. Keep search and current date/context visible when routinely needed; active filters must be visible and easy to clear.
6. Use familiar terms and short Bangla helpers where useful. Put explanations in a tooltip/help disclosure instead of repeating long text under every control.
7. Use explicit labels for important actions; do not replace clarity with unlabeled icons. Remove decorative indicators that repeat text.
8. Use the same shared components and interaction rules everywhere: product search, Quick Add, cart, quantities, payment rows, dates, tables, dialogs and More.
9. Preserve the user's work. Errors, navigation, settings changes, plan expiry and reauthentication must not silently erase a draft.
10. Ask once for a decision. Do not add Review → Confirm → Confirm again for a harmless display preference.
11. Keep the current 36px ordinary controls, 48px designated transaction-completion actions, Products typography (13px data / 12px headings / 11px helper/badge), proportional numbers, Geist/Hind Siliguri and Ink/Teal/Mint.
12. Color explains state or financial meaning. Avoid a separate color/icon/badge for every metadata field. Text must still communicate meaning without color.
13. Mobile shows the same essential task in compact rows/cards with details on demand. Preserve current tablet column defaults; do not apply a blanket 44px minimum to every row.
14. Accessibility, keyboard focus, clear errors, bilingual copy and light/dark remain requirements. Simplifying visual noise does not remove useful labels or warning text.

## 3. Fewer settings decisions

Keep existing canonical settings/security/billing/notification routes. Do not generate another settings application.

### Tenant layout

- Existing business/general page remains the starting point.
- Add one **Interface & workflows** destination for module columns/details/links.
- Place **Recycle Bin** under the existing **Data & recovery** grouping, with its own direct route. Do not add a top-level ERP module or require export permission to recover an eligible draft.
- Keep Plan & Billing and Support as links to their existing workspaces, not copied settings forms.
- No technical Logs/Diagnostics entry in merchant settings.

Interface & workflows:
1. Select module from one searchable selector.
2. Show common eligible options in one form; group Columns, Details and Links & Actions with short section headings. Use a single underline-tab row only if the content actually needs separate views.
3. Default display scope to My preferences. Owners can explicitly choose Business defaults; keep employee targeting in authorized management/support flows. Do not ask a single-user owner to choose a scope on every edit.
4. Show one small current-plan label. Basic gets a brief explanation of extra controls; no screen full of locked toggles or repeated Buy buttons.
5. Save/Discard stays inline. Show a compact diff only when changes affect other users, dependencies or operational behavior; harmless personal display changes need no extra confirmation dialog.
6. Reset removes overrides in the selected scope and shows inherited defaults. Do not replace inheritance with copied values.
7. Preview is optional and inline/on demand, not a mandatory step before every Save.

The full internal registry remains precise. The merchant does not see raw feature keys, JSON, permission expressions, grant IDs or version numbers.

## 4. Five primary tenant tabs in SaaS

Use one existing tenant workspace with a persistent business identity header. Five primary underline tabs:

| Tab | Contains / canonical destination |
|---|---|
| Overview | Status, plan summary, current issue and most useful next action; existing billing/SMS/service links |
| Settings | Eligible module controls, proposal diff and authorized Users & Permissions section |
| Plan & Usage | Included/purchased/trial rights, expiries, quotas and links to the existing billing/SMS workflows |
| Support | Tickets, pending/active configuration approval, access status and authorized Diagnostics panel |
| History | Configuration, commercial and access audit summaries with detail on demand |

This replaces the earlier seven primary tabs; no functionality disappears. Reuse the existing Members panel under Settings. Configuration maps to Settings; Features maps to Plan & Usage; Support Access and Diagnostics sit under Support.

Preserve old links through aliases:
- tab=configuration → tab=settings.
- tab=features → tab=plan-usage.
- tab=members → tab=settings&section=members.
- tab=support-access → tab=support&panel=access.
- tab=diagnostics → tab=support&panel=diagnostics.

Authorized Diagnostics remains a direct-linkable panel, even though it is not a sixth primary tab. Permissions are checked independently; a hidden tab is not access control. Retain the canonical Overview/History behavior and existing filtered billing links.

Do not add a second global navigation item for every tenant panel. Extend existing Plans, Payment verification, Subscriptions, SMS, Services, Support and Reports.

### Support request

Keep the request in its ticket context. Engineer sees one proposal form with exact target and before/after. Customer sees one clear consent card. Engineer applies only after real approval. Keep the 15-minute single-use rule, revision checks, revocation, history and Undo.

Do not turn this into a six-screen wizard. No generic impersonation/remote desktop feature.

### Diagnostic screen

Default view: recent errors for the selected business/ticket, short safe summary and outcome. Search/date are visible; module/severity/advanced filters expand when needed. Technical metadata lives in detail, not a wide table with every field.

Keep source/outcome distinction, redaction, tenant/staff scope, expiry and export audit. Remove redundant health cards and repeated counters. No real collector is enabled by this UI plan.

## 5. Simple commerce without weakening money controls

### Merchant purchase

A normal purchase uses:
1. Choose the benefit/plan/pack.
2. One review-and-pay screen with total, period, inclusions and available collection method.
3. One status/receipt view.

Reuse the same checkout for subscription, feature pass, SMS and setup service. Product-specific fields appear only when needed. Do not create four checkout engines.

Only show active configured payment methods; do not advertise unavailable channels. Default to the last valid chosen method when appropriate. Keep private proof upload for manual collection; no extra proof form after a gateway has independently verified the payment.

Merchant status copy summarizes the underlying state truthfully:
- Awaiting payment.
- Checking payment.
- Payment received—activation pending.
- Active / credits added / service booked, as appropriate.
- Needs attention, with a specific reason and next action.
- Refund pending / refunded.

Internal payment, payout, allocation and fulfillment states remain separate. Do not hide a paid activation failure behind “Pending” or ask for payment twice. Bank payout details belong in staff reconciliation, not ordinary merchant checkout.

### Staff operations

- One Payment verification inbox with a side/detail view: order, actual verified due, evidence/result, duplicate warning and Verify/Needs information/Reject. Financial authority remains separate from support.
- Paid activation problems appear as an actionable filtered queue within existing billing operations; no new top-level Fulfillment application.
- Refund request starts from the original payment/order. Use one impact review/confirmation, then truthful asynchronous status.
- Reconciliation is an exception list under existing Reports/Payments/SMS. Show the mismatch and the safe next action, not another dashboard of decorative charts.
- Preserve duplicate prevention, amount/account/currency verification, exact-once grants/credits, source-specific refunds and audit even if the interface uses fewer screens.

### SMS

Merchant SMS: balance, Buy credits, Compose, message history. Show segments and cost before send; details expand on demand. Keep subscription-independent credits and truthful UNKNOWN delivery status.

Staff SMS uses one underline row: **Delivery / Packages & Credits / Providers**. Put procurement, tariffs, sender review, balance/recharge and connection testing in the selected Provider detail. Financial exceptions link to reconciliation. Do not add nested tab bars.

Start with one actually supported contracted driver when backend work is approved. Keep a driver seam but defer a generic routing-rule builder, arbitrary provider endpoints, automatic failover and per-merchant API-key setup. Unknown submission must still be reconciled before retry/failover.

Prototype credentials are dummy placeholders; real secrets never go into browser storage, preview exports or diagnostic logs. Do not add fake “Connected” success.

## 6. ERP module simplification

| Area | Keep visible | Reveal when relevant / paid eligibility permits |
|---|---|---|
| POS/Purchase cart | Product entry, quantity/unit, price, totals, payment and completion | Rare tracking fields, costing detail and secondary actions; preserve shared cart |
| Sales/Purchases lists | Reference/date/party/total/paid/due/status | Optional item/payment breakdown, source links and More actions by plan |
| Products | Name/code/unit/quantity/price and necessary warnings | Value/lot/tracking columns; precise defaults in Settings |
| Party Ledger | Readable date/ref/description/debit/credit/balance | Connected invoice action in Medium; rich items/indicators/expansion in Premium |
| Finance/Expenses/Daybook | Amount, account/party, date, status and correct standard action | Extra allocations/details and connected source shortcuts |
| Reports | Business question, result and next useful action | Advanced filters, comparisons and optional analysis; no default wall of charts |
| Drafts/Recovery | Identify record, deleted date/deadline and Restore/Undo | Safe dependency/conflict detail; no multi-step harmless restore wizard |
| Settings | Common relevant preferences | Rare advanced controls and authorized business-wide scope |
| SaaS | Selected business/task and next action | Detailed grants, metadata, evidence and exceptions under correct permissions |

Keep Quick Add where a missing dependency interrupts a normal transaction. Preserve module context and current handlers. Do not send a Premium user through global settings to perform a daily action, or make Basic lose the standard route promised by its plan.

Safety-critical stock/expiry/serial warnings, installment dues and required return/payment information are not decorative richness. Do not hide them to reduce clutter or create an upsell.

## 7. Consolidation decisions

| Earlier complexity | KISS change | Preserved requirement |
|---|---|---|
| Seven tenant primary tabs plus context links | Five primary tabs; panels and canonical links | Every previous action and direct-link route |
| Long horizontal list of ERP module tabs | One searchable module selector | Module-by-module precise control |
| Review dialog for every display toggle | Inline Save; review only meaningful impact | Explicit scope, revision and audit |
| Preview required before Save | Preview on demand | Same real resolver/consumer behavior |
| Multiple purchase flows | One shared checkout | Different SKU terms/eligibility/fulfillment |
| Separate activation/exception dashboards | Existing inboxes with relevant filtered views | Recoverable verified-payment activation |
| Every backend status exposed to merchants | Task-oriented status copy with details | No false financial/delivery outcome |
| Everything visible in Premium | Relevant default view and expandable details | Full eligible rich capability |
| Provider configuration/routing everywhere | One provider detail, rare options under Advanced | Verified setup, secret handling, procurement |
| Empty pages for future features | Do not advertise until implemented | Honest preview and release status |
| New page-local components | Reuse or narrowly extend current shared components | Consistent responsive behavior |

Do not simplify by merging plan entitlement with role permission, skipping source records, trusting browser state, deleting audit history or replacing transactional recovery with a cosmetic Undo.

## 8. Implementation and review rules

This is a refinement of the existing project. Do not change the visual identity, regenerate all modules from scratch or make a competing settings framework.

Apply it within each existing plan task rather than creating a new “KISS subsystem”. File splitting is justified by responsibility/readability, not a requirement to create a file for every label, screen state or trivial selector. Reuse current providers/helpers before adding wrappers; preserve narrow server contracts where they prevent privilege or financial errors.

For every planned screen/control, record its purpose, primary user, normal next action, visibility condition and existing component. Remove an element if its purpose is already served elsewhere; combine it if it belongs to the same task.

Acceptance checklist:
- [ ] Basic sale, purchase, payment, return, receipt/export and draft recovery remain workable through clear standard routes.
- [ ] Medium connections work without Premium inline richness.
- [ ] Premium can access all eligible details but begins with a coherent, uncluttered default.
- [ ] Ordinary personal column changes save without a redundant confirmation; changing business scope shows impact.
- [ ] Payment awaiting verification cannot unlock; verified-but-unfulfilled is truthful and recoverable.
- [ ] Every previous tab action is reachable after consolidation, including Members, Diagnostics and history.
- [ ] Mobile, tablet, desktop, keyboard, Bangla/English and both themes retain the same purpose and primary action.
- [ ] Existing shared UI/cart/Quick Add/typography rules pass; no unrelated redesign.
- [ ] No product/financial state is removed merely because fewer screens display it.
- [ ] Compare the previous proposed flow with the simplified flow: screen transitions, required decisions and task completion. Do not invent a measured time-saving percentage.

## 9. Instruction for both Opus/Magic Patterns chats

Read this KISS contract first, then the shared architecture, owner decisions and your specific UI plan. Preserve approved capabilities and safety requirements, but use this document for screen composition and progressive disclosure. Generate fewer coherent screens with functioning relevant actions, not a separate dashboard/page for every backend concept. Use the actual existing HisabIQ components and branding.

No new implementation, merge, provider connection or deployment is authorized by this documentation update.
