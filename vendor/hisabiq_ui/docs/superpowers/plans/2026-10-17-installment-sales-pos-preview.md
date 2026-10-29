# HisabIQ Installment Sales — POS Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Magic Patterns-style POS V2 so a shopkeeper can choose Installment, negotiate a price without presets, edit a balanced schedule, and confirm/view an honest, working *in-memory preview* agreement, without breaking regular sales or pretending to post production books.

**Architecture:** Extend `src/pages/Pos.tsx` + existing `CheckoutPanel` and `TransactionReviewDialog`—do not clone the cart, picker, total card or payment rows. Isolate integer-paisa pricing, schedule generation, and preview-agreement data in small modules. Preview records are separate from the current unposted invoice and ledger state, deliberately making actual collection/accounting/stock integration a *later, separately reviewed implementation slice*.

**Tech Stack:** React 18 + TypeScript, Vite 5, Tailwind 3/shadcn-style shared UI, Geist/Hind Siliguri, Lucide; Node 24.21.0 `node --experimental-strip-types --test` unit tests; Playwright existing browser scripts.

**Spec:** `docs/superpowers/specs/2026-10-17-installment-sales-design.md` (draft PR #155; the revised POS visual lock and safety boundaries are binding).

## Global Constraints

- **KISS:** one existing product → existing editable cart price → existing split down payment → automatic editable installment schedule → existing review/confirm surface. No separate installment product, POS page, cart, duplicate price field, or duplicate payment editor.
- **Price fallback:** use normal effective POS price if no matching optional duration preset; automatic markup **never** applied. Manual fixed-amount, percent, or direct agreed total is optional and must never compound silently.
- **Financial truth:** existing POS `complete()` is a UI preview, not production posted cash, inventory or customer ledger. Preserve explicit preview labels and do not create false Party source events.
- **Money:** exact integer paisa at pure calculation boundaries; `downPayment + sum(schedule) = agreedTotal`; no negative/invalid rows; modal cannot confirm an unbalanced schedule.
- **Existing visual authority:** `AGENTS.md`, `docs/ui/transaction-cart-design-contract.md`, `src/theme.css`, `src/index.css`, `CartTable`, `ProductCombobox`, `CheckoutPanel`, `AmountInWordsDisplay`. Preserve dark Total Payable, split rows, customer/discount/rounding/paid/change/due and cost-eye alignment.
- **Responsive/accessibility:** compact inline cart/table at screen-specific *container* widths; tablets portrait stacked and landscape side-by-side only where it fits; mobile dialogs/portals never clip or lose keyboard focus. Bangla helpers, no font-mono, ≥ ৳1,00,000 fully visible; sensible focus/keyboard support.
- **Branch/reviews:** after separate approval of this plan, run implementation in a new `feat/installment-pos-preview` branch/worktree from up-to-date `main` (which must include the approved spec). One review gate/commit per task; no merge without user approval.
- **Scope boundary:** post-sale allocations, finance Cash/Bank/MFS *receipts*, audited rescheduling, Returns, Customer Ledger/Counter integration, real invoice source posting and production backend are separate follow-on plans. Do not present unavailable actions as functional.

## Review Focus

1. **No preset price + regular/instalment toggle:** unchanged catalog `sellPrice` and unchanged cart quantity/unit/stock/cost; explicit manual price survives mode changes safely (Task 1, 4, 6).
2. **Manual edited schedule + changed sale total/down payment:** never silently rewrite custom rows; show the difference and require explicit rebalance (Task 2, 3, 5).
3. **Paisa edge values:** `৳1,00,000.01`, odd leftover cents, negative/infinite/NaN and 31st-of-month rollover; exact invariants with no display truncation (Task 1, 2, 7).
4. **Invalid customer/duplicate confirmation:** installment cannot confirm without a durable selected or explicitly created customer identity; double-click cannot make two agreements (Task 5, 6).
5. **Android/mobile overlays:** date picker/dropdown inside schedule dialog remains accessible when soft keyboard opens; focus restored on close, content scrolls and buttons remain operable in light/dark (Task 3, 7).

---

### Task 1: Pure installment pricing and exact money adapters

**Files:**
- Create: `src/installments/pricing.ts`
- Test: `tests/installmentPricing.test.ts`
- Read-only reference: `src/utils/currency.ts`, `src/utils/partyPayment.ts`, `src/hooks/usePosCart.ts`

**Interfaces:**
- `takaInputToPaisa(value: string): number` — parses valid nonnegative decimal input with at most two decimals, rejects bad/unsafe input.
- `getInstallmentStartPrice(regularPaisa: number, matchingPresetPaisa?: number): number` — always produces an **editable suggestion**.
- `negotiateInstallmentTotal(basePaisa: number, edit: {mode: 'direct'|'amount'|'percent'; value: string}): number` — interprets amount as signed taka, percent as signed decimal percentage, direct as total; two decimal places, no independent accumulated markup.
- `allocateNegotiatedInvoiceLines(lines: readonly {key:string; amountPaisa:number}[], targetPaisa:number): {key:string; amountPaisa:number}[]` — proportional across eligible positive lines; deterministic remainder, zero lines untouched, throw for impossible target.

- [ ] **Step 1: Write failing tests.** Assert regular `3000000` paisa without preset stays `3000000`; matching preset `3300000` is suggested; direct `33000`, amount `3000`, and percent `10` yield the same `3300000`; two eligible lines sum to the exact target; zero line remains zero; unsafe/negative currency input is rejected.
- [ ] **Step 2: Run the failing suite.** `node --experimental-strip-types --test tests/installmentPricing.test.ts`; expect FAIL (module/functions absent).
- [ ] **Step 3: Implement the signatures** in `pricing.ts`, reusing existing money semantics; no independent rounding of invoice line allocation and no product-record mutation.
- [ ] **Step 4: Run the suite and existing currency tests.** `node --experimental-strip-types --test tests/installmentPricing.test.ts tests/currencyPrecision.test.ts`; expect PASS.
- [ ] **Step 5: Commit.** `git add src/installments/pricing.ts tests/installmentPricing.test.ts && git commit -m "feat(installments): exact negotiation and line allocation math"`.

### Task 2: Standalone editable installment schedule calculations

**Files:**
- Create: `src/installments/schedule.ts`
- Test: `tests/installmentSchedule.test.ts`
- Read-only: `src/utils/dateRange.ts` and existing date-picker semantics.

**Interfaces:**
- `type InstallmentScheduleRow = {id:string; dueDate:string; amountPaisa:number; editedAmount:boolean; editedDate:boolean}`.
- `generateInstallmentSchedule(input: {remainingPaisa:number;count:number;firstDueDate:string;frequency:'Monthly'|'Weekly'}): InstallmentScheduleRow[]`.
- `scheduleDifferencePaisa(rows:readonly InstallmentScheduleRow[], requiredRemainingPaisa:number):number` returning `sum(rows.amountPaisa)-requiredRemainingPaisa`.
- `rebalanceUneditedInstallments(rows:readonly InstallmentScheduleRow[], requiredRemainingPaisa:number):InstallmentScheduleRow[]` — preserves edited row amounts and dates, rejects impossible remaining.
- Dates are `YYYY-MM-DD`, anchored to Asia/Dhaka business calendar; monthly generation uses the original anchor day and clamps each month independently (31 Jan → 28/29 Feb → 31 Mar).

- [ ] **Step 1: Failing tests.** `৳33,000` total, `৳3,000` down, six monthly rows → six `৳5,000` rows, correct dates; seven-way paisa split → last row absorbs remainder; edited second row remains unchanged across rebalancing; 31 January anchor; count zero, invalid/duplicate dates and too-large locked rows fail clearly.
- [ ] **Step 2: Run the failing suite.** `node --experimental-strip-types --test tests/installmentSchedule.test.ts`; expect FAIL.
- [ ] **Step 3: Implement `schedule.ts`** using UTC-neutral ISO date construction only for calendar math (no converting explicit business dates through browser locale/UTC day boundary). Require strictly increasing generated due dates.
- [ ] **Step 4: Run tests.** `node --experimental-strip-types --test tests/installmentSchedule.test.ts`; expect PASS.
- [ ] **Step 5: Commit.** `git add src/installments/schedule.ts tests/installmentSchedule.test.ts && git commit -m "feat(installments): exact editable schedule calculations"`.

### Task 3: Themed Schedule Breakdown dialog, without wizard navigation

**Files:**
- Create: `src/components/pos/InstallmentBreakdownDialog.tsx`
- Create: `scripts/installment-breakdown-browser.cjs`
- Reference: `src/components/{Dialog,Button,Input,NumericInput,AppDateRangePicker,Table}.tsx` and `src/components/parties/PartyPaymentDialog.tsx`.

**Interfaces:**
- `InstallmentBreakdownDialog({open,onClose,rows,onApply,requiredRemainingPaisa}:` props with `rows:readonly InstallmentScheduleRow[]` and `onApply:(rows:InstallmentScheduleRow[])=>void`).
- The child dialog maintains **local edits**, applies them atomically on Save, and discards them on Cancel. No network or ledger actions.
- One compact row table: sequence, due date (shared themed date control) and amount (shared numeric control); toolbar Distribute Equally, Rebalance Remaining, Add/Remove row; inline `Scheduled total`, `Difference`, status; no pre-sale `Upcoming` badges.

