# HisabIQ SaaS Control Center — NestSherERP Reference and Commercial Support Design

> **Decision update — 25 October 2026:** The owner accepted the [business-model decision record](2026-10-25-hisabiq-approved-business-model-decisions.md). It supersedes conflicting proposals below. The [completed research report](2026-10-25-hisabiq-bangladesh-business-model-report.md) provides rationale; experimental prices and launch gates remain conditional. No implementation or public pricing publication is authorized by this update.

**Date:** 2026-10-25
**Status:** PROPOSED / requires independent Astra and owner review. **No implementation authorized.**
**Applies to:** HisabIQ ERP React UI (`shuvodelux-commits/hisabiq_ui`) and the future API implementation in ByabsIQ (`shuvodelux-commits/ByabsIQ`).
**Research reference:** the separate private `shuvodelux-commits/nestshererp` repository, inspected on 2026-10-25. NestSherERP is inspiration, not the source of truth for HisabIQ implementation, prices or frontend technology.
**Related commercial strategy:** [Free-first monetization and first 1,000 businesses](2026-10-25-hisabiq-free-first-hybrid-monetization-strategy.md).
**Related existing SaaS design:** [SaaS administration design](2026-10-08-saas-administration-design.md).

## 1. Owner's problem statement

HisabIQ must let small Bangladesh businesses use ERP without complicated configuration. When a merchant requests something as small as "I do not want the Profit column in my Sales list", an authorized support engineer should be able to find the correct tenant, request narrowly scoped assistance, configure the relevant setting, and show the merchant the result. The customer must also be able to do it independently.

The same SaaS administration platform must offer **controlled feature activation and deactivation** for paid plans, optional feature passes, complimentary trials, tenant preferences, employee permissions and temporary support access. It must NOT turn into a cross-tenant super-admin backdoor.

This is part of the **free-first, earn-trust-before-upsell business strategy**. The first milestone is 1,000 genuine Free Basic business signups, but sustainable support capacity, retention, paid purchases and contribution margin—not the signup count alone—determine success.

## 2. Direct NestSherERP findings: what exists vs what does not

NestSherERP stack is Vue 3, NestJS, Drizzle, PostgreSQL. Its code should **not** be copied into HisabIQ's React/shadcn frontend. Reuse its patterns with HisabIQ's own components and ByabsIQ's contracts.

