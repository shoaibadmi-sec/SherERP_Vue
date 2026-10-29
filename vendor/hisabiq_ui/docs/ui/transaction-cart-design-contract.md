# HisabIQ Transaction UI Design Contract

**Status: Mandatory for all new and modified product transaction screens.**
Version 1 · 2026-10-09 · Design source: approved Magic Patterns system, with the existing POS V2 and Purchase implementation as concrete UX references.

## Objective

A person who learns to add and edit a product in POS must be able to perform the same action in Purchases, Quotations, Online Sales, Sales Returns, Purchase Returns, Opening Stock, Warranty Replacement and future service/repair workflows **without learning a new product input UI**.

This contract applies across the ERP: product rows, quick-add, price/unit, totals, forms, filters, tables and money/payment surfaces. It is not an excuse to apply POS **posting** semantics to non-sales documents.

## Reuse, don't redraw

| Concern | Current source to inspect | Required target architecture |
| --- | --- | --- |
| POS inline cart | `src/components/pos/CartTable.tsx` | One shared `TransactionCart` with explicit semantic context |
| Searchable product picker | `src/components/pos/ProductCombobox.tsx` | One `ProductPicker` with context-aware result metadata, shared popover, keyboard/touch |
| Purchase inline cart | `src/components/purchases/PurchaseCart.tsx` | Same `TransactionCart`, purchase columns supplied by a context variant |
| Purchase product search | `src/components/purchases/PurchaseProductSearch.tsx` | Same `ProductPicker` with purchase price, optional create-product action |
| Quantity/unit conversion | `src/utils/{units,posQuantity,purchaseCart}.ts` | Extract common quantity editing/conversion; no duplicated formulas |
| Sales payment editor | `src/components/pos/CheckoutPanel.tsx` | `TransactionPaymentRows` with account lookup and validation |
| Purchase payment editor | `src/components/purchases/PurchasePaymentPanel.tsx` | Same `TransactionPaymentRows`, purchase-specific methods and payable semantics |
| Quick-add new product | Existing Purchase quick-add and Product form | One modal/form and field/combobox behavior, supplier-side purchase option where appropriate |
| Generic form primitives | `src/components/{Input,AppSelect,Button,Dialog}.tsx` and themed picker primitives | Reuse; no hard-coded dark dropdown/popup colors or native lookalikes |

The target names describe the **future refactor**. They are not existing exported components and must not be represented as already implemented. Reuse existing code until the shared extraction is tested.

### Product selection: one control, one experience
- Search by English and বাংলা name, barcode/SKU if supplied, category/brand when relevant. Results show readable name, Bangla helper, stock, price in selected unit, unit and (if available) image. Search must **actually filter**.
- Use one integrated input+suggestions surface like POS: no separate search box + disconnected select dropdown. Keyboard: F2 when POS supplies it, arrow keys move active option, Enter selects, Escape closes, tab/blur safe, Enter after select moves focus to quantity then next add row. Touch tap must work without hover; no duplicate adds on blur/click.
- Open list above/below without clipping; correctly theme portal, focus ring and active option in light/dark. Empty suggestion supports Quick Add Product without losing entered search/partially entered cart.
- Product entry stays in the **same POS-approved inline-cart position** and uses the same dashed, themed quick-add row. New product quick-add is accessible from the same picker, preserves cart state, uses shared Category/Brand/Unit add dialogs, and returns newly created item to the intended row.
- Use a **searchable combobox** when choosing among products, customers or large accounts; `AppSelect` is for small fixed enumerations (payment mode, status, courier, static unit list).

### Cart rows and units
- Standard row: reorder handle where supported; sequence number; thumbnail + product name/Bangla helper/category/availability; editable quantity; selected unit; price in selected unit; line total; contextual action menu; remove button.
- Support compound quantities `2 Box 5 Pcs`, `1 Gauge 12 Gira`, `3 Pipe 10 Feet` where a product defines its conversion. Do not simplify into a plain floating quantity for product types requiring large+small entry.
- On unit switch, update price for the selected unit **without changing monetary meaning unexpectedly**, follow existing conversion and price-override permissions; preserve decimal quantity precision appropriately.
- Live totals, discount and applicable rounding follow shared calculators. Numeric columns right aligned; numbers use normal UI font, never `font-mono` or tabular monospace.
- Row ordering controls presentation order and printable order. Maintain stable keys, preserve quantity/price/serials. Stock shortage controls belong in **posted sales workflows**; draft quotes must not silently reserve or sell inventory.
- Keyboard and touch actions: Enter cycles Add product → Qty → next Add product; when line editing has more fields (unit/price/serials), permit deliberate navigation without destructive or duplicate submits; off-target clicks must commit valid edits predictably.

### Context modes — same UI shell, correct business logic

| Mode | Product price | Extra fields/actions | Posting safety |
| --- | --- | --- | --- |
| POS / Sales | Sell price, price override, offers | Serial/warranty, shortage mode, payments, invoice | Only when confirmed posting |
| Purchases | Supplier cost, entry price unit | Supplier, lot, expiry, cost, bill attachment, payment rows | Purchases affect stock only when posted |
| Quotation | Quoted sell price | Customer, validity, terms, save/duplicate/print | Never modify stock/cash merely on quote |
| Online Sales | Quoted sell price | Channel, delivery charge, courier COD, advance | No double receipt/stock movement on order draft |
| Returns | Historical invoice/bill price | Returnable quantity, reason, restocking decision, refund | Reconcile against source transaction and ledger |
| Opening stock | Cost / optional selling price | Unit selection, stock lot, effective opening date | Tenant-scoped stock opening audit |
| Warranty/service parts | Context price/cost | Serial, warranty claim, installed/replaced parts | No accidental new sale |

