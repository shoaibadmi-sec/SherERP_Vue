# HisabIQ SaaS Commerce and Messaging UI Implementation Plan

> **KISS design precedence:** Apply the [ERP-wide KISS UI/UX contract](../specs/2026-10-25-hisabiq-erp-wide-kiss-uiux-contract.md) before this document. It supersedes older tab counts, screen fragmentation and optional confirmation steps; product capabilities, safety and backend contracts remain mandatory.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the merchant-to-HisabIQ commerce prototype: payment collection/review, purchased access, lifecycle downgrade, SMS/provider operations, refunds, services and reconciliation.

**Architecture:** Extend existing SaaS billing/SMS/portal screens with versioned commerce records and pure transition functions. The same effective-access resolver supplies merchant UI and staff explanations; real payment/provider adapters are deferred to ByabsIQ. Use one shared preview source and injected server clock, never duplicated entitlement booleans.

**Tech Stack:** Existing React/TypeScript/Vite, shared primitives, node:test and Playwright. No gateway/SMS SDK or production secret in the UI phase.

**Spec:** [Commerce design and deferred requirements](../specs/2026-10-25-hisabiq-saas-commerce-messaging-design.md), [shared Settings/SaaS design](../specs/2026-10-25-hisabiq-settings-saas-ui-backend-design.md), [SaaS Control Center plan](2026-10-25-hisabiq-saas-control-center-ui.md).

## Global Constraints

- Platform purchases are separate from customer payments inside the merchant ERP.
- Basic = simple; Medium = connected; Premium = rich; paid passes affect only their feature keys.
- Pending/partial payment creates no rights or credits. Verification and bank payout are separate states.
- Permanent Free stays writable; expiry preserves historical data and independently valid grants.
- Subscription terms are calendar months/years; passes are fixed durations; server-time boundaries.
- SMS is billable segments, not visible characters or unlimited use. Unknown dispatch outcome cannot be blindly retried.
- Keep audited source-linked refund/credit corrections and no secret-bearing logging.
- Existing Ink/Teal/Mint, underline tabs, 36px controls, 13/12/11 table typography and bilingual light/dark responsive conventions.
- No provider purchase, live message, real refund, backend code, production configuration, price publication, merge or deployment.
- Counter/grace/provider/tax defaults in the spec remain explicit later release decisions.

## Review Focus

1. Two callbacks/reviewers/retries for one payment must create one allocation and fulfillment (Tasks 3–4).
2. Expiring one of overlapping grants must not downgrade an independently paid capability (Task 5).
3. Unknown SMS submission/refund or supplier billing must not double-send, double-charge or release credit prematurely (Tasks 7–9).
4. Price changes, late payments and partial/overpayments must preserve the customer's money and quoted terms (Tasks 2–4).
5. Provider credentials, private proof and correlation search must remain isolated across staff/tenants (Tasks 1, 3, 7, 10).

---

## Files and contracts

Create src/saas/commerce/{types,catalog,orders,payments,fulfillment,lifecycle,refunds,selectors}.ts, CheckoutPage.tsx, FeatureStorePanel.tsx, OperationsPanel.tsx.
Create src/saas/messaging/{providerTypes,providerTransitions,encoding,deliveryTransitions,reconciliation}.ts and ProvidersPanel.tsx.
Modify src/saas/{types,state,seed,validateState,permissions,TenantPortal}.tsx/ts and existing billing, messaging, services and reports pages. Reuse the shared src/experience contract; no second access resolver.

Tests: tests/saasCommerce.test.ts, saasLifecycle.test.ts, saasSmsOperations.test.ts, saasCommerceRecovery.test.ts. Browser: scripts/saas-commerce-browser.cjs, registered as test:saas-commerce.

Pure preview entry point:
commerceTransition(state:CommercePreviewState,actor:CommerceActor,command:CommerceCommand,now:string):CommerceResult.
CommercePreviewState holds typed orders/quotes/payments/receipts/allocations/fulfillment/grants/refundAttempts/providerConfigs/creditLots/creditEvents/messages/attempts/outbox/reconciliationCases. CommerceActor uses existing staff/tenant identity and scoped permissions; no client-provided role escalation.
CommerceCommand is a discriminated union of tasks' named commands; each mutation carries operationId and revision. CommerceResult is {ok:true;state:CommercePreviewState;resultId:string|null}|{ok:false;code:string;message:string}. resultId references the changed typed record; callers use the corresponding selector. Return no arbitrary untyped provider payload.

Task 1 defines shared records from spec section 3; later task contracts consume these exact names. Source code path suffixes follow existing .ts/.tsx conventions.

## Task 1: Catalog, state and permissions

