# HisabIQ Free-First Growth and Hybrid Monetization Strategy

> **Decision update — 25 October 2026:** The owner accepted the [business-model decision record](2026-10-25-hisabiq-approved-business-model-decisions.md). It supersedes conflicting proposals below. The [completed research report](2026-10-25-hisabiq-bangladesh-business-model-report.md) provides rationale; experimental prices and launch gates remain conditional. No implementation or public pricing publication is authorized by this update.

**Date:** 2026-10-25  
**Status:** Research proposal for Astra review — not an approved pricing change, production launch, or implementation authorization.  
**Product:** HisabIQ, by Sher Software Solutions  
**Primary market:** Bangladesh small and medium businesses, especially counter shops and retailers.  
**Goal:** Acquire the first **1,000 genuine free business signups**, prove recurring business value, monetize selectively through in-app feature purchases and SMS, and earn upgrades to paid ERP subscriptions.

## 1. Commercial thesis

HisabIQ should be useful before anyone pays. Many prospective shopkeepers may be hesitant to pay for unfamiliar business software; **this is a hypothesis to test, not a demographic fact**. Rather than require a subscription before users trust us, allow a genuinely functional Basic ERP, make onboarding effortless, and offer optional, understandable purchases at the moment a customer recognizes a practical benefit.

The business model has four independent revenue streams:

1. **Core ERP subscription** for merchants ready to adopt a larger workflow.
2. **Paid feature passes / add-ons** for free or lower-tier users who want one specific benefit.
3. **Prepaid SMS credit resale** for transactional and customer messaging, with separately measured gross margin and deliverability.
4. **Optional services** (guided onboarding, migration, extra storage or support), charged transparently.

The principal objective is **sustainable contribution margin and retained, satisfied merchants**, not maximizing the number of locks, annoying upsell prompts, SMS sends, or first-month collections. Do not sell essential safety, security, data portability, or financial correctness as add-ons.

### Product philosophy

- KISS: clear Bangla helper text, low cognitive burden, no unnecessary pages, transparent charges.
- **Free must remain usable indefinitely** for essential small-shop bookkeeping, subject to published reasonable limits. Do not destroy or hold data hostage at expiry.
- **Pay for an improvement**, not to retrieve data already entrusted to HisabIQ.
- A customer may keep Basic forever and buy only features/SMS; conversion to a plan is an invitation, not a requirement.
- Customer trust is a commercial asset. Use informed choice and honest value communication; avoid dark patterns, fake scarcity, forced continuity or surprise renewal.
- Do not assume all Bangladeshi businesses have the same price sensitivity: segment by industry, shop size, digital comfort, region and current record-keeping method.

## 2. Precise first-1,000-user objective

**Target:** 1,000 distinct, legitimate, verified business/tenant registrations on Free Basic. Count businesses, not repeated devices, clicks, imported contacts or multiple accounts for one shop. This is an acquisition milestone, **not** a profitability guarantee.

Define the funnel and publish weekly cohort measurements:

| Metric | Definition | Why |
| --- | --- | --- |
| Reached | Qualified merchants exposed to HisabIQ | Marketing efficiency |
| Signup | Unique, verified business account created | Top-of-funnel progress |
| Activated | Completed first useful workflow: posted sale, purchase, or customer ledger + returned to view it | First value |
| D7/D30 retained | Activated business performed a meaningful action in day-7/day-30 window | Habit/value |
| Active businesses | At least one meaningful ERP action in the rolling 30 days | True addressable customer base |
| First purchase | First verified paid order, by category | WTP signal |
| Add-on attachment rate | Percentage of eligible active businesses buying one or more feature passes | Feature monetization |
| SMS paid adoption | Active businesses buying SMS with actual usage and measured cost | Resale economics |
| Plan conversion | Eligible businesses moving to Counter/Medium/Premium | Earned subscription demand |
| Net revenue / contribution | Actual settled receipts less refunds, provider costs, fees and attributable operating costs | Sustainability |

Never mix verified signup, activated tenant, monthly active tenant, and paying tenant denominators. Track first purchase time, renewal, repeated add-on purchase, churn, refund rate, complaints, downtime and support minutes per business. Privacy-preserving analytics only; do not sell or expose tenant sales/ledger data.

### Acquisition sequence (hypotheses, not promises)

