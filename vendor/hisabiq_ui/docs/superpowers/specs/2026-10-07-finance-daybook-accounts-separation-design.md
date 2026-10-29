# HisabIQ Finance, Daybook, Accounts & Audit Ledger — Design Specification

Date: 2026-10-07  
Status: Approved conversational design; implementation not yet approved  
Scope: UI/UX architecture for `hisabiq_ui`

## 1. Goal

Separate the current combined Finance & Accounts area into three simple modules that match how Bangladeshi SMB users think about their work:

- **Finance · টাকা-পয়সা** — where money is and how it moves.
- **Daybook · দৈনিক লেনদেন** — one place to find and manage all business transactions.
- **Accounts · হিসাব** — bookkeeping, vouchers, ledgers, trial balance and financial statements.
- **Audit Ledger · হিসাব যাচাই** — advanced inspection, correction, deletion and audit history for posted transactions.

The design must follow HisabIQ's core rule: **Keep It Simple.** Normal users should not need accounting knowledge to operate daily workflows.

## 2. Information architecture

Sidebar order:

1. Dashboard
2. POS / New Sale
3. Sales
4. Warranty
5. Products
6. Parties & Ledger
7. Purchases
8. Expenses
9. **Finance · টাকা-পয়সা**
10. **Daybook · দৈনিক লেনদেন**
11. **Accounts · হিসাব**
12. **Audit Ledger · হিসাব যাচাই**
13. Reconciliation
14. Reports

The old **Finance & Accounts** combined entry is removed.

### Module ownership

| Module | Owns |
|---|---|
| Sales | Sales, returns, invoice payment workflows |
| Purchases | Purchases, purchase returns, supplier payment workflows |
| Expenses | Expense records |
| Finance | Money accounts, generic receive/pay, transfers, owners, lenders, borrowers, cheques, cash sessions |
| Daybook | Finding, opening and managing existing business transactions |
| Accounts | Accounting representation, vouchers, ledgers and financial statements |
| Audit Ledger | Advanced source-aware review, correction, deletion, impact preview and immutable change history |
| Reconciliation | Bank/cash statement reconciliation |

Daybook is a control surface, not a second owner of business logic. Every transaction keeps one source of truth.

## 3. Language and terminology

### 3.1 Primary language rule

- Main UI labels use familiar professional English.
- Bangla helper text uses natural, conversational Bangla.
- Do not use difficult textbook Bangla when a plain explanation is clearer.
- Short Bangla helpers appear inline.
- Long explanations use the existing Tooltip component.

Examples:

- **Finance** · টাকা-পয়সা
- **Daybook** · দৈনিক লেনদেন
- **Accounts** · হিসাব
- **Posted by** · কে এন্ট্রি করেছেন
- **Customer Due** · গ্রাহকের কাছ থেকে পাবো
- **Supplier Due** · সাপ্লায়ারকে দিতে হবে
- **Profit & Loss** · কত লাভ বা ক্ষতি হয়েছে

### 3.2 Replace unfamiliar accounting jargon

Keep familiar terms where useful, but replace words ordinary users commonly do not use.

| Avoid as primary UI | Use |
|---|---|
| Drawings | Owner Withdrawal |
| Contra Voucher | Account Transfer |
| Journal Voucher | Adjustment Entry |
| Accounts Receivable | Customer Due in Simple mode |
| Accounts Payable | Supplier Due in Simple mode |
| Narration | Description |
| Particulars | Details |
| Reversal | Undo Transaction / Delete effect internally |
| General Ledger | Ledger where context is clear |

### 3.3 Voucher naming

Keep commonly understood voucher terms:

- **Receipt Voucher**
- **Payment Voucher**

Replace unfamiliar voucher names:

- **Account Transfer** instead of Contra Voucher
- **Adjustment Entry** instead of Journal Voucher

## 4. Per-user terminology mode

Each user can choose their own terminology. Admin cannot lock this choice.

Setting:

- **Simple** · সহজ ব্যবসার ভাষা — default
- **Accounting** · হিসাবরক্ষণের ভাষা

The preference belongs to the user account, not the browser/device.

Changing terminology changes display wording only. It must never change data, permissions, posting rules or calculations.

### Simple mode

Prefer context-aware language:

- Money In
- Money Out
- Received
- Paid
- Customer Due
- Supplier Due
- Owner Withdrawal
- Account Transfer
- Adjustment Entry

