# Earlier audit draft repairs — 17 October 2026

Scope: reconcile and repair confirmed findings in the earlier POS, remaining-module, Supplier Pay and bundle audit drafts, in addition to the [Sales repairs](deep-audit-sales-fixes-2026-10-17.md). Original audit drafts are preserved under [audit-drafts](audit-drafts/) as historical observations; this document records their implementation status. Base is fetched `origin/main` `8516a0b`, with Sales repair commit `8b222fd` retained. No PR merge is part of this work. Repairs are in `0c8b0a6` (POS) and `2492676` (Supplier allocation); the tested `src` tree is `403cff79ea185ee42dd5486aeb4ae60d5b5c9cd2`. Verification continued on 18 October after midnight UTC.

## Finding reconciliation

All confirmed findings below are implemented and locally verified.

| Draft / finding | Fixed behavior |
| --- | --- |
| [POS](audit-drafts/pos-module-audit-2026-10-17.md) A1 | CustomerPicker subscribes to the live Party preview. Only active Customer identities are offered. Phone/area/ID queries remain supported; Borrower alone does not qualify. |
| POS A2 | Review and final confirmation validate the active Customer ID and verified refundable credit. Unproven opening credit cannot fund checkout. Credit cannot exceed either that balance or the invoice remainder after other tenders. Bangla says advance credit, and the UI explicitly discloses that preview does not spend it. |
| POS A3 | A shared full-value parser rejects malformed payment/price/discount values. Inputs retain invalid text for correction; financial totals do not parse a numeric prefix. Both entry points, including Enter/F9, respect validation. |
| POS A4 | Every cart line needs a positive combined quantity before review/confirmation. Unused lines must be removed. |
| POS A5 | Held sales live in the shared Sales preview snapshot across module navigation. They retain Customer ID, entered customer details, discount amount/mode, line order/units, payments and bundle recipe/source data. Resuming uses the canonical draft URL. Saving an existing draft updates it; resuming does not silently delete the source draft. |
| POS A6 | Review and receipt retain every positive payment method, account and exact amount, plus change. Sales receipt adapters copy original split records without recalculating them. |
| POS A7 | POS method/account controls have explicit stable translated field names. The shared FormSelect fallback uses the selected option rather than the first option. |
| POS A8 | Draft menu, hold/delete actions, empty state and saved-item copy support English, bilingual and Bangla modes. Existing draft reference labels are preserved. |
| [Supplier Pay](audit-drafts/hisabiq-counter-supplier-pay-audit-2026-10-17.md) / [remaining modules](audit-drafts/hisabiq-remaining-module-audit-2026-10-17.md), FIN-22 | Supplier Pay uses the shared Counter invoice allocation UI and projection. Users choose an immutable purchase source ID or explicitly use oldest-first. Both form and confirmation show exact bill references/amounts. Full due follows the selected bill. Record and correction boundaries reject foreign, future, closed, stale or overpaid targeted bills, including settlement discounts. Default aggregate payments retain existing oldest-first behavior. |
| [Bundle](audit-drafts/hisabiq-bundle-audit-2026-10-17.md), missing historical net allocation | The Sales repair opens bundle return preview before the monetary posting gate. The regression removes historical `netSaleTotal` from the discounted demo invoice and opens/cancels preview without adding any return, credit or posting. Missing allocation remains visible rather than inventing a refund estimate. |

The earlier remaining-module draft lists no other unresolved confirmed product findings. Its stale account-label test locator is test maintenance, not a reproduced application defect. Deferred authentic bundle component lot/serial/cost posting remains a backend integration limitation.

## Architecture and shared controls

Reuses actual CartTable, CompoundQuantityInput/NumericInput, CheckoutPanel, CustomerPicker, DraftsMenu, AppSelect/FormSelect, TransactionReviewDialog, ReceiptPreview and CounterWorkspace. No alternate cart or design system was introduced. POS input checks are centralized in `posCheckoutValidation`; Supplier allocation checks are centralized in `counterAllocation` and enforced by `partyPreviewStore` for recording and correcting payments. The Supplier path extends the existing Customer projection with relationship-specific ledger sides.

The browser pass additionally found and repaired low contrast in the resumed-draft context and added a named keyboard-focusable receipt scroll region. Financial formulas, source IDs and navigation targets remain the existing ones. All changes use the current design tokens and Geist/Hind Siliguri typography.

## Local verification

Completed local quality checks: `npm test` passed all 137 test files again on 18 October; `npx tsc --noEmit`, UI contract and production build passed. Lint has zero errors and 199 existing warnings. Existing build chunk-size advisories remain. Focused receipt/source-correction tests also passed. The final draft-regression matrix passed all 48/48 journeys with 240 whole-page axe scans and zero violations, zero document-overflow failures and zero browser exceptions. Together with the fresh Sales regression, this is 96 complete matrix journeys and 336 whole-page axe scans. Counts are scoped to the listed workflows.

Additional completed browser verification:

- Existing Sales regression: 48/48 journeys, 96 whole-page axe scans, zero violations.
- Actual Party editor → POS customer selection: 6/6 touch journeys at 360px across both themes and all three language modes.
- Existing duplicate-bank Counter source regression: 6/6 journeys and scoped confirmation axe checks at 390px; exact selected account ID and account balance movement retained.
- Existing POS blocking-overlay shortcut smoke: 2/2 bilingual touch journeys, light/dark at 390px.

A first draft matrix stopped on an incorrect Bangla button label in the harness. A subsequent run exposed an assertion that read the default cart before the resumed draft effect finished. The harness now uses the actual translated label and web-first assertions for restored values. No sleeps, forced clicks or application changes were used to bypass either failure.

Reproducible commands:

```sh
npm test
npx tsc --noEmit
npm run lint
npm run check:ui-contract
npm run build
PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium npm run test:remaining-audit
PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium npm run test:sales-audit
```

`remaining-audit-regression-browser.cjs` uses actual touch/pointer and keyboard interactions, semantic waits, and axe. Party/credit and missing-history setup use the same source command boundaries as the app; checkout, hold/resume, selections, reviews, confirmation and cancellation use visible controls. It never force-clicks or sleeps. Each matrix context is isolated. Hash navigation deliberately preserves the single-page preview session.

Coverage profiles: 320×700, 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×800 and 1440×900; light/dark; English, bilingual and Bangla. Axe scans the full document at credit validation, sale split review, receipt, Supplier bill review and pending-price bundle preview.

## Limits

Held drafts and other Sales edits persist during the current preview session, not across a full reload. POS receipt and Customer Credit previews do not post to a backend or spend Party credit. Counter uses existing local Party payment sources; it is not bank integration certification. Real device keyboards, downloaded fonts and manual screen-reader operation remain unverified. These fixes close the listed reproducible frontend findings; they do not certify every ERP workflow or integration.
