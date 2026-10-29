# Shared numeric entry and fuzzy ERP search — 18 October 2026

User-approved behavior: focusing an editable numeric field clears an existing zero immediately, while retaining other values. A wheel over the focused numeric field moves by one whole unit, within the existing limits. ERP search tolerates spelling mistakes. Base: `c99ac443a1a951d38307216e946d9c16951b5202`; previous audit repair commits are retained. No PR merge or backend implementation is included.

## Number entry

The existing `NumericInput`, design-package Input and `wholeNumberStep` remain the shared controls. Focus clears complete zero representations such as `0`, `0.00` and `-0`; invalid strings and nonzero amounts remain editable without coercion. Existing focus/change/blur callbacks still run. A small display state handles number-valued parents that convert an empty input back to numeric zero, allowing the focused field to remain visibly blank. Blur follows the owning form's existing representation and validation.

Wheel up adds one; wheel down subtracts one. The existing exact decimal-string arithmetic preserves `12.50 → 13.50` and bounds. Keyboard arrows and pointer steppers retain the same path. A non-passive listener prevents native number stepping or page scrolling from also acting on an active wheel adjustment. Unfocused, disabled/read-only fields and horizontal or modified wheel gestures keep their existing behavior. Text, phone, identifier and search inputs are not newly converted into numeric controls. The component dispatches the original input-event path; financial calculations remain in their owning forms.

## Fuzzy discovery

`fuzzySearch.ts` owns normalization, matching and stable ranking. It supports English/Bangla text, NFC normalization and Bangla digits. Longer words (at least four code points) allow one insertion, deletion, substitution or adjacent transposition. Short queries and digit-bearing tokens do not get approximate digit matching. Partial literal references remain searchable, as before. Numeric query tokens remain mandatory even in Advanced global search.

Global Default matches every query word with prefix/typo tolerance. Advanced additionally permits infix and broader text-word matches. Selectors/global lookup put a complete match in any indexed field ahead of partial/typo matches. Global SKU/phone terms are indexed separately from combined display helpers. Existing persisted mode values are retained, with updated descriptions.

Integration: global search; POS/Purchase product picker; POS customer picker; Counter people picker; Products, Parties and ledgers; Sales, Purchases, Expenses, Quotations, Online Sales, Finance, Accounts, Daybook, Reconciliation, Audit Ledger, Warranty, Notifications, Vendors, import review and ERP Settings searches. Existing list sorting, category/date/status/account/role restrictions and exact source IDs are retained. Search returns original records; it does not merge duplicate people, resolve a posting target approximately, or bypass permissions. Platform SaaS administration search is outside this ERP slice.

No dependency or alternate cart/picker was introduced. Existing `ProductCombobox`/Purchase adapter, `CustomerPicker`, Input/NumericInput and theme tokens remain in use. A browser-reproduced 320px selected-customer overflow was corrected through an optional shared FloatingPanel wrapper class and a bounded CustomerPicker trigger. Axe also identified two existing issues along the exercised paths: the Notifications credit link now has an underline, and the Purchase lot button's accessible name includes its visible price/serial text while retaining product context.

## Standards review

An independent read-only standards review found no actionable contract violations: shared component reuse, source/role isolation, existing filters and prior audit repairs were preserved. Automated tooling checks formatting/types separately.

## Specification review

An independent read-only requirements review found one ranking defect: a complete SKU in a secondary field could lose to a primary name prefix. The scoring tier now recognizes complete equality across every indexed field, with separate SKU/phone terms for the global index. Regressions for the actual SKU collision and a longer exact phrase failed before the fix and passed afterward. The follow-up review reported no remaining concrete specification findings.

## Verification

Baseline: all 137 existing unit-test files passed before implementation. Focused regressions cover zero representations, exact whole steps, bounds, gesture exclusions, spelling/transposition, Bangla/digits, mandatory numeric tokens, complete-field ranking, unchanged record identity, and date/account/role filter isolation.

Final local checks passed: 138 unit-test files, `npx tsc --noEmit`, lint (0 errors, 199 existing warnings), UI contract guard and production build. Build retains its existing large-chunk advisory. Browser coverage uses actual touch/click, keyboard and mouse wheel with semantic waits. It does not force-click or sleep. The full matrix uses 320×700, 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×800 and 1440×900, both themes and English/bilingual/Bangla. All 48 profiles passed, with zero violations across 144 whole-page axe scans and no runtime errors. Each profile checks POS string-backed numeric entry, bounded number-valued state on Notifications, nonnumeric phone zero retention, fuzzy product/customer discovery, Purchase price stepping, global exact destination, Sales numeric-reference exclusion, Counter keyboard selection and three full-page axe scans.

The existing numeric regression passed four local profiles (390/1440px, light/dark), including pointer steppers, decimal keys, live totals, Enter/F2 and control alignment. The existing global regression also passed four profiles against the final ranking. A separate six-case module regression (390px, both themes, three languages) passed Purchases fuzzy supplier/status filtering, Expenses payee lookup, Quotations customer/exact-reference filtering, Parties, Vendors and Settings typo searches. The first draft of this harness queried directory entries as buttons; correcting it to their actual option role resolved the locator timeout without an application change. Local scratch adaptations block external font requests and wait for DOM readiness. No GitHub CI is used as a substitute for local execution.

Reproduce the primary matrix with `PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium npm run test:number-fuzzy` and the additional module checks with `PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium npm run test:erp-fuzzy-modules`. `NUMBER_SEARCH_SMOKE=1`, `NUMBER_SEARCH_WIDTH`, `NUMBER_SEARCH_LANGUAGE`, `NUMBER_SEARCH_WORKERS` and `NUMBER_SEARCH_OUTPUT` support focused local runs.

These are frontend preview changes. Backend search, tenant authorization APIs, durable transactions, real device software keyboards, downloaded-font layout and manual screen-reader operation remain outside this verification.

Implementation commits: `f100f4d` (numeric focus/wheel) and `11154ec` (shared fuzzy discovery and browser-found layout/accessibility repairs), on `feat/erp-numeric-fuzzy-search-2026-10-18`. Changes remain local; no push or merge was performed.
