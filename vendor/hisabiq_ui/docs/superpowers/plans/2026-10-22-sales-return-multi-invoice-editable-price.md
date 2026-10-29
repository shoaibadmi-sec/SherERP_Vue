# HisabIQ Multi-Invoice Sales Return & Editable Price Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Sales Return workflow with safe walk-in multi-invoice selection, editable historical-net return prices, confirmed customer-credit identity, and separately reported above-historical customer-compensation expense, without corrupting historical refunds or claiming actual backend posting.

**Architecture:** Keep immutable source pricing in `planOrdinaryReturn`; compute an independent negotiated refund quote per source-linked return line. Use a single validated preview command as the authority for a batch return and project read-only compensation into Expenses; the actual multi-tenant backend accounting command is a separate, explicitly gated future production phase. Reuse existing compact controls, Sales Return page, Party identity features, and return memo—no second Sales Return engine.

**Tech Stack:** React 18, TypeScript, Vite 5, shared HisabIQ `Input`, `Button`, `Dialog`, `FormSelect`, Playwright, Node 24 `node --experimental-strip-types --test`; no new UI framework or dependency.

**Spec:** `docs/superpowers/specs/2026-10-22-multi-invoice-sales-returns-and-editable-pricing-design.md` (approved by user 2026-10-22).

## Global Constraints

- Apply every change to the existing `shuvodelux-commits/hisabiq_ui` codebase, with `AGENTS.md`, `docs/ui/transaction-cart-design-contract.md`, and the source audit/ERP KISS contextual-workflow contract as mandatory references.
- Original sale `SaleLine`, `SalesInvoice`, unit conversion snapshots, lot/serial and `planOrdinaryReturn` historical allocation are immutable. `lineReturns[].amount` remains the historic allocation for backward-compatible partial-return arithmetic.
- The actual user-authorized pricing range is any finite, nonnegative return unit price; positive difference above historic is Customer Compensation Expense, negative difference is a return-price adjustment, and positive difference requires reason + final explicit confirmation.
- The compact text **Reset historical net price** is visible only on an overridden item directly beneath the price `Input`; resetting clears override and restores the exact source amount.
- **Always show every multi-unit quantity input**, never a Box/Pcs toggle, a selected-unit segmented control, or a pricing-unit switch. For historical two-unit products reuse the POS `CompoundQuantityInput` joined control; for three or more units reuse `MultiUnitQuantityInput`. The single editable Return price always uses the original invoice's frozen **base/smallest unit** with a visible `/ Pcs`, `/ Gira`, etc. label. The return draft retains the full entered per-unit quantity map and validates equivalent base quantity with historical conversion factors, not current catalog values.
- Matching normalized Bangladeshi phone numbers suggests candidate walk-in invoices, not customer identity. Reusing a customer requires positive user confirmation. No customer created for cash-only returns.
- No monetary floating-point drift at persistence/calculation boundaries (integer paisa), no key collisions for equal `line.id` across invoices, no duplicate credits/compensation and no false source postings.
- Existing bundle returns remain preview-only even when editable unit prices can be quoted; mixed bundle/ordinary batches never partially commit.
- English, Bangla and bilingual copy; Geist/Hind Siliguri, Ink/Teal/Mint, compact tablet/mobile/desktop, numeric stepper, keyboard/mouse wheel and focus rules; never monospaced digits or broad 44px button inflation.
- The connected repository is a **UI preview**, not the production multi-tenant backend. Do not claim atomic financial posting, account balance movements, expense settlement or inventory updates when unavailable.
- Use isolated feature branch/worktree when execution starts; write failing test first, run red, implement minimal code, run green, commit each task; do not merge without user approval.

## File Structure and Responsibility Map

