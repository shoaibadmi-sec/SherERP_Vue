# Top-Level Vendor Module and Consistent Party Profiles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Vendor a complete top-level ERP work module while every Vendor profile in Parties matches the existing Supplier/Customer PartyDetail layout, with a single source of truth for money and stock.

**Architecture:** Register /app/vendors as a sidebar peer of POS, Sales and Purchases; show a searchable canonical Vendor chooser and five in-page work tabs. Render the existing PartyDetail shell for Vendor instead of the special VendorWorkspace, using read-only projections from the existing Vendor state and ordinary Purchase records. Reuse POS/Purchase UI primitives and source-linked Vendor commands; do not duplicate ledger writes.

**Tech Stack:** React 18, TypeScript, Vite, React Router, existing Magic Patterns/shadcn-style components, Node native tests, Playwright browser scripts, GitHub Actions UI Check. UI preview only: no NestJS backend posting.

**Spec:** `docs/superpowers/specs/2026-10-10-vendor-five-tab-workspace-design.md` (approved 2026-10-10; Supplier Party screenshot is authoritative for Party visuals).

## Global Constraints

- Implementation is **native**, no subagents; owner has preferred native implementation on this UI project. GitHub is source of truth; keep each feature in a draft stacked PR until approved. Do not merge/deploy without approval.
- Main HisabIQ NestJS backend and legacy Apps Script repo are **out of scope**.
- Canonical `Party.id`; do not create another Supplier/Vendor identity; one Party may have multiple roles. Tenant isolation is a later backend implementation requirement, not a claim that the preview enforces authentication.
- Four independent summaries: **You owe (Taken)**, **Price not set (quantity)**, **Vendor owes (Given)**, **Purchase due**; no cross-bucket netting; unknown price is `null`, never pretend that it equals zero.
- Five **Vendor work** tabs: **Ledger, Taken, Given, Purchases, Payments**. Five **Party profile** tabs: **Ledger, Invoices/Bills & Memos, Payments, Notes, Attachments**. Same PartyDetail layout for every role.
- One contextual action per work tab, accessible compact record action menu, full-width inline editors; no giant Purchase modal and no eight-button toolbar.
- POS-like product add, compound quantity, unit changes, keyboard/touch; ordinary Purchase creates owned stock and its **own** payable, while Taken products remain sale-linked Vendor sources.
- All displayed language should be clear English with familiar Bangla helpers: **Set Price · দাম ঠিক করুন**, **Clear Due · বাকি মেটান**, **Pay Money · টাকা দিন**, **Receive Money · টাকা নিন**, **Price not set · দাম ঠিক হয়নি**. Remove *evening settlement* from visible UI.
- Preserve audit trail, correct source associations, idempotent operations, missing-price semantics, customer-return safety and all-or-nothing money + returned-goods changes.
- Theme-token light/dark controls, horizontal scrollable tab strip, no nested editor scrollbars or clipped small-screen controls; no monospaced digits.
- TDD: first run each targeted test and observe its **expected failure**, then write minimum code, rerun, commit. Never claim CI passed when GitHub Actions shows no assigned runner or no executed steps.

## Review Focus — failure modes the task tests MUST cover

1. **Same person is Vendor and Supplier:** selection/Quick Add preserves a single canonical Party ID, with sourcing and ordinary-Purchase dues in separate buckets (Tasks 1, 2, 8).
2. **Price entered after taking unpriced goods:** historic source remains “Price not set” and priced liability begins only when quoted; date-filtered ledger never shows invented ৳0 (Tasks 2, 5).
3. **Taken payable and Given receivable both active:** All Activity never fabricates a single running balance; side-specific running totals, opening, debit/credit and printing remain consistent (Tasks 2, 3, 5).
4. **Vendor switch during an unsaved multi-line cart or a payment:** warn before leaving, keep draft when switching tabs, and never submit to the previously selected Vendor (Tasks 1, 4, 7, 9).
5. **Repeated Purchase/save/settlement or invalid mixed return:** duplicate Purchase ID/operation is blocked or an exact no-op; partial cash+goods failures change neither cash nor stock projection (Tasks 8, 9, 10).

## File map and ownership

