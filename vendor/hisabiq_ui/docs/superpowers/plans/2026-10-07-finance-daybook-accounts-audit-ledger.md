# Finance, Daybook, Accounts & Audit Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the current Finance & Accounts UI into simple Finance, Daybook, Accounts and Audit Ledger modules with per-user terminology/date preferences, source-aware corrections, safe deletion and consistent accounting views.

**Architecture:** Keep each business module as the source of truth. Build a shared transaction projection layer that Daybook and Audit Ledger consume, and a shared accounting projection layer that Accounts consumes. Audit Ledger never edits derived ledger rows directly; it applies source-aware correction commands, previews impacts, validates dependencies and records immutable audit events.

**Tech Stack:** React 18, TypeScript, React Router 6, Tailwind CSS, existing HisabIQ shared UI components, Sonner, Node built-in test runner via `node --experimental-strip-types --test tests/*.test.ts`.

**Spec:** `docs/superpowers/specs/2026-10-07-finance-daybook-accounts-separation-design.md`

## Global Constraints

- Follow the existing Magic Patterns HisabIQ visual language.
- Keep It Simple: normal users must not need accounting knowledge for daily workflows.
- Main labels use familiar professional English; Bangla helpers use natural everyday Bangla.
- Short Bangla helpers appear inline; long explanations use the existing accessible Tooltip component.
- New users default to **Simple** terminology; each user can switch to **Accounting** and admin cannot lock it.
- New users default to **Transaction Date** view; each user can switch Daybook/Ledger display, sorting and filtering to **Created Date**.
- `Created Date` is immutable. `Transaction Date` is editable and fully audited.
- Trial Balance, Profit & Loss, Balance Sheet and accounting periods always use Transaction Date.
- Daybook is the only global daily transaction list; it does not create transactions.
- Daybook Money In/Money Out represent actual money movement only.
- Internal transfers show both directions on their row but are excluded from business Money In/Money Out summary totals.
- Multiple payment sources remain one Daybook transaction with a payment breakdown in details.
- Audit Ledger edits the source transaction when one exists; derived debit/credit rows are never independently rewritten.
- Posted double-entry deletion removes/undoes the whole balanced source posting; no individual Debit/Credit line deletion.
- Financially meaningful posted-record changes require an Impact Preview and reason.
- Preserve existing 2px teal `.erp-tab-active` tab indicator.
- Keep tables compact, numeric columns right-aligned and no monospaced digits.
- Do not introduce new product dependencies unless a current shared component cannot satisfy the requirement.

## Review Focus

- **Credit/partial transactions:** a credit sale/purchase must not appear as Money In/Out until real payment moves; partial payments show only the moved portion.
- **Internal transfers:** Cash → Bank shows both row directions but contributes zero to business inflow/outflow summary.
- **Date correction:** changing Transaction Date must never mutate Created Date and must re-order Transaction-Date views/reports while preserving Created-Date audit ordering.
- **Dependency edits:** source-aware correction must block only an invalid field change (for example quantity below already returned quantity), not lock every editable field.
- **Double-entry deletion:** deleting a source-generated posting must undo the full balanced transaction and preserve immutable audit history; one debit or credit leg can never be deleted alone.

---

### Task 1: Shared transaction foundation, preferences and navigation

