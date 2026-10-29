# Astra Independent Review Brief — Bangladesh Market, SaaS Pricing, In-App Purchases and Exclusive Support

> **Decision update — 25 October 2026:** The owner accepted the [business-model decision record](2026-10-25-hisabiq-approved-business-model-decisions.md). It supersedes conflicting proposals below. The [completed research report](2026-10-25-hisabiq-bangladesh-business-model-report.md) provides rationale; experimental prices and launch gates remain conditional. No implementation or public pricing publication is authorized by this update.

**Prepared:** 2026-10-25
**Status:** Input brief for independent research. No implementation or commercial terms approved.

Read these first, in order:
1. [HisabIQ free-first and hybrid monetization strategy](2026-10-25-hisabiq-free-first-hybrid-monetization-strategy.md)
2. [HisabIQ SaaS Control Center design from NestSherERP reference](2026-10-25-hisabiq-saas-control-center-nestshererp-reference-design.md)
3. [HisabIQ UI SaaS administration design](2026-10-08-saas-administration-design.md)
4. [HisabIQ SaaS prototype README](../../saas/README.md)
5. Connected repo: `shuvodelux-commits/ByabsIQ`, including subscription policy and payment flow
6. Reference repo: `shuvodelux-commits/nestshererp`, especially static settings registry and feature dependency service; inspect only if account access permits.

## Assignment

Independently challenge and finalize a Bangladesh-targeted **free-first HisabIQ ERP commercial strategy**. Its starting hypothesis is that the first 1,000 genuine Free Basic businesses should be acquired via practical free ERP value, retained through good user experience and human-assisted support, then monetized through **useful optional in-app purchases**, prepaid SMS and earned Counter/Medium/Premium subscriptions.

Do not accept proposed prices (Basic ৳0, Counter ৳199, Medium ৳399, Premium ৳599; selected passes ৳149; proposed 15-day trial) as validated. Explicitly compare alternate prices, names, quotas, inclusion rules and payment durations; preserve the owner's decision authority. Treat existing UI demo numbers and old backend trial terms as stale technical state, not the final commercial plan.

Research Bangladesh SME/retail buyer behavior (grocery, hardware/electrical, fabric, furniture, pharmacy, small wholesale), digital literacy variance, low-trust software purchases, owner-vs-staff control, cash flow, bKash/Nagad behaviors, printing expectations, local-language UX, purchase timing, loss aversion, transaction-driven willingness to pay, merchant referrals, and ethics of purchase nudges. Support statements with current sourced evidence; don't generalize stereotypes.

Assess **payment choices**: pay-per-use, prepaid feature credits, 7/30/90-day access, fixed one-time lifetime unlock, monthly/annual subscriptions, promotional credits, offer bundles. Test individual paid features such as reports, enhanced invoice/statement printing and attachments, and evaluate whether core invoice printing, basic export, basic reporting and audit must remain free to preserve trust. Model standalone add-ons cannibalizing or feeding whole-plan conversions, including fair handling of remaining prepaid value.

Evaluate **SMS purchase/resale economics**: official provider quotes vs public advertising, masking/non-masking, Unicode/Bangla concatenated segments, sender ID, minimum spend, DLR correctness, duplicate send, regulatory requirements, taxes and VAT, credit validity, payment fees, prepaid liability, actual contribution and whether SMS is truly an attractive margin source. Never present unverified retail package prices as optimized.

Research and finalize **exclusive SaaS customer-success support**: how much personal help drives activation/retention, customer trust in engineer access, owner consent in Bengali, preference for self-service versus remote configuration, per-tenant settings, Sales Profit column hide vs secure role-level profit denial, temporary module access and feature trials. Recommend which help remains free, which tiers get priority or assisted configuration, and what is separately billable. Bound support labor, time, read/write privileges, audit and revocation; prohibit unconsented unrestricted impersonation.

