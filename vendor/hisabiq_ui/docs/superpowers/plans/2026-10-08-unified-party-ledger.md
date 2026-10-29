# Unified Party & Ledger Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one fully interactive Party workspace for customers, suppliers, vendors/payees, lenders, borrowers and owners, with role-specific balances, accurate dated statements, print/export, and source-linked financial actions in HisabIQ's UI-only preview.

**Architecture:** The Party screen orchestrates a normalized role-specific ledger read projection over canonical preview source records. All edits/refunds/settlements are dispatched to source-aware preview commands, never to an arbitrary ledger row. Shared UI components render the same date-range, action, settlement and statement patterns for every supported role; other ERP modules subscribe to the same source preview store where actual cross-module consistency is promised.

**Tech Stack:** React 18, TypeScript, Vite, React Router v6, existing theme-aware HisabIQ/shadcn-style components, Tailwind 3, `node:test`/`node:assert` (not Vitest), Playwright scripts driven by Node, GitHub Actions (`UI Check`).

**Spec:** `docs/superpowers/specs/2026-10-08-unified-party-ledger-design.md`

## Global Constraints

- Work in **`shuvodelux-commits/hisabiq_ui`**, not the separate production ERP repo. `sherERP_Mohim` is read-only reference.
- Preserve Magic Patterns visual authority, the existing dark/light tokens and shadcn-style shared controls; compact desktop UI, touch-friendly mobile UI, Bangla helper labels.
- Keep it a **UI-only preview**; no backend/API posting, persistent accounting, real SMS, real uploads, real bank movement or actual PDF generation claims.
- No monospaced digits; numeric columns right-aligned with the existing currency formatter.
- Each row has **one owning source record and source id**; never mutate an invoice/purchase by changing a derived ledger debit/credit cell.
- Multi-role balances stay separate; no customer-supplier netting, no owner-lender netting; finance-person fixture associations require explicit stable ids.
- Clean current-economic statements exclude correction/reversed/deleted effects. Authorized corrections can be inspected but never printed.
- Range includes both dates. Opening = all net movement before From; closing = opening + period debit - period credit. Calculate over **full history before pagination**.
- Valid refundable customer credit comes from settlement provenance, not `Math.max(-party.balance, 0)`; discount never manufactures cash credit; refunds are limited at **their selected business date**.
- Cash/Bank/Mobile splits add to **money moved**, excluding any noncash discount. Opening finance entries never move money.
- Permission and source support jointly determine displayed actions; UI-only permissions do **not** replace server checks at future backend integration.
- Delete/reverse retains an audit trail in preview and updates projected balances; require explicit impact confirmation.
- **Use native/inline Superpowers implementation**, respecting the user's earlier preference over subagents. Work on an isolated feature branch/worktree, do not merge/deploy without a separately requested decision.
- Every production change follows TDD: test first (RED), minimal implementation, tests GREEN, then commit; each completed slice gets a reviewable PR.
- Existing commands: `npm test` runs `node --experimental-strip-types --test tests/*.test.ts`; `npm run build`; `npm run lint`; browser smoke scripts via Node + Playwright. CI Node 22; avoid requiring Node-only APIs unsupported by Node 22.
- Bash commands in user-facing guidance receive a short one-line description.

## Review Focus

1. **Same-day transactions/backdating:** Stable event ordering and negative/credit available-at-date must not include later-funded advances; test in Task 9 and Task 11.
2. **Fixture drift and cross-module mutations:** A preview invoice/payment edited from Parties cannot disagree with Sales or Finance or silently consume a different source ref; test in Task 3 and Task 14.
3. **Date-filtered empty statements:** Opening/closing remain correct even when no transaction falls within the range, and page size does not change totals; test in Task 5 and Task 8.
4. **Unsafe or unavailable source actions:** Role mismatch, no matching source id, no edit permission, reversed transaction, or opening entry blocks an unsupported mutation with an exact explanation; test in Task 6 and Task 12.
5. **Malformed CSV / spreadsheet formula injection:** Rejected bad rows are previewed safely; exported CSV formula-leading cells are escaped, Unicode Bangla preserved; test in Task 4 and Task 8.

## Repository map and interface boundaries

