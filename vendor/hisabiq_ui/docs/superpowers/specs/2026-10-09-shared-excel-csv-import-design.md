# Shared Excel/CSV Import Center — UI/UX Design Specification

**Date:** 2026-10-09  
**Status:** Detailed design **approved on 2026-10-09** (Products, Customers, Suppliers, opening stock, opening balances); implementation plan pending separate review  
**Repository:** `shuvodelux-commits/hisabiq_ui` — UI/UX only, using the existing Magic Patterns design language and shadcn-style components  
**Production project:** HisabIQ is separate; the UI repository must not be represented as production accounting code  
**Principle:** KISS — simple on the surface, correct and auditable underneath.

## 1. Intent and success criteria

Help a Bangladesh shopkeeper migrate from Excel, CSV, an older ERP or paper records into HisabIQ **without retyping hundreds of products and parties**. The user can download a Bengali-friendly template, upload an `.xlsx` or UTF-8 `.csv`, map source headings, inspect valid and invalid data, resolve duplicates safely, and explicitly confirm which data enters the UI preview.

Three entry points share one workflow:
- **Products > Import**: product identities, units, prices, categories/brands, minimum stock, **dated opening stock lots**.
- **Parties & Ledger > Import Customers**: Customer-role people and their independently dated **opening ledger balances**.
- **Parties & Ledger > Import Suppliers**: Supplier-role people and their independently dated **opening ledger balances**.

A single Party can hold both Customer and Supplier relationships. Never silently merge people, add a role, change posted transactions, replace opening balances or overwrite existing stock.

Success in the **current UI-only stage** means an interactive, responsive import journey with coherent in-memory preview behavior and working input/validation, not a backend migration. The interface must always disclose that the preview does not persist after refresh and is not a real tenant posting.

## 2. Baseline reviewed / integration constraints

- `src/components/parties/PartyImportDialog.tsx` and `src/utils/partyImport.ts`: existing CSV-only Party upload, fixed columns `name,nameBn,phone,area,roles`, 1 MB preview limit, 5,000 data rows, basic validation and accepted/rejected list. Preserve legacy functionality while moving to shared import UI.
- `src/pages/Parties.tsx`, `src/data/partyPreviewStore.ts`: canonical in-memory Party identity and auditable sources; `create-party`, `update-party`, and `set-opening` commands support relationship-scoped opening balances. Reuse these semantics. Do not write directly into derived `Party.balance`.
- `src/utils/partyOpening.ts`: one active opening per relationship, date no later than first recorded transaction, corrections preserve old sources as Reversed, money-account movement zero, customer opening credit **not automatically refundable**.
- `src/types/erp.ts`: `Product` stores a base unit, optional larger-unit conversion factor, `sellPrice`/`purchasePrice` per base unit, `stock` and `minStock` in base units, `stockViewUnit`; `StockLot` records `source:'Opening'`, cost, date, batch, expiry and serials. `PartyRole` includes Customer and Supplier (among others).
- `src/components/products/AddProductDialog.tsx`, `src/utils/productEntry.ts`: conversion and price-unit behavior, warranty/serial/expiry settings, opening-stock serial requirements; import rules must agree with manual entry.
- `src/pages/Products.tsx`: Add Product currently synchronizes product list, an Opening stock lot and an Opening movement through **page-local state**, while `src/data/erpDemoStore.ts` also stores created product records. The importer must use a **single batch-apply adapter** that updates the same preview projections coherently, not push products into one array and omit lots/movements. This is a targeted seam, not a second inventory engine.
- `src/components/AppSelect.tsx`, `src/components/AppDateRangePicker.tsx`, `src/components/QuickAddSelect.tsx`, `src/components/Dialog.tsx`, `src/components/Table.tsx`: reuse for keyboard/touch, dark/light theme, Bangla helpers.
- `.github/workflows/ui-check.yml` and `scripts/*-browser.cjs`: Node tests, Vite build and Playwright browser regressions; add dedicated import coverage rather than replacing existing tests.
- Existing Products "Export" action is toast-only. Its current behavior must not be described as an actual download; providing **real import templates** is in this scope, while full data export is a separate feature.

