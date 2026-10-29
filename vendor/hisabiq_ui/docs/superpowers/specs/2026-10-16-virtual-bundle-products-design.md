# HisabIQ — Virtual Bundle / Package Products (V1) Architecture Design

**Date:** 2026-10-16  
**Status:** Proposed specification for user review; **not approved for implementation**  
**Superpowers stage:** Architectural brainstorming → written specification → review gate  
**Repository:** shuvodelux-commits/hisabiq_ui (reviewed main f61a66d6108a490234bb27da47384bd7eaafcf5b)  
**Product:** HisabIQ ERP for Bangladeshi SMB shops  
**Decision approved for specification:** Fixed-composition **virtual bundles only**. No physical assembly stock, nested bundles or checkout-time component substitution in V1.

## 1. Shared understanding and success

A shopkeeper creates one saleable bundle/package (e.g. Tubewell Installation Set) from 2 or more **existing stock products**, each with its own exact quantity and selected unit. The package has its own name, SKU, image, selling price and unit **Set**. In the existing POS cart and printed invoice it is **one sale line**. When the sale is posted, the exact quantities of **each underlying stock product** are consumed and independently auditable. The bundle itself is not stored, purchased or counted as physical stock.

Success means an inexperienced operator can create a bundle once, sell it by selecting one product, and correctly see stock, cost, shortage, returns and historical invoice details without an additional cart or confusing accounting. English/বাংলা labels, keyboard and touch accessibility, mobile/tablet responsiveness, and the current Magic Patterns design system remain mandatory. Correctness is more important than a clever UI.

### Explicit V1 scope

- Product kind: Stock | Service | Bundle; bundle kind is immutable after creation.
- A fixed list of stock-only components, with any count >=2, each component quantity >0, including existing large/small unit conversions.
- Distinct bundle SKU; independent package selling price and optional bundle-level offer.
- Derived **complete-set availability**, cost estimate and component-level shortage preview.
- One bundle row in POS, saved sale, invoice, receipt and Sales/Party history; no editable child cart lines.
- Atomic, idempotent stock consumption of component lots/serials, linked to the posted parent sale line.
- Whole-set returns (can return 1 of 3 purchased sets), source-linked component restoration or explicit non-restock disposition.
- **Only after a bundle recipe has been used by a posted sale**, a subsequent changed Save creates a new revision for future sales. Unsold recipes may be edited repeatedly in place, even when earlier recipe revisions have been sold. Unchanged Save creates no revision. Posted sales retain their exact frozen recipe snapshots.
- An unsold Bundle may be **deleted with its unsold recipe**; a Bundle ever used by a posted sale cannot be deleted, even after returning every Set. It can be deactivated instead.
- No double counting of stock value, sales income, tax/discount or COGS.

### Out of scope in V1

Physical preassembly, finished package stock, assembly/disassembly operations, nested or recursive bundles, service items inside a bundle, optional/substitutable components, per-sale component customization, fractional Sets, supplier purchase of a virtual bundle, component-specific selling prices on receipts, partial-component returns as a bundle return, and retroactive changing of a posted bundle recipe. These require separate design approval.

## 2. Repository evidence and constraints

Reviewed as of the source revision above:

| Existing source | Observed design constraint / implication |
| --- | --- |
| src/types/erp.ts | Product.kind currently Stock or Service; Product has scalar stock, sellPrice, purchasePrice, base unit and optional altUnit. SaleLine has productId, base returnable quantity, unit cost, stock source, serials and lot allocations. There is **no existing bundle data type or bundle posting API**. |
| src/components/products/AddProductDialog.tsx | Generic product dialog currently handles stock/service, opening quantity, warranty, serial/expiry and alternate units. Bundle creation must not expose ordinary opening-stock/lot adjustment fields. |
| src/pages/Products.tsx | List aggregates stock value from product.stock * purchasePrice, has ordinary stock/lot/adjustment actions and product status; bundle rows need derived availability and excluded inventory valuation. |
| src/components/pos/ProductCombobox.tsx and src/hooks/usePosCart.ts | Existing searchable POS picker, Enter/focus behavior, single cart line object and pricing. Reuse and extend; do not fork picker or cart. |
| src/utils/units.ts, src/utils/productFeatures.ts, src/utils/posStock.ts | Existing compound base units, lot allocation FIFO/FEFO, sellable/expired lots and low/negative stock rules. Bundle calculations must reuse the same stock semantics. |
| src/components/pos/StockShortageDialog.tsx | Current Own / Negative / Vendor sources, including optional unknown vendor cost. Bundle shortages need component-level validation without silently bypassing permissions. |
| src/pages/Pos.tsx, src/pages/Sales.tsx and src/utils/salesDocuments.ts | POS preview and Sales returns/invoice display are currently oriented to normal sale lines. Bundle metadata, linked child movements and source-linked returns require explicit extensions. |
| AGENTS.md; docs/ui/transaction-cart-design-contract.md; docs/superpowers/specs/2026-10-09-erp-kiss-contextual-workflows-design.md | One shared POS-style cart/picker, shared inputs/overlays, short context-complete workflows, source integrity, no fake posting, keyboard/touch/dark/mobile checks, no monospace numbers. |