- `src/utils/salesReturn.ts`: **existing** historical ordinary return planner; preserve its quantity, serial, discount and previous-return semantics.
- `src/utils/salesReturnPricing.ts` (**new**): pure, testable source-vs-negotiated per-line quote, integer-paisa settlement and signed difference; negotiated unit price is strictly per frozen base unit, not a user-switchable unit.
- `src/utils/salesReturnIdentity.ts` (**new**): validate/normalize Bangladesh mobile number, invoice candidate discovery and explicit customer identity resolution.
- `src/utils/salesReturnDraft.ts` (**new**): draft keyed by `invoiceId + lineId`, source-frozen Box/Pcs or Carton/Box/Pcs unit-map validation/conversion, identity/due/compensation preflight and exact source-linked return command. Reuse `unitQuantitiesBase` and the immutable `SaleLine.unitSnapshot`, never today's mutable product unit factor.
- `src/types/erp.ts`: backward-compatible `SalesReturn` line audit fields; keep legacy `lineReturns[].amount` untouched.
- `src/data/salesPreviewStore.ts`: one source-linked preview return commit, monotonic `revision` and applied command IDs. Make its return the **one source** for read-only derived expense/credit representations.
- `src/data/partyPreviewStore.ts`, `src/data/erpDemoStore.ts`: display/reuse validated return-linked customer identity in Party workspace, never an unconfirmed phone match. Keep ordinary Party editor unaffected.
- `src/utils/returnCompensation.ts` (**new**): derive read-only compensation expense entries from committed Sales Returns, without creating an extra payout or fictitious unpaid expense.
- `src/components/sales/returns/ReturnPriceField.tsx` (**new**): compact reusable **base-unit** price input/reset with accessible feedback; does not own accounting state. Existing `src/components/transactions/CompoundQuantityInput.tsx` and `MultiUnitQuantityInput.tsx` supply always-visible return quantity fields with a source-frozen adapter; no quantity-mode switch or added price-unit selector.
- `src/components/sales/returns/ReturnInvoicePicker.tsx` (**new**): invoice/phone search, matching invoice suggestions and explicit multi-selection; reuse existing shared form/input components.
- `src/components/sales/returns/ReturnReviewDialog.tsx` (**new**): one final confirmation with source-vs-agreed totals, customer choice and above-historical reason.
- `src/pages/Sales.tsx`: integrate return draft/pricing/lookup/review and preserve other existing Sales tabs and actions; do not wholesale redesign.
- `src/pages/Expenses.tsx`: read-only compensation row and source link in Expenses/reporting, distinctly marked as included in its return settlement (not an ordinary independently payable expense).
- `src/utils/salesDocuments.ts`: source-linked return memo with line-level adjustments and expense reference.
- `tests/*.test.ts`, `scripts/*-browser.cjs`: targeted TDD and desktop/tablet/mobile smoke; update old browser assertions that expect a disabled return-price field or one-click no-confirm posting.
- `docs/superpowers/plans/...`: this approved-task execution log; production backend contract is a separate future deliverable, not a pretend API endpoint.

## Review Focus

1. **Same phone but different people** — matching invoice/customer selection cannot silently combine records or redirect someone else's credit. Add candidate ambiguity tests in Task 3 and browser confirmation in Task 8.
2. **Last paisa of partial multi-unit returns** — Box/Pcs and Carton/Box/Pcs must convert using the original invoice's frozen factors; historical allocations reconcile exactly across fractional quantities, prior returns and resets, while edited prices never consume original source cap. Add exact-paisa tests in Tasks 1–2 and source unit-chain/conversion tests in Task 4.
3. **Duplicate invoice line IDs** — each invoice/line pair has distinct quantity, serials and override state. Add collision test in Task 4 and cross-invoice browser test in Task 8.
4. **Rapid double-submit or stale preview snapshot** — second attempt creates neither more credit nor compensation, and changed remaining quantities fail before any write. Add transaction idempotency/revision tests in Task 6.
5. **Expense incorrectly appearing as a second cash payment or unpaid bill** — positive difference recognized once, including Customer Credit settlement; negative difference never compensation. Add projection and Expenses UI tests in Task 7.

---

### Task 1: Preserve historical-return allocation and add source-linked audit fields

**Files:**
- Modify: `src/types/erp.ts:291-306`
- Test: `tests/salesReturn.test.ts`

**Interfaces:**
- Consumes: existing `planOrdinaryReturn(invoice,line,rawQuantity,serials,returns)`.
- Produces: `SalesReturn.lineReturns?: Array<{invoiceId:string;lineId:string;quantity:number;unitQuantities?:Record<string,string>;sourceBaseUnit?:string;amount:number;serials:string[];historicalSourceAmountPaisa?:number;agreedReturnAmountPaisa?:number;priceDifferencePaisa?:number;effectiveUnitPrice?:number;priceWasOverridden?:boolean;adjustmentReason?:string}>`; `SalesReturn.compensationExpensePaisa?`, `SalesReturn.negativeAdjustmentPaisa?`, `SalesReturn.confirmationId?`, `SalesReturn.phoneSnapshot?`. Keep optional fields to read legacy returns.

