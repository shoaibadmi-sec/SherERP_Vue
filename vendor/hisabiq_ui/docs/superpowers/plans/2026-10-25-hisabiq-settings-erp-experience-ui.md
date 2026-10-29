# HisabIQ Tenant Settings and ERP Experience Implementation Plan

> **KISS design precedence:** Apply the [ERP-wide KISS UI/UX contract](../specs/2026-10-25-hisabiq-erp-wide-kiss-uiux-contract.md) before this document. It supersedes older tab counts, screen fragmentation and optional confirmation steps; product capabilities, safety and backend contracts remain mandatory.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement reviewable tenant Settings, three-level ERP experiences and safe recovery UI using existing HisabIQ components and preview workflows.

**Architecture:** One typed experience catalog/resolver feeds Settings and real module consumers. Narrow replaceable ports reuse existing preview records; UI simulation is explicit and never presented as backend enforcement. SaaS consumes the same contracts in the companion plan.

**Tech Stack:** Existing React, TypeScript, Vite, React Router, shared shadcn-style primitives, node:test and existing Playwright scripts. No new state-management/UI dependency.

**Spec:** [Shared UI design and deferred backend requirements](../specs/2026-10-25-hisabiq-settings-saas-ui-backend-design.md); [owner decisions](../specs/2026-10-25-hisabiq-approved-business-model-decisions.md), sections 10–12.

## Global Constraints

- Ordinary controls 36px; explicitly marked major transaction CTAs 48px; data 13px, headings 12px, helpers/badges 11px.
- Ink/Teal/Mint, Geist/Hind Siliguri, proportional numbers; Party Ledger-style underline tabs.
- Basic = simple; Medium/Pro = connected with limited detail; Premium/Plus = connected and rich.
- Settings Simple/Advanced disclosure never grants commercial access.
- Preserve tenant/role boundaries, historical records, normal Basic workflows and five-segment sample/other commercial decisions.
- Recycle Bin recovery is available on every plan for 30 days; no posted financial restore or Empty Bin.
- No customer technical-log viewer; no backend implementation, provider integration, public pricing or deployment in this UI workstream.
- Read root AGENTS.md and its UI/cart, context-complete workflow, sizing and typography contracts before execution. Preserve AccountSecuritySettings and current POS/Purchase behavior.
- Counter preview uses Basic profile plus existing explicit benefits; production catalog confirmation remains a release gate.

## Review Focus

1. Switching business/user with dirty settings must never save into the new context (Tasks 1–2, 8).
2. A stale Premium tab/save after downgrade or role removal must not retain disallowed details/actions (Tasks 1–6).
3. Mobile cards, keyboard/More menus and printed output must not bypass column/link decisions or lose required data (Tasks 3–6).
4. Restore at the exact 30-day boundary, duplicate identifiers and retries must preserve identity without posting money/stock (Task 7).
5. Legacy persisted settings and one-shot support consent must survive/reject safely, never silently apply to all users (Tasks 1, 8–9).

---

## File map and interfaces

Create:
- src/experience/{types,catalog,resolve,previewAdapter}.ts and ExperienceProvider.tsx.
- src/settings/InterfaceSettings.tsx.
- src/recovery/{types,previewAdapter}.ts and RecycleBinPage.tsx.
- src/support-configuration/{types,previewAdapter}.ts and ConfigurationConsentPanel.tsx.
- tests/experiencePolicy.test.ts, interfaceSettings.test.ts, erpExperienceConsumers.test.ts, recoveryPreview.test.ts, supportConfiguration.test.ts.
- scripts/settings-experience-browser.cjs and scripts/erp-experience-browser.cjs.

Modify existing settings/model/fields/provider/page/hub; navigation catalog/resolver; App.tsx provider composition; actual module consumers listed in the spec. Extend src/data/salesPreviewStore.ts and erpDemoStore.ts only through their existing domain-owned command patterns for first recovery adapter.

Keep experience setting descriptors separate from operational settingsFields; no rewrite of the whole legacy settings schema. Use explicit special-section rendering for interface/recycle-bin.

Task 1 produces the types/ports in spec sections 4–4.1. Each subsequent task consumes accessFor, visibleColumns and the same ExperienceSnapshot. Do not invent a second plan resolver inside a page.

## Task 1: Shared catalog, resolver and preview adapter

**Files:** Create src/experience/types.ts, catalog.ts, resolve.ts, previewAdapter.ts, ExperienceProvider.tsx; modify src/App.tsx and existing providers only for composition; test tests/experiencePolicy.test.ts.
**Interfaces:** Produces spec ExperienceSnapshot, SettingsPort, accessFor and visibleColumns. Export createPreviewExperienceAdapter({clock,context,storage}) returning SettingsPort plus subscribe(listener):()=>void. Context is a typed fixture {tenantId,actorId,planCode,permissions}; no arbitrary client privilege assertion in production.