**Environment boundary:** This repository is a UI preview and currently relies substantially on demo/preview stores. It must not claim durable tenant inventory/account posting merely by changing client state. The final inventory mutation contract must be implemented in the real authenticated HisabIQ backend, in a separately reviewed implementation effort. This document specifies behavior and interface boundaries; it makes **no** backend implementation claim.

## 3. Options considered and selected architecture

**A. Catalog-backed virtual bundle + immutable sale snapshot — selected.** Product holds bundle identity/pricing; a versioned composition record references stock products. An existing sales line represents the bundle; linked consumption records represent stock component movements. Easy routine sale, correct auditing, independent pricing and no duplicate stock.

**B. Ad-hoc grouping of ordinary POS cart lines — rejected.** It avoids a new catalog type but cannot give the package a reusable SKU, stable recipe or single printable line without fragile grouping. Users repeatedly assemble the same kit.

**C. Prepacked finished-goods stock — deferred.** Enables physical assembly and dispatch but requires an assembly ledger, costing transfers, reconciliation and separate stock. Not necessary for virtual V1.

### Logical boundaries

- **Catalog / Bundle Definition:** create, validate, version, activate and describe bundles; does not mutate stock.
- **Availability & Cost Projection:** read-only derived max sellable sets and estimated cost; never becomes the authoritative posting result.
- **POS Sale Composition:** existing cart/UI holds one parent line with integer Sets; checkout server expands stock requirements.
- **Inventory Allocation & Posting:** transactionally validates and consumes each stock component; emits source-linked lot and stock movements.
- **Sales History & Returns:** reads frozen historical recipe, price, serial/lot/cost provenance; applies authorized reversal/restock against that history.
- **Reporting:** parent line contributes sales revenue; child consumptions contribute inventory/COGS; no second invoice income line.

No module may maintain its own independent mutable "bundle on-hand stock."

## 4. Domain data and invariants

### 4.1 Catalog model (conceptual, not a DB migration)

**products**: existing product fields plus kind = Bundle and package unit = Set. For Bundle, product.stock and purchasePrice are **not authoritative stored inventory fields**; no opening stock, lot or direct stock adjustment is allowed. The bundle selling price remains authoritative and independent of component selling prices.

**bundle_versions**: tenant_id, bundle_product_id, revision, created_at, created_by, active/current version marker. Only updating a **sold/currently referenced** revision creates the next immutable revision and advances the current pointer atomically. Editing an unreferenced current revision replaces it in place (optimistic-concurrency guarded); no unchanged-save version churn. Preserve every version referenced by a posted sale; deletion is forbidden after any posted sale.

**bundle_components**: tenant_id, bundle_product_id, revision, component_product_id, display_quantity, display_unit, **quantity_in_component_base_unit** and original unit conversion factor snapshot. Unique (bundle/version/component_product_id); if same product is entered twice with different units, normalize and combine into one row or reject with a clear prompt. Stable display order for editor and receipt details. Never allow circular or nested composition.

**sales_invoice_lines (parent)**: product_id for Bundle, product kind snapshot, sold integer Sets, unit = Set, bundle_revision, independently agreed selling price/discount, full parent total and existing sales identity. Bundle offer/discount applies to the **parent** only.

**sale_bundle_components (immutable sale snapshot)**: tenant_id, invoice_id, parent_sale_line_id, component_product_id, name/SKU/unit snapshots, quantity_per_set_base, total_quantity_base, snapshot of original component conversion, stock sourcing (Own/Negative/Vendor where permitted), lot allocations, serial assignment, warranty/expiry provenance, realized cost or explicit pending-cost state. Foreign keys to historical catalog/lot records are kept when possible; display must work even when catalog entries later change.