- [ ] **Step 1: Write failing test.** In `tests/salesReturn.test.ts`, type a previous partial return whose `lineReturns[0].amount` is the historical ৳100 and agreed amount is ৳120; assert a subsequent `planOrdinaryReturn` consumes exactly ৳100. Include discounted source, final-paisa allocation and previous serial exclusion.
- [ ] **Step 2: Run red.** `node --experimental-strip-types --test tests/salesReturn.test.ts`; the new typed fixture/assertions must demonstrate the old type lacks the proposed audit fields (also run `npx tsc --noEmit` to confirm type failure).
- [ ] **Step 3: Add optional audit fields** in `src/types/erp.ts`. Do **not** change the arithmetic or re-purpose `lineReturns.amount` in `src/utils/salesReturn.ts`. Document historic vs agreed fields inline.
- [ ] **Step 4: Run green.** `node --experimental-strip-types --test tests/salesReturn.test.ts && npx tsc --noEmit`; expected PASS.
- [ ] **Step 5: Commit.** `git add src/types/erp.ts tests/salesReturn.test.ts && git commit -m "feat(sales-return): preserve source amounts beside negotiated audit values"`.

### Task 2: Independent editable-price quotation and reset semantics

**Files:**
- Create: `src/utils/salesReturnPricing.ts`
- Create: `tests/salesReturnPricing.test.ts`

**Interfaces:**
- Consumes: `planOrdinaryReturn` output `{amount:number;unitPrice:number|null;quantity:number;issues:string[]}`; a raw optional override string (undefined means untouched/reset).
- Produces: `quoteReturnPrice(plan:{amount:number;unitPrice:number|null;quantity:number;issues:readonly string[]}, rawPrice?:string):ReturnPriceQuote` where `ReturnPriceQuote={historicalSourceAmountPaisa:number;agreedReturnAmountPaisa:number;priceDifferencePaisa:number;compensationExpensePaisa:number;negativeAdjustmentPaisa:number;effectiveUnitPrice:number|null;overridden:boolean;issues:string[]}`.
- An explicit `undefined` override is **not** the same as a typed zero. A reset sets draft override to undefined, not the rounded display number.

- [ ] **Step 1: Write failing tests.** `tests/salesReturnPricing.test.ts`: source ৳200 at 2 pieces, untouched returns 20000 paisa; override `120` **per Pcs** yields agreed 24000/compensation 4000; override `90` per Pcs yields agreed 18000/negative -2000; override `0` yields zero without expense; reset `undefined` restores exact historical amount; fractional base qty and six-decimal display do not introduce a paisa drift. Assert blank/NaN/Infinity/negative/unsupported precision errors and source issues fail closed.
- [ ] **Step 2: Run red.** `node --experimental-strip-types --test tests/salesReturnPricing.test.ts`; missing module/function.
- [ ] **Step 3: Implement the pure quote.** Reject nonfinite/nondecimal/negative input; calculate line settlement in integer paisa using base-unit quantity, with deterministic rounding and safe-integer bounds. Do **not** read current product prices, and do not support a separate switchable Box/Pcs return-price unit; source `plan.amount` is authoritative. Compare effective base-unit price against historical net base-unit price for conditional reset but derive monetary difference from exact historic amount. Return positive/negative differences distinctly.
- [ ] **Step 4: Run green.** `node --experimental-strip-types --test tests/salesReturnPricing.test.ts tests/salesReturn.test.ts && npx tsc --noEmit`.
- [ ] **Step 5: Commit.** `git add src/utils/salesReturnPricing.ts tests/salesReturnPricing.test.ts && git commit -m "feat(sales-return): quote editable net prices without changing source allocations"`.

### Task 3: Phone-based invoice discovery and explicit customer identity

**Files:**
- Create: `src/utils/salesReturnIdentity.ts`
- Create: `tests/salesReturnIdentity.test.ts`
- Read: `src/data/partyPreviewStore.ts` and `src/utils/partyIdentity.ts` before implementation.

