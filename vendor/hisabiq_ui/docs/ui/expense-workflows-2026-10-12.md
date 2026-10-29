# Expense frontend workflows

The list's category/payee/payment/status filters and its management, receipt, print and export actions were disconnected. Bill details reported successful payment without changing a source record. This slice keeps the existing HisabIQ layout and actual BillDialog payment rows, QuickAddSelect, AppSelect/FormSelect, shared date picker, PartyEditorDialog, PhotoUploader, FloatingPanel, Dialog, table and buttons.

| Action | Verified frontend behavior |
| --- | --- |
| Search and filters | Combined controlled filters; payment method includes each split; all historical payees/categories remain filterable; reset and empty state |
| Add expense | Existing bill form; in-context Payee/category creation preserves entered amount and description; active choices refreshed on open |
| Correct / update payment | Same bill editor with original identity/date/payment splits; amount/account/date checks; reason and before/after Total/Paid/Due review; audited preview save |
| Cancel expense | Reason required; retains original record and amounts; excludes cancelled entries from active totals and reports; prevents repeat cancellation/edit |
| Receipt | Actual browser file selection/removal with source update and visible history; preview only |
| Expense actions | View, Correct, Print and Cancel; cancelled entries retain view/print |
| Categories | Create, duplicate/name validation, rename, activate/deactivate; historical source labels preserved |
| Payees | Existing Party editor/store, default Payee role, create/edit, duplicate/phone validation; linked identities cannot deactivate; existing roles preserved |
| Export | CSV contains exactly the filtered source rows; uses the same formula-safe output utility as the ledger output PR |
| Print | Real isolated print document for selected expense or date-range report; popup blocking feedback; cancelled sources excluded from active report |
| Purchase bill payment | Removed fabricated payment-success result; explicitly disabled until its source-linked payment flow is integrated |

Expense source preview now survives route navigation within the same session. Refresh resets it. Category and party updates reuse the existing in-memory demo stores; receipt blob URLs are session-only. History is visible in details, with Dhaka timestamps. Financial amounts are validated and summed in paisa. No backend ledger, cash session, stock or tenant data is posted by these previews.

## Backend integration boundary

Replace source-preview create/correct/cancel/receipt operations with tenant-authenticated commands. Preserve stable expense IDs/references and created timestamps, active account IDs (the legacy bill form currently uses account names), permissions, audit reasons and idempotency. Correction/cancellation must atomically update expense, payable, payment and accounting projections; a client status change is not a refund or ledger reversal. Upload receipts to durable object storage. Subscribe this module and Day Book/Audit/account/party projections to returned source data; their separate static demo data is still not connected.

Purchase returns remain a separate P0 slice: legacy seed purchases have no usable historical inventory-line snapshots and the existing return form fabricates a refund. This PR does not claim that flow is ready. Sales/Warranty/Product/Reports action gaps, full language-mode coverage, TypeScript/lint cleanup and route loading remain on the audit backlog.

## Verification

- Three source tests: atomic invalid-money/date/split rejection; identity/reason and before/after correction; receipt/cancellation and immutable cancelled history.
- Browser workflow across 390/768/1024/1440 in light/dark, phone/tablet touch: combined filters, filtered CSV contents, nested quick-add/draft preservation, invalid amount, partial paid, reason/impact correction, receipt file, isolated print contents, cancellation/history, category rename/status, linked-payee restriction/edit, report print and purchase-payment disabled state.
- Existing Purchase, Product quick-add, Party settlement and themed filters checked for regression; build, UI contract and helper suite.
- Whole-project TypeScript/lint still have baseline failures. The generated design-system declaration PR and the other pending UI fixes are validated together separately; none are merged here.

The output utility is byte-identical to PR #70 so parallel branches share the same print/export implementation. This branch depends on PR #73 (ledger/dropdown contracts); review that first and retarget after merge. Shared dialog accessibility PR #69 remains required for project-wide focus containment and scroll locking.
