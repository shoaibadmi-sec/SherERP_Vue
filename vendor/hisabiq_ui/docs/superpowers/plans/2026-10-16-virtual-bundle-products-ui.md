# HisabIQ Virtual Bundle Products — UI Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (\`- [ ]\`) syntax for tracking.

**Goal:** Enable a shopkeeper to define fixed-composition virtual package products, view exact component-dependent availability/cost, sell them as one POS preview line, and inspect historical sale/return behavior without falsely claiming real inventory or accounting posting.

**Architecture:** Extend the existing typed product catalog with Bundle identity and immutable recipe revisions inside one product preview-store snapshot. Implement pure component validation, projection and cross-cart demand functions first, then adapt the existing Products workspace and POS V2 picker/cart, receipts, quotes, online handoffs and source-linked Sales views. The user-approved specification additionally requires production-grade atomic inventory/ledger integration; that is a **separate implementation plan** after the real HisabIQ backend repository, schema and posting services can be inspected.

**Tech Stack:** React, TypeScript, Vite, existing shadcn-style primitives and Tailwind tokens, existing Node built-in \`node:test\` + \`assert/strict\`, existing Playwright browser scripts, existing in-memory UI preview stores.

**Spec:** \`docs/superpowers/specs/2026-10-16-virtual-bundle-products-design.md\` — read alongside \`AGENTS.md\`, \`docs/ui/transaction-cart-design-contract.md\`, \`docs/superpowers/specs/2026-10-09-erp-kiss-contextual-workflows-design.md\`.

## User-approved amendment — 2026-10-17

This section **supersedes older per-edit revision assertions in Tasks 2, 4, 5, 8 and 9**:

- **Before a posted sale:** save and edit the same current Bundle revision in place; do not create history on every edit. An unchanged Save is a no-op.
- **After a posted sale referencing the current revision:** the next changed Save creates a new immutable revision, preserving the sold recipe. Further edits of that **unsold** latest revision happen in place. Once that revision sells, the next changed Save creates the next revision.
- **Deletion:** an unsold Bundle may be deleted with confirmation; deletion removes only its catalog/recipe preview records, never component stock. A Bundle ever referenced by a posted sale cannot be deleted even if fully returned; deactivate it instead.
- **Sale evidence:** only a confirmed **posted invoice** with a valid bundle-revision reference freezes a recipe; drafts, quotations, online orders and **POS sale-preview dialogs do not count**. The UI preview store has a testable, idempotent posted-sale-reference contract, but it is **not** the production posting system.
- **Concurrency:** provide an optimistic recipe-token guard for simultaneous unsold edits that share a revision number.
- **Tests:** run `tests/bundleLifecycle.test.ts` and `scripts/bundle-editor-browser.cjs` to prove edit-in-place, sale-triggered history, rejection of sold Delete, allowed unsold Delete, unchanged Save and stale editor behavior. The prior Task 2 test expectation “every edit creates revision 2” is **obsolete**.

## Global Constraints

- V1 **fixed virtual bundles only**: >=2 distinct active Stock components; no nested Bundle, Service, prepacking, assembly, per-sale substitutions or fractional Sets.
- Sale line and printed invoice contain **one parent bundle**, priced independently in Set units; component stock is the only stock authority and only components enter inventory valuation/COGS.
- Base-unit quantities and original compound-unit factors remain intact across recipe revisions, drafts and historical invoice snapshots.
- Reuse actual \`ProductCombobox\`, \`CompoundQuantityInput\`, POS V2 \`CartTable\`, \`NumericInput\`, shared Quick Add, dialogs and theme tokens; never fork a second cart/picker.
- English + Bangla, Full English and Full Bangla, Geist/Hind Siliguri, no monospaced numbers; keyboard Enter/Arrow/Escape, touch, clear (×), light/dark and responsive phone/tablet layouts.
- Retain Stock/Service, Purchasing, Sales and Finance behavior. Bundle **must not** be accepted as a stocked Purchase item or direct inventory-adjustment target.
- **Preview boundary:** no UI-only success message implies that invoice, tenant ledger, customer balance, inventory, vendor source or cost was posted to a real backend.
- **Production boundary:** no implementation, schema or claim of real stock posting until a separately approved source-verified backend plan covers tenant session ownership, atomicity, FIFO/FEFO, serials, historical snapshots, idempotency, returns and financial projection.
- Implementation uses TDD; execute all existing regression gates. Each task is individually reviewable and committed on an isolated execution branch, **not** on \`main\` or the documentation review branch.
- Existing \`npm test\` uses \`node --experimental-strip-types --test tests/*.test.ts\`; browser scripts use the project's Playwright executable/environment and Vite. Avoid adding dependencies unless explicitly justified.

## Review Focus

These are high-risk real inputs implied by the spec; their named tests are explicitly assigned below.

1. A bundle draft opened before its component's Box→Pcs factor or package recipe changes must **never silently acquire a different inventory quantity**: \`tests/bundleValidation.test.ts\`, \`tests/bundlePreviewStore.test.ts\`, \`tests/bundleHandoff.test.ts\`.
2. A cart with two copies of the same component through separate bundles plus a normal product line must show **aggregate** shortage, not individually reassuring availability: \`tests/bundleCart.test.ts\`.
3. Duplicate component selection, nonexistent products, deactivated products, zero and non-finite quantities, or pasted unexpected numeric notation must be rejected **without discarding the editor draft**: \`tests/bundleValidation.test.ts\`, \`scripts/bundle-editor-browser.cjs\`.
4. A previously invoiced bundle whose present-day SKU/name/unit has changed or is inactive must still render original components and **never refund more whole Sets than sold**: \`tests/bundleReturns.test.ts\`, \`tests/bundleDocuments.test.ts\`.
5. Mobile popovers and Quick Add nested inside the bundle editor must support one-tap or one-Enter selection, viewport-aware placement, scroll, Escape, focus restoration and accessible numeric controls: \`scripts/bundle-editor-browser.cjs\` and \`scripts/bundle-pos-browser.cjs\`.

---

## File ownership map (approved UI repository only)

| Unit | Existing file(s) to modify | Focused new file(s) |
| --- | --- | --- |
| Typed contract/validation | \`src/types/erp.ts\` | \`src/bundles/bundleValidation.ts\`, \`tests/bundleValidation.test.ts\` |
| Revisioned preview catalog | \`src/data/productImportPreviewStore.ts\` | \`tests/bundlePreviewStore.test.ts\`, \`src/bundles/usePreviewCatalog.ts\` |
| Read-only availability & costing | \`src/utils/units.ts\` where needed | \`src/bundles/bundleProjection.ts\`, \`tests/bundleProjection.test.ts\` |
| Products editor | \`src/pages/Products.tsx\` | \`src/components/products/BundleEditor.tsx\`, \`scripts/bundle-editor-browser.cjs\` |
| Products list/actions/import | \`src/pages/Products.tsx\`, \`src/components/products/ProductInventoryDialogs.tsx\`, \`src/import/productImport.ts\` | \`tests/bundleCatalog.test.ts\` |
| Picker and POS cart | \`src/components/pos/ProductCombobox.tsx\`, \`src/hooks/usePosCart.ts\`, \`src/components/pos/CartTable.tsx\`, \`src/pages/Pos.tsx\` | \`src/bundles/bundleCart.ts\`, \`tests/bundleCart.test.ts\`, \`scripts/bundle-pos-browser.cjs\` |
| Preview receipt/history | \`src/types/erp.ts\`, \`src/pages/Pos.tsx\`, \`src/pages/Sales.tsx\`, \`src/utils/salesDocuments.ts\` | \`src/bundles/bundleDocuments.ts\`, \`tests/bundleDocuments.test.ts\` |
| Quotes/online handoffs | \`src/quotations/quotePreviewStore.ts\`, \`src/onlineSales/onlineStore.ts\`, \`src/pages/Pos.tsx\` | \`tests/bundleHandoff.test.ts\` |
| Whole-Set return preview | \`src/pages/Sales.tsx\`, \`src/types/erp.ts\` | \`src/bundles/bundleReturns.ts\`, \`tests/bundleReturns.test.ts\` |
| UX/i18n and release gates | \`src/i18n/productsCopy.ts\`, \`src/i18n/productFormsCopy.ts\`, \`package.json\` | \`src/i18n/bundlesCopy.ts\`, browser scripts above |

When individual files have moved on the target execution branch, locate the same current symbols before editing. Preserve other PRs' improvements, especially stock-shortage and mobile overlay handling.

### Task 1: Bundle types and strict composition validation

**Files:**
- Modify: \`src/types/erp.ts:1,52-75,185-204,236-244\`
- Create: \`src/bundles/bundleValidation.ts\`
- Test: \`tests/bundleValidation.test.ts\`

**Interfaces:**
- Add \`'Bundle'\` to \`ProductKind\`; keep existing optional \`Product.kind\` for backwards compatibility.
- Export \`BundleComponent = { productId:string; primaryQty:string; secondaryQty:string; selectedUnit:string; baseQty:number; unitFactorAtSave:number; sortOrder:number }\`.
- Export \`BundleVersion = { bundleProductId:string; revision:number; createdAt:string; components:readonly BundleComponent[] }\`.
- Export \`BundleDraft = { product: Product & {kind:'Bundle';unit:'Set'}; components:readonly BundleComponent[] }\`.
- Produce \`makeBundleComponent(product:Product, selectedUnit:string, primaryQty:string, secondaryQty:string, sortOrder:number):BundleComponent\` and \`validateBundleDraft(draft:BundleDraft,catalog:readonly Product[]):string[]\`.
- Existing \`compoundBaseQuantity\` is calculation reference, but first reject invalid strings rather than interpreting invalid input as 0 or treating \`1e3\` as 1. Limit persisted normalized quantities to the existing supported decimal precision and reject rounding that silently changes intended quantities.

- [ ] **Step 1: Write failing tests.** In \`tests/bundleValidation.test.ts\` assert \`makeBundleComponent(boxProduct,'Box','2','5',0).baseQty === 25\` when \`factor=10\`; \`makeBundleComponent(gaugeProduct,'Gauge','1','12',0).baseQty === 28\` when \`factor=16\`. Assert \`validateBundleDraft\` rejects fewer than 2 distinct products, Bundle/Service children, inactive/missing children, invalid unit, duplicate IDs, zero/negative/NaN/Infinity/scientific-notation quantities and fractional required-serial count. Assert valid two-Stock component draft returns \`[]\`.
- [ ] **Step 2: Run failing tests.** \`node --experimental-strip-types --test tests/bundleValidation.test.ts\` → FAIL because the bundle types/helpers do not exist.
- [ ] **Step 3: Implement types and pure functions.** Preserve decimal precision and conversion factor at recipe save; do not change ordinary product entry math.
- [ ] **Step 4: Run tests.** \`node --experimental-strip-types --test tests/bundleValidation.test.ts && npm run build\` → PASS.
- [ ] **Step 5: Commit.** \`git add src/types/erp.ts src/bundles/bundleValidation.ts tests/bundleValidation.test.ts && git commit -m "feat(bundle): define and validate virtual recipes"\`.

### Task 2: One atomic revisioned UI-preview catalog snapshot

**AMENDED per 2026-10-17 approval:** maintain posted sale references and preserve the *current* revision number on unsold edits. Only changes after a sale of the current recipe create the next revision. No-op Save must not publish a new revision. Add pre-sale deletion and permanent post-sale deletion protection. The older Task 2 wording below is retained for historical context but overridden.

**Files:**
- Modify: \`src/data/productImportPreviewStore.ts:7-23,96-112\`
- Create: \`src/bundles/usePreviewCatalog.ts\`
- Test: \`tests/bundlePreviewStore.test.ts\`

**Interfaces:**
- Add \`bundleVersions:readonly BundleVersion[]\` to \`ProductImportPreviewSnapshot\` with empty initial value. Ensure every \`publish\` path and importer preserves revisions.
- Produce \`getBundleVersion(bundleProductId:string, revision?:number):BundleVersion|undefined\`.
- Produce \`upsertBundlePreview(draft:BundleDraft, expectedRevision:number|null):BundleVersion\`; on creation require \`expectedRevision===null\`, on edit require the latest saved revision, and atomically publish both product + new immutable version in **one** in-memory snapshot. Reject SKU clashes and kind changes. The preview product has \`kind:'Bundle'\`, \`unit:'Set'\`, \`stock:0\`, \`purchasePrice:0\` as non-authoritative fields, \`altUnit:undefined\`, \`minStock:0\`, \`serialTracking:'Off'\`; never create lots/movements.
- Produce \`usePreviewCatalog():readonly Product[]\` using \`useSyncExternalStore(subscribeProductImportPreview,getProductImportPreviewSnapshot)\`, not a new competing singleton.

- [ ] **Step 1: Write failing store tests.** Assert save creates one Bundle product + revision 1 and no lots/movements; edit preserves revision 1 and adds revision 2; wrong \`expectedRevision\` or reused SKU leaves the entire snapshot unchanged; ordinary product import and update preserve all bundle revisions; editing a Stock product into Bundle fails. Include factor-change regression: old revision keeps original \`unitFactorAtSave\`.
- [ ] **Step 2: Run failing tests.** \`node --experimental-strip-types --test tests/bundlePreviewStore.test.ts\` → FAIL.
- [ ] **Step 3: Implement guarded preview-store transition and catalog hook.** Use existing \`publish\` and normalize SKU as current import store does; do not split product and recipe into two separately mutated stores.
- [ ] **Step 4: Verify.** \`node --experimental-strip-types --test tests/bundlePreviewStore.test.ts tests/productImportCommit.test.ts && npm run build\` → PASS.
- [ ] **Step 5: Commit.** \`git add src/data/productImportPreviewStore.ts src/bundles/usePreviewCatalog.ts tests/bundlePreviewStore.test.ts && git commit -m "feat(bundle): version preview compositions with products"\`.

### Task 3: Derived Set availability, cost and status projection

**Files:**
- Create: \`src/bundles/bundleProjection.ts\`
- Test: \`tests/bundleProjection.test.ts\`

**Interfaces:**
- Produce \`getBundleProjection(recipe:BundleVersion, catalog:readonly Product[], lots:readonly StockLot[], now?:Date):{ availableSets:number; estimatedCostPerSet:number|null; limitingProductIds:readonly string[]; issues:readonly string[] }\`.
- Use \`saleAvailableStock\` from \`src/utils/posStock.ts\` and \`productStockBreakdown/availableSerials\` where needed; respect expiry and required-serial availability. Unit cost is only an estimate from \`purchasePrice\`, **not realized COGS**.
- Produce \`bundleInventoryValue(product:Product):number\` that returns zero for Bundle; for ordinary Stock uses \`stock*purchasePrice\`; Service zero.

- [ ] **Step 1: Write failing projection tests.** 30 Pipes/3, 36 Sockets/4, 8 Pumps/1 yields **8 Sets**; inactive component yields zero with reason; expired FEFO lot is not sellable; required serial count constrains Set availability; package product \`stock:999\` never affects availability. Assert independent package price does not change estimated cost and \`bundleInventoryValue(bundle)===0\`.
- [ ] **Step 2: Run failing tests.** \`node --experimental-strip-types --test tests/bundleProjection.test.ts\` → FAIL.
- [ ] **Step 3: Implement pure projection functions.** Do not mutate product stock; make invalid/missing component a blocking issue rather than silently skipping it.
- [ ] **Step 4: Verify.** \`node --experimental-strip-types --test tests/bundleProjection.test.ts tests/posStock.test.ts tests/productFeatures.test.ts\` → PASS.
- [ ] **Step 5: Commit.** \`git add src/bundles/bundleProjection.ts tests/bundleProjection.test.ts && git commit -m "feat(bundle): project component availability and cost"\`.

### Task 4: Full-page Bundle Editor with existing HisabIQ controls

**AMENDED:** editor captures an optimistic `expectedRecipe` token to prevent overwriting another unsold same-revision edit. Action menu supports confirmed Delete only for never-sold packages. Historical number changes are not shown as an extra manual step.

**Files:**
- Create: \`src/components/products/BundleEditor.tsx\`
- Modify: \`src/pages/Products.tsx:181-225,350-397,644-698\`
- Test: \`scripts/bundle-editor-browser.cjs\`

**Interfaces:**
- \`BundleEditor\` props: \`{ initialProduct?:Product|null; catalog:readonly Product[]; onSave:(draft:BundleDraft,expectedRevision:number|null)=>void; onCancel:()=>void }\`.
- Product type selector still lives in Products' existing Add flow (Stock/Service retain \`AddProductDialog\`); selecting Bundle switches to in-module full-page editor, with unsaved-change confirmation.
- Use **existing** \`ProductCombobox\` with \`products={catalog.filter(p=>p.kind!=='Service'&&p.kind!=='Bundle')}\`, existing \`CompoundQuantityInput\`, \`NumericInput\`, \`Input\`, \`Button\`, \`QuickAddSelect\` where needed. A focus-preserving nested Quick Add may reuse the existing create-product dialog; no copied bespoke searchable popover.
- Form: Name, optional বাংলা name, unique SKU, optional photo/category, parent price per Set, fixed ordered child rows, Remove/Reorder, estimated cost/margin and derived Sets. One **Save bundle** primary action. Keep local draft on validation errors and quick-add cancellation.

- [ ] **Step 1: Add failing browser assertions.** \`scripts/bundle-editor-browser.cjs\`: from Products choose Bundle; assert full-page builder, Stock child selection by typing, first Enter selects, quantity gets focus, \`1 Gauge 12 Gira\` is preserved, 6 rows can be added/removed/reordered, save creates catalog row, editor returns to Products. Reject duplicate, inactive and \`0\` quantities while retaining all unsaved fields. Test Quick Add modal cancel/save and focus return.
- [ ] **Step 2: Run failing browser script.** \`node scripts/bundle-editor-browser.cjs\` → FAIL because Bundle Editor is absent. Mirror existing Vite+Playwright harness in \`scripts/product-quick-add-browser.cjs\` rather than a new test dependency.
- [ ] **Step 3: Implement editor and Products view switch.** Save by \`upsertBundlePreview(draft, expectedRevision)\`; derive initial revision from \`getBundleVersion\`. Only draft UI state changes before Save; no stock action.
- [ ] **Step 4: Verify.** \`node scripts/bundle-editor-browser.cjs && npm run build\` → PASS.
- [ ] **Step 5: Commit.** \`git add src/components/products/BundleEditor.tsx src/pages/Products.tsx scripts/bundle-editor-browser.cjs && git commit -m "feat(bundle): build context-complete package editor"\`.

### Task 5: Products list, action permissions, import and valuation safety

**Files:**
- Modify: \`src/pages/Products.tsx:29-60,109-178,313-345,446-550\`
- Modify: \`src/components/products/ProductInventoryDialogs.tsx:64-300\`
- Modify: \`src/import/productImport.ts\`
- Test: \`tests/bundleCatalog.test.ts\`

**Interfaces:**
- Bundle rows show Bundle badge, independent price, \`N Set\` availability from Task 3 and calculated in/out status. Their stock-value cells show "— · components counted separately". \`Products\` summary stock value uses \`bundleInventoryValue\`.
- Product action menu for Bundle has View, Edit, Duplicate, History, Activate/Deactivate, compatible Offers. It **does not** offer Adjust stock, Add stock lot, Stock lots & serials, or opening adjustment; disable direct inventory dialogs defensively as well.
- On bundle duplication create a new product ID/SKU and revision 1 with copied composition; do not alias revision history. When ordinary CSV import attempts \`kind=Bundle\` or accidentally targets an existing Bundle SKU, reject clearly, do not convert it to a stock item.

- [ ] **Step 1: Write failing tests.** Assert valuation of one Stock item plus one Bundle equals the Stock value only; Bundle action eligibility excludes inventory controls; stock-product import cannot mutate an existing Bundle; duplicated bundle is independent and references the correct component list.
- [ ] **Step 2: Run failing tests.** \`node --experimental-strip-types --test tests/bundleCatalog.test.ts\` → FAIL.
- [ ] **Step 3: Implement product list/action/import adaptations** as small helpers inside existing products domain; no global refactor of unrelated products.
- [ ] **Step 4: Verify.** \`node --experimental-strip-types --test tests/bundleCatalog.test.ts tests/productImport.test.ts && npm run check:ui-contract && npm run build\` → PASS.
- [ ] **Step 5: Commit.** \`git add src/pages/Products.tsx src/components/products/ProductInventoryDialogs.tsx src/import/productImport.ts tests/bundleCatalog.test.ts && git commit -m "feat(bundle): surface packages without fictitious inventory"\`.

### Task 6: Shared POS/Product picker offers Bundle as one sellable product

**Files:**
- Modify: \`src/components/pos/ProductCombobox.tsx:14-43,48-60,180-301\`
- Modify: \`src/pages/Pos.tsx:15-49,129-265\`
- Modify: \`src/hooks/usePosCart.ts:1-130\`
- Test: \`scripts/bundle-pos-browser.cjs\`

**Interfaces:**
- \`usePreviewCatalog\` feeds actual preview Products to POS and existing picker with no seeded-list fork. \`ProductCombobox\` sale/quotation/online display Bundle as a searchable item with Set price, derived Set availability and a "Bundle" badge; \`mode='purchase'\` excludes Bundle and Service.
- Extend \`CartLine\` with \`bundleRevision?:number\` and \`bundleSources?:Record<string,SaleStockSource>\`, preserving all current fields. On selecting a Bundle, capture \`getBundleVersion(id)?.revision\` **once**.
- Existing \`CartTable\` uses quantity in integer Set units for Bundle, single row, standard editable parent price and read-only "Contains N products" disclosure; **never** render child components as purchasable/editable POS rows. Preserve standard Enter → Qty → Add Product focus.

- [ ] **Step 1: Write failing browser tests.** Search PKG-001 or Bangla name, use arrows/Enter and one tap, verify one Bundle cart row at selected price, Set quantity rejects \`1.5\`, line detail lists component names but component children do not become cart lines. Purchase search excludes Bundle.
- [ ] **Step 2: Run failing test.** \`node scripts/bundle-pos-browser.cjs\` → FAIL.
- [ ] **Step 3: Extend existing shared picker/cart and POS catalog input.** Do not rework purchase/quotation cart markup or create new picker.
- [ ] **Step 4: Verify.** \`node scripts/bundle-pos-browser.cjs && npm run check:ui-contract && npm run build\` → PASS.
- [ ] **Step 5: Commit.** \`git add src/components/pos/ProductCombobox.tsx src/pages/Pos.tsx src/hooks/usePosCart.ts src/components/pos/CartTable.tsx scripts/bundle-pos-browser.cjs && git commit -m "feat(bundle): add one-line package selection to POS"\`.

### Task 7: Aggregate stock demand and per-component shortage preview

**Files:**
- Create: \`src/bundles/bundleCart.ts\`
- Modify: \`src/components/pos/CartTable.tsx\`
- Modify: \`src/pages/Pos.tsx:270-390\`
- Test: \`tests/bundleCart.test.ts\`
- Test: \`scripts/bundle-pos-browser.cjs\`

**Interfaces:**
- Produce \`expandCartStockDemand(lines:readonly CartLine[], catalog:readonly Product[], recipeFor:(bundleProductId:string,revision:number)=>BundleVersion|undefined):{ demands:readonly {sourceLineKey:string;componentProductId:string;requiredBaseQty:number}[]; errors:readonly string[] }\`.
- Produce \`projectCartShortages(demands:readonly {sourceLineKey:string;componentProductId:string;requiredBaseQty:number}[],catalog:readonly Product[],lots:readonly StockLot[]):readonly {componentProductId:string;requiredBaseQty:number;availableBaseQty:number;shortageBaseQty:number}[]\` that aggregates by **component product ID across all lines**, not one Bundle at a time.
- Bundle shortage UI reuses the existing \`StockShortageDialog\` for a selected component and existing Own/Negative/Vendor semantics; source selection maps to the specific bundle component. **Own** can lower **whole Sets only**. Unresolved deficits block preview completion; the UI must not auto-authorize negative or vendor sources.
- \`Pos.complete\` must not pass Bundle parents directly into \`allocatePosStock\` as ordinary stock, and must never infer stock from Bundle.product.stock.

- [ ] **Step 1: Write failing demand tests.** Bundle A uses 3 Pipes, Bundle B uses 2 Pipes and normal line uses 5 Pipes: one of each requires 10; with 9 sellable Pipes expect shortage 1 despite each bundle individually appearing in stock. For 2× Bundle A assert 6 Pipes. Assert expired component, outdated revision and missing component fail gracefully. Assert noninteger Sets rejected.
- [ ] **Step 2: Run failing tests.** \`node --experimental-strip-types --test tests/bundleCart.test.ts\` → FAIL.
- [ ] **Step 3: Implement pure demand helpers and adapt existing shortage dialog** as a component-specific wrapper; preserve correct per-component source/serial/lot concerns and current \`allocatePosStock\` for ordinary items. Mark preview-only confirmation as "Sale preview", not "Stock deducted".
- [ ] **Step 4: Verify.** \`node --experimental-strip-types --test tests/bundleCart.test.ts && node scripts/bundle-pos-browser.cjs && node --experimental-strip-types --test tests/posStock.test.ts\` → PASS.
- [ ] **Step 5: Commit.** \`git add src/bundles/bundleCart.ts src/components/pos/CartTable.tsx src/pages/Pos.tsx tests/bundleCart.test.ts scripts/bundle-pos-browser.cjs && git commit -m "feat(bundle): validate aggregate component stock demand"\`.

### Task 8: Immutable sale preview snapshot and one-line receipt

**Files:**
- Modify: \`src/types/erp.ts:185-244\`
- Create: \`src/bundles/bundleDocuments.ts\`
- Modify: \`src/pages/Pos.tsx:30-46,270-390,600-709\`
- Modify: \`src/utils/salesDocuments.ts\`
- Test: \`tests/bundleDocuments.test.ts\`

**Interfaces:**
- Export \`BundleSaleSnapshot = {bundleRevision:number; components:readonly {productId:string;name:string;sku:string;baseQtyPerSet:number;totalBaseQty:number;unit:string;unitFactorAtSale:number;lotAllocations?:readonly {lotId:string;quantity:number}[];serials?:readonly string[];unitCost?:number|null}[]}\`.
- Add optional \`bundleSnapshot?:BundleSaleSnapshot\` to \`SaleLine\`. \`createBundleSaleSnapshot(line:CartLine, recipe:BundleVersion, catalog:readonly Product[]):BundleSaleSnapshot\` uses frozen quantities, names and unit conversion snapshots. Historical costs and serial allocations are **unknown until backend posting**; do not fabricate them in UI preview.
- Add \`bundleContentsForReceipt(line:SaleLine):readonly {name:string;quantityLabel:string}[]\`; keep main receipt with **one** parent line and optional subordinate quantity-only contents. Bundle revenue remains the parent \`SaleLine.total\` alone.

- [ ] **Step 1: Write failing document tests.** Create 2 Set sale snapshot and assert each component's \`totalBaseQty\` is doubled. Change the live product name, price and current recipe after snapshot; assert rendered historical contents and original factor remain unchanged. Assert generated receipt has one chargeable parent line, optional contents have no component price, and no invented lot cost/serials.
- [ ] **Step 2: Run failing tests.** \`node --experimental-strip-types --test tests/bundleDocuments.test.ts\` → FAIL.
- [ ] **Step 3: Add snapshot mapping to POS **preview** and shared receipt projection.** Explicitly show "Preview only — no stock or ledger posted". Keep regular sale receipts identical.
- [ ] **Step 4: Verify.** \`node --experimental-strip-types --test tests/bundleDocuments.test.ts tests/transactionCartParity.test.ts && npm run build\` → PASS.
- [ ] **Step 5: Commit.** \`git add src/types/erp.ts src/bundles/bundleDocuments.ts src/pages/Pos.tsx src/utils/salesDocuments.ts tests/bundleDocuments.test.ts && git commit -m "feat(bundle): snapshot components for one-line sale preview"\`.

### Task 9: Version-aware drafts, quotations and online handoffs

**Files:**
- Modify: \`src/types/erp.ts:236-254\`
- Modify: \`src/pages/Pos.tsx:50-127,189-270,410-465\`
- Modify: \`src/quotations/quotePreviewStore.ts\`
- Modify: \`src/onlineSales/onlineStore.ts\`
- Test: \`tests/bundleHandoff.test.ts\`

**Interfaces:**
- Add \`bundleRevision?:number\` to existing \`SalePresetLine\`, \`QuoteLine\`, \`OnlineOrderLine\`; keep standard totals and discounts.
- Produce \`validateBundleHandoff(productId:string, savedRevision:number, latest:BundleVersion|undefined):{ok:boolean; reason?:string}\`; when revision mismatches, require deliberate user acknowledgement and comparison, not silent recipe update. Do not accept a stale component inventory command at checkout.
- POS draft/save/restore, duplicate invoice, quote→order→POS all preserve Bundle Set quantity, parent price and revision. Source invoice *display* uses historical \`bundleSnapshot\`; new duplicate sale requires a deliberate latest-vs-original recipe choice.

- [ ] **Step 1: Write failing tests.** Quote with 2 Set and revision 1 keeps amount, saves and reopens; online handoff preserves revision; updating recipe to revision 2 causes a mismatch requiring user confirmation, not silent price/component rewriting. Verify ordinary Stock/Service lines still hand off unchanged.
- [ ] **Step 2: Run failing tests.** \`node --experimental-strip-types --test tests/bundleHandoff.test.ts\` → FAIL.
- [ ] **Step 3: Thread optional revision through existing stores and conversion helpers.** Add one context-complete review/confirm surface using existing Dialog; neither quote nor online draft modifies stock/cash.
- [ ] **Step 4: Verify.** \`node --experimental-strip-types --test tests/bundleHandoff.test.ts tests/transactionCartParity.test.ts && npm run build\` → PASS.
- [ ] **Step 5: Commit.** \`git add src/types/erp.ts src/pages/Pos.tsx src/quotations/quotePreviewStore.ts src/onlineSales/onlineStore.ts tests/bundleHandoff.test.ts && git commit -m "feat(bundle): preserve recipe revisions across non-posting handoffs"\`.

### Task 10: Sales source detail, whole-Set return eligibility and audit preview

**Files:**
- Create: \`src/bundles/bundleReturns.ts\`
- Modify: \`src/pages/Sales.tsx:91-104,229-350,725-770,880-952,1170-1260\`
- Modify: \`src/utils/salesDocuments.ts\`
- Test: \`tests/bundleReturns.test.ts\`
- Test: \`tests/bundleDocuments.test.ts\`

**Interfaces:**
- Produce \`bundleReturnEligibility(line:SaleLine, alreadyReturnedSets:number, requestedSets:number):{ok:boolean;remainingSets:number;issues:readonly string[]}\`.
- Produce \`previewBundleReturnComponents(snapshot:BundleSaleSnapshot, returnedSets:number, originalSoldSets:number):readonly {productId:string;returnBaseQty:number}[]\`.
- Sales invoice detail shows historical frozen component quantities and any actual provenance present; clicking Return supports only positive **whole Sets**, never more than sold minus already returned. A preview displays Restock/Do not restock decisions for each component but **must not claim these stock movements took place** in the current UI-only Sales store.
- For bundled line cost/margin in UI, show "Cost pending" until actual allocated component costs exist; do not apply the parent's \`purchasePrice:0\` as COGS or show fake 100% margin.

- [ ] **Step 1: Write failing tests.** For an invoice of 3 Sets, returned 1, request 2 succeeds but request 3 or \`0.5\` fails. One valid returned Set yields precisely one recipe's component base quantities. A changed live catalog does not change return plan; no-restock component is not represented as sellable inventory movement. Missing historical snapshot blocks component return safely.
- [ ] **Step 2: Run failing tests.** \`node --experimental-strip-types --test tests/bundleReturns.test.ts tests/bundleDocuments.test.ts\` → FAIL on new test(s).
- [ ] **Step 3: Implement pure eligibility/preview functions and adapt the existing Sales detail/return UI.** Do **not** invent a real stock reversal or a new financial posting API; retain existing ordinary sales-return demo behavior without implying bundle inventory restoration.
- [ ] **Step 4: Verify.** \`node --experimental-strip-types --test tests/bundleReturns.test.ts tests/bundleDocuments.test.ts && npm run build\` → PASS.
- [ ] **Step 5: Commit.** \`git add src/bundles/bundleReturns.ts src/pages/Sales.tsx src/utils/salesDocuments.ts tests/bundleReturns.test.ts tests/bundleDocuments.test.ts && git commit -m "feat(bundle): preview historical whole-set returns safely"\`.

### Task 11: Bilingual copy, responsive overlays and full regression gate

**Files:**
- Create: \`src/i18n/bundlesCopy.ts\`
- Modify: \`src/i18n/productsCopy.ts\`, \`src/i18n/productFormsCopy.ts\`, \`src/components/products/BundleEditor.tsx\`
- Modify: \`scripts/bundle-editor-browser.cjs\`, \`scripts/bundle-pos-browser.cjs\`
- Modify: \`package.json\` (scripts only, no dependencies)

**Interfaces:**
- Produce \`bundleLabel(language:UiLanguage,english:string):string\`, translated ordinary-shop wording: Bundle/Package · প্যাকেজ পণ্য, Included products · প্যাকেজের পণ্য, Available Sets · যত সেট বিক্রি করা যাবে, Stock shortage · পণ্য কম আছে, Cost pending · কেনা দাম বাকি. English-only/বাংলা-only modes obey existing \`uiText\` conventions.
- Add \`test:bundles\` script that runs named bundle unit tests and editor/POS browser coverage (browser scripts launch Vite themselves).
- Use shared portal positioning and controls. Matrix **360×800, 390×844, 768×1024 portrait, 1024×768 landscape, 1280×800 desktop**, light/dark and 3 language modes; preserve one Enter/tap selection without offscreen/clipped menus. Validate number increment/decrement alignment and parent editor scroll after a nested dialog.

- [ ] **Step 1: Extend failing browser assertions.** For each viewport/theme/language, test product select popup opens within viewport, nested Quick Add close/return focus, Escape/outside dismissal, searchable clear ×, keyboard Up/Down/Enter, no body horizontal overflow, cart contains one bundle, price/quantity controls remain aligned. Run with existing \`playwright\` harness.
- [ ] **Step 2: Verify red.** \`node scripts/bundle-editor-browser.cjs && node scripts/bundle-pos-browser.cjs\` → FAIL on untranslated text or missing cases.
- [ ] **Step 3: Add copy, fixes and test script.** Avoid new hardcoded popover CSS if the shared primitive already solves placement; document any changed selector in browser tests.
- [ ] **Step 4: Verify green and full gate.** \`npm run test:bundles && npm test && npm run check:ui-contract && npm run lint && npm run build\` → PASS. Also run \`node scripts/deep-product-overlay-browser.cjs\` and existing POS responsive/product quick-add scripts; attach Playwright screenshots/results to PR.
- [ ] **Step 5: Commit.** \`git add src/i18n/bundlesCopy.ts src/i18n/productsCopy.ts src/i18n/productFormsCopy.ts src/components/products/BundleEditor.tsx scripts/bundle-editor-browser.cjs scripts/bundle-pos-browser.cjs package.json && git commit -m "test(bundle): prove bilingual mobile overlay and cart parity"\`.

### Task 12: Production backend handoff and hard go/no-go review

**Files:** Read-only verification against \`docs/superpowers/specs/2026-10-16-virtual-bundle-products-design.md\`; final PR description, test evidence and a separate backend plan **after source is available**. No fake backend file paths in this UI-only plan.

**Interfaces:** Produce a reviewed handoff mapping the UI contracts (\`BundleDraft\`, \`BundleVersion\`, \`BundleSaleSnapshot\`, per-component shortage and return intent) to the **actual** NestJS/repository-adapter/API/DB modules only after retrieving the right backend repository, schema and source. Do not promote UI preview events to stock or ledger posting.

- [ ] **Step 1: Write a reviewer checklist/test matrix** in the implementation PR description covering each spec release criterion, with \`UI preview verified\`, \`Backend required\` or \`Not implemented\` status; explain explicitly why UI checkout is not durable posting.
- [ ] **Step 2: Run full test and screenshot gates** from Task 11, plus a manual desktop/tablet/phone comparison with approved Magic Patterns/POS cart. A reviewer must verify no visual duplicate product picker/cart, no inert overlay controls and no invented accounting success messages.
- [ ] **Step 3: Confirm implementation PR diff** contains only the intended bundle-UI scope, with all tasks committed individually, accessibility reviewed and required CI checks green; do not merge without the user's explicit approval.
- [ ] **Step 4: Source-verify real HisabIQ backend** by locating its authorized repository and existing actual product, inventory, serial, lot, sales, settlement, return and tenant auth modules. If inaccessible, mark backend as **BLOCKED** rather than guessing endpoints/files.
- [ ] **Step 5: Obtain a separate backend design/implementation plan and approval.** It must use actual file paths, exact service signatures, migrations and transaction-boundary tests for atomic multi-component allocation, FIFO/FEFO/serial, vendor cost pending, concurrent last-stock sales, idempotent retry, immutable historical snapshots, whole-Set returns, real COGS and tenant isolation. **Production-ready V1 is not complete until that backend plan is implemented and integrated.**

## Execution order, dependency diagram and checkpoints

\`\`\`text
1 Types/Validation
       ↓
2 Versioned Preview Store → 3 Availability/Cost
       ↓                          ↓
4 Bundle Editor          →       5 Product Catalog
       ↓                          ↓
6 Shared Picker/POS Cart → 7 Aggregated Stock Shortage
       ↓                          ↓
8 Sale Snapshot/Receipt → 9 Draft/Quote/Online Handoffs
       ↓                          ↓
10 Sales Return Preview → 11 Full UX/Regression Gate
                                  ↓
                        12 Backend Handoff / Go-No-Go
\`\`\`

Each task must satisfy its own red/green test cycle and commit before a new task begins. Reviewer may reject a task while leaving previously approved boundaries intact; do not merge any implementation PR automatically.

## Self-review: specification coverage and known separation

- **Covered by UI tasks:** new Bundle catalog type; validation; revision snapshots; compound quantities; availability/cost projection; independent Set selling price; Products full-page editor; stock-value exclusion; familiar POS picker/cart; aggregate shortage and existing authorized source UX; stable receipts; drafts/quote/online handoffs; historical display; full-Set return eligibility/preview; translations and regression matrix.
- **Intentionally NOT implementable from this repository alone:** authenticated tenant-scoped storage, durable inventory/lot/serial mutation, vendor fulfillment posting, atomic sale+payment+ledger writes, COGS finalization, real reversals/returns and idempotency/concurrency enforcement. Task 12 makes these blocking production release criteria and starts a **separate** source-verified plan when the correct backend becomes available.
- **Safety:** no demo action can state or suggest financial/stock posting occurred; UI projections are advisory and can't authorize real sales. Keep this distinction in labels/tests.
- **Type consistency:** Task 1 owns \`BundleComponent\`, \`BundleVersion\`, \`BundleDraft\`; Task 2 owns \`getBundleVersion\` and \`upsertBundlePreview\`; Task 3 owns \`getBundleProjection\`; Task 7 owns \`expandCartStockDemand\` and \`projectCartShortages\`; Task 8 owns \`BundleSaleSnapshot\`; Task 10 owns whole-Set return helpers. All callers use these names exactly.
- **Review Focus mapping:** revision factor changes → Tasks 1/2/9; shared short inventory → Task 7; invalid/duplicate selections and retained draft → Tasks 1/4; historical rename/over-return → Tasks 8/10; nested overlay on small devices → Tasks 4/6/11.
- **Scope audit:** user approved spec, **not** this implementation plan or execution method. No product code has been changed while writing this plan.

## Plan review and execution-method gate

User must review this plan, confirm its UI-preview-first limitation and separately choose **Subagent-driven** (fresh implementer plus reviewer per task, recommended for 12 dependent high-risk tasks) or **Native** (one implementer sequentially, independent full-branch review at end). No implementation may start merely because the earlier design spec was approved.