- [ ] Write failing tests for Basic denies sales.links.customerLedger and sales.columns.items; Pro enables the link but denies items; Plus enables both; denied profit permission wins; unknown key and dependency cycle fail closed. Assert no preference or Simple/Advanced switch can elevate plan.
- [ ] Add scope and persistence tests: t1/t2 and owner/cashier isolated; malformed legacy storage uses safe defaults with a visible warning; valid existing settings preserved; storage failure keeps memory and reports unsaved persistence. Clock injection tests expiry without sleep.
- [ ] Run `node --experimental-strip-types --test tests/experiencePolicy.test.ts`; confirm the new behavior fails before implementation.
- [ ] Implement the exact spec contracts and literal keys. Tenant default then user preference; never persist denied effective values over the user's original intent. Add only a labeled development fixture selector. Existing missing browser state must not create Premium by default.
- [ ] Run the test again, then `npm test`; expect PASS. Commit `feat: add shared ERP experience preview policy`.

Representative policy assertions:
```ts
assert.equal(accessFor(pro, 'sales.links.customerLedger').enabled, true);
assert.equal(accessFor(pro, 'sales.columns.items').available, false);
assert.equal(accessFor(basic, 'sales.columns.items').enabled, false);
```
Use real fixture objects matching section 4, not unsafe cast partials.

## Task 2: Interface Settings page and canonical navigation

**Files:** Create src/settings/InterfaceSettings.tsx; modify src/settings/{model.ts,fields.ts,TenantSettingsPage.tsx,TenantSettingsHub.tsx,settingsHub.ts}, src/navigation/erpNavigation.ts; test tests/interfaceSettings.test.ts and existing settingsHubNavigation.test.ts.
**Interfaces:** InterfaceSettings consumes SettingsPort and ExperienceSnapshot; save uses SaveSettingsCommand and SaveResult exactly. Scope controls tenant default or current-user preferences.

- [ ] Write failing tests named `interfaceRouteDoesNotIndexBusinessDraft`, `basicSearchOmitsIneligibleRichSettings`, `mediumExposesLinksNotRichColumns`, `saveConflictPreservesDraft`, `contextSwitchRequiresDiscardOrStay, harmlessPersonalDisplaySaveNeedsNoExtraConfirmation`. Assert rejected changes do not increment revision.
- [ ] Run `node --experimental-strip-types --test tests/interfaceSettings.test.ts tests/settingsHubNavigation.test.ts`; expect intended failures.
- [ ] Add interface/recycle-bin routes as special sections, one searchable module selector and Columns/Details/Links & Actions section headings, search, scope, plan summary, shared controls, effective-source helper, inline save/discard/reset; review only meaningful cross-user/dependency/operational impact. Route filtering must not use only the old 'export' permission for Bin access. Do not relabel Account Security controls as paid.
- [ ] Implement invalid value/dependency/conflict/permission/loading states. Save does not optimistically claim persistence. Reset affects only eligible presentation preferences in selected scope and requires review.
- [ ] Run targeted tests and `npm run test:settings-hub`, `npm run test:settings`; expect PASS. Commit `feat: add plan-aware interface settings`.

## Task 3: Sales and Party Ledger consume the policy

**Files:** Modify src/pages/Sales.tsx; src/components/sales/SalesMobileLayout.tsx and SalesWideToolbar.tsx as needed; src/components/parties/{LedgerTable.tsx,LedgerTableResponsive.tsx,PartyLedgerRowActions.tsx,PartyLedgerIndicators.tsx,PartyDetailAdaptive.tsx}; test tests/erpExperienceConsumers.test.ts; browser scripts existing party/sales helpers.
**Interfaces:** accessFor controls link/action eligibility; visibleColumns controls optional data; existing onAction/payment/return handlers remain the transaction authority.

- [ ] Write failing assertions `basicCustomerIsPlainText`, `mediumCustomerOpensLedger`, `mediumCannotExpandInlineItems`, `premiumItemsFollowPreference`, `basicCannotReceiveFromRowMenuButCanPayNormally`, `roleDeniedCostAbsentInResponsiveDetail`.
- [ ] Run `node --experimental-strip-types --test tests/erpExperienceConsumers.test.ts`; expect failures for these cases.
- [ ] Wire the same decisions to desktop table, tablet columns, mobile cards, keyboard activation, More menus and selected-row actions. Remove optional Money In/Out icons on Basic while keeping debit/credit direction as text/amount. Essential date/ref/description/debit/credit/balance remain.
- [ ] Preserve canonical direct invoice/customer routes for authorized standard workflows. Suppress paid shortcut affordances, not all access to a customer's historical invoice. No source-origin query parameter is authorization.
- [ ] Verify Basic sale → normal payment; Pro Sales customer → ledger → invoice/payment; Plus rich rows; plan change mid-open panel removes ineligible optional details without deleting data. Run focused browser journeys `npm run test:party-ledger`, `npm run test:sales-audit`, plus the new experience script when ready.
- [ ] Commit `feat: apply ERP experience levels to sales and ledger`.

