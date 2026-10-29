# HisabIQ SaaS Commerce Operations — UI Design and Deferred Backend Requirements

> **KISS design precedence:** Apply the [ERP-wide KISS UI/UX contract](2026-10-25-hisabiq-erp-wide-kiss-uiux-contract.md) before this document. It supersedes older tab counts, screen fragmentation and optional confirmation steps; product capabilities, safety and backend contracts remain mandatory.

**Date:** 25 October 2026, Asia/Dhaka.  
**Status:** Planning extension requested by the owner; no live integrations, price publication or production changes.  
**Authority:** [Business decisions](2026-10-25-hisabiq-approved-business-model-decisions.md); [Settings/SaaS shared design](2026-10-25-hisabiq-settings-saas-ui-backend-design.md). This document completes the previously underspecified payment, fulfillment, subscription and messaging operations. Existing approved prices/free rights remain unchanged.

## 1. Scope, baseline and responsibility

This is platform commerce: a merchant pays Sher Software Solutions for HisabIQ subscriptions, passes, SMS or services. It is separate from the merchant collecting money from their customers inside the ERP. Never credit the merchant's cashbook, sales invoice or customer ledger when they purchase a HisabIQ plan.

Reuse existing React SaaS billing, plans, subscriptions, tenant portal, SMS and services screens. Reuse ByabsIQ's authenticated platform payment-review, session/tenant isolation, duplicate-proof prevention, idempotency and audit foundations.

Inspected UI: src/saas/billing/{transitions,PaymentForm}.tsx/ts; messaging/{transitions,SmsPage}.tsx/ts; current plans/portal/state. Existing preview can submit/review payments, allocate receipts, fulfill SMS after full payment, reserve credits and simulate delivery. It does not establish a live gateway/provider. Its fixed 30-day subscription increment and simple Unicode detection must not become production specifications.

ByabsIQ's current subscription policy has PRO/PREMIUM, a 30-day Pro trial, grace and read-only expiry. Migrate that policy under a separate backend plan to permanent writable Free and scoped time-bound grants. Do not copy NestSherERP's permissive entitlement stub.

Deliver the UI prototype now only when separately instructed. Implement actual backend/providers later. Provider choice, contract fees/tax, settlement schedule, sender approval and credentials remain operational release gates, not invented facts.

## 2. Complete commerce map

| Area | Merchant-facing UI | SaaS staff UI | Later server responsibility |
|---|---|---|---|
| Plans/passes | Included features, period, price, eligibility, remaining-value credit | Versioned catalog draft/preview/publish/retire | Authoritative quotes, tax and eligibility |
| Payment collection | Checkout or configured manual merchant account; order reference | Payment channels and collection destinations | Payment intents, provider query/callback, evidence |
| Verification | Pending/needs information/verified/rejected | Review inbox, private evidence, statement match | Amount/account/currency match, permission and duplicate prevention |
| Fulfillment | Paid / activating / active; usable purchased benefit | Failed fulfillment queue, retry linked operation | Exactly-once grants/credits via atomic ledger and outbox |
| Subscription lifecycle | Trial/paid expiry, renewal, downgrade explanation | Lifecycle timeline, policy preview, exceptions | Effective access at server time, scheduled notices, Free fallback |
| SMS sales | Package purchase, available/reserved credits, segment estimate | Sales/usage/credit liability/margin | Paid wallet ledger, quota and reservation |
| SMS procurement | No wholesale credentials | Supplier configuration, tariffs, balance/recharge history | Secret-managed driver, controlled route, reconciliation |
| Messaging | Compose/preview/consent/send/status | Queue, safe delivery detail, unresolved outcomes | Segmentation, outbox, DLR/polling, deduplicated retry |
| Refund/dispute | Request/status/receipt/remaining rights | Approval, provider refund, allocation/credit impact | Compensating records, no destructive financial rewrite |
| Services | Request, quote, accept, pay, schedule, deliverable | Assignment/capacity/delivery/invoicing | Payment and service completion remain separate |
| Operations | Clear status and receipts | Revenue/fees/liability/provider invoices/exceptions | Daily reconciliation, jobs, audit and alerts |