| File | Purpose | Tasks |
|---|---|---|
| `src/types/partyLedger.ts` **new** | `PartyRelationship`, `PartyLedgerSource`, `PartyLedgerRow`, `LedgerStatement`, `PartyBalanceSummary`, `PartyPreviewState`, `PartyAction` | 1, 5 |
| `src/data/partyFixtureAdapter.ts` **new** | Explicit party-to-finance-person mapping; normalize current `Party`, legacy `LedgerEntry`, source fixtures with provenance | 1 |
| `src/data/partyPreviewStore.ts` **new** | One in-memory preview source state; subscribe/snapshot/dispatch; typed audit trail; version bumps | 2, 3, 9-14 |
| `src/utils/partyIdentity.ts` **new** | Profile validation, deterministic role handling, URL selection resolution | 1 |
| `src/utils/partyImport.ts` **new** | CSV parsing, preview, reject/duplicate validation and safe mapping | 4 |
| `src/utils/partyLedger.ts` **new** | Clean role-specific ledger projection, date filtering, balances, stable pagination | 5 |
| `src/utils/partyActions.ts` **new** | Source capability matrix, permission checks, action routes | 6 |
| `src/utils/partyStatement.ts` **new** | CSV/print data generator; printable clean date-scoped report | 8 |
| `src/utils/partySettlement.ts` **new** | Customer/supplier due, cash-backed credit, settlement, allocations, as-of-date checks | 9, 11, 12 |
| `src/components/parties/PartyEditorDialog.tsx` **new** | Add/edit/deactivate, multi-role contact controls | 3 |
| `src/components/parties/PartyImportDialog.tsx` **new** | Local CSV preview and import confirmation | 4 |
| `src/components/parties/PartyLedgerToolbar.tsx` **new** | Unified filters, `AppDateRangePicker`, page size, statement actions | 7 |
| `src/components/parties/PartyLedgerRowActions.tsx` **new** | `FloatingPanel` actions governed by Task 6 | 7 |
| `src/components/parties/PartyStatementDialog.tsx` **new** | Statement preview, print-scoped DOM/CSS and CSV export | 8 |
| `src/components/parties/PartyPaymentDialog.tsx` **new** | Shared role-aware payment/discount/multi-source editor | 10, 12 |
| `src/components/parties/PartyCreditRefundDialog.tsx` **new** | Refund validation, selected-date credit and account movement | 11 |
| `src/components/parties/PartyTransactionDialog.tsx` **new** | Source-linked view/edit/reverse with confirmation; finance-type specialization | 12, 13 |
| `src/components/parties/PartyDirectory.tsx` **modify** | Search by both languages and phone, role chips, selection, empty/filter states | 3 |
| `src/components/parties/PartyDetail.tsx` **modify** | Role header/balances, contextual quick actions, tabs, wiring dialogs | 3, 7, 10-13 |
| `src/components/parties/LedgerTable.tsx` **modify** | Normalized ledger with supplied running balance (never recalculated from filtered rows) | 7 |
| `src/pages/Parties.tsx` **modify** | URL + role selection, provider consumption, 2-column shell, import/add dialogs | 3, 4, 7-13 |
| `src/data/erpDemoStore.ts` **modify, targeted** | Compatibility with existing availableParties/availableLedgerEntries; no unrelated inventory changes | 2 |
| `src/pages/Sales.tsx`, `src/pages/Finance.tsx`, `src/pages/Purchases.tsx` **targeted** | Only shared-preview source integration needed to prevent demonstrated drift; no broad rewrite | 14 |
| `src/styles/*` or existing print CSS **targeted** | Print-only statement styling and accessible responsive cards | 8, 14 |
| `tests/party*.test.ts` **new** | `node:test` pure unit/integration tests following current tests' `.ts` import style | 1-14 |
| `scripts/party-browser.cjs` **new** | Vite-served Playwright flows (theme, desktop/mobile, modals, print) | 3-14 |
| `package.json`, `.github/workflows/ui-check.yml` **modify** | `test:parties` browser command + CI gate | 14 |

**API design decisions shared across tasks:**

```ts
export type PartyRelationship = 'Customer'|'Supplier'|'Vendor'|'Payee'|'Lender'|'Borrower'|'Owner';
export type PartyLedgerSource = 'sale'|'sale-return'|'customer-payment'|'customer-credit-refund'|
  'purchase'|'purchase-return'|'supplier-payment'|'finance'|'expense'|'opening'|'note';
export type PartyLedgerRow = {
  id: string; partyId: string; relationship: PartyRelationship;
  source: PartyLedgerSource; sourceId?: string; reference?: string;
  date: string; description: string; debit: number; credit: number;
  amountPaid?: number; discount?: number; method?: string; accountId?: string;
  attachment?: {name:string;url?:string};
  status: 'Active'|'Reversed'|'Deleted'; isCorrection?: boolean; sequence: number;
};
export type LedgerStatement = {
  partyId:string; relationship:PartyRelationship; from:string; to:string;
  openingBalance:number;
  rows:Array<PartyLedgerRow & {runningBalance:number}>;
  periodDebit:number; periodCredit:number; closingBalance:number;
};
export type PartyBalanceSummary = {
  relationship:PartyRelationship; netBalance:number;
  due:number; availableCredit:number; refundableCredit:number;
  labels:Record<string,number>;
};
export type PartyAction = 'view'|'edit'|'delete'|'reverse'|'print'|'return'|'source';
export type PartySourceRecord = {
  id:string; partyId:string; relationship:PartyRelationship; kind:PartyLedgerSource;
  date:string; sequence:number; reference?:string; description:string;
  debit:number; credit:number; amountPaid?:number; discount?:number;
  method?:string; accountId?:string; invoiceId?:string;
  paymentSplits?:Array<{id:string;method:'Cash'|'Bank'|'Mobile Banking';accountId:string;amount:number}>;
  status:'Active'|'Reversed'|'Deleted'; createdAt?:string;
};
export type PartyAuditEvent = {
  id:string; sourceId?:string; partyId:string; action:string;
  before?:unknown; after?:unknown; actor:string; at:string; reason?:string;
};
export type PartyPreviewState = {
  parties:Party[]; sources:PartySourceRecord[]; audit:PartyAuditEvent[]; revision:number;
};
```

`PartyPreviewState` is a value type containing `parties: Party[]`, `sources: PartySourceRecord[]`, `audit: PartyAuditEvent[]`, `revision: number`; source records add `id`, `partyId`, `relationship`, `kind:PartyLedgerSource`, `date`, `reference`, `description`, financial fields and `status`. Commands must preserve source identity. UI read path `getPartyPreviewSnapshot(): PartyPreviewState`; observer `subscribePartyPreview(listener:()=>void):()=>void`; command `dispatchPartyPreview(command:PartyPreviewCommand): PartyPreviewState`. A new `PartyPreviewCommand` variant has a literal `type` and validated payload, not generic mutating row patches. Initialize once from explicit source/fixture adapters. Seed `Sales` from `src/data/sales.ts` and `Purchases` from `src/data/purchases.ts` plus preview-created purchases, and Finance from `src/data/financeAccounts.ts` where explicit party links exist. Legacy ledger entries matching a real source's party, role and reference are **supplementary historical evidence, not extra financial movement**; only unmatched legacy entries become a separate source. Reject ambiguous duplicate references and flag fixture differences. Confirm no fixture import cycles.

