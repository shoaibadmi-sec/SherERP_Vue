# Counter supplier payment splits — 17 October 2026

## FIN-20 — P1: selected active account rejected by preview validation

The browser flow created a second active Dutch-Bangla bank account through Finance → Money Accounts, selected it for a Counter supplier payment, and confirmed the payment. The account appeared in the picker, but the Party preview validator consulted only the seeded account fixture, rejected the new source ID as missing/inactive and recorded no supplier payment. This left a UI-confirmed action with no payment source record.

Pass the current Finance account list into Counter payment validation, while retaining the same active-status, method/type and split-total checks. The successful payment source retains its selected account ID, the supplier settlement moves by the actual payment amount, and Finance reduces that account's balance. The validator keeps the existing seeded-list default for callers that do not provide a runtime account list.

## FIN-21 — P2: duplicate bank account identity

With a second active account sharing the same name and balance, the Counter payment account menu displayed indistinguishable options. The review also showed the same plain account name regardless of the selected source ID. Use a unique masked account number for duplicate names, with a stable source-ID suffix when numbers do not distinguish the accounts. Apply the shared label to Counter payment pickers/review, the Finance payment-split editor, and saved Finance transaction details.

## Local verification

`scripts/counter-payment-split-identity-browser.cjs` passed 48 Playwright workflows across 320×700, 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×800 and 1440×900, in light/dark and English, English + Bangla and Bangla. Each workflow creates the duplicate active bank account in the UI, pays Karim Traders from that account, checks the masked identity in both picker and confirmation, audits the confirmation with axe, and verifies the stored supplier source has the chosen account ID and ৳125.50 split. It also checks the exact supplier-balance and selected-account-balance deltas and runtime errors. Touch input was used through 1024px.

The pre-fix browser run reproduced the missing payment source when a newly created account was selected; a separate pre-fix run reproduced identical duplicate-name options. Both defects passed after the changes. The two focused unit files cover account identity labels and dynamic-account payment validation. Local gates passed: 122 unit-test files, TypeScript, UI contract guard, full lint (0 errors, 185 warnings), and production build. The build retains the existing large-chunk advisory.

The preview does not certify backend persistence. This slice checks supplier payment totals and account/source identities; it does not verify allocation to individual purchase invoices. Real software keyboards, downloaded-font rendering and manual screen-reader operation remain unverified.