### Payment and forms parity
- Sale/Purchase/payment-capable flows use same visual rows for multiple Cash/Bank/Card/MFS payments with conditional accounts, plus button, remove, sum, Paid/Due/Change, discounts and validation.
- Quotation: no actual payment entry by default; online prepaid/delivery charge is recorded/posted only through backend with explicit account. A preview numeric amount is not a bank receipt.
- Standardize all `Input`, `Button`, `Dialog`, `AppSelect`, searchable combobox, toast, calendar and date-range selectors from the shared design system. Do not invent a different height, shadow, backdrop, border or dark-mode palette per page. Static short enumerations may use `AppSelect`; large/typed lists require combobox.
- Use user-friendly English labels with compact Bengali helper; predictable validation messages, error focus, empty states, accessible name and click/touch targets. Keep dense desktop tables and responsive mobile card/scroll behavior with same functionality.
- Always use theme tokens rather than hardcoded white/dark grays for dropdowns, date pickers and popovers; test portal rendering in dark and light.
- **No mono digits** in money, invoices, balances, stock or table cells.

## Existing gap inventory and migration order

These are *known pre-existing divergences*, not approved examples to copy.

| Location | Current issue | Required migration |
| --- | --- | --- |
| POS `CartTable` + `ProductCombobox` | Canonical design but picker lacks the same on-picker Create action used in Purchases | Preserve layout, extract reusable picker with create support |
| Purchase `PurchaseCart` + `PurchaseProductSearch` | Visually close to POS, but separate popover implementation/keyboard behavior | Migrate to shared picker; consolidate shared row controls and compound quantity |
| Quotations PR #39 `src/pages/Quotations.tsx` | Page-local product `AppSelect`, custom standalone item cards, no compound quantity entry | Replace with shared POS-style editable cart/picker before calling UI complete |
| Online Sales PR #40 `src/pages/OnlineSales.tsx` | Page-local product `AppSelect` and custom item cards | Replace with same picker/cart; preserve COD and quote-lock modes |
| Sales/Purchase Returns, Opening Stock, Service/Warranty | Different editors, sometimes not product-centric | Audit each; share controls when applicable and preserve source transaction restrictions |
| General ERP inputs | Some older native selects and date inputs bypass approved themed controls | Migrate on touch; use correct combobox/date-range/field primitive |

**Order of refactoring (separate PRs):**
1. Extract a shared search/picker with context-specific product display; wrap POS + Purchase picker and preserve all existing tests.
2. Extract shared editable row and large+small unit editor (with adapters for sale/purchase/quote/online) while preserving POS and Purchase behaviors.
3. Migrate Quotation and Online Order editors (currently inconsistent), keep quote-lock and COD/payment semantics.
4. Consolidate split payment row UI, contextual Quick Add Product and related dialogs.
5. Audit returns, opening stock, service/repair/warranty, then remaining ERP forms and mobile states.

**Do not merge a future new product transaction UI using a new product AppSelect** on the claim that it is easier. Existing listed exceptions must be removed, not multiplied.

## UI acceptance checklist (every relevant PR)

- [ ] Screens explicitly reuse the same shared component family as POS V2. No new independent product picker/cart.
- [ ] Search works by English + Bangla, optional SKU/barcode, and shows stock, price, category and unit.
- [ ] Add product from search/quick-add; preserve focus and existing lines; use approved inline add-row position.
- [ ] Large/small quantity works, e.g. `2 Box 5 Pcs` and `1 Gauge 12 Gira`, price conversion correct.
- [ ] Keyboard focus and Enter flow plus Escape, Arrow keys, Tab; touch/mobile selection and scroll work.
- [ ] Actions functional: unit switch, edit price, remove, reorder if applicable, details/quick-create, discounts.
- [ ] Payment-capable flows use consistent split-payment rows; no accidental financial/stock posting.
- [ ] Numeric alignment and labels/BN helper match standards; no monospace digits.
- [ ] Light and dark: input/popup, calendars, popovers, dialog overlays, focus ring, disabled/invalid states.
- [ ] Print line order and mobile layout verified; Playwright regression added or updated.

## CI guard and exceptions

Run `npm run check:ui-contract`. The guard verifies the design contract exists, POS & Purchase current reference components remain available, and new product-selection `AppSelect` / `FormSelect` patterns are prohibited. Two **explicit grandfathered** draft-page product selectors (Quotations and Online Sales) are allowed **only so stacked work does not break CI**; the guard fails if extra ones are introduced. Remove these exceptions when the migration is done.

This check is deliberately limited: it cannot prove visual consistency or all keyboard interactions. The reviewer must still inspect real UI and browser tests in both themes.

**If the user requests a deviation**, obtain explicit approval, document the reason and migration impact in the PR. Never silently override this contract.