## Task 4: Products, Purchases, POS and Counter consumers

**Files:** Modify src/pages/{Products.tsx,Purchases.tsx,PurchaseEditor.tsx,Pos.tsx,Finance.tsx}; relevant existing products/purchases/pos components; tests/erpExperienceConsumers.test.ts.
**Interfaces:** Reuse Task 1 resolver and existing POS product/cart/payment components; no forked picker/cart.

- [ ] Add failing tests `basicProductKeepsQuantityPriceWarning`, `proStockHistoryIsLinked`, `stockValueRequiresRichAndPermission`, `proPurchaseSupplierOpensLedger`, `basicCompoundSaleAndSplitPaymentStillWork`.
- [ ] Run the targeted unit tests and confirm intended failures.
- [ ] Gate optional stock-value/lot detail and supplier/product links; retain required unit conversion, serial/expiry validation and posting warnings. Preserve selected cart, payment and source-document context when preferences change.
- [ ] Inventory exact optional controls in these files. Add literal keys with minimum tiers for real consumers only; if a page has no optional details, record that evidence in the implementation PR's consumer inventory.
- [ ] Run `npm run test:purchases`, `npm run test:multi-unit-products`, `npm run test:counter-ux`, `npm run test:pos-fast-counter` and targeted unit tests; PASS required.
- [ ] Commit `feat: apply interface policy to stock and counter workflows`.

## Task 5: Finance, Expenses, Daybook and Reports consumers

**Files:** Modify src/pages/{Finance.tsx,Expenses.tsx,Daybook.tsx,Accounts.tsx,Reconciliation.tsx,AuditLedger.tsx,Reports.tsx}, src/reports/{catalog.ts,preferences.ts}; tests/erpExperienceConsumers.test.ts.
**Interfaces:** accessFor distinguishes optional source shortcuts from essential source-safe correction. Existing report feature entitlement and permission still apply.

- [ ] Add failing tests `basicFinanceCorrectionStillAvailable`, `basicExportKeepsOwnRecords`, `proSourceLinkWithoutPremiumBreakdown`, `reportPassDoesNotUpgradeOtherModules`, `printDoesNotLeakRoleDeniedCost`.
- [ ] Run targeted tests; confirm failures.
- [ ] Hide rich allocation/detail summaries on lower profiles and wire optional source navigation to CONNECTED. Do not remove required warning, amount, audit correction or standard account payment workflow. Keep basic owner reports available.
- [ ] Ensure advanced report data requires its report grant; do not use general interface tier as its only authorization. Existing exported business records remain available regardless of optional UI columns; employee-confidential fields remain excluded.
- [ ] Run `npm run test:daybook-source-context`, `npm run test:report-workspace`, `npm run test:reports-print`, `npm run test:reconciliation-daybook-matrix`; expect PASS.
- [ ] Commit `feat: apply experience policy to finance and reports`.

## Task 6: Remaining modules and coverage inventory

**Files:** Modify src/pages/{Dashboard.tsx,Vendors.tsx,Warranty.tsx,Quotations.tsx,OnlineSales.tsx}; consumers in src/bundles/, src/installments/ where optional views are rendered; create docs/settings/experience-consumers.md; test tests/erpExperienceConsumers.test.ts.
**Interfaces:** Shared literal capability descriptors; existing module entitlements stay separate.

- [ ] Add failing cases `basicDashboardHasEssentialTotals`, `proRelatedRecordsWithoutRichWidgets`, `installmentRequiredDueNeverHidden`, `bundleReturnRulesUnchanged`, `unsupportedModuleSettingIsNotAdvertisedLive`.
- [ ] Run targeted unit tests; confirm failures.
- [ ] Wire existing optional links/panels; do not introduce new module business rules. Build a coverage table with module, exact key, desktop/tablet/mobile consumer, Basic alternative, implementation status and test case.
- [ ] Reconcile every module in spec section 7: real consumer or explicit source-backed no-change. Mark deferred optional workflows NOT_IMPLEMENTED instead of saving a fake working preference.
- [ ] Run `npm run test:quotations`, `npm run test:online-sales`, relevant existing installment/bundle scripts from package.json and `npm test`; list exact commands in the PR after refreshing current package scripts.
- [ ] Commit `feat: complete ERP interface policy coverage`.

## Task 7: Recycle Bin and first real preview recovery adapter

