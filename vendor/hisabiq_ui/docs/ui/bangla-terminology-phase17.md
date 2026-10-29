# HisabIQ Phase 17 — Sales list and return language consistency

## Baseline
Phase 16 Inventory PR #106 was merged into `main` at `a29aaa758575d9f7c55fb12128d1a8083c35700d` with green UI and Responsive UX checks. Keep the existing Magic Patterns design, POS V2 transaction editor and bilingual display modes.

## Implemented (presentation only)
- Reuse `SalesColumnPicker`, `InvoiceActions`, existing `Sales` tabs/forms and `useUiCopy`. Add `src/i18n/salesCopy.ts` for everyday shopkeeper Bangla without new language settings.
- Sales list table headings, column visibility menu, search accessible name, return/credit actions and sale invoice menu labels.
- Sales return selection, quantity/serial guidance, return reason labels, settlement and refund field labels. Keep source reason and settlement values (`Customer return`, `Wrong item`, `Warranty claim`, `Adjust due`, `Customer credit`, `Cash refund`).
- Return history, customer credit/settlement actions, draft/template labels and status, plus visible print and payment confirmation text.
- English and English + Bangla keep English primary text; bilingual mode keeps helper only where the original helper exists; Bangla mode uses the simple Bangla label.

## Do not change
- Canonical POS editing/duplication/cart behavior, invoice IDs, source dates, product names, customer contact data, quantities, return limits, serial matching, discount or price calculations, due allocation, refunds, payments, ledger data, role permissions, status IDs and result objects.
- CSV `hisabiq-sales.csv` English machine headers, columns, ordering and raw values.
- Existing `PageHeader`, `AppSelect`/`FormSelect`, `FloatingPanel`, `Input`, `Button`, tables, print components and theme tokens.
- No additional localStorage preferences or extra UI-only source-of-truth.

## CI
- `tests/banglaPhase17SalesContract.test.ts`: three modes, domain enum source values, source math, CSV headers and POS navigation.
- `npm run test:bangla-sales`: Playwright English / English + Bangla / Bangla × 390px / 1440px; columns on/off, CSV filename, invoice action and dialog, return line/reason/settlement source values, credit label, runtime errors, body overflow.
- Keep TypeScript, lint, all Node tests, build, mobile/dark-theme checks and all existing POS/Purchase/Vendor/Sales/Return checks green before merge.

## Follow-on release gate
- This PR does **not** assert that the ERP is production-ready or all Sales workflows post to real stock and financial ledgers.
- Pre-existing template Edit action that only shows an informational toast requires a **separate functional KISS fix**, not an invented localized posting claim.
- Validate accessibility/wording in dialogs where existing bilingual copy remains, and run an ERP-wide untranslated-string census in the final localization phase.
- Review UI screenshots in dark/light desktop/tablet/mobile, including browser overlays.