- [ ] **Step 1: Failing Playwright script.** Assert six rows visible, edit row amount/date, difference shown, Save disabled until balanced, explicit rebalance preserves manual row, Cancel does not mutate parent, Save applies, Escape/focus restoration and a mobile 390px viewport do not clip footer/calendar.
- [ ] **Step 2: Run to confirm failure.** `node scripts/installment-breakdown-browser.cjs` after adding a minimal test fixture/access route in that same task; expect FAIL before dialog exists.
- [ ] **Step 3: Implement component** with existing Dialog, themed inputs/date picker, no new CSS theme or nested wizard. Show Bangla helper and accurate taka formatting. Dialog may be mounted by a tiny preview fixture initially; delete fixture once Task 5 wires actual POS.
- [ ] **Step 4: Run the browser regression.** `node scripts/installment-breakdown-browser.cjs`; expect PASS.
- [ ] **Step 5: Commit.** `git add src/components/pos/InstallmentBreakdownDialog.tsx scripts/installment-breakdown-browser.cjs && git commit -m "feat(installments): editable POS schedule dialog"`.

### Task 4: Compact checkout terms and single-source pricing/payment

**Files:**
- Create: `src/components/pos/InstallmentTermsPanel.tsx`
- Modify: `src/components/pos/CheckoutPanel.tsx`
- Modify: `src/hooks/usePosCart.ts` **only if a narrow adapter is required**; do not replace cart logic.
- Test: `tests/installmentCheckoutContract.test.ts`
- Browser: extend `scripts/installment-breakdown-browser.cjs`.

