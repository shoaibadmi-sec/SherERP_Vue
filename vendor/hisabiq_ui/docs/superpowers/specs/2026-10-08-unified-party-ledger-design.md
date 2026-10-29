# Unified Party & Ledger Workspace — Design Specification

**Date:** 2026-10-08  
**Status:** Design approved on 2026-10-08; implementation plan awaiting review  
**Scope:** `shuvodelux-commits/hisabiq_ui` (UI/UX and coherent, in-memory design-preview behavior)  
**Reference implementation:** `shuvodelux-commits/sherERP_Mohim` (read-only requirements reference; do not modify)  
**Approved approach:** A — one Party workspace with source-aware transaction actions.  
**Design authority:** existing Magic Patterns export and HisabIQ shadcn-style theme components.  
**Guiding rule:** KISS — simple on the surface, correct under the surface.

## 1. Intent and success

Everyone who has a financial relationship with the shop should be discoverable from one Party directory. A shopkeeper can select a person, select a **relationship** (Customer, Supplier, Vendor, Lender, Borrower, Payee, Owner), understand the correct balance, inspect a chronological account statement for any selected date range, print it, and carry out every *permitted* action against the **underlying source transaction**. This extends the existing Party interface; it does not introduce a second ledger-posting engine.

The UI phase must be interactive and reviewable end-to-end. Its storage remains demonstration/in-memory state, not an authenticated production backend. Do not report persistence, SMS delivery, settled real accounts, or real accounting postings based on UI-only actions.

**Four reviewable, independently testable slices:**
1. Directory, profiles, relationships, and people administration.
2. Shared ledger workspace, date ranges, statements, export, and row actions.
3. Customer/supplier credits, settlements, refunds, and payment dialogs.
4. Owner/lender/borrower and vendor/payee relationship workspaces; integration tests and responsive polish.

## 2. Sources inspected and constraints to preserve

### Current HisabIQ UI
- `src/pages/Parties.tsx`: URL selected party `?id=`, role search, in-page mutable ledger notes, toast-only Add party/Import/Payment/Statement actions.
- `src/components/parties/PartyDirectory.tsx`: directory search, role filters, selected party and single `Party.balance` presentation.
- `src/components/parties/PartyDetail.tsx`: basic tabs, attachments, summary, and nonfunctional payment/statement actions.
- `src/components/parties/LedgerTable.tsx`: static entries, running sum, no date-range opening balance, no source actions.
- `src/types/erp.ts`: `PartyRole` already includes all seven roles; `LedgerEntry` supports `opening/invoice/payment/purchase/return/note` only; demo `Party.balance` is a legacy scalar.
- `src/data/erpDemoStore.ts`: available parties and ledger entries plus preview-created purchases; in-memory only.
- `src/data/financeAccounts.ts` and `src/pages/Finance.tsx`: explicit Owner/Lender/Borrower transaction classes and finance-person ids; their transaction accounting must not be flattened into the old scalar Party balance.
- `src/components/AppDateRangePicker.tsx`, `src/utils/dateRange.ts`: theme-aware ISO date range picker and Bangladesh calendar date.
- `src/components/AppSelect.tsx`, `src/components/FormSelect.tsx`, `src/components/layout/FloatingPanel.tsx`, `src/components/Dialog.tsx`: preferred, reusable action/input UI.
- `src/utils/permissions.ts`: source-transaction permission mapping, already used by Daybook; Party actions must use matching source permissions.
- `src/App.tsx`: HashRouter routes `/app/parties`, `/app/sales`, `/app/pos`, `/app/purchases`, `/app/finance`, `/app/daybook`.

