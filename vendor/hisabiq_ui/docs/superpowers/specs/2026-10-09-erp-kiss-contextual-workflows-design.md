# ERP KISS and Context-Complete Workflow Contract

**Status:** Proposed binding UI/UX rule for review · 2026-10-09  
**Scope:** Every HisabIQ tenant ERP page and reusable component, including future features  
**Reference:** Original Magic Patterns starter design, `AGENTS.md`, `docs/ui/transaction-cart-design-contract.md`  
**Source review:** [ERP audit](../../ui/erp-workflow-audit-2026-10-09.md), against feature branch `feat/magic-patterns-cart-parity` (includes stacked PRs #39–#44)  
**Review gate:** Do not implement architectural refactors, merge, or claim backend completion until this design is approved.

## Problem and product outcome

The target merchant may operate an SMB counter, hardware store, fabric shop, tailor/service shop or online store, often alone, with a keyboard or mobile touchscreen. An information-dense ERP is valuable only when each screen lets them finish common work quickly. Today some controls are styling variants of the same function; other buttons only show explanatory toast messages or force a switch to a different module.

**North star:** *One business task, one continuous context; the module owns the normal related workflow.* Density means useful data and visible controls, not many unrelated buttons or settings. **KISS: progressive disclosure, zero duplicated business logic, clear next action.**

Success examples:
- Add Product → use existing/new Category, Brand, Unit, and compound conversion **inside** the form; newly created entities are selected automatically.
- New Expense → choose or Quick Add Payee and Expense Category; add accounts/payment methods if permitted; attach receipt, save, inspect/correct/print—all without losing the expense draft.
- Customer profile → view invoices and dated ledger; initiate a preselected sale; inspect invoice, collect/refund credit, return, duplicate, correct/reverse records with audit and permissions; print/send dated statement; return to the same customer after completion.
- Supplier profile → purchase history, purchase return, make payment, supplier credit/refund/adjustment; loan parties and owners have their *correct* role-specific financial actions in the same profile.
- Warranty/service item ready → update status, notify with consent/tenant SMS rules, collect remaining payment, handover and print from a single case context when the actual service domain exists.

## 1. Workflow Ownership Rule

Every domain module must provide the natural related tasks. Ask: **After opening the record, can a user do the next 3 ordinary things without abandoning it?** At minimum support:

1. Browse/search/filter/sort, open record and see useful context and balance.
2. Create new, Quick Add missing dependencies, edit drafts/eligible fields, duplicate where meaningful.
3. View source records and complete associated payments, adjustments, returns, refunds, attachments, print/share and dated history *when that domain requires those actions*.
4. Access errors, restrictions and undo/reversal policies in context.
5. Preserve selection, filters, date range, unsaved form values and scroll position after linked operations.

**Not a rule to duplicate screens or financial posting code.** Reuse a full-feature editor as a modal/drawer/overlay or pass a `returnTo` context to the canonical page. The parent module owns an obvious entry point and safe return path. For complicated POS operations, launching POS preselected for a customer is acceptable **only** with automatic return to the same customer after save/cancel. A related module link may remain as an optional “Open full workspace”, never the only path to routine completion.

Distinguish overview pages (Dashboard, Reports) where navigation is natural from record workspaces where contextual action is mandatory.

## 2. Three-depth progressive disclosure

- **Level 1, always visible:** search, status/balance/metrics, key action (“New sale”, “Receive payment”, “New expense”, etc.), short filters.
- **Level 2, in place:** tabbed related records, transaction rows, context menus, quick add, details drawer.
- **Level 3, on demand:** advanced tax/stock/courier/accounting fields, settings, audit trail, irreversible-impact explanation.
- Do not put rare advanced settings in the default new-record form. Do not hide the day's frequent task behind an action menu if it deserves a primary button.
- Maximum intended *quick-add* depth is one focused dialog inside the parent workflow. For nested dependency creation (new unit conversion while adding a product), handle in the shared creation surface without opening a cascade of overlapping modals.
- When a task is truly complex, a contextual full-screen editor is better than squeezing everything into a modal; keep draft and return context.

## 3. Shared control contract (actual reuse, not visually similar code)

| Need | Required control behavior |
| --- | --- |
| Large entity selection | **Searchable combobox**, integrated input and suggestions, English/বাংলা labels, phone/SKU/category where applicable, keyboard arrows/Enter/Escape, touch |
| Small fixed enum | `AppSelect`/`FormSelect` via **one shared underlying component**, consistent sizes, shadows, portal colors and disabled/invalid states |
| Inline creation | Shared `QuickAddSelect`/domain-specific small dialog, validation and dedupe, auto-select and focus return, parent draft unaffected |
| Product rows | Canonical POS `ProductCombobox`, `CompoundQuantityInput`, compact `TransactionCartEditor`/POS adapters; consistent unit, price, drag/order |
| Monetary entries | POS-style multi-payment rows shared with Purchase, Expense, Finance, Party; correct account selector, balance, split total and refund source |
| Dates | Shared `AppDatePicker` and `AppDateRangePicker`; same locale, light/dark overlay, accessible keyboard, date validation |
| Actions menu | Shared accessible menu/panel with labels/icons, all items wired, permission-aware disabled reason, same desktop/mobile semantics |
| Destructive action | Impact/confirmation, explicit source/permission/lock checks, audit reason and safe reversal for posted money/stock |
| Tables | Consistent compact row height, right-aligned monetary/quantity columns, relevant sort/filter, sticky context and accessible row actions |
| Toast | Feedback *after* a successful mutation; **never** a substitute for opening a menu, creating a record, printing, or committing financial operations |

Do not implement “+ Add” as a navigation link to a global settings page when the input can be completed with a small contextual form. Deduplicate by normalized name and, for parties, valid phone/role rules. Shared master data uses a common tenant-scoped store; local-only decoration must not look like a globally saved entity. A new item is selected automatically and remains visible in later transactions.

### Consistent visual details
Use the approved Magic Patterns typography, color tokens and shadcn-style components. Compact but touch-safe. No hardcoded dark popup colors, no browser-native number spinners on compound quantity, no monospace digits. English concise label + Bangla helper where useful; don't repeat verbose instructions inside every row. Avoid separate page-local one-off search/quick-add widgets and fake dropdowns.

## 4. Contextual action completeness by domain

### Product / purchase / POS / quotation / online
- Product: create product + category + brand + unit + unit conversion; edit photo, price, opening/lot stock; view history, serial/expiry/warranty context. Product settings remain available as an *advanced* location.
- POS/Sales: inline product add, Quick Add Product and customer, select existing or walk-in, compound units, cart reorder, multiple payments, drafts/templates, invoice view/print/duplicate/edit (through canonical POS editor), partial returns and payment correction with source/audit.
- Purchase: Quick Add Supplier, Product, Unit/Brand/Category; cart, lot, expiry, serials, payment accounts, purchase detail/edit, supplier payable, *actual* validated purchase return and refund/source ledger.
- Quotation: customer selector must Quick Add Customer, reusable POS cart, quote status, print, duplicate/edit; converting to Online Order/Sale carries quote context. No stock or money posting merely from a quotation.
- Online Sale: Quick Add buyer and product dependencies, order->POS, courier/tracking/COD, return/refund, print packaging/challan, linked notifications/CRM; maintain planned versus actual advances.

### Party module — primary relationship workspace
Use one Party identity with **separate ledgers per role**. A person can be customer, supplier, lender, borrower, owner, payee or vendor without offsetting unrelated balances.
- **Customer:** create invoice preselected, view/edit/duplicate/print/return selected invoice, payments (cash/bank/MFS splits), due and credit/deposit/refund, opening balance, invoice history, statement date range, audited edit of payment date/reference/account/amount with two-step review; mark posted documents corrected/reversed rather than silently deleting rows.
- **Supplier/Vendor:** new purchase preselected, purchase/return/bill detail, payable/payment/credit/refund, historical item/receipt and ledger corrections.
- **Lender/Borrower:** loan issued/received, installments, due dates, interest where explicitly enabled, settlement/reversal and role-correct debit/credit preview; owner contribution/withdrawal separate.
- **Payee:** linked expense creation, payment details and dated history; prevent cross-role leakage.
- All ledgers show a subtle **Money In / Money Out** semantic treatment plus Debit/Credit, running balance, clear amount/date/reference and row actions. Color is an aid, never the sole semantic signal.
- When a ledger row opens a source invoice, preserve Party ID + role + range + scroll; closing/saving returns here.
- **Posted transaction correctness:** editing a source can cascade stock, inventory lot, account reconciliation, credits and later refunds. Use an impact preview and audited source correction/reversal with access checks. Never pretend a displayed ledger projection is the source of truth.
- SMS button checks tenant event rule, recipient consent, credits, gateway and quiet hours; preview only until server integration.

### Expenses / Finance / Accounts / Warranty / Reports
- **Expense:** Quick Add Payee, Expense Category and payment account in New Expense; editable expense source/date/amount/payment splits/receipt; table filters actually filter; category/payee menu has real add/edit/deactivate; report export/print actually generate output. Unsaved form never lost.
- **Finance/Accounts:** Quick Add party/account/category in place; multiple payments shared; transfer/reconcile/backdate correction works without duplicating accounting engines; native calendar replaced by themed picker; chart-of-accounts categories only created with valid mappings.
- **Warranty & future Service:** create case with Quick Add Party and serial/product, stage transitions, supplier/manufacturer dispatch, temporary replacement, customer handover, attachments, ready notification, settlement and audit in case view. **Service-ready SMS rule existing is not proof that Service Orders backend exists.**
- **Reports/Dashboard:** drill down to source record with filters carried; exported/printed reports must reflect active date range and authorized tenant; no synthetic success toasts.

## 5. Full action lifecycle and definition of done

For each displayed action declare:
- **Source** (the record and tenant), **eligibility** (role, draft/posting, credit/stock), **effect** (which domain record changes), **feedback** (success/error and validation), **next step** (focus, selection and return context), **test** (happy path, denied path, mobile/keyboard).
- A button that displays `toast('Edit dialog')` but doesn't edit is **not implemented**. Fake “Payment recorded”, “Return completed”, “Printed” are **critical defects** if no corresponding operation occurred. Use a clearly labeled disabled Preview action or a real preview dialog, never fake confirmation.
- Every menu item opens the correct modal/drawer or calls a real action; disabled items display a useful reason; no silent no-op callbacks.
- Save/Cancel preserve context. New child entities become immediately selectable in the parent and compatible with later forms.
- Draft preview state is not durable. Clearly label preview limitations; no client-side mock may claim live sending, bank transfer, tax/stock posting or tenant billing.

## 6. Integrity, permissions, and safety

All future real API commands derive tenant from authenticated session, never user input; route-bound IDs must validate ownership. Correction/reversal is transactional/idempotent with audit reason, reviewer permission, concurrency version and history. Never use destructive CRUD on settled/posted documents when a compensating reversal is appropriate. Date edits must reproject chronological running balances/stock/payment allocations and invalidate unsafe refunded credits. Don't auto-send SMS without consent and per-event configuration; don't auto-charge credits on a UI preview.

## 7. Acceptance tests for every new feature / changed screen

1. **The 3-next-tasks test:** from a source record, demonstrate three routine related actions without unwanted navigation; include a return-context test if full editor is needed.
2. **Missing-dependency test:** create the payee/category/unit/brand/customer from inside a half-completed parent form; newly created option selected, parent values intact, no duplicate on retry.
3. **Action coverage test:** enumerate every menu item on that screen; each does real preview state change, prints/opens a working dialog, or is clearly disabled with the reason. No fake toast-only success.
4. **Filters and data test:** set a select/date/text filter and confirm the table changes; reset restores results. Values are controlled, reachable and meaningful.
5. **Edit safety test:** change date/payment/account of an eligible source; view impact, confirm, verify ledger recomputation. Deny unauthorized/posted deletion; reversal retains audit.
6. **Consistency test:** reusable controls, keyboard and touch, Bangla labels, dark/light portals, tablet and mobile; compound units and payment split preserved where applicable.
7. **Preview honesty test:** attempts to send SMS, reconcile bank, print/export, or record funds do not falsely claim completion without real effect.

For a domain PR, include a **Workflow Coverage Matrix** documenting entries, quick adds, actions, enabled/disabled reason, underlying state changes, tests and any deliberately deferred integration. Use severity P0/P1/P2 for unresolved exceptions.

## 8. Rollout: small changes, never a giant rewrite

**Approach alternatives considered:**
1. Make every module its own full implementation: fast locally, but duplicates finance posting/cart code and diverges.
2. Always navigate to the owning module: less duplication, but counterproductive for fast merchant workflows.
3. **Recommended:** **one canonical business editor plus context-preserving entry points and shared quick-add/action components**. Reuse behavior, retain the active parent context; do not duplicate domain logic.

**Proposed implementation boundaries (requires separate approval):**
- A. Remove misleading inert/toast-only financial actions; implement Expense category/Payee quick-add management, real filters and CRUD/print actions first.
- B. Complete the Party workspace: customer invoice context, role-specific actions and source correction/reversal; supplier/payee/loan follows with a shared action coordinator.
- C. Consolidate shared party picker/quick-add, dropdown/date/menu and payment rows with visual+keyboard tests; handle POS/Purchase/Quote/Online.
- D. Real purchase returns and bill settlement; then warranty/service integration and report export/print.
- E. Project-wide Playwright screens/menus/action coverage regression and policy guard. Stage further fixes by actual test results.

Implement one cohesive slice at a time; keep stacked PR order and original visual design. No unnecessary new settings pages or enterprise-role complexity for v1.

## 9. Rules for AI agents and reviewers

Before touching a module: read its current route, state model, source-correction logic and related operations. Inventory all dropdowns, quick-add buttons, row menus, dialogs, keyboard and print actions. Compare to original Magic Patterns starter and shared POS primitives. Document the missing workflow and exact new business event/API or preview reducer needed. *Never* call a module “complete” simply because every button renders.

**Approval status:** Rule/spec proposed for user review; no runtime UI or accounting changes are authorized by this document.