**Interfaces:**
- Produces: `normalizeBdMobile(raw:string):string|null` (canonical 11-digit local number); `suggestReturnInvoices(selected:SalesInvoice, invoices:readonly SalesInvoice[]):SalesInvoice[]` (only eligible same-phone walk-in candidates); `findReturnCustomerCandidates(phone:string,parties:readonly Party[]):Party[]` (never silently choose); `export type ReturnCustomerChoice={kind:'existing';customerId:string}|{kind:'create';name:string;phone:string}|{kind:'none'}`; `validateReturnCustomerChoice(selected:readonly SalesInvoice[],choice:ReturnCustomerChoice,parties:readonly Party[],requiresCredit:boolean):string[]` (errors).
- Phone normalization accepts valid `01...` and `+8801...` variants with legitimate spacing/dashes; rejects missing/short/truncated, placeholder or ambiguous phone numbers.

- [ ] **Step 1: Write failing tests.** Equivalent `01712345678` and `+8801712345678`; invalid `12345`, `017000`, blank; three walk-in invoices sharing normalized phone but different names; registered customer invoice not silently grouped; two separate Parties sharing one phone yield **two unselected candidates**, inactive Party unavailable, conflicting partyIds reject; cash-only choice `none` valid; credit `none` invalid.
- [ ] **Step 2: Run red.** `node --experimental-strip-types --test tests/salesReturnIdentity.test.ts` => FAIL missing module.
- [ ] **Step 3: Implement identity-only pure functions.** Preserve raw original invoice name/phone and original partyIds. Avoid fuzzy name matches as identity keys and do not auto-create from phone alone.
- [ ] **Step 4: Run green.** `node --experimental-strip-types --test tests/salesReturnIdentity.test.ts && npx tsc --noEmit`.
- [ ] **Step 5: Commit.** `git add src/utils/salesReturnIdentity.ts tests/salesReturnIdentity.test.ts && git commit -m "feat(sales-return): safely discover walk-in invoices and identity candidates"`.

### Task 4: Keyed multi-invoice draft and preflight amount allocation

**Files:**
- Create: `src/utils/salesReturnDraft.ts`
- Create: `tests/salesReturnDraft.test.ts`
- Modify: `src/types/erp.ts` only if a shared contract is needed.

**Interfaces:**
- Produces: `returnLineKey(invoiceId:string,lineId:string):string` (collision-safe encoded pair); `ReturnLineInput={invoiceId:string;lineId:string;quantity?:string;unitQuantities?:Record<string,string>;serials:string[];reason:string;rawReturnUnitPrice?:string;aboveHistoricalReason?:string}` (`unitQuantities` required for source-proven multi-unit lines, `quantity` for single-unit only); `returnBaseQuantity(line:SaleLine,input:ReturnLineInput):{quantity:number;issues:string[]}` (converts exact frozen `line.unitSnapshot` factors via existing `unitQuantitiesBase`, validates unit keys, ranges and availability, and fails closed when historic conversion evidence is missing); and `buildReturnPreview(input:{invoiceIds:readonly string[];lines:readonly ReturnLineInput[];invoices:readonly SalesInvoice[];returns:readonly SalesReturn[];settlement:SalesReturn['settlement']}):{lines:ReturnQuotedLine[];historicalPaisa:number;agreedPaisa:number;compensationPaisa:number;negativeAdjustmentPaisa:number;selectedDuePaisa:number;issues:string[]}`.
- `ReturnQuotedLine` contains invoiceId,lineId,validated **base quantity**, the complete selected **unitQuantities** map, returned serials, historical amount, agreed amount, signed delta and audit reason; use Task 1 types and Task 2 quote. Original source `line.unitSnapshot` is immutable even if the product's current unit relations differ.