## 3. Approach and architectural decision

**Chosen: one shared four-step wizard with two typed domain adapters.**

Alternatives considered:
1. Three separate forms: easiest at first, but duplicates file reading, mapping, validation and accessibility.
2. One upload button that immediately creates records: faster to code, but unsafe for duplicate people, unit conversion and opening stock.
3. **Shared wizard + Product/Party domain adapters (selected)**: file handling and UI stay consistent, while distinct product inventory and Party ledger posting rules remain isolated.

A shared import parser must not know the details of customer credit or stock lots. Domain validators must not parse Excel files.

Conceptual flow:

```text
Entry point (Products / Customers / Suppliers)
  -> File reader (UTF-8 CSV or .xlsx; sheet selection)
  -> Normalized tabular rows (raw values retained as text when appropriate)
  -> Column mapping (field schema for selected type)
  -> Domain validation + existing-record match suggestions
  -> Editable row decisions / dry-run projection
  -> Confirm batch
  -> Domain apply adapter -> existing preview product+lot+movement OR Party+opening sources
  -> Final result and downloadable rejected-row report
```

UI code may use a well-maintained, browser-compatible XLSX parser loaded **only when an Excel file is selected**. No dependency selected by this design alone. Do not execute workbook formulas or fetch workbook links; preserve string cell representations for phone and SKU wherever possible.

## 4. Information architecture and entry points

- Products list: add secondary `Import` action beside Add Product; preserve the existing Export action (do not confuse it with the new template download).
- Parties & Ledger: current `Import CSV` becomes `Import`, opening a **Customer** or **Supplier** import context based on the selected role/filter. For an ambiguous "All" view, show a small Customer/Supplier selector first. Preserve the ability to import Party roles through the shared adapter, but v1 templates are **Customer** and **Supplier** separately.
- Shared title: `Import products / Import customers / Import suppliers`, with smaller Bangla helper.
- Responsive presentation: desktop dialog up to a comfortable wide size (or full-screen import overlay for table review); mobile full-height scrollable stepper. Do not force horizontal scrolling of the full app on small screens.
- Four visible steps: **1 Upload → 2 Map columns → 3 Review & resolve → 4 Finish**. Back is permitted without losing selections. A new upload discards only the staged import, never applied data.

### Upload step

- Separate `Download Excel template`, `Download CSV template`, `View example` controls **that actually create files**.
- Dropzone plus keyboard-accessible file picker; accepts `.xlsx` and `.csv` only; clear error for `.xls`, `.xlsm`, corrupt archives, oversized files, unsupported encoding, no data.
- Display file name, size, detected rows and (for Excel) selectable worksheet. Default to first non-empty worksheet, but allow another; no implicit mixing of multiple sheets.
- Suggested v1 preview limits: CSV **1 MB** (matches existing) and XLSX **5 MB**, both **5,000 data rows max**. Reject excess rather than silently truncating. A larger backend batch-import capability is deferred.
- UTF-8 CSV with optional BOM, quotes, embedded comma/newline; Bangla headers and content. Distinguish CSV text from Excel numbers, preserving phone and SKU zeros. If spreadsheet has already lost leading phone zeros, flag it for explicit correction; do not guess digits.

### Map columns step

- Show 5–10 original rows (read-only sample) and a compact mapping grid: **HisabIQ field ← source heading** dropdown.
- Autodetect unambiguous English aliases (`name`, `product_name`, `customer_name`, `phone`, `mobile`, `purchase_price`) and a defined set of Bangla aliases; never silently pick between two ambiguous headings.
- Required fields clearly marked; unmapped optional fields default according to domain rules. No duplicates where two source columns map to the same target field.
- Mapping edits trigger a complete new validation; they never mutate the live preview.
- V1 supports template files plus third-party spreadsheets with explicit mapping. A saved column-mapping preset is deferred.