Full product coverage also includes account suspension/reactivation distinct from billing expiry, private payment attachments, quota overages, staff permissions, tax invoices, exports, notification history and maintenance/outage handling.

## 3. Data model and exact shared contracts

Proposed UI files: src/saas/commerce/{types,catalog,orders,payments,fulfillment,lifecycle,refunds,selectors}.ts. Backend mirrors the concepts in packages/contracts/src/commerce.ts and domain modules later; UI fixture implementations are not server authority.

Types:
- CommercialPurpose = 'SUBSCRIPTION'|'FEATURE_PASS'|'SMS_PACK'|'SERVICE'.
- OrderStatus = 'AWAITING_PAYMENT'|'PART_PAID'|'PAID'|'FULFILLMENT_PENDING'|'FULFILLED'|'CANCELLED'|'REFUND_PENDING'|'PART_REFUNDED'|'REFUNDED'|'REVIEW_REQUIRED'.
- PaymentStatus = 'INITIATED'|'PENDING'|'VERIFYING'|'NEEDS_INFORMATION'|'VERIFIED'|'REJECTED'|'DISPUTED'.
- PaymentSettlement = 'NOT_APPLICABLE'|'PENDING_PAYOUT'|'PAID_OUT'|'MISMATCH'.
- QuoteLine = {skuVersionId:string; purpose:CommercialPurpose; quantity:number; amountMinor:string; featureKeys:string[]; term:{kind:'CALENDAR_MONTH'|'CALENDAR_YEAR'|'FIXED_DAYS'|'ONE_TIME'; value:number}; smsSegments:number}.
- CommercialQuote = {id:string; businessId:string; lines:QuoteLine[]; subtotalMinor:string; taxMinor:string; discountMinor:string; overlapCreditMinor:string; overlapSources:{grantId:string; revision:number; amountMinor:string; claimId:string}[]; totalMinor:string; currency:'BDT'; expiresAt:string; catalogVersion:number}.
- CommercialOrder = {id:string; businessId:string; quote:CommercialQuote; status:OrderStatus; revision:number; createdAt:string; payByAt:string; paidMinor:string; fulfillmentId:string|null}.
- PlatformPayment = {id:string; orderId:string; businessId:string; status:PaymentStatus; settlement:PaymentSettlement; amountMinor:string; currency:'BDT'; method:string; providerId:string|null; providerTransactionId:string|null; receivedAt:string|null; verifiedAt:string|null; evidenceId:string|null}.
- CommercialGrant = {id:string; businessId:string; sourceOrderId:string|null; source:'PLAN'|'PASS'|'TRIAL'|'PROMO'; featureKeys:string[]; startsAt:string; endsAt:string|null; quota:number|null; status:'ACTIVE'|'EXPIRED'|'REVOKED'; revision:number}.
- CommandMeta = {operationId:string; expectedRevision:number}; duplicate same command returns its stored result, changed payload conflicts.
- CommercePort.quote(input:{skuVersionId:string; quantity:number}):Promise<CommercialQuote>.
- CommercePort.order(input:{quoteId:string; operationId:string}):Promise<CommercialOrder>.
- CommercePort.paymentIntent(orderId:string,input:{method:string; operationId:string}):Promise<{paymentId:string; redirectUrl:string|null; instructions:string|null}>.
- CommercePort.submitEvidence(orderId:string,input:{paymentId?:string; amountMinor:string; method:string; reference:string; evidenceId?:string; operationId:string}):Promise<PlatformPayment>.
- CommercePort.orderStatus(orderId:string):Promise<CommercialOrder>.
- CommerceAdminPort.review(paymentId:string,input:CommandMeta & {decision:'VERIFY'|'REJECT'|'NEEDS_INFORMATION'; reason:string; confirmedStatementReference?:string}):Promise<PlatformPayment>.
- CommerceAdminPort.retryFulfillment(orderId:string,input:CommandMeta):Promise<CommercialOrder>.
- CommerceAdminPort.refundQuote(orderId:string,input:{amountMinor:string; reason:string}):Promise<{refundQuoteId:string; refundableMinor:string; rightsImpact:string[]; smsSegmentsToRevoke:number}>.
- CommerceAdminPort.requestRefund(refundQuoteId:string,input:{operationId:string}):Promise<{refundId:string; status:'PENDING'|'SUCCEEDED'|'FAILED'|'UNKNOWN'}>.