**Files:**
- Modify: `src/types/erp.ts`
- Create: `src/types/transactions.ts`
- Create: `src/contexts/UserPreferencesContext.tsx`
- Create: `src/utils/transactionDates.ts`
- Create: `src/utils/transactionProjection.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Create: `src/pages/Daybook.tsx`
- Create: `src/pages/Accounts.tsx`
- Create: `src/pages/AuditLedger.tsx`
- Test: `tests/transactionDates.test.ts`
- Test: `tests/transactionProjection.test.ts`

**Interfaces:**
- Produces: `TerminologyMode = 'simple' | 'accounting'`
- Produces: `EntryDateView = 'transaction' | 'created'`
- Produces: `UserPreferencesContext` with `terminologyMode`, `entryDateView`, `setTerminologyMode(mode)`, `setEntryDateView(view)`
- Produces: `TransactionMeta` with `transactionDate`, `createdAt`, `postedBy`, `updatedAt?`, `updatedBy?`, `deletedAt?`, `deletedBy?`
- Produces: `UnifiedTransaction` with source identity, party/account/payment summary, amount, moneyIn, moneyOut, status and audit metadata
- Produces: `dateForView(transaction, view)`, `isInDateRange(transaction, view, from, to)`, `sortTransactionsByDate(transactions, view)`
- Produces: `projectUnifiedTransactions(sources)` as the canonical read model for Daybook/Audit Ledger

- [ ] **Step 1: Write failing tests for date semantics and transaction projection**

Assert:
- default date view helpers use Transaction Date;
- Created Date remains separately available;
- selected single date and inclusive date range filters work;
- a fully credit sale has `moneyIn=0`, `moneyOut=0`;
- partial sale uses only actual paid amount for `moneyIn`;
- multi-payment sale projects one transaction with summed payment and account labels;
- internal transfer projects both `moneyIn` and `moneyOut` but `countsTowardCashflow=false`.

- [ ] **Step 2: Run the focused tests and confirm RED**

Run:
`npm test -- tests/transactionDates.test.ts tests/transactionProjection.test.ts`

Expected: FAIL because the new types/helpers do not exist.

- [ ] **Step 3: Implement the shared types, preferences and projection helpers**

Add transaction/audit metadata to existing demo domain records without removing their current `date` fields in one destructive pass. Introduce adapters so Sales, Purchases, Expenses and Finance can incrementally feed `UnifiedTransaction`.

Persist the two user display preferences with stable local-storage keys for this UI repository:
- `hisabiq-terminology-mode`
- `hisabiq-entry-date-view`

Defaults:
- terminology = `simple`
- date view = `transaction`

- [ ] **Step 4: Add routes and sidebar entries with placeholder-but-real pages**

Routes:
- `/app/finance`
- `/app/daybook`
- `/app/accounts`
- `/app/audit-ledger`
- `/app/reconciliation`

Sidebar order follows the spec. Rename `Finance & Accounts` to `Finance · টাকা-পয়সা`; add Daybook, Accounts and Audit Ledger.

- [ ] **Step 5: Verify Task 1**

Run:
`npm test`
`npm run build`

Expected: all tests pass; Vite build succeeds; all four routes render without console/runtime errors.

- [ ] **Step 6: Commit Task 1**

Commit message:
`feat: add shared transaction foundation and module routes`

---

### Task 2: Finance restructure and full Daybook experience

**Files:**
- Modify: `src/pages/Finance.tsx`
- Modify: `src/components/finance/FinanceRecordDialogs.tsx`
- Modify: `src/data/financeAccounts.ts`
- Create: `src/data/cheques.ts`
- Create: `src/components/finance/ChequeDialogs.tsx`
- Modify: `src/pages/Daybook.tsx`
- Create: `src/components/daybook/DaybookFilters.tsx`
- Create: `src/components/daybook/TransactionDetailsDialog.tsx`
- Create: `src/components/daybook/DaybookActions.tsx`
- Modify: `src/pages/Sales.tsx`
- Modify: `src/pages/Purchases.tsx`
- Modify: `src/pages/Expenses.tsx`
- Modify: `src/pages/Pos.tsx`
- Modify: `src/data/sales.ts`
- Modify: `src/data/purchases.ts`
- Test: `tests/daybook.test.ts`
- Test: `tests/financeTransactions.test.ts`

**Interfaces:**
- Consumes: `UnifiedTransaction`, date-view helpers and preferences from Task 1
- Produces: `DaybookQuery` and `filterDaybookTransactions(transactions, query)`
- Produces: `cashflowSummary(transactions)` excluding internal transfers
- Produces: cheque types/statuses and `chequeMoneyEffect(cheque)`
- Produces: source-action descriptors for Open/Edit/Delete routing

- [ ] **Step 1: Write failing tests for Daybook cashflow, filters and cheque money effects**

Assert:
- one selected date returns only matching transactions;
- custom inclusive date range returns both boundary dates;
- credit invoice has blank/zero Money In/Out;
- actual payment creates Money In;
- customer cash refund creates Money Out;
- internal transfer displays both directions but is excluded from summary totals;
- uncleared received cheque does not increase Bank balance;
- cleared cheque does.

- [ ] **Step 2: Run focused tests and confirm RED**

Run:
`npm test -- tests/daybook.test.ts tests/financeTransactions.test.ts`

Expected: FAIL before helper implementation.

- [ ] **Step 3: Restructure Finance around the approved six tabs**

Finance tabs:
1. Overview
2. Money Accounts
3. Counter
4. Loans & Owners
5. Cheques
6. Cash Sessions

Reuse current Finance data/dialog behavior where it belongs. Replace confusing “Accounts” labels with **Money Accounts**. Keep transfers inside Counter/Money Account actions. Add cheque receive/issue/PDC states without moving reconciliation into Finance.

- [ ] **Step 4: Build Daybook as the single global transaction list**

Implement:
- default Today filter;
- selected date;
- selected inclusive date range;
- Search, Type, Account, User, Status filters;
- compact columns: Date, Type, No./Reference, Party, Details, Account, Money In, Money Out, Posted by, Status, Action;
- multi-payment account summary;
- Deleted status filter;
- terminology/date-view preference rendering;
- short Bangla helper text and tooltip only for longer explanations.

- [ ] **Step 5: Build source-aware Open/Edit/Delete entry points**

Open uses `TransactionDetailsDialog` and shows both Transaction Date and Created Date when different.

Edit routes to the existing source editor for this phase and exposes Transaction Date in source dialogs/pages.

Delete uses a source-action descriptor and the approved user-facing **Delete** wording. For demo/UI state, perform safe source-list reversal/soft-delete behavior rather than hiding one projected row only.

- [ ] **Step 6: Verify Task 2**

Run:
`npm test`
`npm run build`

Manual acceptance:
- credit sale shows no Money In;
- partial payment shows only paid amount;
- Cash → Bank transfer row shows both sides but summary is unchanged;
- changing Entry date view changes Daybook display/filter basis;
- Finance no longer contains accounting-report concepts.

- [ ] **Step 7: Commit Task 2**

Commit message:
`feat: separate finance operations and add daybook`

---

### Task 3: Accounts core, automatic posting projection and financial statements

**Files:**
- Create: `src/types/accounting.ts`
- Create: `src/data/accounting.ts`
- Create: `src/utils/accountingProjection.ts`
- Modify: `src/pages/Accounts.tsx`
- Create: `src/components/accounts/VoucherDialog.tsx`
- Create: `src/components/accounts/LedgerView.tsx`
- Create: `src/components/accounts/TrialBalanceView.tsx`
- Create: `src/components/accounts/StatementsView.tsx`
- Create: `src/components/accounts/ChartOfAccountsView.tsx`
- Modify: `src/components/parties/LedgerTable.tsx`
- Modify: `src/components/parties/PartyDetail.tsx`
- Test: `tests/accountingProjection.test.ts`

**Interfaces:**
- Consumes: source transactions and Transaction Date from Tasks 1–2
- Produces: `AccountingAccount`, `Posting`, `PostingLine`, `VoucherType = 'receipt' | 'payment' | 'transfer' | 'adjustment'`
- Produces: `postingForTransaction(transaction)`
- Produces: `trialBalance(postings)`
- Produces: `profitAndLoss(postings, range)`
- Produces: `balanceSheet(postings, asOf)`
- Produces: `ledgerForAccount(accountId, postings, dateView)`

- [ ] **Step 1: Write failing accounting tests**

Pin:
- cash sale posts Cash Dr / Sales Cr and COGS Dr / Inventory Cr;
- credit sale posts Customer Due instead of Cash for the unpaid portion;
- customer payment moves Money Account vs Customer Due without adding revenue;
- internal transfer posts balanced Money Account-to-Money Account lines and no income/expense;
- every posting is balanced;
- Trial Balance totals Debit == Credit;
- P&L and Balance Sheet use Transaction Date even when UI preference is Created Date.

- [ ] **Step 2: Run focused accounting tests and confirm RED**

Run:
`npm test -- tests/accountingProjection.test.ts`

Expected: FAIL before accounting projection exists.

- [ ] **Step 3: Implement accounting types, default Bangladesh-SMB chart and source projections**

Use familiar main labels:
- Receipt Voucher
- Payment Voucher
- Account Transfer
- Adjustment Entry

Do not expose Contra Voucher/Journal Voucher as primary labels.

Implement source-generated postings as derived/read-only projections. Manual Adjustment Entry is its own source.

- [ ] **Step 4: Build Accounts UI**

Accounts tabs:
1. Overview
2. Vouchers
3. Ledger
4. Trial Balance
5. Statements
6. Chart of Accounts

Implement Simple/Accounting terminology behavior. Ledger can display/sort/filter by the user's date view, but financial-statement calculations remain Transaction-Date based.

- [ ] **Step 5: Verify Task 3**

Run:
`npm test`
`npm run build`

Manual acceptance:
- switching terminology affects wording only;
- Trial Balance remains balanced;
- a partial sale does not double-count revenue when payment arrives;
- Account Transfer appears balanced with no income/expense impact.

- [ ] **Step 6: Commit Task 3**

Commit message:
`feat: add accounts ledger and financial statements`

---

### Task 4: Audit Ledger correction engine and immutable audit history

**Files:**
- Create: `src/types/audit.ts`
- Create: `src/data/auditLedger.ts`
- Create: `src/utils/auditEngine.ts`
- Modify: `src/pages/AuditLedger.tsx`
- Create: `src/components/audit/AuditFilters.tsx`
- Create: `src/components/audit/AuditDetailsDialog.tsx`
- Create: `src/components/audit/AuditEditDialog.tsx`
- Create: `src/components/audit/ImpactPreview.tsx`
- Create: `src/components/audit/AuditTimeline.tsx`
- Test: `tests/auditEngine.test.ts`

**Interfaces:**
- Consumes: `UnifiedTransaction`, source records, accounting postings and source-action descriptors
- Produces: `AuditEvent`, `AuditChange`, `AuditImpact`, `CorrectionCommand`, `DeleteCommand`
- Produces: `buildImpactPreview(command, state)`
- Produces: `validateCorrection(command, state)`
- Produces: `applyCorrection(command, state)`
- Produces: `applyDelete(command, state)`
- Produces: immutable `auditTimelineFor(sourceId)`

- [ ] **Step 1: Write failing Audit Ledger engine tests**

Assert:
- editing Transaction Date changes Transaction Date but not Created Date;
- editing customer moves receivable effect from old party to new party;
- editing payment account moves money effect from old account to new account;
- editing amount updates source + projected balances + posting atomically;
- invalid sale quantity below already-returned quantity is blocked while unrelated field edits remain allowed;
- meaningful posted edits require a reason;
- note-only correction can save without a forced reason but still creates audit event;
- deleting source-generated posting deletes/undoes the complete balanced source transaction;
- deleting one debit/credit leg is impossible by type/API;
- audit events retain before/after/user/time/reason and cannot be mutated through correction APIs.

- [ ] **Step 2: Run focused audit tests and confirm RED**

Run:
`npm test -- tests/auditEngine.test.ts`

Expected: FAIL before audit engine implementation.

- [ ] **Step 3: Implement source-aware correction and dependency validation**

Implement correction adapters by source type. Keep business-rule ownership explicit:
- Sale adapter
- Purchase adapter
- Expense adapter
- Finance adapter
- Accounts-manual-entry adapter

For this UI repository, adapters update the in-memory/demo state model and regenerate projections in one operation. Do not add a second independent ledger mutation path.

- [ ] **Step 4: Build Audit Ledger list/details/edit/impact UI**

Audit Ledger list includes:
- Transaction Date
- Created Date
- Type
- No./Reference
- Party/Person
- Source
- Account/Payment
- Amount
- Posted by
- Last changed by
- Status
- Action

Audit Edit:
- only safe/source-supported fields;
- Review Changes step;
- contextual Impact Preview;
- required reason for meaningful changes;
- delete reason always required;
- dependency blockers explain the practical reason in simple Bangla.

- [ ] **Step 5: Implement complete-posting delete and immutable timeline**

Delete operates on the source transaction/posting as one unit. Preserve Deleted status and audit history. Individual Debit/Credit legs are inspectable but never deletable independently.

- [ ] **Step 6: Verify Task 4**

Run:
`npm test`
`npm run build`

Manual acceptance:
- date, party, amount and payment-account changes show before → after;
- impacts list only affected modules;
- blocked dependent edit does not lock unrelated editable fields;
- Delete cannot unbalance the accounting posting;
- audit timeline remains visible after deletion.

- [ ] **Step 7: Commit Task 4**

Commit message:
`feat: add source-aware audit ledger corrections`

---

### Task 5: Cross-module integration, permissions, regression testing and deployment

**Files:**
- Modify: `src/pages/Sales.tsx`
- Modify: `src/pages/Purchases.tsx`
- Modify: `src/pages/Expenses.tsx`
- Modify: `src/pages/Finance.tsx`
- Modify: `src/pages/Daybook.tsx`
- Modify: `src/pages/Accounts.tsx`
- Modify: `src/pages/AuditLedger.tsx`
- Modify: `src/pages/Reconciliation.tsx`
- Modify: `src/components/layout/Sidebar.tsx`
- Create/Modify: focused tests under `tests/*.test.ts` as failures are found
- Modify: docs only if implementation reveals an approved-spec mismatch requiring explicit documentation

**Interfaces:**
- Consumes: all prior task interfaces
- Produces: final integrated UI with consistent source identity, permissions, terminology/date preferences and audit behavior

- [ ] **Step 1: Wire permission-aware actions**

For the UI reference implementation, define permission capability checks so:
- Daybook has View Daybook;
- Open/Edit/Delete inherit source-module permissions;
- Audit Ledger has View/Correct/Delete Audit permissions;
- Audit correction/delete also requires the matching source-module permission.

Keep the capability API centralized so later backend authorization can replace demo values without rewriting page logic.

- [ ] **Step 2: Add end-to-end pure integration tests for the approved acceptance scenario**

Scenario:
1. create/simulate sale;
2. receive partial bKash payment;
3. leave remainder due;
4. receive later Bank payment;
5. correct Transaction Date;
6. correct one payment account;
7. verify Daybook Money In;
8. verify Finance account balances;
9. verify accounting postings stay balanced;
10. verify P&L/Balance Sheet use Transaction Date;
11. verify audit events;
12. safely delete an eligible payment and verify all projections update.

- [ ] **Step 3: Run full automated verification**

Run:
`npm test`
`npm run build`

Expected: all tests PASS; Vite production build PASS.

Do not add `tsc --noEmit` to CI in this task because the repository has known unrelated pre-existing strict TypeScript errors outside this scope.

- [ ] **Step 4: Run UI/UX regression review**

Check:
- desktop and narrow/mobile layouts;
- tab indicators remain 2px teal;
- FloatingPanel/portaled menus are not clipped;
- Bangla helpers do not make dense tables/forms overflow;
- long helper text uses Tooltip;
- no monospaced digits;
- numeric columns are right-aligned;
- action menus are consistent;
- Finance/Daybook/Accounts/Audit Ledger each have one clear purpose.

Use Playwright/browser verification if available in the execution environment; otherwise use the existing build plus targeted manual preview checks.

- [ ] **Step 5: Request whole-branch review and fix findings**

Review specifically for:
- duplicate sources of truth;
- cashflow misclassification;
- date/audit corruption;
- unbalanced accounting postings;
- dependency-safe editing/deletion;
- language that violates the approved familiar-English/simple-Bangla rules.

- [ ] **Step 6: Final verification, PR and deployment**

Run again after fixes:
`npm test`
`npm run build`

Then:
- push branch;
- open/update PR;
- wait for GitHub UI Check;
- verify Cloudflare Preview;
- merge only when green;
- verify Cloudflare Production on merged `main`.

- [ ] **Step 7: Commit final integration fixes**

Commit message:
`test: verify finance daybook accounts and audit flows`