For demo money amounts, use integer minor units internally (BDT paisa; 2 decimal places). Date parser is `expenseDateIso` from `src/utils/dateRange.ts` for legacy fixtures; all new commands store ISO `YYYY-MM-DD`. Report `from/to` use `IsoRange`.

## Delivery milestones

- **Slice 1 / PR A (Tasks 1-4):** Directory/profile/role URL and CSV preview. Independently testable; no customer settlement promise yet.
- **Slice 2 / PR B (Tasks 5-8):** Full ledger projection, source-aware action menu, accurate filtered printable/CSV statements. Depends on PR A.
- **Slice 3 / PR C (Tasks 9-12):** Payment allocation, customer/supplier advance and refund, source-owned edit/reverse preview and common dialog. Depends on PR B.
- **Slice 4 / PR D (Tasks 13-14):** Owner/lender/borrower, vendor/payee, cross-module preview consistency and complete QA. Depends on PR C.

Each PR targets the preceding merged slice (or branch until it is merged); never commit directly on `main`. All earlier slices must be GREEN before starting the next one. Plan-phase changes are **not** implementation-phase approval.

---

## Slice 1 — Directory and profile

### Task 1: Typed identities and explicit fixture mapping

**Files:** Create `src/types/partyLedger.ts`, `src/utils/partyIdentity.ts`, `src/data/partyFixtureAdapter.ts`; Test `tests/partyIdentity.test.ts`; read `src/data/parties.ts` and `src/data/financeAccounts.ts`.

**Interfaces:**
- Consumes: existing `Party`, `PartyRole`, `LedgerEntry`, `financePeople`, `financeTransactions`, `expenseDateIso`.
- Produces: shared types above; `validatePartyDraft(draft:PartyDraft,existing:Party[]):string[]`; `resolvePartySelection(parties:Party[],id?:string,role?:string):{partyId:string;relationship:PartyRelationship}|null`; `normalizePartyFixture(parties:Party[], legacy:LedgerEntry[]):PartyPreviewState`; explicit `financePersonIdByPartyId: Readonly<Record<string,string>>`.

- [ ] **Step 1: Write failing tests.** `validatePartyDraft` rejects blank name and duplicate id, preserves customer+supplier roles; selecting `c2` and Supplier returns the Supplier relationship; a missing id falls back to a valid party; legacy `'01 Sep 2026'` becomes `2026-09-01`; finance ids link only via explicit mapping, not matching by similar names/phone; `INV-000241` from Sales and the same reference in the legacy ledger produce exactly **one** economic sale movement; `PUR-000118` from Purchases and the legacy ledger likewise produce one purchase. Use `node:test` and `node:assert/strict`; import `../src/utils/partyIdentity.ts`.
- [ ] **Step 2: Verify RED.** Run `node --experimental-strip-types --test tests/partyIdentity.test.ts`. Expected: FAIL because the new exports do not yet exist.
- [ ] **Step 3: Implement** three focused files. `PartyDraft = Pick<Party,'name'|'roles'|'phone'|'area'> & Partial<Party>`; normalize digits/whitespace for validation, do not auto-merge. For finance, explicitly link the matching seeded owner (`o1` to `fp1`) only after confirming ids from fixtures; keep other finance-person records separate unless an explicit map exists.
- [ ] **Step 4: Verify GREEN.** Run the same test. Expected: all Task 1 cases PASS.
- [ ] **Step 5: Commit.** `git add src/types/partyLedger.ts src/utils/partyIdentity.ts src/data/partyFixtureAdapter.ts tests/partyIdentity.test.ts && git commit -m "feat(parties): define role identity and source fixture mapping"`.

### Task 2: Canonical preview state and audit-aware commands

**Files:** Create `src/data/partyPreviewStore.ts`; modify `src/data/erpDemoStore.ts` narrowly; test `tests/partyPreviewStore.test.ts`.

**Interfaces:**
- Consumes: Task 1 `PartyPreviewState`, `PartyLedgerRow`, fixture adapter.
- Produces: `getPartyPreviewSnapshot():PartyPreviewState`, `subscribePartyPreview(listener:()=>void):()=>void`, `dispatchPartyPreview(command:PartyPreviewCommand):PartyPreviewState`, `resetPartyPreviewForTest():void`. `PartyPreviewCommand` starts as typed `create-party`, `update-party`, `deactivate-party`, `add-note`, `edit-note`, `delete-note`; later union extensions in Tasks 10-13.

- [ ] **Step 1: Write failing tests.** Create party then read updated snapshot; same id rejected; note add/edit/remove leaves money unchanged; revisions increase once per valid action; subscriber sees one notification per committed action; rejected action leaves state unchanged; deactivation with linked active balances/transactions is blocked.
- [ ] **Step 2: Verify RED.** Run `node --experimental-strip-types --test tests/partyPreviewStore.test.ts`. Expected: module/export missing.
- [ ] **Step 3: Implement** immutable command reducer + frozen/read-only snapshot convention and simple subscriber Set; copy arrays before updating; no direct mutation of initial `seedParties`; isolate test reset. Preserve existing `availableParties`/`availableLedgerEntries` consumers through adapters, no circular imports. Audit logs include before/after, operation type and synthetic preview actor/time.
- [ ] **Step 4: Verify GREEN** via task command and `npm test`. Expected: all tests PASS.
- [ ] **Step 5: Commit.** `git add src/data/partyPreviewStore.ts src/data/erpDemoStore.ts tests/partyPreviewStore.test.ts && git commit -m "feat(parties): add audited preview state commands"`.

### Task 3: Party directory, profile editor and role navigation