- [ ] **Step 1: Write failing tests.** Two invoices both have `line.id='same'` and different negotiated prices, both retained; selected + unselected quantities not conflated; **1 Box + 5 Pcs = 17 Pcs** for historical `1 Box=12 Pcs`; **1 Carton + 2 Box + 6 Pcs** converts using three frozen factors; changing current product factors does not affect results; prior partial return reduces remaining **base** quantity correctly; unknown unit/missing historic conversion data fails closed; over-return/used serial/different invoice source rejected; selected invoices with zero quantity do not appear as returned sources; due total from **only** selected invoices; positive override without a nonblank reason rejected; two-line signed deltas reconcile exactly to aggregate return total.
- [ ] **Step 2: Run red.** `node --experimental-strip-types --test tests/salesReturnDraft.test.ts` => FAIL.
- [ ] **Step 3: Implement minimal draft preflight**, recomputing historical plans from source snapshots before every confirmation. Convert multi-unit input map to base quantity using immutable `line.unitSnapshot` and existing `unitQuantitiesBase` after verifying factor chains and each input. Reject unverifiable legacy conversions instead of using current catalog relationships. Preserve the user-entered Box/Pcs or Carton/Box/Pcs map separately from base quantity, retain compensation positive and price reduction negative as different totals. Skip zero-selected lines; validate all chosen line/source pairs.
- [ ] **Step 4: Run green.** `node --experimental-strip-types --test tests/salesReturnDraft.test.ts tests/salesReturnPricing.test.ts tests/salesReturn.test.ts && npx tsc --noEmit`.
- [ ] **Step 5: Commit.** `git add src/utils/salesReturnDraft.ts tests/salesReturnDraft.test.ts && git commit -m "feat(sales-return): preflight source-keyed batch returns"`.

### Task 5: Compact return-price field with conditional reset

**Files:**
- Create: `src/components/sales/returns/ReturnPriceField.tsx`
- Modify: `src/pages/Sales.tsx:1350-1460` (existing return item row only)
- Create: `scripts/sales-return-price-browser.cjs`
- Modify: `scripts/sales-audit-regression-browser.cjs` (replace old disabled-rate assertion).

**Interfaces:**
- `ReturnPriceField({invoiceId,lineId,productName,historicalUnitPrice,quotedAmountPaisa,rawOverride,onOverride,onReset,language}: ReturnPriceFieldProps)`.
- Render existing `Input` with an explicit **Return price / [frozen base unit]** label, compact `h-8` row and accessible text-only `button type="button"` for conditional **Reset historical net price** (Bangla translation). No dedicated 44px reset action, no switch button/dropdown for selecting a return-price unit, and **no** toggle to hide or replace the multiple quantity fields.
- The parent indexes `returnUnitQty` (all unit inputs, `Record<string,string>`), optional single-unit `returnQty`, `returnSerials`, `returnReason`, `returnPrice` by `returnLineKey(invoice.id,line.id)`; reset and new selection clear only affected draft values per explicit selection policy. Reuse actual POS `CompoundQuantityInput` for two source-frozen levels and `MultiUnitQuantityInput` for three or more levels **without toggles**; a validated frozen-source adapter must provide these controls their display-unit profile rather than mutable product data.

- [ ] **Step 1: Write failing browser test.** At 390, 768, 1440: a two-unit item displays Box **and** Pcs joined fields simultaneously (no quantity switch), a three-unit item displays Carton **and** Box **and** Pcs simultaneously, single-unit item displays one input, no return-price-unit selector exists, and computed base quantity matches frozen invoice factors. Price input enabled with `/ Pcs` label, untouched reset absent, manual 120 shows exactly one reset, reset restores historic and hides link, keyboard tab/Enter works, price remains editable after quantity change, no horizontal overflow. Update previous `assert.ok(await rate.isDisabled())` in `scripts/sales-audit-regression-browser.cjs` to verify editable price and reset instead.
- [ ] **Step 2: Run red.** `node scripts/sales-return-price-browser.cjs` => FAIL (price disabled), with Chromium installed.
- [ ] **Step 3: Implement focused field/integration.** Always show every applicable multi-unit quantity input from the immutable historic profile using existing shared POS controls, not a new clone; when valid historical factors are unavailable, leave unit labels visible where provable, explain missing source history and block the unsafe return instead of inventing ratios. Display precise historical net **base-unit** price and preserve original actual allocation when untouched. Use `ReturnPriceField` for ordinary lines and read-only bundle preview with separate quoted override from Task 2 where source estimate is available. Do not remove bundle posting lock.
- [ ] **Step 4: Run green.** `node scripts/sales-return-price-browser.cjs && node --experimental-strip-types --test tests/salesReturn*.test.ts && npx tsc --noEmit`.
- [ ] **Step 5: Commit.** `git add src/components/sales/returns/ReturnPriceField.tsx src/pages/Sales.tsx scripts/sales-return-price-browser.cjs scripts/sales-audit-regression-browser.cjs && git commit -m "feat(sales-return): compact editable price and conditional historical reset"`.