- **0–100 businesses: discovery and manual onboarding.** Interview shopkeepers in realistic Bangladesh retail segments (hardware, electrical, fabric, furniture, pharmacy, grocery). Show real POS/ledger tasks. Document whether they can complete a first sale without assistance and why they trust/distrust the service.
- **100–300: improve activation.** Remove friction in phone signup, product entry, units, walk-in sale, receipts and customer due tracking. Build a simple getting-started path; enable voluntary onboarding support and import.
- **300–1,000: low-cost repeatable channels.** Field demonstration at retail clusters, trusted merchant referrals, genuine local business testimonials (with permission), WhatsApp/Facebook educational content, local language videos and referral credits with abuse protection. Compare cost per activated and retained merchant, not just cheap signups.
- **Beyond 1,000:** scale channels only after day-30 retention, paid demand and SMS gross margin meet explicit experiment gates. Keep the 1,000 milestone separate from a subsequent active-merchant target.

## 3. Candidate plan ladder — existing commercial proposal, not live policy

These prices come from current HisabIQ planning and need validation through Astra market research. Monthly pricing is proposed, yearly terms have not been settled.

| Plan | Candidate monthly price | Intended value |
| --- | ---: | --- |
| Free Basic | ৳0 | Persistent practical ERP basics; useful POS, products, basic customer ledger and basic reporting, with openly documented reasonable limits |
| Counter Pack | ৳199 | Counter-focused convenience; printing, multi-unit, split payment as previously discussed |
| Medium | ৳399 | Broader ERP workflows and advanced reports; no full attachments package |
| Premium | ৳599 | Medium plus product photos, purchase/expense attachments and higher service limits |

**Positioning research:** The owner also refers to “Pro” and “Plus.” Treat those as naming alternatives to test in interviews, not as permission to rename the existing Counter/Medium/Premium catalog without a packaging decision.

A **15-day full-feature trial followed by Free Basic** was discussed most recently. Verify whether full access during trial increases real activation compared with immediate Basic + targeted free passes; do not lock users out of all writing after trial. The existing backend still uses a 30-day Pro trial and a read-only expiry policy. Trial duration/upgrade rules must be reconciled explicitly before implementation.

Maintain a stable baseline feature matrix with included feature keys and resource quotas, not free-text descriptions. Existing paid subscriptions and invoice snapshots must remain historically accurate when catalog prices change.

## 4. In-app purchase feature store (primary free-user monetization)

Begin with three coherent benefits, not a crowded storefront. **Candidate ৳149 for a 30-day pass** is a research hypothesis; test 7-day, 30-day, annual and one-off/usage-based alternatives before choosing the permanent policy.

| Feature pass | Candidate price | User-facing value | Guardrail |
| --- | ---: | --- | --- |
| Print Plus | ৳149 / 30 days | Branded/advanced invoice and statement printing, efficient batch/thermal outputs | Keep readable invoices, essential records and basic export accessible in Basic. Test free-print allowance. Browser-level printing cannot be guaranteed to be blocked. |
| Reports Plus | ৳149 / 30 days | Existing advanced decision reports: sales profit, smart purchasing, stock/reorder, dues and expense analysis | Do not promise P&L or AI recommendations that lack reconciled source data. Show definitions and unknown cost honestly. |
| Attachments Plus | ৳149 / 30 days | Product photos and supporting purchase/expense documents | Quota, type limits, virus/content handling, retention rules, read-only access after expiry, no loss of historical references. |

**Additional candidates only after evidence:** warranty/serial/expiry tools, installment features, advanced inventory, storage upgrades, specialized reminders, multi-user seats, training. Never disable existing contractual capabilities merely to make a new pass attractive. Business-critical audit, backups, tenant isolation, data export, basic error correction and security are not standalone paid extras.

### Commercial rules

1. A feature included in a base plan is enabled without separate billing.
2. A tenant on Basic may own several independent, time-bounded paid add-on entitlements.
3. The current user's ERP role permission is a separate required condition: purchasing a feature does not give every employee authorization to sensitive actions.
4. If a subscription downgrades or expires, its plan-granted features lapse, **but independent paid add-on passes remain valid until their own expiry**; the tenant retains Free Basic and historical records.
5. Upgrading to a plan containing an already purchased pass must show an explicit, fair policy for the pass's remaining value (credit, aligned term, or opt-in coexistence); never quietly double-bill or silently shorten the pass.
6. Refunds, chargebacks and reversals update entitlements with audited, idempotent state transitions. Retain historical transactions; do not rewrite settled receipts.
7. Promos/manual grants have source, actor, reason, start/end and audit trail; no hidden indefinite free access.
8. No automatic recurring charge without explicit consent, terms, notice, clear cancellation and a working billing method.
9. Visually show price, billing period, expiry, whether the plan already includes it, and the value delivered before and after purchase.
10. Repeated low-cost passes should naturally prompt an **honest savings comparison** with a suitable plan, not aggressive nagging. Example: Counter + Reports Pass = ৳348 versus Medium ৳399; Medium + Attachments = ৳548 versus Premium ৳599. Exact plan benefit differences must justify the upgrade.

