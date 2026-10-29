# HisabIQ Installment Collections — Phase 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** From a saved installment agreement preview, receive partial, multiple, advance/early or full installment payments and display exact agreement balances—without pretending money has been posted to production accounting.

**Architecture:** Phase 1 agreements are immutable source snapshots; Phase 2 adds idempotent *in-memory receipt preview events* and a pure allocation/status projection. Reuse existing FinancePaymentSplitEditor, PartyPaymentDialog interaction patterns, source-account validation, themed Dialog, date control and amount-in-words. Actual finance/Party/Counter posting requires an independent, atomic multi-tenant backend plan.

**Tech Stack:** Existing HisabIQ React + TypeScript + Vite + shadcn-style UI, Node unit tests, Playwright, Geist + Hind Siliguri.

**Spec:** `docs/superpowers/specs/2026-10-17-installment-sales-design.md`; prerequisite reviewed Phase 1 plan `docs/superpowers/plans/2026-10-17-installment-sales-pos-preview.md` and unmerged PR #156.

## Global Constraints

- **KISS:** one selected agreement → received amount → source(s) → confirmation; manual allocation hidden in Advanced.
- **Single accounting obligation:** schedule rows never create invoice receivables; initial down payment is not a second receipt; paid events never rewrite the original price.
- **Integer paisa:** sum payment splits = received = sum row allocations; outstanding cannot become negative; Cash/Bank/MFS account must be active and match method.
- **Oldest unpaid first inside current agreement**; early/future payment allowed; never cross to another agreement automatically.
- **Excess beyond full agreement** rejected with clear message—Customer Advance is a distinct future workflow, not silent credit. No auto interest or penalties.
- **Preview boundary:** No production invoice, stock, customer ledger, cash session, finance account, bank/MFS transaction, or Counter source record. UI must say preview only.
- **Visual authority:** Current Magic Patterns and POS V2; Geist/Hind Siliguri, Ink/Teal/Mint, bilingual helper, shared controls, mobile/tablet container rules; no new cart or page.
- **Review gate:** PR #156 must be reviewed. Phase 2 code requires *separate* plan approval, separate feature branch and no merge without user approval.

## Review Focus

1. Three partial payments of one installment retain exact remaining with no duplicated paid cents (Task 1).
2. One receipt covers overdue and future installments but never crosses to another agreement (Task 1).
3. An excess amount never silently becomes Customer Advance or negative debt (Tasks 2–3).
4. Inactive Bank/MFS account or malformed split prevents confirmation without preview mutation (Tasks 2–3).
5. Double submit, Cancel and mobile keyboard do not create a second receipt or block access to confirmation (Tasks 2–5).

---

### Task 1: Exact allocation and overdue projection

**Files:** Create `src/installments/collections.ts`; test `tests/installmentCollections.test.ts`.

**Interfaces:** `allocateOldestInstallments(agreement,receipts,amountPaisa):Allocation[]` and `projectInstallmentBalance(agreement,receipts,asOf):{outstandingPaisa,dueTodayPaisa,overduePaisa,rows[]}`. Allocation points at stable schedule row IDs and applies *only within selected agreement*. Down payment is already in the agreement and is not a second receipt.

- [ ] **Step 1 — Test RED:** ৳33,000 total, ৳3,000 down, 6 × ৳5,000: pay ৳2,000 then ৳5,000; first installment becomes paid and second becomes partially paid by ৳2,000; overdue uses business date; reject foreign-agreement receipt; preserve exact paisa across multiple partials.
- [ ] **Step 2 — Verify failure:** Run the named new Node/Playwright test and observe missing function or unmet behavior.
- [ ] **Step 3 — Implement:** Implement immutable math independent of Party ledger, UTC-neutral business dates, derived Paid/Partial/Due/Upcoming/Overdue.
- [ ] **Step 4 — Test GREEN:** Re-run the named test, all prior installment tests, and relevant existing POS/Party suites; require PASS.
- [ ] **Step 5 — Commit:** Stage exactly the files for this task; use `feat(installments): exact allocation and overdue projection`.

### Task 2: Validated and idempotent preview receipts

**Files:** Modify `src/data/installmentPreviewStore.ts`; create `src/installments/validateCollection.ts`; test `tests/installmentReceiptStore.test.ts`.

**Interfaces:** `recordInstallmentReceiptPreview({agreementId,operationId,date,amountPaisa,allocations,splits}):InstallmentPaymentPreviewEvent` and `listInstallmentReceipts(agreementId):InstallmentPaymentPreviewEvent[]`; split method Cash/Bank/Mobile Banking with active finance account ID; immutable idempotency key.

