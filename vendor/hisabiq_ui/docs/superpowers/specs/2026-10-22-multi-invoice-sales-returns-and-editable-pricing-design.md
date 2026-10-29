# HisabIQ Sales Returns — Multi-Invoice Walk-in Returns and Editable Prices

**Date:** 2026-10-22  
**Status:** Written Superpowers design for user review; no application implementation approved by this document  
**Repository:** shuvodelux-commits/hisabiq_ui  
**Principle:** KISS. Extend the existing Sales Return experience; do not redesign POS, Sales lists, Parties, Finance, or stock workflows.

## 1. Goal and approved decisions

A shopkeeper can find a sold item, choose its remaining returnable quantity, negotiate **any nonnegative return unit price**, and complete a return without overwriting the original sale. Walk-in customers may appear on multiple invoices with the same phone number; the shopkeeper can select those invoices together. When a return creates customer credit, the shopkeeper confirms the customer identity, reuses the selected existing customer or creates one from the walk-in details, and keeps source-linked credit and ledger history.

Decisions explicitly approved during discussion:

1. **Every Sales Return** has editable return-item unit prices, including registered customer, walk-in, partial, multi-invoice and bundle-preview items.
2. Default return unit price is the **historical net unit price** from the original invoice/discount allocation; posted original prices never change.
3. If the edited price differs from that historical price, a small text link immediately under its numeric input reads **Reset historical net price**. It disappears after reset or restoring the same effective value. Use existing numeric input stepper conventions; no extra full-size reset button.
4. Fully editable price, including above-original, is allowed. Above-original amounts require an override reason and a distinct confirmation explaining the additional expense.
5. **Positive price difference** above historical value is **Customer Compensation Expense (ক্রেতাকে অতিরিক্ত ফেরত)**, traceable to the return, invoice, customer and affected line. Never book the compensation twice as a separate cash payout.
6. **Negative price difference** is a distinct return-price adjustment reducing the net Sales Return amount; never classify it as compensation expense.
7. Walk-in invoices with the same normalized phone may be suggested and multi-selected. Same phone does **not** automatically prove same person.
8. For **Customer Credit**, always confirm the existing customer candidate before linking. If none is confirmed, let the shopkeeper create a customer from the walk-in invoice name/number after reviewing the details. No automatic customer creation for cash-only return.
9. Preserve compact English/Bangla/helper UI, original invoice links, prior-return quantity/serial checks, and current bundle posting safeguards.
10. **Multi-unit-enabled products always display their complete return-quantity inputs** (Box + Pcs; Carton + Box + Pcs; Gauge + Gira), using the corresponding joined POS input patterns. Never show a button, tab, segmented control, or dropdown that switches quantity input between units. Every applicable unit entry stays visible without extra taps. One editable **Return price / [historical base unit]** field remains beside/below those inputs; no separate return-price unit selector.

## 2. Existing code and implementation constraints

- Sales Return interaction and in-session preview mutations currently live in src/pages/Sales.tsx (Return and Returns tabs; selectedReturnInvoices, selectedReturnLines, returnQty, returnSettlement, completeReturn).
- Ordinary historical return planner is src/utils/salesReturn.ts: planOrdinaryReturn calculates source-derived quantity, unit price and historical refund allocation; its previous-refund arithmetic consumes lineReturns[].amount.
- Data types are SalesInvoice, SaleLine, SalesReturn and CustomerCredit in src/types/erp.ts. An immutable sale line can have source lot, serial, netSaleTotal, unitSnapshot and bundleSnapshot data.
- Sales data is a browser-session design preview in src/data/salesPreviewStore.ts. Parties in src/data/partyPreviewStore.ts and Finance in src/data/financePreviewStore.ts use separate in-memory stores. The present Sales completion changes Sales preview arrays but **does not** constitute transactional backend accounting, bank, inventory or Party ledger posting.
- Existing Party preview quick add uses name plus phone to detect exact candidates; neither normalized phone nor same-name lookup alone is authoritative for identity.
- The current return-price Input in Sales.tsx is disabled, and invoice choices are filtered by exact party name. Do not build a second separate Sales Return screen.
- Preserve vendor and installment return boundaries where applicable. Authentication-derived tenant_id is required on future production records. Do not claim a transactional production implementation until such a backend exists.