### Task 6: Single source-linked preview command, revisions and idempotency

**Files:**
- Modify: `src/data/salesPreviewStore.ts`
- Create: `src/data/salesReturnPreviewCommit.ts`
- Create: `tests/salesReturnPreviewCommit.test.ts`
- Modify: `src/pages/Sales.tsx:935-1020` (replace independent return/credit/invoice mutators).

**Interfaces:**
- `commitSalesReturnPreview(command:ValidatedReturnCommand):SalesReturn`, where `ValidatedReturnCommand={commandId:string;expectedRevision:number;invoiceIds:string[];lines:ReturnLineInput[];settlement:'Adjust due'|'Customer credit'|'Cash refund';customerChoice:ReturnCustomerChoice;refundMethod?:PaymentMethod;refundAccountId?:string;confirmationActor:string;confirmationAt:string;confirmationReason?:string}`.
- The store exposes a single consistent `getSalesPreviewSnapshot()` with a monotonic `revision`, `appliedReturnCommandIds`, and returns, invoices and credits. Expense rows derive from return source events (Task 7), not another independently mutated balance. Customer identity commands resolved before commit and referenced by stable ID; see Task 8 for Party projection.
- Publish one new Sales snapshot and notify listeners **once** per accepted command. Re-run Tasks 3–4 validation using current snapshot/expected revision; reject stale or duplicate command before writing. Store original `lineReturns.amount` historical figure plus optional agreement audit fields. No real backend/cash/stock mutations.

- [ ] **Step 1: Write failing store tests.** One input yields one return, one credit, one expense source, one notification; repeat command id produces no changes; stale expectedRevision rejects; conflicting invoice line quantity fails without changing any record; cross-invoice adjusted totals and due excess credit reconcile; cash-only return creates no Party.
- [ ] **Step 2: Run red.** `node --experimental-strip-types --test tests/salesReturnPreviewCommit.test.ts` => FAIL.
- [ ] **Step 3: Implement preview command** with deterministic source IDs/recording, snapshot-level validation and single update. Do not use several independent `setReturns/setCredits/setInvoices` calls; guard `getSalesPreviewSnapshot` freshness; `Customer credit` is a liability, not duplicate revenue/expense.
- [ ] **Step 4: Run green.** `node --experimental-strip-types --test tests/salesReturnPreviewCommit.test.ts tests/salesReturnDraft.test.ts tests/salesReturn.test.ts && npx tsc --noEmit`.
- [ ] **Step 5: Commit.** `git add src/data/salesPreviewStore.ts src/data/salesReturnPreviewCommit.ts src/pages/Sales.tsx tests/salesReturnPreviewCommit.test.ts && git commit -m "feat(sales-return): idempotent coherent preview return posting"`.

### Task 7: Read-only customer-compensation expense projection

**Files:**
- Create: `src/utils/returnCompensation.ts`
- Create: `tests/returnCompensation.test.ts`
- Modify: `src/pages/Expenses.tsx:80-150,193-285`
- Modify: `src/utils/salesDocuments.ts`

**Interfaces:**
- `deriveReturnCompensation(returns:readonly SalesReturn[]):ReturnCompensationRecord[]` where record `{id:string;sourceReturnId:string;invoiceRefs:string[];customerId?:string;customerName:string;expenseAmountPaisa:number;category:'Customer Compensation';createdAt:string}`.
- Source link: expense row opens the read-only return record or deep-links to `/app/sales?tab=returns` for its return ID; never opens the ordinary edit/cancel expense dialog.
- `Expenses` reports and summary count compensation **once**, with a visibly distinct `Included in return settlement` accounting treatment; do not represent it as independently unpaid `Expense.paid=0`, and do not create an extra `FinanceTransaction`/cash deduction.