**Files:** commerce/types.ts, catalog.ts; existing state/types/seed/validateState/permissions; tests/saasCommerce.test.ts.
**Produces:** Spec quote/order/payment/grant types; CommercePreviewState; explicit role capabilities catalog.manage, collections.configure, payments.verify, fulfillment.retry, refunds.approve/execute, smsProviders.configure, smsOperations.reconcile.

- [ ] Write failing cases publishedVersionImmutable, retiredSkuCannotNewOrder, tenantCannotEditCatalog, supportCannotVerifyMoney, legacyBillingStatePreserved, noSecretInPersistedState.
- [ ] Run `node --experimental-strip-types --test tests/saasCommerce.test.ts`; confirm intended failure.
- [ ] Implement versioned plans/passes/SMS/service fixtures; preserve historical invoices/receipts and legacy records as read-only where migration cannot safely infer authority. New orders use typed catalog, not Plan.features strings.
- [ ] Test same actor roles do not widen another tenant's scope. Run tests and commit `feat: define SaaS commerce catalog and state contracts`.

## Task 2: Tenant quote, checkout and collection setup

**Files:** commerce/orders.ts, CheckoutPage.tsx, FeatureStorePanel.tsx; TenantPortal.tsx; billing PaymentForm.tsx and admin SettingsPage.tsx; tests/saasCommerce.test.ts.
**Produces:** CommercePort.quote/order/paymentIntent/submitEvidence/orderStatus from spec section 3; commands order.create and payment.submit.

- [ ] Add failing tests quoteSnapshotsTaxTermAndSku, quoteExpiryOnlyBlocksNewOrder, orderPayDeadlineUsesCollectionTime, lateVerificationHonorsOnTimePayment, pendingProofDoesNotActivate, partialPaymentStillDue, wrongTenantOrderDenied, sampleDestinationClearlyLabeled.
- [ ] Run targeted test; confirm failures.
- [ ] Show plans/passes/inclusions/terms and server-like authoritative quote. Offer only enabled sample merchant/bank destinations or simulated hosted checkout. Collection setup stores safe metadata, not credentials; provider environment and active destinations are explicit.
- [ ] Include pending/needs-info/activation-delayed/verified states and receipt links, safe error/retry, return-to-task context. Do not add general wallet top-up to buy a feature.
- [ ] Verify ordinary ERP cashbook is unchanged by platform purchases; run tests and commit `feat: add merchant platform checkout preview`.

## Task 3: Payment verification and allocations

**Files:** commerce/payments.ts; billing/PaymentsPage.tsx and selectors/transitions; tests/saasCommerce.test.ts.
**Produces:** CommerceAdminPort.review; commands payment.review and payment.allocate. Receipts/allocations remain separate from attempts and payout records.

- [ ] Add failing tests screenshotIsNotVerification, duplicateProofAcrossTenantsDenied, wrongAmountAccountCurrencyDenied, combinedCallbackManualReviewCreditsOnce, overpaymentUnappliedNotLost, sameStaffCannotApproveOwnProof.
- [ ] Run targeted test; expect failures.
- [ ] Reuse existing review UI with quoted order, private evidence and simulated statement/provider match. Verify/Needs information/Reject are permission-controlled. Enforce normalized collection identity and operation replay.
- [ ] Partial verified allocations cannot exceed receipt/amount due; surplus remains explicit. Late payments enter review and cannot silently credit a different SKU.
- [ ] Run tests plus existing SaaS billing tests; commit `feat: verify platform payments against source orders`.

## Task 4: Exactly-once fulfillment and recovery

**Files:** commerce/fulfillment.ts, selectors.ts, OperationsPanel.tsx; billing/transitions.ts; tests/saasCommerceRecovery.test.ts.
**Produces:** fulfillOrder(state,orderId,now) and order.retryFulfillment using deterministic fulfillment identity; grants/credit lots project into shared experience.

- [ ] Write failing tests paidReportUnlocksOnlyReports, partialNeverFulfilled, duplicateCallbackOneGrant, concurrentOverlapCreditCannotSpendTwice, grantFailureLeavesPaymentVerifiedNotFulfilled, notificationFailureDoesNotRollBackGrant, staticPackSurvivesPlanExpiry.
- [ ] Run `node --experimental-strip-types --test tests/saasCommerceRecovery.test.ts`; confirm failures.
- [ ] Atomically simulate fully funded order → one grant/credit lot + audit/outbox; distinguish PAID/FULFILLMENT_PENDING/FULFILLED. Retry repairs activation without requesting another payment.
- [ ] Display paid-but-not-active filtered queue within existing billing operations, source order and safe retry; preserve independently purchased grants and employee rights. Run tests; commit `feat: add idempotent purchase fulfillment preview`.

## Task 5: Trial/renewal/cancellation/downgrade