## 3. User flow and responsive presentation

**Entry:** Sales History invoice action -> Return; Sales Return tab manual search; return memo review.

**Discover:** Search by invoice reference, customer name, and normalized phone. Display matching invoices with invoice number, purchase date, stored customer name, phone, amount, paid/due, and returnable state. Selecting one invoice behaves as it does today. On a walk-in invoice with a valid phone, show a compact inline affordance such as "3 invoices found for this phone — Select more". Do not automatically select or merge. Normalized Bangladesh mobile numbers (for example 01712345678 and +8801712345678) compare equal only when the input is a valid, identifiable mobile phone; preserve raw original values in documents. Do not group missing, malformed, shared placeholder or short phones; never group by name alone.

**Choose:** Invoice checkboxes permit multiple independently validated source invoices. Confirm that any selected invoices belong to the intended customer before return submission. Different spelling of names with same mobile is shown, not silently rewritten. The line selection includes invoice number, product, original sold quantity/unit, remaining returnable quantity, entered return quantity, return unit price, line total, reason and serial details when necessary.

**Multi-unit return quantity:** For a line with source-proven multi-unit configuration, present **all** unit inputs at once, prefilled with 0/blank. For two units reuse the joined `CompoundQuantityInput`; for three or more units reuse `MultiUnitQuantityInput` with its compact stacked fields. Use a frozen-invoice-profile adapter, not mutable current-product unit settings: calculate `returnedBaseQuantity = sum(enteredUnitQuantity × frozenFactor[unit])`, validate source quantities/serials in the base unit, and display remaining stock both in human-readable compound form and exact base-unit amount where helpful. Excess smaller-unit quantities may normalize to larger units for display, but only after the user commits an input; never silently change the refund quantity. The original historical invoice profile is authoritative. Where legacy source invoices lack safe frozen unit relationships, show an explicit source-data warning, keep visible multi-unit fields when source unit labels are known, disable posting for unverifiable conversions and never guess the factor from today's product catalog. Single-unit products keep one input. **There is no switch/toggle for quantity mode or price unit**; return pricing is always entered per frozen smallest/base unit (e.g., `Return price / Pcs`), with no separate Box/Pcs pricing selector.

**Edit price:** Reuse HisabIQ compact focus/wheel/keyboard numeric stepper. Default effective return price displays the historic net unit value with appropriate precision (compound units may need up to six decimal places); money is settled and stored to integer paisa. Show "Reset historical net price" **only when** the effective override differs, as tiny link-style text directly below the field, not another tall button. Clicking it reverts the effective value and recomputed total immediately; once reset, use the exact source historical allocation rather than a rounded display value. Keep native accessible button semantics, keyboard focus and Bangla helper where shown. When quantity changes, recompute the exact historical proportional allocation and adjustment without changing the selected negotiated unit price unless Reset is clicked.

**Settle:** Preserve existing Adjust due, Customer credit and Cash refund options. Before final confirmation for Customer Credit, show matched existing customer identities and require the shopkeeper to select/confirm the correct one; otherwise explicitly choose Create Customer with editable prefilled name and phone. Identical phone alone is not an auto-link. Cash refund without account credit requires no customer creation. Mixed invoices and pre-existing customer IDs must reconcile to one selected identity; if conflicting, stop and request correction rather than crediting the wrong party.

**Confirm:** Show selected invoice references, historical return value, signed price adjustments, compensation expense, final return total, method/account or Customer Credit target, and any required override reason. The simple unchanged-price case remains a single compact confirmation without extra forms. Posting is a separate explicit confirmation; do not double-submit.

**Review:** Return memo and source-link drilldown show each original item, historical unit/reference amount, negotiated unit/line refund, signed difference, reason, account and corresponding source invoice, with a single return reference for a batch. Existing Sales and Party ledger navigation remains intact.

## 4. Pricing arithmetic and accounting rules

Use **integer paisa** for every money boundary; use exact valid nonnegative numeric inputs for quantities and negotiated prices. Each ordinary return line obtains historicalSourceAmountPaisa from planOrdinaryReturn (including invoice discounts, rounding, prior returns and compound units). Keep its historical amount **separate** from the agreed return amount.

For a manually edited unit price:

- agreedReturnAmountPaisa = currency-rounded(negotiatedBaseUnitPrice * validatedReturnBaseQuantity). The price input always specifies the **frozen historical base unit** (e.g. Pcs) with a clear `/ Pcs` label, regardless of how many Box/Carton/Pcs quantity fields are shown. The sum of entered compound quantities is converted to base units using **frozen invoice conversion factors**, never today's product catalog prices or factors.
- priceDifferencePaisa = agreedReturnAmountPaisa − historicalSourceAmountPaisa.
- positiveDifferencePaisa = max(priceDifferencePaisa, 0); negativeDifferencePaisa = min(priceDifferencePaisa, 0).
- When the price was not overridden or was reset, agreedReturnAmountPaisa = historicalSourceAmountPaisa **exactly**, avoiding fractions/rounding drift.
- Return totals are sums of rounded per-line paisa. No negative refund or NaN, infinity, blank or invalid over-precision. Zero-valued agreed return lines can be valid if quantity is positive and confirmation clearly explains the zero refund; zero return quantities are not return events.
- The price override **never increases eligible return quantity** or allows reuse of already returned serials. Historical net revenue cap calculations continue consuming historicalSourceAmountPaisa rather than agreedReturnAmountPaisa.

**Example: original net return value ৳200; shopkeeper sets final refund ৳240.** Normal Sales Return = ৳200, Customer Compensation Expense = ৳40, customer receives a single cash refund or credit of ৳240. Expense recognition must not create another independent cash debit. If agreed total is ৳180, normal sales reversal is ৳200 plus a separate -৳20 return-price adjustment (net reversal ৳180), not a compensation expense.

Proposed production journal treatment, subject to the application's approved chart of accounts: reverse sales (and separately tax/cost/stock where appropriate) according to source allocation; debit compensation expense only for positive override difference; reduce the sale-return adjustment for negative differences; credit the **one** refund/credit liability or reduce receivables according to the chosen settlement. A Customer Credit balance is a liability/advance payable, **not** revenue or expense itself. Booking an expense and later redeeming/refunding that credit must not post the same expense again.

For **Adjust due** allocate only up to due on explicitly selected/eligible original invoices and put any excess in confirmed Customer Credit; do not net against unrelated customer dues. For **Cash refund**, record one payout of the final amount with its source account and audited adjustments. In multi-invoice returns preserve which line contributed to which source invoice even if there is one batch return memo.

**Below-original amount** is visibly shown as a negative Return Price Adjustment, not an Expense. Persist both the original and adjusted values so reporting can reconcile return amount, compensation expense, customer credit and cash source totals.

## 5. Return records and identity contract

New source-linked return line attributes (final field names subject to the written implementation plan):

- invoiceId + lineId as a **compound stable key** (a bare lineId may repeat between different invoices).
- `quantityBase` and the complete returned `unitQuantities` map (e.g., `{Box:'1',Pcs:'5'}`), plus original frozen unit/price snapshot reference and original invoice net allocation. Keep the detailed compound quantity on return memo/print while preserving the exact base quantity for validation.
- historicalSourceAmountPaisa, agreedReturnAmountPaisa, priceDifferencePaisa, effectiveAgreedUnitPrice.
- priceWasOverridden, optional adjustmentReason (mandatory for any positive price difference), original serial/lot allocations.
- The legacy lineReturns.amount remains the **source historical refunded allocation**, not the edited value, until a deliberate compatible type/data migration. This preserves existing planOrdinaryReturn prior-return arithmetic and old regression fixtures.
- Batch memo has finalReturnAmountPaisa, compensationExpensePaisa, aggregateNegativeAdjustmentPaisa, selected immutable invoice refs, confirmed customerId if applicable, settlement kind, confirmation actor/time, and idempotency token.
- Expense record has a separate audited transaction ID, category Customer Compensation, amount equal only to positive adjustment, sourceReturnId, sourceInvoiceIds, customerId and actor/time. It appears in Finance -> Expenses reporting but is **not** a separate bank/cash payment.
- Retain raw walk-in customer name/phone snapshots on original invoices. Customer account linkage is added to the return/credit record without editing prior walk-in invoices or turning a historically fully paid invoice into a due sale.

Legacy Sales Returns without lineReturns allocations must continue to **fail closed** for unsafe repeat-quantity/discount allocations; do not invent historical unit prices or quantities from current products.