**stock_movements / lot allocations:** each consumed component is linked to the parent invoice and parent sale line. The bundle product itself generates **no stock movement**. The combined lot/serial claims of ordinary cart lines and bundles must reconcile exactly once against the same component stock.

**returns / return_component_movements:** reference the original parent line, return quantity in whole Sets, frozen child quantities multiplied by returned Sets, original allocations/serials, and per-component disposition (return to sellable stock versus not restocked). Financial refund/credit references the **parent sale price**, not sum of current component sell prices.

All persisted entities are tenant-scoped. Tenant identity comes only from the authenticated session, not a body/query-supplied tenant_id. Enforce tenant/foreign-key ownership, unique SKU per tenant and no cross-tenant component references.

### 4.2 Rules

1. A V1 bundle requires >=2 distinct **active Stock** products; no Service or Bundle inside Bundle.
2. Each component quantity is finite, strictly positive and representable precisely in its product's smallest inventory base unit. Whole units are mandatory for serial-tracked pieces; weight/length may use supported decimal precision. Do not use unbounded JavaScript floating-point calculations for persisted quantities or cost.
3. A bundle is sold only in positive **whole Sets**. Bundle cannot have alternate package units in V1.
4. A bundle SKU is unique within its tenant; product type cannot be changed later. Archived/inactive components make an existing bundle unavailable for new posting until the recipe is updated, but do not mutate its historical sales.
5. Bundle sell price is independent; cost estimate comes from underlying component unit costs (and can change with lots). No synthetic purchase-price inventory value is added for the bundle.
6. Physical availability is recomputed from each component's **sellable/allocatable stock**, respecting expired lots, existing inventory policies, reservations where supported, and required serial availability. Never infer stock from a bundle's stale product.stock.
7. All posting and returns use the frozen sale snapshot; later edits or unit-conversion changes never alter historic consumed quantities, costs, or warranty terms.

## 5. Availability, cost, discounts and example

For a bundle component i:

- required_base(i, sets) = quantity_per_set_base(i) × sets.
- available_sets = minimum over components of floor(sellable_base(i) / quantity_per_set_base(i)).
- Formula yields whole Sets and assumes normal Own Stock sourcing and no conflicting cart demand. The cart-wide projected sellability subtracts requirements of all other cart lines for the same component.
- If any component is unavailable or inactive, the ordinary Own Stock available-set count is zero.
- Advisory display can read a cached projection, but **the posting command must recompute** under concurrency safeguards.
- Estimated bundle cost per Set = sum(quantity_per_set_base × estimated component cost/base). Exact COGS = sum(actual allocated lot/vendor costs of each consumed component). Unknown Vendor cost is **pending**, never silently zero; profit cannot be displayed as final until resolved.

Example: Package contains PVC Pipe ×3, Socket ×4, Pump ×1. Their sellable balances are 30, 36, 8. Complete sets = min(floor(30/3), floor(36/4), floor(8/1)) = **8 Sets**. Selling 2 Sets from Own Stock consumes 6 Pipes, 8 Sockets, 2 Pumps. Another normal POS line for 5 Pipes in the same cart must be included in the same aggregate capacity check.

A bundle offer affects its parent unit selling price only, and the normal invoice-level discount/rounding/payment flow remains unchanged. Do **not** apply individual component offers again to child consumptions or double-book revenue/tax. No separate component selling-price lines.

## 6. UX and interaction design

### 6.1 Products list and navigation

Products → Add Product presents Stock, Service and **Bundle / Package (প্যাকেজ পণ্য)**. Ordinary products retain the existing dialog. Selecting Bundle opens a compact, full-page **Bundle Editor** within Products, with back/cancel and unsaved-change guard. Keep the Products list filter, search and return context. No new top-level module.

A bundle list row shows product name, Bundle badge, SKU, price per Set, **Available: N Set** (derived), and calculated status. In stock-value reports the bundle's *own* stock value is excluded (show dash / "Components counted separately"). An expandable detail view shows contents and availability. Hide/disable "Adjust stock", "Add stock lot", "Stock lots & serials" and "Opening stock" for a Bundle; these operate on components. Retain Edit, Duplicate, Activate/Deactivate, History and compatible offers with correct permission checks. Show **Delete package** with confirmation only when it has never appeared in a posted invoice. After any posted sale, hide Delete and retain Deactivate. Warn before deactivating a component referenced by active bundles.