**Files:** Create src/recovery/types.ts, previewAdapter.ts, RecycleBinPage.tsx; modify src/settings/TenantSettingsPage.tsx, navigation catalog; extend src/data/salesPreviewStore.ts and relevant erpDemoStore draft delete/restore commands; test tests/recoveryPreview.test.ts.
**Interfaces:** Spec RecoveryPort/RecoveryRecord/RecoveryPage. Export createPreviewRecoveryAdapter({clock,context,salesStore}):RecoveryPort; do not copy live records into a separate unrelated demo list.

- [ ] Write failing tests `restoreDraftKeepsIdentity`, `restoreDoesNotPostSale`, `exactThirtyDaysIsExpired`, `doubleRestoreIsIdempotent`, `foreignTenantNotListed`, `postedSaleNeverRestoreEligible`, `duplicateIdentifierBlocksRestore`.
- [ ] Run `node --experimental-strip-types --test tests/recoveryPreview.test.ts`; expect failures.
- [ ] Integrate first eligible SALE_DRAFT delete → Bin → restore with the actual preview draft record. Add Undo using the same command. Product/party dependency/restore adapters are enabled only when domain checks are implemented; show other types as unsupported preview fixtures, not successful mutations.
- [ ] Implement list/search/type filter/deadline/preview/conflict/permission/expiry states with 30-day boundary. Archive transaction-linked masters through existing archive workflow. Provide no posted restoration or Empty Bin action.
- [ ] Run unit test; browser verifies draft disappears/reappears in Sales with same identity and unchanged posted sales/stock/payment counts; every plan can recover.
- [ ] Commit `feat: add safe draft recovery preview`.

## Task 8: Tenant configuration consent and history

**Files:** Create src/support-configuration/types.ts, previewAdapter.ts, ConfigurationConsentPanel.tsx; modify src/saas/TenantPortal.tsx, support/TicketsPage.tsx for tenant branch; tests/supportConfiguration.test.ts.
**Interfaces:** Spec SupportConfigurationPort and ConfigurationRequest; shared preview repository with the companion SaaS plan. No duplicate grants in personal localStorage.

- [ ] Add failing tests `approvalBoundToExactChangesAndTenant`, `declinedCannotApply`, `expiryAtFifteenMinutes`, `undoConflictsWithNewerRevision`, `switchingUserCannotApproveOthersRequest`.
- [ ] Run `node --experimental-strip-types --test tests/supportConfiguration.test.ts`; expect failures.
- [ ] Implement request/preview/approve once/decline/revoke and applied history/Undo UI. Show selected business, engineer and exact user scope. Display only authorized changes, no private internal notes.
- [ ] Approved state is not applied state; wait for SaaS actor's apply command. Keep financial/security mutations outside this port. Backend-unavailable state describes preview accurately.
- [ ] Run tests; companion Task 2 completes cross-surface apply/retry/Undo journey. Commit `feat: add tenant configuration consent preview`.

## Task 9: Responsive review and execution handoff

**Files:** Create scripts/settings-experience-browser.cjs, scripts/erp-experience-browser.cjs; extend package.json test scripts and docs/settings/experience-consumers.md.
**Interfaces:** Same preview ports and fixtures; browser script may use test-only setup, never production route bypasses.

- [ ] Write failing browser journeys at 390×844, 768×1024 and 1440×900, both themes, English/Bangla/bilingual: all spec review stories plus keyboard tabs/toggle labels and module form-state preservation.
- [ ] Confirm failures against unimplemented target behavior.
- [ ] Finish only changes required by these journeys. Register `test:settings-experience` and `test:erp-experience`; scripts follow existing Vite/Playwright startup conventions and document browser executable requirements.
- [ ] Run `npm test`, `npm run check:ui-contract`, `npm run build`, `npm run test:settings-experience`, `npm run test:erp-experience`, `npm run test:table-typography`, `npm run test:field-size-parity` and affected existing suites once. Record any pre-existing diagnostics; do not suppress them or claim unrun checks.
- [ ] Commit `test: verify Settings and ERP experience review matrix`. Request user review with routes and scenario inventory; do not merge/deploy.

## Backend handoff and gates

Pass shared DTOs, exact setting registry, consumer inventory, conflicts and fixture test cases to ByabsIQ. The future adapter replaces preview identity/storage with authenticated APIs from spec section 8. UI acceptance is not production security acceptance. Recovery for additional record types requires domain services; diagnostic telemetry/exports and live support never originate from this tenant preview.

**Plan self-review:** Spec sections 3–5 → Tasks 1–3, 7–8; all modules section 7 → Tasks 3–6; design/state boundaries → Task 9; future backend → shared spec. Review Focus tests are assigned. No runtime testing was performed while writing this plan.