**Files:** Create `src/components/parties/PartyEditorDialog.tsx`; modify `src/pages/Parties.tsx`, `src/components/parties/PartyDirectory.tsx`, `src/components/parties/PartyDetail.tsx`; create `scripts/party-browser.cjs` and `tests/partyDirectory.test.ts`.

**Interfaces:**
- Consumes: `getPartyPreviewSnapshot`, `subscribePartyPreview`, `dispatchPartyPreview`, `resolvePartySelection`.
- Produces: role selector + URL `/app/parties?id=<id>&role=<Role>`; `PartyEditorDialog({open,party,onClose,onSave})` with source action callback rather than direct store mutator.

- [ ] **Step 1: Write failing tests.** Pure test: URL resolver handles role not on selected party, empty directory and Bangla query; Playwright browser: Add party opens required-fields modal, saves 2 roles, selects new id, edit updates phone, switching to Supplier changes role URL, notes can be edited/deleted; keyboard search, mobile directory toggle and dark mode controls work.
- [ ] **Step 2: Verify RED.** Run `node --experimental-strip-types --test tests/partyDirectory.test.ts` and `node scripts/party-browser.cjs`. Expected: tests fail at missing editor/selection interactions; browser process may require locally installed Playwright Chromium.
- [ ] **Step 3: Implement** real Add/Edit/Deactivate actions and validation. Directory search English/Bangla/phone; don't overwrite `?id=` when switching other UI state; use `useSyncExternalStore` to subscribe to preview source; empty directory renders explicit action; restore focus on modal close. Remove fake toast-only New party; keep unrelated actions disabled with reason until their slice.
- [ ] **Step 4: Verify GREEN.** Run both commands; expected PASS. For Playwright, follow existing Vite server + `chromium.launch` pattern in `scripts/themed-filters-browser.cjs`, use unique localhost port and close browser/server in `finally`.
- [ ] **Step 5: Commit.** `git add src/pages/Parties.tsx src/components/parties/PartyDirectory.tsx src/components/parties/PartyDetail.tsx src/components/parties/PartyEditorDialog.tsx tests/partyDirectory.test.ts scripts/party-browser.cjs && git commit -m "feat(parties): complete party profiles and role selection"`.

### Task 4: Contacts import with honest CSV validation

**Files:** Create `src/utils/partyImport.ts`, `src/components/parties/PartyImportDialog.tsx`; modify `src/pages/Parties.tsx`; test `tests/partyImport.test.ts`, extend `scripts/party-browser.cjs`.

**Interfaces:**
- Consumes: `validatePartyDraft`, `dispatchPartyPreview({type:'create-party',...})`.
- Produces: `parsePartyCsv(text:string):{valid:PartyDraft[];rejected:Array<{row:number;reason:string}>}` with name/phone/roles/Bangla columns; import preview and explicit confirmation.

- [ ] **Step 1: Write failing tests.** Valid quoted-comma names and Bangla survive; invalid/missing name, unknown role, conflicting duplicate id/phone candidate, malformed CSV, blank row and formula-starting untrusted text are rejected/flagged; browser file selection displays accepted/rejected counts and imports only approved rows.
- [ ] **Step 2: Verify RED.** Run `node --experimental-strip-types --test tests/partyImport.test.ts` and Party browser script. Expected FAIL at missing parser/import UI.
- [ ] **Step 3: Implement** small browser-local CSV parser with quotes/escaped quotes, case-normalized header mapping, size limit, row-level rejection and duplicate warning confirmation. CSV import explicitly **does not** import XLSX/contacts or claim to do so; either label the action "Import CSV" or disable other sources truthfully. Import into demo preview state in one atomic batch command (extend Task 2 union to `import-parties`; all accepted rows validated before mutation).
- [ ] **Step 4: Verify GREEN.** Same commands, expected PASS.
- [ ] **Step 5: Commit.** `git add src/utils/partyImport.ts src/components/parties/PartyImportDialog.tsx src/pages/Parties.tsx src/data/partyPreviewStore.ts tests/partyImport.test.ts scripts/party-browser.cjs && git commit -m "feat(parties): add validated CSV import preview"`.

**Slice 1 gate:** `npm test && npm run build && node scripts/party-browser.cjs`, all green; open reviewable PR A. Do not merge/deploy without separate approval.

---

## Slice 2 — Shared ledger, row actions, statements

### Task 5: Date-scoped clean ledger projection

**Files:** Create `src/utils/partyLedger.ts`, `tests/partyLedger.test.ts`; extend `src/types/partyLedger.ts`.

**Interfaces:**
- Consumes: `PartyLedgerRow` with `sequence`, `IsoRange`, `businessToday` and `expenseDateIso`.
- Produces: `projectPartyStatement(rows:readonly PartyLedgerRow[], partyId:string, relationship:PartyRelationship, range:IsoRange, today?:string):LedgerStatement`; `pagedStatementRows(statement:LedgerStatement,page:number,pageSize:number,descending?:boolean):LedgerStatement['rows']`; `computePartyBalanceSummary(state:PartyPreviewState,partyId:string,relationship:PartyRelationship):PartyBalanceSummary`.

- [ ] **Step 1: Write failing tests.** Customer Sep 1 debit 100, Sep 4 payment credit 30, Sep 10 debit 20: Sep 4–10 => opening 100, period debit 20, credit 30, closing 90, row running balances 70 then 90; no-rows Sep 5–9 => opening 70 and closing 70; reversed/correction excluded; note zero effect; same-day rows ordered by sequence; page=2 retains true running balances; supplier purchase-credit reverses sign; invalid partial and future range throws controlled errors; decimal `0.1 + 0.2` rounds exactly `0.30`; role Customer vs Supplier with same id cannot net.
- [ ] **Step 2: Verify RED.** Run `node --experimental-strip-types --test tests/partyLedger.test.ts`. Expected FAIL at missing projection.
- [ ] **Step 3: Implement** normalize date at adapter boundary, integer-paisa accumulation, full-history sort, clean grouping; reject missing party/role, invalid/future range; no silent amount correction. `pagedStatementRows` slices **after** running balances assigned.
- [ ] **Step 4: Verify GREEN.** Run task tests and `npm test`. Expected PASS.
- [ ] **Step 5: Commit.** `git add src/types/partyLedger.ts src/utils/partyLedger.ts tests/partyLedger.test.ts && git commit -m "feat(parties): calculate correct relationship statements"`.