Amounts are integer minor-unit decimal strings, never float arithmetic. UI formats paisa as taka. Quote and order retain immutable price/tax/term snapshots. Server derives business/actor from session, not the businessId in a browser object.

Store orders, payment attempts, settlement/payout, receipt allocations, refunds, fulfillment results, grants and SMS credits separately. Do not overload Subscription.status or an invoice.fulfilled boolean as the entire ledger.

## 4. Collect payment

### 4.1 Merchant purchase flow

My Plan & Extras contains underline tabs My Plan / Feature Store / SMS Credits / Bills & Payments / Services. Show actual inclusions and price/period/expiry before checkout. Only owner buys initially.

Choose SKU → receive authoritative quote → review overlap credit/tax/total → create order → select available payment method → pay → see live order status. No generic “success” before verification. Cancellation of a checkout attempt does not prove no money moved.

UI states: waiting for payment, partial payment, needs information, checking provider, verified/activating, active, rejected, payment received but activation delayed, refund pending and refunded. Show human order/reference IDs and safe support/correlation links. Preserve the original task when returning from checkout.

### 4.2 Two collection modes

**Pilot/manual:** show only active, approved company merchant/bank collection destinations. Display exact amount, destination, order reference, transaction-reference field and optional private receipt upload. Staff checks the actual merchant/bank statement. A screenshot/reference is a claim, never proof by itself.

**Integrated:** server creates a provider payment intent for a saved order and approved channel (e.g. contracted bKash/Nagad/acquirer). UI follows provider-hosted checkout. Provider callback is authenticated/validated according to its real contract; verify via provider query when required. Browser redirect/result is not authority. Merchant account, amount, BDT currency, transaction identity and captured/success status must match the saved order.

If successful capture/collection is contractually final enough to fulfill, activate after verification; bank payout may occur later. Track payout reconciliation separately so “verified payment” does not falsely mean “bank settlement received”. Do not wait days for payout unless that provider's risk policy requires it.

The design does not select a provider, claim an MDR or configure real collection accounts. Prototype uses fake destinations labeled Sample.

## 5. Verify and allocate money

SaaS Payment Verification inbox filters channel/status/date/order/tenant and assignment. Review panel: order/quote, requested amount, net verified amount, customer evidence privately, statement/provider result, duplicate warning, reviewer and history.

Actions Verify / Needs information / Reject require independent payments.verify authority; support.edit alone cannot verify. Recheck authority at commit, including retries. Self-submitted evidence cannot be self-approved by the same staff operator; owner-authorized exceptions require a separate recorded reviewer policy.

Canonical provider identity includes provider + merchant account + currency + provider transaction ID. For manual channels use channel/account + normalized statement reference. Cross-tenant reuse is denied without exposing the other tenant. Retain original submitted evidence.

For manual partial payments, verified allocations accumulate; no grant/SMS fulfillment until fully funded. Overpayment is unapplied credit against the same business's platform billing or a refund workflow, not a transferable wallet or a merchant ERP cashbook deposit. Automated checkout requests the full current due unless the selected provider explicitly supports partial charges.

Use locks/unique evidence identity and idempotency so two reviewers or callback/manual verification races cannot allocate one transfer twice. A single verified transfer may allocate to multiple orders only through explicit auditable split allocation whose sum never exceeds collected value.

