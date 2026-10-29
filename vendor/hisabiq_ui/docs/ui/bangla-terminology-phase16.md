# HisabIQ Phase 16 — stock, lots, adjustment and offers display language

## Scope
Reuse the existing `ProductInventoryViews.tsx` and `ProductInventoryDialogs.tsx`. This phase extends the existing English / English + Bangla / Bangla setting to:
- Stock Lots list: columns, source/lot metadata display, available stock/lot value cards, selected product filter and empty states.
- Stock History: movement type labels, quantity/balance/reference columns, record filters and empty states.
- Product Details: overview/stock/lot/offers/history labels and warnings, stock/serial/expiry summaries, Warranty overview.
- Stock Adjustment: three source-safe adjustment modes; everyday Bangla validation and reasons while retaining original `mode`, `reason`, `newStock`, `delta`.
- Stock Lot intake and Offers: descriptions, dialog controls, enum display labels and validation; no changes to quantity, cost, date, serial, discount or stock computations.

## Invariants
- Original persisted stock movement types, offer status, adjustment reason, product ID, lot reference, serial number, dates, unit symbols, and category/brand strings stay untranslated.
- `productInventoryOptions` changes only select `label` and preserves `value`. No rounding, unit conversion, lot allocation, expiry warning, warranty or financial side-effects change.
- No new inventory UI component, new cart, backend posting or hidden auto-save logic.
- `StockAdjustmentDialog` still forbids raising serial/expiry controlled stock without new stock lot.
- Price snapshots and offer discount arithmetic remain untouched.
- The existing appearance/theme/spacing and English default must remain unchanged.

## Acceptance
- `tests/banglaPhase16InventoryContract.test.ts`: language fallback, enum-value integrity, source stock/serial/offer invariants.
- `npm run test:bangla-product-inventory`: 3 language modes × 390 and 1440px: lot list, movement history, stock adjustment action/dialog and mobile overflow/runtime checks.
- Existing product quick-add, POS compound-unit, purchase, all domain and responsive workflows pass CI.
- Merge onto updated `main` after Phase 15; preserve both Phase 15 and 16 package/CI test entries.

## Deferred
Detailed real-world semantic translation review with Bangladeshi shopkeepers, accounting/backend integration, product preview persistence accuracy and global ERP-wide translation coverage remain independent work.