## 6. Commit boundary, failure handling and permissions

**Production target:** one authenticated, tenant-scoped, server-validated atomic return command writes the return header/lines, source-return quantities, linked expense (if any), due allocation or credit liability, cash/bank account movement (if cash), and eligible inventory/cost/serial events. Check invoice revisions, cumulative returned quantities and duplicate idempotency keys inside one database transaction. Roll back the whole operation if any validation fails. Record distinct actor, source IDs, business date and audit reason. A return cannot be posted twice by rapid clicks or retries.

**Current demo limitation:** all stores are in-memory and separate, so UI implementation must not imply real accounting synchronization. Preview completion may show a cohesive source-linked demonstration record, but Finance/Party visibility must either derive from a shared audited preview event or clearly label itself simulated; never fabricate cash or inventory movement. Do not use multiple independent update calls as proof of production atomicity.

**Bundles:** Show editable quoted return price and the same tiny Reset link in the bundle return preview so the UI rule is consistent across all return items. Existing bundle return submission remains **preview only** until historical component/serial/lot evidence and authorized stock/ledger postings are proven. Mixed ordinary + bundle batches must not partially commit.

**Validation & recovery:** show simple inline Bengali/English messages for missing selected invoices, incompatible customer identities, invalid mobile grouping, unavailable source net allocations, excessive return qty, duplicate serials, invalid price, empty above-original reason, unconfirmed customer match, ambiguous phone identity and stale documents. Preserve the draft and user-entered prices on errors. No synthetic or quietly defaulted customer account.

## 7. Tests and acceptance criteria

**Unit:**
- Historic planner quantity/serial/source-price regressions still pass, including discounted and compound-unit partial returns.
- A 12-Pcs Box sale can return `1 Box + 5 Pcs` as exactly 17 Pcs; a `Carton + Box + Pcs` chain shows all inputs simultaneously, converts via historical factors, handles partial repeat returns and rejects over-return. Two/three-level fields require **zero selectors/switch buttons**. Old invoices missing trustworthy conversion data fail closed.
- Override at original, below original, above original, zero, fractional quantity, and multiple invoice lines reconciles to exact paisa.
- Previous return has historical amount 100 and negotiated refund 120; a later eligible partial return uses 100 as historical consumed allocation, **not** 120.
- Reset roundtrip removes override status and restores exact historical allocation even if six-decimal display rounding was used.
- Positive difference creates one source-linked expense, regardless of credit or cash settlement; negative difference produces no compensation expense.
- Cross-invoice same line IDs stay independent; stale quantity/serial/identity revisions are rejected.

**Identity & ledger:**
- +880/0 phone matching suggests the correct subset; missing/invalid phone, same-phone different person and conflicting existing accounts require confirmation and cannot auto-link.
- Confirmed existing Customer is reused; otherwise a reviewed walk-in customer is created once only when Customer Credit or excess due credit is generated.
- Original invoice party/name/paid values are not destructively rewritten; one batch return links every affected invoice and credit/expense source.
- Cash refunds do not create parties; compensation expense does not generate a second cash outflow.

**Browser and responsive:**
- Compact numeric stepper, **always-visible Box/Pcs or Carton/Box/Pcs fields**, no unit-mode or return-price-unit switch, and conditional Reset historical net price link on phone/tablet/desktop; keyboard, wheel, focus, bilingual copy, and no tall controls or horizontal overflow.
- Invoice search, multiple checkbox selection, line selection, reason/confirmation, customer match confirmation and return memo details; English, English + Bangla, Bangla.
- No accidental changes to POS, Customer/Supplier, existing completed Sales, or bundle preview limitations.

## 8. Execution boundary and design review

This file is a **design** for approval, not a claim that HisabIQ now supports production return/expense posting. No application code, backend changes, or migrations are authorized by committing this document. After the user reviews and approves this exact written specification, use Superpowers **writing-plans** to write a test-first, phased implementation plan, obtain the user's approval of that plan/execution method, and only then start implementation on a separate branch/PR without auto-merging.

**Review defaults to confirm:** The extra positive price difference is an accounting expense even if the settlement is Customer Credit; it is recognized only once. The original sale and historical return allocation remain immutable. A matched phone is a suggestion, never proof of customer identity. A smaller-than-historical refund is not an expense.