Missing callback: query/reconciliation recovers. Amount mismatch, foreign account/currency, duplicated proof, invalid provider signature or late/expired quote enters REVIEW_REQUIRED with a safe explanation. Confirmed late money is honored through a reviewed compatible quote or refunded; never silently discarded or applied to a different product.

## 6. Activate purchased features and credits

Transaction:
1. Lock order and allocation state; verify business, full funded amount, SKU snapshot and fulfillment not already completed.
2. Record deterministic fulfillment ID and source-linked plan/pass grant or SMS credit lot exactly once.
3. Write audit, receipt/fulfillment result and outbox notification in the same commit.
4. Publish experience refresh after commit; merchant sees the benefit without logging out.

If notification/cache refresh fails, purchase stays fulfilled; a retry refreshes instead of creating another grant. If grant/credit transaction fails, do not mark fulfilled. Payment remains verified and enters activation retry queue; customer sees “Payment received—activation pending”, not “Pay again”.

Capabilities = active plan + active independent passes + approved promos, then employee rights, customer preferences/dependencies and quota. Passes never grant confidential staff permissions. Reports pass never makes the whole ledger Premium. Static owned print pack remains owned after subscription expiry.

Features & Limits shows every grant with source, order, starts/ends, quota and effective reason. No generic “turn feature on” action silently manufactures a paid grant. Complimentary grant remains distinct, bounded and audited.

## 7. Trial end, renewal, cancellation and downgrade

Use server time on every access evaluation. A scheduler sends notices and updates materialized states but cannot be the only expiry enforcement; expiry must work if jobs stop.

Approved default is Free immediately, with contextual seven-day report trial. No automatic whole-ERP 14/15/30-day trial. Existing trial data is migrated explicitly; do not silently reinterpret earlier paid rights.

| Event | Required result |
|---|---|
| Report trial expires | Remove only the trial's capability; subscription/paid passes remain |
| Paid report/storage pass expires | Stop new paid-only use; preserve saved reports/attachments and history |
| Pro/Plus subscription expires without renewal | Recompute to Free + independently valid passes; Basic remains writable |
| One grant ends while another grants the same feature | Keep feature available through the surviving grant |
| Cancellation requested | Schedule nonrenewal at paid end; do not erase the paid term |
| Plan changed to lower tier | Apply scheduled change at boundary; retain preferences and historical records |
| Account administratively suspended | Separate account restriction; billing payment must not silently undo suspension |
| Paid renewal received before end | Extend from later of paid expiry or first successful fulfillment under the saved term |
| Paid renewal after lapse | Start at first successful fulfillment; activation delay does not consume the purchased term |

Subscription months/years use calendar arithmetic with month-end/leap-year clamping in UTC, as existing backend renewal foundations do. Feature passes use exact 7/30 × 24 hours. Customer date display Asia/Dhaka. No date-only truncation for enforcement.

Paid-grace proposal is zero extra paid-feature days at launch; keep Free available. Existing seven-day backend grace requires explicit migration/product review, not silent deletion for existing contractual rights. Any future grace is a typed, visible bounded grant, not an untracked status bypass.

For upgrades, quote unused actual paid value/overlapping passes before payment; round in minor units and snapshot. Each credit identifies source grant/revision and an exclusive claim. A business may have only one outstanding upgrade-credit order initially. Lock source credit claims during that payable order; prevent competing credit orders or refund of the same claimed value. Existing access continues during the disclosed short price-guarantee window. Revalidate the claim/source revision at fulfillment. Payment collected within that window honors the snapshotted price; ordinary clock passage alone does not silently increase the charge. On fulfillment, consume each claim once and replace/shorten only the explicitly credited overlapping grant portion as disclosed in the accepted quote; the new plan covers that benefit. Non-overlapping passes remain unchanged. Record the transferred value so later refunds cannot claim the old and new value twice. Cancel/expiry releases unspent claims; late money requires review and a fresh compatible quote or refund. Never shorten independently purchased passes without disclosed compensation. Scheduled downgrade and stale open forms cannot overwrite newer grants.

