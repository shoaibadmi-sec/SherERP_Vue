# Finance amount validation audit — 16 October 2026

Frontend preview only. This slice does not certify Finance or the whole ERP as complete.

## Verified defects

| ID | Priority | Reproduction / observed result | Root correction |
|---|---|---|---|
| DPI-14 | P0 | Finance → New transaction → amount `1.2.3` → Review shows ৳0 → Confirm creates FIN-000189 with a truncated 1.2 amount. Transfers, account openings, source edits, manual account entries and cheque creation also accepted malformed text. | Use complete numeric conversion and reject nonfinite/nonpositive values before review or mutation; account opening permits zero. |
| DPI-15 | P1 | New transaction 100 → payment source `0` or `100.0.0` → Review accepts a substituted/truncated 100. An extra invalid row could disappear. | Shared payment draft normalization only autofills a single **blank** row; validation requires every row and the total. |

| DPI-18 | P1 | New cheque shows Dutch-Bangla Bank by default; save a valid cheque without changing that selector and its money-account column is blank. | Save the same account fallback already shown by the existing FormSelect; explicit bank selection is preserved. |

The original controls are reused: Input, Dialog, FinancePaymentSplitEditor, FormSelect and Button. No cart, layout or accounting direction changes. The single blank payment source fallback remains supported. Pure draft helpers move to `src/utils/financePaymentDrafts.ts`; component type re-exports preserve consumers.

## Interaction inventory

| Module → component | Actions and expected outcome |
|---|---|
| Finance → New transaction | Reject malformed/nonfinite amounts; review valid 123; cancel/reopen preserves draft; confirm creates the source record. |
| Finance → Payment split | Reject explicit zero, malformed/nonfinite source and extra zero row; accept two valid 50 sources totaling 100. |
| Finance → Transfer | Reject invalid draft; review 123; cancel/reopen follows existing reset; confirm shows the transfer. |
| Finance → New money account | Reject malformed/nonfinite opening; preserve account name; accept blank zero opening. |
| Finance → Transaction row → Edit | Reject invalid amount without changing source; blank single source still autofills; valid 123 updates record. |
| Finance → Account menu → Money in/out | Reject invalid input without changing account balance; valid 123 changes balance by exactly 123. |
| Finance → New cheque | Reject malformed/nonfinite amount without creating a record; switch Received/Issued and preserve party; cancel/reopen preserves draft; save retains the displayed default bank; change bank and verify the new saved account. |

`scripts/deep-finance-validation-browser.cjs` defines 336 journeys: seven workflows × eight requested sizes × two themes × three languages. Touch input is used through 1024px; mouse above that. Failures retain screenshots and Playwright traces. Font requests are blocked in this environment; real software keyboard behavior is not certified.

Baseline: 12 genuine failing observations across the original six entry points, plus two malformed-cheque failures and two missing-default-account failures at 390px, both themes. Two early manual-entry locator errors and an earlier same-hash navigation harness run are excluded from defect counts. The original 288-journey matrix and final-tolerance 12-journey smoke passed. The cheque extension adds 48 profiles. The inclusive 0.001 split tolerance is preserved by a dedicated unit check. Full matrix and CI status are recorded with the PR evidence after execution.

The Phase 5/6 source contract tests now follow the extracted validation helper. Behavioral unit tests check blank vs zero, malformed and nonfinite values, complete rows, exact split amounts and missing accounts. They retain direction/ID/reversal contracts.

## Remaining work

Finance icon-only row/account action labels require a separate measured accessibility slice. Cheque lifecycle actions and remaining nested people/account selectors, Counter, Reconciliation and Daybook are not declared fully audited here. A previous CI Party correction timeout was not reproduced in ten fresh instrumented runs (eight with 6× CPU throttling); its cause remains unclassified. No backend operation is certified.


### DPI-19 — error toast intercepted mobile dialog actions (P1)

The full 336-journey CI run exposed six 360px Transfer failures. Passive pointer/touch/click capture at `46d44c4` proves the Cancel tap at (180,733.5) reached the error notification **Enter a transfer amount**, not the Cancel button. Its high stacking position covered the form action while the notification expired; the dialog itself and its values were correct. Extra pre-tap inspection could mask the timing, so the regression keeps passive capture and real taps.

The shared `src/index.css` rule makes notifications without controls ignore pointer hits while a blocking shared dialog is open. Error messages remain visible and announced; notifications containing buttons, links or form controls remain interactive. Outside blocking dialogs, normal notification swipe dismissal is preserved. No notification system, dialog or finance handler is replaced.

The transfer regression checks that the error notification is still visible, Cancel actually receives the click/tap, the dialog closes, no transfer row is created, and reopening/confirming still works. Actions now have a bounded 15-second timeout. Full CI at the final fix head must pass before review readiness.