### Accounting mode

Expose formal accounting terms where meaningful:

- Debit
- Credit
- Accounts Receivable
- Accounts Payable
- accounting-side balances and posting details

Common operational actions remain familiar in both modes. For example, **Account Transfer** remains Account Transfer even in Accounting mode; accounting details may show Debit/Credit underneath.

### Debit/Credit rule

Do not globally translate Debit to Money In or Credit to Money Out. That mapping is only valid for some account types.

- Finance, Sales, Purchases, Daybook and ordinary workflows use context-aware terms.
- Trial Balance, Ledger and advanced Adjustment Entry may show Debit/Credit.
- Bangla tooltip/helper explains the effect simply for that specific context.

## 5. Finance module

Purpose: answer **"Where is the money and how is it moving?"**

Tabs:

1. Overview
2. Money Accounts
3. Counter
4. Loans & Owners
5. Cheques
6. Cash Sessions

Transfers are available from Counter and Money Account actions instead of requiring a separate full module tab.

### 5.1 Overview

Summary cards:

- Available Money
- Cash
- Bank
- Mobile Banking
- Cheques Awaiting Clearance
- Money We Owe
- Money Others Owe Us

Also show:

- Today's Money In
- Today's Money Out
- Net movement
- Money-account balances
- actionable alerts such as cheque due, bounced cheque, cash shortage, reconciliation needed, loan payment due

### 5.2 Money Accounts · টাকার অ্যাকাউন্ট

Rename the current Finance "Accounts" concept to **Money Accounts** to avoid confusion with the Accounts module.

Supported types:

- Cash
- Petty Cash
- Bank
- Mobile Banking

Mobile banking providers may include:

- bKash
- Nagad
- Rocket
- Upay
- Other

Actions:

- View ledger
- Money in
- Money out
- Transfer
- Reconcile
- Edit
- Deactivate

### 5.3 Counter

Four primary actions:

- Receive
- Pay
- Expense
- Transfer

Examples:

Receive:
- Customer payment
- Loan received
- Owner investment
- Borrower repayment
- Other income

Pay:
- Supplier payment
- Loan repayment
- Owner withdrawal
- Give borrower money
- Other payment

Transfer:
- Cash → Bank
- Bank → bKash
- bKash → Nagad
- Bank → Petty Cash

Internal transfers never create income or expense.

### 5.4 Loans & Owners

Keep Owner, Lender and Borrower balances separate.

Owner:
- capital invested
- owner withdrawal
- owner advance
- repayment to owner

Lender:
- money borrowed
- additional borrowing
- repayment
- current amount to repay

Borrower:
- money given
- repayment received
- current amount to receive

Borrower money is separate from Customer Due.

### 5.5 Cheques

First-class Bangladesh-focused cheque register.

Cheque Received:
- cheque number
- bank
- branch
- account holder
- amount
- received from
- received date
- cheque date
- deposit account
- reference
- attachment
- note

Statuses:
- Received
- Deposited
- Cleared
- Bounced
- Cancelled
- Returned

Cheque Issued statuses:
- Issued
- Presented
- Cleared
- Cancelled
- Stopped
- Returned/Bounced

Post-dated cheques are marked **PDC · পরে জমা দেওয়ার চেক** and can create upcoming alerts.

A received cheque does not increase bank balance until it is cleared.

### 5.6 Cash Sessions

Keep the current cash-session concept:

- Opening cash
- Expected cash
- Counted cash
- Short/over
- Cash in
- Cash out
- User/cashier
- Open/close time
- Notes

A variance is shown clearly but does not automatically create a balancing transaction.

## 6. Daybook module

Purpose: answer **"What business transactions happened?"**

Daybook is the single global transaction list. Finance and Accounts may show small recent-activity sections but must not grow duplicate "all transactions" tables.

Daybook does not create new transactions.

### 6.1 Included transactions

Include business transactions that change at least one of:

- money
- stock value
- customer/supplier balance
- owner/lender/borrower balance
- accounting records

Examples:

- sale
- sale return
- customer payment
- customer refund
- purchase
- purchase return
- supplier payment
- expense
- other income
- generic finance receive/pay
- account transfer
- owner investment
- owner withdrawal
- loan received
- loan repayment
- borrower money given/received
- cheque movement
- financially relevant stock adjustment
- Receipt Voucher
- Payment Voucher
- Adjustment Entry

