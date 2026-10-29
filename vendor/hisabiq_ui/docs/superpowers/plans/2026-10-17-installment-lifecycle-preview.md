# HisabIQ — Phase 3 Installment Lifecycle Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing HisabIQ installment agreement with audited unpaid-schedule rescheduling, reasoned settlements, source-verified partial returns, receipt reversals and printable lifecycle history; no actual ledger posting.

**Architecture:** Phase 1 original sale agreement is an immutable snapshot; Phase 2 receipts are immutable, idempotent allocations. Phase 3 appends versioned lifecycle events and computes one balance projection from original agreement + receipts + authorized reductions + reversals + current schedule version. Extend existing POS/Agreement screens, preserving Magic Patterns UX; reuse established historical bundle-return logic. This is still browser-only preview work.

**Tech Stack:** Existing React/TypeScript/Vite, shared HisabIQ shadcn-like components, Node test runner and Playwright.

**Spec:** `docs/superpowers/specs/2026-10-17-installment-sales-design.md` §§5–10; depends on Phase 1 plan `docs/superpowers/plans/2026-10-17-installment-sales-pos-preview.md`, Phase 2 plan `docs/superpowers/plans/2026-10-17-installment-collections-preview.md` and draft PRs #156/#158.

## Global Constraints

- **Original price, invoice and receipts never edited.** All lifecycle changes must be attributable to immutable, authorized source events with event ID, idempotency operation ID, actor, reason, business date, revision and before/after evidence.
- **No unsupported returns.** Current `PreviewInstallmentAgreement.lineSnapshot` contains `key,productId,amountPaisa` only; it lacks historical base-unit quantity, unit factor and bundle evidence. Extend historical snapshot at original sale creation before enabling returns. Existing records without evidence show a blocked return state, not guessed unit prices from current product master.
- **Bundle returns** operate against one parent sale line and historical component recipe; use `src/bundles/bundleReturn.ts`. Stock lot/serial restock candidates are not stock movements.
- **Money is integer paisa.** Source reductions must reconcile against original remaining obligation and paid receipts. If a return/settlement creates a surplus over outstanding, display a separate pending credit/refund disposition; never a negative customer due, automatic Customer Advance, or fictitious cash/bank posting.
- **Paid installments are immutable.** A partially paid installment retains its original due date and receipt allocations; moving its outstanding portion creates a linked successor row with a stable new ID and an audit record. Schedule revisions do not affect revenue, COGS, stock, or aggregate receivable.
- **As-of and permissions:** Asia/Dhaka dates; deterministic source replay; stale revisions rejected. Permission intent `installment.reschedule`, `installment.adjust`, `sales.return`, `installment.reverse-receipt` is recorded, but client-side checks cannot substitute for production server-side authorization.
- **KISS / visual lock:** Existing POS V2 and Magic Patterns typography/density; use `Dialog`, `NumericInput`, date controls, `Table`, `AmountInWordsDisplay`. Actions reachable from Agreement details, advanced options collapsed; no new POS/return cart or separate payment engine.
- **Truthful UI:** All event writes are in-memory previews only; no Party/Counter/Finance/Bank/MFS/stock/audit-ledger source mutation. No toast saying production posted. Keep #155–#158 and this PR unmerged without user approval.

## Review Focus

1. Three receipts totaling ৳7,000, followed by a schedule revision: paid evidence and dates unchanged, exact unpaid carried forward.
2. Partial sale returns across two batches never exceed sold base quantity nor historical parent net-line paisa; deterministic last-paisa remainder.
3. Sale ৳33,000, down ৳3,000, receipts ৳25,000, authorized reduction ৳10,000: zero due and explicit ৳5,000 surplus action; no phantom cash/negative balance.
4. Double submit, stale schedule version, invalid reason/actor/date, wrong party or unknown invoice line: zero mutation.
5. 390px phone and tablet: all schedule, return and settlement dialogs, focus, mobile keyboard, popovers and Bangla amounts remain usable; regular POS unaffected.

---

### Task 1: Historical return-grade line evidence

