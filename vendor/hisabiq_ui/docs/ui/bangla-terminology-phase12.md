# HisabIQ Bangla Phase 12 — Online orders, courier COD and CRM

## Purpose
Make the Online Sales preview easier for Bangladeshi shopkeepers, while keeping operational values stable across the existing three tenant settings: English, English + Bangla, and Bangla.

## Scope
- Online order cards, statuses, source/payment filters, summary totals and empty states.
- Order draft editor labels and the preview warning that no stock, ledger, invoice, payment or courier API has been posted.
- Courier selection, tracking, manual COD reports, fees, remittance and pending clearing. The text distinguishes expected COD, courier report and actual receipt.
- Order details, transitions, activity labels and CRM lead creation, follow-up and stage selector.
- Reuse existing `useUiCopy` and `onlineLabel`; `onlineOptions` preserves `value` and changes only `label`.
- Preserve the existing `TransactionCartEditor` mode `online`, quote conversion, POS V2 handoff, store setters, sales/stock posting invariants and document print behavior.

## Important invariants
- Never localize persisted `OrderStage`, `PaymentMode`, `LeadStage`, `SalesChannel`, courier names, order identifiers, customer text or amounts.
- No new accounting, inventory, SMS, WhatsApp, logistics or receipt-payout API.
- No new cart, payment calculator, source store or alternate shipping document.
- The current `FulfillmentDocumentPreview` retains its existing English document layout. Localizing those document bodies needs a separate source-safe print slice, not a cosmetic title change.

## Acceptance / CI
- `npm test` runs `banglaPhase12OnlineSalesContract.test.ts`, checks the store snapshot and preserves source values.
- `npm run test:bangla-online-sales` checks English, bilingual and Bangla at 390 and 1440px, status filters, COD details, safe draft warning and CRM modal.
- Existing `npm run test:online-sales`, `npm run test:fulfillment-sms`, `npm run test:quotations`, `npm run test:compound-units` and `npm run check:ui-contract`.
- CI build, strict TypeScript and lint, responsive audit, light/dark and desktop/tablet/phone before merge.
- Do **not** merge without CI green and user approval.

## Deferred
Courier provider integration, actual Cash/Bank/MFS posting, live tracking, SMS sending, backend persistence and translating the stand-alone fulfillment document body.