**Interfaces:**
- New optional `CheckoutPanelProps.installment` prop:
  `{mode:'Regular'|'Installment'; onModeChange:(mode:'Regular'|'Installment')=>void; count:number; onCountChange:(count:number)=>void; firstDueDate:string; onFirstDueDateChange:(date:string)=>void; schedule:readonly InstallmentScheduleRow[]; onEditSchedule:()=>void}`.
- `InstallmentTermsPanel` is **read-only on amounts**; it derives `downPaymentPaisa` from existing paid split rows, `remainingPaisa` from the POS total minus paid and `perPayment` from calculated schedule. Sale price editing remains in existing `CartTable`.
- `CheckoutPanel` preserves CustomerPicker, customer information, discount, rounding, inverse Total Payable + Bangla amount in words, split payment rows, Paid/Change/Due, and review button. Collapse optional customer details after saved-party selection under Edit Details, while preserving all values and labels.

- [ ] **Step 1: Add failing checkout contract tests.** Source/behavior checks assert only one invoice-total card; no added installment price Input; payment split reused; regular checkout unchanged; installment down payment equals sum of existing split rows.
- [ ] **Step 2: Run.** `node --experimental-strip-types --test tests/installmentCheckoutContract.test.ts`; expect FAIL.
- [ ] **Step 3: Implement compact terms + optional props** as a narrow extension; avoid independent state for down-payment amount; ensure `Exact` shortcut is not the default when in installment mode.
- [ ] **Step 4: Run unit + browser regression.** `node --experimental-strip-types --test tests/installmentCheckoutContract.test.ts` and `node scripts/pos-reorder-browser.cjs`; expect PASS.
- [ ] **Step 5: Commit.** `git add src/components/pos/InstallmentTermsPanel.tsx src/components/pos/CheckoutPanel.tsx tests/installmentCheckoutContract.test.ts && git commit -m "feat(installments): compact terms within existing POS checkout"`.

