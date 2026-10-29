# HisabIQ ERP UI/UX and Workflow Self-Containment Audit — 2026-10-09

**Review type:** Source-code audit, not live tenant/API certification, exhaustive manual browser walkthrough, or backend audit.  
**Source revision:** `feat/magic-patterns-cart-parity` @ `e40483f51f61194e9db0b000108419284be6054b`, which includes stacked draft Quotations/Online Sales/Notifications/Cart features (#39–#44).  
**Baseline rules:** `main/AGENTS.md`, Magic Patterns starter, transaction-cart contract.  
**Code footprint reviewed:** Full 19 tenant ERP page files; controls/actions, route/quick-add conventions across shared `src/components` including Party, POS, Sales, Purchases, Expense, Product, Finance, Accounts, Audit, Warranty, Reporting, Notifications, Settings, and imported editors. Repository tree inspected (364 blobs including docs/assets/tests).  
**Evidence status:** “Confirmed” = specific source behavior; “Needs browser” = may differ in rendered UI; “Backend pending” = by design preview only. Don't infer production posting from client-side reducers.

## Severity

- **P0 — Misleading action or financial integrity:** visible success/no-op for payment, posted refund/return, print or other sensitive operation; missing critical ledger correction/reversal integrity.
- **P1 — Broken or needlessly fragmented ordinary task:** dead filter, no new invoice from customer, no contextual quick add, external navigation loses record context, duplicate entry UI.
- **P2 — Inconsistent styling, discoverability, UX density:** mismatched date/selector, action-menu placement, little/inconsistent Bangla helper, missing keyboard/touch tests.
- **P3 — Optional enhancement:** advanced settings or niche convenience; does not block daily counter operations.

## Verified source-level findings and proposed fixes

| ID | Severity | Module | Confirmed evidence | Minimal acceptance gate |
| --- | --- | --- | --- | --- |
| EXP-01 | **P0** | Expenses > Categories | `src/pages/Expenses.tsx` “Add category” invokes `toast('Add category dialog')`; category row action invokes `toast('Category actions')` | Actual create/edit/deactivate dialogs; new category selected by Expense draft; duplicate/name checks |
| EXP-02 | **P0** | Expenses > Payees | Same file “Add payee dialog” and Payee row action invoke only informational toast | Create/edit/deactivate party with Payee role; existing form preserved and newly created ID auto-selected |
| EXP-03 | **P0** | Expenses list | Expense `MoreHorizontal` action only toasts “View · Edit · Print · Cancel”; export only toasts `Expense list exported` | Working action menu + reviewed edit/reverse + print/export real artifact or explicitly disabled |
| EXP-04 | **P1** | Expenses list | Four `FormSelect` filters (category, payee, payment method, status) have neither `value` nor `onChange` handlers | Controlled filters change visible rows; reset restores; searching works in combination |
| EXP-05 | **P1** | Expense detail | `src/components/purchases/BillDetailDialog.tsx` “Attach receipt photo” only toasts | Real upload/select, preview and save, or disabled with explicit backend limitation |
| PUR-01 | **P0** | Purchase bill detail | `BillDetailDialog.tsx` “Pay [due]” calls `toast.success('Payment recorded')` and closes, no posting | Working split-payment flow with supplier/account ledger consistency or clearly marked preview-only disabled |
| PUR-02 | **P0** | Purchase Returns | `src/pages/Purchases.tsx` example single return row uses `returnPurchase.items.split(',')[0]`, static `defaultValue=1`, synthetic refund, and “Complete return” toasts `Purchase return prepared` | Correct lines/returnable max/historical units, account/supplier credit, atomic audit, real preview mutation or disabled |
| PUR-03 | **P1** | Purchases / Supplier context | “Supplier ledger” toolbar button navigates to generic `/app/parties`, not the active supplier's profile | Deep link with supplier ID/role and context preservation; purchase view has linked ledger action |
| PRD-01 | **P1** | Product Settings | `src/components/products/ProductSettings.tsx` `SettingActions` “Edit” only toasts `Editing ${label}` | In-place edit of category/unit/brand using shared input, affected products remain valid |
| PRD-02 | **P1** | POS quick add | `src/components/pos/CartTable.tsx` uses `ProductCombobox` without `onCreate` despite supporting it in shared picker | POS user can Quick Add Product and nested category/brand/unit without leaving sale/draft |
| PRD-03 | **P2** | Product managers | Products have row edit/stock/lot/offer/dialogs, but product/settings actions use heterogeneous menus and local named-item state | Same accessible row menu and persistence semantics; test modal scroll/portal/light/dark |
| PAR-01 | **P0/P1** | Customer profile | `src/components/parties/PartyDetail.tsx` “New invoice” disabled (“source action not connected”); `invoices` and `payments` tabs render summaries without row actions | New Sale preselected for current customer, return to same profile; each invoice has view/edit/duplicate/payment/return/print actions |
| PAR-02 | **P1** | Party ledger | `src/pages/Parties.tsx` routes source invoice edit to other module; other actions return toast “not connected to a source editor yet” | Contextual source detail/actions, stable role/range/filter and returnTo; permission reasons |
| PAR-03 | **Existing, preserve** | Party payments | `PartyDetail.tsx` invokes `PartyTransactionDialog` for party-payment/refund/finance; `PartyTransactionDialog` supports date/amount/discount/splits and audit reason with review | Keep audited corrections/reversals; extend consistent source-linked invoice/purchase coverage; do not replace with blind delete |
| PAR-04 | **P1** | Party roles | Customer/Supplier receive-payment supported, Owner/Lender/Borrower finance dialog present; other relationship operations vary; Party payment button disabled for roles other than Customer/Supplier | Role-specific actions for Vendor/Payee/Lender/Borrower/Owner with correct semantics, no cross-role balances |
| PAR-05 | **P1** | Party statement/actions | “Send statement” disabled (SMS not connected), attachment action toasts “No document available in preview” | Clearly labeled manual print/download and attachment states; actual SMS only after consent and gateway; no pretend send |
| POS-01 | **P1** | POS Customer selection | `src/components/pos/CustomerPicker.tsx` is a separate manually styled `FloatingPanel`, imports static `parties`, has no inline `+ New Customer` | Reuse shared party picker, tenant preview store, create/select customer in place while retaining cart |
| POS-02 | **Existing, preserve** | Transaction cart | `src/components/pos/ProductCombobox.tsx`, `transactions/CompoundQuantityInput.tsx`, `TransactionCartEditor.tsx` unify latest draft product entry, keyboard/multi-unit | Do not fork; test Box/Pcs, Gauge/Gira, price, scrolling, stable focus in both themes |
| SAL-01 | **P1** | Sales and linked Party | `src/pages/Sales.tsx` invoice Edit/Duplicate navigates to `/app/pos`, customer ledger to `/app/parties`; source context/return depends on route behavior | Maintain source Party selection, date filter and source invoice on save/cancel; reuse canonical POS rather than copy invoice editor |
| SAL-02 | **P0** | Sales printing | Sales invoice Print buttons invoke `toast.success('Invoice sent to printer')` rather than `window.print`/print service in sampled handlers | Real print/preview action or clearly “Preview only”; never claim physically printed |
| SAL-03 | **P2** | Sales filters and returns | `Sales.tsx` has many invoice/draft/return controls but some menus differ visually from Party/Audit/Product | Audit each action and permission plus consistent menu, return, partial-payment, void and batch-return workflows |
| FIN-01 | **P1** | Finance account creation | `Finance.tsx` supports accounts, cash movement, splits and People Manager but related selectors/date entry vary | Add missing account/party inline where needed; share split editor; maintain audit and reconciliation context |
| FIN-02 | **P2** | Finance date | `src/pages/Finance.tsx` transaction form `<Input type="date">` instead of themed `AppDatePicker` | Same calendar controls and validation in light/dark |
| ACC-01 | **P2** | Accounts voucher | `src/components/accounts/VoucherDialog.tsx`, `VoucherActionDialog.tsx` use `<Input type="date">`, while Party transaction corrections use `AppDatePicker` | Unified date-picker, source audit, contextual account creation |
| AUD-01 | **P2** | Audit correction | `src/components/audit/AuditEditDialog.tsx` has native date; otherwise includes impact validation/edit; source nav used elsewhere | Share themed date control; preserve atomic impact preview and audit reason |
| DAY-01 | **P1/P2** | Daybook action lifecycle | `Daybook.tsx` “Correct” launches Audit route and Duplicate launches POS; source filters/range may be lost | Edit in contextual drawer or returnTo to Daybook with selected date/filter |
| REC-01 | **P1** | Reconciliation | `Reconciliation.tsx` uses local file-name selection and manual transaction correction preview; actual bank PDF parsing and reconciliation posting not verified | Label preview; actual statement import/parser/matching/review tests before claiming complete |
| REP-01 | **P1** | Reports | `src/pages/Reports.tsx` example Export only toasts `Exported September report.xlsx` | Actual filtered report artifact and print or explicitly preview-only; drill into row with context |
| WAR-01 | **P1** | Warranty | `Warranty.tsx` has substantial cases/stages/actions but customer actions navigate to Party and Print toasts success | In-case customer details, print/attachment behavior, ready stage with opt-in SMS; preserve case context |
| QOT-01 | **P1** | Quotations (draft PR) | `Quotations.tsx` Customer picker `AppSelect` plus independent name field, no Quick Add Customer; product quick add already provided | Shared customer picker + quick add in quote, auto-select, preserve items |
| ONL-01 | **P1** | Online Sales (draft PR) | `OnlineSales.tsx` customer selector `AppSelect` and free-text name; product quick add exists, but buyer dependency creation not inline | Consistent party picker and fast buyer creation; dedupe, preserve courier/COD draft |
| ONL-02 | **P2** | CRM follow-up | Online CRM lead form uses `Input type="date"`; service-ready SMS rules exist with no service-order source | Themed date picker; implement real service-order domain before event binding |
| NOT-01 | **Backend pending** | Global notifications | `ErpNotifications.tsx` config supports sales/party/service/stock/online event groups but explicitly sends no SMS | Domain events/outbox, tenant rules, consent, gateway, credits and delivery logs before enabling |
| SET-01 | **Policy exception** | Tenant Settings | `TenantSettingsPage.tsx` links to Product Settings categories/brands/units: acceptable for deliberate administration, **not** acceptable when invoked from an active product/transaction | Keep settings as advanced workspace, Quick Add stays in primary form |
| DASH-01 | **Acceptable navigation** | Dashboard | Overview cards link to Sales/Party/POS; navigation is expected on summary surfaces | Drilldown preserves relevant filters where available |

## Important nuance: do not over-diagnose

- **FormSelect is NOT itself a separate design engine:** `src/components/FormSelect.tsx` delegates to `AppSelect`. Whether it is appropriate depends on option size, control wiring and search.
- **QuickAddSelect is already a useful reusable pattern:** `src/components/QuickAddSelect.tsx` opens a form, deduplicates, calls `onCreate` and promises reselection. Extend its behavior carefully, don't replace it with an unrelated selector.
- **Party preview has meaningful payment safety:** `PartyTransactionDialog.tsx` already supports split payments, date correction, audit reasons and reversal for its eligible source records; retain rather than misrepresent it as absent.
- **POS/Purchase/Quotation/Online multi-unit parity was the focus of draft PR #44.** Don't overwrite those controls in an unrelated remediation PR.
- **Preview ≠ backend:** table rows/states driven by local React/preview stores are not tenant-authenticated durable records; even working UI mutations do not establish financial posting. Some toast-only messages are appropriate for notification of an actual preview save; the defect is false completion with no mutation.
- **Role-specific permissions & reversals are intentional.** “Edit/delete every transaction” must be implemented as editable eligible source fields plus corrective transactions and audit, not unsafely deleting posted financial source records.

## Full module coverage matrix (static source review)

| Module | Observed strengths | Priority missing user-completing capability |
| --- | --- | --- |
| Dashboard | Summary widgets, customization, drilldowns | Reopen filtered source context |
| POS | Rich inline cart, multiunit, split checkout, drafts | Inline new customer/product without leaving sale |
| Sales | List, invoice details, payment, returns, drafts, warranty navigation | Real print/export, source-safe invoice action and customer return-context |
| Purchases | Full editor, quick-add supplier/product, lots, payment | Actual purchase return, supplier ledger in-context, due settlement |
| Expenses | Create form, Quick Add category/payee in new expense, reporting | Real management actions, controlled list filters, source edit/attachment/print |
| Products | Product create/edit, stock, lots, offers, imports | Real settings item edit, consistent menus |
| Parties | Unified identity, role balances, date ledger/print, opening, payment/refund, finance | New Sale from customer, real contextual invoice/bill source actions |
| Finance | Cash session/accounts/people/transfers/cheques | Uniform date/quick-add/account selection, consistent contextual correction |
| Accounts | Chart of accounts, voucher, statements, opening balances | Contextual account creation and date/selector parity |
| Daybook | Transaction source, filters, action menu | Edit/duplicate with return to filtered source |
| Audit Ledger | Audit timeline, impact edit and delete safeguards | Consistent date/party fields and navigation return |
| Reconciliation | Account matching and correction preview | Actual statement ingestion/posted reconcile before production |
| Warranty | Claim stage/movement dialogs, cases, replacements | Live case print, Party inline info/quick-add, service follow-up |
| Quotations | POS-style cart, quote lifecycle, print and conversion (draft) | Inline Quick Add Customer, safe customer-link semantics |
| Online Sales | Orders, COD, courier, CRM, notices (draft) | Inline Quick Add Buyer, actual backend event/inventory and COD |
| ERP Notifications | Configurable event registry (draft) | Domain hookups/provider/outbox/consent before “send” |
| Reports | Summaries and drilldown | Actual filtered exports, actionable source drilldown |
| Tenant Settings | Simple/advanced settings, cross-links | Consistent control choices, quick-add from live transactions |
| Brand Guide | Tokens/primitives/source visual rules | Keep visual authority, no new competing primitives |

## Recommended dependency order and scope of approval

**A. Critical honesty + Expenses** — fix P0 toast-only fake operations and Expense category/payee actions + controlled filters, receipt and edit/print. Distinguish preview from posting.

**B. Party-as-workspace** — finish Customer profile first with a preselected sale and return context, invoice row actions and authorized source correction; then Supplier, Payee, Lender/Borrower/Owner actions. Share this coordinator with Sales/Purchases/Finance without duplicate ledgers.

**C. Cross-ERP component parity** — entity pickers with Quick Add (POS/Quotation/Online), shared action menu, calendars and split payments; preserve Magic Patterns styling and PR #44 cart semantics.

**D. Purchase returns/settlement and Warranty/Service** — complete working lines, refunds/payables, ready/handover notifications (backend gating).

**E. Reports/Finance/Admin cleanup + Playwright gate** — real print/export where feasible, otherwise honest disabled preview; each menu action and filter tested across themes/mobile/keyboard.

### Suggested tests (not yet implemented)
1. **Expense:** create new Payee and new Category from modal, finish expense; revisit category/payee tabs and edit; date-range/filter drives list; print shows correct record; invalid split blocked.
2. **Party:** select Rahman as Customer, launch preselected POS, create invoice, return to same profile, open it, receive partial due, correct payment date, verify running balance and refund eligibility; no cross-role Supplier impact.
3. **Purchase:** create supplier in purchase, buy in Box+Pcs, open bill, pay supplier partially, return selected qty from correct lots, supplier ledger reflects event; reject double-return.
4. **UI guard:** every action menu populated, each item functional or disabled with reason, no fake money/print toasts; keyboard/touch and dark/light fields.
5. **Business invariants:** no tenant leakage, no double stock/account posting, idempotent correction/reversal, explicit opt-in SMS.

**Next gate:** Review/approve [the proposed KISS workflow contract](../superpowers/specs/2026-10-09-erp-kiss-contextual-workflows-design.md). Then create separate Superpowers plans and PRs for A/B/C/D/E; do not attempt to repair the entire ERP in one PR.