- [ ] **Step 1 — Test RED:** Reject zero/negative/excess total, unknown row, duplicate split id, mismatched split/receipt and inactive account; 1 operation + same payload returns same source; same operation + edited payload rejected; never mutates Party, finance, or stock preview stores.
- [ ] **Step 2 — Verify failure:** Run the named new Node/Playwright test and observe missing function or unmet behavior.
- [ ] **Step 3 — Implement:** Use shared finance-account and date validators, integer paisa, deep-copy at storage boundary; no real bank/cash entries.
- [ ] **Step 4 — Test GREEN:** Re-run the named test, all prior installment tests, and relevant existing POS/Party suites; require PASS.
- [ ] **Step 5 — Commit:** Stage exactly the files for this task; use `feat(installments): validated and idempotent preview receipts`.

### Task 3: Compact Receive Payment dialog

**Files:** Create `src/components/pos/InstallmentReceivePaymentDialog.tsx`; test `scripts/installment-payment-browser.cjs`.

**Interfaces:** `InstallmentReceivePaymentDialog({open,agreement,receipts,onClose,onRecorded})` with existing `FinancePaymentSplitEditor` and `AmountInWordsDisplay`, default oldest-unpaid allocation, Advanced manual allocation, Cash/Bank/MFS and confirmation.

- [ ] **Step 1 — Test RED:** Playwright partial, early, exact payoff, split Cash+Bank+MFS, out-of-balance allocation, >whole-agreement remainder rejected, confirmation Cancel and mobile calendar/dropdown behavior.
- [ ] **Step 2 — Verify failure:** Run the named new Node/Playwright test and observe missing function or unmet behavior.
- [ ] **Step 3 — Implement:** Use existing themed Dialog/Input/Date controls and finance split editor. Show total remaining, due now, overdue separately; avoid separate payment forms/pages.
- [ ] **Step 4 — Test GREEN:** Re-run the named test, all prior installment tests, and relevant existing POS/Party suites; require PASS.
- [ ] **Step 5 — Commit:** Stage exactly the files for this task; use `feat(installments): compact receive payment dialog`.

### Task 4: Source-derived agreement details and history

**Files:** Modify `src/components/pos/InstallmentAgreementPreview.tsx`, minimal `src/pages/Pos.tsx` wiring; test `tests/installmentAgreementView.test.ts`.

**Interfaces:** Agreement detail reads original agreement plus `listInstallmentReceipts()` projection; contextual Receive Payment and row-level paid/due/status, receipt history and read-only original price.

- [ ] **Step 1 — Test RED:** After 3 distinct partial receipts see exact cumulative outstanding and due statuses; full payoff closes preview agreement; reopening does not duplicate; ledger/Counter not claimed updated.
- [ ] **Step 2 — Verify failure:** Run the named new Node/Playwright test and observe missing function or unmet behavior.
- [ ] **Step 3 — Implement:** Keep original Magic Patterns POS detail geometry, no independent installment navigation or separate customer balances.
- [ ] **Step 4 — Test GREEN:** Re-run the named test, all prior installment tests, and relevant existing POS/Party suites; require PASS.
- [ ] **Step 5 — Commit:** Stage exactly the files for this task; use `feat(installments): source-derived agreement details and history`.

### Task 5: Responsive/regression gate and preview limits

**Files:** Extend `scripts/installment-payment-browser.cjs`; create `.github/workflows/installment-collection-preview-check.yml`; only touch UI CSS when test evidence demands.

**Interfaces:** No new accounting APIs; cross-module UI/UX verification for desktop/tablet/mobile, Bangla/mixed, dark/light, keyboard and soft-keyboard overlays.

- [ ] **Step 1 — Test RED:** 390/768/1024/1440px, invoice amounts ≥৳100,000, modal scroll/focus, split-method dropdowns, calendar portal, duplicate submit, regular POS unaffected; ensure no real Party/Counter/finance entry and no fake 'posted' text.
- [ ] **Step 2 — Verify failure:** Run the named new Node/Playwright test and observe missing function or unmet behavior.
- [ ] **Step 3 — Implement:** Fix only measured UI failures; run `npx tsc --noEmit && npm test && npm run check:ui-contract && npm run build && node scripts/installment-pos-browser.cjs && node scripts/installment-payment-browser.cjs` plus existing Counter/Party browser checks.
- [ ] **Step 4 — Test GREEN:** Re-run the named test, all prior installment tests, and relevant existing POS/Party suites; require PASS.
- [ ] **Step 5 — Commit:** Stage exactly the files for this task; use `feat(installments): responsive/regression gate and preview limits`.

## Completion, limitations, and next source-event gate

Phase 2 is a **working UI preview**. Any real customer-money receipt must later be committed atomically with tenant auth/permissions, finance movement, receivable settlement, immutable source invoice and idempotency, with Customer Advance/return-change, corrections/reversals and reschedule history in their approved subsequent plan. Do not add simulated Party/Counter finance balances to mask missing backend.

Run whole-branch CI, capture 1440px desktop + 390px phone screenshots (both themes), verify modal and dropdown handling, and open draft PR for review. **Do not implement before explicit approval of this plan; do not merge without approval.**