Technical review must distinguish verified NestSherERP settings/dependency implementations from its permissive subscription stub; HisabIQ's React SaaS demo from real backend; ByabsIQ existing PRO/PREMIUM+30-day trial from proposed four-tier+15-day/free downgrade. Favor adaptation over code copying.

### Market evidence starting points (fresh verification required)

- ERP71: https://app.erp71.com/pricing
- Halkhata: https://halkhata.bd/pricing
- BD Bulk SMS: https://bdbulksms.com/bulk-sms-price.php
- W3 SMS: https://w3sms.com/pricing
- SSLCOMMERZ: https://sslcommerz.com/pricing/

Add other credible competitors and providers discovered independently. Compare features and effective cost to merchants, not marketing sticker prices. Capture published date/date checked, precise currency and whether figures include tax or setup fees.

### Method and analytical standards

- Separate **verified facts**, **uncertain hypotheses**, **market estimates**, and **owner decisions**.
- Combine current documented research with **proposed primary fieldwork**: 20–30 diverse merchant interviews, 5–10 observed real-use sessions and sample-qualified price experiments/surveys when feasible. Do not pretend to have interviewed merchants unless actual interviews were conducted.
- Use willingness-to-pay methods carefully (Van Westendorp / Gabor-Granger / discrete-choice where feasible), paired with real, consented paid purchase trials. Self-reported willingness to pay is not payment conversion.
- Segment merchants by vertical, transaction frequency, online comfort, owner role, locality and business maturity. Don't claim nationwide statistical inference from a small convenience sample.
- Revenue model: signups → verified businesses → activated → week-1 and month-1 retained → monthly active → first add-on → repeat add-on → SMS buyers → subscribers; denominators explicit.
- Model **low/base/high** for 1,000 genuine registered Free Basic businesses and sensitivity at 100/500/5,000. Show fees, VAT/taxes, support salaries/time, onboarding, marketing CAC, hosting, data storage, SMS per segment, unused credit liabilities, churn/refunds and gross vs earned revenue. Formula-backed scenarios with all assumptions labeled.
- Test **customer lifetime contribution / payback**, not merely ARR or number of paid users. Consider abusive/free signup and support cost.
- Formulate non-manipulative purchase prompts: user sees benefit before offer, clear price/expiry, no forced interruption of POS, easy decline/renewal cancel; avoid dark patterns and personal financial exploitation.

## Required final decision report

1. Executive recommendation: **keep / change / reject** free-first hypothesis, with confidence and critical counterarguments.
2. Bangladesh-specific competitor and true effective-price comparison, linked to sources checked with dates.
3. Four-tier feature grid, exact proposed monthly/yearly pricing and names, Free Basic permanent scope, product/user/printing/storage limits and support hours.
4. In-app catalog: paid feature SKU, per-use or pass duration, recommend price, free preview/allowance, entitlement/expiry rule, fairness/refund treatment and upgrade crossover calculations.
5. SMS catalog, provider procurement assumptions, Unicode billing and **true unit contribution** at realistic use.
6. Support service matrix: Free vs paid response windows, session allowance, staffing and monthly support-cost scenarios, consent model and minimal secure remote-config MVP.
7. Behavioral research summary: empirical evidence, uncertainty and falsifiable experiments; avoid claiming all Bangladesh merchants have one psychology.
8. 90-day operational acquisition plan to 1,000 signups with activation/retention targets, lead channels, referral controls and cohort reporting.
9. Three financial scenarios and cash runway/break-even based on **retained active tenants**, not registrations.
10. SaaS Control Center final architecture: typed settings, separate access/entitlement/support lease, audit, feature dependency and tenant/user/device defaults; implementation gap analysis by repo.
11. Priority roadmap with stop/go gates, security risks, technical debt and what to defer.
12. Exact unanswered owner decisions and **one recommended default per decision**, explaining tradeoffs.

**Final behavior:** Return a decisive, falsifiable research-driven recommendation. Propose the simplest business model likely to earn merchant trust, sustainable usage and profit. **Do not edit code, publish pricing or merge docs; owner reviews decisions first.**
