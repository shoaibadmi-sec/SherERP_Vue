# Deep audit: reconciliation and Daybook — 17 October 2026

## Scope and result

Audited the existing client-side preview flows on current `main` at `c10ec66` (including the merge of #134). The target was account reconciliation, cash count/close, Daybook filtering/actions, and filtered print/export output.

The audit reproduced and fixed P1 finding DAY-01: after using Duplicate to open a sale in POS, browser Back restored the Daybook route but discarded the selected date range/search and returned to the default two rows. Daybook now keeps its controlled filters in replace-only URL parameters, so the existing history entry restores the exact filter and scroll context after Duplicate-to-POS and Edit-to-Audit navigation. This is UI-preview evidence only; it does not certify bank statement parsing, durable reconciliation, source ledger posting, or production cash-session persistence.

## Browser evidence

- The existing `scripts/reconciliation-safety-browser.cjs` journey passed at 390, 768, 1024 and 1440px in light and dark: amount mismatch blocks match; a correction requires a reason and must be saved before matching; rows are matched or explicitly created in preview; reviewed preview appears in history; CSV export downloads; PDF import remains clearly unavailable; cash count requires an explanation for a shortage and the next session uses the entered opening.
- The existing `scripts/daybook-audit-browser.cjs` journey passed at 390, 768, 1024 and 1440px in light and dark: print contains only displayed rows, export downloads CSV, reversal review leaves the projection unchanged, and Audit Ledger print outputs rows.
- `scripts/daybook-source-context-browser.cjs` reproduced the old context loss before the fix, then passed after it: October date range + invoice search survive Duplicate-to-POS and Edit-to-Audit browser-back round trips; matching filtered rows and scroll position are restored; duplicate opens the selected invoice.
- `scripts/reconciliation-daybook-matrix-browser.cjs` checks both complete pages at 320×700, 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×800 and 1440×900, in light/dark and English/English + Bangla/Bangla. It ran 96 whole-page axe scans with zero violations and asserted that the document did not overflow the viewport in any profile.
- The reconciliation regression locator now accepts the accessible bilingual field name instead of requiring exact English-only text.

## Local gates on `c10ec66`

- TypeScript: `./node_modules/.bin/tsc --noEmit` passed.
- Unit suite: 121 files passed.
- Lint: 0 errors, 185 warnings (repository warnings).
- UI contract: passed.
- Production build: passed; Vite reported the existing large-chunk advisory.

## Remaining limits

The sample statement PDF is not parsed. Reconciliation updates and history are session-local previews. Real bank/account integration, authenticated source records, persistent reconciliation and backend posting remain unverified. Real software keyboards, downloaded-font rendering and manual screen-reader use were not tested.
