# Counter transfer source history — 17 October 2026

## FIN-18 — P1

Counter → Bank Transfer changed the selected account balances, but did not create a record in Finance → Money Accounts → Transfer history. A user could complete and reverse a transfer from Counter without the existing transfer ledger showing it. A local Playwright reproduction confirmed the missing history row before the repair.

Send the selected endpoint account IDs and amount from Counter to Finance when the user confirms. Add a normal completed transfer row to the existing history and retain the endpoint IDs on that row. Use those IDs to label duplicate-name accounts and to restore the exact same accounts on reversal. Older rows without IDs continue to use their saved names as a display fallback. Existing balance calculations and navigation are preserved.

## Local verification

`scripts/counter-transfer-source-browser.cjs` exercises the real Counter confirmation, Finance history and reversal flow at 320×700, 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×800 and 1440×900, in light/dark themes and English, English + Bangla and Bangla. It checks changed and restored balances, the retained history row, runtime errors and focused axe scans of the confirmation and transfer-action dialogs at 320px, 390px and 1440px across all theme/language combinations.

`scripts/counter-transfer-duplicate-browser.cjs` creates a second Dutch-Bangla account with a distinct number, chooses that duplicate in Counter, verifies the review and history identities, and confirms only that account receives and reverses the amount.

The pre-fix missing-row reproduction failed at the history assertion. After the repair, the 48 Counter confirm/history/reverse journeys and all 36 dialog axe scans passed, the duplicate-account journey passed, and the existing Finance transfer-dialog smoke passed in touch English light/dark profiles. The 121 unit-test files, `npx tsc --noEmit`, full lint (0 errors, 185 warnings), UI contract guard and production build passed. The build retains the existing large-chunk warning.

This preview does not certify backend persistence or accounting integration. Supplier pay/expense source allocations and the remaining nested Finance workflows still need audit; real software keyboards, downloaded-font rendering and manual screen-reader operation remain unverified.