- Routing/navigation: `src/App.tsx`, `src/navigation/erpNavigation.ts`, existing `src/components/layout/ErpNavMenu.tsx` (prefer no markup change); route resolver `src/vendor/vendorRoute.ts`.
- Top-level work page and its small shell: `src/pages/Vendors.tsx`, `src/components/vendor/VendorTabs.tsx`, `VendorTakenPanel.tsx`, `VendorGivenPanel.tsx`, `VendorPurchasesPanel.tsx`, `VendorPaymentsPanel.tsx`, `VendorLedgerPanel.tsx`.
- Shared Party read model: `src/vendor/vendorPartyProjection.ts`; original Vendor reducers remain in `src/vendor/vendorModel.ts`, `vendorTypes.ts`, `vendorPreviewStore.ts` and `vendorLedger.ts`.
- Party integration: `src/pages/Parties.tsx`, `src/components/parties/PartyDetail.tsx`, current `PartyLedgerToolbar.tsx`, `LedgerTable.tsx`, `PartyStatementDialog.tsx`. No second Party store.
- Carts: existing `src/components/transactions/CompoundQuantityInput.tsx`, `src/components/purchases/PurchaseCart.tsx`, `src/components/purchases/PurchaseProductSearch.tsx` and `src/pages/PurchaseEditor.tsx`; extract only shared picker/quantity components necessary for Vendor.
- Payment UI: existing `src/components/finance/FinancePaymentSplitEditor.tsx`; domain command `settle-source` stays authoritative for Vendor source money.
- Regression: `tests/vendorRoute.test.ts`, `tests/vendorPartyProjection.test.ts`, `tests/vendorManualTaken.test.ts`, `tests/vendorPurchaseContext.test.ts`, `tests/vendorSettlements.test.ts`, plus focused browser scripts under `scripts/`. Update `package.json` and `.github/workflows/ui-check.yml` as tests are added.

## Preconditions and execution strategy

- Source branch for implementation: **draft PR #58** `docs/vendor-five-tab-workspace-20261010` stacked over draft #57 → #56 → #55 → #54. Use a **fresh implementation branch from approved spec head** rather than changing main. Keep prior PRs intact.
- Preflight: check PR bases, head SHAs, `npm ci`, `npm test`, `npm run build`, `npm run check:ui-contract`; record existing failures. If GitHub Actions fails before runner starts, do **not** attribute that to product code; diagnose runner setup/billing separately and use a verifiable local runner if available. Do not ask for Remote Desktop Commander unless the user explicitly requests it.
- Each command below is for the eventual native implementation; each step's command has a one-line purpose. Browser scripts already run Playwright through the project's npm scripts.
- Work in three reviewable increments: **A** top-level route + canonical Party parity (Tasks 1–4), **B** product, Purchase and ledger work tabs (Tasks 5–8), **C** payments, corrections and end-to-end QA (Tasks 9–11).

---

### Task 1: Top-level Vendor route, navigation and Party chooser

**Files:**
- Create: `src/vendor/vendorRoute.ts`, `src/pages/Vendors.tsx`, `tests/vendorRoute.test.ts`, `scripts/vendor-module-browser.cjs`
- Modify: `src/App.tsx`, `src/navigation/erpNavigation.ts`, `package.json`, `.github/workflows/ui-check.yml`

**Interfaces:**
- Produces `type VendorWorkTab = 'ledger'|'taken'|'given'|'purchases'|'payments'`.
- Produces `resolveVendorView(search:string,parties:readonly Party[]):{partyId:string|null;tab:VendorWorkTab}`, guarding unknown/deactivated/non-Vendor Party IDs and invalid tab strings.
- `Vendors` reads the canonical `availableParties()` store; Quick Add uses `dispatchPartyPreview` create/update Party and adds Vendor role when an existing person is chosen.