### Task 6: Central source-action matrix and permissions

**Files:** Create `src/utils/partyActions.ts`, `tests/partyActions.test.ts`; modify `src/utils/permissions.ts` only when a required source mapping is missing.

**Interfaces:**
- Consumes: `PartyLedgerRow`, `PartyAction`, `demoPermissions`, `sourcePermissionGroup`.
- Produces: `ledgerActionAvailability(row:PartyLedgerRow, granted:ReadonlySet<string>, supported:ReadonlySet<PartyAction>):Array<{action:PartyAction;enabled:boolean;reason?:string}>`; `partySourceRoute(row:PartyLedgerRow):string|null`.

- [ ] **Step 1: Write failing tests.** Invoice edit routes to `/app/pos?mode=edit&invoice=INV-1` only if source id/ref resolves; purchase only navigates to a **verified** source route; a payment cannot be edited without `sales.edit` or `purchases.edit`; finance ownership uses `finance.*`; opening and missing source id cannot be arbitrary-deleted; already-reversed source edit/delete disabled; return action available only on valid source types; no fabricated invoice printing for notes.
- [ ] **Step 2: Verify RED.** Run `node --experimental-strip-types --test tests/partyActions.test.ts`. Expected FAIL.
- [ ] **Step 3: Implement** declarative source→owner group→allowed actions mapping; split permission from implemented capability; returned actions carry precise unavailable reasons. For `customer-credit-refund`, use customer-payment's source permission group explicitly; **do not invent** a route unsupported by the current `Sales`/`Purchases` UI.
- [ ] **Step 4: Verify GREEN.** Run task test + existing `tests/permissions.test.ts`. Expected PASS.
- [ ] **Step 5: Commit.** `git add src/utils/partyActions.ts src/utils/permissions.ts tests/partyActions.test.ts && git commit -m "feat(parties): derive source-aware permitted row actions"`.

### Task 7: Ledger toolbar, table and menu UX

**Files:** Create `src/components/parties/PartyLedgerToolbar.tsx`, `src/components/parties/PartyLedgerRowActions.tsx`; modify `src/components/parties/LedgerTable.tsx`, `src/components/parties/PartyDetail.tsx`, `src/pages/Parties.tsx`; extend `scripts/party-browser.cjs`.

**Interfaces:**
- Consumes: `projectPartyStatement`, `pagedStatementRows`, `ledgerActionAvailability`, `AppDateRangePicker`, `FloatingPanel`.
- Produces: `PartyLedgerToolbar({range,onRange,kind,onKind,query,onQuery,pageSize,onPageSize,onStatement})`; `LedgerTable({statement,visibleRows,onAction,onOpenAttachment})`; `PartyLedgerRowActions({row,actions,onAction})`.

- [ ] **Step 1: Write failing browser checks.** Customer/Supplier/Owner role filters change ledger; Sept 4–10 date range displays opening, correct period totals, closing; clear range restores full history; text/type filtering must not change relationship closing improperly; page size 10 vs 50 doesn't alter totals; row action menu keyboard Escape/Enter and touch; action without permission disabled/omitted; mobile cards preserve amount labels; both theme popovers use theme tokens.
- [ ] **Step 2: Verify RED.** Run `node scripts/party-browser.cjs`. Expected FAIL where toolbar/menu and totals are missing.
- [ ] **Step 3: Implement** role-specific tabs, `AppDateRangePicker` label "Party ledger date range", separate transaction filter vs statement-period totals, responsive table/cards, `FloatingPanel` menus, keyboard focus and disabled reasons. Remove old local `let running=0` from filtered entries.
- [ ] **Step 4: Verify GREEN.** Run browser script + `npm test && npm run build`; expected PASS.
- [ ] **Step 5: Commit.** `git add src/components/parties/PartyLedgerToolbar.tsx src/components/parties/PartyLedgerRowActions.tsx src/components/parties/LedgerTable.tsx src/components/parties/PartyDetail.tsx src/pages/Parties.tsx scripts/party-browser.cjs && git commit -m "feat(parties): add filtered ledger and accessible row menus"`.

### Task 8: Full-period statement, A4 print and safe CSV

**Files:** Create `src/utils/partyStatement.ts`, `src/components/parties/PartyStatementDialog.tsx`, `tests/partyStatement.test.ts`; modify `src/components/parties/PartyDetail.tsx`; modify `src/index.css` for scoped statement print CSS; extend browser script.

**Interfaces:**
- Consumes: `LedgerStatement`, `projectPartyStatement`, `businessToday`.
- Produces: `serializePartyStatementCsv(statement:LedgerStatement,metadata:{business:string;party:string}):string`; `statementPrintRows(statement:LedgerStatement):ReadonlyArray<...>`; preview dialog with actual browser print via scoped CSS.