### SherERP_Mohim
- `PartyLedger.gs` clean/privileged corrections projection and `getCustomerLedgerStatement`/`getSupplierLedgerStatement`: statement opening is all effective transactions *before* From; period rows are inclusive; closing = opening + period debit - period credit; never print corrections.
- `customerLedger.html`, `Customer.gs`, `CustomerSettlement.gs`: Receive Payment, per-invoice allocation or oldest-first, discounts with reason, customer credit (cash-backed advance and return credit), Refund Credit with available-credit and transaction-date constraints, source-linked row actions.
- `supplierLedger.html`, `Suppliers.gs`, `SupplierSettlement.gs`: Make Payment, purchase settlement, supplier advances, source-linked purchases, returns, opening balances.
- `financeLedger.html`, `FinanceModule.gs`: person-role-filtered owner/lender/borrower transactions, relationship-specific capital and loan balances, view/edit/delete with cash/bank implications.

**Source-of-truth rule:** Ledgers are **projections** of Sales, Purchase, Return, Payment, Finance and Opening Balance records. The Party workspace must never independently edit a derived invoice or purchase ledger line.

## 3. Information architecture

The single `/app/parties` screen has:
1. Compact header: Parties & Ledger (Bangla helper), receivable/payable summary, Add party, Import.
2. Left directory: search by name/Bangla name/phone; role chips; compact avatar, role labels, last activity, relationship-aware balance; keyboard/touch selection; empty and clear-filter states.
3. Right selected-party workspace: avatar, name/Bangla name, phone, address, roles, status, Edit; selectable relationship when multi-role.
4. **Balance cards**: role-specific amount(s) with labels and independent customer credit/advance (when applicable); no misleading aggregated signed amount for a multi-role party.
5. Quick actions: context-specific Receive/Pay, Credit Refund, New Sale/Purchase, Record Loan/Capital, Statement; secondary actions in overflow.
6. Tabs: Ledger, Invoices/Purchases, Payments & Settlements, Notes, Attachments; only show source-appropriate tabs/counts. Switching tabs must not silently change selected relationship.
7. Ledger toolbar: `AppDateRangePicker`, transaction kind, reference/text search, page size, Clear, Print / Export; privileged Show corrections only when authorized (UI demo permission gate, backend permission required later).
8. Compact, readable table desktop; stacked transaction cards mobile. Dates and currency use locale-aware sans-serif (never mono). Numeric columns right-aligned. Per-row, keyboard-accessible, portal-positioned `FloatingPanel` menu, including all valid permitted actions.

Selection stays URL-linkable, preferably `?id=<partyId>&role=<role>`; bad/missing ids select an actual available party and clean the URL. A relationship switch shows that role's entries, not automatically the first role's entries.

## 4. Identity and role model

- A `Party` has stable id, name, optional Bangla name, optional phone/address/guardian/details, status, photo, role set, and activity/notes. One person can hold multiple roles. Do not merge unrelated people by name or phone automatically; detect potential duplicates and require confirmation for merging (merge workflow deferred).
- Existing finance-person fixtures have their own `fp*` ids; Party UI must use an explicit, deterministic demo identity mapping where supported, **not** a substring/name lookup. A finance-person without a matched Party is displayed through a clearly scoped fixture adapter, never written into a different person by coincidence. Production identity becomes a single tenant-scoped party id with role associations.
- Treat `Party.balance` as migration/demo legacy compatibility only. Do not derive credit availability or finance relationship balances from it. Use independently projected role balances, and reconcile seed fixture differences in the preview adapter.
- A party's customer receivable, customer credit, supplier payable, supplier advance, owner capital, lender payable/credit, borrower receivable/credit are **distinct dimensions**. Never offset Customer vs Supplier or Owner vs Lender by default. The user must request any future approved transfer or offset with a separately audited transaction.
- A role may be removed/party deactivated only after presenting linked-ledger implications; disable destructive actions for parties with active linked records or outstanding obligations. Edit contact data without altering existing posted amounts.
- Privacy/auth in future backend: every party and source row resolved within tenant from authenticated session, never from untrusted tenant_id supplied by UI.

## 5. Normalized projection contract

The shared visual component consumes a `PartyLedgerRow` view model rather than raw source arrays:

```ts
type PartyRelationship = 'Customer' | 'Supplier' | 'Vendor' | 'Payee' | 'Lender' | 'Borrower' | 'Owner';
type PartyLedgerSource = 'sale' | 'sale-return' | 'customer-payment' |
  'customer-credit-refund' | 'purchase' | 'purchase-return' |
  'supplier-payment' | 'finance' | 'expense' | 'opening' | 'note';
type PartyLedgerRow = {
  id: string; partyId: string; relationship: PartyRelationship;
  source: PartyLedgerSource; sourceId?: string; reference?: string;
  date: string; // YYYY-MM-DD, Bangladesh business date
  description: string; debit: number; credit: number;
  amountPaid?: number; discount?: number; method?: string; accountId?: string;
  attachment?: { name: string; url?: string };
  status: 'Active' | 'Reversed' | 'Deleted';
  isCorrection?: boolean;
};
type LedgerStatement = {
  partyId: string; relationship: PartyRelationship; from: string; to: string;
  openingBalance: number; rows: Array<PartyLedgerRow & { runningBalance: number }>;
  periodDebit: number; periodCredit: number; closingBalance: number;
};
```

Scope signs per ledger:
- **Customer**: sale/invoice increases receivable (debit); payment/credit/return decreases it (credit); credit refund increases net due (debit).
- **Supplier**: purchase raises amount payable (credit); payment/purchase return reduces payable (debit).
- **Lender/Owner**: money received generally increases liability/capital (credit); repayment/withdrawal decreases (debit). Distinguish lender credit and owner advance from standard capital.
- **Borrower**: money lent increases receivable (debit); repayment received reduces it (credit). Separate borrower credit for over-collection.
- **Vendor/Payee**: display only supported expense/payable/payment records, using source-specific signs; do not invent generic role-money transactions.

Projection algorithm:
1. Filter to the selected **party id + relationship**, then project current economic transactions (clean view), preserving immutable source and audit metadata.
2. Exclude reversed/deleted economics while preserving authorized correction history for inspection. Source edits/reversals must not leave misleading double-counted rows.
3. Stable sort by business date then stable source sequence/id in ascending order, including multiple same-day transactions.
4. For a date range `[from,to]` inclusive, calculate **openingBalance** from all clean rows with date earlier than `from`; display rows inside range; `runningBalance = openingBalance + cumulative debit - cumulative credit`; `closingBalance = openingBalance + periodDebit - periodCredit`.
5. A blank date range means **All time** (opening = 0, include complete history). Explicit partial/invalid ranges do not silently apply; show validation and retain the last valid selection. No future-date statement by default.
6. Page size and display order are presentation concerns; do not calculate running balances only over the current page. If UI displays newest-first, each row retains its true chronological running balance.
7. Monetary computations use rounded minor units/cents to avoid floating-point accumulation; tests include decimals and exact credit limits.
8. Notes and zero-money entries display but do not alter balances. A pure opening row is a balance movement in this view; it is not cash/bank movement.
9. If economic projections and their source totals contradict, show a visible data-integrity warning in preview; backend integration must fail closed rather than issue a false statement.

This design explicitly fixes the current `LedgerTable.tsx` issue where filtering rows and starting running balance at zero would give a false date-scoped balance.

## 6. Statement, printing and exporting

Shared `PartyStatementDialog` displays selected party/relationship/date range, business identity, party contact, opening, full period rows, period total Dr/Cr, closing, printed timestamp, and preview. The Print button prints a scoped print-only document (A4 portrait, repeat table headers, sensible page breaks), not the entire ERP shell. Download PDF uses browser's Print/Save as PDF in the UI phase, **not** fabricated file-generation success. CSV export is a real client-side, escaped UTF-8 CSV of the complete filtered clean statement including dates/amounts; it must not contain corrections.

Statement range and on-screen range stay in sync unless user explicitly changes the modal selection. **All time** uses the earliest transaction date through the Bangladesh current date in printable statements; no transaction case shows opening/closing of zero and a truthful empty statement. Print/export uses full projected period, not just the visible page. Permission-guard statement export, not raw audit rows.