### Review & resolve step

- Summary metrics: **Ready**, **Duplicates**, **Errors**, **Skipped**; unique row number from source file/sheet.
- Compact table desktop; expandable cards mobile; fields, proposed normalized values, amount/quantity conversions, status, warning and action per row. Search/filter `All / Ready / Duplicate / Errors / Skipped`.
- Inline fix for mapped values and classification only **inside the staged import**, using existing Input/Select/date components and original row-number context.
- Explicit duplicate actions per row: `Skip` (default), `Update allowed master fields` (Product only), `Add missing role to matched Party` (Party only), `Create separately` **only if no strong-identifier collision**, with mandatory confirmation. One `Apply action to similar rows` bulk control can be added only for unambiguous cases.
- Preview shows original value, converted value, selected action, effect on stock or Party ledger, and error text. Duplicate detection and preview counts recompute after edits.
- `Confirm import` includes actionable counts and a second clear warning for any opening stock/balance being created. No enabled "Import" when nothing valid is selected.

### Finish step

- Show actual preview result counts: Created, Master-field Updated, Role Added, Opening Sources Created, Opening Stock Lots Created, Skipped, Rejected.
- Working `Download error report (.csv)` with source row, field, reason and original values, CSV formula-safe quoting; `Import another file` and `View products/parties`.
- Success copy says **"Added to UI preview (not saved to server)"**; never say subscription tenant database, server posting or financial settlement succeeded.

## 5. Product template — one row per new product

| Field (machine heading) | Required | Semantics |
| --- | --- | --- |
| `name` | Yes | English/product name; Bangla name may also fill this if no English name |
| `nameBn` | No | Bangla display name |
| `sku` | Recommended | Treat as **text**; must be unique; if missing, preview a generated unique SKU before confirmation |
| `kind` | No | Stock (default) or Service |
| `category`, `brand` | No | Existing values or explicitly confirmed new taxonomy terms |
| `baseUnit` | Yes for Stock | Smallest tracked unit (Pcs, Gira, Feet, Kg) |
| `largeUnit`, `conversionFactor` | Paired optional | E.g. Box / 10; Gauge / 16; factor > 0, finite |
| `stockViewUnit` | No | Either base or configured large unit |
| `purchasePrice`, `purchasePriceUnit` | Optional | Purchase price in selected unit; convert to base unit |
| `sellingPrice`, `sellingPriceUnit` | Yes for import | Selling price in selected unit; convert to base unit |
| `largeUnitSellingPrice` | No | Optional explicit alternative-unit selling price |
| `minimumStock`, `minimumStockUnit` | No | Quantity converted to base unit |
| `openingStock`, `openingStockUnit` | No | Nonnegative qty; zero = no opening lot |
| `openingDate`, `openingUnitCost`, `openingCostUnit` | Conditional | Opening lot date and cost; explicit cost independent of selling price |
| `batchNumber`, `manufactureDate`, `expiryDate` | No | Lot metadata; validate chronology and expiry policy |
| `serialTracking`, `serialNumbers` | No | Off/Optional/Required; unique serial list with exact count for Required |
| `warrantyDuration`, `warrantyDurationUnit`, `warrantyType` | No | Optional matching manual product-entry warranty fields |

Do **not** imply photos are imported from arbitrary spreadsheet image URLs. Product photo attachment import is outside v1. Optional fields beyond these can remain for manual editing.

**Pricing example:** `baseUnit=Pcs; largeUnit=Box; conversionFactor=10; purchasePrice=1200; purchasePriceUnit=Box` yields `purchasePrice=120` per Pcs in the internal product model. Similarly `1 Gauge = 16 Gira` is handled without making a merchant calculate unit rates. Show both entered and normalized values at review. `largeUnitSellingPrice` is intentionally independent of calculated `sellPrice × factor`.