Do not include general activity such as product edits, warranty status changes, settings changes or draft saves.

### 6.2 Table

Recommended compact columns:

- Date
- Type
- No. / Reference
- Party
- Details
- Account
- **Money In**
- **Money Out**
- Posted by
- Status
- Action

Default date filter: **Today**.

Daybook must support both:

- **Selected date** — show transactions for one chosen date.
- **Selected date range** — show transactions between a From date and To date, inclusive.

Minimal filters:

- Search
- Date / Date range
- Type
- Account
- User
- Status

Quick dates:
- Today
- Yesterday
- This week
- This month
- Custom range

The date filter follows the user's **Entry date view** preference:

- **Transaction Date** — default; filter, sort and show entries by the business transaction date.
- **Created Date** — filter, sort and show entries by when the entry was actually created in HisabIQ.

When Transaction Date and Created Date differ, the transaction details must show both dates clearly.

### 6.3 Transaction date and created date

Every business transaction keeps two separate dates:

- **Transaction Date** — the date the business transaction belongs to. This is the normal date used for ledgers, accounting periods and reports.
- **Created Date** — when the record was actually created in HisabIQ. This is audit information and is never editable.

Default user preference:

- **Entry date view: Transaction Date**

Per-user setting:

- **Transaction Date** · যে তারিখের লেনদেন
- **Created Date** · সফটওয়্যারে যেদিন এন্ট্রি হয়েছে

A longer tooltip explains:

> এই পছন্দ Daybook ও Ledger-এ কোন তারিখ দিয়ে এন্ট্রি দেখানো, সাজানো ও খোঁজা হবে তা বদলায়। হিসাবের আসল Transaction Date বদলায় না।

This preference changes presentation/filtering only. It does not change accounting data.

Financial statements, Trial Balance periods and accounting calculations always use **Transaction Date**, regardless of the user's Entry date view preference.

### 6.4 Money In / Money Out semantics

These columns show **actual money movement only**.

Credit sale:
- Money In: —
- Money Out: —
- show Due status/helper

Partially paid sale:
- Money In = amount actually received
- unpaid amount remains Due

Credit purchase:
- both money columns blank until payment occurs

Expense paid immediately:
- Money Out = actual paid amount

Return:
- if no refund occurs, both blank
- refund to customer = actual refunded amount under Money Out
- supplier refund received = actual received amount under Money In

### 6.5 Internal transfers

For Cash → DBBL ৳25,000:

- Money In = ৳25,000
- Money Out = ৳25,000
- mark as **Internal Transfer · নিজের অ্যাকাউন্টে টাকা সরানো**

Internal transfers are excluded from Daybook business Money In/Money Out summary totals so they do not appear as income or expense.

### 6.6 Multiple payment methods

A transaction paid through multiple accounts remains **one Daybook row**.

Example:
- Cash ৳8,000
- bKash ৳7,000
- DBBL ৳5,000

Daybook:
- Account: Cash + bKash + DBBL
- Money In: ৳20,000

Opening the transaction shows the payment breakdown.

### 6.7 Posted by and audit display

Daybook shows the real person who performed the business action.

Example:
- Posted by: Rahim

If accounting records were generated automatically, details may also show:
- Accounting posting: System

Do not show System as the main Posted by value when a user caused the transaction.

Open details should show:

- Posted by
- Posted at
- Last edited by
- Last edited at
- Deleted by, if deleted
- Deleted at, if deleted
- Delete reason, if applicable

### 6.8 Actions

Every Daybook row uses the standard `⋯` action pattern.

Primary actions:

- Open
- Edit
- Delete

Contextual secondary actions may include:

- Print
- Duplicate
- Go to source

Do not overload menus with unnecessary actions.

### 6.9 Open

Open shows a consistent transaction-detail surface in Daybook, but reuses source-specific details where needed.

It does not create a second business-rule implementation.

### 6.10 Edit

Edit opens the original module's editor:

- Sale → POS/Sales editor
- Purchase → Purchase editor
- Expense → Expense editor
- Customer/Supplier payment → relevant payment editor
- Transfer → Finance editor
- Receipt/Payment Voucher → Accounts editor
- Adjustment Entry → Accounts editor

Every editable business transaction includes a **Transaction Date** field in its source editor.

Rules:

- Transaction Date may be changed by a user who already has permission to edit that source transaction.
- Created Date is immutable and never changes when Transaction Date changes.
- Changing the Transaction Date of an already-posted transaction records the old date, new date, editor, edit time and a short reason in audit history.
- Changing one transaction's date does not silently rewrite the dates of linked transactions. For example, changing an invoice date does not change a later payment's own Transaction Date.
- After saving, Daybook, Ledgers and accounting reports immediately reflect the new Transaction Date where applicable.

After saving, Daybook reflects the updated source transaction.

### 6.11 Delete

The UI says **Delete**.

Internally, posted financial transactions use safe reversal/soft-delete semantics. Never hard-delete posted financial history.

If safe:
- remove/undo effects on money balances
- party balances
- stock
- due status
- accounting postings
- linked derived totals

If dependent activity exists, keep Delete visible but block the action with a clear explanation.

Examples:

- "This sale has a Return. Delete the Return first."
- "This invoice has a Payment. Fix or delete that Payment first."

Deleted transactions are hidden from the normal view but available through:
- Status → Deleted

Deleted rows retain audit information.

### 6.12 Permissions

Daybook has one dedicated permission:

- **View Daybook**

Open/Edit/Delete permission is inherited from the source module.

Examples:

- user can view Sales but cannot edit → Daybook Open only
- user can edit Sales → Daybook Edit available
- user lacks Sales delete permission → Daybook Delete unavailable/disabled according to the common action pattern

Do not create duplicate Daybook Edit/Delete permissions.

## 7. Accounts module

Purpose: answer **"What do the books say?"**

Tabs:

1. Overview
2. Vouchers
3. Ledger
4. Trial Balance
5. Statements
6. Chart of Accounts

Daybook is not inside Accounts.

### 7.1 Overview

Keep simple:

- Profit
- Customer Due / Accounts Receivable according to terminology mode
- Supplier Due / Accounts Payable according to terminology mode
- Assets
- Liabilities

Shortcuts:
- Vouchers
- Ledger
- Trial Balance
- Profit & Loss
- Balance Sheet

### 7.2 Automatic posting

Normal users work in Sales, Purchases, Expenses and Finance. HisabIQ automatically creates accounting effects.

Example cash sale ৳1,000 with COGS ৳700:

- Cash Dr ৳1,000
- Sales Cr ৳1,000
- COGS Dr ৳700
- Inventory Cr ৳700

These accounting lines are not entered manually during normal selling.

### 7.3 Vouchers

User-facing types:

- Receipt Voucher
- Payment Voucher
- Account Transfer
- Adjustment Entry

Normal Receipt/Payment forms stay simple. Advanced accounting details may be progressively disclosed.

### 7.4 Ledger

Choose an account and show:

- Date
- Voucher
- Details
- Debit
- Credit
- Balance

Default ordering and date filtering use **Transaction Date**.

The user's **Entry date view** preference may switch the Ledger to Created Date for display, sorting and filtering. When the two dates differ, details expose both.

Accounting reports and period calculations still use Transaction Date even when the Ledger is being viewed by Created Date.

In Simple mode, use friendlier context-specific wording where possible. In inherently accounting reports, Debit/Credit remain available with simple Bangla helpers/tooltips.

### 7.5 Trial Balance

Keep official accounting terms:

- Account
- Debit
- Credit

Bangla helper/tooltip explains simply that this screen checks whether the accounting sides match.

Show:
- Total Debit
- Total Credit
- Balanced / Needs review

### 7.6 Statements

Profit & Loss:
- Income
- Cost of Goods Sold
- Gross Profit
- Expenses
- Net Profit

Balance Sheet:
- Assets
- Liabilities
- Equity
- Assets = Liabilities + Equity validation

### 7.7 Chart of Accounts

Provide a sensible Bangladesh-SMB default chart. Users do not build accounting structure from zero.

Top groups:
- Assets
- Liabilities
- Equity
- Income
- Expenses

Include common accounts for:
- Cash
- Bank
- Mobile Banking
- Customer Due
- Inventory
- Supplier Due
- Loans
- Owner Capital
- Owner Withdrawal
- Sales
- Service Income
- Cost of Goods Sold
- Rent
- Salary
- Electricity
- Transport
- Delivery
- Mobile/Internet
- Repair
- Bank charge
- MFS charge
- Discount
- Miscellaneous expense