## 7. Source-aware row actions

Use one shared `PartyLedgerRowActions` with a central `ledgerActionAvailability(row, permissions, context)` function, powered by `src/utils/permissions.ts`. Every visible action has an operational UI outcome.

| Source | View/Open | Edit | Delete/Reverse | Other |
|---|---|---|---|---|
| Sale | Sale details, POS V2 where applicable | Source Sales/POS edit only | Source Sales authorized reversal/deletion flow | Print invoice, Sales Return |
| Sale Return | Return detail | Return-specific source editor only if supported | Source-controlled; otherwise disabled | Print/open return |
| Purchase | Purchase detail/editor | Source Purchase editor | Source purchase reversal/deletion flow | Purchase Return, print |
| Purchase Return | Return detail | Return-specific source editor if supported | Source-controlled | Open return |
| Customer payment | Payment details | Payment edit modal with settlement validation | Confirm and reverse payment & cash/bank effect | Print receipt, allocation |
| Customer credit refund | Refund detail | Edit only if source safely supports it | Confirm and reverse refund | Print receipt |
| Supplier payment | Payment detail | Source supplier payment editor | Confirm and reverse linked money | Print receipt |
| Owner/lender/borrower finance | Finance detail | Finance source editor | Confirm finance reverse, linked cash/bank | Print |
| Opening | View origin | Role-allowed opening editor | Never direct row delete | Show no-cash movement hint |
| Expense/vendor/payee | Expense or finance details | Source-specific editor | Source reversal | Print |
| Note | Show note | Edit note | Confirm remove note | No financial impact |

The first version can use **source-aware preview dialogs** when the existing source page cannot accept a focused transaction id; no fake source navigation or toast-as-action. Where the source editor exists, deep-link to it with verified query parameters or an established selection mechanism. If a source action is not supported, show it disabled with the exact reason or omit it; do not pretend it happened.

All destructive actions require an explicit confirmation with party, amount, date, source ref, and impact. A `Delete` label means **reversal/soft deletion** where financial effects exist; UI preview must preserve an audit entry and re-project balances, not splice an economic row with no trace. Source permission mapping is an interface preview, not security enforcement.

## 8. Payments, customer credit and refunds

**Receive customer payment**
- Form: selected party, payment date (`AppDatePicker`), amount, one or more method/account rows, optional selected invoice or oldest-first, optional authorized settlement discount + required reason, notes/ref/attachment.
- For method/account rows, reuse the multi-payment editor pattern already approved for POS/Finance. Each row chooses Cash, Bank or Mobile Banking, valid active account for method, positive amount; sum of splits must equal actual **cash-backed payment**, not payment + discount.
- Show outstanding selected invoice/due, total cash received, discount, applied amount, projected remaining due, and newly created credit. No silent automatic discount over-settlement; invoice-targeted payment cannot precede selected invoice date. Backdated date needs reason/permission in production.
- Payment amount > current due can form customer credit; payment + noncash discount cannot manufacture refundable credit.
- Customer credit is **not** synonymous with a negative net balance. Compute explicit available, refundable credit using settlement provenance: eligible cash-backed advances and eligible return/adjustment credits minus consumed/refunded amounts. Maintain a separate display from current due and distinguish noncash credits.
- A payment against an invoice consumes credit/settlement in the same source-consistent order as the reference ledger; no double use of credit.

**Refund customer credit**
- Dedicated modal displays available **refundable** credit, amount, cash/bank/mobile method and account, date, note/reason, projected balance after, and a clear confirmation summary.
- Validate `0 < refund <= availableCredit` at the selected date. Reject future-date refunds, backdated insufficiency, and transaction states that would consume future credit. Refund posts debit to customer view and outbound money effect **in the preview projection together**; reversing refund reverts both. In backend phase server revalidates under transaction lock.
- Account for credit created by overpayment and genuine sales returns as the legacy settlement state supports; never refund a discount-only balance as cash.