- [ ] **Step 1: Write failing tests.** Customer Sep 4–10 CSV contains opening=100, debit=20, credit=30, closing=90 regardless of visible page/filter; Bangla party name survives UTF-8; formula-leading description `=HYPERLINK(...)` is prefixed safely; quotes/newlines correctly escaped; reversed/corrections omitted; all-time range uses first transaction through Bangladesh today; no-period row still prints opening/closing; browser Print preview hides app shell and shows A4 table header.
- [ ] **Step 2: Verify RED.** Run `node --experimental-strip-types --test tests/partyStatement.test.ts` and browser script. Expected FAIL.
- [ ] **Step 3: Implement** CSV serializer + actual Blob/objectURL download with cleanup, business/party heading, period, opening, full rows, totals, closing and print timestamp. Print via `window.print()` of a **scoped** print-only subtree styled `@media print`, not generic screen shot. PDF is browser Save as PDF, not server PDF or false download claim. SMS Send statement remains explicitly disabled with "SMS not connected".
- [ ] **Step 4: Verify GREEN.** Run task test, browser script and build. Expected PASS.
- [ ] **Step 5: Commit.** `git add src/utils/partyStatement.ts src/components/parties/PartyStatementDialog.tsx src/components/parties/PartyDetail.tsx tests/partyStatement.test.ts scripts/party-browser.cjs src/index.css && git commit -m "feat(parties): print and export complete clean statements"`.

**Slice 2 gate:** all tests/build/browser pass; verify correction rows not printable and sample closing amounts reconcile; reviewable PR B.

---

## Slice 3 — Customer/supplier settlement and refunds

### Task 9: Deterministic settlement and provenance model

**Files:** Create `src/utils/partySettlement.ts`, `tests/partySettlement.test.ts`; extend `src/types/partyLedger.ts`.

**Interfaces:**
- Consumes: canonical Party source events, dates, role, source id; never legacy `Party.balance`.
- Produces: `customerSettlementAsOf(sources:readonly PartySourceRecord[],partyId:string,date:string):CustomerSettlementState`; `supplierSettlementAsOf(...):SupplierSettlementState`; `validateCustomerPayment(state:CustomerSettlementState,input:CustomerPaymentInput):SettlementPreview`; `validateCustomerRefund(state:CustomerSettlementState,input:CustomerRefundInput):SettlementPreview`.
- `CustomerSettlementState` separates `invoiceDue`, `cashBackedAdvance`, `returnCredit`, `nonCashAdjustment`, `consumedCredit`, `refundedCredit`, `refundableCredit`. `SettlementPreview` records applied amount, discount, cash moved, new due/credit and source-event references.

- [ ] **Step 1: Write failing tests.** Sep 1 invoice due ৳100, Sep 4 receive ৳130 => settled 100 + refundable advance 30; Sep 5 apply 10 advance to another invoice => refundable 20; no invoice-targeted payment before invoice date; discount 10 with no due rejected and never added to refundable; Sep 7 credit return 25 increases valid customer credit; refund 40 on Sep 6 (before return) rejected though end-of-month balance >=40; duplicate payment replay with same source id has no second effect; supplier purchase 100/pay 130 gives advance 30 of correct sign; two same-day events settle in deterministic sequence.
- [ ] **Step 2: Verify RED.** Run `node --experimental-strip-types --test tests/partySettlement.test.ts`. Expected FAIL.
- [ ] **Step 3: Implement** minor-unit settlement replay with invoice allocations oldest-first or explicit, discount constraints, immutable provenance lots consumed once (cash advance first and return credit rules modeled explicitly), as-of date stable sequencing. Avoid reducing refundable credit to negative net balance. Assert debit/credit signs per relationship. If seed fixtures lack provenance, flag unknown/unsafe as **not refundable**, never invent credit entitlement. Update Task 5 `computePartyBalanceSummary` to use these authoritative settlement replay outputs for available/refundable credit; add an assertion that cash-backed advance differs from net due.
- [ ] **Step 4: Verify GREEN.** Run task test and `npm test`. Expected PASS.
- [ ] **Step 5: Commit.** `git add src/utils/partySettlement.ts src/types/partyLedger.ts tests/partySettlement.test.ts && git commit -m "feat(parties): replay customer and supplier settlement provenance"`.

### Task 10: Multi-payment receive/pay dialog and preview posting

**Files:** Create `src/components/parties/PartyPaymentDialog.tsx`, `tests/partyPaymentCommands.test.ts`; extend `src/data/partyPreviewStore.ts`; modify `src/components/parties/PartyDetail.tsx`; extend browser script.

**Interfaces:**
- Consumes: Task 9 preview/validation, existing `FinancePaymentSplitEditor` (or extracted reusable typed method/account rows), `AppDatePicker`, financeAccounts active account catalog.
- Produces: `dispatchPartyPreview({type:'record-payment',payload:CustomerOrSupplierPaymentInput})` creates one source payment with internally linked splits, discount, allocation and audit; `PartyPaymentDialog({open,party,relationship,onClose,onSubmit})`.

- [ ] **Step 1: Write failing tests.** Customer cash 70 + bKash 30 = payment 100; discount 5 requires reason and does not increase cash moved; Bank method requires active Bank account, Mobile Banking requires active mobile account; invalid split amount/negative split and mismatched totals are rejected atomically; invoice selection correct party/role; supplier Pay reverses account/ledger direction; browser "Receive payment" opens actual modal, after submit ledger/payment summary changes in preview.
- [ ] **Step 2: Verify RED.** Run `node --experimental-strip-types --test tests/partyPaymentCommands.test.ts` and `node scripts/party-browser.cjs`. Expected FAIL.
- [ ] **Step 3: Implement** shared UI with role-labeled actions, conditional account rows, full settlement toggle, date/backdate reason hint, allocation/discount summary, explicit confirmation with amount/method/party/date. Command commits money and ledger effects in a single in-memory source event; no toast claiming real bank posting.
- [ ] **Step 4: Verify GREEN.** Run tasks tests + browser script + `npm run build`. Expected PASS.
- [ ] **Step 5: Commit.** `git add src/components/parties/PartyPaymentDialog.tsx src/components/parties/PartyDetail.tsx src/data/partyPreviewStore.ts tests/partyPaymentCommands.test.ts scripts/party-browser.cjs && git commit -m "feat(parties): record split customer and supplier payments in preview"`.

