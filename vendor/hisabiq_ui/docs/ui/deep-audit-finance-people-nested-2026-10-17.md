# Finance people and nested account workflows — 17 October 2026

## FIN-19 — P2: duplicate-name identity

The browser flow created two active Lender records with the same name and no phone or description. Before the repair, the Finance person menu displayed the same option label for both, leaving users unable to tell which party ID would receive a transaction. Add a distinguishing label using a unique phone, then a unique relationship description, then the existing ID suffix as a final fallback. The Finance people list uses the same identity label and its Edit/Activate/Deactivate buttons now name the person they act on.

The Name, Phone and Description fields in the manager now expose explicit accessible names. Finance person creation remains role-filtered: the nested add dialog defaults to the role of its parent transaction. Inactive people stay out of new transaction selectors, while an inactive person already attached to a historical transaction remains selectable and identified when editing that record.

## Parent-form preservation

The real nested Quick Add browser journey keeps the draft amount, reference and note while adding a contextual-role person, then reviews and records that transaction. It also adds a Cash account from the transaction’s payment split, verifies the same parent draft fields, and checks that the new account is selected in the split. Person update, reopening saved values, cancelling an edit, deactivation, and historical edit selection are exercised in the same journey.

## Local verification

`scripts/finance-people-nested-browser.cjs` passed the full 48-person-workflow matrix across 320×700, 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×800 and 1440×900; light/dark; English, English + Bangla and Bangla. It also passed 18 additional nested-account and inactive-selection journeys at 320×700, 390×844 and 1440×900 in all theme/language combinations. Across both runs, 216 scoped axe scans found no WCAG 2.0/2.1/2.2 A/AA violations. The additional nested-account runs also checked that each modal fit inside the viewport.

The identity helper regression covers unique phone labels, unique relationship descriptions and duplicate records requiring ID suffixes. Local checks passed: 122 unit-test files, TypeScript, UI contract guard, production build, and full lint (0 errors, 185 existing warnings). The build retains the existing large-chunk advisory. Targeted lint also passed with 0 errors and 2 existing hook warnings.

This preview does not certify backend persistence or accounting integration. Real software keyboards, downloaded-font rendering and manual screen-reader operation remain unverified.