**Files:** commerce/lifecycle.ts; billing/SubscriptionsPage.tsx; TenantPortal.tsx; experience preview adapter; tests/saasLifecycle.test.ts.
**Produces:** evaluateCommercialAccess(grants,subscription,now), quoteRenewal, schedulePlanChange, subscription.cancelRenewal; no global paid boolean.

- [ ] Write failing tests optionalReportTrialOnly, exactTrialBoundary, overlappingGrantSurvives, planExpiryKeepsWritableFree, monthEndLeapYearClamping, earlyRenewalExtendsPaidEnd, lateRenewalStartsAtFulfillment, activationDelayDoesNotConsumeTerm, retryDoesNotMoveGrantedInterval, cancellationPreservesPaidTerm, downgradePreservesFilesAndDrafts.
- [ ] Run `node --experimental-strip-types --test tests/saasLifecycle.test.ts`; expect failures.
- [ ] Replace fixed-30-day subscription demo arithmetic for new records with calendar terms; label legacy records and grace migration review. Show timeline and Free fallback; scheduler preview cannot be only access check.
- [ ] Quote unused actual paid-value credit before upgrade, preserve paid passes and stored preference intent. Dirty forms re-check effective capabilities; existing financial correction routes remain.
- [ ] Run targeted tests and shared experience tests; commit `feat: model subscription expiry with permanent Free fallback`.

## Task 6: Sell SMS and maintain credit lots

**Files:** messaging/transitions.ts, commerce/fulfillment.ts, messaging/SmsPage.tsx, TenantPortal.tsx; tests/saasSmsOperations.test.ts.
**Produces:** purchase fulfillment → one source credit lot; walletSummary, reserveCreditLots, consumeReservation and releaseReservation.

- [ ] Write failing tests unpaidPackNoCredits, verifiedPackOneLot, reserveConsumeNotDoubleDebit, earliestExpiryFirst, walletSurvivesSubscriptionExpiry, rechargeCarryForwardAudited, refundCannotConsumeReservedCredit.
- [ ] Run `node --experimental-strip-types --test tests/saasSmsOperations.test.ts`; expect failures.
- [ ] Add approved conditional package fixtures, 12-month validity, available/reserved/consumed/expired breakdown and lot/event history. Never mix supplier procurement balance and merchant wallet.
- [ ] Run tests and existing SaaS tests; commit `feat: add paid SMS lots and wallet accounting preview`.

## Task 7: Provider onboarding and procurement UI

**Files:** messaging/providerTypes.ts, providerTransitions.ts, ProvidersPanel.tsx; SmsPage.tsx; tests/saasSmsOperations.test.ts.
**Produces:** provider.configure/test/activate/disable and supplier.recordRecharge commands; safe provider metadata only. Driver interfaces live in spec section 14.

- [ ] Add failing tests providerConfigNeedsPermission, activationNeedsTestAndSenderReview, unsupportedEndpointRejected, credentialsNotPersistedOrExported, tariffChangePreservesOldCost, supplierRechargeDoesNotMintMerchantCredits.
- [ ] Run targeted tests; expect failures.
- [ ] Use Delivery / Packages & Credits / Providers as one tab row, with procurement/tariffs inside Provider detail. Add fixed supported-driver selector and mock environments; masked dummy credential indicator, route/sender readiness, versioned tariff/tax/validity/minimum fields, balance/recharge/invoice references. Use injected simulated tests; do not accept actual credentials in this browser preview.
- [ ] Show Configured/Testing/Ready/Active/Degraded/Disabled; no false provider-connected state. Add margin check and low supplier balance warning. Run tests; commit `feat: design SMS provider onboarding and procurement`.

## Task 8: Segment, send, resolve delivery and retry

**Files:** messaging/encoding.ts, deliveryTransitions.ts; SmsPage.tsx; tests/saasSmsOperations.test.ts.
**Produces:** estimateMessageUnits(body,driverProfile), sms.quote/reserve/dispatchResult/deliveryResult/reconcile/retry. Final statuses per spec section 10.

- [ ] Add failing tests banglaCombiningMarks, gsmExtensionCostsTwoSeptets, emojiUnicodeUnits, businessFooterIncluded, duplicateRecipientsDeduped, timeoutHoldsReservation, unknownCannotFailover, duplicateDlrNoDoubleCharge, failedBilledNotReleased, expiredQueuedLotCannotDispatch, unknownReservationSurvivesLotExpiry, releasedExpiredLotNotSpendable.
- [ ] Run targeted tests; confirm failures.
- [ ] Implement provider-profile segmentation tests, final-text preview, recipient × segment estimate and atomic reservation/send-intent/outbox. Dispatch is simulated; no network sends.
- [ ] Track accepted vs delivered vs billed/unbilled/unknown. Retry only after resolved previous outcome and explicit safe command. Link attempts and keep private message content out of diagnostic events.
- [ ] Run tests; commit `feat: model SMS delivery and safe retry states`.