- [ ] **Step 1: Write failing tests.** Historical 200 + agreed 240 -> one compensation expense of 40; historical 200 + agreed 180 -> none; two adjusted lines in one return -> one aggregated source-linked expense of sum of positive differences; cash vs Customer Credit produces equal one-time expense recognition; existing normal `Expenses` sum unchanged except source-derived compensation; no duplicate payout/credit.
- [ ] **Step 2: Run red.** `node --experimental-strip-types --test tests/returnCompensation.test.ts` => FAIL.
- [ ] **Step 3: Implement projection and UI.** Derive from committed source-linked Sales returns, subscribe to Sales snapshot on Expenses page, show readonly compensation in list/export/period reports with source link. Update `returnDocument` to include original/negotiated/expense and source references. Preserve editable ordinary Expenses untouched; don't synthesize a finance account movement.
- [ ] **Step 4: Run green.** `node --experimental-strip-types --test tests/returnCompensation.test.ts tests/salesDocuments.test.ts && npx tsc --noEmit`.
- [ ] **Step 5: Commit.** `git add src/utils/returnCompensation.ts src/pages/Expenses.tsx src/utils/salesDocuments.ts tests/returnCompensation.test.ts && git commit -m "feat(sales-return): report linked compensation expense without double payment"`.

### Task 8: Invoice search, customer confirmation and one final review dialog

**Files:**
- Create: `src/components/sales/returns/ReturnInvoicePicker.tsx`
- Create: `src/components/sales/returns/ReturnReviewDialog.tsx`
- Modify: `src/pages/Sales.tsx:720-820,1280-1348,1465-1535`
- Modify: `src/data/partyPreviewStore.ts`, `src/data/erpDemoStore.ts` only if needed to expose confirmed return-linked created customers to the existing Party directory.
- Create: `scripts/sales-return-multi-invoice-browser.cjs`
- Modify: `scripts/bangla-sales-browser.cjs`

**Interfaces:**
- `ReturnInvoicePicker({invoices,selectedIds,onChange,onChooseSource,searchValue,onSearchChange,language}:Props)` uses Tasks 3–4 for matches and identity; explicit selection only.
- `ReturnReviewDialog({open,quote,customerCandidates,customerChoice,onCustomerChoice,onConfirm,onClose,language}:Props)` takes Task 4 preflight totals and Task 6 commit-command creation. Capture confirmed existing customer ID or validated new-customer draft; above-original reason (per affected line, or a clearly attributed shared reason) required before confirmation.
- The only final posting entrypoint is `commitSalesReturnPreview` after **explicit confirmation**. A same-phone candidate is never automatically chosen.

- [ ] **Step 1: Write failing browser tests.** Across 390/768/1440 and three languages: open walk-in INV-A; same normalized phone suggests INV-B and INV-C with different name; select A+C, not B; show separate products/totals even if line IDs identical; customer matching dialog requires selecting a known profile when Customer Credit; create Customer from reviewed walk-in name/phone only if not linked, no duplicate; changing to Cash refund allows no party; reason/confirmation required when positive adjustment; original sale stays intact.
- [ ] **Step 2: Run red.** `node scripts/sales-return-multi-invoice-browser.cjs` => FAIL against old exact-name picker and missing review.
- [ ] **Step 3: Implement components and integration.** Reuse Sales tab, shared `Input`/`Button`/`Dialog` and Party editor logic. For a new customer, create an immutable, reviewed Party draft tied to the confirmed preview return command ID; expose the committed customer to the existing Party directory by a source-linked projection or supported Party preview command only **after** validation, without silent phone auto-linking. If a cross-store write cannot be made coherent, fail without a success toast and explicitly mark the preview limitation; do not claim browser state is a production database transaction. Block inconsistent ID assignment.
- [ ] **Step 4: Run green.** `node scripts/sales-return-multi-invoice-browser.cjs && node scripts/bangla-sales-browser.cjs && npx tsc --noEmit`. Update legacy expected direct return posting to one Review -> Confirm path (do not skip auditing).
- [ ] **Step 5: Commit.** `git add src/components/sales/returns/ReturnInvoicePicker.tsx src/components/sales/returns/ReturnReviewDialog.tsx src/pages/Sales.tsx src/data/partyPreviewStore.ts src/data/erpDemoStore.ts scripts/sales-return-multi-invoice-browser.cjs scripts/bangla-sales-browser.cjs && git commit -m "feat(sales-return): review multi-invoice walk-in returns and customer identity"`.

