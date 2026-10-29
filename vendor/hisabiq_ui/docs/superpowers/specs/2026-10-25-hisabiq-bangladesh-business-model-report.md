# HisabIQ Bangladesh business model — owner decision report

**Research checked:** 25 October 2026, Asia/Dhaka.  
**Decision status:** Final recommended model for owner approval; prices are recommendations, not published offers or empirically validated willingness-to-pay.  
**Scope:** Public market evidence, complete reading of the three requested strategy documents, targeted source inspection of all three repositories, and inspection of the supplied Magic Patterns ZIP. No code, repository, production configuration, or commercial terms were changed. No merchant interviews, purchases, provider delivery tests, or production tests were performed.

## 1. The recommendation

**Keep free-first, but change its economics and launch sequence.** Build a useful permanent free ERP for one owner and one shop. Earn revenue through optional workflow improvements, prepaid messaging and modest subscriptions. Treat SMS as a supplementary margin stream. Treat the first 1,000 verified businesses as a funded product-validation cohort, not evidence of product-market fit or profitability.

My recommended catalog is **Free ৳0, Counter ৳199, Pro ৳399, Plus ৳599 per calendar month**, with no mandatory setup charge. Rename Medium to Pro and Premium to Plus only after approval and an explicit catalog migration. Do not create separate Pro, Plus and Premium tiers on top of this ladder. The prices survive this review only with the limits and support boundaries below; they cannot fund unlimited engineers, unlimited messaging, custom development or multi-branch ERP.

**Reject a universal ৳149 monthly unlock.** Charge according to the value and recurring cost: one optional print-design pack at ৳149 once; Reports Plus at ৳99 for seven days or ৳199 for 30 days; extra attachment capacity at ৳99 for 30 days; SMS by billable segment. Launch with SMS and one evidence-backed report pass first, add storage only when real uploads are ready, and introduce the static print pack later. Do not build a large feature store before proving demand.

**Ordinary invoices, supported basic thermal printing, receipt reprints, essential statements, data export, financial correctness and security remain free.** Multi-unit quantities and split payments belong in the core workflow: making a hardware merchant pay before accurately recording a sale defeats the free product's purpose.

Focus initial acquisition on **hardware and electrical shops in a small number of reachable market clusters**, including Natore/Rajshahi if that is operationally convenient. Add fabric and furniture only after observing their workflows. Do not lead with pharmacy or high-throughput grocery until expiry, returns, speed and connectivity constraints are proven. This is a product-fit recommendation, not a finding that one sector is wealthier or more willing to pay.

Under the explicit scenario assumptions in section 10, 1,000 registrations produce monthly gross billings of roughly **৳9,944 / ৳56,076 / ৳165,478**. After modeled taxes, direct costs and operating overhead, results are **−৳35,567 / −৳13,272 / +৳18,282**, before an additional ৳80,000 for founder and engineering compensation. Even the optimistic case does not support a fully staffed business at this scale.

**Approval recommendation:** approve this as a gated pilot model, fund the learning period, preserve the free promise, and require real retention and contribution evidence before scaling acquisition. Do not launch paid promises against unfinished workflows.

## 2. What the repositories actually establish

### Review boundary and source versions

The following requested documents were read completely, including their appended support requirements:

1. [Free-first hybrid strategy](https://github.com/shuvodelux-commits/hisabiq_ui/blob/docs/free-first-1000-monetization-20261025/docs/superpowers/specs/2026-10-25-hisabiq-free-first-hybrid-monetization-strategy.md).
2. [SaaS Control Center reference design](https://github.com/shuvodelux-commits/hisabiq_ui/blob/docs/free-first-1000-monetization-20261025/docs/superpowers/specs/2026-10-25-hisabiq-saas-control-center-nestshererp-reference-design.md).
3. [Detailed research brief](https://github.com/shuvodelux-commits/hisabiq_ui/blob/docs/free-first-1000-monetization-20261025/docs/superpowers/specs/2026-10-25-astra-bangladesh-pricing-and-free-first-review-brief.md).

Repository trees inspected on the review date: hisabiq_ui main tree `79c51fdbbc8ce47364488127a1e2c5762f6526d9`; ByabsIQ main tree `17dcadfaa86ac868063408cc2be6209ca652e164`; nestshererp main tree `b1bad29961a968829be622dc812d476773e6db78`. These identify the observed trees, not production deployments. Both private repositories were accessible. This was targeted commercial/architecture due diligence, not a complete security audit or runtime certification.

| Area | Evidence inspected | Classification and business consequence |
|---|---|---|
| HisabIQ SaaS administration | `docs/saas/README.md`, `src/saas/types.ts`, `src/saas/support/transitions.ts` | Functional UI simulation. React/browser state, demo actors, payment/SMS transitions and consent requests are not authenticated services. Plan features remain a string field. Do not sell this as live billing or remote assistance. |
| Sales and preferences | `src/pages/Sales.tsx`, `src/settings/TenantSettingsProvider.tsx` | Existing reusable column chooser and browser-local preferences; Sales imports preview/demo stores. Central support cannot securely configure these merely by changing its own browser. |
| ByabsIQ identity and tenancy | AGENTS, foundation record, current subscription schema and services | Implemented backend foundations with session-derived tenant boundaries, membership, policy and payment review. Documentation reports historical tests; those tests were not rerun here. |
| ByabsIQ products and inventory | Current `products.service.ts`, `inventory.service.ts`, module tree | Real tenant-transaction service code for products/inventory exists. The older foundation completion document's deferrals are partly superseded by these modules. Do not describe the backend as only authentication. |
| Operational ERP integration | Current API module tree | No corresponding POS/sales, purchases or party-ledger API module was found in the inspected main tree. Frontend previews therefore do not establish a complete deployed sale → stock → ledger → payment flow. An external deployment or another branch could add capabilities; none was verified. |
| Existing subscription lifecycle | `subscriptions.repository.ts`, `subscription-policy.service.ts`, schema | PRO/PREMIUM only; 30-day Pro trial, grace to day 37, then read-only behavior. This directly conflicts with a permanent writable Free plan. Cancellation and commercial expiry also need distinct handling from account suspension. |
| Payment review | Repository implementation and `docs/platform-admin-payments.md` | Useful real foundation: pending evidence, platform authorization, locks, duplicate-proof prevention, atomic activation and audit. It is subscription-specific and not proof of automated gateway settlement or feature/SMS fulfillment. |
| NestSherERP settings | Settings catalog, `manage-settings-service.ts`, dependency resolver | Useful implemented patterns: allowlisted keys/values, distinct permissions, sensitive-change reauthentication, transactions, audit and explicit dependency cascades. Many catalog consumers are marked `inEffect: false`. |
| NestSherERP SaaS licensing | `subscription-entitlement-provider.ts` | Explicit permissive stub returning active access to all modules. Never copy this as a production entitlement gate. |
| Supplied ZIP | README, package, App, Reports, cash context and network-call scan | Generated design source for the approved Magic Patterns project. Reports use imported sample financial data and some toast-only actions; sampled state is local. No fetch/axios calls were found in its TS/TSX scan. This is design reference, not evidence of live accounting. |

Useful source links: [UI SaaS scope](https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/docs/saas/README.md), [Sales](https://github.com/shuvodelux-commits/hisabiq_ui/blob/main/src/pages/Sales.tsx), [backend subscription policy](https://github.com/shuvodelux-commits/ByabsIQ/blob/main/apps/api/src/modules/subscriptions/subscription-policy.service.ts), [backend payment repository](https://github.com/shuvodelux-commits/ByabsIQ/blob/main/apps/api/src/modules/subscriptions/subscriptions.repository.ts), [product service](https://github.com/shuvodelux-commits/ByabsIQ/blob/main/apps/api/src/modules/products/products.service.ts), [inventory service](https://github.com/shuvodelux-commits/ByabsIQ/blob/main/apps/api/src/modules/inventory/inventory.service.ts), [Nest settings](https://github.com/shuvodelux-commits/nestshererp/blob/main/packages/core-contracts/src/settings.ts), [Nest mutation service](https://github.com/shuvodelux-commits/nestshererp/blob/main/packages/core-application/src/settings/manage-settings-service.ts), [permissive stub](https://github.com/shuvodelux-commits/nestshererp/blob/main/apps/api/src/deployment/subscription-entitlement-provider.ts).

**Architecture judgment:** reuse HisabIQ React and ByabsIQ. Reuse NestSherERP's ideas, not its Vue screens or permissive licensing behavior. The immediate critical path is a reliable business workflow, permanent Free semantics and correct settlement—not a visually elaborate control center.

## 3. Current Bangladesh competition and evidence quality

All sources below were checked on **25 October 2026**. A vendor page verifies an advertised offer, not service quality, actual customer payment, market share or profitability. Unless stated, tax treatment, negotiated fees and independently measured support performance were not published in the inspected material.

| Provider | Advertised price and effective cost | Limits, trial and service details that matter |
|---|---|---|
| **HishabPati** [S1] | Free; Premium ৳199/month or ৳1,990/year; Business ৳449/month or ৳4,390/year; Enterprise ৳999/month or ৳9,990/year | Premium includes reports, inventory and printing, one user/business and 25 SMS/month. Business shows five users, three businesses and 50 SMS/month. Free comparison shows several capabilities limited to the first 14 days and watermarked printing. Current page supersedes its older FAQ, which gives a different annual Business price. |
| **ERP71** [S2] | Starter ৳299/month; Growth ৳999/month + ৳4,000 setup; Business ৳2,499/month + ৳15,000 setup | Starter: 500 products/two users; Growth: 10,000 products/10 users. Page explicitly says free tier and trials temporarily unavailable. Growth first-year subscription plus setup is ৳15,988, or ৳1,332/month equivalent. Starter email response advertised at two business days. |
| **Halkhata** [S3] | Free; Starter ৳499, Growth ৳999, Business ৳1,999/month, shown as founding offers | Free is only one product, 20 monthly sales and 20 customers: a test, not a practical full-shop free tier. Paid plans advertise one month free, no setup, six months for five or 12 for ten. Starter: 100 products/two users; Growth: 500/five. Receipt printing is included. Direct retrieval was blocked; indexed official pricing text was available. |
| **DokanX** [S4] | POS ৳499/month + ৳3,500 onboarding; inventory separately ৳899/month | POS-only first year ৳9,488, about ৳791/month effective. POS plus inventory: ৳20,276 first year before any other charges. Annual subscription discount advertised at 10%. The modular model is a relevant comparison, not proof that micro-purchases will convert. |
| **bHisab** [S5] | Basic page shows ৳9,990 plus ৳500/month | 200 products, 500 invoices/month and 500 clients; SMS setup ৳1,000. Remote support advertised via TeamViewer/AnyDesk and 24/7. If ৳9,990 is upfront in addition to monthly fees, first year is ৳15,990; obtain a written quote because the heading is not an itemized contract. |
| **Hisab Nikash** [S6] | Advertises ৳999/year entry package, about ৳83.25/month equivalent | Broad unlimited-product/invoice claims; same site has conflicting higher-package prices and three- versus seven-day trial statements. Treat the low headline as a competitor anchor, not a verified comparable contract. Distinct from similarly named hishabnikash.com. |
| **TallyKhata** [S7] | Standard free; Gold paid; exact current Gold checkout price not verified publicly in this review | Official Play listing describes Gold, a 30-day trial, stock, multiple businesses and messaging. Do not invent its price or infer paying customers from downloads. |

**Implications.** HisabIQ is not entering an empty low-price market. A ৳149 single-feature monthly pass competes with a ৳199 multi-feature subscription. The differentiator must be easy adoption, truthful records, useful sector workflows and reliable assistance. “Free ERP” is credible only if a real shop can keep using it after the first month. Competing on the largest feature checklist is especially risky while core integrations remain unfinished.

**Merchant review evidence.** Two visible TallyKhata Play reviews dated 10 August and 1 October 2026 raise unresolved-support/balance concerns and unclear transitions from free to paid. These are individual, unverified customer reports, not proven defects or representative incidence rates. They justify testing transparent free boundaries and support follow-through. Live and indexed app-rating snapshots differed, so no rating or download figure is used to estimate trust, demand or conversion. [S7]

No representative independent review dataset was established for the smaller vendors. Vendor testimonials and published support claims were not treated as independent validation. Purchase a competitor plan and run the same five tasks before any marketing claim of superior quality: opening stock, mixed-unit sale, partial payment, return and data export.

## 4. Buying psychology: evidence, inference and merchant differences

### What the evidence supports

MSC's 2025 Singair microcosm study identifies fees, trust, digital literacy, acceptance and infrastructure as barriers to digital-finance adoption. Its selected locality is not a nationally representative software-pricing survey. A 2026 MSC supply-chain analysis explains how supplier cash requirements and payment friction can constrain merchants even when they already use digital wallets. These findings support designing around cash-flow control and visible usefulness; they do not prove an aversion to SaaS subscriptions. [S8, S9]

A February 2026 ADBI policy brief reports a Bangladesh support intervention with 230 selected low-income entrepreneurs and 206 endline respondents. Participants were male, already had smartphones/e-wallets, and came from two Munshiganj upazilas. Training, follow-up and a helpline improved some adoption measures; not every measure was significant, and treatment/control geography limits generalization. This supports testing assisted onboarding, not promising a particular ERP conversion lift or assuming women and all retail sectors behave identically. [S10]

bKash officially offers merchant and online-business services, including subscription/payment APIs; Nagad publishes merchant-payment services. Familiar payment rails can reduce checkout unfamiliarity. They do not remove distrust of HisabIQ, demonstrate agreement to auto-renewal, or establish a universal merchant fee. [S11, S12]

**Evidence gap:** no defensible public estimate was found for Bangladesh shopkeepers' willingness to pay ৳49, ৳99, ৳149, ৳199, ৳399 or ৳599 for these exact ERP capabilities. The proposition “most Bangladeshis do not pay for software” remains unproven and is too broad to guide pricing.

### Behavioral hypotheses to test ethically

| Mechanism | Plausible merchant concern | HisabIQ response | Validation |
|---|---|---|---|
| Uncertainty and perceived risk | Will my balances remain correct? Will you disappear? | Demonstrate a return, an export and restoration; display support ownership and incident updates. | Observe whether these demonstrations change actual adoption and paid choice. |
| Status quo and switching effort | My notebook works; entering products costs time. | Import a small real catalog; allow ledger-first use and gradual stock setup. | Measure first useful result, setup minutes and abandonment reason. |
| Mental accounting | SMS feels like a usable consumable; a vague monthly fee feels detached from work. | Segment wallet with visible usage and fixed-term report access. | Compare real purchases of equivalent offers, not just stated preference. |
| Cash-flow timing | Stock purchases take priority this week. | Manual renewal, retained Free access and small optional passes. | Ask when cash is tight; measure renewal timing without profiling personal finances. |
| Reference prices | Competitor offers many features for ৳199. | Show concrete differences and total cost; avoid fake discounts. | Test differentiated benefits and competitor switching, not arbitrary price anchoring. |
| Demonstrated value | I can now see overdue money or slow stock. | Offer an optional tool after showing the free result and an accurate preview. | Attribute purchases to exposure and track downstream usefulness. |
| Autonomy and fairness | Free may become paid after I enter records. | Stable published Free scope, easy export, no surprise renewal or data lockout. | Track trust complaints, refunds and reasons for leaving. |
| Familiar human help | I need a person to explain this once. | Short Bangla demonstrations and bounded consented configuration. | Compare cost per retained business with and without scheduled assistance. |

General behavioral concepts explain possible mechanisms; Bangladesh-specific price effects have not been demonstrated here. Do not claim that ending prices in “99” has a proven local effect. Display total monthly/term cost first, not a per-day figure that conceals the commitment.

### Sector priorities and natural purchase moments

The following are workflow hypotheses to validate, not measured sector willingness-to-pay rankings.

| Sector | Free value that must work | Natural optional purchase | Launch priority |
|---|---|---|---|
| Hardware | Compound units, supplier/customer dues, partial payment, returns | Reorder analysis before a supplier visit; slow-stock report; additional employee | First cohort; strong match to existing UI direction |
| Electrical | Units, prices, customer credit and basic stock | Serial/warranty workflow once reliable; replenishment comparison | First cohort |
| Fabric | Fractional/compound quantities, roll/cut accuracy, returns | Buying analysis and saved quotations; later variants | Small observed cohort; do not assume current UI covers all fabric practices |
| Furniture | Quote, advance, delivery balance and historical customer records | Saved quotation workflow, documents, installment management when integrated | Second cohort; lower transaction frequency may favor passes |
| Pharmacy | Batch/expiry, purchase returns, exact stock and traceable records | Near-expiry planning and supplier return analysis | Later; do not launch on sample-data reports or incomplete safety-critical behavior |
| Grocery | Extremely fast counter, reliable daily cash and small-ticket dues | Second cashier, batch labels, stock replenishment | Later unless online reliability and speed are proven; offline competitors are a real disadvantage |
| Small wholesale | Price tiers, quantities, receivables and supplier balances | Aging/reorder analysis and controlled staff access | Selective pilot; avoid expanding into distribution ERP immediately |

Good purchase moments: completing a first successful reminder; preparing next week's purchase; selecting a second staff account; needing a distinctive invoice layout; attaching a supplier bill after trying the free allowance. Never place a payment wall between a cashier and completion of an ordinary sale, return or receipt.

## 5. Permanent Free and the recommended tier matrix

Prices below are **total customer-price recommendations**. Model them conservatively as including a 15% output-tax reserve until classification is confirmed. Actual invoices must use the applicable legal treatment; a reserve is not a tax determination.

All tiers are **one business, one shop in V1**. ByabsIQ has no branch/outlet model; do not promise it in Plus. Access is online-only until an approved offline design exists. Users may access their account from supported devices; seats refer to named people, not paid device slots.

| Feature or limit | Free | Counter | Pro | Plus |
|---|---|---|---|---|
| Calendar-month price | ৳0 | ৳199 | ৳399 | ৳599 |
| Optional annual price, only after pilot validation | — | ৳2,189 | ৳4,389 | ৳6,589 |
| Named users, including owner | 1 | 2 | 3 | 5 |
| Active product capacity | 500 | 2,000 | 10,000 | 20,000 |
| Sales, purchases, returns, expenses, customer/supplier ledger, cash/bank/MFS records | Included | Included | Included | Included |
| Compound units and split payments | Included | Included | Included | Included |
| Routine transaction/customer count | No commercial monthly cap | Same | Same | Same |
| Ordinary A4/thermal receipt, PDF, reprint and basic statement | Included, no print fee | Included | Included | Included |
| Owner's basic sales, cost/profit, stock, due and expense summaries | Included | Included | Included | Included |
| Basic low-stock list and data export | Included | Included | Included | Included |
| Saved quotation/templates, batch print and barcode-label convenience | — | Included | Included | Included |
| Advanced aging, slow stock, purchasing analysis and comparisons | Preview or pass | Pass | Included | Included |
| Integrated optional serial/warranty/advanced workflows | — | — | Included when ready | Included when ready |
| Attachment total storage | 25 MB | 100 MB | 500 MB | 2 GB |
| Product photo/document size | 5 MB/file; compress photos | Same | Same | Same |
| Employee permissions and profit confidentiality | Not applicable to extra employees | Included for included seats | Included | Included |
| Messaging | Buy credits separately | Same | Same | Same |
| Scheduled assistance | Initial group orientation; one optional 10-minute activation callback | One 15-minute setup session once | Setup + one 15-minute configuration session per quarter | Setup + one 15-minute configuration session per month |
| Routine response target | Within 2 business days | Within 1 business day | Within 1 business day, priority queue | Within 4 support hours |

Annual pricing is 11 monthly payments for 12 months, saving one month. Do not front-load annual commitments before customers have experienced two paid months and the service is stable. Monthly/manual renewal remains the default. Annual offers are not assumed in the financial scenarios.

**Free is a coherent product, not a full-feature countdown.** Give Basic immediately. Offer an optional seven-day advanced-report trial when useful data exists; no default 15-day or 30-day full-suite trial and no required card. The 15-day proposal is rejected as the universal onboarding path. A merchant should not discover that the workflow they learned was temporary.

**Do not hide ordinary profit from the owner behind Pro.** Basic summaries can include correctly calculated profit, with unknown costs clearly marked. Paid reports add comparisons, interpretation and actionable purchasing views. P&L must distinguish gross profit, expenses, returns and price adjustments; never label incomplete totals “net profit.” No AI forecast promise at launch.

**Downgrade rules:** preserve all existing records, products, attachments, installed print purchases and independent paid passes. If above a product cap, allow transactions with existing products and prevent new catalog expansion until capacity is available; do not switch the entire shop to read-only. Disable new use of optional workflows while preserving the ability to settle, correct, return, reprint or export historical transactions. Attachment access remains readable/downloadable after expiry; new uploads follow the remaining quota. Deleted personal data and lawful retention are governed by a separate published policy.

**Limits are recommendations to test operationally.** Do not confuse low marginal row-storage cost with permission to use hidden transaction caps. Publish technical abuse/rate protections, warn before sustained unusual load, and negotiate a suitable plan without interrupting a counter mid-sale. Expiry and accounting safety checks remain operative for any already-tracked records.

**Price challenge:** ৳199 is defensible as a small capacity/convenience bundle, not a toll on basic accuracy. ৳399 must earn its increment through recurring decisions and staff workflows. ৳599 can buy priority and bounded help; it cannot buy a dedicated manager. If Plus consumes more than 30 human minutes monthly on average, either simplify the causes, sell separate assistance or test ৳799 for a new service-rich offer. Do not quietly weaken existing promises.

## 6. Optional purchases and purchase experience

### Recommended small catalog

| SKU | Recommended price and term | What the customer buys | Expiry and inclusion |
|---|---|---|---|
| Reports Plus | ৳99 / 7 days; ৳199 / 30 days | Advanced analysis across their available historical data, with downloadable results | Included in Pro/Plus; previous downloaded or saved reports remain available. No charge per ordinary report click. |
| Attachment Capacity | ৳99 / 30 days for +1 GB total capacity | Additional upload capacity and document workflow | Existing attachments remain accessible. Renewal does not accumulate another GB each month; clearly show total capacity. Plans include their own base allowance. |
| Invoice Design Pack | ৳149 once per business | A small static pack of optional layouts; basic logo/name/address support stays free | Retain the purchased pack while HisabIQ operates; no promise of perpetual hosting, custom design or every future template. Counter+ includes use while subscribed; separately purchased ownership survives downgrade. |
| SMS | ৳99 / 100, ৳399 / 500, ৳1,499 / 2,000 segments | Actual billable message segments | Independent of plan; 12-month validity with expiry shown and unused balance transferable to a renewed pack under published terms. Details below. |
| Guided configuration | ৳399 / up to 30 minutes | Booked help implementing agreed safe settings | One scheduled service, not automatic private-data access. Bug fixes are never charged against it. |
| Guided setup/import | ৳999 / up to 60 minutes | One clean standard CSV, up to 500 products and 200 parties, validation and one demonstration | Reject/quote messy mapping and historical migration separately. Customer approves opening figures; staff does not invent balances. |

Launch order: SMS after reconciliation works; Reports Plus after source data is valid; storage after secure attachment implementation; static print designs only if users ask. Do not build six checkout variations at once. Services can use the existing reviewed-payment foundation during a small pilot.

### Why not ৳149 for everything?

At a modeled 15% output-tax reserve, 2.875% effective payment fee and 2% refund reserve, the amount remaining **before delivery and support** is approximately:

| Price | Amount available | Recommended use |
|---|---:|---|
| ৳49 | ৳40.22 | Test only a genuinely occasional automated outcome; not a standard staffed product |
| ৳99 | ৳81.26 | Seven-day report pass or modest storage extension |
| ৳149 | ৳122.30 | One-time static design asset; test against ৳99 before expanding |
| ৳199 | ৳163.34 | 30-day report access or Counter bundle |
| ৳399 | ৳327.51 | Pro subscription; bounded configuration service |
| ৳599 | ৳491.67 | Plus subscription with strict service scope |

A 10-minute support exchange at a planning cost of ৳5/minute costs ৳50. That alone exceeds the amount left from a ৳49 sale. Payment percentage fees are not the main obstacle to micro-purchases; reconciliation, confusion, refunds and support are.

One-time purchases fit static assets and completed human services. Time passes fit occasional access to continuously maintained analysis. Recurring subscriptions fit daily staff, capacity and workflow use. SMS fits prepaid usage. Reject lifetime cloud storage, lifetime all-feature ERP and pay-per-sale/pay-per-basic-print charges. Defer feature-credit currencies: taka prices are easier to understand and avoid a second wallet beside SMS.

**Comparison and cannibalization rules.** Four seven-day report passes cost ৳396; show the ৳199 30-day option before a repeat purchase. Counter + Reports for roughly a month is ৳398 versus Pro ৳399; recommend Pro only if its extra seat/storage/workflows help. Free + Reports remains valid for an owner who needs only analysis. Pro + 1 GB storage is ৳498; a one-owner shop may reasonably prefer that to Plus. Do not engineer awkward gaps to force a higher tier.

When upgrading, credit the unused time value of overlapping paid passes and the unused value of the current subscription toward the new term; show the arithmetic before payment. Apply a pass's actual paid price, not a fictional list-price saving. Independent SMS credits never disappear on plan changes. Do not resell an included benefit. Static one-time purchases stay owned and are not silently exchanged for subscription access.

**Purchase flow:** finish the current task → show a useful preview → explain benefit, total price, scope and end time → select merchant bKash/Nagad/card route → verified payment → atomic fulfillment → return to the same screen. Display pending and failed states truthfully. Only the owner buys by default; later allow a delegated buyer role with a spending cap. Manual renewal is default, no prechecked auto-renewal, no fake scarcity, and no nagging after “Not now.”

Suggested copy: “আরও বিস্তারিত ক্রয় রিপোর্ট ৭ দিন দেখুন — ৳৯৯। নিজে থেকে টাকা কাটবে না।” The free result should remain visible underneath.

Recommended refund policy for approval: seven-day first-purchase satisfaction refund for digital passes/templates, duplicate/failed fulfillment refunded automatically, consumed SMS excluded except billing/delivery faults covered by the provider policy, and undelivered setup services refundable. Annual cancellation: refund unused complete months at the original discounted allocation, without retroactively repricing used months. Keep a fraud-reviewed, auditable process; no blanket denial because a user opened a report.

## 7. SMS sourcing, prices and real margins

### Public procurement evidence

**BD Bulk SMS** advertises non-masking ৳0.36/segment at 250–1,999, ৳0.34 at 2,000–4,999, ৳0.32 at 10,000–19,999 and ৳0.30 at 50,000–99,999, with VAT/MNP included. Validity varies from three months to a year. Its minimum note says 250 SMS for ৳100, inconsistent with simply multiplying ৳0.36; masking table/minimum notes also differ. Masking advertises ৳0.63, a ৳1,000 sender registration fee and documentary approval. These discrepancies require a written quote. [S13]

**W3 SMS** currently advertises ৳500 for 1,000 non-masking segments with 15-day validity, ৳0.45 at a ৳3,000 package, and a low of ৳0.31 at ৳50,000; prices exclude VAT. Its lowest rate is not a startup landed cost. Masking starts around ৳0.70 before VAT. Published delivery statistics are provider claims, not independent reliability tests. [S14]

Use these as quote candidates, not selected or certified suppliers. BTRC maintains an A2P aggregator list and publishes listing/cancellation notices. Verify the contracting legal entity's current authority and reseller route before funding it; a website's brand name alone does not establish its status. The regulator page was indexed but direct retrieval failed during this review. [S15]

### Recommendation

Start with non-masking transactional SMS and clear business identification in the message. Obtain three written quotes, test two providers, then use one primary with a tested recovery route. Confirm landed taxes, MNP, expiry, pooling across businesses, reseller rights, balance renewal, sender approval, per-segment billing, failure charging, operator coverage, throughput, DLR semantics and support contacts. Do not buy ৳50,000 of credits merely to reach a headline low rate. Initial funding: roughly ৳5,000–৳10,000 only after tests, adjusted to measured consumption.

Run an explicitly consented delivery test using controlled recipient phones across the supported mobile operators, including ported numbers. Test short Bangla, long Bangla, ASCII, expired/invalid recipients, duplicates, timeout reconciliation and delivery delays. Reconcile provider invoices to submitted and handset-received messages. A DLR is not proof of reading; a timeout is not permission to send again blindly.

### Retail catalog and contribution

**Recommended non-masking catalog:** 100 segments ৳99; 500 ৳399; 2,000 ৳1,499. Validity 12 months from purchase; clearly remind at 30 and seven days before expiry. No revenue dependence on credit expiry. Carry unused credits into a new pack without requiring a larger purchase; if provider terms cannot support the promise, change procurement before publishing it.

The table assumes every sold segment is consumed. It includes a 15% output-tax reserve, 2.875% payment fee on gross collection, 1% refund reserve and ৳0.02/segment operational allowance. It excludes fixed salaries, infrastructure and acquisition.

| Pack | Gross price/segment | Contribution at landed cost ৳0.36 | Margin on tax-exclusive revenue | At ৳0.40 cost | At ৳0.575 cost |
|---|---:|---:|---:|---:|---:|
| 100 / ৳99 | ৳0.9900 | ৳44.25 | 51.4% | ৳40.25 | ৳22.75 |
| 500 / ৳399 | ৳0.7980 | ৳141.50 | 40.8% | ৳121.50 | ৳34.00 |
| 2,000 / ৳1,499 | ৳0.7495 | ৳485.39 | 37.2% | ৳405.39 | ৳55.39 |

The ৳0.575 stress case illustrates ৳0.50 plus an assumed 15% supplier tax when not recoverable; it is not a confirmed W3 invoice. At that cost the largest pack's margin falls to approximately 4.2%. **Do not launch the discounted packs unless effective landed cost is at most ৳0.40 and measured contribution is at least 30% of tax-exclusive revenue.** Higher costs require repricing future packs or changing supplier, while honoring existing paid credits.

Formula: `pack contribution = gross_price / (1 + output_tax_rate) − gross_price × (gateway_rate + refund_rate) − segments × (landed_supplier_cost + operational_allowance)`.

This raises the earlier ৳89/৳349/৳1,299 proposals to give room for tax, delivery reconciliation and support. The higher prices are still hypotheses about demand. HisabIQ must justify the markup with linked receipts, one-click reminders, safe recipient selection and understandable balance—not conceal that standalone gateways can be cheaper.

Masking is quote-only initially. A provisional future floor is **500 segments for ৳699 plus sender-registration cost passed through transparently**, only if landed cost is at most ৳0.70 and the supplier permits that volume. Do not promise every tiny shop its own sender ID or immediate approval. Authentication OTP traffic is a platform cost with a separately tested route, not deducted from a merchant's marketing wallet.

### Bangla billing and financial treatment

Standard SMS typically holds 160 GSM-7 units or 70 UCS-2 units; concatenated messages usually allow 153 or 67 per segment. Bangla normally uses Unicode. Count encoding units, not visible letters; combining marks and emoji can increase usage. A 100-unit Bangla message normally bills two segments. Use the actual provider's rules and include appended business/opt-out text before estimating. [S16]

Show “100 recipients × 2 segments = 200 credits” before sending. Distinguish submitted, accepted, delivered, failed and unresolved. Reserve credits before dispatch; finalize from reconciled provider results. Refund/release when not provider-billed; compensate duplicates caused by HisabIQ. Clearly explain any provider-billed unsuccessful delivery. Avoid automatic promotional blasts; obtain appropriate customer consent and honor opt-outs.

An SMS recharge creates a service obligation. Track opening credits + purchases + adjustments − consumption − lawful expiry = closing credits. Recognize messaging revenue as delivered/billable service under the agreed accounting policy, not simply on every recharge. Keep unconsumed credit liability and the corresponding expected supplier cost visible. Do not count a large recharge as current profit.

**Example of practical scale:** 60 buyers consuming 500 segments each generate ৳23,940 gross billing but only about ৳8,490 package contribution at the central assumptions. That cannot fund a ৳30,000 support employee by itself. At the 500-pack contribution, approximately 106,000 consumed segments/month are needed just to cover that salary; this excludes the rest of the business.

## 8. Payments, taxes and the small-purchase constraint

SSLCOMMERZ publishes **৳25,500 non-refundable setup and 2.5% per successful standard-channel transaction**, 3.5% for AMEX. The page does not settle every tax, refund, minimum-charge, settlement-delay or negotiated-contract question. bKash offers direct online APIs but the reviewed pages do not publish a universal merchant MDR; Nagad's public merchant pages did not establish a reliable API tariff. Obtain written commercial terms. Do not substitute personal send-money accounts or assume consumer cash-out fees equal merchant checkout fees. [S17, S11, S12]

**Implementation sequence:** for the first small paid cohort, an approved merchant collection account plus the existing audited manual review can work. Clearly label delayed fulfillment. Move to verified gateway callbacks/query reconciliation before aggressively promoting ৳49–৳199 instant purchases. Never activate from a screenshot or client success redirect alone. Reconcile order, amount, currency, merchant account and provider reference; duplicate notifications fulfill once.

At an assumed three minutes of manual verification and ৳5/minute, 300 orders cost ৳4,500 in labor. The advertised ৳25,500 setup fee equals about 1,700 such verifications in time cost alone, before provider fee differences. Automation also reduces delay and fraud; compare its complete cost, not only this simple payback.

For pricing experiments, allow ৳49 direct payment if contract minimums permit. Do not force a ৳500 wallet load to buy a ৳49 benefit. Bundle checkout for several selected purchases and offer clear term renewal. Keep SMS credits separate from general cash balances and avoid creating a transferable wallet.

**Tax uncertainty is material.** NBR's SRO 147/2026 provides specified VAT exemptions for qualifying, NBR-registered startups, effective 1 July 2026 with stated duration. Qualification is not automatic merely because HisabIQ is new. Public tax summaries also distinguish standard and reduced categories. This review does not establish Sher Software Solutions' legal entity, registration, service classification, SMS resale treatment, input-credit eligibility or income-tax status. [S18, S19]

Use a local accountant to document each SKU's treatment, applicable registration, withholding, import-of-service taxes and invoice obligations before publication. The model reserves 15% output VAT inside the proposed retail price, assumes no input-credit recovery, and stresses 0% and 5%; this is conservative planning, not a conclusion that every SKU legally bears 15%. Supplier VAT already included in landed SMS cost is not added again. Corporate income tax is excluded from pre-tax operating results; any turnover/minimum tax must be added once entity-specific rules are confirmed. Do not label the modeled result after-tax profit.

**Web first.** Here “in-app purchases” means purchases within HisabIQ's web application. A later Play-distributed Android app introduces payment-policy and service-fee considerations; Google's policy expressly includes cloud/business-productivity functionality. Do not assume a WebView permits unrestricted bKash checkout or apply the web fee model to native distribution. Recheck eligibility and fees before that release. [S20]

## 9. Customer success and the minimal Control Center

### Support promise

Free users receive self-service help, Bangla short videos, safe account-access assistance, billing corrections, incident reports and bug fixes. Serious data-integrity/security incidents are triaged by severity across all plans. Priority pricing must not mean deliberately leaving Free users with incorrect balances.

Launch staffed support **Saturday–Thursday, 10:00–18:00 Bangladesh time**, with published holidays. Targets in the tier table concern first response during those hours, not guaranteed resolution or 24/7 coverage. A single employee cannot cover all these hours, leave and emergencies alone; founder coverage or a rota is required. Do not sell a contractual SLA before coverage is proven.

Self-service is best for column visibility, language, date filters and standard invoice selection. Use screenshots with sensitive information excluded and short task videos. Human help is most valuable for initial setup, unexplained balances, migration validation and persistent workflow misunderstanding. A staff member should be able to send a deep link to the relevant setting before requesting any data access.

At the planning rate of ৳300 per productive hour, a ৳399/30-minute session costs approximately ৳150 of delivery time, leaving about ৳177 after modeled taxes, fees and refund reserve, before overhead. A ৳999/60-minute setup leaves about ৳520 after the same reserves and ৳300 labor. Scope overruns erase this margin: stop, explain and obtain a separate quote rather than silently spending three hours.

Complex historical migration starts with a paid diagnostic, provisionally ৳1,999 for up to two hours; implementation is quoted separately. Onsite visits are separately quoted for travel and time. No unlimited setup, no dedicated engineer in a ৳599 plan, no charging to fix HisabIQ's own bug.

### Cost and capacity

Planning assumption: **৳25,000 salary + ৳5,000 equipment, connectivity, benefits/training reserve = ৳30,000 loaded monthly cost** for an initial support role. This is a budget assumption, not a verified market median or a guaranteed hiring quote. Validate with three actual candidates. Reserve 100 productive hours/month from paid time, price direct work at ৳300/hour, and schedule no more than 90 hours of demand to preserve incident capacity. A more experienced technical support role may cost substantially more.

Steady-state expected-load illustration: MAU = 35% of registrations; 30% of MAU contact monthly, 12 minutes each; 2% of inactive accounts need eight minutes; 15 shared hours for triage, documentation and follow-up. Initial onboarding is additional.

| Registered businesses | MAU assumption | Steady-state workload/month | Capacity implication |
|---|---:|---:|---|
| 100 | 35 | 17.3 hours | Founder/part-time can cover; approximately ৳5,200 productive-time value |
| 500 | 175 | 26.4 hours | Approximately ৳7,900 work value; response-window coverage still needed |
| 1,000 | 350 | 37.7 hours | One agent has capacity but incurs a full ৳30,000 payroll, not only ৳11,300 used-time value |
| 5,000 | 1,750 | 128.7 hours | At least two agents at 90 planned hours each; approximately ৳60,000 payroll |

For 1,000 initial signups, a 20-minute individual onboarding for everyone is **333 hours**, before ongoing support. Prefer group demos and voluntary callback: if 35% request 20 minutes, that is 117 hours across the acquisition period. At 60% requesting 30 minutes, onboarding becomes 300 hours. The latter cannot be absorbed by one agent plus ongoing work; slow recruitment, simplify or add staff. Track minutes per activated business, not just ticket count.

### Minimal secure administration

Preserve the existing SaaS shell. Start with tenant lookup, effective features, payment review, ticket-linked setting proposals, consent, history and undo. No generic remote desktop or “log in as owner.”

Keep these authorities distinct:

| Domain | Example | Owner of decision |
|---|---|---|
| Commercial entitlement | Reports Plus valid until a date | Settled order or bounded promotional grant |
| Presentation preference | Profit column hidden on the owner's screen | User/tenant settings policy |
| Employee authorization | Cashier must never receive profit/cost fields | Tenant owner and server permission checks |
| Support delegation | Engineer may change one approved column setting | Customer-approved, ticket-bound support capability |

A purchase does not grant employee privileges. A support lease does not buy a feature. Hiding a column does not secure its values. A customer's paid capability is not an authorization for support to enter their business.

**Hide Profit example:** confirm business and target user → propose one specific before/after change → owner/user approves appropriate scope → server validates current revision and support identity → change and audit commit atomically → customer sees result and Undo. No access to sales values is required for this operation. If the request is confidentiality from staff, use a separate server-enforced sensitive-field permission covering APIs, details, reports, exports and printing.

For V1, make the approval **single-use, exact setting/action/value/target, valid for 15 minutes**, with an idempotent command identifier. Retry returns the original result; it does not consume another approval or duplicate an audit. Require consent again if the target or value changes. Avoid free-text scopes and arbitrary JSON patch paths.

Registry fields: stable key, type, valid values, default, scope, dependencies, implementation status, sensitivity, allowed actor class and revision. Begin with approximately 10–20 safe settings actually consumed by the UI. Reject unknown keys; validate dependency cycles at build/release; preview dependent effects. Separate customer-disabled from unpaid, unimplemented and employee-denied states.

Preference precedence: application default → tenant default → user preference; keep device/form-factor choices as local presentation overrides initially. An owner-enforced security rule always wins. Do not build a generalized four-level inheritance engine before needed. On concurrent edits, compare revision and show a conflict; Undo itself is a new authorized audited mutation.

Support access checks: authenticated real employee, active platform role, exact tenant, customer authority, ticket, approved capability, current time, revocation and revision on every privileged request. Tenant financial APIs still require their own authorization. Keep staff identity visible; never copy customer cookies or request OTP/PIN/password. Staff MFA and prompt deactivation are launch prerequisites for platform access.

Read-only live support views come later only if setting commands cannot solve repeated requests. Use a named engineer banner, exact module/data scope, 15-minute lease, customer “End access now,” server revocation and access logs. Exclude customer lists, attachments, exports and financial values unless separately necessary and approved. Never record sessions by default. Emergency recovery remains separate from support delegation.

Support may issue one seven-day report trial per business per 90 days within an approved grant budget; no SMS cash-equivalent credits or refunds through that permission. Longer/repeated grants require a separate approver. Platform billing staff verify money; support does not mark its own payment approved. No self-approved refunds, price changes or ownership changes.

Owner-visible audit includes actual actor, tenant, approving customer, ticket, action, before/after, reason, timestamp and reversal link. Restrict staff access to assigned tickets/tenants, redact search results, rate-limit enumeration, and alert on unusual access. Private notes and payment evidence must not leak to tenant-facing threads. Use expiring signed attachment URLs, file type/size checks and private storage.

## 10. Financial model: 1,000 registrations are not 1,000 customers using the product

### Definitions and assumptions

**Registered:** a distinct verified business, not a phone click or duplicate tenant. **Activated:** a real business transaction or ledger workflow plus a return visit within seven days. **D30 retained:** meaningful business activity in days 23–37 after activation; report only cohorts old enough to qualify. **MAU:** at least one meaningful business action in rolling 30 days; report a separate weekly-active measure to avoid counting one login as habitual use. Test/demo events never qualify.

All conversion, activity, churn, repeat purchase and cost values below are **planning assumptions**, not survey findings, competitor benchmarks or promises. The month represents a possible run-rate after reaching 1,000 cumulative registrations. D30 and MAU refer to different observation windows; reactivations and recent activity can make MAU exceed D30-retained counts.

| Funnel or usage assumption | Pessimistic | Expected planning case | Optimistic |
|---|---:|---:|---:|
| Genuine registered businesses | 1,000 | 1,000 | 1,000 |
| Activated | 300 | 550 | 800 |
| D30-retained businesses | 150 | 300 | 550 |
| MAU | 180 | 350 | 650 |
| Counter / Pro / Plus subscribers | 8 / 5 / 2 | 20 / 25 / 10 | 40 / 50 / 30 |
| Subscribers as % registrations | 1.5% | 5.5% | 12.0% |
| Subscribers as % MAU | 8.3% | 15.7% | 18.5% |
| Standalone feature buyers | 10 | 50 | 110 |
| Purchases per feature buyer/month | 1.0 | 1.1 | 1.2 |
| Average feature purchase | ৳119 | ৳149 | ৳149 |
| Feature buyers who also bought previous month | 20% | 35% | 50% |
| SMS buyers | 15 | 60 | 150 |
| Segments consumed per SMS buyer | 200 | 500 | 800 |
| SMS buyers purchasing again from previous month | 30% | 50% | 65% |
| SMS weighted retail price/segment | ৳0.9900 | ৳0.7980 | ৳0.7495 |
| Effective landed supplier cost/segment | ৳0.45 | ৳0.36 | ৳0.36 |
| Delivered setup services/month at ৳999 | 1 | 4 | 10 |
| Monthly subscriber churn | 10% | 6% | 3% |
| Refund reserve on gross billings | 3% | 2% | 1% |
| Acquisition cash cost per registration | ৳180 | ৳100 | ৳60 |

To avoid adding overlapping payers, one possible disjoint allocation is:

| Payer group | Pessimistic | Expected | Optimistic |
|---|---:|---:|---:|
| Subscribers, including any SMS use | 15 | 55 | 120 |
| Non-subscriber feature-only | 8 | 30 | 60 |
| Non-subscriber SMS-only | 10 | 40 | 100 |
| Non-subscriber feature + SMS | 2 | 20 | 50 |
| **Unique monthly paying businesses** | **35** | **145** | **330** |
| **Paying share of MAU** | **19.4%** | **41.4%** | **50.8%** |

In the pessimistic allocation, three subscribers also buy SMS. In the other two, SMS buyers are assigned to non-subscriber groups for simplicity. Service buyers are subsets of these groups, not additional unique payers. The expected case already requires a substantial 41% of active businesses to pay for something; it is not a conservative claim about likely demand.

Average feature price ৳149 corresponds to a 50:50 order mix of ৳99 and ৳199; ৳119 corresponds to 80:20. One-time print-design revenue is excluded so it cannot masquerade as recurring income. Multiple purchases can be reports and storage. Repeat percentages describe composition of the buyer cohort and are not multiplied again into the month's already-specified orders. As novelty buyers run out, the same purchase counts cannot be assumed indefinitely.

### Monthly results, BDT

For comparability, all modeled subscription/pass service is earned in the month, all modeled SMS segments are consumed, and setup jobs are completed. Actual cash collection will differ with prepaid credit balances and annual terms.

| Item | Pessimistic | Expected | Optimistic |
|---|---:|---:|---:|
| Subscription billings | 4,785 | 19,945 | 45,880 |
| Feature-pass billings | 1,190 | 8,195 | 19,668 |
| SMS billings | 2,970 | 23,940 | 89,940 |
| Setup-service billings | 999 | 3,996 | 9,990 |
| **Gross billings** | **9,944** | **56,076** | **165,478** |
| Revenue after 15% output-tax reserve | 8,647 | 48,762 | 143,894 |
| Payment fees, modeled 2.875% of gross | (286) | (1,612) | (4,757) |
| Refund reserve | (298) | (1,122) | (1,655) |
| Consumed SMS wholesale cost | (1,350) | (10,800) | (43,200) |
| SMS operational allowance, ৳0.02/segment | (60) | (600) | (2,400) |
| Usage-related infrastructure, ৳4/MAU | (720) | (1,400) | (2,600) |
| **Contribution before fixed operating costs** | **5,933** | **33,228** | **89,282** |
| Baseline infrastructure/backups/monitoring | (4,500) | (6,500) | (10,000) |
| Loaded support payroll | (30,000) | (30,000) | (45,000) |
| Administration/bookkeeping/tools | (3,000) | (4,000) | (6,000) |
| Ongoing acquisition/retention marketing | (4,000) | (6,000) | (10,000) |
| **Operating result before founder/engineering/income tax** | **−35,567** | **−13,272** | **18,282** |
| Founder compensation assumption | (30,000) | (30,000) | (30,000) |
| Engineering/maintenance assumption | (50,000) | (50,000) | (50,000) |
| **Fully loaded modeled pre-tax result** | **−115,567** | **−93,272** | **−61,718** |

Rounding can differ by ৳1. Support payroll includes delivery of setup and included assistance; do not deduct the same labor again. The optimistic ৳45,000 allocation allows more experienced/extra coverage, not a guaranteed staffing market quote. Initial acquisition spending and gateway setup are separate cohort/launch costs, not repeatedly expensed in each month shown.

### Formulas and infrastructure assumptions

`Subscription billings = Counter_count × 199 + Pro_count × 399 + Plus_count × 599`.

`Pass billings = monthly_feature_buyers × orders_per_buyer × weighted_order_price`.

`SMS earned billings = consumed_segments × weighted_retail_price` in this simplified equal-purchase/consumption month. For actual accounting, allocate each credit's purchase price and taxes rather than multiplying all usage by today's list price.

`Revenue = gross_billings / (1 + output_tax_rate)`; `payment_cost = gross_collections × effective_fee + order_count × fixed_fee`. Fixed fee is assumed zero pending a contract. Effective 2.875% assumes a 2.5% fee plus 15% unrecovered tax on that fee; the surcharge is a planning assumption.

`Contribution = revenue − payment_cost − refund_reserve − SMS_cost − SMS_operations − usage_infrastructure`.

`Operating_result = contribution − baseline_infrastructure − support_payroll − administration − ongoing_marketing`.

Expected baseline infrastructure budget ৳6,500: API/queue/cache approximately ৳2,000; database/restore history ৳2,500; object storage and independent backups ৳500; logs/alerts/email/domain allocation ৳1,000; OTP/abuse/overrun reserve ৳500. Add ৳4 per active business for usage sensitivity. These are workload budgets, not contracted quotes. Production runtime selection remains with ByabsIQ; Cloudflare UI preview is not evidence of a deployed Worker backend.

For calibration, Neon advertises Launch compute at $0.106/CU-hour and storage at $0.35/GB-month, with separate history/snapshot costs. At an **assumed planning exchange rate** ৳125/USD, 0.25 average CU for 730 hours plus 10 GB is about ৳2,856 before history/tax; 1 average CU plus 20 GB is about ৳10,548. This demonstrates why query load matters more than signup count; ৳2,500 is a target to test, not assured capacity. [S21]

R2 standard storage advertises $0.015/GB-month with operation charges and no egress fee. One thousand businesses each using 25 MB is about 25 GB raw; even 2 TB raw is about $30/month before operations, additional copies and taxes. This is a cost reference, not a recommendation to change infrastructure. Attachment pricing should cover the document workflow, scanning, access control, support and long-term retention—not claim that raw bytes cost ৳99/GB. [S22]

Do not rely on free-tier credits to claim sustainable margins. Measure database load, backup growth, API latency, attachment operations and restoration time at realistic transaction density. A daily backup does not itself prove restoration or acceptable data loss.

### CAC, churn, lifetime contribution and break-even

| Acquisition measure | Pessimistic | Expected | Optimistic |
|---|---:|---:|---:|
| Cash acquisition spend for 1,000 registrations | ৳180,000 | ৳100,000 | ৳60,000 |
| Cash cost per activated business | ৳600 | ৳182 | ৳75 |
| Cash cost per current MAU | ৳1,000 | ৳286 | ৳92 |
| Spend / current unique payer count | ৳5,143 | ৳690 | ৳182 |

These are different denominators. “Spend/current payer” is a cohort allocation, not a measured incremental paid-customer CAC. Field labor or onboarding funded separately must be added for fully loaded CAC. Referral credits are valued at expected delivery cost, and recorded; they are not free acquisition.

Subscriber churn of 6% at 55 subscribers requires about 3.3 new/reactivated subscribers monthly merely to stand still. At 10% of 15 it is 1.5; at 3% of 120 it is 3.6. At small counts use exact cohort histories, not spurious decimal precision.

General LTV formula: `LTV_H = sum over months 1..H of [probability active in month × expected contribution conditional on activity] − attributable onboarding cost`. Include free months and users who never pay. Recompute using cohort observations; do not multiply a subscriber LTV by all signups.

Illustrative subscriber calculation: expected plan ARPU = ৳19,945 / 55 = ৳362.64. After the modeled tax/fee/refund factors, ৳25 direct support and ৳4 variable hosting, monthly contribution is ৳268.66. At constant 6% churn, the simple infinite-horizon value is ৳4,478; the 24-month value is about ৳3,463. Both exclude fixed overhead and unpaid-user costs, and the churn assumption is unvalidated. They are not company-wide LTV.

More conservative cohort view: recurring contribution before fixed costs in the expected scenario is ৳29,948 after excluding setup-service contribution, or ৳85.57/MAU. Subtract an illustrative ৳18 direct recurring support cost/MAU, giving ৳67.57. At assumed 8% monthly activity attrition, 12-month contribution is about ৳534 per currently active business, versus ৳286 cash acquisition cost: **1.87×**, before fixed idle capacity and onboarding. Conditional payback is about 4.2 months. This does not meet a prudent 3× margin-of-safety target, and actual full payroll still produces a loss.

Lower-bound break-even at unchanged mix and fixed capacity: `required_MAU = fixed_cost / recurring_contribution_per_MAU`. Expected: ৳46,500 / ৳85.57 ≈ **544 MAU**, or roughly **1,553 registrations at 35% activity**. Including ৳80,000 founder/engineering gives approximately **1,479 MAU / 4,224 registrations**. These are optimistic mathematical thresholds because staffing, infrastructure and acquisition cost rise with scale.

At 5,000 registrations and the expected 35% MAU/mix, recurring contribution scales to roughly ৳149,740. A more realistic scale budget of support ৳60,000, infrastructure ৳15,000, administration ৳8,000, ongoing marketing ৳15,000 and founder/engineering ৳80,000 totals ৳178,000: still around **৳28,260 monthly loss**. More signups alone do not fix weak monetization or expensive support.

### Failure conditions and sensitivity

- If just 2% of 1,000 registrations buy a ৳199 subscription, gross billing is ৳3,980 and about ৳3,267 remains after the central tax/fee/refund factors, before hosting/support. This cannot subsidize a staffed free service.
- If effective SMS cost rises from ৳0.36 to ৳0.575, expected wholesale expense increases by ৳6,450/month; optimistic increases by ৳25,800. Discounted packs become unattractive.
- An extra five human minutes per MAU at ৳5/minute costs ৳8,750/month at 350 MAU and ৳16,250 at 650. This is larger than many pricing tweaks.
- Moving the expected output-tax assumption from 15% to 5% increases modeled net revenue by roughly ৳4,644; to 0% by ৳7,314. It improves but does not eliminate the central operating loss. No exemption should be presumed.
- If expected repeat demand weakens and feature orders halve, billings fall ৳4,097.50 and contribution about ৳3,363 before any associated cost reduction. One-time template sales cannot replace recurring retention.
- If all subscriptions later use the recommended 11-for-12 annual price, subscription revenue per service month falls 8.33%; measure whether reduced churn and collection costs compensate.
- A higher VAT-inclusive payment fee, fixed minimum charge, payout delay, fraudulent proof, refunds, API duplication or prepaid credit liability can consume a small transaction's margin.
- A platform outage or incorrect ledger can damage trust more than a discount can repair. Stop growth during unresolved integrity incidents.

### Runway recommendation

The 90-day market experiment begins **after launch-readiness**, not today by assumption. A conservative expected budget with no reliance on revenues: three months of baseline operations excluding acquisition marketing (৳40,500 × 3 = ৳121,500), founder/engineering (৳240,000), acquisition cash (৳100,000), advertised gateway setup (৳25,500), research/accounting reserve (৳20,000) and SMS working-capital float (৳15,000): **৳522,000**, or about **৳626,400 with 20% contingency**.

Round to **৳6.3 lakh** for a fully costed 90-day learning budget. If founder and engineering are unpaid, cash need falls to about **৳3.4 lakh**, but those economic costs still exist. Pre-launch backend completion, equipment purchases, entity setup, any tax on gateway setup and substantial onsite travel may add cost. Release funds in stages; unused provider credits are working capital, not revenue.

## 11. Acquiring and retaining the first 1,000 businesses

### Acquisition design

Start with two adjacent verticals and a few markets where demonstrations and follow-up are affordable. A trusted local introducer is a hypothesis to test, not permission to expose customer data or claim association endorsements without consent.

| Channel | Provisional 1,000-registration allocation | Execution and cost control |
|---|---:|---|
| Founder/local market demonstrations | 250 | Short appointment-based demos with real sample tasks; track travel and field time |
| Merchant referrals | 300 | Reward only after independent verification and meaningful retained use; cap abuse |
| Printer/computer/accounting partners | 200 | Train a small number; pay for verified activation/retention, not lists of numbers |
| Bangla tutorials, community sessions and organic discovery | 200 | Demonstrate one practical task per video; separate organic from staff-driven signups |
| Small paid acquisition tests | 50 | Stop ads with weak retained-use economics; avoid mass install campaigns |

These are allocation goals, not forecastable channel yields. Verify one business entity/owner contact and a real operating use case; do not require a trade license for ordinary ERP entry unless legally necessary. Use phone verification and duplicate review, not invasive identity collection solely for marketing metrics.

Referral default: after the referred shop passes the D30 activity gate, each eligible business receives **50 non-cash SMS credits**, once per verified referral, capped at five rewards/month for the referrer. At ৳0.36 cost the two sides cost approximately ৳36 when consumed. Exclude self-referrals, duplicate shops and circular rewards. These promotional segments have a separate ledger; only send with consent. Test against a seven-day report trial, not cash bounty competition.

Positioning: “দোকানের হিসাব, স্টক ও বাকি—সহজে। প্রয়োজন হলে বাড়তি সুবিধা কিনুন।” Show what is permanently free on the signup screen. Publish your business identity, contact hours, data/export policy and honest service status. A good testimonial names a real problem solved with permission; do not invent savings.

Retention: a small import, first real sale/due record, next-day review, useful weekly stock/due summary and easy recovery from errors. Offer opt-in reminders; never create customer SMS campaigns by default. If no activity occurs, ask one short reason and offer one relevant help link, not repeated upsells.

Do not infer business profitability from software usage. For value evidence, record merchant-confirmed minutes saved, fewer reconciliation steps, or dues followed up; do not attribute all recovered money or sales growth to HisabIQ.

### 90-day plan after readiness

| Period | Work | Cumulative registration goal | Decision gate |
|---|---|---:|---|
| Days 1–14 | Recruit 30 interviews across six verticals; 10 observed task sessions; onboard first 30–50 live shops; begin supplier/payment tests | 50 | No unresolved critical posting/isolation failures; ordinary receipt/export and free expiry behavior work |
| Days 15–30 | Concentrate on hardware/electrical; group onboarding; fix top three abandonment causes; measure baseline support | 150 | Activation ≥50% in eligible cohorts; median first useful task ≤15 minutes after minimum setup; measure assisted setup separately |
| Days 31–45 | Expand two channels; start one report-price experiment with real paid delivery; launch reconciled SMS | 300 | D30 retention ≥50% of activated, mature cohort; support capacity below 75% planned load |
| Days 46–60 | Assess report repeat purchase, message margin and referrals; improve one workflow | 500 | SMS contribution ≥30%; no material unexplained credit/settlement mismatch; actual purchase demand beyond friends/family |
| Days 61–75 | Expand winning local partners and verified referrals; offer bounded setup services | 750 | Retained-active acquisition payback plausible within six months; direct recurring contribution/MAU trending ≥৳100 before fixed overhead |
| Days 76–90 | Reach 1,000 only if gates hold; review costs, cohorts and support promises; decide next budget | 1,000 stretch | At least 350 MAU target, reliable financial controls, positive direct contribution; no automatic claim of business break-even |

Targets are managerial stop/go thresholds, not market benchmarks. Registrations acquired late in the experiment cannot have D30 retention by day 90; continue that measurement through day 120. Missing a target means slow down and investigate, not move the denominator or buy empty signups.

**Primary fieldwork design:** five participants each in hardware, electrical, fabric, furniture, grocery and pharmacy; recruit across metro/district/nearby semi-urban settings and different digital experience, with deliberate inclusion of women owners where accessible. Thirty interviews reveal patterns, not population percentages. Do not ask staff to guess the owner's spending authority.

Interview tasks: describe the last recordkeeping loss or dispute; show current workflow with consent; state current software/data/printer/support spending; demonstrate one free result; choose between explicit offers; explain what would make them refuse; attempt export and support consent; return seven days later. Record recruitment, incentives, refusals and reasons, not just favorable quotes. No actual respondents were recruited for this report.

Run price tests sequentially to avoid splitting a small audience across five weak cells. First compare **Reports 30 days at ৳149 versus ৳199** among eligible active businesses, with clearly disclosed pilot offers and price protection for participants. Primary metric: 60-day net contribution per exposed eligible business. Guardrails: retention, refund complaints and support minutes. Secondary: paid conversion and repeat purchase. Then test ৳99 seven-day access among occasional users; do not compare different durations as if the price were the only variable. Test ৳49 only after automated payment economics are measured. Use cluster-aware offers where neighboring merchants compare prices.

A pilot with 40–50 exposures per arm is directional, not reliable proof of a small conversion difference. Choose formal sample size once baseline rates and a meaningful effect are observed. Continue or report uncertainty rather than declaring a winner from three purchases.

Test assistance against self-service through scheduled cohort rollout. Primary metric: incremental cost per additional D30-retained business; secondary: completion time and privacy comprehension. Have merchants explain the support consent in their own words. Do not provide worse bug handling to a control group.

**Stop rules:** pause acquisition on unresolved wrong-tenant access, unexplained ledger discrepancy, duplicate money/credit fulfillment or failed restore. Pause a paid SKU if material usefulness is unproven or refunds exceed a predeclared 5% investigation threshold. Stop channel spending if retained-customer cost cannot plausibly recover within six months at measured contribution. Do not withdraw existing paid rights to improve the metrics.

## 12. Prioritized product and architecture roadmap

| Priority | Reuse / build / simplify | Acceptance before advancing |
|---|---|---|
| **P0: real core business** | Reuse current React components and ByabsIQ auth/products/inventory. Complete and integrate sale, purchase, return, stock, payment and party-ledger contracts. | Real multi-tenant end-to-end postings; duplicate-request and failure rollback; invoice/stock/ledger reconciliation; backup restore; mobile/network error recovery |
| **P0: Free lifecycle** | Separate business lifecycle from paid subscription state. Introduce permanent Free, graceful paid expiry and historical-data rights. | Trial/cancel/downgrade never blocks ordinary Free operations; suspension is a distinct reviewed control |
| **P1: small commerce core** | Versioned catalog, orders, verified settlement, entitlement grants, SMS ledger and audit inside ByabsIQ. Extend existing payment-review/idempotency patterns. | Callback replay, manual duplicate proof, refund, partial settlement and concurrent grant changes reconcile exactly |
| **P1: narrow settings support** | Adapt Nest known-key/dependency pattern; reuse Sales picker and SaaS tickets. Add exact-action consent, revision and undo. | Wrong tenant/user/key, expired/revoked consent and stale revision denied; private data not exposed |
| **P1: money and SMS operations** | One provider integration, settlement query/reconciliation job, outbox and bounded retries. | Provider invoice and credits agree; no retry duplicates; clear unresolved delivery states |
| **P2: monetize evidence-backed value** | Advanced reports from reconciled data; attachment storage with quotas; template pack only if requested. | Report definitions tested; unknown cost disclosed; file access isolated; paid claims match implemented features |
| **P2: measure and improve** | Small cohort and contribution dashboard using real events and support time. | Signups, activation, D30, MAU and unique payer measures cannot be confused |
| **Later** | Read-only support visits, additional verticals, installment/bundle enhancements, richer automation | Repeated customer need and positive delivery economics justify complexity |
| **Defer/reject now** | On-prem licensing, separate admin app, native-app billing, generalized policy DSL, AI profit adviser, multi-branch, offline sync, unlimited WhatsApp/SMS, unlimited attachments/support | Separate business case and approved architecture required |

Keep one modular backend; no new microservice network is justified by 1,000 registrations. A small static typed capability catalog plus tables for grants/orders/settings is sufficient. The effective-access service should explain entitlement, employee permission, customer setting, quota and denial reason while preserving their separate authority sources.

Financial amounts use exact decimal/minor-unit representations; time-bound grants use server time. Plan changes retain catalog and price snapshots. Add an outbox for external effects so committed payment does not depend on a browser staying open. Reconciliation jobs recover missed callbacks. Never make localStorage the source of purchased access or money.

Preserve HisabIQ design authority: actual existing components, Ink/Teal/Mint, Geist/Hind Siliguri, proportional numbers, Party Ledger underline tabs, 36px ordinary controls and 48px explicitly designated transaction-completion actions. Products table typography remains 13px data / 12px headings / 11px helpers. The supplied older export is useful context but must not overwrite newer approved repository behavior.

## 13. Final Keep / Change / Reject / Test decisions

Every row is a recommended owner decision, not a production change.

| Decision | Verdict | Recommended default |
|---|---|---|
| Useful permanent Free ERP | **Keep** | One owner, 500 products, genuine core workflows, no ordinary transaction/print toll |
| 1,000 genuine registrations as first milestone | **Keep** | Track separately from activation, D30, MAU and unique payers |
| Treat 1,000 signups as profitability | **Reject** | Fund a measured pilot; require contribution and retention gates |
| Counter ৳199 | **Keep / Test** | Capacity, second seat and convenience; no paid lock on basic correctness |
| Medium ৳399 | **Change** | Rename Pro; advanced decisions and three seats |
| Premium ৳599 | **Change** | Rename Plus; five seats, 2 GB and bounded assistance |
| Separate Pro/Plus/Premium beyond four total tiers | **Reject** | Free / Counter / Pro / Plus only |
| Annual terms | **Test later** | 11-for-12 pricing after stability/two paid months; no forced annual purchase |
| Universal automatic 15-day trial | **Reject** | Free immediately; contextual optional seven-day report trial |
| Universal ৳149 feature price | **Reject** | Duration/cost/value-specific catalog |
| ৳149 one-time purchase | **Keep narrowly** | Static design pack, with explicit scope; no lifetime hosting promise |
| ৳49 micro-purchases | **Test later** | Automated, occasional use only; no human support bundled |
| ৳99 purchases | **Keep / Test** | Seven-day reports and 30-day attachment capacity |
| ৳199 Reports 30 days | **Test** | Central default, compare fairly with ৳149 and Counter/Pro alternatives |
| Ordinary invoice/thermal printing | **Keep free** | No watermark obscuring content, allowance countdown or historical reprint fee |
| Basic owner profit, low-stock and due reports | **Keep free** | Charge for deeper analysis, not access to ordinary business facts |
| Multi-unit and split payment | **Keep free** | Essential product fit, especially hardware |
| All users must subscribe | **Reject** | Independent profitable SMS/pass buyers are valid customers |
| SMS as the main profit engine | **Change** | Supplementary margin; monitor consumed contribution and service obligation |
| Earlier ৳89/৳349/৳1,299 SMS packs | **Change** | ৳99/৳399/৳1,499, conditional on landed ≤৳0.40 and ≥30% margin |
| Customer-specific masking | **Build later** | Quote-only approval and verified supplier minimums |
| SMS validity and unused credits | **Change** | 12 months, reminders, carry-forward on recharge; no dependence on breakage |
| Included monthly SMS in every tier | **Reject initially** | One controlled five-segment activation sample; otherwise separate credits |
| Unlimited WhatsApp | **Reject** | Manual sharing may be free; API automation requires separate priced provider integration |
| Buy extra features as an employee | **Change** | Owner only initially; later explicit buyer role/cap |
| Upgrade with overlapping pass | **Keep fair** | Credit remaining actual paid value and show exact calculation |
| Renewal | **Keep manual** | Auto-renew only by explicit later consent and compliant payment support |
| Refunds | **Change** | Clear first-purchase remedy, duplicate/failure refund and unused-term treatment |
| Unlimited human help for Free | **Reject** | Good essential support, group teaching and one brief optional activation callback |
| Premium paid bug fixes | **Reject** | Product faults and security incidents handled across tiers |
| Paid advanced setup | **Test** | ৳999/60 minutes bounded import; configuration ৳399/30 minutes |
| Dedicated manager at ৳599 | **Reject** | Priority queue plus bounded session; dedicated service separately quoted |
| Remote column configuration | **Keep** | Specific consented command with audit/undo; no financial-data access needed |
| Hide Profit to protect staff confidentiality | **Change** | Separate server field permission across API/export/print/report surfaces |
| Unrestricted impersonation | **Reject** | Own staff identity; exact action delegation; read-only visits later |
| Support consent duration | **Change** | Single-use action approval valid 15 minutes; renew for changed scope |
| Tenant/user/device inheritance | **Simplify** | Server tenant/user preference first; device presentation stays local initially |
| Complimentary grants | **Keep bounded** | Seven-day report grant once/90 days; budget, reason, audit, separate escalation |
| NestSherERP reuse | **Keep selectively** | Typed registry/dependencies/audit concepts; no Vue migration or permissive stub |
| Existing UI backend status | **Change expectation** | Preview is not production; complete core workflow before scale |
| First verticals | **Choose** | Hardware/electrical first; selective fabric/furniture; pharmacy/grocery later |
| Native Android/offline/multi-branch now | **Defer** | Web/online single-shop V1; acknowledge competitor tradeoff |
| Tax assumption | **Validate before prices** | SKU-specific accountant sign-off; 15% reserve in planning, test eligible startup relief |
| Acquisition budget | **Approve in stages** | Expected ৳100k cash cohort acquisition; overall 90-day fully costed reserve about ৳6.3 lakh |
| Scale after day 90 | **Conditional** | Mature retention, direct margin, support capacity and credible payback; continue measurement to day 120 |

## 14. Source register and unresolved evidence

All URLs checked **25 October 2026**. Undated pages are current advertised snapshots, not dated contractual quotes. Public source summaries above are deliberately limited; recommendations and financial assumptions are the analysis of this report.

| ID | Source and date | What it supports / limitation |
|---|---|---|
| S1 | [HishabPati pricing](https://www.hishabpati.com/en/pricing/), undated current page | Current tier prices/features; older FAQ conflicts with annual Business price |
| S2 | [ERP71 pricing](https://app.erp71.com/pricing), undated current page | Published tiers, setup fees, capacity, temporarily unavailable free/trial |
| S3 | [Halkhata pricing](https://halkhata.bd/pricing), indexed official page | Limits, founding prices, trial; direct page returned 403 |
| S4 | [DokanX POS](https://dokanx.easytechsolutions.xyz/pos-software/), current page | POS/inventory modular pricing and onboarding |
| S5 | [bHisab pricing](https://bhisab.com/pricing), current page | Advertised capacity, fees and remote-support claims |
| S6 | [Hisab Nikash pricing](https://hisabnikash.com/pricing/) and [home](https://hisabnikash.com/), current pages | Low annual price anchor; internal inconsistencies lower confidence |
| S7 | [TallyKhata Google Play listing](https://play.google.com/store/apps/details?hl=en&id=com.progoti.tallykhata), app updated 19 October 2026 | Free/Gold positioning, trial, individual dated reviews; not representative demand |
| S8 | [MSC Singair scoping study](https://www.microsave.net/2025/09/26/scoping-study-to-support-the-bangladesh-bank-to-scale-digital-transactions-in-bangladesh-2/), 26 September 2025 | Contextual payment-adoption barriers; not nationwide ERP willingness to pay |
| S9 | [MSC supply-chain payment analysis](https://www.microsave.net/2026/05/14/why-bangladeshs-supply-chains-still-run-on-cash-despite-digitization/), 14 May 2026 | Supplier/cash/liquidity friction; do not generalize software-price elasticity |
| S10 | [ADBI/MSC policy brief PDF](https://www.microsave.net/wp-content/uploads/2026/03/bridging-digital-divide-low-income-entrepreneurs-bangladesh.pdf), February 2026; [publisher summary](https://www.microsave.net/2026/03/12/bridging-the-digital-divide-for-low-income-entrepreneurs-in-bangladesh/), 12 March 2026 | Bangladesh support intervention and sample limits; not ERP revenue evidence |
| S11 | [bKash business](https://www.bkash.com/en/business), [online business](https://www.bkash.com/en/business/online-business), [checkout terms](https://www.bkash.com/en/page/tokenized_checkout), current pages | Available business rails; no universal negotiated MDR verified |
| S12 | [Nagad merchant payment](https://nagad.com.bd/bn/services/?service=merchant-pay), [limits/charges](https://nagad.com.bd/bn/limit-charges/), current pages | Service availability; dynamic public pages did not establish reliable API fees |
| S13 | [BD Bulk SMS prices](https://bdbulksms.com/bulk-sms-price.php), current page | Advertised segment slabs, taxes, validity, sender conditions; conflicting minimum notes |
| S14 | [W3 SMS prices](https://w3sms.com/pricing), current page | VAT-exclusive slabs and validity; quality claims unverified |
| S15 | [BTRC A2P aggregator list](https://btrc.gov.bd/pages/static-pages/6922df95933eb65569e22e80), indexed update 12 October 2026 | Authority-check starting point; list entries not independently verified in this review |
| S16 | [Twilio SMS length documentation](https://www.twilio.com/docs/glossary/what-sms-character-limit), current | Standard encoding/segmentation; local provider implementation still needs test |
| S17 | [SSLCOMMERZ pricing](https://sslcommerz.com/pricing/), current | Public setup and transaction fee; final contract/tax terms unverified |
| S18 | [NBR SRO 147/2026/352-VAT](https://nbr.gov.bd/uploads/sros/VAT_SRO-147.pdf), 7 June 2026 | Conditional registered-startup exemptions; HisabIQ qualification not established |
| S19 | [PwC Bangladesh other taxes](https://taxsummaries.pwc.com/bangladesh/corporate/other-taxes), reviewed 31 July 2026 | General VAT context; not SKU-specific tax opinion |
| S20 | [Google Play payments policy](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en), current | Digital/business-software billing obligations and regional exceptions |
| S21 | [Neon pricing](https://neon.com/pricing), current | Compute/storage/backup price calibration; actual workload unknown |
| S22 | [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/), updated 1 October 2026 | Object storage/operations calibration; not a full hosting quote |

**Evidence still needed before a public commercial launch:** actual payment/acquirer contract; three SMS quotes and delivery reconciliation; tax/entity classification; real merchant task completion and paid demand; support hiring quotes; load/restore results; end-to-end ERP production readiness. These are concrete validation tasks, not reasons to postpone a decision indefinitely. The recommended owner decision is to approve the model and controlled validation sequence, while withholding public price commitments and broad acquisition until those gates are met.