## Task 9: Refunds, disputes and source-specific reversal

**Files:** commerce/refunds.ts; billing/PaymentsPage.tsx/InvoicesPage.tsx; tests/saasCommerceRecovery.test.ts.
**Produces:** refundQuote/requestRefund/queryRefund; commands refund.request/result; explicit holds and compensating records.

- [ ] Add failing tests refundNotGreaterThanNetReceipt, refundUnknownCannotRetryNewKey, concurrentSmsUseCannotBeatRefundHold, partialRefundOnlyAffectedGrant, refundFailureReleasesHold, disputeRetainsAudit, reversalIsNotBankRefund.
- [ ] Run targeted tests; expect failures.
- [ ] Preview refund impact before approval; hold unused affected units/rights; simulate pending/success/failure/unknown provider outcome. Confirmed success appends compensation and recomputes surviving grants; never deletes receipt.
- [ ] Preserve customer receipt and show safe status. Run tests; commit `feat: add reconciled refund and dispute preview`.

## Task 10: Reconciliation and operating exceptions

**Files:** messaging/reconciliation.ts, commerce/OperationsPanel.tsx, admin/ReportsPage.tsx; tests/saasCommerceRecovery.test.ts.
**Produces:** reconcilePayments and reconcileSms returning cases, not silent balance edits.

- [ ] Write failing tests payoutMismatchNotFailedCustomerPayment, collectedVsEarnedSeparated, unusedSmsIsLiability, paidNotFulfilledVisible, unknownAttemptNeedsOwner, foreignEvidenceNotInExport.
- [ ] Run targeted tests; expect failures.
- [ ] Show queues for unmatched transfer, duplicate proof, activation delayed, unknown delivery/refund and provider invoice mismatch. Report gross/earned/fees/taxes/refunds/liability/contribution with explicit date basis.
- [ ] Provide safe retry/query/escalation against original operation, not new financial replay. Run tests; commit `feat: add SaaS commerce reconciliation workspace`.

## Task 11: Services and operational notifications

**Files:** services/ServicesPage.tsx, services/transitions.ts, commerce/lifecycle.ts, outbox preview; tests/saasCommerce.test.ts.
**Produces:** service quote/accept/pay/schedule/deliver statuses; deduplicated notification intent records.

- [ ] Add failing tests paymentDoesNotMarkServiceDelivered, deliveredDoesNotInventPayment, duplicateExpiryReminderOneIntent, notificationFailureDoesNotRevokePaidRights, supportRoleCannotChangeCollectionAccount.
- [ ] Run targeted tests; expect failures.
- [ ] Reuse service catalog/order UI; keep delivery/payment separate. Show renewal/trial/pass/credit expiry notice preview and history without sending messages or running real jobs.
- [ ] Run tests and existing services tests; commit `feat: align service delivery and commerce notifications`.

## Task 12: Complete review and future backend handoff

**Files:** scripts/saas-commerce-browser.cjs, package.json, docs/saas/README.md.
**Consumes:** All prior shared contracts and complete spec acceptance stories.

- [ ] Write browser journeys for report purchase pending→verified→active→expiry; early renewal; partial/overpayment; duplicated verification; paid activation retry; Pro downgrade with surviving pass; SMS sale/reserve/unknown/reconcile; provider setup test; refund hold; service payment/delivery.
- [ ] Check that one shared checkout serves all SKU purposes without redundant confirmation and every consolidated operations action remains reachable. Check desktop/tablet/mobile, light/dark and English/Bangla/bilingual using existing Playwright conventions. Register test:saas-commerce; assert actual shared preview records change, not only toasts.
- [ ] Run `npm test`, `npm run test:saas-commerce`, `npm run test:saas`, `npm run test:saas-control-center`, `npm run check:ui-contract`, `npm run build`; document exact unavailable/pre-existing failures.
- [ ] Deliver screen/action/state inventory and gaps. Commit `test: verify SaaS commerce and messaging journeys`; request owner review, no merge/deploy.

## Deferred ByabsIQ work

The spec section 14 defines required API/entity/driver responsibilities. A later backend execution plan must specify real provider protocols, migrations/backfill, RLS, server authorization, exact transaction/outbox recovery, callbacks, secret storage, jobs, backups and signed-off retention/tax contracts. Do not treat browser tests as verification of settlement or SMS delivery.

Self-review: collection/verification → Tasks 1–3; fulfillment → 4; trial/downgrade → 5; SMS sale/provider/send → 6–8; refunds → 9; operations → 10; services/notices → 11; whole-system acceptance → 12. Every Review Focus condition has named tests. No runtime tests were run while writing this plan.