- [ ] **Step 1: Write the failing unit test.** In `tests/vendorRoute.test.ts`, assert `resolveVendorView('?partyId=v1&tab=given',vendors)` yields `{partyId:'v1',tab:'given'}`; unknown ID and non-Vendor role yield null; invalid tab falls back to `ledger`; multi-role Vendor/Supplier is accepted with one ID.
- [ ] **Step 2: Observe RED.** Run targeted route test: `node --experimental-strip-types --test tests/vendorRoute.test.ts`. Expect failure because the resolver does not exist.
- [ ] **Step 3: Implement resolver and minimal `Vendors` page.** Register `/app/vendors`, one top-level `Vendor · ভেন্ডর` entry after Purchases, route whitelist, searchable Vendor chooser and in-page Quick Add. One selected canonical Party ID in query params; warn about unsaved edits before changing selection.
- [ ] **Step 4: Write failing browser test and observe RED, then implement needed navigation behavior.** `scripts/vendor-module-browser.cjs`: assert desktop and mobile main navigation reach Vendor; chooser filters by name/phone; Party deep link preselects; Quick Add does not duplicate an existing Party.
- [ ] **Step 5: Verify GREEN and commit.** Rerun targeted Node test, `npm run test:erp-navigation`, new `npm run test:vendor-module`, and build. Commit route/navigation + tests as `feat(vendor): add top-level module and canonical chooser`.

### Task 2: One canonical Vendor read model for both modules

**Files:**
- Create: `src/vendor/vendorPartyProjection.ts`, `tests/vendorPartyProjection.test.ts`
- Modify only if essential: `src/vendor/vendorActivity.ts`, `src/vendor/vendorLedger.ts`

**Interfaces:**
- Produces `projectVendorPartyProfile(vendor:VendorPreviewState,purchases:readonly Purchase[],partyId:string,range:IsoRange):VendorPartyProfile`.
- `VendorPartyProfile` exposes **separate** `takenStatement:VendorStatement`, `givenStatement:VendorStatement`, `activity:VendorActivityRow[]`, `documents`, `payments`, and `summary:{takenDuePaisa:number;givenDuePaisa:number;purchaseDuePaisa:number;priceNotSetBaseQty:number}`. All event IDs remain unchanged and deduplicated by `kind + original source ID`.

- [ ] **Step 1: Write failing tests.** Show Vendor/Supplier dual role with ordinary Purchase due not added to Taken payable; unknown cost remains null even after later quote on the original event; mixed Taken/Given preserves separate side statements and opening amounts; cross-Vendor records are excluded; payment and reversal show once across views; out-of-range dates are excluded.
- [ ] **Step 2: Observe RED.** Run `node --experimental-strip-types --test tests/vendorPartyProjection.test.ts`; expect missing projection.
- [ ] **Step 3: Implement read-only projection.** Use current `vendorBalances`, `projectVendorActivity`, `projectVendorStatement`, and ordinary `availablePurchases`. Do **not** call `dispatchPartyPreview` or persist Vendor rows into `partyPreviewStore`.
- [ ] **Step 4: Verify GREEN and commit.** Rerun projection tests and existing `tests/vendorActivity.test.ts`, `tests/vendorLedger.test.ts`; commit `feat(vendor): share canonical read projection across modules`.

### Task 3: Party Vendor profile matches supplied Supplier screenshot

**Files:**
- Modify: `src/pages/Parties.tsx`, `src/components/parties/PartyDetail.tsx`, shared Party ledger/statement adapters as necessary
- Create: `src/components/parties/VendorPartyLedger.tsx` ONLY if the existing `LedgerTable` cannot express per-side running balances; `scripts/vendor-party-profile-browser.cjs`, `tests/vendorPartyActions.test.ts`

**Interfaces:**
- `PartyDetail` accepts optional `vendorProfile?:VendorPartyProfile` from Task 2 and `onOpenVendorWork:(tab?:VendorWorkTab,sourceId?:string)=>void`; other roles' existing props/flows stay unchanged.
- Both Vendor monetary directions are explicit: `Taken — You owe`, `Given — Vendor owes`. A mixed All Activity view has **no combined Running** column pretending to be one financial balance.

- [ ] **Step 1: Write failing tests.** Party Vendor profile must have the same header/actions/tablist/filters/ledger layout as Supplier. The same source appears once in both Vendor and Party. Side filter changes the running ledger and period totals; unknown prices show `Price not set`, not `৳0`. Vendor multi-role switch and notes/attachments remain usable.
- [ ] **Step 2: Observe RED.** Run new browser script plus targeted unit tests; expect special VendorWorkspace rendering to cause failures.
- [ ] **Step 3: Remove the Vendor-only render exception.** In `Parties.tsx` send every relationship to the same `PartyDetail`. Add Vendor read-only adapter, Bills & Memos label in invoice tab where appropriate, screenshot-matched filters/print row actions, and simple **Open Vendor Work** deep link. Keep same compact header style and two separate Vendor money figures.
- [ ] **Step 4: Wire quick actions safely.** **Pay Vendor** and **Receive Money** link to the **Vendor Payments** tab with source/direction prefilled until the same shared Vendor payment form is callable without a second mutation path. Opening Balance uses existing Vendor opening command with explicit side; Notes/Files remain standard Party interactions. Do not enable a misleading generic Vendor payment dialog.
- [ ] **Step 5: Verify GREEN and commit.** Run `npm run test:parties`, `npm run test:party-ledger`, `npm run test:party-opening`, `npm run test:party-settlement` and the new browser test. Commit `feat(parties): unify Vendor profile with PartyDetail`.