### Task 11: Credit refund with as-of-date restrictions

**Files:** Create `src/components/parties/PartyCreditRefundDialog.tsx`, `tests/partyRefund.test.ts`; extend `src/data/partyPreviewStore.ts`, `src/components/parties/PartyDetail.tsx`.

**Interfaces:**
- Consumes: `customerSettlementAsOf`/`supplierSettlementAsOf`, selected business date, configured money account choices.
- Produces: `dispatchPartyPreview({type:'refund-credit',payload:CustomerOrSupplierRefundInput})`; dialog with live available credit **at chosen date**, projected after-state and method/account validation.

- [ ] **Step 1: Write failing tests.** Customer credit 30 => refund 30 allowed, refund 30.01 blocked; twice same command source/id rejected; Sep 4 attempted refund of Sep 6 return credit rejected; return credit eligible vs discount-only credit ineligible; existing due without credit disables action; cash refund flows out, supplier advance refund flows **in**; reverse refund restores provenance and previous settlement; browser date changing updates available credit.
- [ ] **Step 2: Verify RED.** Run `node --experimental-strip-types --test tests/partyRefund.test.ts` and browser script. Expected FAIL.
- [ ] **Step 3: Implement** role-specific labels/flow, bound to as-of-date result on every date or amount change, full-account validation, rejection without state changes, audit and source-linked refund event with reversible effect. Keep credit summary independent of legacy Party.balance.
- [ ] **Step 4: Verify GREEN.** Run task test + browser script + `npm test`. Expected PASS.
- [ ] **Step 5: Commit.** `git add src/components/parties/PartyCreditRefundDialog.tsx src/data/partyPreviewStore.ts src/components/parties/PartyDetail.tsx tests/partyRefund.test.ts scripts/party-browser.cjs && git commit -m "feat(parties): validate and preview customer and supplier credit refunds"`.

### Task 12: Payment edit/reverse and source-owned transaction details

**Files:** Create `src/components/parties/PartyTransactionDialog.tsx`, `tests/partyTransactionActions.test.ts`; modify `src/data/partyPreviewStore.ts`, `src/components/parties/PartyLedgerRowActions.tsx`, `src/components/parties/PartyDetail.tsx`; browser extension.

**Interfaces:**
- Consumes: `ledgerActionAvailability`, preview source id/status, `customerSettlementAsOf`, `supplierSettlementAsOf`.
- Produces: `dispatchPartyPreview({type:'edit-source-payment',sourceId,patch})` and `dispatchPartyPreview({type:'reverse-source',sourceId,reason})`; view and confirmation dialogs. For invoice/purchase/return, navigate to **verified** existing source handlers or show read-only source details with explicit unsupported-edit reason; do not patch invoice totals in Party store.

- [ ] **Step 1: Write failing tests.** Payment edit changes date/account/cash effect and recalculates later dependent settlements; reversing payment restores due and account effect and marks source Reversed; double reversal rejected; editing a source with later refunds that would become unfunded rejected; note delete has no monetary effect; invoice opening row cannot be arbitrary deleted; browser row menu View/Edit/Delete confirmation and "Open source" work for real matching records, absent source editor disabled.
- [ ] **Step 2: Verify RED.** Run `node --experimental-strip-types --test tests/partyTransactionActions.test.ts` and browser script. Expected FAIL.
- [ ] **Step 3: Implement** detail and source-aware edit/reverse flows; re-run full chronological settlement validation against the altered preview source list before commit. Require reason + impact display, preserve original source/audit, refuse invalid due/credit chain changes. For sale/purchase, honor existing POS V2/Purchase business flow. Use real receipts/source detail where available; no `toast('edited')` fallback.
- [ ] **Step 4: Verify GREEN.** Run task test + browser script + `npm test && npm run build`. Expected PASS.
- [ ] **Step 5: Commit.** `git add src/components/parties/PartyTransactionDialog.tsx src/components/parties/PartyLedgerRowActions.tsx src/components/parties/PartyDetail.tsx src/data/partyPreviewStore.ts tests/partyTransactionActions.test.ts scripts/party-browser.cjs && git commit -m "feat(parties): edit and reverse source-owned payment events"`.

**Slice 3 gate:** customer payment, supplier payment, refunds, source-payment edit/reverse regression suite all pass; verify that **real bank posting is not claimed**; reviewable PR C.

---

## Slice 4 — Finance relationships, cross-module accuracy and QA

### Task 13: Owner/lender/borrower, vendor/payee role adapters

**Files:** Create `tests/partyFinanceRelationships.test.ts`; modify `src/data/partyFixtureAdapter.ts`, `src/utils/partyLedger.ts`, `src/data/partyPreviewStore.ts`, `src/components/parties/PartyDetail.tsx`, `src/components/parties/PartyTransactionDialog.tsx`; browser extension.

**Interfaces:**
- Consumes: existing `FinanceTransactionType` (`Owner Credit/Debit`, `Lender Credit/Debit`, `Borrower Debit/Credit`, opening variants), explicit person-id mapping, `PartyBalanceSummary`.
- Produces: `financeRelationshipSourceRows(state:PartyPreviewState,partyId:string,relationship:'Owner'|'Lender'|'Borrower'):PartyLedgerRow[]`; `dispatchPartyPreview({type:'record-finance',payload:FinancePartyInput})`; finance-source edit/reverse actions through Task 12 transaction adapter.

