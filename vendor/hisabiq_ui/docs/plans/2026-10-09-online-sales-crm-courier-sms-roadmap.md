# HisabIQ Online Sales + CRM + Courier + Notifications
2026-10-09 — approved working direction; implementation roadmap (Superpowers-style: simplest valuable slice, invariants first, tests before integration)

## Product decision
**One module in HisabIQ, not another ERP**. Sell from Facebook Page, Facebook Marketplace, WhatsApp, Instagram, YouTube, TikTok, website, live stream and Manual. Capture channel as attribution and optional source conversation/reference URL. V1 is **manual entry**, no permissions or inbox scraping/auto replies. Future Meta integration requires compliant Business account and approved APIs.

Reuse existing Product IDs, Product units and stocks, Party customer IDs (match phone suggestively, never auto-merge), Quotes PR #39, existing POS V2 and Sales, Finance accounts, ledger, invoice printing. `HisabIQ_ui` remains **in-memory design preview** until main `hisabiq` backend connects. Current branch stacks on PR #39; merge parent PR first.

## Shared definitions (never conflate)
- **Inquiry/lead**: contact and opportunity, no stock/cash/accounting.
- **Online order**: customer confirmation and promised delivery, not itself a Sales invoice. A draft/confirmed order has no accounting/stock effect.
- **Sale/invoice**: created/posted exactly ONCE by existing POS/domain posting engine; online order stores resulting sale ID (no independent accounting).
- **Payment actually received**: cashier receipt; e.g. ৳100 delivery charge prepaid via bKash; ledger posting is **only** by integrated Finance/Sales in later phase. Do not call a planned transfer paid.
- **Courier COD collection**: a third-party receivable (courier clearing), not Cash/Bank/Customer cash or merchant received. `delivered` != `COD settled`.
- **Courier payout/settlement**: verified remittance to business account, net of explicit courier fee, return charge, adjustment. Partial payouts are supported; reconcile per parcel and prevent over-allocation.
- **Return / failed delivery**: preserves audit and tracks reverse shipping/charges; stock may return only through a verified inventory return posting, not automatic on status text.
- **Document distinction**: quotation, proforma/order confirmation, packing/delivery challan (no amount-due implied), sales/tax invoice from POS, courier waybill, settlement statement.

## Order flow
Lead → quotation (optional) → Order draft → Confirmed → Packed → Courier booked → Handed over → In transit → Delivered or Delivery failed/Return in progress/Returned. Manual courier entry starts V1; tracking number and courier provider recorded, carrier status explicitly marked **manual**. Cancellation only before handover; later requires return workflow. Status history immutable with time, actor, explanation. A confirmed order does not deduct stock. Phase 2 adds reservation with per-SKU/base-unit quantity and atomic release; stock posting remains POS responsibility.

### Payment modes
1. **Full advance paid**: total received, courier COD 0.
2. **Pure COD**: nothing paid, courier COD = order grand total (items + customer-facing delivery charge - discount).
3. **Delivery charge prepaid**: e.g. total ৳1,100 (items ৳1,000 + delivery charge ৳100), received ৳100, COD ৳1,000.
4. **Part advance**: e.g. received ৳300 of ৳1,100, COD ৳800.
5. **No courier / local delivery**: delivery person or cash at counter tracked by own collection method, not provider COD.
Payment receipt may be split by Cash/Bank/MFS **after actual payment**; visual preview does not mutate real balances. Totals computed in paisa (integers), prevent negative/overpayment. Provider shipping fee may differ from customer shipping charge, held separately.