The server is the source of truth for allowed access and quotas. The frontend can explain locked features and start purchase flows but cannot enforce commercial access by hiding buttons alone.

## 5. SMS credits: sourcing, pricing and resale economics

SMS is a separate prepaid consumable, not the same thing as unlimited use of a feature.

### Initial retail package hypotheses

| Product | Billable SMS credits | Candidate sell price | Unit revenue before taxes/fees |
| --- | ---: | ---: | ---: |
| Starter | 100 | ৳89 | ৳0.89 |
| Business | 500 | ৳349 | ৳0.698 |
| Growth | 2,000 | ৳1,299 | ৳0.6495 |

**Do not publish these prices until supplier quotes and message categories have been verified.** Prices above are suggested resale hypotheses, not observed provider tariffs. Research non-masking vs masking, route quality, sender ID/registration, Unicode Bangla, provider minimum commitments, validity, volume discounts, taxes, A2P requirements, refunds, delivered vs submitted billing, and gateway costs. Choose price floors based on **actual landed cost per billed segment**, not a generic per-message assumption.

SMS credits should track **provider-billable segments**. Bangla/Unicode and long concatenated messages may incur multiple segments per recipient. Preview estimated segment cost before send. Reserve credits, charge based on verified provider outcome and policy, release or compensate failed sends where the provider did not bill. Avoid silent duplicate retries. Keep usage metadata tenant-scoped and message contents access-controlled. No misleading “unlimited WhatsApp” promise: WhatsApp pricing, templates, consent and provider charges require their own ledger.

For each package, calculate:
- Gross billings = verified paid package orders × package price.
- SMS cost = total billable provider segments × actual effective supplier tariff (including taxes/fees).
- Gateway costs = applicable verified successful payment charges + fixed charges.
- Credit liability = paid credits not yet consumed or expired, accounted for under an explicit policy.
- SMS contribution = realized SMS revenue less provider cost, fees, refunds and directly attributable overhead.
- Price-floor decision must use unfavorable cost/segment scenarios, not only the cheapest published quote.

**Business rule:** An SMS package order creates a payment obligation; credits become spendable only after verified/settled payment. Credit ledger, invoice, provider usage and audit must reconcile. Never issue credits from a frontend-only toast.

## 6. Per-tenant entitlement and commercial ledger architecture

Implementation belongs behind ByabsIQ authenticated APIs and tenant-scoped PostgreSQL persistence. Do not port backend state into browser localStorage or make a new source of financial truth in hisabiq_ui.

Core concepts (schema names illustrative):

- **Product catalog / plan version:** plan code, recurring price, published effective date, included feature keys and resource caps.
- **Add-on SKU version:** immutable SKU key, price, duration/usage, eligible tiers, refund policy, storage or print quota; published/retired states.
- **Commercial order:** business, idempotency key, item price/version snapshots, taxes/discounts, payable amount, currency and status.
- **Payment and allocation:** submitted proof, verified settlement, unique evidence, possible partial payments, refunds and adjustment records.
- **Entitlement grant:** business, feature key, origin (plan, trial, paid add-on, promo, authorized manual grant), source order, start/end, status and limits.
- **Usage ledger:** for SMS, print quotas, storage bytes and other metered services, with reservation, consumption, expiry/reversal and reconciliation metadata.
- **Audit log:** actor, business, action, source, reason, before/after entitlement effects without leaking private payment evidence.
- **Effective access resolver:** evaluated server-side for business + authenticated membership/role + active grants + quotas + business account state. Prefer one explainable resolver reused in API authorization and UI access summaries.

Transitions should be atomic and idempotent: verified payment → one correct order fulfillment → grants/credits → audit. Same proof and operation IDs must not activate twice. Scheduled expiry and cancellation must not erase invoices, stock, ledgers, historical attachments or existing receivables/payables. SMS reconciliation and revenue recognition must distinguish cash collected from services actually consumed; finance policies require accountant review.

### Repository baseline: verified code mismatches as of 2026-10-25