### Task 4: Five tab shell with stable source-aware deep links

**Files:**
- Create: `src/components/vendor/VendorTabs.tsx`, `tests/vendorTabs.test.ts` (test pure tab resolver/state helper), `scripts/vendor-tabs-browser.cjs`
- Modify: `src/pages/Vendors.tsx`

**Interfaces:**
- `VendorTabs({partyId:string,initialTab:VendorWorkTab,onTabChange:(tab:VendorWorkTab)=>void})` renders five accessible tabs; a tab can receive `sourceId` as a contextual query parameter for a selected record.
- The module owns Vendor selector + header; tabs own one primary action and their data. No operational cart renders inside `PartyDetail`.

- [ ] **Step 1: Write failing tab and browser tests.** Assert Ledger/Taken/Given/Purchases/Payments count equals five, underlined active state, keyboard arrows/Home/End, a preselected Vendor survives tab switching and refresh; tab changes never select a different Vendor; mobile tabs scroll without wrapping.
- [ ] **Step 2: Observe RED** using Node test and `node scripts/vendor-tabs-browser.cjs`.
- [ ] **Step 3: Implement shared shell** with compact four-bucket summary and tabs, one contextual toolbar/action per tab, no top-level button wall, no oversized dialogs. Preserve dirty drafts across tab clicks; warn before changing the selected Vendor.
- [ ] **Step 4: Verify GREEN and commit.** Test tab navigation, screenshot at 390px/1280px and light/dark contrast; commit `feat(vendor): add compact five-tab workspace shell`.

### Task 5: Vendor Ledger tab and statement behavior

**Files:**
- Create: `src/components/vendor/VendorLedgerPanel.tsx`, `scripts/vendor-ledger-browser.cjs`
- Modify: `src/vendor/vendorLedger.ts`, `tests/vendorLedger.test.ts` only for required statement pagination/filter semantics

**Interfaces:**
- `VendorLedgerPanel({partyId:string,profile:VendorPartyProfile})` uses Task 2's two side statements.
- Print/export uses authoritative Vendor side statement data and preserves opening/closing balances and original references.

- [ ] **Step 1: Write failing ledger tests.** Taken and Given each have correct running balance; All Activity labels bucket and uses no false combined running total; incomplete date range does not crash UI; printed selected date range and CSV include one source line per original transaction and no fake ৳0 for unknown price.
- [ ] **Step 2: Observe RED** with `npm run test:vendor-workflow` (existing baseline) and new `node scripts/vendor-ledger-browser.cjs`.
- [ ] **Step 3: Implement tab** using existing `AppDateRangePicker`, compact ledger rows, source menus for View/Correct/Cancel (guarded), Print Ledger, export under More, Bangla helpers and clear money-in/out labels independent of color.
- [ ] **Step 4: Verify GREEN and commit.** Run new ledger browser test plus `npm run test:themed-filters` and `npm run test:party-ledger`; commit `feat(vendor): add separated Vendor ledger and statements`.

### Task 6: Taken tab with in-page POS-style source cart

**Files:**
- Create: `src/components/vendor/VendorTakenPanel.tsx`, `src/components/vendor/VendorTakenEditor.tsx`, `tests/vendorManualTaken.test.ts`, `scripts/vendor-taken-browser.cjs`
- Modify: `src/vendor/vendorTypes.ts`, `src/vendor/vendorModel.ts`, `tests/vendorModel.test.ts` only to add one atomic multi-line manual `record-sourcing-memo` command
- Reuse: `src/components/transactions/CompoundQuantityInput.tsx` and shared product search/cart rows