| Verified NestSherERP source | Idea to adapt | Evidence / limitation |
| --- | --- | --- |
| [Static settings catalog](https://github.com/shuvodelux-commits/nestshererp/blob/main/packages/core-contracts/src/settings.ts) | Typed known setting keys; label, allowed values, default, group, feature dependencies, step-up and `consumedBy/inEffect` | Real catalog present; many intended business-module consumers are explicitly `inEffect: false`. |
| [Feature dependency resolver](https://github.com/shuvodelux-commits/nestshererp/blob/main/packages/core-application/src/settings/feature-dependencies.ts) | Enabling a child requires active parents; disabling a parent cascades in a defined, explained way | Real dependency logic present and used by settings service. |
| [Settings mutation service](https://github.com/shuvodelux-commits/nestshererp/blob/main/packages/core-application/src/settings/manage-settings-service.ts) | Validate key/value, check specific permissions, step-up sensitive changes, perform atomic transaction, audit before/after and cascade warnings | Implemented for tenant settings. Changing a setting takes effect on subsequent requests without re-login in this path. |
| [PostgreSQL settings repository](https://github.com/shuvodelux-commits/nestshererp/blob/main/packages/adapter-postgres/src/settings-repository.ts) | Unique tenant + setting key, single-setting version, write actor, unchanged default semantics | Persistence exists, but the repository does not implement remote support delegation. |
| [Permission catalog](https://github.com/shuvodelux-commits/nestshererp/blob/main/packages/core-contracts/src/permissions.ts) | Separate settings.view, settings.edit and settings.module.toggle; sensitive accounting/cost visibility distinct | Reuse concept, NOT literal code or permission names without ByabsIQ alignment. |
| [Effective access service](https://github.com/shuvodelux-commits/nestshererp/blob/main/packages/core-application/src/auth/get-my-access-service.ts) | API can supply the UI with effective permissions for accessible navigation/actions while API still enforces server-side | Does not itself create access rights. |
| [SaaS entitlement placeholder](https://github.com/shuvodelux-commits/nestshererp/blob/main/apps/api/src/deployment/subscription-entitlement-provider.ts) | An EntitlementProvider abstraction can avoid fragmenting authorization checks | **Permissive stub only, not a commercial gate to copy as production logic.** |
| [On-prem signed license](https://github.com/shuvodelux-commits/nestshererp/blob/main/apps/api/src/deployment/license-entitlement-provider.ts) | Optional future deployment model and safe read/export on expiry | Not relevant to free-first hosted V1; do not prioritize or build on-prem support now. |
| [Canonical NestSherERP SRS](https://github.com/shuvodelux-commits/nestshererp/blob/main/SRS_AND_BUILD_GUIDE.md) | `Plan → Feature → Setting → Permission → Access`, explicit sensitive cost/profit permission, preserve historical records | Future specification, not evidence that every planned module is implemented. |

**Current HisabIQ reference:** `src/pages/Sales.tsx` already has an actual Profit column toggle in its Columns picker, stored in separate browser localStorage desktop/tablet keys. `src/saas/support/TicketsPage.tsx` and `src/saas/support/transitions.ts` already prototype a ticket-linked support access request/tenant consent/revoke flow; it does not create real impersonation or backend-restricted support sessions. `src/saas/types.ts` stores free-text plan features, not a secure entitlement graph. `src/saas/README.md` explicitly describes demo React local-state SaaS UI.

**Current ByabsIQ reference:** its subscription policy/payment backend has an earlier PRO/PREMIUM model and 30-day Pro trial that differs from the later proposed Basic + 15-day trial. Respect ByabsIQ `AGENTS.md`: session-derived tenant, RLS where implemented, platform and tenant authority separation, authentication, immutable financial/audit constraints and idempotent settlement. The plan does not claim NestSherERP, HisabIQ UI or ByabsIQ currently has a completed feature store or production remote support.

## 3. Target architecture: one effective-access explanation, distinct authorities

Introduce **one typed capability catalog** and an effective-access resolver. There may be different source records, but not independent contradictory gating implementations.

```text
Product plan + purchased passes + approved temporary commercial grants
                     |
                     v
        Commercial capability/limits resolver
                     |
                     v
       Tenant-owned feature setting preferences
                     |
                     v
       Employee permission / sensitive-field rights
                     |
                     v
       Effective tenant-user-module action permission
                     |
                     +-- UI explanation/navigation + limits
                     +-- API request authorization + field filtering

Separate support lane:
Platform staff role + tenant consent + bounded support lease
                     |
                     v
Delegated allowed tenant setting/config action
                     |
                     +-- audited as real support operator
                     +-- never replaces customer credentials/permissions
```

A feature may be: **(a) entitled and enabled**; (b) entitled but customer-disabled; (c) not entitled with a clear optional purchase path; or (d) unavailable to a particular employee due to their role. "Visible" and "authorized" are not synonyms.

Do not implement a generic `adminCanDoEverything` bypass. Platform engineers retain their **own** identities. Support leases are bounded capabilities, not tenant-owner membership or copied session cookies.

Access priority: immutable safety/tenant constraints > business lifecycle and applicable contracts > commercial rights/quota > feature dependencies and customer preferences > authenticated employee role/sensitive-field rights > support-specific narrowly approved scopes (only for actions expressly delegated).

No setting may disable authentication, MFA/recovery protections, audit, tenant isolation, backups/data access, transaction reconciliation, ledger integrity, pricing history or legally required records. "Disable module" must preserve old data and correction/export rights.

## 4. Typed registry: schema and behavior

Design a single static/versioned registry with stable keys and metadata:

| Field | Example | Purpose |
| --- | --- | --- |
| key | `sales.list.columns.profit` | Stable key; no arbitrary customer-provided code execution |
| type | boolean / enum / finite numeric / string from constrained catalog | Validated values, no untyped magic strings |
| domain | UI preference / operational feature / commercial entitlement / employee access | Prevent privilege-domain confusion |
| scope | tenant / employee / device / tenant-module | Protect one customer from changes intended for another |
| group / label | Sales / Profit column | Searchable simple UI + Bangla helper |
| default | `true` | Reproducible unchanged defaults |
| requires | `vendor_ledger_enabled` → `vendor_management_enabled` | Explicit dependencies and safe cascade |
| consumed_by / implemented | Sales History / true | Never show a saved-only placeholder as a working operation |
| effective_source | tenant default / employee override / device choice | Explain why currently on/off |
| protected | true/false | Whether owner confirmation or step-up applies |
| version / updated_at / updated_by | revision / timestamp / actor | Concurrency and audit trail |

Example categories (specific key selection is a design decision, not already implemented):
- **Sales display:** profit, items, payments, due, date, status; default visible columns by form factor.
- **POS and transaction UX:** shortcut visibility, default preview, print template choice (not account effects).
- **Products:** warranty, serial, expiry, advanced inventory (dependency-controlled).
- **Finance:** visible navigation/workspace sections (do not disable accounting invariants).
- **Reports:** display preferences versus paid Reports Plus authorization.
- **Tenant profile:** language, helper labels, data density, document preferences.
- **Commerce:** plan/add-on/SMS quotas surfaced read-only to customers; cannot edit contractual price by toggling a setting.

Separate **presentation overrides** from backend sensitive-field entitlements. E.g., `sales.list.columns.profit = false` merely hides the table column. A cashier lacking `sales.profit.view` must not receive net margin, purchase cost or profit through any API, CSV, print/detail, dashboard or report.

### Precedence and propagation

Proposed UI preference order: application default → tenant-owner default → employee override → form-factor/device override, unless tenant owner explicitly locks an enterprise-wide display policy. Each effective value must show its source. Customer settings are synchronized through the backend; localStorage can cache only non-security user/device preferences and cannot override an enforced restriction.

Setting changes need optimistic version/revision checking and a one-click rollback path. When a parent feature is switched off, the UI previews which dependent features will become unavailable; preserve underlying stored values and historical records where possible, without silently erasing configurations. If a dependent child is enabled while its prerequisite is off, reject with the prerequisite's name.

## 5. Exclusive support: consented remote configuration, not impersonation

### 5.1 Concrete customer story

1. Merchant opens Support or contacts the helpdesk: "Sales Profit column should be hidden."
2. A ticket records business, requested column, target employees/devices, purpose, scope and relevant plan.
3. Support engineer selects the tenant from SaaS and proposes `Sales → List columns → Profit: Off` with before/after preview.
4. Customer/owner self-serves or approves a narrowly scoped configuration grant. Approval includes engineer identity, precise action, timeframe and read/write/data visibility.
5. Backend validates support role + tenant + ticket + live grant + permitted setting key + current revision; writes one atomic, auditable preference change as the support actor acting on behalf of the customer.
6. The customer sees the updated column configuration, confirmation, change history, and Restore Defaults.
7. The support session ends; customer may revoke at any point. Access expires regardless of UI/browser state.

For appearance-only settings, the first release should favor a **restricted "change specific setting with approval" command** over a full interactive remote browser. It is cheaper, safer, simpler and easier for a small team to support.

### 5.2 Support permission tiers (proposed)

| Action | Initial recommendation |
| --- | --- |
| See tenant status, plan, effective feature summary and support ticket | Scoped platform support role; minimal metadata |
| See app settings/schema and propose exact change | Scoped support role, no private sales/ledger values |
| Apply one safe tenant/user UI preference | Recorded customer permission or consented single-action delegation |
| Open a live support view of one module | Separate interactive consent and short time-limited read-only grant |
| Change a sensitive settings value (e.g. costing) | Owner-directed action with step-up and risk review; ordinary support should not do it |
| Issue free trial of a paid feature | Dedicated support grant permission, owner-visible reason, short expiry and budget/approval caps |
| Refund, override price, activate without payment, change account ownership | Separate authorized financial/admin workflows with dual controls; not ordinary support |

**Support View** should show a tenant-side banner naming engineer, purpose, time limit and End Access Now. Do not ask customers for passwords, OTPs, PINs or access tokens. Support must see only fields necessary for the ticket; support accounts do not inherit the tenant owner role.

### 5.3 Short support lease contract

Persist `support_request`, `support_consent` and `support_lease` concepts: business ID, ticket ID, support staff ID, consenting owner ID, allowed module/action/key patterns (explicit enumerations), permitted data sensitivity, reason, start, expiry, revocation and audit links. **This lease is not a paid entitlement and must not be represented as an add-on SKU.**

Trial scope options to test: 15, 30 or 60 minutes; extensions require renewed consent. Proposed maximum must be revisited in formal security review. Deny when no active grant, wrong tenant, wrong employee, wrong action, expired, revoked or insufficient customer consent. Enforce at every server request—not just route entrance—and close immediately on revocation. If owner is unavailable, recovery/assisted account ownership change must go through separate identity verification.

Audit: actor is always the actual engineer; include represented tenant and approving customer, old/new values, ticket/trace ID and timestamps. Owner sees the result and has rollback where safe. No invisible staff visits.

## 6. Temporary features and employee module access

Feature store sources: plan inclusion, verified paid add-on, approved promotional trial or support goodwill grant. A permission to inspect a module as support must not create a commercial feature entitlement by itself. A complimentary feature grant must not bill the tenant.

Commercial grant sketch: `business_id`, `sku_key`, `feature_key`, source enum, order/grant ID, activation start/end, quota, reason, requested/approved by, status, version, audit trace.

Example:
- Free Basic merchant has purchased Reports Plus for 30 days, granted via verified payment.
- Support offers a 3-day Attachments Plus trial, tagged as complimentary and auto-expiring.
- A manager has an employee permission to view Reports; a cashier does not. The manager can use Reports Plus; the cashier cannot, even if the business has paid for it.
- When the trial expires, old attachments remain accessible under the retention/read policy but new paid-only uploads stop. Never delete historical business data or silently bill after trial.

Automatic expiry should not rely on a browser being open. Renewals and plan changes must treat remaining paid passes fairly: no double-billing, forfeiture or unnoticed cross-grant conflict.

Where a feature affects existing financial workflows, feature disabling should stop **new use** of the optional capability without blocking legitimate fixes, returns, settlements, receipt reprints or data exports needed to honor historical transactions.

## 7. Concrete SaaS and customer UX

Use the **existing** SaaS shell at `/#/saas`, its tenant detail and support ticket areas; don't build a new application. Preserve approved HisabIQ Brand Guide, Magic Patterns component implementation, Party Ledger-style **underline navigation tabs**, 36px controls, Products typography (13px table body, 12px header, 11px helper), Geist/Hind Siliguri, and bilingual Bangla helper text. Do not use giant pill-button tab systems, duplicate UI components or decorative actions.

Tenant detail suggested underline tabs:
1. **Overview:** tenant status, plan, last activity, active trials, support tickets.
2. **Configuration:** search module/key, editable allowed setting, inherited/effective value, target scope, preview changes, Restore and save with approval.
3. **Features & Limits:** included base, separately purchased add-ons, SMS quota/balance, active promos and upcoming expiry. Distinguish paid/manual/trial source.
4. **Support Access:** consent requests, active sessions, selected modules/actions, expiration and Revoke Now.
5. **Users & Permissions:** employee roles with sensitive field access; never grant user privileges through a presentation toggle.
6. **History:** who changed which setting/feature, when, why, source invoice/grant, reversals.

Tenant-facing application:
- **My Plan & Extras:** My Plan / Unlock Features / SMS Credits / Payment History.
- **Support:** Request Help / My Tickets / Temporary Access / Recent Changes.
- **Sales:** keep existing Columns picker. Profit toggle still available self-service; sync selected preferences to tenant/user profile with clear scope.
- Purchase prompts should provide demonstrated benefit, explicit ৳ price/term, "Not now" and a fair subscription comparison. Never interrupt a posted sale to force payment.

Support engineer must be able to find a specific customer, not browse unrestricted other tenant records. Every setting is classified by who can change it and whether it requires consent/step-up. Default support scope is minimal.

## 8. Commercial packaging for Bangladesh: hypotheses only

Retain proposed Free Basic, Counter ৳199, Medium ৳399, Premium ৳599 pending research. Do not silently rename tiers to Pro/Plus without an owner decision. Add-on candidates: enhanced printing, advanced reports and attachments at **৳149 each for a proposed 30-day pass**; test usage/one-off alternatives and whether charging for basic printing damages trust. Keep the core ERP, essentials and data access usable on Free Basic.

Important: "exclusive support" is not free unlimited live engineer access to all 1,000 users. Test:
- Free: self-help, bug reports, essential assistance, searchable help and documented self-service settings.
- Counter: limited assisted setup and response priority compared with Free.
- Medium: more support sessions and advanced report setup help.
- Premium: priority response, configurable business workflows and higher guided-assistance allowance.
- Separately quoted: migrations, onsite training, repeat custom configuration and complex workflows.

Specific service levels, timing and paid differentiation must be chosen from support-cost and willingness-to-pay evidence. Avoid giving free users intentionally poor support or charging for a bug HisabIQ caused.

### External market signals to independently recheck in Astra research

These are **public advertised snapshots, not verified actual contract costs or representative customer willingness to pay**, checked on 2026-10-25:
- [ERP71 pricing](https://app.erp71.com/pricing): advertises Starter ৳299/month, Growth ৳999/month.
- [Halkhata pricing](https://halkhata.bd/pricing): advertises Starter ৳499/month, Growth ৳999/month and a free tier. Verify dates and current offers before comparison.
- [BD Bulk SMS](https://bdbulksms.com/bulk-sms-price.php) and [W3 SMS](https://w3sms.com/pricing): publicly quoted non-masking rates differ by package sizes and validity.
- [SSLCOMMERZ pricing](https://sslcommerz.com/pricing/): advertises 2.5% per successful standard transaction and ৳25,500 basic setup. Verify negotiation, taxes and alternative bKash/Nagad merchant arrangements.

Prices are often not directly comparable because free limits, customer count, included users, service scope, trial days, support costs, SMS minimums, segment accounting and payment gateway setup vary.

**Astra must research** software spend resistance, price/feature salience, 149 vs 99 vs 199 passes, how much live support merchants value, SMS resale unit margins, cash-flow variability and merchant acquisition costs in multiple Bangladesh retail segments. Do not present trial price experiments as approved prices.

## 9. Phase plan and tests (proposal, not permission to implement)

**Phase 0 — decisions and research.** Astra reviews architecture and Bangladesh market pricing. Owner approves exact Free scope, plan catalog, feature passes/terms, support eligibility, consent and trials before code.

**Phase 1 — registered capability keys and customer preferences.** Adapt known-key/default/depends/implemented semantics within ByabsIQ without porting NestSherERP Vue code. Connect selected safe HisabIQ settings; sync Sales column preferences with tenant/user/device precedence. Verify existing Sales UX on desktop/tablet/mobile and localization.

**Phase 2 — backend commercial grants.** Integrate plan + add-on purchases + promotional grants + expiry + SMS wallet behind one server-side effective resolver, separate from role and support leases. Update 30-day Pro trial vs intended 15-day Basic downgrade, preserve financial/transaction state.

**Phase 3 — SaaS Support Configuration.** SaaS tenant settings viewer and controlled per-setting changes, consent, audit and restoration; no interactive impersonation initially. Link to support tickets. Test support-only roles cannot change unrelated tenant or sensitive settings.

**Phase 4 — scoped live support visits.** Only if actual merchant needs justify complexity: time-limited lease, customer banner, read-only diagnostic module, ability to revoke and audited operator identity; short TTL, no credential sharing.

**Phase 5 — customer success and growth.** Support time/cost dashboard, first value/activation funnels, free-user cohort retention, feature trial-to-purchase, SMS contribution margin, subscriber conversion and customer satisfaction. Scale to first 1,000 authentic businesses only after measurable support/activation economics.

### Minimum safety/functional regression matrix

- Unknown setting key / wrong value / unmet dependency / cyclic dependency / cascade warning.
- Tenant-scoped setting and user/device-specific preference; last-write/version race; cache refresh; revert defaults.
- Hide Profit visually vs profit/cost hidden on API, report, export, PDF, mobile details and Dashboard.
- Free Basic feature disabled, paid pass enabled, complimentary trial expiry, plan downgrade, refunds, duplicate payment and SMS credits.
- Support consent denied, withdrawn, timed out, wrong tenant, wrong module, support actor deactivated, revoked mid-session.
- No support bypass to owner roles, posting cash/inventory, security settings, entitlement edits, audit tampering or payment verification.
- Historical records, previously uploaded attachments, corrections/reversals and ordinary read/export available when an optional feature expires.
- No false success UI: real mutation/preview records and accurate "not implemented" for unbuilt functionality.

## 10. Astra finalization and pricing research checklist

The reviewer must challenge assumptions instead of approving by default and return:
1. Architecture assessment: exact code to reuse as a pattern, gaps, concurrency, privacy and simplified MVP.
2. Threat model for customer-consented remote configuration, leases, customer sessions and sensitive-field filtering.
3. Bangladesh merchant field study plan and actual published competitor + SMS/provider price evidence with URLs and timestamps.
4. Free Basic vs paid feature matrix, including whether receipt printing/free data export and reports should remain free.
5. Psychological price testing: cash flow, fair price, ৳99/৳149/৳199 passes, one-off vs time-limited vs per-use, subscription names and tier differentiation.
6. Support unit economics at 100, 500, 1,000, 5,000 businesses; free-service allowance, live-support SLA, staff costs and retention experiments.
7. A 90-day acquisition and activation plan, testable KPIs and falsifiable scale/no-scale decisions.
8. SMS unit margin sensitivities for masking/non-masking, Bangla segments, refunds, supplier terms, VAT, fees and prepaid liability.
9. Low/base/high financial scenarios with signup-to-MAU and repeat purchase/cohort assumptions, CAC, hosting, storage, support and taxes.
10. A finalized decision table: approved recommendation vs unverified assumption vs owner decision needed, plus phased implementation order. **Do not implement unless owner explicitly approves.**

**Do not treat NestSherERP's permissive entitlement stub as production behavior.** **Do not copy or rewrite its Vue code.** Keep HisabIQ UI GitHub as the frontend design authority and ByabsIQ as the intended backend integration target. This file is an evidence-based design proposal, not a deployed capability.