**Supplier payment and credit**
- Symmetric user interaction for Pay Supplier; settle oldest purchase or choose a particular purchase where supported; partial/full payment, discount + reason, overpayment/advance, available supplier credit/refund workflow where source supports it, and conditional account rows.
- Reproduce legacy SupplierSettlement semantics rather than copying customer debit/credit signs.
- Refund of an advance is **money received back from the supplier**, not a customer credit refund; separate label and direction.

**No production posting:** modal Submit changes a single coherent preview-state adapter; it must never claim real bank, inventory, SMS or ledger entries were posted. Cross-module preview updates must stay consistent within the session; reload semantics clearly identify demo state.

## 9. Owner, lender, borrower, vendor and payee

- Reuse existing `FinanceTransactionType` metadata from `src/data/financeAccounts.ts`: Owner Credit/Debit, Lender Credit/Debit, Borrower Debit/Credit and opening variants. A role selector filters available transaction types/persons to those that apply.
- An **opening** transaction adjusts only the relevant relationship account and never touches cash or bank; other finance types choose one or multiple payment accounts, showing an inbound/outbound effect.
- Owner capital vs owner advance, lender outstanding loan vs lender credit, borrower loan vs borrower credit remain independently labeled and cannot cross-net.
- Finance-source view/edit/reverse uses the established finance actions rather than a second ledger mutator; source reference and status are visible.
- For Vendor/Payee, support listing contact, expense/invoice/payments and viewing details where records actually exist. Do not provide a fabricated payment editor for unsupported category relationships.

## 10. UI component boundaries and data flow

Recommended targeted evolution (exact new file names can be refined in the implementation plan):

- `src/pages/Parties.tsx`: URL selection, filter state, orchestration only.
- `src/components/parties/PartyDirectory.tsx`: directory, role tabs, search.
- `src/components/parties/PartyDetail.tsx`: selected party header, balance summary, actions and content tabs.
- `src/components/parties/LedgerTable.tsx`: visual table/cards, projected running balance, totals.
- New focused `PartyEditorDialog`, `PartyLedgerToolbar`, `PartyLedgerRowActions`, `PartyStatementDialog`, `PartyPaymentDialog`, `PartyTransactionDialog`: distinct responsibilities, reuse shared `AppSelect`, `AppDateRangePicker`, `Dialog`, `FloatingPanel`, `FinancePaymentSplitEditor` or shared split primitives.
- New `src/utils/partyLedger.ts` (pure projection), `src/utils/partyActions.ts` (source/role capabilities), and a focused `src/data/partyPreviewStore.ts` (in-memory source records and atomic preview action reducer). Preserve compatibility with `availableParties` and `availableLedgerEntries`; do not break POS/Purchase fixtures.
- `src/types/erp.ts`: add role-specific view model types without breaking current producers.
- Existing `src/pages/Finance.tsx`, `src/pages/Sales.tsx`, `src/pages/Purchases.tsx` remain authoritative ownership boundaries; leverage existing edit/detail dialogs and validated routing where available.
- Tests next to pure logic under `tests/` and browser scenarios in the existing Playwright suite.

Data flow: source preview records -> role-specific adapter -> clean normalized ledger projection -> date filter/summary -> table/statement. UI action -> permission/capability check -> source-specific preview command -> atomic update of preview records/audit -> re-project selected ledger and dependent summaries.

Do **not** seed the same payment separately into two independent mutable arrays. Shared reference/source id is required for editing/reversing exactly once. If the legacy sample's party scalar does not reconcile to its sample ledger entries, make the mismatch visible or add an explicit fixture opening adjustment **in preview only**, not a runtime silent patch.

## 11. Input states, errors, accessibility and design system

