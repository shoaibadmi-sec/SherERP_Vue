# HisabIQ POS audit — 17 October 2026

Source: local `/workspace/hisabiq_table` checkout at `073c230`; tracked source matches locally fetched `origin/main` (`8516a0b`). Read-only browser audit; no application code or tracked test file changes.

## Reproduced findings

| ID | Priority | Browser reproduction and observed result | Likely source |
| --- | --- | --- | --- |
| POS-A1 | P1 | Create a Customer in Parties, move within the app to POS, and search the POS customer picker. The new person is absent. Search `Rafiq Mia`: a Borrower-only seed person is offered as a customer. | `CustomerPicker.tsx` searches static `parties` and admits `Borrower` without `Customer`. |
| POS-A2 | P1 | On a walk-in sale, set payment method `Customer Credit`, choose Exact, then Preview sale. Review shows `Walk-in customer`, Paid ৳5,870, Due ৳0. No customer or available credit is required. | `CheckoutPanel.tsx` includes Customer Credit as a payment source; `usePosCart.ts` totals all payment rows without a credit-balance guard. |
| POS-A3 | P1 | Enter `1..2` in payment: the field retains it while Paid becomes ৳1. Enter `100..50` in line price and `10..50` in discount: both strings remain visible while receipt uses price 100 and discount 10. | Price, discount and payment `onChange` filters allow multiple dots; totals use `parseFloat` prefixes. |
| POS-A4 | P2 | Set the first cart line quantity to 0, pay Exact and confirm the preview. The receipt includes `0 Pcs × 100` as one of three lines. | `complete()` checks total and stock/serials but does not reject zero-quantity lines. |
| POS-A5 | P1 | Set a ৳100 discount on the default ৳5,870 cart, then Hold current and resume. Held total is ৳5,770; resumed discount is empty and total becomes ৳5,870. Hold again, leave POS for Products and return: Drafts count drops from 4 to 3. | `holdCurrent`/`resume` omit discount and mode; drafts exist only in POS component state. |
| POS-A6 | P1 | Split a ৳5,870 sale as Cash ৳1,000 plus Bank ৳4,870 (Dutch-Bangla Bank · 4582). Review lists only Paid ৳5,870; receipt lists `Paid (Multiple) 5,870`. Neither preserves split amounts or account. | POS review details contain only total Paid/Due; `CompletedSale` retains one method string, not payment rows. |
| POS-A7 | P2 | Choose Customer Credit for payment. The method combobox shows `Customer Credit` but its accessible name remains `Cash`. | `FormSelect` falls back to the first option label when no field label is supplied. |
| POS-A8 | P2 | Switch UI language to Bangla. POS Drafts trigger still reads `Drafts`; menu text is hard-coded English. | `DraftsMenu.tsx` does not use localized copy. |

POS-A2 also labels Customer Credit as `ক্রেতার বাকি` in Bangla, which describes due rather than stored customer credit. Verify terminology when correcting the credit flow.

## Checks that passed

- POS shortcuts: 48 journeys (8 required viewport sizes × light/dark × English/bilingual/Bangla), zero failures. Blocking review/receipt/drawer focus and disabled checkout shortcuts behaved correctly.
- POS cart responsiveness: 22 viewport/theme cases (11 sizes × light/dark), zero horizontal overflow or misplaced cart controls. POS price visibility: 12 size/theme cases passed. Mobile shared carts, reorder/print-order, and bundle POS revision/Set safety passed.
- POS focused unit tests: 6 files passed (`posQuantity`, `posStock`, `salesDocuments`, `bundleCart`, `bundleFulfillment`, `bundleDocuments`).
- Whole-page axe and horizontal-overflow checks: 96 scans (POS cart/checkout and Review sale across 8 sizes × 2 themes × 3 language modes), zero violations and zero document overflow. Axe cannot detect the misleading accessible name in POS-A7.

This is scoped frontend preview evidence, not backend posting certification. Device software keyboards, scanner hardware, downloaded-font rendering, manual screen-reader use, and real payment/stock integrations were not exercised. No GitHub CI was used for testing.