**Quantity and valuation:** `openingStock=2; openingStockUnit=Box` becomes 20 Pcs, with one Opening `StockLot` and one Opening `StockMovement` at `openingDate`. Lot `unitCost` uses the explicitly entered opening cost if supplied, otherwise the normalized purchase price, with the applied fallback visible. Never convert that lot into a purchase payment. Reject non-finite, negative or fractional invalid quantities, unsupported units, zero conversion factor, missing required tracking serials, duplicate serials or missing required expiry. No automatic stock addition when updating an existing Product.

**Services:** cannot import opening stock, inventory minimums, serials, stock lot details or alternate-unit inventory. Unsupported populated fields are errors/warnings that the user must resolve; never quietly post stock for a Service.

**Precision:** use the existing `toBaseQuantity` and `toBasePrice` definitions as the behavioral reference; validate conversions with controlled rounding and display the resulting base rates. Accumulated inventory quantity/cost must not drift due to repeated conversion; money at transaction boundaries uses consistent currency precision.

## 6. Customer and Supplier templates

Both are Party identity imports; a Customer/Supplier distinction is a **relationship**, not a separate person table.

| Field | Notes |
| --- | --- |
| `name` | Required |
| `nameBn` | Optional Bangla name |
| `phone` | Optional; text (e.g. `017...`), not Excel numeric formatting |
| `area` / `address` | Optional |
| `partyId` | Optional explicit matching identifier for known records |
| `openingAmount` | Optional nonnegative decimal, at most two fractional digits |
| `openingDirection` | Required if amount > 0; values `Dr` or `Cr`, with contextual Bengali descriptions |
| `openingDate` | Required if amount > 0; real date not in future and not later than an existing transaction for that relationship |
| `openingNote` | Optional, for the original paper ledger reference |

Preselection:
- Customer import creates or adds **Customer** role. Default usual direction: `Dr` = customer owes the shop; `Cr` = shop owes customer.
- Supplier import creates or adds **Supplier** role. Default usual direction: `Cr` = shop owes supplier; `Dr` = supplier owes shop (advance).
- **Never infer the accounting direction from the sign of a number.** User/template explicitly chooses direction. An amount of zero creates no source.
- A multi-role Party gets separate opening sources, not one consolidated signed balance.
- Imported opening credits are `legacy-unverified` and are **not cash-backed refundable credit**. There is no cash/bank movement.

When matching a Party by explicit `partyId` (or detecting possible phone match), show a clear identity comparison. Phone is **suggestive**, not a guaranteed unique ID. Same phone/name never silently merges. For an existing Party, only the missing relationship may be added after explicit confirmation; optional opening can be applied only if that role has no active opening source or other conflicting state. Existing same-role Party and balance default to **Skip**. V1 does not bulk-overwrite existing ledger openings or existing Party identity fields through an ambiguous spreadsheet match.

## 7. Validation, duplicate decisions and audit

1. Parse untrusted content into normalized staged rows; never commit during parsing or mapping.
2. Validate schema, required fields, Bangladesh phone formatting as text, date legitimacy, SKU uniqueness, unit conversion, monetary precision, serial/expiry rules and explicit source identities.
3. Detect duplicates **within the file**, **against current preview records**, and **between role-specific match decisions** in a single batch. Identify strong collision (SKU, explicit Party ID) separately from fuzzy match (phone, name).
4. Resolve duplicates **before** confirm. Default all duplicates to Skip. Product master-field Update only changes approved non-inventory fields (e.g., name, category, brand, prices, min stock); never edits historical sale/purchase/stock sources. Changing base unit or conversion on a product with lots/history must be blocked or handled by a separate migration flow.
5. Opening stock/balance posting is create-only and tied to the correct source. Never repost opening stock on Product Update. Never replace an existing Party opening implicitly.
6. Build a final proposed change set, check all references and duplicate decisions again against the **current** preview snapshot before applying. If preview changed, require re-review rather than silently overwriting.
7. Apply **selected valid rows as one coherent, atomic preview batch**: either every selected applicable row is applied or none is, on a validation error; avoid half-imported products without lots or people without opening source. Errors that can be skipped are excluded explicitly at review.
8. Attach an import session ID and source row number to created **preview** entities and opening-source audit metadata (where the existing types support it); avoid replaying the same confirmed session. Production later requires server-side idempotency and tenant identity from authenticated session.
9. Excel formulas or formula-like CSV fields are **never executed**. Treat formula cells as unsafe input unless converted to literal values with review; guard exported CSV/Excel against formula injection. Reject spreadsheet macros (`.xlsm`) and external link fetching; render file contents only as inert text, never HTML.