- Each dropdown/search supports selected value, clear as appropriate, keyboard navigation, escape, touch targets, focus, pending/empty states. Use the already themed `AppSelect`/`FormSelect` for selection and `FloatingPanel` for context menus; avoid native non-themed dark menus.
- Dialogs show field-level validation and calculated after-state before posting. Invalid amount/account/date leaves modal open with actionable error text; no toast-only operations.
- Active/inactive badges, disabled reason, action permission checks, cancellation, confirmation, empty/fetch-error/zero-transaction states. No inert Add party / Import / Receive payment / New invoice / Send statement. CSV import gets a real preview and validation workflow; when there is no SMS service, disable Send statement with a truthful explanation (not “sent”).
- Full English, English + Bangla helper, and Bangla label architecture; no new hardcoded mono font for numbers. Existing compact density, theme token contrast, responsive mobile card view, desktop right-aligned numeric columns.
- Printable statements show a consistent sans-serif numeric face, no controls or modal shell, and legible A4 table.

## 12. Acceptance gates, ordered by slice

**Slice 1 — Directory/profile**: find person by English/Bangla/phone; clear and role filter; add/edit multi-role profile with validation; update selected URL and role; role relationship balance not incorrectly netted; editable notes; import preview or accurately disabled explanation. Tests for duplicate ids, empty state, role switch and mobile selection.

**Slice 2 — Ledger core**: transaction list sorted chronologically with stable same-day order; date-range opening/period/closing calculations; all-time reset; no transactions in selected period still show correct opening and closing; statement/CSV/print use full period not visible page; row actions map to source; permissions and unsupported actions accurate; corrections not printed. Tests for date edges, decimals, running balance across pages, reversed rows, audit chain visibility and A4 formatting.

**Slice 3 — Customer/supplier settlement**: payment modal with multiple methods and source account selection; full/partial/invoice allocation; discount reason validation; actual customer credit vs net due; refund cannot exceed available credit *as of refund date*; cash-backed vs noncash; supplier payable/advance direction; edit/reverse preview settles balances and keeps audit. Tests for overpay, return credit, partial/combined splits, discount-only and backdated refunds, reverse and repeated action.

**Slice 4 — Finance relationships and final QA**: Owner/Lender/Borrower role-filtered transactions, capital/loan balance isolation and opening no-cash behavior; finance view/edit/reverse; vendor/payee only source-supported flows; cross-module updates in preview; light/dark desktop/mobile responsiveness, accessible keyboard menus/dialogs. Existing Node test runner (`node:test`) + Vite build + full Playwright scripts must pass before PR merge.

Each slice should be a reviewable GitHub change/PR; do not merge or deploy automatically. A visual review after Cloudflare deployment is separate from code/CI acceptance and must be verified, not claimed without deploy evidence.

## 13. Explicit non-goals and backend handoff

- Do not implement production database schema, tenant auth, payment gateway, SMS send, permanent uploaded documents or finance posting in the UI repository.
- Do not directly rewrite the legacy `sherERP_Mohim` Apps Script repository.
- Do not allow direct arbitrary editing/deleting of derived ledger postings or mutation of source financial records by changing displayed `debit`/`credit` numbers.
- No automatic balance netting between relationships, no person deduplication by phone, and no ad hoc generic ledger monetary adjustments.
- Backend phase must supply tenant-bound Party identity, source references, idempotent atomic mutations with reversals, permission checks, version/conflict handling, audit records, reconciliation, and server-validated credit availability at transaction date.
- UI delivery criteria are **working, truthful preview interactions**, not backend parity or production data durability.

## 14. Decision record

- Unified Party module + source-linked mutations, not duplicate CRUD engines.
- Source activity can be edited/deleted only if its own business flow supports it; otherwise show a valid view action and disabled reason.
- Role-specific balances and customer credit are separate from generic `Party.balance`.
- All statement totals calculated from full clean history before pagination.
- Row corrections never printed as customer-facing statement.
- Multi-payment uses split rows, account-aware validation; discounts are noncash.
- Existing Magic Patterns / shadcn dark/light design and KISS are binding.
- Four vertical slices, with tests and UI review gates, **no backend work in this phase**.
