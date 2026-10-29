# HisabIQ Phase 18 — Purchase list and return preview language

## Baseline
Phase 17 PR #107 merged as `f157229cbac840be7346ab151fdae3b223290da3`. Use the existing Settings English / English + Bangla / Bangla modes and the current shadcn-style purchase screens without redesign.

## Included
- Existing Purchases summary/list, action menu accessibility labels, clear filters, source return lookup errors/placeholders, source-review and refund/stock safety guidance, return history, sample refund method badges and source-history dialog.
- New display-only `purchaseLabel` and `purchaseReturnMethod` render simple shopkeeper Bangla; bilingual retains English primary words and current helper slots.
- Source-driven supplier names, invoice references, product descriptions, dates, quantities, raw method values and currency figures are never translated or modified.
- Supplier/status filter stored IDs, original-purchase matching, `purchasePosition`, `sourceReturnable`, PurchaseSourceDialog, finance event history and CSV export filename/schema remain unchanged.
- Shared `PageHeader`, `FormSelect`, `Input`, `FloatingPanel`, `StatusBadge` and `BillDetailDialog` are reused; no new cart or payment component.

## Checks
- `tests/banglaPhase18PurchasesContract.test.ts`: modes, source values, return method, immutable filters/CSV/source guards.
- `npm run test:bangla-purchases`: Playwright three languages × mobile 390px / desktop 1440px, list actions/source modal, return validation, history/export, runtime errors and overflow.
- Existing `test:purchases` and `npm test` must still pass; no real backend posting is implied.

## Deferred
Full-page `PurchaseEditor`, shared PurchaseCart/PaymentPanel localization and PurchaseSourceDialog labels require a separate slice because they share keyboard/focus and cross-module vendor entry contracts. This PR intentionally keeps these sensitive transaction surfaces unchanged.