Over capacity after downgrade: retain products/attachments and standard existing-record workflows; block new capacity expansion/uploads as specified, not all writing. In-progress sales/payment drafts are preserved and completion revalidates ordinary business rules. Never force a new payment to retrieve historical records.

### 7.1 Term and checkout anchors — planner defaults for review

A new paid subscription/pass starts at first successful fulfillment, not at failed activation attempts or upload of payment evidence. Calendar renewal extends from max(previousPaidEnd, firstSuccessfulFulfillmentAt). Persist startsAt/endsAt in that fulfillment transaction once; repeated commands never move the interval. Complimentary trials start at grant commit. This protects the full purchased duration after a paid activation delay; do not backdate and silently consume that delay.

Quotes expire 15 minutes after creation for creating an order. An order created in that period retains its quoted terms and has a separately displayed 24-hour payByAt (or earlier published provider intent deadline). These are proposed checkout defaults, not previously approved commercial terms. Verification after payByAt is permitted when independent provider/statement evidence proves collection on time; do not treat staff queue delay as late customer payment. Evidence upload time is not collection time. Money actually collected after the deadline, or money without reliable collection time, enters REVIEW_REQUIRED.

Stop new payment intents on an expired/cancelled order, but keep querying outstanding attempts and recording real money. Never cancel/expire an order simply because a callback was late when payment was already received on time. UI shows quote expiry, payment deadline and entitlement duration separately.

## 8. Sell SMS and maintain a wallet

Catalog baseline: 100 segments ৳99; 500 ৳399; 2,000 ৳1,499. These remain conditional on approved landed cost/margin and tax checks; no publication here. Each order snapshots count, route class and 12-month validity. Masking is a separate quote-only product initially.

Order → payment → verification → one credit lot. Pending payment adds no available credits. Wallet displays available, reserved, expired, consumed and adjustments, with source order/receipt. Credits are independent of subscription plan. Authentication OTP is a platform expense, not deducted from merchant wallet.

Ledger types: PURCHASE, PROMO, RESERVE, CONSUME, RELEASE, REFUND_REVOKE, EXPIRY, ADJUSTMENT. Reservations reference source credit lots, message attempt and operation. Use consistent accounting: reserve decreases available/increases reserved; consume decreases reserved/increases used; release reverses unbilled reservation. Never subtract both reserve and consume from the same available balance.

Earliest-expiring usable lots fund a message first. Paid credit liability and wholesale procurement balance are separate ledgers. New recharge carries forward eligible unused credits under approved published terms; require an explicit source-linked expiry extension adjustment rather than erasing prior lot history.

Refund unused credits only after checking reservations/usage; no refund of consumed supplier-billed segments except covered service/billing fault. Reserved/unknown sends block automatic credit reversal until resolved.

## 9. Add an SMS provider and manage wholesale purchasing

Platform controls provider integration and wholesale contract; merchants buy HisabIQ credits. Do not ask every shop to enter a gateway API key. BYO-provider is deferred.

SaaS SMS uses Delivery / Packages & Credits / Providers. Provider setup and procurement share the selected Provider detail; advanced fields expand only when needed. SaaS SMS → Providers:
1. Select a supported driver from a fixed catalog; identify legal supplier, account, environment and route class.
2. Enter credentials through a write-only secure mechanism in the future backend. UI shows saved/not configured and masked identifier, never a retrievable secret.
3. Configure approved sender/route, allowed message category and operator coverage.
4. Add versioned procurement tariff: base unit cost, included/excluded taxes/MNP, validity, minimum recharge and supplier evidence.
5. Test connection/balance, approved sender and consented test phone. Distinguish credential validation from actual delivery confirmation.
6. Review sender approval, test result, cost/margin and allowed use; activate through a privileged audited action.
7. Monitor status, vendor balance and planned recharge; record wholesale recharge, invoice, units/expiry and reconciliation.