Custom accounts remain possible but are not the primary workflow.

## 8. Audit Ledger module

Purpose: provide an advanced, permission-controlled workspace for **reviewing and correcting posted financial transactions without breaking the source transaction, balances, stock, ledgers or double-entry accounting**.

User-facing title:

> **Audit Ledger · হিসাব যাচাই**

This is a separate sidebar module. It is not merged into Daybook or Accounts.

Daybook remains the simple daily transaction manager. Audit Ledger is the advanced correction/audit workspace for Accountant/Admin users and other explicitly permitted users.

### 8.1 Core architecture: source-aware, never ledger-only

Every Audit Ledger record knows its source.

Examples:

- Sale → Sales/POS
- Sale Return → Sales
- Customer Payment → Sales/Parties payment source
- Purchase → Purchases
- Supplier Payment → Purchases/Parties payment source
- Expense → Expenses
- Account Transfer → Finance
- Owner/Lender/Borrower transaction → Finance
- Receipt/Payment Voucher → Accounts
- Adjustment Entry → Accounts
- Opening Balance → setup/accounting source

If a posted accounting entry was generated from another business transaction, **Audit Ledger edits the original source transaction**, then HisabIQ recalculates and rebuilds all dependent effects.

Audit Ledger must never directly change only the accounting copy while leaving the source transaction unchanged.

Example:

> Sale INV-000241 changes from ৳15,000 to ৳14,500.

The Sale remains the source of truth. HisabIQ updates/rebuilds, as applicable:

- invoice amount
- customer balance
- payment allocation
- Money Account balances
- stock effects
- COGS
- gross profit
- accounting posting
- Daybook
- Ledgers
- Trial Balance
- Profit & Loss
- Balance Sheet
- reports

Manual **Adjustment Entry** records are the exception: the accounting entry itself is the source, so Audit Ledger can edit that source directly.

### 8.2 Audit Ledger list

Keep the list compact and powerful.

Recommended columns:

- Transaction Date
- Created Date
- Type
- No. / Reference
- Party / Person
- Source
- Account / Payment
- Amount
- Posted by
- Last changed by
- Status
- Action

Default view uses **Transaction Date**. The user's existing Entry date view preference can switch display/sort/filter to Created Date.

Filters:

- Search
- Selected date
- Selected date range
- Transaction type
- Source module
- Party/person
- Money Account
- Posted by
- Changed by
- Status
- Changed / unchanged

Search should match useful identifiers such as invoice number, voucher number, party, phone where available, reference and amount.

### 8.3 Open / inspect transaction

Opening a record shows one consistent audit detail view with:

**Transaction**
- source type
- transaction number
- Transaction Date
- Created Date
- amount
- party/person
- account/payment method
- status
- source module

**Posting**
- Money In / Money Out where relevant
- accounting effect
- linked Debit/Credit lines for Accounting terminology users
- stock/COGS effect where relevant
- customer/supplier/owner/lender/borrower balance effect

**People**
- Posted by
- Posted at
- Last edited by
- Last edited at
- Deleted by / Deleted at if applicable

**Links**
- source transaction
- linked payments
- returns
- refunds
- cheque records
- warranty/other dependencies where they affect editability

**History**
- complete list of edits/deletions/restorations/corrections
- before → after values
- reason
- user
- timestamp

### 8.4 Centralized Audit Edit workspace

Audit Ledger has its own correction UI so the user can stay in one module.

The workspace edits the true source transaction through source-owned business rules. It does not duplicate or bypass the source module's validation logic.

The edit workspace exposes only fields that are safe and meaningful for the selected source type.

Common editable fields can include:

- Transaction Date
- party/person
- customer/supplier
- amount
- reference
- description/note
- payment method
- Money Account
- multiple-payment split
- expense category
- finance relationship/person
- accounting category/account mapping where permitted
- product, quantity, unit, price or discount where source rules permit
- tax/VAT fields when those modules exist

Created Date is never editable.

### 8.5 Deep edit rule

Audit Ledger follows:

> **Editable by default; block only a change that would make linked records invalid.**

A transaction is not automatically locked merely because dependent records exist.

Examples of normally allowed changes, when source rules can safely recalculate them:

- change Transaction Date
- fix party/person
- change reference/description
- change payment account
- edit payment split
- correct amount
- correct category/account mapping

Examples of dependency-aware blocking:

- sale quantity cannot be reduced below quantity already returned
- serial-tracked sold item cannot be replaced in a way that invalidates an existing return/warranty link without resolving that dependency
- payment cannot be reduced below an amount already allocated onward when no valid reallocation exists
- cheque state cannot be changed to a state that contradicts an already-settled linked transaction

Only the invalid field/change is blocked. The whole transaction should remain editable where other corrections are safe.

Error/helper language must explain the practical reason in simple Bangla, not expose database/accounting internals.

### 8.6 Impact Preview before save

Any financially meaningful edit to a posted transaction requires a **Review Changes / Impact Preview** step before saving.

Show:

**Changes**
- old value → new value for every changed field

Example:

- Transaction Date: 07 Oct → 05 Oct
- Customer: Rahman Hardware → Karim Hardware
- Amount: ৳15,000 → ৳14,500
- Payment Account: bKash → DBBL

**This will update**
- source transaction
- party balance
- Money Account balance
- stock / COGS where applicable
- linked payment allocations
- Daybook
- accounting posting
- Ledger
- Trial Balance
- Profit & Loss
- Balance Sheet
- affected reports

Only show impacts that actually apply to that transaction. Do not display a giant generic checklist.

### 8.7 Change reason

For posted records, a reason is required for **financially meaningful changes**, including:

- Transaction Date
- amount
- party/person
- customer/supplier
- payment account
- payment split
- product/quantity
- price/discount
- expense category
- accounting/account mapping
- any field that changes money, stock, balance, profit or accounting output

Field:

> **Reason for change · কেন পরিবর্তন করছেন**

For non-financial text-only corrections such as an internal note typo, HisabIQ records the audit event automatically but does not require a reason.

Delete always requires a reason.

### 8.8 Date correction rules

Audit Ledger may edit **Transaction Date** when the user has source edit permission.

- Created Date remains immutable.
- Audit history records old date, new date, user, time and reason.
- Ledgers, Daybook transaction-date view and accounting reports use the corrected Transaction Date.
- Changing one source transaction's date does not silently rewrite linked transactions' own dates.
- If a date change crosses a closed/locked accounting period in a future period-locking feature, the period rules must decide whether the change is allowed.

### 8.9 Amount and party correction

Amount and party/person corrections must update the source and every dependent balance atomically.

Examples:

Customer Payment:
- changing amount recalculates customer balance and Money Account balance
- changing customer moves the payment effect from the old customer to the new customer
- changing Bank → bKash removes the old bank effect and applies the new bKash effect

Expense:
- changing amount updates the Money Account and expense/accounting effect
- changing category updates reporting/account mapping

Sale/Purchase:
- changing financially relevant line data must recalculate totals, due, stock/COGS and accounting effects according to source rules

No intermediate inconsistent state may be saved.

### 8.10 Multiple-payment correction

For a transaction paid from multiple sources, Audit Edit shows the payment split.

Example:

- Cash ৳8,000
- bKash ৳7,000
- DBBL ৳5,000

The user can correct the split while the total stays valid.

Impact Preview shows each affected Money Account before save.

### 8.11 Double-entry presentation

Audit Ledger may show the generated accounting lines, especially in Accounting terminology mode.

Example:

- DBBL — Debit ৳20,000
- Customer Due — Credit ৳20,000

These lines are inspectable, but for source-generated postings they are **not independent editable records**.

To change them, edit the source transaction or an explicitly permitted accounting mapping field. HisabIQ then rebuilds the balanced posting.

### 8.12 Delete behavior

User-facing action:

> **Delete**

For a source-generated posting, Delete operates on the **complete linked source transaction/posting as one unit**.

Never allow deleting only one Debit or Credit line from a posted balanced entry.

Before deleting, show an Impact Preview such as:

- Bank balance will decrease by ৳20,000
- Customer Due will increase by ৳20,000
- Daybook entry will become Deleted
- linked accounting posting will be undone
- affected reports will update

Require:

> **Reason for delete · কেন মুছছেন**

Internally, use safe reversal/soft-delete semantics. Do not hard-delete financial audit history.

For a manual Adjustment Entry, the Adjustment Entry itself is the source. Delete removes/undoes the complete balanced adjustment as one unit while retaining its audit history.

### 8.13 Delete with dependencies

Keep Delete visible so actions remain predictable.

If deletion would make dependent records invalid, block the action and tell the user what must be resolved first.