### Task 5: POS mode/draft/review integration with exact validation

**Files:**
- Modify: `src/pages/Pos.tsx`
- Modify: `src/data/sales.ts` draft type or `src/types/erp.ts` only if required for optional installment preview draft state; preserve all existing regular/draft flows.
- Create: `src/installments/validateDraft.ts`
- Test: `tests/installmentDraftValidation.test.ts`
- Browser: `scripts/installment-pos-browser.cjs`.

**Interfaces:**
- `validateInstallmentDraft(input:{customerId?:string;customerName:string;phone:string;totalPaisa:number;downPaymentPaisa:number;schedule:readonly InstallmentScheduleRow[]}):string[]` returns actionable, localized-ready errors; a selected existing customer ID or a completed/validated quick-add identity must be established before confirmation (free-text names alone do not create a posted identity).
- POS owns mode and schedule state; changing date/count only regenerates untouched schedule, changing total/paid marks imbalance when rows edited. Review uses the **existing `TransactionReviewDialog`**, showing installment total/down/schedule summary; user may re-open breakdown without losing edited cart.
- Hold/resume/duplicate draft must preserve installment mode and schedule deliberately; exiting POS or cancelling must not silently post anything.

- [ ] **Step 1: Failing tests.** Missing customer, payment splits over final total, unbalanced schedule, same product regular vs installment without preset, manual edit preserved, switching modes does not change product stock/price; restored draft maintains schedule.
- [ ] **Step 2: Run failing unit/browser suites.** `node --experimental-strip-types --test tests/installmentDraftValidation.test.ts`; expect FAIL before implementation.
- [ ] **Step 3: Implement validation and POS orchestration** around current `cart.totals`, `cart.lines`, `cart.payments`, customer data and review callback. Preserve original keyboard Enter → next product and F9 Preview semantics. Do not alter actual Sales ledger events.
- [ ] **Step 4: Run regression.** `node --experimental-strip-types --test tests/installmentDraftValidation.test.ts` and `node scripts/installment-pos-browser.cjs`; expect PASS.
- [ ] **Step 5: Commit.** `git add src/pages/Pos.tsx src/installments/validateDraft.ts tests/installmentDraftValidation.test.ts scripts/installment-pos-browser.cjs && git commit -m "feat(installments): validate and review installment POS previews"`.

### Task 6: Truthful in-memory preview agreement and confirmation record

**Files:**
- Create: `src/installments/model.ts`
- Create: `src/data/installmentPreviewStore.ts`
- Create: `src/components/pos/InstallmentAgreementPreview.tsx`
- Modify: `src/pages/Pos.tsx` minimal import/handoff after existing review confirmation.
- Test: `tests/installmentPreviewStore.test.ts`.

**Interfaces:**
- `type PreviewInstallmentAgreement = {id:string; invoiceReference:string; customerId:string; createdAt:string; totalPaisa:number; downPaymentPaisa:number; schedule:readonly InstallmentScheduleRow[]; lineSnapshot:readonly {key:string;productId:string;amountPaisa:number}[]; paymentSnapshot:readonly {method:string;account:string;amountPaisa:number}[]; operationId:string}`.
- `recordInstallmentPreview(input:Omit<PreviewInstallmentAgreement,'id'|'createdAt'>):PreviewInstallmentAgreement` validates reconciled totals and unique operation ID, freezes snapshots, rejects one invoice linked to two different agreements, and returns the same record on duplicate identical operation requests.
- `listInstallmentPreviews():readonly PreviewInstallmentAgreement[]`, `getInstallmentPreview(id:string):PreviewInstallmentAgreement|undefined`, `resetInstallmentPreviewsForTest():void`.
- Show agreement breakdown in existing sale success/preview surface; `Preview · not posted to actual books` message remains. No customer balance, finance account or stock movement is written, and no new `posted` ledger type is invented.