UI has Disconnected / Configured / Testing / Ready / Active / Degraded / Disabled states, clear last-tested time and safe failure. No “Add provider” button that only changes a badge.

Use driver-registered endpoints and HTTPS. No arbitrary caller-supplied URLs that turn configuration into SSRF. Server secret store/encryption, privileged credential rotation, masked audit, separate sandbox/production credentials and request timeouts are backend requirements. Provider secrets must never enter frontend bundle, localStorage, diagnostics, exports or GitHub.

Only provider.configure staff can change credentials/routes; support can inspect safe health only if authorized. Changing provider or tariff must not reprice historical credit lots or erase paid customer obligations. Disabling a provider blocks new dispatch, not wallet/history access.

Primary route and tested backup are supported later, but automatic failover is allowed only after proving the first provider did not accept the message. Unknown submission must be reconciled before another provider is used. Do not switch a non-masking paid pack to a masking route with unapproved margin/sender effects.

Supplier low balance is a procurement exception, not a reason to silently charge the merchant again. Queue with truthful status and operator alert.

## 10. Compose, segment, dispatch and deliver SMS

Preview final rendered text including business name/template/footer, chosen recipients, route, estimated billable segments and available credits. Store consent/message category as applicable. Dedupe recipients; validate Bangladesh formats and empty messages. Safe bulk limits, opt-out handling and approved sender/template rules belong to the real supplier/legal policy before production.

Segmentation adapter must match the contracted route: GSM-7 extension characters can occupy two septets; Unicode uses encoding units/combining marks rather than visible letters. Standard 160/153 GSM and 70/67 Unicode limits are baseline tests, not permission to use the current ASCII detector. Include Bangla, smart quotes, emoji, extension characters and provider-added text.

State machine:
DRAFT → QUOTED → RESERVED → QUEUED → SUBMITTING → ACCEPTED → DELIVERED / FAILED_BILLED / FAILED_UNBILLED / UNKNOWN.
Rejected-before-submit → release; unresolved submit timeout → UNKNOWN with reservation held; no blind retry.
Delivery failure alone does not prove unbilled. Apply supplier-confirmed billing/release policy. Sending status and credit status are separate.

Create send intent + reservation + outbox atomically. Worker uses stable attempt key; driver normalizes vendor response/ID. Authenticate DLR callback or verify by query according to real protocol. Duplicate/out-of-order callbacks cannot consume/release twice or overwrite a final result incorrectly.

Retry creates a linked attempt only after prior outcome and billing are known. Reuse/hold funded reservation where appropriate; never accidentally double-charge or double-send. Idempotent replay of the same command returns original attempt.

Tenant sees recipient/message status under its own permissions. General diagnostic logs store safe codes/correlation, not raw recipient/message text; delivery content uses a separate restricted messaging record with its own retention.

### 10.1 Reserved-lot expiry — planner default for review

For an unsubmitted queued attempt, dispatch requires both the 15-minute reservation window and each funding lot's validity to remain open. Revalidate at submit; if expired before submission, cancel that attempt and release its reservation. Released funding returns to its original lot: available only if that lot is still valid, otherwise recorded as expired. It must not resurrect expired paid credits.

Once submission may have reached the provider before the funding deadline, ACCEPTED/UNKNOWN reservations stay funded even across lot expiry until billing outcome is reconciled. Exclude held amounts from an ordinary expiry debit; confirmed billable use consumes the held value once. Confirmed unbilled release after expiry returns to expired value, not spendable value. Any customer compensation for HisabIQ-caused delay is a separate approved goodwill grant with its own source/expiry.

A reservation cannot be refunded while submission/billing is unresolved. Age/escalate UNKNOWN cases with explicit operator ownership; never auto-release at a timeout merely to clear the queue. Provider-specific definitive resolution requires its query/billing evidence or an audited authorized adjustment.

## 11. Refunds, reversals, disputes and recovery