- [UI SaaS types](../../../src/saas/types.ts): plan features currently stored as free-text; no granular add-on entitlement structure.
- [UI SaaS plans](../../../src/saas/billing/PlansPage.tsx): demonstration package fields and prices; not production entitlements.
- [UI SaaS SMS](../../../src/saas/messaging/SmsPage.tsx) and [credit transitions](../../../src/saas/messaging/transitions.ts): demo package billing, segments and credit balance; provider integration not live.
- [UI SaaS overview](../../../src/saas/OverviewPage.tsx) and [tenant portal](../../../src/saas/TenantPortal.tsx): existing overview, billing/credits with demo actors.
- [UI reporting workspace](../../../src/pages/Reports.tsx) and [report spec](2026-10-24-report-workspace-design.md): report selection, output and purchasing guidance UI; no subscription enforcement.
- [Backend subscriptions schema](https://github.com/shuvodelux-commits/ByabsIQ/blob/main/packages/db/src/schema/subscriptions.ts): currently only PRO/PREMIUM plan codes.
- [Backend subscription repository](https://github.com/shuvodelux-commits/ByabsIQ/blob/main/apps/api/src/modules/subscriptions/subscriptions.repository.ts): currently starts a 30-day Pro trial.
- [Backend subscription policy](https://github.com/shuvodelux-commits/ByabsIQ/blob/main/apps/api/src/modules/subscriptions/subscription-policy.service.ts): post-expiry can become read-only rather than persistent Free Basic.
- [Backend payment review](https://github.com/shuvodelux-commits/ByabsIQ/blob/main/docs/platform-admin-payments.md): secure subscription-payment review foundation with idempotency/audit; extension needed for feature SKU fulfillment.
- [Backend engineering authority](https://github.com/shuvodelux-commits/ByabsIQ/blob/main/AGENTS.md): tenant isolation, session-derived business context, atomic accounting, idempotency and audit protections remain mandatory.
- [UI SaaS README](../../saas/README.md): currently a React/local-state prototype; no live provider/DB.
  
Treat the UI and backend as separate project phases. This proposal authorizes **documentation and external commercial research only**.

## 7. Customer-facing UX: earn purchases at the moment of value

Make the first experience about **posting a sale and understanding dues**, not choosing a payment plan. Use short Bengali helper copy and recognizable terms like জমা, বাকি, লাভ, খরচ; keep English-first, Bangla-only and bilingual options. Support real low-literacy usability research without assuming all merchants need the same flow.

Preferred funnel:
1. Free signup → one business created → first useful invoice/product/party task.
2. Show a helpful result (balance, due, report insight, successful basic receipt).
3. When a relevant optional feature would materially help, show one honest explanation and a **See price / Try preview / Not now** choice. Do not interrupt posting a transaction to demand money.
4. Customer buys one pass or SMS package with visible cost and term; pending verification is clearly labeled.
5. On verification, unlock without loss of task context, demonstrate purchased benefit and show expiry in My Plan & Extras.
6. After repeated demonstrated value, compare paid plans with actual usage and transparent total costs.
7. Renewal/cancellation are simple; avoid hidden opt-outs, false countdowns or confusing trial terms.

Do not require paid printing of the legally/operationally essential customer receipt to complete a free sale without first validating the risk of abandonment and user trust. Test a small basic-print allowance versus paid enhanced/unlimited printing. Don't attempt technically futile restrictions on browser printing/screenshots; price supported workflows and convenience.

Potential tested mechanisms (not assumed truths): trust and risk reduction, zero-price effect, loss aversion, prospect theory, anchoring/reference pricing, mental accounting, endowment/ease of use, locally credible social proof, price fairness and habit formation. Do not assert these mechanisms transfer uniformly to Bangladesh without field evidence. Explicitly reject manipulative exploitation.

## 8. Initial economics model (illustrative assumptions, NOT a forecast)

**Month with 1,000 cumulative genuine signups.** Suppose 500 activated, 350 monthly active, and these **transaction counts** occur during the month (transactions may come from overlapping merchants):

| Revenue stream | Example assumption | Monthly receipts |
| --- | --- | ---: |
| Counter subscriptions | 10 × ৳199 | ৳1,990 |
| Medium subscriptions | 15 × ৳399 | ৳5,985 |
| Premium subscriptions | 5 × ৳599 | ৳2,995 |
| Feature pass purchases | 80 × ৳149 | ৳11,920 |
| SMS packages | 80 × 500 credits × ৳349 per package | ৳27,920 |
| **Illustrative gross receipts** | **Not a prediction** | **৳50,810** |

Assume 40,000 billable SMS segments consumed at an **assumed** provider rate of ৳0.35/segment (= ৳14,000), and assume payment fees equal 2.5% of gross receipts (= ৳1,270.25). Approximate contribution after **only those two costs** is **৳35,539.75**; it is **not profit**. Hosting, storage, support labor, marketing/commissions, refunds, tax, compliance, failed/multiple SMS segments, SMS unused-credit liability and founder compensation remain to be deducted. Subscription and pass receipts are not necessarily earned revenue in their entirety in the collection month.

Use low/base/high scenarios on signup-to-activation, active retention, plan conversion, pass purchase frequency, SMS orders/segments, cost per delivered segment, support load, CAC, gateway fees and refunds. Derive a break-even number of **retained active businesses**, not just registered accounts. Compare free-users' operating costs with their realized contribution and expected lifetime margin; show what happens if only 2% buy anything.

### Financial test gates

- Compute contribution margin by SMS package, feature SKU, plan and merchant cohort.
- Monitor support minutes and storage/network cost per active merchant.
- Include customer acquisition cost and merchant referral incentive cost.
- Define cash runway and payback period; account for recurring credits and liabilities.
- Model bad cases: no renewals, costly Unicode segmentation, high gateway fees, high support demand, free signup spam, churn.
- No assertion that 1,000 registered free businesses produces positive cash flow.

## 9. Ethical behavioral research and experiments for Astra

### Questions to answer with Bangladesh-specific evidence

1. What do merchants currently pay—in cash, labor time, notebooks, printing, SMS and losses from forgotten dues—to manage a shop?
2. Which outcomes elicit a willingness to pay: faster counter sales, reliable due collection, receipt printing, inventory reminders, reports, attachments, or SMS?
3. Are merchants more comfortable with a one-time purchase, prepaid 7/30-day pass, pay-per-use credits, or monthly subscription? How do bKash/Nagad payments and cash-flow cycles affect this?
4. Which small differences in framing communicate value honestly? For example, “recover one missed due” vs “advanced feature,” demonstrated before/after workflows, or ৳149 per 30 days versus per-use.
5. Do merchant attitudes differ across grocery, electrical/hardware, fabric, furniture and pharmacy; urban vs smaller markets; owner-operated vs staffed stores?
6. What is perceived as a fair Basic offering? Would limiting plain invoice print destroy trust, activation and referrals? What free allowances are acceptable?
7. Which package boundaries, names and prices (Basic, Counter/Pro, Medium/Plus, Premium) improve confidence without creating confusion or cannibalization?
8. Can HisabIQ sustainably resell SMS based on verified provider tariffs, Unicode segments and actual delivery success?
9. How should paid feature purchases transition into subscription upgrades without double-billing, bad surprises or low-trust tactics?
10. What minimum confidence in retention, revenue per active merchant and margin would justify scaling beyond the first 1,000?

### Research methods

Combine current sources (dated, Bangladesh-relevant provider quotes, competitor published pricing, developer/community evidence) with primary research: at least 15–25 diverse qualitative interviews to explore hypotheses, 5–10 observed task/usability sessions, transparent willingness-to-pay experiments, and a larger follow-up survey if feasible. Qualitative sample sizes explore needs; they do not prove population-wide price percentages. Use structured scripts, disclose respondent recruitment, distinguish self-reported willingness-to-pay from actual purchases, and identify survivorship/selection bias. Compare published competitor features and payment terms, not only promotional headline prices.

Suggested controlled experiments (choose a small number due to sample size):
- Basic receipt free allowance vs advanced-print pass (activation/retention guardrail).
- ৳99 / ৳149 / ৳199 30-day feature passes with honest randomized offers; avoid inconsistent prices across close contacts unless framed transparently.
- Prepaid fixed pass vs per-use credits, both non-auto-renewing.
- Value shown after task completion vs generic feature-store card.
- First-feature preview/trial versus immediate price card.
- One bundled add-on versus individually purchased features, preserving clear savings comparison.
- Referral value as SMS credits versus subscription discount, with verified-merchant anti-abuse.

Evaluate add-on net revenue per **active business**, D7/D30 retention, verified payments, refund complaints, support tickets, trust survey responses and cancellations. Track conversion conditional on feature exposure to avoid misleading rates. Pre-register primary metric and stop rules; do not chase small-sample noise.

## 10. Admin SaaS dashboard additions

Preserve the current /saas administration shell. Add **Commerce** capabilities rather than redesigning the ERP:

- Plans & pricing: versioned four-tier catalog, monthly/annual candidate pricing, included entitlements, quotas.
- Feature Store: SKU, 7/30-day/usage duration, eligibility, price, status, bundle rules, rollout experiments.
- Tenant account: plan + independently purchased passes, expiry timeline, payment evidence, credit/refund history, effective permissions, storage/SMS usage.
- Payments: single auditable order and verification pipeline for subscription, feature and SMS.
- SMS business: supplier agreements/tariffs, package pricing, credit liability, sender policy, actual provider reconciliation and margin.
- Growth dashboard: verified signups, activated tenants, MAU, cohort D7/D30, first paid orders, purchase frequency, feature attach rate, plan upgrades, churn, CAC and support load.
- Profit dashboard: cash collections vs earned revenue, direct SMS costs, fee losses, storage/support costs, contribution by SKU and tenant cohort.
- Offers & experiments: verifiable promotion grants and targeted audience/variant tracking with consent and exit criteria.
- Audit log: sensitive price/version changes, manual grants, feature activations, refunds and expiry.
- **Exclusive Support & Configuration:** consented, limited customer-support sessions and reversible tenant/user presentation settings, feature trials and access history.

Tenant-facing **My Plan & Extras** should use the current HisabIQ brand guide, consistent 36px ordinary controls, Products table typography and Party Ledger **underline-style tabs** (My Plan / Feature Store / SMS Credits / Bills & Payments), not oversized button-style navigation. Present one clear primary action and quiet Bangla helper text.


## 11. Exclusive support, remote configuration and temporary module access (new product requirement)

**Owner's vision:** HisabIQ offers unusually helpful, personal assistance. A merchant may say, "I don't want to see Profit in the Sales list," and an authorized support engineer should be able to configure this through the SaaS dashboard. The service should also handle feature on/off controls, temporary feature trials, and narrowly scoped time-limited support access. **This is not authorization to silently impersonate tenants or read and modify every business record.** The support experience is both a product differentiator and a measurable retention experiment for the first 1,000 free businesses.

### 11.1 Separate three classes of controls

| Type | Example | Who can approve/change? | Important boundary |
| --- | --- | --- | --- |
| **Presentation preference** | Hide Sales Profit column, change visible list columns, default view or report filters | Customer self-service or consented support configuration | Cosmetic only. Hiding a column is NOT a security or confidentiality restriction. |
| **Commercial feature entitlement** | Activate Reports Plus or Attachments Plus for 7 days, pause a licensed feature, extend purchased feature access | Verified payment, approved complimentary trial/promotion or authorized platform operator | Must preserve paid contract, quotas, expiry and audit trail. Cannot silently remove paid value. |
| **Business/employee authorization** | Staff can view Sales but cannot view profit, can open Reports for one hour but cannot post sales | Tenant owner and backend permission service; scoped delegated assistance only | Server-enforced roles, field redaction, module/API permissions, tenant isolation and expiring grants. |

**Critical distinction:** If a merchant only wants Profit hidden from their own Sales screen, change the per-user or tenant default presentation setting. If they want workers unable to see margins or cost data, create and enforce a separate sensitive-field permission (e.g., sales.profit.view), filtering server responses, exports, details and reports. A hidden table column cannot secure sensitive data.

### 11.2 Real merchant request: Hide Profit column

1. Merchant requests "Hide Profit column in Sales History" in a support ticket, or directly uses existing Sales → Columns.
2. Support determines whether the desired scope is **tenant default**, **one employee**, **all business users**, or **device-specific desktop/tablet**. Ask only when essential; never change all employees based on a single user's preference without agreement.
3. SaaS console: **Tenants → [Selected Business] → Configuration → Sales → List columns → Profit: Off**. Preview before/after with exact affected scope.
4. Engineer needs a valid role to propose the configuration; for remote adjustment, obtain the tenant owner's consent or a previously approved limited configuration delegation. No access to their passwords or unrestricted owner account.
5. Persist the preference under the correct business/user/device scope using a validated, audited API mutation. Record support operator, related ticket, approval reference, old/new values and timestamp.
6. Customer sees "Configured by HisabIQ support" plus a clear **Undo / Restore defaults** option. Updates should sync on appropriate sessions/devices.
7. Verify desktop, tablet and mobile display; restore stays available to the customer without support intervention.

**Existing code to reuse:** src/pages/Sales.tsx already defines and renders Profit-column selection and stores desktop/tablet visibility in localStorage. It is browser-local, not a tenant-scoped remote-config service. Reuse the picker and extend preference persistence; do not redesign Sales merely to offer remote control.

Suggested precedence: application default → owner-defined tenant default → per-user preference → optional per-device preference. Document inheritance, what "Reset" means, concurrent edits/versioning and how owner-level enforced choices interact with optional user overrides. None of these preferences act as access controls.

### 11.3 Support actions and permissions

Support should be able to help with:
- **Remote UI configuration:** table columns, available list views, default filters, customer-requested workflow simplifications, settings and printing preferences, localization and helper labels, with schema validation and visible change previews.
- **Complimentary feature trials:** issue a clearly labelled limited grant (e.g., Advanced Reports for 1, 3, 7 or 30 days) with tenant, product/SKU, quota, start/end, ticket, reason, operator and separate commercial approval where needed; automatic expiry and normal access restoration.
- **Temporarily open a module:** allow a business to try a Reports feature for 48 hours or enable a specific employee to inspect a module for one hour, only after both feature entitlement and staff permission policies are satisfied. Module visibility alone never authorizes APIs.
- **Guided support visits:** consented, time-limited "Support View" of an approved module or configuration panel. Default read-only; separate scope required to modify benign settings. Prefer redacted metadata to full ledger data.
- **Diagnostics:** effective feature/plan/quota details, screen size, product version, error codes and ticket-linked traces, without wholesale access to customer sales, bank accounts or attachments.
- **Protected operations:** refund, paid entitlement revocation, billing changes, account security, balances and stock corrections use specialized authorized workflows. Do not make a single "turn anything on/off" superpower that bypasses accounting or paid rights.

**Always available basics:** bug support, safe access to own records, basic instructions and issue reporting remain accessible on Free Basic. Priority response, guided setup, migration and longer service sessions may be subscription benefits or separately sold services; study willingness to pay and cost, do not promise unlimited engineer visits.

### 11.4 SaaS dashboard: proposed tenant support workspace

Extend existing SaaS Tenant Details rather than create another application:

| Tab / area | Content and actions |
| --- | --- |
| Overview | Business status, plan, features, open tickets and support eligibility |
| **Configuration** | Search by ERP module; view effective settings; hide/show columns; target tenant/user/device; preview/diff; Apply/Undo/Reset |
| **Feature Access** | Plan features vs independent paid passes vs authorized complimentary trials; quotas, effective dates, buy/extend and history |
| **Support Access** | Request, consent, active session, allowed module/actions, remaining time, revoke immediately |
| Employees & Permissions | View scoped staff rights, profit/cost field access and temporary employee grants; honor tenant owner authority |
| Activity & Audit | Who visited, what they accessed or changed, approval, old/new values, denied actions and expirations |

Support workflow: **Support Ticket → Request Configuration Help → Choose module and action → Set duration → Customer approval → Begin limited support session → Preview and apply allowed change → Confirm result → End session**.

The customer's app displays an obvious "HisabIQ support is assisting you" indicator while a live support session exists, with support engineer identity, scope and **Revoke now**. Give the owner access history and a summary of changed settings. Never require sharing OTPs, login passwords, PINs or payment credentials.

### 11.5 Temporary support lease: backend contract and security

Recommended persisted lease fields: request_id, ticket_id, tenant_id, staff_id, granted_by, purpose, allowed_modules, allowed_actions, target_user_scope, start_at, expires_at, revoked_at, status, session_id and audit references. Keep paid feature grants in a **different table/domain** from temporary support-access leases.

- Default read-only; allow explicit settings-update scopes separately. Offer short interactive durations such as **15, 30 or 60 minutes**; longer sessions require new approval. Existing demo currently accepts expiry within 24 hours; that is not a production default.
- Server checks tenant, staff identity, role, active support consent, approved module/action scope, start/end times, revocation and current business status on **every** sensitive API request. Never depend on client clocks or menu hiding.
- Every mutation records **the actual engineer** as actor "on behalf of" the business; don't falsely attribute it to the customer. Use version/revision checks and idempotency where applicable.
- No support pathway to bypass tenant isolation, 2FA/PIN, owner's business role, stored paid entitlements, payment verification, posted financial history, immutable audit, receipts, sensitive bank data or other customers' records.
- A support visit does **not** automatically make them a member of the tenant's staff roles. The lease grants only the designated support capability, separately approved.
- Explicit revocation immediately ends associated privileged requests/sessions. Consent, expiry and logs are visible to the merchant.
- Emergency recovery when the owner cannot consent belongs to a separate rigorously verified account-recovery process, **not** a hidden override in Support.

### 11.6 Verified starting point and missing implementation

- src/saas/support/TicketsPage.tsx already offers tickets and access request/consent/revoke UI; the displayed notice explicitly states that the prototype only records a request, **not impersonation**.
- src/saas/support/transitions.ts stores tenant/staff, textual scope, reason, expiry and status, and requires tenant consent to an unexpired request. There is **no authenticated, backend-enforced, delegated session** yet.
- src/pages/Sales.tsx already has a functioning local Profit-column chooser, with separate desktop/tablet localStorage keys. It is not yet centrally configured or correctly scoped for all users.
- ByabsIQ AGENTS.md requires authenticated session business context, tenant isolation, separate admin/business permissions, audit, validation and transactional integrity; all still apply.
- Required backend work: durable tenant/user preferences, narrowly typed preference keys, support grant and consent API, temporary scoped session, feature-trial entitlements, audit event schema, field-level access control, sync/revocation, tests for lease expiry and cross-tenant access.
- Required frontend work: new SaaS Config/Feature Access/Support Access views, a visible consent session UI inside tenant ERP, preference sync using existing UI components and the current Sales picker, effective-permission explanations.

**Acceptance tests for eventual implementation:** a merchant can request Profit hidden; consented support changes only the selected setting for the right target; it persists and can be restored; a worker without profit permission cannot retrieve margins via any API/export/detail; paid add-on entitlements are not silently altered; free trial grants auto-expire; session access ends immediately on expiry/revoke; support cannot post sales or view unapproved financial data; actions appear with correct identity in audit.

### 11.7 Astra business and behavioral research questions

Assess whether dedicated human assistance is a real differentiation for Bangladeshi merchants, rather than assuming it. Research what builds trust, whether users prefer self-service versus a support engineer configuring the app, and how consent should be explained in clear Bangla. Determine which support is free versus Counter/Medium/Premium priority versus one-time purchase; estimate agent time, cost per assisted tenant, SLA, staffing model and 1,000-free-user capacity. Evaluate retention, referrals, paid conversion, feature-trial adoption, trust complaints and abuse. Recommend minimum viable support functions versus expensive, high-risk capabilities to defer.

**Important business principle:** support gives customers control over their own ERP, not HisabIQ uncontrolled access to their data. Its commercial value should come from solving customer problems quickly, not forcing expensive plans or creating dependency.

**Nested reference integration (2026-10-25):** See [HisabIQ SaaS Control Center — NestSherERP Reference and Commercial Support Design](2026-10-25-hisabiq-saas-control-center-nestshererp-reference-design.md) for source-verified reusable patterns, typed settings registry, dependency gates, support delegated consent and short leases, proposed admin tabs, pricing research checklist and phased integration. This is the implementation-facing companion to the business strategy; neither document authorizes implementation.\n\n## 12. Suggested phased roadmap (no implementation approved)

**Phase A — Astra independent research:** review this document and linked code, validate (or reject) the free-first premise and find gaps in pricing, trust, UX, funnel, SMS economics and cost structure.

**Phase B — commercial decisions:** choose permanent Free scope, trial, pass types/durations, plan names/benefits, SMS pricing based on supplier contract, billing/renewal/refund terms and margin floors.

**Phase C — backend contracts:** reconcile ByabsIQ 30-day Pro trial, 2-plan enum and read-only expiry; introduce correct Free Basic status, durable catalog, orders, grants, permission resolver, usage/accounting and audit. Test migration and historical integrity.

**Phase D — UI integration:** add accurate commerce pages, tenant purchase and expiry states, honest feature gates for reports/print/attachments, SMS package purchase, conversion prompts and existing design-system consistency; add consent, Support Configuration and self-service settings using current Sales columns UI. Do not replace the current ERP modules.

**Phase E — provider + operations:** payment settlement, commercial notifications, real SMS/provider reconciliation, storage uploads, backup/retention, abuse prevention, backend support leases and auditing, settings synchronization, alerts and production readiness.

**Phase F — limited launch:** invite cohorts, verify activation and support capacity, monitor margins and only then scale to first 1,000 free businesses.

## 13. Unresolved decisions requiring explicit approval

- Is the 15-day trial definitely included for all, or should free-first activation avoid a full trial?
- Exactly which receipts/printing, reports and data exports are permanently free? What limits are acceptable without damaging trust?
- Is ৳149 a **30-day**, permanent one-time, or pay-per-use unlock? Which features warrant different expiry models?
- What is a defensible net margin floor for each SMS package once supplier bids, Bangla segmentation, gateway and delivery reconciliation are known?
- What are the exact Counter/Medium/Premium limits on products, users, storage, printing, reports, SMS and WhatsApp?
- Should “Pro/Plus” be marketing names or actual tier changes? Never silently rename approved tiers.
- Which devices/users may purchase for a tenant; can owner delegate purchases? How are refunds and consent handled?
- How much free-user support and storage can 1,000 businesses consume, and what would their runway cost be?
- Which signals should trigger a helpful upsell without becoming intrusive?
- What customer-consented support scopes, short session durations and per-tier service guarantees are financially sustainable at 1,000 free businesses?
- How should tenant-wide, employee-specific and device-specific column preferences interact, and which changes need owner approval?
- Can support staff issue temporary complimentary feature grants, and what independent approvals/reasons must those grants require?
- What purchase/conversion/retention metrics must pass before any marketing scale-up?

**Research handoff:** Use [Astra Bangladesh pricing and free-first finalization brief](2026-10-25-astra-bangladesh-pricing-and-free-first-review-brief.md) alongside the linked SaaS Control Center design. Require evidence-backed Bangladesh pricing, in-app purchase psychology, SMS segment margins, human-support costs, secure remote configuration, and clear owner decisions.\n\n**Decision status:** Nothing in this document should be implemented as a production policy until market research, costing and owner approval. GitHub is source of truth; edits to UI/backend require separate reviewed plans and PRs.