Examples:

- "This sale has a Return. Delete the Return first."
- "This invoice has a later Payment. Fix or delete that Payment first."
- "This payment is linked to a settled cheque. Resolve the cheque first."

Do not silently cascade-delete unrelated business records.

### 8.14 Audit history is immutable

Every posted transaction maintains an immutable audit timeline.

Audit events can include:

- Created
- Edited
- Transaction Date changed
- Party changed
- Amount changed
- Payment method/account changed
- Payment split changed
- Source-specific financial fields changed
- Deleted
- Restored, if restore is supported later
- System accounting posting rebuilt

Each event records, where applicable:

- event type
- user
- timestamp
- reason
- field
- previous value
- new value
- source transaction ID
- audit event ID

Users may inspect audit history but cannot edit/delete audit-history events.

### 8.15 Permissions

Audit Ledger gets explicit high-level permissions, while source-module permissions remain authoritative.

Recommended permission model:

- **View Audit Ledger**
- **Correct Transactions**
- **Delete Transactions**

A user may only correct a source transaction when they have:
1. Audit Ledger correction permission, and
2. the relevant source-module edit permission.

A user may only delete when they have:
1. Audit Ledger delete permission, and
2. the relevant source-module delete permission.

Manual Accounts Adjustment Entries follow Accounts permissions.

Normal cashiers/salespeople should not receive Audit Ledger correction/delete permissions by default.

### 8.16 KISS rules

Despite its power, Audit Ledger must stay understandable:

- one global audit list
- one Open detail experience
- one Audit Edit workspace
- one Review Changes step
- one required reason field when needed
- source-aware automatic recalculation
- no manual "fix the debit then fix the credit" workflow
- no exposing raw database concepts
- no separate duplicated transaction engine

Advanced accounting details use progressive disclosure.

Bangla helpers explain the practical meaning in everyday language.

## 9. Reconciliation

Reconciliation remains a separate sidebar module.

Finance Money Accounts provide a **Reconcile** action that opens the Reconciliation module with the selected account context.

Do not duplicate bank-statement reconciliation inside Finance or Accounts.

## 10. Permissions and roles

Normal cashier:
- operational Finance actions according to permission
- View Daybook if granted
- no manual Adjustment Entry by default

Manager:
- broader Finance access
- view accounting reports
- common vouchers if permitted

Accountant/Admin:
- Chart of Accounts
- Adjustment Entry
- opening balances
- accounting reports
- Audit Ledger according to explicit View/Correct/Delete permissions
- accounting terminology mode available, but still a personal preference

Terminology preference is never admin-locked.

## 11. Editing, deletion and audit integrity

Draft records may be edited/deleted normally according to permissions.

Posted financial records:
- use user-facing **Edit** and **Delete**
- preserve audit integrity internally
- corrections/reversals must keep books, balances and stock consistent
- retain who created, edited and deleted the transaction and when
- retain both immutable Created Date and editable Transaction Date
- record Transaction Date changes in audit history with old date, new date, user, time and reason

Created Date is audit history and can never be edited.

Transaction Date is the business date and may be edited through the original transaction editor when the user has edit permission.

Avoid exposing accounting implementation jargon to ordinary users.

## 12. Opening balances

Provide a guided opening-balance workflow rather than requiring manual journals.

Supported opening values:

- Cash
- Bank
- Mobile Banking
- Customer Due
- Supplier Due
- Inventory
- Loans
- Owner Capital

HisabIQ creates the necessary accounting representation internally.

## 13. VAT / Tax scope

This UI phase may prepare account categories such as:

- VAT Payable
- Input VAT / VAT Receivable
- Tax Payable
- Withholding Tax

Do not claim full Bangladesh/NBR compliance in this phase. Mushak forms, BIN/TIN flows and statutory returns require a separate requirements/design phase.

## 14. UX constraints

- Follow the existing Magic Patterns HisabIQ visual language.
- Use the shared 2px teal `.erp-tab-active` indicator for underline tabs.
- Use existing dialogs, tooltips, tables, action menus and FloatingPanel patterns.
- Keep tables compact.
- Keep numeric values right-aligned.
- Avoid monospaced digits.
- Short Bangla helpers inline; long helpers in tooltips.
- Tooltips must be keyboard accessible and must never contain information required to complete a transaction.
- Do not duplicate source-module business rules inside Daybook.
- Prefer progressive disclosure over exposing accounting complexity by default.
- Date labels use short Bangla helpers; longer date-behavior explanations use tooltips.
- Entry date view is a per-user display preference and defaults to Transaction Date.