**Interfaces:**
- Command addition: `{type:'record-sourcing-memo';operationId:string;vendorPartyId:string;memoId:string;date:string;reference?:string;sources:VendorSourceInput[]}`, one atomic transition with each source linking the same memo.
- `VendorTakenEditor({partyId,onSaved,onCancel})` uses selected Party from the module; each row supports compound quantities, optional `unitCostBasePaisa:null`.

- [ ] **Step 1: Write failing reducer tests.** Two manual product lines source atomically; duplicate product rows reserve/aggregate correctly; invalid second line rolls back the whole memo; no price creates unpriced quantity only; exact replay is a no-op; changing payload under same operation ID rejects.
- [ ] **Step 2: Observe RED** with `node --experimental-strip-types --test tests/vendorManualTaken.test.ts`.
- [ ] **Step 3: Add minimal command and full-width editor.** Reuse product picker/quantity/unit behavior and keyboard path; source reference/optional price, "Save Taken Products" confirmation; source rows show Set Price, Clear Due, Return Products under contextual More. POS-created sourcing and its sale link remain intact.
- [ ] **Step 4: Browser test and GREEN.** Record two products and choose no price on one, confirm Price not set; change Vendor with draft and cancel the leave; visit POS-linked sale and see exactly one source. Run `npm run test:vendor-pos` and new taken browser test. Commit `feat(vendor): support inline Taken goods and source list`.

### Task 7: Given tab with reusable POS-style cart

**Files:**
- Create: `src/components/vendor/VendorGivenPanel.tsx`, `src/components/vendor/VendorGivenEditor.tsx`, `scripts/vendor-given-browser.cjs`
- Modify/retire only when no consumers: `src/components/parties/VendorIssueGoodsDialog.tsx`
- Reuse: `src/vendor/vendorModel.ts` existing `issue-goods-memo`, `CompoundQuantityInput` and product picker

**Interfaces:**
- `VendorGivenEditor({partyId,onSaved,onCancel})` maps visible compound-quantity rows to `VendorSourceInput[]` for **one** `issue-goods-memo` call.
- Reuse existing Vendor reducer, **not** POS Sale posting or Purchase posting.

- [ ] **Step 1: Write failing tests.** Browser opens a **full-width inline editor**, adds two products by keyboard/touch, enters Box+Pcs and Gauge+Gira quantities, selects price unit, saves and sees exactly one memo. Negative owned stock and duplicate lines that together exceed available stock are rejected.
- [ ] **Step 2: Observe RED** via `node scripts/vendor-given-browser.cjs` and existing `node --experimental-strip-types --test tests/vendorIssueMemo.test.ts`.
- [ ] **Step 3: Implement inline cart.** One product search at top, one-row keyboard loop (Add Product → Quantity → next Add Product), touch Add, quantity display, price unit conversion and agreed receivable; "Save Given Products". Keep history visible when editor closes. Preserve draft across tabs, guard against Vendor switch.
- [ ] **Step 4: Verify GREEN and commit.** Run new browser test, `npm run test:compound-units`, existing Vendor issue memo and stock tests. Commit `feat(vendor): reuse inline cart for Given products`.

### Task 8: Ordinary Purchases reuse without another purchase subsystem

**Files:**
- Create: `src/components/vendor/VendorPurchasesPanel.tsx`, `scripts/vendor-purchases-browser.cjs`
- Modify: `src/pages/PurchaseEditor.tsx` only for supplier lock/swap validation and embedded clean-up; `src/data/erpDemoStore.ts` only where proper canonical state needs update
- Retire after references removed: `src/components/parties/VendorPurchaseDialog.tsx`

**Interfaces:**
- `VendorPurchasesPanel({partyId,onSaved})` renders existing `PurchaseEditor` **in-page** with `embedded`, `initialSupplierId=partyId` and `onCompleted`; must not fork `PurchaseCart` or `PurchasePaymentPanel`.
- On completion, ordinary Purchase is created **once** and Vendor owned-inventory demo projection is applied **once** with `record-purchase-inventory` using the same Purchase ID.