### Task 9: Bundle preview quote, print source links, and full regression gate

**Files:**
- Modify: `src/pages/Sales.tsx:1535-1565,1790-1810`
- Modify: `src/utils/salesDocuments.ts`
- Modify: `scripts/bundle-return-browser.cjs`
- Modify: `scripts/sales-audit-regression-browser.cjs`
- Modify: `scripts/bangla-sales-browser.cjs`
- Test: `tests/bundleReturn.test.ts`, `tests/salesDocuments.test.ts`, `tests/salesReturn.test.ts`.

**Interfaces:**
- Bundle `planBundleReturn` stays read-only/previewOnly and historic quote source; UI may show an editable proposed parent Set return unit price and a Reset link without permitting a return commit.
- The completed return memo/print/export uses Task 1 source-linked line amounts, Task 7 expense reference and original invoice refs; no invented stock posting.

- [ ] **Step 1: Write failing regressions.** Bundle price edited + reset stays preview-only; ordinary two-level Box/Pcs and three-level Carton/Box/Pcs return inputs are **always visible without unit-selection buttons**; remaining source quantity is validated in base units, print memo retains compound quantity, and a later partial return cannot exceed the original sold base amount. Mixed ordinary/bundle shows clear no-partial-commit note; return memo includes source invoice/line, historical/agreed amount, compensation reason/expense ID, and optional raw walk-in contact; all previous quantity/serial checks remain effective. Browser regression no longer asserts return price is disabled or that Complete instantly posts without confirmation.
- [ ] **Step 2: Run red.** `node --experimental-strip-types --test tests/bundleReturn.test.ts tests/salesDocuments.test.ts && node scripts/bundle-return-browser.cjs`; identify old behavior mismatch.
- [ ] **Step 3: Implement only missing preview/memo compatibility.** Keep `planBundleReturn` historical recipe, serial and lot validations unchanged; do not add unauthorized inventory accounting.
- [ ] **Step 4: Run full green.** `npx tsc --noEmit && npm run lint && npm run check:ui-contract && npm test && npm run build && npm run test:bangla-sales && npm run test:sales-audit && node scripts/bundle-return-browser.cjs && node scripts/sales-return-price-browser.cjs && node scripts/sales-return-multi-invoice-browser.cjs`. Include focused light/dark 320/390/768/1024/1440 keyboard/touch/scroll/contrast check and confirm no secondary 44px reset buttons. Update CI targeted workflow to run new scripts for changes to Sales/returns.
- [ ] **Step 5: Commit.** `git add src/pages/Sales.tsx src/utils/salesDocuments.ts scripts/bundle-return-browser.cjs scripts/sales-audit-regression-browser.cjs scripts/bangla-sales-browser.cjs tests/bundleReturn.test.ts tests/salesDocuments.test.ts && git commit -m "test(sales-return): verify pricing, multi-invoice, bundles and print regressions"`.

## Production Backend Handoff (Separate Later Plan; Not Current UI Repo Completion)

The approved spec also describes real tenant-scoped transactional Sales Return posting with authenticated actor, inventory/lot/serial impacts, cash/bank settlement, liability and expense journal lines and rollback/idempotency. The examined repository currently has **no server-side transactional Sales Return endpoint** and its Sales, Party and Expense previews are separate memory stores. Therefore the executable tasks above produce a robust **UI-preview source model** and audited projection, *not* real bank/stock/backend posting. Do not create a mock API labeled production. When the actual Cloudflare Worker/PostgreSQL backend return command, database schema and permissions are available, write a separate Superpowers backend design/implementation plan using a single database transaction with tenant scoping, source revision checks, duplicate idempotency key, ledger entry balancing and reconciliation tests.

## Execution and Review Gates

- Before development: user approves this plan and selects **Subagent-driven** or **Native** execution. Execution worktree/branch is separate from this documentation PR and must start from an approved base containing spec and plan.
- Implement Tasks 1–9 in dependency order, committing after each green task; request code review on the completed diff, prioritize source/identity/accounting tests, and run CI.
- Present a reviewable PR. **Do not merge** until explicit user approval.
- Any failed test or unmet source/cash/expense reconciliation remains a blocker; do not claim that a preview is real posting.