**Files:** Modify `src/data/installmentPreviewStore.ts`, `src/pages/Pos.tsx`. Create `src/installments/historicalLines.ts`, `tests/installmentHistoricalLines.test.ts`. Read `src/types/erp.ts`, `src/utils/posQuantity.ts`, `src/bundles/bundleReturn.ts`.

**Interfaces:** `InstallmentHistoricalLine={lineKey,productId,kind,originalBaseQuantity,originalNetPaisa,selectedUnit,unitFactorAtSale,serials?,lotAllocations?,bundleSnapshot?,stockSource?}`. `createHistoricalInstallmentLines(cart,attributedNetAmounts)` and `returnEligibility(agreement)`. Snapshot copy must use sold/attributed prices, not today's product master.

- [ ] **Step 1 — RED:** Normal Pcs, compound `2 Box 5 Pcs`, service and Bundle Set preserve historical quantities and net paisa; source-less old preview is blocked; current price or current bundle recipe changes never affect a return value.
- [ ] **Step 2 — Run failing test:** `node --experimental-strip-types --test tests/installmentHistoricalLines.test.ts` plus `npm test`. before implementing; require failure due to the missing behavior (not typo).
- [ ] **Step 3 — Implement:** Freeze actual sale line and parent bundle evidence at preview agreement creation, backwards-compatibly optional on old agreements.
- [ ] **Step 4 — GREEN:** Rerun `node --experimental-strip-types --test tests/installmentHistoricalLines.test.ts` plus `npm test`. and inspect all outputs; fix regressions before continuing.
- [ ] **Step 5 — Commit:** Stage only the relevant files and commit `feat(installments): freeze return-grade historical source lines`.

### Task 2: Immutable lifecycle projections

**Files:** Create `src/installments/lifecycle.ts`, `tests/installmentLifecycle.test.ts`; minimally adapt `src/installments/collections.ts` without changing original Phase 2 signatures.

**Interfaces:** `InstallmentLifecycleEvent` discriminated union: `ScheduleRevisionPreview | AgreementReductionPreview | ReturnAdjustmentPreview | ReceiptReversalPreview`. `projectInstallmentLifecycle(agreement,receipts,events,asOf)` exposes current effective schedule, paid, outstanding, overdue, due-now, surplus credit, status, immutable audit trail.

- [ ] **Step 1 — RED:** ৳33,000 sale/৳3,000 down/six payments; partial receipts plus revision do not change original sale, settled amount or source receipts. Return reduction after ৳25,000 received yields zero outstanding + explicit surplus, and earlier as-of dates replay historical position.
- [ ] **Step 2 — Run failing test:** `node --experimental-strip-types --test tests/installmentLifecycle.test.ts`, all prior installment tests and `npm test`. before implementing; require failure due to the missing behavior (not typo).
- [ ] **Step 3 — Implement:** Replay events in effective-date and append-sequence order; allocate reductions to unpaid portions only, expose over-credit separately and preserve old agreements.
- [ ] **Step 4 — GREEN:** Rerun `node --experimental-strip-types --test tests/installmentLifecycle.test.ts`, all prior installment tests and `npm test`. and inspect all outputs; fix regressions before continuing.
- [ ] **Step 5 — Commit:** Stage only the relevant files and commit `feat(installments): project audited lifecycle money and status`.

### Task 3: Versioned and idempotent schedule rescheduling

**Files:** Create `src/installments/revisions.ts`, `tests/installmentScheduleRevisions.test.ts`; modify `src/data/installmentPreviewStore.ts`.

**Interfaces:** `previewScheduleRevision({agreementId,baseRevision,operationId,actorId,reason,effectiveDate,nextUnpaidRows})`; `recordScheduleRevisionPreview(input)`; `listInstallmentRevisions(agreementId)`. Stable original IDs plus successor IDs for carried partially-paid balance.