- [ ] **Step 1: Write failing browser and unit tests.** New Purchase from Vendor defaults to exact Party ID; two-column cart/payment fits without nested modal or horizontal page scroll; combined quantity, discount and split payment persist; same purchase ID cannot increase owned stock twice. One Supplier/Vendor person is one identity; ordinary Purchase due never becomes Taken due.
- [ ] **Step 2: Observe RED** with new browser script plus `tests/vendorPurchaseContext.test.ts`.
- [ ] **Step 3: Implement tab** showing ordinary Purchase list until Buy Products; replace dialog with existing embedded editor; reuse Purchase route for viewing, returning/refunding as available. Explicitly verify which current Purchase return/refund actions are real demo flows; **do not claim finished if only mock history exists**. Do not remove Purchase module's own workflows.
- [ ] **Step 4: Verify GREEN and commit.** Run `npm run test:purchases`, `npm run test:product-quick-add`, `npm run test:vendor-context`, new browser script. Commit `feat(vendor): embed existing Purchase editor without modal`.

### Task 9: One Payments tab with source-linked money and receipts

**Files:**
- Create: `src/components/vendor/VendorPaymentsPanel.tsx`, `src/vendor/vendorPaymentContext.ts`, `tests/vendorPaymentContext.test.ts`, `scripts/vendor-payments-browser.cjs`
- Use existing: `src/components/finance/FinancePaymentSplitEditor.tsx`, `src/vendor/vendorModel.ts` `settle-source`, `vendorBalances`, `sourceOutstanding`
- For ordinary Purchase dues, use existing Purchase payment mechanism; if no verified post-purchase payment command exists, create a **separate small, idempotent preview Purchase payment function** in `src/data/erpDemoStore.ts` with tests and Purchase ID linkage. Do not misuse `settle-source` for Purchase liabilities.

**Interfaces:**
- `type VendorPaymentContext={vendorPartyId:string;source:'taken'|'given'|'purchase';sourceId:string;direction:'pay'|'receive'}`.
- `parseVendorPaymentContext(search:string,partyId:string,validSourceIds:readonly string[]):VendorPaymentContext|null` rejects unknown/wrong-Vendor sources.
- `VendorPaymentsPanel({partyId,context,onSaved})` uses amount/account/split controls and routes payments to the appropriate **one** authoritative command.

- [ ] **Step 1: Write failing tests.** Prefilled Pay for Taken and Receive for Given choose opposite directions correctly; wrong Vendor/source cannot post; splits sum exactly to amount; payment amount cannot exceed due; partial payment retains remaining due; Purchase payment changes only Purchase due, not Vendor Taken payable; retry is idempotent.
- [ ] **Step 2: Observe RED** with `tests/vendorPaymentContext.test.ts` and new browser script.
- [ ] **Step 3: Implement source-linked form/list.** Header “Which bill? · কোন বিলের টাকা?” and before/after due, money given/received direction, Cash/Bank/MFS rows, date/reference, single Save; contextual Pay buttons deep-link to Payments with Vendor/source selected. Party Pay Vendor and Receive Money links use the exact same context; no independent Party money posting.
- [ ] **Step 4: Verify GREEN and commit.** Run `npm run test:vendor-evening` (legacy script name only), `npm run test:party-settlement`, new browser test and Vendor settlements unit tests. Commit `feat(vendor): centralize source-linked payments and receipts`.

### Task 10: Clear Due with money and matching products; correction audit

**Files:**
- Modify: `src/vendor/vendorModel.ts`, `src/vendor/vendorTypes.ts`, `src/vendor/vendorCorrection.ts`, `src/components/parties/VendorCorrectionDialog.tsx` only if action UI needs reuse
- Create: `src/components/vendor/VendorClearDuePanel.tsx`, `tests/vendorCombinedSettlement.test.ts`, `scripts/vendor-clear-due-browser.cjs`

**Interfaces:**
- Extend `settle-source` **only if** the current command cannot commit both matching goods quantity and money splits atomically. Define `{type:'clear-source-due';operationId:string;vendorPartyId:string;sourceId:string;date:string;paymentSplits:VendorSettlement['paymentSplits'];returnBaseQty:number;reason?:string}`; derive money from splits rather than accepting a mismatching total.
- Preserve `reverse-event` / `correct-source` and canonical audit trail. No automatic customer returned-stock adjustment without explicit ownership review.

