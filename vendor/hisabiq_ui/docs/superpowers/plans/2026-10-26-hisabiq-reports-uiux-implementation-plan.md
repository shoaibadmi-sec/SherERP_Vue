# HisabIQ Reports UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. This document is a plan for review; do not execute UI tasks under the documentation-only authorization.

**Goal:** Deliver the current Magic Patterns Reports experience with actual HisabIQ components, preserved source details and complete interconnected frontend demo actions.

**Architecture:** Existing pure reporting calculations and domain editors remain authoritative. A small observable demo command boundary aligns existing preview stores and owns missing plan/PO/receipt/scenario state; screens share selectors, details, output and context. No second ledger, report engine, cart, design system or backend.

**Tech Stack:** Actual repository React18/TypeScript/Vite5, React Router HashRouter, Tailwind3, existing shadcn-style wrappers, Recharts2, Framer Motion11, Node strip-types tests, Playwright/axe. Do not migrate to the remembered TanStack stack; installed source wins.

**Spec:** [2026-10-26-hisabiq-reports-final-uiux-design.md](../specs/2026-10-26-hisabiq-reports-final-uiux-design.md). Also read [component mapping](../../ui/reports-magicpatterns-github-component-mapping.md) and [QA matrix](../../ui/reports-uiux-workflow-test-matrix.md).

## Global Constraints

- Current HisabIQ · Visual component library and guide v2.2; actual shared source; Magic Patterns Reports composition.
- Geist/Hind Siliguri and proportional digits; input 13/20px400 Ink600, table 13/12/11 roles.
- 36 px ordinary controls;48 px only explicit major transaction review/completion; Party Ledger2 px underline tabs.
- Preserve34 catalog IDs,27 current preview views and seven readiness explanations; legacy links/saved views survive.
- English/Bangla/bilingual; light/dark; reduced motion; desktop/tablet/phone; no new dependency.
- Explicit demo provenance, coherent source state and source-linked correction; no production/backend/SMS/payment posting.
- No unrelated ERP redesign or UI changes in this documentation PR. Existing source guards stay until their tested replacement is delivered.

## Review Focus

- A purchase saved through an existing editor must refresh stock, movements, Party ledger and Reports without revisiting routes: Tasks 1–2/8 assert one revision and identical linked IDs.
- An intermediate chain unit and fractional base cost must survive save/correction, even though current source validation permits only base/alternate: Task 2 pins the full-chain case.
- Back, reload, corrupt state and disappeared source/opening control must preserve or safely recover context and half-filled drafts: Tasks 1/3/4/8 pin recovery.
- Retry/partial receipt/correction/cancellation must never duplicate stock or silently reopen supplier replacement commitments: Tasks 7–8 assert exact deltas and operation reuse.
- Missing costs/terms or overlapping forecast assumptions must not invent profit/overdue dates or double-count cash/incoming: Tasks 5–6/9 pin these distinctions.

## Baseline and task ownership