- [ ] **Step 1: Failing pure store tests.** `3300000 = 300000 + 6×500000`, same op returns same immutable snapshot, new op against same invoice rejects, malformed/overpaid totals reject, normal sale does not create agreement, previews reset in tests.
- [ ] **Step 2: Run suite.** `node --experimental-strip-types --test tests/installmentPreviewStore.test.ts`; expect FAIL.
- [ ] **Step 3: Implement preview store and read-only component**, integrate in POS after existing review callback. Make `Save preview` truthful; suppress any sale/inventory/ledger posting claims. Do not add `Receive Payment` button until later receipt allocation implementation.
- [ ] **Step 4: Run tests and manual preview.** `node --experimental-strip-types --test tests/installmentPreviewStore.test.ts`, `npm run build`; expect PASS.
- [ ] **Step 5: Commit.** `git add src/installments/model.ts src/data/installmentPreviewStore.ts src/components/pos/InstallmentAgreementPreview.tsx src/pages/Pos.tsx tests/installmentPreviewStore.test.ts && git commit -m "feat(installments): preview agreement without fake ledger posting"`.

### Task 7: Desktop/tablet/mobile, themes, keyboard and full acceptance gate

**Files:**
- Extend: `scripts/installment-pos-browser.cjs` and `scripts/installment-breakdown-browser.cjs`
- Modify: `src/index.css` only if an existing POS container query cannot accommodate new terms; avoid one-off `position:fixed` or mobile duplicated cart.
- Test: `tests/installmentUiAcceptance.test.ts` (pure/source contract assertions where appropriate).

**Interfaces:** No new product API; this is a cross-module QA gate confirming the actual UI pixels/control behavior against live `main` POS V2 and Magic Patterns design sources.

- [ ] **Step 1: Add failing acceptance assertions.** At 390, 768, 1024 and 1440px: default one-product sale, `Regular` unchanged; `Installment` editable price in original row only; customer quick-add/clear; six schedules; date picker modal opens/scrolls; update and cancel restore focus; long `৳1,00,000.01` visible; no horizontal cutoff of totals; F2/F8/F9 and Arrow/Enter/Escape safe; light and dark status contrast; Android-like soft-keyboard viewport no hidden footer.
- [ ] **Step 2: Run tests to identify UI gaps.** `node scripts/installment-pos-browser.cjs`; expect initially failed assertions for the unpolished responsive cases.
- [ ] **Step 3: Make minimal targeted adjustments** in existing shared UI components/CSS; retain `[data-pos-layout]` and cart container query breakpoints. Repair test-detected failures without redesign.
- [ ] **Step 4: Run full acceptance.** `npm test && npm run check:ui-contract && npm run lint && npm run build && node scripts/installment-pos-browser.cjs && node scripts/installment-breakdown-browser.cjs && node scripts/pos-reorder-browser.cjs && node scripts/compound-quantity-browser.cjs`; all PASS. If pre-existing failures occur, document exact test name/error and prove no new regression. Capture before/after live screenshots at 1440/768/390 for review; verify customer/amount-in-words in both language modes.
- [ ] **Step 5: Commit.** `git add scripts/installment-pos-browser.cjs scripts/installment-breakdown-browser.cjs src/index.css tests/installmentUiAcceptance.test.ts && git commit -m "test(installments): enforce POS responsive and modal parity"` (stage only files actually changed).

## Whole-branch acceptance and next slices

After Task 7, request whole-branch review against the **approved** design, UI source and regression matrix. Present a preview deployment and screenshots only if CI and deployment genuinely succeed. Open a **draft feature PR** for user review, do not merge it. Describe the limits prominently: **no production invoice/stock/cash/Party posting**; no real installment receipt, collection or overdue reconciliation in this UI-preview slice.

**Later independent plans**, each requiring its own review:
1. Installment agreements + customer collection/Counter/Party allocations and audited schedule revisions (working UI-preview source-linked events, then production design verification).
2. Returns, settlement discounts, reversals, customer advances and full ledger reconciliation.
3. Authenticated multi-tenant backend integration: atomic posting, permissions, idempotency, migrations, API contracts, concurrency and settlement QA.

**Plan stage gate:** This file is for user review. **Do not start product-code implementation or merge PR #155 until the written spec and this plan have been explicitly approved and an execution method selected.**