- [ ] **Step 1 — RED:** Cannot edit wholly paid rows, repoint receipt allocations, delete historical due evidence, change sum of unpaid obligation or create duplicate row IDs. Reject stale revision, zero reason, bad dates, altered same operation and unauthorized intent. A partially paid ৳5,000 row (৳2,000 paid) carries only ৳3,000 to a new row.
- [ ] **Step 2 — Run failing test:** `node --experimental-strip-types --test tests/installmentScheduleRevisions.test.ts` and `npm test`. before implementing; require failure due to the missing behavior (not typo).
- [ ] **Step 3 — Implement:** Validate immutable before/after row projection; commit event atomically to in-memory store; no invoice or finance source mutations.
- [ ] **Step 4 — GREEN:** Rerun `node --experimental-strip-types --test tests/installmentScheduleRevisions.test.ts` and `npm test`. and inspect all outputs; fix regressions before continuing.
- [ ] **Step 5 — Commit:** Stage only the relevant files and commit `feat(installments): append versioned audited schedule revisions`.

### Task 4: Historical return and settlement adjustments

**Files:** Create `src/installments/adjustments.ts`, `tests/installmentAdjustments.test.ts`; modify `src/data/installmentPreviewStore.ts`. Reference `src/bundles/bundleReturn.ts`, `src/utils/partySettlement.ts` and existing `src/pages/Sales.tsx` returns.

**Interfaces:** `previewInstallmentReturn({agreementId,lineKey,returnBaseQuantity,disposition,reason,actorId,baseRevision})` returns `{historicalValuePaisa,appliedToDuePaisa,excessPaisa,issues}`. `recordInstallmentReturnPreview(input)` and `recordInstallmentSettlementPreview({agreementId,amountPaisa,actorId,reason,operationId,baseRevision})`.

- [ ] **Step 1 — RED:** Two partial returns sum exactly to historical attributed line value; cumulative returned quantity ≤ originally sold; bundle uses the historical parent Set snapshot; missing lot/serial evidence blocks restock claims. A fully paid/over-reduced agreement displays excess requiring explicit pending refund/credit, never a fake bank payment.
- [ ] **Step 2 — Run failing test:** `node --experimental-strip-types --test tests/installmentAdjustments.test.ts`, bundle-return tests, `npm test`. before implementing; require failure due to the missing behavior (not typo).
- [ ] **Step 3 — Implement:** Immutable, audited, idempotent preview source events only; never change original agreed invoice price or real SalesReturn/Party/stock/finance.
- [ ] **Step 4 — GREEN:** Rerun `node --experimental-strip-types --test tests/installmentAdjustments.test.ts`, bundle-return tests, `npm test`. and inspect all outputs; fix regressions before continuing.
- [ ] **Step 5 — Commit:** Stage only the relevant files and commit `feat(installments): validate historical return and settlement previews`.

### Task 5: Contextual reschedule, return and settle UI

**Files:** Create `src/components/pos/InstallmentRescheduleDialog.tsx`, `src/components/pos/InstallmentAdjustmentDialog.tsx`, `scripts/installment-lifecycle-browser.cjs`; modify `src/components/pos/InstallmentAgreementPreview.tsx` and minimal `src/pages/Pos.tsx` callback wiring.

**Interfaces:** Agreement actions `onReschedule`, `onReturn`, `onSettle`, each opens shared themed dialog and requests a validated immutable lifecycle event with explicit confirmation/reason; caller reloads the source-derived view. Missing historical return evidence shows clear disabled explanation.

- [ ] **Step 1 — RED:** Keyboard/Playwright tests for edit schedule, partial paid row lock, return line selection, settlement amount, review-confirm, Cancel/no event, failed validation, modal calendar portal and no hidden footer on phone.
- [ ] **Step 2 — Run failing test:** `node scripts/installment-lifecycle-browser.cjs`; previous `scripts/installment-payment-browser.cjs`. before implementing; require failure due to the missing behavior (not typo).
- [ ] **Step 3 — Implement:** One compact action strip and native Dialog with old/current terms and after-balance; no new standalone checkout, cart, bespoke modal/dropdown or real-posted language.
- [ ] **Step 4 — GREEN:** Rerun `node scripts/installment-lifecycle-browser.cjs`; previous `scripts/installment-payment-browser.cjs`. and inspect all outputs; fix regressions before continuing.
- [ ] **Step 5 — Commit:** Stage only the relevant files and commit `feat(installments): contextual audited lifecycle editors`.

