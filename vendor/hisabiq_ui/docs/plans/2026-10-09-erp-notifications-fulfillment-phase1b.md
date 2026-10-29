# Phase 1B — Quote→Order→POS fulfillment and ERP-wide configurable notifications
2026-10-09. Follow-on to PR #39 (Quotations) and #40 (Online Sales); do not merge ahead of parents.

## Scope / invariants
1. Move SMS out of Online Sales ownership into **ERP Notifications** at `/app/notifications`; Online Sales retains a link/embedded view. Shared single rules store for all ERP event families: Customer sales/due/refunds, tailor/service job lifecycle (e.g. panjabi ready), warranty, suppliers/purchase dues/payments, lender/borrower/loan, owner cash movements, purchase status, low stock (staff/internal), online sales/courier. All per-event switches default **OFF**.
2. Each event controls language (English/Bangla), template variables, recipient category, and manual/on-event intended trigger; optional due-reminder days. Quiet hours and consent checks documented for backend. **No message transmission**: config and preview only, always explain gateway disconnected. Do not claim triggered/sent/delivered or charge credits.
3. Quote → Online draft: only **Accepted** quotation, one linked order per quote; preserve price, line order, compound unit and discount. Identity/phone/address must be verified in editor before save. Do not mutate quote/order if draft invalid; repeated conversion cannot create duplicate.
4. Order → POS V2: only Confirmed/Packed orders; prefill products, prices, customer, discount. No implied payment received from online order preview: cashier verifies manually. Do not post invoice/stock/ledger or mark the online order sold; stop at prefilled POS UI. Source/banner for traceability. Reject missing/retired products and unsupported quantity precision; do not silently substitute.
5. Printable documents: Order confirmation (amount and payment terms), Packing list (no amounts), Delivery challan (no amounts); print CSS isolates current order/document, labels exclude "sales invoice" and actual courier waybill. Invoice printed from existing Sales/POS only after posting in future backend phase.
6. Preserve one user-facing KISS workflow: accepted quote creates online order -> verify buyer/delivery and payment -> confirm -> print handover papers -> safely open POS.

## Acceptance gates
- Type/build, Node tests for all new notification event groups, token interpolation, validation/default OFF, quote idempotency, snapshot and POS handoff data, and no real posting.
- Playwright tests: ERP notifications controls + tailor "Panjabi ready" SMS preview; quote converted only after Accepted; order editor; printable labels; POS handoff banner/values.
- No deployment/merge to main unless explicitly requested. Cloudflare PR preview via automatic CI integration.