### 6.2 Bundle Editor

One clear action: **Save bundle**. Reuse shared Input, Button, ProductCombobox, Quick Add Product, CompoundQuantityInput, numeric increment/decrement, dialogs/popovers, validation and tokens; no second mini-POS cart, nonstandard picker or copied styling.

The upper form holds Name (English; required), Bangla name, unique SKU (generated if blank), optional photo/category and selling price (required). Unit is locked to Set. The central **Included products** section uses compact existing product-search rows, product thumbnail, full name, selected unit, compound quantity, optional available stock and computed cost, remove/reorder controls. Focus sequence follows POS: Add Product → Quantity → next Add Product. Prevent duplicate product rows after base-unit normalization. Unit conversion preserves *requested stock base quantity* unless the user deliberately edits it.

The right/bottom summary shows calculated component cost/Set, parent selling price, indicative margin (or "Cost pending"), and maximum available Sets. This is **read-only** and recalculates with inputs. Avoid forcing unrelated advanced settings. Validation messages sit next to the affected field, and save preserves the full draft if a Quick Add Product modal is opened/cancelled. If a newly created component is selected, return focus to its quantity input and do not lose unsaved bundle rows.

On narrow phones the editor uses a stacked list/card layout with the same controls, full-width search and no horizontal dialog clipping. On tablet portrait stack composition above summary; on sufficiently wide landscape use side-by-side without altering the shared input and cart component family. Preserve the global English + Bangla / full English / full Bangla modes.

### 6.3 POS/quotes/sales display

The existing POS picker searches Bundles by name, বাংলা name, SKU and barcode. Result metadata shows a Bundle icon/badge and derived available Sets. A selected bundle is **one normal POS cart line** with unit Set, integer quantity and editable parent selling price where authorized; optional disclosure "Contains N products" opens read-only details, not six editable cart rows. Focus/Enter chain is unchanged. A quantity change updates all projected component demands; concurrent ordinary lines are included. A shortage dialog identifies which components are short and their amounts.

Drafts, duplicate, quote and online order handoffs preserve the bundle product ID, recipe revision context and agreed parent price; these are **non-posting**, and on conversion/posting availability must be revalidated. If an existing draft refers to an outdated recipe, clearly show changed components and ask to use the current recipe or cancel before posting; never silently substitute a new recipe. An existing **posted** invoice always displays the frozen historical revision.

Printed receipts show package name, Sets, parent price and total as one line. An optional subordinate contents list has quantities only, no component selling prices, default hidden for simple receipts. Sales/Party history opens the same parent invoice with a drilldown to historical contents, component lot/serial/warranty evidence and cost state (permissioned).

## 7. Checkout, shortage, stock and finance posting contract

**Important:** UI preview does not post real accounting or inventory. The following describes the later backend service/transaction contract; no client-side calculation can substitute for this.

1. Client sends a sale command with an idempotency key, parent bundle product ID, chosen bundle revision (or explicit current), whole Set quantity, authorized price override, checkout/payment details and any shortage choices. Component IDs/quantity/prices sent by the client are **not trusted** for inventory posting.
2. Backend authenticates, resolves tenant_id from session, validates product/role/revision, loads versioned composition, and aggregates **all** demand by base product across bundle and ordinary sale lines.
3. Lock stock/lot/serial rows or use an equivalent optimistic concurrency mechanism for the affected tenant/product IDs in stable order. Recompute sellable quantities and reservations; select lot allocations using each component's existing FIFO/FEFO policy; never allocate expired lots.
4. If shortages remain, return a structured **per-component shortage** response. Own Stock choice caps the allowable **whole bundle Sets** before confirmation. Negative Sale requires existing authorization and records an explicit negative movement for missing stock. Vendor sourcing is per short component and must explicitly reference a valid vendor and cost, including null for pending cost; no fabricated vendor cost or hidden liability posting. Existing serial-required constraints still apply: without legitimate serial assignment, prevent posting and give a useful reason.
5. On success, in **one database transaction**, persist the parent sale line, frozen component snapshot, all component inventory/lot/serial moves, source-linked vendor provenance as applicable, sale payment/receivable postings through existing accounting services, audit trail and idempotency result. No separate bundle inventory deduction. Either everything commits, or nothing does.
6. If the same idempotency key is retried, return the original result without duplicate invoice/stock/payment movements. If conflicting parallel sales consume the final stock, only the permitted sale succeeds; the other receives refreshed shortage details.
7. Manual source correction or cancellation of a posted sale must use the existing permission-aware impact/reversal mechanism and reverse its own exact component movements; never directly delete history or recalculate original recipe from today's catalog.