- [ ] **Step 1: Write failing tests.** Owner investment credit raises capital; owner withdrawal debits; lender money received raises loan payable then repayment reduces; borrower loan debit increases receivable then repayment credit reduces; opening capital/loan leaves bank/cash unchanged; one person Owner+Lender shows distinct balances; incorrect finance-person id never links by name; vendor/payee with no supported expense source displays no fabricated payment action; browser role selector changes account labels/actions and opens correct finance modal.
- [ ] **Step 2: Verify RED.** Run `node --experimental-strip-types --test tests/partyFinanceRelationships.test.ts` and browser script. Expected FAIL.
- [ ] **Step 3: Implement** finance-row conversion from explicit source references and typed direction metadata, role-labeled loan/capital quick actions, zero-money opening semantics and separation of capital/advance/credit. Adapt existing `FinanceTransactionActionDialog` where possible; if its API is not reusable without duplicating posting logic, build a focused preview adapter but keep one source record. Vendor/payee only show actual sourced payments/expenses and valid view/edit actions.
- [ ] **Step 4: Verify GREEN.** Run task tests, `npm test`, browser script. Expected PASS.
- [ ] **Step 5: Commit.** `git add src/data/partyFixtureAdapter.ts src/utils/partyLedger.ts src/data/partyPreviewStore.ts src/components/parties/PartyDetail.tsx src/components/parties/PartyTransactionDialog.tsx tests/partyFinanceRelationships.test.ts scripts/party-browser.cjs && git commit -m "feat(parties): integrate independent owner and loan ledgers"`.

### Task 14: Cross-module coherence, UI accessibility and CI

**Files:** Create `tests/partyIntegration.test.ts`; extend `scripts/party-browser.cjs`; modify `src/pages/Sales.tsx`, `src/pages/Finance.tsx`, `src/pages/Purchases.tsx` **only where true preview-state integration is possible**; modify `src/data/partyPreviewStore.ts`, `src/pages/Parties.tsx`; update `package.json`, `.github/workflows/ui-check.yml`, `src/index.css` for any necessary responsive styling.

**Interfaces:**
- Consumes: entire approved preview source reducer and projection pipeline, source ids, existing source action pages.
- Produces: `npm run test:parties` running `node scripts/party-browser.cjs`, UI Check gating it; source-page projection must read one canonical preview source when a cross-module update is promised.

- [ ] **Step 1: Write failing tests.** Integration: receive 100 against linked invoice => Party detail, Sales credit/payment view and preview cash-account projection agree; reverse => all revert once; supplier payment => Purchases balance and Party payable agree; owner loan => Finance and Party balances agree or source page shows explicit independent-fixture warning (never two incompatible "current" numbers); refresh and switch parties without duplicate source rows. Browser: dark/light menus, date range, print preview, 375px mobile, 1280px desktop, keyboard menus + Escape, zoom/focus, no horizontal page overflow, no uncaught exceptions or incorrect success toasts.
- [ ] **Step 2: Verify RED.** Run `node --experimental-strip-types --test tests/partyIntegration.test.ts` and `node scripts/party-browser.cjs`. Expected FAIL where cross-module reads are disconnected.
- [ ] **Step 3: Implement** minimum shared-preview subscriptions/adapters in Sales/Purchases/Finance where necessary; keep isolated fixture datasets explicitly labeled rather than fabricating a link. Replace remaining inert Party buttons with genuine preview action or truthful disabled explanation. Add `"test:parties":"node scripts/party-browser.cjs"` and workflow step `npm run test:parties` after Chromium setup. Add accessible focus, ARIA labels, responsive design and print CSS checks. No broad state rewrite; maintain source ownership.
- [ ] **Step 4: Verify GREEN.** Run in order:
  - `node --experimental-strip-types --test tests/partyIntegration.test.ts` — expected all integration cases PASS;
  - `npm test` — expected 0 failures;
  - `npm run build` — expected exit 0;
  - `npm run lint` — expected exit 0 or, if repository already has baseline lint failures, document and fix new Party-related failures (do not claim clean lint);
  - `npm run test:parties` — expected 0 browser exceptions/failures;
  - `npm run test:themed-filters && npm run test:purchases && npm run test:pos-reorder && npm run test:theme && npm run test:settings && npm run test:saas && npm run test:product-quick-add` — expected no regressions;
  - Trigger/read new PR's `UI Check` run and all job conclusions = success before claiming CI green.
- [ ] **Step 5: Commit.** `git add src tests/partyIntegration.test.ts scripts/party-browser.cjs package.json .github/workflows/ui-check.yml && git commit -m "test(parties): verify cross-module and responsive ledger workflows"`.

**Slice 4 gate:** all checks above green (or failures explicitly reported, never concealed); reviewable PR D; no production backend integration or Cloudflare deployment implied.

## Completion, review and rollback contract

1. **Review slices independently** in dependency order (A→B→C→D). Use a worktree/branch per slice; never change `main` directly. If a slice fails checks, do not merge it or pretend later slices are complete.
2. Each task follows **RED → GREEN → commit**. Where a browser cannot start due to absent Chromium, install Playwright Chromium in the authorized test environment and rerun; this is a testing blocker, not a passing result.
3. Cross-source financial actions must show before/after money, role and account; failures leave preview source state unchanged. No hidden deletion of audit rows.
4. Print/CSV records are source-clean and complete even if screen pagination/search hides some; correction/admin screens are not exported.
5. Completion review should verify every section of the linked spec, plus the five Review Focus cases above, and run the exact command matrix from Task 14. Missing coverage is an explicit gap, not an implicit pass.
6. Rollback is revert of the specific slice PR/commits; preview-state migration does not touch production data. Do not use `git clean -fdx` in a shared/unverified workspace or alter `legacy/`.
7. UI code is **not** a secure posting backend. When production HisabIQ integration begins, replace each preview command with a tenant-scoped authenticated, audited, atomic source API, version/conflict checks, and credit validation inside the transaction.
