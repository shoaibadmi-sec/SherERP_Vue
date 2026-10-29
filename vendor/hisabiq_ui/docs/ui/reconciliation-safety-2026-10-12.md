# Cash and bank reconciliation — KISS safety slice

Baseline: main `0cc3a9a`. This is a client-side UI preview; actual bank import, authenticated account transactions, durable cash sessions and source-linked correction commands require backend integration.

| Workflow | Previous problem | Result |
| --- | --- | --- |
| Cash count | Denomination grid only; predefined count | One total field by default, optional note counting, no prefilled amount |
| Save count | No reviewable saved record | Shared session context retains amount, expected total, note and timestamp until reload |
| Close cash | Could close without count/explanation | Enter a valid count; explain a shortage or excess |
| New session | Entered opening ignored by summary | Uses actual entered opening; does not reuse previous demo movements |
| Finance cash link | Opened bank reconciliation | Opens the same cash count form |
| Bank match | Wrong amount/reused records could match | Same account/direction, positive finite amounts, exact paisa and one-to-one link required |
| Correction | Unvalidated changes; no explanation | Valid date and amount; explanation required; save before matching |
| Statement import | Filename falsely treated as parsed PDF | Clearly unavailable; explains sample data without pretending to import |
| Export | Toast only | Actual filtered CSV with formula escaping |
| Finish | Toast only; empty account could finish | All rows valid and matched, balances agree; adds reviewable preview history |
| History | Toast only; mixed account records | Account-filtered history and readable details |
| Phone/tablet | Form below long statement list | Selected work visible immediately; labeled chooser swaps list/work area |

Uses existing Button, Input, Dialog, AppSelect, FormSelect and themed AppDatePicker. Existing account/statement sample data is unchanged. Matching never changes the amount to force agreement. Ignored rows intentionally prevent completion pending real exclusion policy.

Verification: build, unit suite (330 tests), UI contract, helper tests for mismatches/duplicates/empty/ignored statements/CSV and browser journeys across 390/768/1024/1440px in light/dark. Run `node scripts/reconciliation-safety-browser.cjs`. Repository TypeScript/lint baseline remains tracked in the full audit; no claim of backend completion.