The current Party store supports one mutation per dispatched command, not a public batch transaction API. A Party import adapter must add **validate-then-apply batch** behavior without exposing partially applied intermediate state. The current Product page plus demo store are also split; they need a narrow consistent batch-apply path for products, opening lots and movements. This is explicitly part of the implementation plan, not a claim that it already exists.

## 8. UI state contracts and components (proposed)

Reusable, typed pieces:
- `ImportWizard`: owns visible step, focused control, navigation, cancel confirmation and status.
- `ImportFilePicker`: file name/type/size, worksheet selector, template downloads, errors.
- `ImportColumnMapper`: schema-driven mapping with Bangla helper labels and sample values.
- `ImportReviewTable`: normalized rows, detailed errors, per-row decision, filter/search/edit, quantity and price conversion preview.
- `ImportResultSummary`: actual per-action counts and downloadable error report.
- `importFileReader`: CSV/XLSX -> normalized rectangular rows; no domain knowledge.
- `productImportAdapter`: validate and plan product, category/brand/unit lookup, opening lot + movement.
- `partyImportAdapter`: validate and plan Party identity, missing role, audited opening source.
- `importBatchCoordinator`: stage, dry-run and call one domain-specific preview adapter; no second accounting/inventory store.

Suggested state model:
```ts
type ImportTarget = 'product' | 'customer' | 'supplier';
type ImportStep = 'upload' | 'map' | 'review' | 'finish';
type RowDecision = 'create' | 'update-master' | 'add-role' | 'skip' | 'reject';

type StagedImportRow = {
  sourceSheet?: string;
  sourceRow: number;
  original: Record<string,string>;
  mapped: Record<string,unknown>;
  validation: Array<{ field?:string; severity:'error'|'warning'; message:string }>;
  match?: { kind:'strong'|'suggested'; existingId:string; label:string };
  decision:RowDecision;
};
```
These are UI design contracts, not a production API schema. A future backend must re-validate the file, identity, tenant, permissions, conversions, duplicate decisions and ledger/stock commands within one authorized import job.

## 9. Errors, cancellation and recovery

- Upload error: stays on Upload, names issue and allowed file types.
- Incompatible/ambiguous columns: stays on Map, shows missing target fields and suggested mappings.
- Per-row validation: stays on Review; exact worksheet/row/field shown; invalid rows disabled by default.
- Parsing 5,000 rows: show responsive staged progress; do not fake background jobs or suggest the user close the tab.
- Cancel before confirmation: discard staged data; original preview unchanged.
- Confirm with external state change: stop, show stale-preview conflict and ask to re-review.
- Apply failure: do not show success; preserve staged rows for correction, and rollback any partial preview changes.
- Closing after success: keep only the in-memory preview updates until page refresh; message stays explicit.
- Excel may contain multiple worksheets; user picks exactly one. Empty rows ignored but original non-empty row numbers maintained.

## 10. Accessibility, visual design and localization

- Reuse Magic Patterns styling: compact, information-rich layout, neutral panel backgrounds, shadcn-style controls, subtle borders, consistent dark/light themes.
- English labels with smaller Bangla helper, no monospaced numeric font, right-aligned currency/quantity, currency formatted in BDT. Use existing system components and token colors.
- Statuses use **icon + word + color**, not color alone; e.g., Ready, Duplicate, Error, Skipped.
- Good keyboard sequence: select file → map via combobox keyboard → edit invalid field → choose decision → review summary → confirm. Focus moved to step heading and validation alert; Escape warns if unsaved staged changes.
- Tables expose row count, source row number and descriptive accessible labels. On mobile, use cards/stacked fields; no horizontal scroll for primary actions. Test touch targets and date picker dark theme.
- If a user chooses a template, file should contain clear headers, a sample row and optional instructions; do not include personal demo data in exports of actual users.

