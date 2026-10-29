# HisabIQ Bangla Phase 15 — Product Settings and Add/Edit Product forms

## Purpose
Extend the existing three language modes to routine Product Settings and Add/Edit Product fields without changing the Magic Patterns design, shared QuickAddSelect, numeric/compound unit inputs or product source data. This is a **display-only language** slice on top of merged Phase 14.

## Scope
- `src/i18n/productFormsCopy.ts`: straightforward shopkeeper Bangla labels for settings tabs, form names, short help, validation, statuses and common enum presentation. `productFormOptions` maps `{value,label}`, preserving the **original machine value**.
- `ProductSettings`: Categories, Units, Brands, Defaults tabs; labels, column headings, usage/status, add action, reference to shared Business settings, confirmation/error copy. Category/Brand/Unit names remain user/seed data.
- `AddProductDialog`: Add/Edit headings, ordinary descriptions, labels/help/validation, Product type and warranty-duration/type/allocation option labels; shared Field and SettingHeader display Bangla helpers **only** in English + Bangla. The three mode selections in Serial Tracking keep the persisted `Off/Optional/Required` values.
- Unchanged: product names, SKU, barcode, photos, brand/category IDs, Stock/Service, purchase/selling prices, unit conversion factor, stock quantities, serial values, warranty snapshots, expiration dates, stock lot posting, Preview store, Quick Add Category/Brand/Unit callbacks and CSV output.

## Verification
- `npm test`: `tests/banglaPhase15ProductFormsContract.test.ts` covers dictionary fallback/three modes, enum value integrity and source method presence.
- `npm run test:bangla-product-forms`: language × mobile/desktop, opened Add Product, Product type options, Advanced/serial choice, cancelled without mutation, Product Settings tab/field copy and page geometry.
- Existing Product Quick Add and Purchase regression scripts must remain green; TypeScript, lint, complete UI/Responsive checks are mandatory.

## Known gaps / follow-on
- Product inventory detail tabs, stock lot, adjustment, and offers dialogs remain in their existing implementations; they require a separate source-safe Phase 16, especially for validation and non-posting wording.
- Some legacy Product Settings actions remain preview-only and require a separate workflow correctness fix rather than a localization-only claim.
- The software remains an ERP UI preview, not production-certified accounting/stock posting.