**Availability in UI is informative, not a guarantee.** No "Stock deducted" toast is permitted without a confirmed real posting response.

## 8. Returns, warranty, stock history and reporting

A preview/quote/draft is **not** a posted sale and must not freeze the recipe. The history trigger is a verifiable posted-invoice bundle/version reference, never a button press on the POS sale-preview dialog. Implementations must preserve reference integrity and idempotent invoice registration.

- A return is linked to the original invoice and Bundle **parent line**. Allow returning any positive whole Sets up to the original Set count minus previously returned Sets. Do not provide arbitrary single-component bundle returns in V1.
- Multiply each frozen child quantity by returned Sets. A component can be marked **Restock** or **Do not restock** (damaged, discarded, consumed); check original source and lot/serial evidence, verify serial identity and original ownership. For sourced vendor items do not pretend goods were returned into owned inventory without a real receipt/disposition.
- Reverse/update inventory and any COGS/refund/party ledger effect in the same idempotent, auditable transaction. Refund amount follows actual historical allocated parent sale price/discount, never today's bundle price or component retail totals. Prevent repeated refunds and exceeding returnable Sets.
- Bundle parent may carry a bundle-level warranty label, but component manufacturer/seller warranty and serial snapshots remain attached to corresponding historical components. No invented serials or expired-lot restock.
- Inventory history shows stock movements **on each component**, with source "Bundle sale: [invoice] / [bundle]". Parent bundle history shows the sale and links to each consumption. Bundle itself has no lots and no opening movement.
- Sales reports count one package sale and its revenue once. Stock valuation counts base products once. Gross margin takes actual component cost once; mixed own/vendor sourcing with pending cost must be reported as pending rather than a fake calculated profit. Export respects existing tenant/date filters.

## 9. Cross-module contracts, rollout and compatibility

| Consumer | Required behavior |
| --- | --- |
| Product catalog and import | Bundle is a distinct kind. Ordinary stock CSV importer must not interpret a Bundle as opening inventory or flatten it into stock; implement bundle import only after a separate schema/UX review. |
| POS, Sales and Counter | Same one-line bundle sale and existing payment split, due, rounding and credit behaviors. Counter collects payment against the **invoice**, not component items. |
| Quotations and Online Sales | Show bundles as one non-posting line; validate active composition and stock only when converting to posted sale. |
| Purchases and Vendor | Buy components as normal. A virtual Bundle must not be directly received as one finished-stock product. Component vendor shortage source may use existing explicit vendor workflow. |
| Stock reconciliation | Adjust only component stock and lots. Parent bundle display recalculates availability; no bundle adjustment action. |
| Reports/Daybook/Audit ledger | One revenue source and parent transaction, linked component inventory movements, correct source-aware reversal. No duplicate money entries. |

Rollout order when **implementation is separately approved**: (a) additive domain schema/validation + pure availability helpers; (b) preview catalog/editor, localized labels and bundle listing; (c) POS one-line display plus cart aggregate validation; (d) backend transaction and snapshot integration; (e) full returns/history/reporting/printing parity. Gate production posting on all safety criteria; a catalog-only UI preview must state that it is not live inventory posting. Any backend repo changes require their own source review and plan.

## 10. Errors, security and concurrency

| Situation | Required behavior |
| --- | --- |
| Empty bundle / only one component / zero or invalid quantity | Save blocked with field-level error; keep draft. |
| Duplicate component or stale/inactive component | Merge by base unit or show actionable duplicate/stale message; no ambiguous stock units. |
| Unsupported nested Bundle or Service item | Not selectable as a V1 component. |
| Component depleted/expired/serial unavailable | Show per-component shortage; block normal sale and offer only authorized existing alternative. |
| Same item in separate bundles and normal lines | Aggregate demand by base product; evaluate in one stock transaction. |
| Recipe changed while an unsaved draft is open | Revision conflict with comparison/refresh; no silent recipe swap. |
| Network retry/double Submit/concurrent final-stock sale | Idempotency and locking/optimistic checks; one posted result only. |
| Cross-tenant catalog ID or unauthorized override | Server rejects without leaking product names, quantities or prices. |
| Old SKU/name/unit conversion changed after sale | Historical parent and component snapshots render unchanged. |
| Unknown vendor unit cost | Store explicit pending state, exclude untrusted final profit, resolve through sourced cost workflow. |
| Return into expired or quarantined stock | No automatic sellable restock; require valid disposition. |