## 11. Scope exclusions and assumptions

**Included:** Excel `.xlsx`, UTF-8 `.csv`, working template downloads, one-sheet selection, column mapping, bilingual labels, itemized review/error report, Product + Opening stock, Customer + Supplier roles + Opening ledger balances, duplicate protection, preview batch command integration, desktop/mobile and dark/light regression coverage.

**Excluded for v1:** legacy `.xls`/macro `.xlsm`, Google Sheets live sync, product image URL ingestion, importing historical sales/purchases/invoices/payments, advanced multiple opening lots per product row, bulk edit of existing stock/ledger openings, migration of serial-heavy multi-lot histories, saved mapping presets, recurring sync, cloud storage upload, production database posting.

**Assumptions:** 5,000 rows is a UI preview limit, not a guaranteed server ingestion capacity. Existing Product Add dialog remains the reference for value semantics; if it differs from importer validation, tests should reveal and reconcile that difference before acceptance. UX progress conveys browser parsing/applying only; no async server work is claimed.

## 12. Dependency-ordered delivery and acceptance gates

### Slice A — shared file wizard, template and mapping
- New reusable wizard, CSV/XLSX parser adapters, type-specific template generators, sample file, worksheet picker, column mapper, error list, keyboard/mobile and light/dark treatment.
- Existing Party CSV path stays functional or is migrated without regression. Do not enable `Confirm` until real domain apply adapters exist.
- Gate: valid/corrupt/oversized/binary/formula tests; Bangla UTF-8 CSV and text phone/SKU; Excel multi-sheet, original row numbering; template roundtrip; browser journey across steps.

### Slice B — Product import and opening stock
- Product schema + aliases, quantity/price conversion, matches, duplicate decisions, targeted master updates, taxonomies and selection, one Opening lot + movement per new Stock product with quantity > 0, coherent batch preview.
- Gate: `Box/Pcs`, `Gauge/Gira`, independent large-unit selling price, opening unit cost/date, serial/expiry, service product, duplicated SKU, rollback and idempotency, visible Products/Stock Lots/History, no product-stock double counting, keyboard/mobile tests.

### Slice C — Customer/Supplier and opening ledger balances
- Party schema + matching suggestions, Add missing relationship action, separate role-specific direction and opening source, skip existing openings, per-batch audit summary, error report and finish screen.
- Gate: `017...` preserved, Bangla names, possible same-phone unrelated parties, Customer Dr, Supplier Cr, supplier advance Dr, paired relationships remain separate, no payment account mutation, unverified customer credit not refundable, earliest transaction date check, no half-import on failure, correct Party directory/ledger/statement and browser contrast tests.

### Final acceptance (all slices)
1. `npm test` passes (new unit tests included).
2. `npm run build` passes.
3. Dedicated Playwright import browser suite passes and existing `ui-check.yml` end-to-end suites (Products/Purchases/POS/Parties/Finance/theme/SaaS/settings) remain green.
4. Review the preview visually in desktop/mobile, light/dark, and with Bangla fields and long error text.
5. No enabled dummy import/export actions, no fabricated success toasts, no cross-role netting or cross-tenant backend claim.
6. Each code slice goes through its own reviewable PR; deployment/merge only when requested.

## 13. Review focus

Review this written specification for whether (a) a Product Update should **never add opening stock** (recommended), (b) Party existing-role openings should **skip** rather than bulk-overwrite (recommended), and (c) one opening lot per new product row is enough for the first version. All are deliberate KISS safeguards and can be revised before the implementation plan.