### Task 6: Source-linked receipt reversal and printable audit

**Files:** Create `src/installments/reversals.ts`, `tests/installmentReceiptReversal.test.ts`; modify `src/data/installmentPreviewStore.ts` and `src/components/pos/InstallmentAgreementPreview.tsx`; reuse existing print receipt components.

**Interfaces:** `recordInstallmentReceiptReversalPreview({sourceReceiptId,agreementId,reason,actorId,operationId,baseRevision})`. One immutable compensating event per receipt. Print/screen history shows original vs revised schedule, receipts, reversals, adjustments, as-of balance and `PREVIEW — NOT POSTED`.

- [ ] **Step 1 — RED:** Duplicate or foreign receipt reversal rejected, source receipt retained but net applied recomputed, reversal conflicting with later revisions blocked pending revalidation, source audit immutable. Print not labeled paid into real bank.
- [ ] **Step 2 — Run failing test:** `node --experimental-strip-types --test tests/installmentReceiptReversal.test.ts`, `npm test` and browser lifecycle flow. before implementing; require failure due to the missing behavior (not typo).
- [ ] **Step 3 — Implement:** Append compensating preview event and update projection; preserve linked audit references and reuse current document/print typography.
- [ ] **Step 4 — GREEN:** Rerun `node --experimental-strip-types --test tests/installmentReceiptReversal.test.ts`, `npm test` and browser lifecycle flow. and inspect all outputs; fix regressions before continuing.
- [ ] **Step 5 — Commit:** Stage only the relevant files and commit `feat(installments): receipt reversal and printable lifecycle history`.

### Task 7: Full ERP regression and CI review

**Files:** Create `.github/workflows/installment-lifecycle-preview-check.yml`; extend `scripts/installment-lifecycle-browser.cjs`; adjust only test-evidenced UI defects.

**Interfaces:** CI: `npx tsc --noEmit`, `npm test`, `npm run lint`, `npm run check:ui-contract`, `npm run build`, old POS/collection browser scripts, lifecycle browser, bundle-return, Party and Counter screens (read-only integration checks).

- [ ] **Step 1 — RED:** End-to-end sold→partial collected→revision→return→settlement→reversal→new balance; double-submit/stale revision; mobile 390 and 768, tablet 1024, desktop 1440; both themes, Bangla, keyboard/drawer/modal/date-picker, full ৳100,000+ amounts.
- [ ] **Step 2 — Run failing test:** Entire CI workflow and all named scripts; require zero failures before announcing ready. before implementing; require failure due to the missing behavior (not typo).
- [ ] **Step 3 — Implement:** Fix only actual regression failures, preserve Magic Patterns/current POS. Document all preview-only limits and review screenshot parity.
- [ ] **Step 4 — GREEN:** Rerun Entire CI workflow and all named scripts; require zero failures before announcing ready. and inspect all outputs; fix regressions before continuing.
- [ ] **Step 5 — Commit:** Stage only the relevant files and commit `ci(installments): gate lifecycle and mobile accounting previews`.

## Next phase boundary and approval

Phase 3 is still **in-memory UI preview only**. The repository has no production backend, and its `src/data/sales.ts` and Party/finance ledgers are fixtures/preview source stores. **Do not** claim actual inventory restocking, return/refund, cash movement, Customer Advance, tax or customer-ledger posting. Real tenant/auth/permissions, posted SalesInvoice and Party/Finance/stock events, concurrency-safe idempotent DB transactions, refund and reconciliation are the subsequent production backend architecture/integration phase, requiring its own security review and approval.

**Review gate:** This plan is documentation only. Review before Phase 3 product-code work; on approval implement in a separate feature branch from Phase 2 with subagent-driven review gates when available (native TDD fallback otherwise), open a draft PR and do not merge without explicit approval.