Distinguish correcting a bookkeeping allocation from returning real money. A “reverse payment” command cannot claim a bank refund happened.

Refund quote identifies original receipt/allocation, unused term/credits, related grants, taxes/fees and payment provider. Require refund authority, reason, owner policy and independent approval where required. Never refund beyond verified receipt net of prior refunds.

Reserve/refund-lock affected unused rights/credits so they cannot be consumed simultaneously, then enqueue provider refund with a stable key. External refund and DB cannot be one transaction: record PENDING, query after timeout, and mark SUCCEEDED only on confirmed provider evidence. UNKNOWN is not permission for another refund call with a new key.

On confirmed refund, append compensating allocation and entitlement/credit adjustment records. Recompute surviving grants and actual due; do not set the entire tenant inactive or delete historical receipt. Partial refunds remove only specified unused value. If refund fails, release holds safely while preserving audit. Chargebacks/disputes go to REVIEW_REQUIRED with explicit risk policy; no invisible historical rewrite.

Canceled unpaid orders void no real receipt. Paid orders cannot simply disappear into Recycle Bin. Price/catalog changes never rewrite receipts.

## 12. Jobs, reconciliation and operating controls

SaaS Operations → Exceptions queue (may live inside Reports initially) lists unmatched payment, duplicate evidence, amount mismatch, paid/not fulfilled, provider timeout, unknown SMS charge, refund unknown, expired grant not reflected in cache and supplier balance mismatch.

Later jobs:
- Verify stale payment intents by provider query.
- Retry committed fulfillment/outbox notifications idempotently.
- Compute/send expiry reminders with deduplication; effective access still evaluates request-time.
- Poll unresolved SMS attempts/DLR as supported.
- Reconcile gateway transactions/fees/payouts with internal verified receipts and allocations.
- Reconcile supplier invoices/recharges/billable segments with SMS lots/usage.
- Alert and preserve evidence for exceptions; no automatic deletion to “make totals match”.

Metrics: gross collections vs earned revenue; outstanding/refundable balances; unconsumed SMS liability; supplier cost, fees/taxes/refunds; contribution by SKU/pack; renewal/churn; trial-to-paid; unpaid/activation aging; supplier balance and delivery quality. Use source-backed values, currency and explicit date basis. A recharge is not automatically earned SMS revenue.

Receipt/private evidence retention, operational logs, billing/audit retention and secret rotation are different policies. Basic customers still get their own receipt/history.

## 13. Required screens and action matrix

| Screen | Required actions and states |
|---|---|
| Tenant My Plan | Current effective tier, grant timeline, renew/change/cancel, expiry and Free fallback |
| Tenant Feature Store | Eligible SKU preview, included label, term/price, buy, active grant and expiry |
| Tenant Checkout | Quote, approved payment channel, manual instructions/evidence or checkout simulation, pending/error/active |
| Tenant Bills & Payments | Order, due, attempts, receipt, refund request/status, private own evidence |
| Tenant SMS | Buy pack, wallet ledger, compose/segment estimate, send intent/status, failures and safe retry |
| SaaS Catalog | Versioned plans/passes/SMS/service SKUs, draft preview/publish/retire, no silent repricing |
| SaaS Payments | Verify/reject/request info, allocation, duplicate warning and evidence controls |
| SaaS Fulfillment | Paid/pending/failed activation, source order and safe retry |
| SaaS Lifecycle | Trial/pass/plan timeline, scheduled downgrade, complimentary source and future policy preview |
| SaaS SMS Providers | Configure/test/review/enable/disable, tariff and sender approval, vendor balance/recharge |
| SaaS SMS Delivery | Attempts, billing outcome, unresolved query, authorized retry, reconciliation |
| SaaS Refunds/Exceptions | Quote/approve/refund/query, holds/compensation and operational ownership |
| SaaS Services | Quote/payment/assignment/schedule/delivery tracked separately |