## 15. Implementation slices

Implementation should proceed in five dependency-ordered phases:

1. **Foundation & navigation** — split Finance/Daybook/Accounts/Audit Ledger; add per-user terminology/date-view settings; establish shared Transaction Date, immutable Created Date, source identity and audit-event model.
2. **Finance & Daybook operations** — restructure Finance, Money Accounts, Counter, Loans & Owners, Cheques, Cash Sessions; build unified Daybook with date/range filters, Money In/Out, Posted by and source-aware Open/Edit/Delete.
3. **Accounting core** — implement Accounts vouchers, Chart of Accounts, automatic posting representation, Ledger, Trial Balance, Profit & Loss, Balance Sheet and opening balances.
4. **Audit Ledger & correction engine** — build source-aware audit list/details, centralized Audit Edit workspace, dependency checks, Impact Preview, required reasons, atomic recalculation/reposting, complete-posting Delete and immutable audit history.
5. **Integration & verification** — connect all source modules, validate permissions and multi-payment/date-edit flows, run full tests/UI checks/Playwright/build, fix regressions, deploy preview, review, then merge and verify production.

## 16. Acceptance criteria

The design is successful when:

1. A normal user can operate Sales, Purchases, Expenses, Finance and Daybook without understanding Debit/Credit.
2. An accountant can switch their own terminology to Accounting and see formal terms where useful.
3. Daybook can find every business transaction and show the real user who posted it.
4. Daybook Open uses a consistent details experience.
5. Daybook Edit routes to the original module editor.
6. Daybook Delete safely undoes effects and preserves audit history.
7. Credit sales/purchases do not appear as Money In/Out until money actually moves.
8. Partial payments show only actual movement.
9. Internal transfers show both directions on the row but do not inflate business Money In/Out totals.
10. Multiple payment sources remain one Daybook transaction with a breakdown in details.
11. Finance contains money operations, not accounting reports.
12. Accounts contains accounting representation and reports, not a duplicate Daybook.
13. Reconciliation remains a separate specialized module.
14. The same underlying transaction is never copied into independent competing sources of truth.
15. Daybook can show one selected date or an inclusive selected date range.
16. Every transaction preserves immutable Created Date separately from editable Transaction Date.
17. Transaction Date is the default date basis for Daybook and Ledger.
18. Each user can switch Daybook/Ledger display, sorting and filtering between Transaction Date and Created Date without changing accounting data.
19. Trial Balance and financial-statement periods always use Transaction Date.
20. Editing a posted Transaction Date is permission-controlled and fully audited.
21. Audit Ledger is a separate module and never replaces Daybook's simple daily workflow.
22. Source-generated accounting entries can only be corrected through their source-aware transaction correction flow.
23. Audit Edit supports safe correction of date, amount, party/person, payment account/split and other source-supported fields.
24. Financially meaningful posted-record edits show a before → after Impact Preview and require a reason.
25. Dependency-aware editing blocks only invalid changes instead of locking the entire transaction.
26. Deleting a posted double-entry transaction always removes/undoes the complete balanced source posting; individual Debit/Credit lines cannot be deleted independently.
27. Audit deletion is soft/reversal-based, requires a reason and retains immutable history.
28. Audit history records who changed what, when and why and cannot itself be edited or deleted.
29. Audit Ledger correction/delete access requires both Audit Ledger permission and the corresponding source-module permission.
30. Corrections update all affected source data, Money Accounts, party balances, stock/COGS and accounting/reporting outputs atomically.

### End-to-end acceptance scenario

A user sells goods, receives part of the payment through bKash, leaves the remainder due, and later receives the balance through Bank.

Expected:

- Sales owns the invoice.
- Finance balances reflect only actual receipts.
- Daybook shows actual Money In for each real payment and the real user who posted it.
- The unpaid amount appears as Due until paid.
- Accounts receives the correct automatic accounting representation.
- Ledger and Trial Balance remain consistent.
- Profit & Loss reflects revenue and COGS correctly.
- Balance Sheet remains balanced.
- Editing or deleting an eligible source transaction updates all dependent views consistently without hard-deleting audit history.
