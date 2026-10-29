# HisabIQ Phase 14 — language-coverage audit and Products catalogue slice

## Verified baseline (October 15, 2026)
The last verified `main` is `2d855a2` (merged quotation Phase 10 / PR #99). GitHub still lists PRs #100 Vendor statements, #101 Warranty, #102 Online Sales and #103 Fulfillment Documents as open and not merged at branch creation, although their latest CI passed. **Do not duplicate or overwrite those PRs.**

## Audit observations and prioritized remaining gaps
The existing three language preferences (`personal.language`) are supported by `useUiCopy` and several scoped feature dictionaries, but this does not certify all UI strings. Source inspection identified:
- **P1 — Products catalogue:** English-only table headers, column picker, filters, row status, actions, toasts, summaries, empty states and search controls. Phase 14 fixes this first because it is a routine shopkeeper workflow.
- **P1 — Products nested workflows:** Add/Edit Product, inventory details, lots, history, offers, adjustment and Product Settings contain separately owned forms and actions; **not included in this Phase 14 PR**. Follow with a discrete PR retaining current product data/quantity logic.
- **P1 — Sales catalogue and its specialized dialogs:** A distinct set of English column headings and actions remain in `src/pages/Sales.tsx`. Audit separately without changing document/return logic or status identifiers.
- **P1 — Dashboard and unlocalized secondary page controls:** Verify period labels, filtering, drill-down and runtime confirmations in each language.
- **P2 — shared errors, ARIA, portal labels, toasts and specialist print surfaces:** Dedicated audits using keyboard, screen reader, light/dark, mobile/tablet. Avoid global mass string replacements.
- **Backend-dependent P0:** Do not imply durable stock, cash/ledger or courier posting from a translated UI preview.

This is a **targeted source audit**, not a full census of every dynamic UI surface. Follow-on language-coverage work should maintain a per-module reviewed-state matrix and run each module's existing browser tests.

## Implemented scope
- Add `src/i18n/productsCopy.ts` with display-only labels via existing `uiText`.
- Localize Product list headings, descriptions, tab labels, search placeholder/ARIA, stock status and filters, column picker and table, quick actions, empty state, preview success messages and CSV/download action labels.
- English keeps English; English + Bangla keeps English primary with tab helpers; Bangla shows translated primary text without duplicate helpers.
- Preserve selected tab IDs `list/lots/history/settings`, stock filter IDs `all/low/out`, category `All`, column storage keys, `stockStatus`, `formatStock`, amount calculations, product name/SKU/brand/unit text, action callbacks, Quick Add workflow, selected records, and the **English machine-readable CSV headers**, field order and values.
- Reuse existing Products page/components and Magic Patterns style; no new cart, form, store, APIs, persisted translation values or backend posting.

## Acceptance
- `npm test` includes `banglaPhase14ProductsContract.test.ts` verifying translations and source-value invariants.
- `npm run test:bangla-products` checks English, mixed and Bangla at 390px and 1440px: headings, column visibility, stock filtering, searchable empty/reset, product details, CSV export and page overflow. Reusable controls remain untouched.
- CI strict TS, lint, Node contracts, production build, UI design contract, responsive and domain browser journeys must pass before approval.
- Separate functional acceptance for products Quick Add, stock lot/adjustment and purchase context regression; no premature declaration of all Products dialogs translated.

## Next independent slices
1. Products nested dialogs and Product Settings, with source-safe form validation and shared controls.
2. Sales list/actions and source-safe printable document handoff.
3. Dashboard/secondary areas plus final language-mode/contrast/keyboard audit.

All PRs remain subject to user approval before merging.