These are functional areas, not a requirement for a separate route/dashboard for each row. Use one shared merchant checkout; embed activation/refund/exception views in existing billing operations, and provider tariffs/procurement inside Provider detail. Keep existing SaaS navigation; extend Plans, Payment verification, Subscriptions, SMS, Services and Reports rather than create a competing app. Underline tabs and current 36px/13–12–11 typography remain.

## 14. Deferred backend contract and readiness

Future entities: catalog_versions, orders, order_lines, payment_attempts, verified_receipts, allocations, fulfillment_results, commercial_grants, refund_attempts, sms_credit_lots, sms_credit_events, sms_messages, sms_attempts, provider_configs, provider_tariffs, supplier_recharges, outbox and reconciliation_cases. Reuse/extend existing tables where sound; these names describe responsibilities, not approval for duplicate ledgers or fixed migration names.

Proposed endpoint groups:
- Tenant /api/commerce/catalog, /quotes, /orders, /orders/:id/payment-intents, /orders/:id/evidence, /orders/:id, /receipts, /refund-requests.
- Tenant /api/subscription/current, /renewal-quote, /change-quote, /cancel-renewal.
- Tenant /api/sms/packages, /wallet, /messages/quote, /messages, /messages/:id.
- Platform /api/platform-admin/commerce/payments/:id/review, /orders/:id/retry-fulfillment, /refund-quotes, /refunds, /exceptions.
- Platform /api/platform-admin/sms/providers, /providers/:id/test, /providers/:id/activate, /providers/:id/disable, /tariffs, /supplier-recharges, /reconciliation.
- Provider callbacks under explicitly registered payment/SMS webhook routes. They authenticate provider context independently of tenant browser sessions.

Server validates all session/scope/amount/state boundaries, CSRF on browser mutations, unique evidence and deterministic fulfillment. Webhook payload is not a trusted business identifier. Driver-specific signature/replay/query rules require actual selected-provider documentation at later implementation time.

PaymentDriver interface: createIntent, verifyResult, queryPayment, refund, queryRefund; driver knows vendor protocol, domain service owns ledger policy.
SmsDriver interface: validateConfig, queryBalance, estimateSegments, submit, queryAttempt, verifyDeliveryCallback; supports explicit unknown/billed distinctions. No arbitrary browser credentials.

Rollback/backfill plan must rehearse preserving paid subscriptions, pending evidence, credit balances and historical terms. Test concurrent reviewers/callbacks, lost responses, duplicate jobs, month-end, server-clock expiry, refund/send races and cross-tenant API/RLS against real PostgreSQL. No production launch until actual provider fees/taxes, sender authority, bank matching, secret storage, retention and restore/load tests are signed off.

## 15. Acceptance and open choices

A reviewable UI prototype must demonstrate:
1. Free owner buys a report pass: pending money unlocks nothing; verified full payment unlocks exactly reports.
2. Pro/Plus expires: returns to Basic + surviving passes, existing data/receipts/recovery remain usable.
3. SMS pack paid twice by repeated callback gives one credit lot; provider unavailable does not lose credits.
4. Long Bangla message quotes multiple segments, reserves once, remains UNKNOWN on timeout and is not retried blindly.
5. Wrong payment amount/duplicate evidence cannot activate; paid activation failure recovers without asking for money twice.
6. Partial/refund/chargeback effects are source-specific, auditable and safe.
7. Provider credential sample never appears in browser persistence, customer UI or diagnostic export.
8. Daily reconciliation exposes mismatches instead of silently correcting balances.

Unresolved decisions are explicit release gates: chosen gateway/SMS drivers and contracts, tax classification, existing-customer grace migration, precise provider failure billing, sender approvals, daily grant/refund budgets and eligible automatic refund policy. None blocks planning; none is presented as already approved.

Owner-approved principles/prices remain authoritative. The no-extra-paid-grace launch proposal and detailed operating defaults here are planner recommendations for review. No paid feature entitlement, real money or SMS is changed by this document.
