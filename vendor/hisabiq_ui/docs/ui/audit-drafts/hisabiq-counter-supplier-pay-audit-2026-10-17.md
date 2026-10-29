# HisabIQ Counter Supplier Pay audit — 17 October 2026

## Scope

Read-only audit of Finance → Counter → Supplier Pay on the current merged UI source. Focus: open bill visibility, Full due, source allocation, and confirmation behavior. No application source was changed.

## Verified finding — Supplier Pay cannot target an individual purchase bill

**Priority: P1 workflow-completeness gap**

A supplier with multiple open purchases can only be paid against the supplier's aggregate payable. Counter does not offer an invoice allocation selector or show which purchase bill(s) a payment will settle. The confirmation creates an aggregate supplier-payment source without an `invoiceId`.

### Reproduction

In local Playwright at 390×844 using the current app preview data:

1. Open Finance → Counter → Supplier Pay.
2. Select **Karim Traders**. The preview has two purchase sources (`purchase:pu118`, `purchase:pu112`) and an aggregate outstanding due of **৳82,600**.
3. Inspect allocation controls: the **Invoice allocation** combobox count is 0.
4. Click **Full due**: the payment split is filled with **৳82,600**.
5. Review and confirm. The created `supplier-payment` source has `partyId: s1` and `amountPaid: 82600`, but no `invoiceId`.

This means users cannot express “pay this bill” or verify how a partial payment is assigned when multiple bills are open. Full due also communicates only the aggregate balance; it does not confirm bill-level settlement. This audit verifies the preview UI/source behavior, not backend posting or persisted invoice aging.

### Evidence in source

`CounterWorkspace.tsx` computes `openInvoices` only for `Customer Receive`; Supplier Pay receives an empty invoice list. The invoice allocation section is also rendered only for `Customer Receive`. Both party actions can display aggregate due and use the same Full due button. On confirmation, the payment payload uses `invoiceId: chosen?.reference`, which remains undefined for Supplier Pay.

### Suggested follow-up for implementation

Add a supplier-side open-purchase allocation preview that preserves purchase source IDs, validates the selected bill’s remaining due, and clearly describes how partial/full payments are applied. If the intended policy is oldest-bill-first, show the exact bill references and amounts before confirmation. Keep aggregate payment as an explicit option only if users can understand the allocation rule. Add regression coverage for multiple open bills, partial payment, Full due, stale/closed bill validation, and source-to-invoice identity.

## Passed checks in this audit slice

- Current local browser preview loaded and supplier selection worked.
- Karim Traders showed aggregate due ৳82,600 from two purchase sources.
- Full due populated the payment row with exactly ৳82,600.
- Confirmation recorded a supplier-payment preview source for `s1` and ৳82,600.
- Existing merged regression `scripts/counter-payment-split-identity-browser.cjs` covers supplier split account identity and aggregate balance/account deltas in its own 48 viewport/theme/language journeys; it does not cover invoice-level allocation, consistent with the gap above.

## Limits

This is one focused workflow audit, not completion of the ERP audit. It does not certify server persistence, invoice aging, or backend integration. No source files or tests were modified during this audit.