### Courier, settlement and SMS
- Courier connector interface in later phase: `book(order, idempotencyKey)`, `fetchStatus`, `verifyWebhook`, `fetchPayout`, `cancel`; never call from React with credentials. Per-tenant secret encryption, backoff, retries, webhook signature/secret validation, mapping table, 1 external order ID, no duplicate bookings.
- Integration order: manual provider+tracking → Steadfast → Pathao → RedX → others. Steadfast documents order creation, status lookup, COD payouts and webhook callbacks. Pathao merchant order creation includes `amount_to_collect`; validate provider-specific capabilities in backend phase.
- Courier payout reconciliation uses per-parcel gross COD, expected merchant settlement, provider fees/deductions, paid amount, difference, reference and date. Supports partial delivery/returns, lost parcel, failed/held, and manual adjustments with reason. User must never mark a parcel's `collected` cash as deposited.
- **One ERP-wide notification service**, shared with POS, Due Collection, and Online Sales:
  `order_confirmed`, `sale_completed`, `sales_payment_received`, `due_reminder`, `courier_handover`, `parcel_delivered`, `parcel_failed`, `cod_settled`.
  Per-event enabled/disabled, language English/Bangla, SMS/WhatsApp future, template, recipient consent, quiet hours, delivery report, message cost/credit preview, manual test action, audit + idempotency. Default SMS all **OFF**. A UI simulation is a **Preview only**, never label as `Sent`. Actual server outbound uses outbox worker and gateway credentials in later phase. Recipient opt-out / marketing-vs-transactional distinction must be respected. Never leak one tenant's messages or API keys.
- Central notifications settings should be accessible both in tenant Settings and Online Sales. SaaS admin sets packages; tenant config picks events and templates. SMS logs are shared across modules.

## Delivery roadmap
| Phase | Goal | Acceptance |
| --- | --- | --- |
| **1A (this PR)** | Online Sales dashboard, channel orders, parcel status, prepaid/COD simulator, courier tracking, CRM lead list, ERP-wide per-event SMS **preview rules**, validation tests | Works in dark/light mobile, uses existing Products and Party identifiers, COD formula correct, no fake cash/stock/SMS postings |
| **1B** | Quote → Online order and Sales/POS V2 handoff; printable order, packing slip and delivery challan; shareable customer confirmation | Snapshot quote prices/units, convert exactly once, statuses/audit, no duplicate invoice or stock |
| **2** | Actual DB schema, tenant_id everywhere, authenticated APIs, role gates, receipts/splits, stock reservation, courier clearing account & per-parcel settlement | Atomic posting, idempotent retries, reconciliation; integration tests and cross-tenant isolation |
| **3** | Steadfast merchant integration, status sync, webhook authenticity, COD payouts, return management; then Pathao and RedX adapters | Duplicate callback safety, provider mapping, partial delivery, failed/held returns, settlement reconciliation |
| **4** | SMS gateway, actual queue/delivery reports, tenant credit quotas, sales/POS/due reminder triggers, opted-in templates | Disabled switches never send, consent and retries, one invoice event one SMS, paid credits/audit |
| **5** | CRM followups and inbox links, attribution/advert spend and profit per channel, reporting, import/bulk orders, later official social inbox APIs | Lead-to-sale attribution and ROAS without double-counting |
 
## UI structure
Sidebar **Online Sales** under Sales. Within one page: **Orders**, **Courier & COD**, **Customers / CRM**, **Notifications**. Fast inline search, status/channel filters, contextual row actions with dialogs, colored semantic status **with labels**, mobile card layout. English labels + Bangla helpers. Reuse AppSelect, Button, Dialog, theme tokens; no monospaced digits, no unnecessary nested menus.

## Phase 1A data/test contract
- Pure domain math and finite-money validation; immutable store state with one revision per command.
- Separate order lifecycle from courier status and payment settlement. Stock never mutated. Every transition has `history` with origin, actor, note.
- Seed demo scenarios: COD in transit; delivery charge prepaid with COD outstanding; full-paid local; courier delivered awaiting payout; paid settlement; returned parcel.
- CRM leads record channel/contact/next-followup date/notes, no unauthorized message sending.
- Test full, zero, delivery-only and partial advances, overpayment, parcel lifecycle rules, no COD settlement on delivery alone, idempotency, per-event SMS policy preview-only.
- Browser smoke: create Facebook order, change to WhatsApp, add compound-unit product, set delivery prepaid, confirm/hand over, view COD & notifications; desktop/mobile and theme CI.