## 11. Testing strategy and concrete acceptance gates

Build behavior with TDD when implementation is authorized. This specification itself changes no code.

**Domain/unit tests:** base-unit conversion (Box/Pcs, Gauge/Gira, Pipe/Feet), fractional supported component units versus integer serial units, multi-component availability minimum, zero/expired/inactive stock, no nesting, duplicate merging, independent parent price/offer, virtual inventory excluded from valuation, revision snapshots and unknown-cost profitability.

**Posting/integration tests (backend required):** two complete sets consume exactly 2× each component; ordinary+bundle demand aggregates; FIFO/FEFO lot provenance, serial selection; whole transaction rolls back if one component cannot allocate; negative/vendor sources require permission; vendor cost pending; idempotent retry; parallel last-stock sales; correct invoice/payment/receivable, COGS, full/partial-in-Sets return, refund/no-restock, audit reversal; tenant A cannot see/use tenant B products.

**UI/browser Playwright:** Products add/edit/duplicate/history/activation; full-page editor and nested Quick Add preserves rows and focus; reusable picker search (English/Bangla/SKU), clear (×), arrow navigation/Enter/Escape/outside click; compound quantity increment/decrement (keyboard, mouse and touch), price updates; POS one-line bundle and draft/quote handoffs; receipt preview and optional contents; multi-row payment untouched. Explicitly test **every dropdown, dialog, popover, drawer and modal** opened from bundle flow, including scroll, backdrop, escape and focus return.

**Viewports/themes:** minimum 360×800 phone, 768×1024 tablet portrait, 1024×768 tablet landscape, 1280×800 desktop; touch as well as keyboard, light/dark, bilingual languages, 200% zoom where applicable. Portal popovers must not clip off screen or open beyond viewport, and overlays must allow selecting list items with one Enter/tap (no extra keypress). Numeric controls do not move field text or overlap labels. No monospace digits.

### Release acceptance criteria

1. Creating a bundle with six component quantities, including one compound unit, succeeds with one Save and no extra wizard.
2. Bundle has a standalone SKU, price and Set unit, not independent inventory stock or stock value.
3. Bundle availability equals the minimum complete number of sets across valid stock components.
4. Editing components produces a new revision; old invoices always retain exact old recipe.
5. POS search and keyboard flow add the bundle once with one row and whole-Set quantity.
6. Standard Own Stock sale consumes every component exactly once; no parent stock movement.
7. Cart containing both bundle and ordinary components cannot oversell silently.
8. Shortage and vendor/negative choices use explicit preexisting permissions, stock policy and provenance.
9. Lot, expiry, serial and warranty allocation can be audited per component from invoice history.
10. Parent package price and invoice payments post once; cost/margin accounting has no duplicate/unknown-as-zero errors.
11. Returns of whole Sets restore only eligible underlying components, refund source-correct amounts and never exceed original quantity.
12. Retry/concurrency/tenant isolation tests protect financial and inventory posting.
13. Existing Stock/Service product, purchase, POS and return behavior stays unchanged.
14. Phone/tablet/desktop, dark/light and bilingual keyboard/touch overlay tests pass with no clipped or inert controls.
15. Preview-only screens do not falsely claim live inventory/account postings.

## 12. Decision record and review gate

**Approved design choices carried from discussion:** virtual bundles only in V1; fixed component composition; bundle sold as one product; independent selling price; components deducted at sale; reuse current HisabIQ UI; simple workflow.

**Specification decisions made explicit:** >=2 existing stock components; whole Set sale/return quantities; no nested/service child; separate versioned recipe plus immutable sale component snapshot; lot/serial-aware stock posting; parent-only revenue and component-only COGS; shortfall sourcing per component; full-page Bundle Editor with shared picker/input family; returns use historical snapshots. These are proposed exact semantics for review.

**Review needed before next phase:** User must review and approve **this written document**, including its whole-Set return and shortage policies. Approval of the earlier concept does not approve implementation. After document approval, invoke **Superpowers writing-plans**, prepare a dependency-ordered implementation plan, and seek separate approval of execution method. **No application code, schemas, migrations or production backend actions are authorized by this spec commit.**