- [ ] **Step 1: Write failing tests.** Taken 3 units, price known: pay part cash and return matching goods in ONE action; ledger money and stock effect both correct. If stock unavailable, account invalid, return exceeds outstanding or payment overpays, **neither half commits**. Unpriced source fully returned closes with no fictional price. Reversal restores original owned stock if safe and original event remains visible. Wrong Vendor and exact duplicate operation reject appropriately.
- [ ] **Step 2: Observe RED** with `node --experimental-strip-types --test tests/vendorCombinedSettlement.test.ts`.
- [ ] **Step 3: Implement minimal transaction and contextual Clear Due panel.** Reuse payment splits and matching return quantity; a single compound reducer command, not two independent dispatches. Small correction dialogs request reason/actor and point to linked settlements first.
- [ ] **Step 4: Verify GREEN and commit.** Run Vendor settlements, pricing, correction, POS return/source tests, `npm run test:vendor-correction`, new combined browser script. Commit `feat(vendor): support atomic mixed clear-due and audited corrections`.

### Task 11: Consistent wording, responsive/a11y QA and full acceptance

**Files:**
- Modify: Vendor module and shared Party view copy, `package.json`, `.github/workflows/ui-check.yml`, relevant browser scripts
- Add if required: `scripts/vendor-full-flow-browser.cjs`, `tests/vendorCopy.test.ts` (pure label dictionary), small status document `docs/vendor-preview-verification.md`

**Interfaces:**
- One reusable label map or constant (if necessary) provides the approved simple English/Bangla terms. Keep domain identifiers unchanged internally.
- Test commands become npm script targets under `test:vendor-*`; include them in UI Check Actions.

- [ ] **Step 1: Write a failing integration regression.** POS shortage → Taken unpriced → set price later → pay/return → Ledger/Payments/Party profile; Given two products → receive partial money/goods; ordinary Purchase → independent due/return/refund behavior; source-linked reversal appears in both views once. Assert routes, directions, zero vs null and related source references.
- [ ] **Step 2: Observe RED and finish missing wiring.** Run integration browser test before fixing UI; repair only proven gaps, do not add fake buttons for unsupported Purchase return or refund. All payment/stock results remain labeled **preview**.
- [ ] **Step 3: Accessibility/visual checks.** Test 320, 390, 768, 1280px; light and dark; keyboard tabs/Enter/Escape; focus restore, screen-reader labels, one scroll axis, no modal Purchase cart, no clipped CTA, no stale “evening” label, short Bangla helpers.
- [ ] **Step 4: Complete verification.** Run `npm test`, `npm run build`, `npm run check:ui-contract`, `npm run test:erp-navigation`, `npm run test:parties`, `npm run test:party-ledger`, `npm run test:purchases`, `npm run test:product-quick-add`, `npm run test:compound-units`, `npm run test:vendor-workflow`, `npm run test:vendor-pos`, `npm run test:vendor-evening`, `npm run test:vendor-context`, `npm run test:vendor-correction`, `npm run test:theme`, `npm run test:themed-filters`, all new Vendor tests, and lint. Fix failures and rerun. CI must have a real runner and nonempty executed steps on the exact SHA to count as passing.
- [ ] **Step 5: Record results and commit.** `docs/vendor-preview-verification.md` must state exact SHA, tests run, actual outcomes, intentionally unsupported preview functions and production NestJS integration boundaries. Commit `test(vendor): verify top-level workflow and Party parity`. Request owner visual review before a PR is marked ready for merge.

## Final spec-coverage check

- **Top-level sidebar, route, chooser, quick add:** Tasks 1, 4.
- **Five operational tabs, compact one-action layout:** Tasks 4–10.
- **Supplier-screenshot Party parity, quick actions, notes/files, opening balances and distinct directional ledger:** Tasks 2, 3, 5, 9.
- **POS-shared carts, manual taken memo, partial pricing and given memo:** Tasks 6, 7, 10.
- **Ordinary Purchase, payment split, return/refund separation:** Tasks 8, 9, 11.
- **Read-only projections, no false zero, no netting, no double inventory, original audit:** Tasks 2, 5, 8–11.
- **KISS copy, mobile, dark/light, keyboard, demo honesty, final CI:** Tasks 4, 11.
- **Not included:** real backend posting, authenticated tenant enforcement, consignment, unrelated module redesign. Do not merge without approval.

**Handoff:** Owner has confirmed the written design and has previously preferred **native implementation**, but this implementation plan must be reviewed before Task 1. After approval, invoke `superpowers:executing-plans` and proceed natively in a separate implementation branch.