This branch depends on guide/library [PR #206](https://github.com/shuvodelux-commits/hisabiq_ui/pull/206), inspected at `6758e2cf0b6a68f80563918e6f8168928e0529ab`; main was `79c51fdb…`. #206 already adds canonical guide, generated JSON, visual specimens, ColumnVisibilityEditor, Button refs, input typography and generation/export scripts. Do not implement them again. Rebase onto the approved merged equivalent before executing this plan and recheck source paths/contracts.

Every task below is a reviewable slice, not a mass rewrite. Start with meaningful failing behavioral tests, implement the named boundary, run focused checks, then commit. Keep unmet gates recorded; no implementation task is complete merely because screenshots look plausible. Task 10 verifies, rather than postpones, the a11y/i18n/error responsibilities in each slice.

Dependency order: **0 →1 →2 →3 →4 →5 →6 →7 →8 →9 →10**. Tasks 5/6 both consume the same selector/evidence layer; no parallel work should invent conflicting interfaces. Use the same state/type names below unless a reviewed change updates all consumers and this plan.

### Task 0: Adopt and verify the existing guide/library dependency

**Files:** Read existing `AGENTS.md`, `docs/ui/HISABIQ-DESIGN-GUIDE.md`, `docs/ui/AI-UI-PROMPT.md`, `docs/ui/design-system.json`, `src/data/{designGuide,componentCatalog}.json`, `src/components/brand/{VisualComponentLibrary,ReportToolbarSpecimen,PartyRoleSpecimen}.tsx`, `scripts/{sync-design-guide,export-component-library}.cjs`. No duplicated guide/runtime files.

**Interfaces:** Consumes v2.2 authored guide plus existing export/generation commands. Produces a frozen reference artifact/hash and a verified component map for each UI slice.

- [ ] Compare current live artifact and GitHub guide hash to the recorded source-review; resolve a new version explicitly, not by overwriting generated JSON.
- [ ] Run `node scripts/sync-design-guide.cjs --check` and `node --experimental-strip-types --test tests/designGuide.test.ts`. Expected: exact generated files and guide tests pass. Run `npm run export:component-library` only if a new export is needed; generated output is prototype-only.
- [ ] Capture library/reference states with the QA matrix profiles before UI changes; record which raw prototype styles need adaptation.
- [ ] Confirm product-review decisions in spec §12 for any task using a proposed alternative. Preserve the stated initial defaults while awaiting optional alternatives.
- [ ] Commit only necessary evidence/doc updates; no change needed if dependency already satisfies this gate.

### Task 1: Define coherent demo records, scope, persistence and command boundary

**Files:** Create `src/reports/demo/types.ts`, `src/reports/demo/store.ts`, `src/reports/demo/fixtures.ts`; modify `src/data/erpDemoStore.ts`, relevant `src/data/{salesPreviewStore,partyPreviewStore,productImportPreviewStore,expensePreviewStore,financePreviewStore}.ts`, `src/reports/useReportData.ts`; test `tests/reportsDemoStore.test.ts`. Add a domain adapter only where an existing store cannot expose required projections; no report-only copy of operational records.

**Interfaces:** Define `DemoScope={tenantId:string;actorId:string}`; `DataBasis={kind:'demo-recorded'|'demo-scenario'|'incomplete'|'unavailable';asOf:string;sourceIds:string[];assumptions:string[];coverage:number|null}`; `DemoCommandMeta={operationId:string;expectedRevision:number}`. `ReportsDemoSnapshot` exposes `schemaVersion`, `datasetVersion`, `asOf`, `revision`, `reportInput:ReportInput`, domain source records, `plans`, `orders`, `receipts`, `scenarios`, `insightStates`, `offers`, `followUps`, `requests`, `appliedOperations`. Tasks 6–9 extend the named typed entity/command unions, not arbitrary string payloads. `offers` stores the existing `ProductOffer` from `src/types/erp.ts` with source IDs/revision; move ownership out of Products page-local state. Define `ReportFollowUp={id:string;partyId:string;sourceIds:string[];note:string;dueOn:string|null;status:'draft'|'done'|'cancelled';revision:number}` and `DemoRequest={id:string;kind:'upgrade'|'support'|'supplier-contact';sourceIds:string[];note:string;status:'draft'|'cancelled';revision:number}`. These are persisted demo source collections, not delivered communications.

Define in `store.ts`:

```ts
getReportsDemoSnapshot(scope: DemoScope): ReportsDemoSnapshot
subscribeReportsDemo(scope: DemoScope, listener: () => void): () => void
dispatchReportsDemo(scope: DemoScope, command: ReportsDemoCommand): DemoCommandResult
resetReportsDemo(scope: DemoScope): void
```

`DemoCommandResult` is `{ok:true;revision:number;entityIds:string[];persisted:boolean}` or `{ok:false;code:'invalid'|'stale'|'unavailable'|'forbidden';message:string}`. Operation-result lookup precedes stale-revision rejection for an identical retry; reuse with a different payload is invalid. Tenant records cannot cross scopes. Actor preferences remain separate from shared tenant source records. Successful multi-store mutation publishes one coherent revision; persistence failure retains the accepted session result with `persisted:false`.

- [ ] Write failing `reportsDemoStore.test.ts` cases: purchase/collection causes one notification and linked projections; second actor in same demo tenant sees records; other tenant cannot; repeated operation yields same IDs; differing payload with same key rejects; corrupt/unavailable storage preserves session and reports warning; reload restores linked purchase plus PO; offer/follow-up/request survives source navigation/reload; reset clears all linked story state.
- [ ] Run `node --experimental-strip-types --test tests/reportsDemoStore.test.ts`; verify failures show missing boundary/behavior rather than harness errors.
- [ ] Implement the store adapter and deterministic fixtures A/B/C from spec §10. Route fixture source records through existing stores/selectors; keep scenario-only rows separate. Add purchase/party subscriptions consumed by `useReportData` and reconcile source persistence as one versioned demo envelope.
- [ ] Run that test and existing `tests/reportWorkspace.test.ts` plus relevant preview-store tests. Expected: no duplicate source projection and report assertions remain valid.
- [ ] Commit `feat(reports): unify observable demo source actions` after review of projection ownership.

### Task 2: Preserve full unit chains and source-safe purchase projections

**Files:** Modify `src/utils/{purchaseCart,purchaseCheckout,purchaseSource,unitChain,multiUnitTransactions}.ts`, `src/data/erpDemoStore.ts`, `src/types/erp.ts` only for needed lineage; existing `src/components/transactions/{CompoundQuantityInput,MultiUnitQuantityInput}.tsx` through semantic reuse; tests `tests/{purchaseSource,purchaseCart,reportWorkspace}.test.ts` and new `tests/reportsUnitLineage.test.ts`.

**Interfaces:** Existing `freezeUnitProfile` in `multiUnitTransactions.ts` and the saved `Purchase.cartSnapshot` remain the authority. Add `validatePurchaseUnitSnapshot(snapshot: PurchaseCartLine): void` in `purchaseSource.ts`, importing the actual `PurchaseCartLine` type from `purchaseCart.ts`; `cartSnapshot` currently stores that shape. Validation permits every unit in the frozen product profile and preserves the entered map and selected cost unit; source currency totals retain existing checkout paisa allocation. No recomputation from changed product master.

- [ ] Write failing chain test `CT→BOX→PCS→feet` with intermediate BOX cost unit; assertion: valid source saves, base qty matches frozen factors, unit change/master edit does not rewrite prior line; unknown/cyclic/nonfinite conversion rejects. Add fractional-feet unit-cost aggregate and serial whole-count cases; positive-cost/total requirements remain, and zero-cost/free actual goods are rejected with the explicit deferred-support reason.
- [ ] Run `node --experimental-strip-types --test tests/reportsUnitLineage.test.ts tests/purchaseSource.test.ts tests/purchaseCart.test.ts`; observe current intermediate-unit failure.
- [ ] Extend source validation and projection adapters. Ensure confirmed purchases create a linked stock movement as well as stock/lot/ledger evidence, and corrections use deltas, not another original receipt. Preserve existing permission/date/revision/reason checks.
- [ ] Preserve inline compound presentation from the approved cart family; add focus/stepper/wheel/keyboard regression to the existing multi-unit browser check if changed. Do not redesign POS as part of Reports.
- [ ] Run those tests plus `npm run test:compound-units`, `npm run test:multi-unit-products`, `npm run test:purchases` with configured browser prerequisites. Expected: chain editing and source round-trip work with no money/quantity drift.
- [ ] Commit `fix(purchases): validate frozen full-chain purchase units`.

### Task 3: Magic Patterns Reports shell and Basic views without catalog regression

**Files:** Modify `src/pages/Reports.tsx`, `src/reports/{types,preferences,useReportData}.ts`, `src/components/reports/{ReportOverview,ReportToolbar,ReportResults}.tsx`; create `src/components/reports/ReportsNav.tsx` and `src/components/reports/basic/{SalesReport,StockReport,DuesReport,MoneyReport}.tsx`; tests `tests/reportNavigationState.test.ts`, existing `scripts/report-workspace-browser.cjs`.

**Interfaces:** Add `ReportScreen='overview'|'sales'|'stock'|'dues'|'money'|'advisor'|'profit'|'buying'|'cashflow'|'customers'|'library'`. `reportScreenFromParams(params:URLSearchParams):ReportScreen` and `paramsForReportScreen(screen:ReportScreen, report:ReportKey, filters:ReportFilters, columns:string[]):URLSearchParams` extend `preferences.ts`. Preserve `paramsForReport`, saved views and all current catalog IDs. Nav uses `screen` and callbacks; it does not own a second filter store.

- [ ] Write failing URL tests for all 11 screens, old report links, malformed input, favorite/saved-view restoration, required label column and20-view cap. Add browser assertions that date/search/filter/compare/sort/page/columns/clear affect visible data and full results.
- [ ] Run `node --experimental-strip-types --test tests/reportNavigationState.test.ts tests/reportWorkspace.test.ts`; verify failures are the new screen behavior.
- [ ] Implement live composition with library components. Reuse/adapt ReportOverview for eight KPIs and the 250 px area plot, rather than duplicate it. Library mounts current engine; do not import Magic Patterns ReportsWorkbench. Use scoped current preferences and shared ColumnVisibilityEditor. Place translated Demo data status in Reports/linked headers, nearby illustrative ROI/forecast label and confirmed Reset under More.
- [ ] Preserve the 11-item initial rail; Overview default is the repository's recorded user choice. Do not implement grouped tabs/resume as if approved. Keep original library read-only/source-ready behavior while Task 4 adds common evidence to every new surface.
- [ ] Run `npm run test:report-workspace`, `npm run test:reports-print`, `npm run test:table-typography`, `npm run test:motion-navigation`; capture all Basic screens desktop/phone and both tablet orientations per QA. Expected: recognizable target composition and working legacy controls.
- [ ] Commit `feat(reports): adapt current Basic Reports presentation`.

### Task 4: Universal evidence, exact source opening and safe return context

**Files:** Modify `src/components/reports/{ReportDetails,ReportResults,ReportOverview}.tsx`; create `src/reports/evidence.ts`, `src/reports/returnContext.ts`; modify `src/reports/types.ts`, `src/pages/Reports.tsx`, exact source handlers in `src/pages/{Sales,Purchases,Products,Expenses,Finance,Parties}.tsx` as needed; test `tests/reportEvidence.test.ts`, new `scripts/reports-details-browser.cjs` and corresponding package command.

**Interfaces:** Define `ReportSourceRef={kind:'customer'|'supplier'|'product'|'invoice'|'purchase'|'expense'|'payment'|'finance'|'stock'|'insight';id:string;tenantId:string;revision?:number}`. `ReportReturnContext` stores `screen`, `report`, `filters`, `columns`, `page`, `pageSize`, `scrollTop`, `tableScrollLeft`, optional `insightId`, `chartSelection`, `detailTrail`, `focusKey`, `draftId`. `resolveReportEvidence(ref:ReportSourceRef,snapshot:ReportsDemoSnapshot):ReportRow|null`; `validateReportReturnTo(value:string):string|null` permits internal known app paths only. Preserve existing ReportDetails props, add optional evidence/context capability rather than fork the dialog.

- [ ] Write failing exact-source resolver tests: matching tenant and kind, missing/deleted/reversed/refused source, nested contributors, no read mutation, unsafe return URL rejection. Add browser DET cases for every Basic/Premium surface as it lands, current-child print, focus fallback, preserved filter/page/chart/scroll and dirty draft.
- [ ] Run `node --experimental-strip-types --test tests/reportEvidence.test.ts`; run the new browser file before implementation to prove missing wiring.
- [ ] Implement evidence adapters and source-ID opening/return contract in canonical destinations. Existing `?q=` remains search, never substitute for an exact source opener. Keep one active domain workspace, current Dialog focus/scroll ownership, tooltip-first Escape and nested child Back.
- [ ] Extend CSV/print via existing `src/utils/reportOutput.ts`; context-specific basis and current child must print; unavailable/denied sources have readable explanation and return action.
- [ ] Run new detail browser check, `npm run test:report-workspace`, `npm run test:reports-print`, `npm run test:reports-a11y-matrix`. Expected: DET cases pass without changing any record on read.
- [ ] Commit `feat(reports): preserve evidence across analytical and source views`.

### Task 5: Premium insights, Advisor lifecycle and transparent scenarios

**Files:** Create `src/reports/{insights,scenarios}.ts`, `src/components/reports/premium/{AdvisorReport,ProfitReport,BuyingReport,CashflowReport,CustomersReport}.tsx`; extend demo types/store; modify Reports shell and report copy/guidance; tests `tests/{reportInsights,reportScenarios}.test.ts`, new `scripts/reports-insights-browser.cjs`.

**Interfaces:** `deriveReportInsights(snapshot:ReportsDemoSnapshot,filters:ReportFilters):ReportInsight[]`; each insight has stable `id`, `sourceVersion`, four narrative fields, `basis:DataBasis`, `sourceRefs:ReportSourceRef[]`, `action` and lifecycle. `runCashScenario(snapshot:ReportsDemoSnapshot,input:CashScenarioInput):CashScenarioResult` initially models30 days; inputs include buffer, payment delay and purchase assumptions. Typed commands `save-scenario`, `set-insight-state` use Task 1 meta; manual resolution requires reason, source resolution records event reference.

- [ ] Write failing tests for known-vs-unknown cost, sale-time cost, invoice age vs contractual overdue, no internal-transfer operating cash, overlapping benefit suppression, scoped snooze/dismiss/restore, material evidence change, scenario save without ledger mutation and actual payment replacing the projected item once.
- [ ] Run `node --experimental-strip-types --test tests/reportInsights.test.ts tests/reportScenarios.test.ts`; verify the modeled behavior fails before code.
- [ ] Implement current five Premium compositions, Ink/Mint Advisor focal card, scatter 230 px, composed forecast 260 px and customer table. Use shared evidence for cards/chart points; accessible equivalent table, no nested buttons. Buying action opens Task 6 planner, with honest availability until delivered.
- [ ] Use existing business copy/i18n and tokens; replace global Advisor storage key. Actual model state, not a toast, drives resolved/action-started. Keep all Basic/Premium destinations; no final commercial enforcement or7/90-day horizon until separately reviewed.
- [ ] Run pure tests and new browser scenarios across three languages/two themes/reduced motion; verify chart/table totals and source selection. Run existing report checks affected by shell changes.
- [ ] Commit `feat(reports): add source-linked Premium demo insights`.

### Task 6: Editable buying planner and saved multi-supplier plans

**Files:** Create `src/reports/planning.ts`, `src/components/reports/planning/{PurchasePlanner,SavedPurchasePlans}.tsx`; extend demo types/store, existing `reorder` adapter in `src/reports/model.ts`; tests `tests/reportsPurchasePlanning.test.ts`, new `scripts/reports-buying-browser.cjs`.

**Interfaces:** Define `PurchasePlan`/`PurchasePlanLine` with stable IDs/revision, source refs, frozen unit profile/entered map, selected supplier/pack, expected cost, selected/override flags and converted allocations. `calculatePurchaseSuggestion(input:PurchaseSuggestionInput):PurchaseSuggestion` implements spec §8 with separate `safetyMode`, `safetyDays`, `safetyBaseUnits`. `splitPlanBySupplier(plan:PurchasePlan):SupplierPlanGroup[]` never discards unassigned lines. Commands `save-plan`, `archive-plan`, `convert-plan` use expected source revision and stable operation IDs. `convert-plan` result contract is reused by Task 7.

- [ ] Write failing tests: FixtureB target 220/suggest 100, current base-unit safety compatibility, eligible/late incoming, supplier pack rounding, negative stock/zero demand, missing/zero cost distinction with positive-cost confirmation restriction, full chain BOX prices, manual override preservation, soft-budget warning, explicit accepted budget allocation, two suppliers plus missing supplier, mixed incompatible units never summed, supplier comparison choice prefilling supplier/unit/cost/source IDs, revising partially converted plan without duplicate allocation.
- [ ] Run `node --experimental-strip-types --test tests/reportsPurchasePlanning.test.ts`; expect formula and state tests to fail before code.
- [ ] Compose planner from shared transaction/cart inputs, SearchSelect/Quick Add and Products table roles. No report-specific product picker. Wire save/reopen/rename/duplicate/revise/archive, selected totals, per-line reset and explicit recalculate preview. Keep advanced assumptions collapsed and manual data on error.
- [ ] Connect Advisor/Smart buying/Stock/library entry with exact source and return state; save then show supplier grouping preview. Until Task 7 exists, conversion is explicitly unavailable, never a fake success.
- [ ] Run pure tests and new buying browser script including inline compound editor/focus/keyboard on tablet/phone; `npm run test:report-workspace` verifies old planner adaptation.
- [ ] Commit `feat(reports): save editable source-linked purchase plans`.

### Task 7: Purchase Orders inside Purchases

**Files:** Create `src/purchases/{orderTypes,orders}.ts`, `src/components/purchases/orders/{PurchaseOrders,PurchaseOrderEditor,PurchaseOrderDetails}.tsx`; modify `src/pages/Purchases.tsx`, `src/navigation/{erpNavigation,resolveErpNavigation}.ts`, report planner handoff and demo store; test `tests/purchaseOrders.test.ts`, new `scripts/purchase-orders-browser.cjs`; add focused package test command.

**Interfaces:** `PurchaseOrder` has ID/supplier/plan allocations, revision/history, draft or confirmed terms, per-line ordered/delivered/cancelled base quantities, expected date and source refs. `PurchaseOrderStatus='draft'|'ordered'|'partially-received'|'received'|'cancelled'|'closed'`. `derivePurchaseOrderPosition(order:PurchaseOrder,receipts:readonly PurchaseReceipt[]):PurchaseOrderPosition` owns status/remaining/incoming; returned goods are separately visible, no automatic replacement. Task 8 defines `PurchaseReceipt`. `convert-plan` creates stable per-supplier drafts; `save-po`, `order-po`, `revise-po`, `cancel-po`, `close-po-remainder` commands never project stock/cash/ledger.

- [ ] Write failing cases for N-supplier conversion/retry, missing-supplier exclusion confirmation, draft vs ordered incoming, partial/received/closed/cancelled status, late expected date warning, guarded supplier/unit revision after receipt, released plan allocation on pre-confirmation draft deletion, original-operation retry vs deliberate reconversion, and repeated conversion from revised plan. Assert all order-only commands leave stock/payable/cash unchanged.
- [ ] Run `node --experimental-strip-types --test tests/purchaseOrders.test.ts`; verify absent lifecycle fails.
- [ ] Implement query-owned orders tab/detail inside Purchases, exact URLs from spec §9, full-page editor using existing PurchaseCart family, no payment panel, Quick Add supplier, original/revised terms, draft history and sample PO print. Preserve purchases/return/return-history routes and sidebar selection.
- [ ] Add back-to-plan/report links and dirty-draft guard. “Ordered” and “Sent” stay separate. Close remainder requires reason; overdelivery creates an explicit reviewed PO revision, not a bypass flag.
- [ ] Run new order browser script plus `npm run test:purchases`, `npm run test:erp-navigation`, `npm run test:motion-navigation`; pure tests assert query-specific route matching and no financial side effects.
- [ ] Commit `feat(purchases): add linked demo purchase orders`.

### Task 8: PO receipts through canonical PurchaseEditor, corrections and tracking

**Files:** Create `src/purchases/receiptHandoff.ts`; extend `src/purchases/orderTypes.ts`, demo command boundary, `src/types/erp.ts`; modify `src/pages/PurchaseEditor.tsx`, `src/components/purchases/{PurchaseCart,PurchasePaymentPanel,PurchaseSourceDialog}.tsx`, `src/utils/{purchaseCheckout,purchaseSource}.ts`, `src/data/erpDemoStore.ts`; tests `tests/purchaseReceipts.test.ts`, new `scripts/reports-purchase-cycle-browser.cjs`.

**Interfaces:** Define `PurchaseReceipt` with ID/PO/revision, `draft|committed|reversed`, line allocations and actual purchase link. `PurchaseReceiptSeed={receiptId:string;poId:string;expectedPoRevision:number;supplierId:string;lines:PurchaseReceiptSeedLine[];returnContext:ReportReturnContext}` freezes source units and expected costs. `buildPurchaseReceiptSeed(snapshot:ReportsDemoSnapshot,receiptId:string):PurchaseReceiptSeed`. Extend existing PurchaseEditor props with `receiptSeed?:PurchaseReceiptSeed`; retain `initialPurchase` correction semantics. `start-receipt` saves nonposting draft; `commit-receipt` takes completed canonical Purchase plus source allocations/meta and returns stable receipt/purchase IDs; `correct-receipt`/`return-purchase` preserve audited allocation/delta semantics.

- [ ] Write failing tests for fixturesA/B (exact quantities, ৳7,400 cumulative actual/৳4,400 due/৳200 variance in A), two receipts, duplicate confirmation/retry/reload, stale parallel receipt, incomplete tracking, intermediate unit, extra-receipt revision, cancelled remainder, actual cost changes, source correction and supplier return/replacement separation; zero-cost/free confirmation stays blocked with a clear reason rather than fabricated cost.
- [ ] Run `node --experimental-strip-types --test tests/purchaseReceipts.test.ts tests/purchaseSource.test.ts tests/purchaseCheckout.test.ts` and observe missing receipt path failures.
- [ ] Implement canonical handoff with ordered/previous/now/remaining and expected/actual price context; supplier lock, actual quantities/costs/payments/lot/expiry/serial/warranty as required. One accepted demo commit projects purchase/stock/lots/movement/ledger/accounts/PO once. Review failure retains all input and publishes no partial result.
- [ ] Extend tracked-source allocation/reversal where required. Current `sourceReturnable` restriction and correction-after-payment restriction must either be satisfied through tested source-safe support or keep affected action honestly unavailable with the task/gate explicitly incomplete. Do not weaken permission/source guards to force a pass.
- [ ] Validate received/source corrections and distinct supplier returns per spec §9.3; original PO terms and receipt history survive. Return/source links reopen exact records and restore report/plan context. Preserve manual non-PO purchase entry.
- [ ] Run new full-cycle browser test, `npm run test:purchases`, `npm run test:parties`, `npm run test:report-workspace`, `npm run test:multi-unit-products`, `npm run test:reports-details` after Task 4 introduces that script. Expected: full connected UI proof, not just created rows.
- [ ] Commit `feat(purchases): receive ordered goods through canonical purchase editor`.

### Task 9: Complete collection, pricing, expense, offer and forecast action bridges

**Files:** Modify `src/reports/insights.ts`, shared evidence/context and demo adapters; reuse `src/components/parties/{PartyDetail,PartyPaymentDialog,PartyFinanceDialog}.tsx`, `src/components/finance/FinancePaymentSplitEditor.tsx`, existing Products/offer, Expenses and Finance handlers; move `src/pages/Products.tsx` page-local offer saving into the shared persisted adapter and seed from `src/data/productOffers.ts` once per demo reset. Create `scripts/reports-actions-browser.cjs`, test `tests/reportsActionProjection.test.ts`; extend corresponding package commands only.

**Interfaces:** Typed `collect-customer`, `pay-supplier`, `save-price`, `save-offer`, `correct-expense`, `save-follow-up` commands contain exact domain source IDs/revisions, existing source payloads and Task 1 meta. All outcomes carry source refs consumed by `resolveReportEvidence`; forecast `save-scenario` remains nonposting. `set-insight-state` records source outcome reference or explicit manual resolution reason.

- [ ] Write failing tests: FixtureC due 5000→3500, correct Cash/MFS allocations, role-correct supplier payment, price change affects future sale only, eligible slow-stock offer, tracked expiry restriction, expense/cash counted once, offer/follow-up/request survives leaving source page, reload and scope-safe reset, contact draft without sent status, supplier comparison→selected Planner supplier/unit/cost→PO→return context, scenario replaced by confirmed source once and no source mutation merely viewing evidence.
- [ ] Run `node --experimental-strip-types --test tests/reportsActionProjection.test.ts tests/reportInsights.test.ts`; verify missing bridges fail.
- [ ] Wire existing domain operations with exact context/Quick Add/draft preservation, coherent demo command commits and return. Remove all toast-only completion paths in touched screens, including upgrade/send previews.
- [ ] Run action browser script, `npm run test:parties`, `npm run test:party-ledger`, relevant expense/finance scripts already in package, and focused report checks. Expected: every CTA has visible created/updated state, honest disabled reason or preview.
- [ ] Commit `feat(reports): complete source-linked decision actions`.

### Task 10: Bounded visual, accessibility and regression acceptance

**Files:** Update the touched scripts/tests, `docs/ui/reports-uiux-workflow-test-matrix.md`, this plan execution record and source-review evidence. Extend current library specimens only for genuinely new shared families; regenerate guide inventory if code changes require it. No parallel primitive.

**Interfaces:** Consumes all source/command/evidence contracts and QA scenario IDs. Produces actual pass/fail/blocked evidence, capture references and review decisions; does not redefine behavior during polishing.

- [ ] Run focused unit tests from Tasks 1–9, `npx tsc --noEmit`, `npm run build`, changed-code lint, `npm run check:ui-contract`, `node scripts/sync-design-guide.cjs --check`; report baseline failures separately. Full `npm test` is meaningful at final integration; do not repeatedly run every ERP browser suite.
- [ ] Run report-workspace/guidance/print/a11y, control/table/motion, purchases/parties/navigation and new details/buying/orders/cycle/actions browser commands with their current documented browser setup. All commands added by this plan are **future**, not present on current base; verify package registration before invocation.
- [ ] Capture desktop, both tablets and both phones, three languages, both themes and reduced motion in one bounded pass. Compare target Reports composition and current library states. Fix all observed material defects in one batch; confirm at most once. Run Impeccable detector once on changed UI, report approved-font exceptions accurately.
- [ ] Obtain fresh independent architecture and Impeccable UX review of implementation and test evidence; resolve P0/P1 findings. Review guide version, source safety, no competing engine, no missing workflow, source detail regression and incomplete tracked-source restrictions.
- [ ] Present concrete UI preview and flagship chain for user acceptance. Open scoped PRs; merge remains a separate user decision. Commit validation record only with actual results; never copy this documentation run's historical or future checks as UI passes.

## Execution record

**26 October 2026:** Plan written and independently reviewed as documentation. Tasks 0–10 above remain unexecuted UI work. The [consolidation review](../../ui/reports/2026-10-26-consolidation-review.md) records only checks actually run for this documentation PR. Existing24 October and #206 verification reports are dated evidence, not fresh test runs.
