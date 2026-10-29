# HisabIQ SaaS Tenant Control Center Implementation Plan

> **KISS design precedence:** Apply the [ERP-wide KISS UI/UX contract](../specs/2026-10-25-hisabiq-erp-wide-kiss-uiux-contract.md) before this document. It supersedes older tab counts, screen fragmentation and optional confirmation steps; product capabilities, safety and backend contracts remain mandatory.

> **Required companion:** This Control Center plan covers configuration/support/diagnostics. The full SaaS UI also requires the [Commerce and messaging plan](2026-10-25-hisabiq-saas-commerce-messaging-ui.md) and [operations design](../specs/2026-10-25-hisabiq-saas-commerce-messaging-design.md), including payment collection/review, fulfillment, trial/Free downgrade, SMS providers, refunds and reconciliation. Complete both workstreams before claiming SaaS completion.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing SaaS tenant workspace to configure eligible settings with consent, inspect feature grants and diagnose tenant errors using scoped sample logs.

**Architecture:** Existing SaaS shell, identity fixtures, tickets and state transitions remain the host. Shared experience/settings/support ports are consumed from the tenant Settings plan; one preview repository connects both surfaces. Diagnostic sample data is separately scoped and never exposed to tenant routes.

**Tech Stack:** Existing React/TypeScript/Vite/React Router, shared components, node:test and Playwright. No new dashboard framework or live telemetry dependency.

**Spec:** [Shared UI design and deferred backend requirements](../specs/2026-10-25-hisabiq-settings-saas-ui-backend-design.md); [tenant UI plan](2026-10-25-hisabiq-settings-erp-experience-ui.md); [owner decisions](../specs/2026-10-25-hisabiq-approved-business-model-decisions.md), sections 10–12.

## Global Constraints

- Ordinary controls 36px; explicitly marked major transaction CTAs 48px; data 13px, headings 12px, helpers/badges 11px.
- Ink/Teal/Mint, Geist/Hind Siliguri, proportional numbers; Party Ledger-style underline tabs.
- No unrestricted impersonation, customer credentials or financial/security mutations through a settings command.
- Plan, preference, employee permission, complimentary grants and support delegation remain separate authorities.
- Diagnostics are SaaS-only, tenant/ticket scoped, safe/redacted and access-audited.
- Shared preview state demonstrates behavior; it does not enforce production authorization or collect live telemetry.
- No backend implementation, provider activation, public pricing, real log export or deployment.
- Read root AGENTS.md and UI contracts before execution. Preserve existing lifecycle, billing, Members and ticket functionality.

## Review Focus

1. A platform employee with multiple assignments must not widen one tenant's diagnostics/configuration scope through another role (Tasks 1, 5).
2. A consumed approval retried after timeout must return its prior result, while a changed command/engineer must be denied (Task 2).
3. A setting proposal invalidated by concurrent edit or downgrade must remain unapplied and require fresh review (Tasks 2, 4).
4. Correlation search, detail, export and permission revocation must not disclose foreign-tenant events or secrets (Tasks 5–6).
5. Tenant switching/deep links must preserve intended tab but discard unapproved target context; no pending mutation moves to another tenant (Tasks 1–2, 7).

---

## File structure and dependencies

Consume src/experience/types.ts and resolve.ts from tenant plan Task 1, plus src/support-configuration/types.ts from tenant plan Task 8. These tasks define contracts before this workstream changes them.

Create:
- src/saas/tenants/TenantWorkspace.tsx and panels/TenantConfigurationPanel.tsx, TenantFeaturesPanel.tsx, TenantSupportAccessPanel.tsx, TenantDiagnosticsPanel.tsx, TenantHistoryPanel.tsx.
- src/saas/support/configurationPort.ts, configurationTransitions.ts.
- src/saas/diagnostics/{types,redact,selectors,previewAdapter}.ts.
- tests/saasTenantConfiguration.test.ts, saasFeatureGrants.test.ts, saasDiagnostics.test.ts.
- scripts/saas-control-center-browser.cjs.

Modify src/saas/tenants/TenantsPage.tsx (list retained; TenantPage delegates focused workspace), support/TicketsPage.tsx, permissions.ts, state.ts, types.ts, validateState.ts, seed.ts, components.tsx only if needed to reuse underline tabs; App.tsx preserves canonical route. No global SaaS redesign.

Use query tab at /saas/tenants/:id?tab=settings etc.; preserve legacy tab aliases through the KISS contract mapping. Existing billing/SMS/services links retain ?tenant=id filtering. Do not add diagnostics to customer nav or rely on tab visibility for authorization.

## Task 1: Tenant workspace and scoped navigation

**Files:** TenantWorkspace.tsx, existing TenantsPage.tsx, permissions.ts, components.tsx; tests/saasTenantConfiguration.test.ts.
**Interfaces:** Workspace consumes existing SaasState actor/tenant assignment model. Add literal permissions configuration.view/propose/apply, features.view/grant, diagnostics.view/export and supportAccess.view; permission scope remains per-assignment, not a flattened union across tenants.

- [ ] Write failing tests `allowedTenantTabsOnly`, `directDiagnosticTabDenied`, `combinedRoleDoesNotWidenTenant`, `unknownTabFallsBackToOverview, legacyTabsReachPreservedPanels, diagnosticsInsideSupportStillPermissionChecked`, `billingLinksKeepSelectedTenant`.
- [ ] Run `node --experimental-strip-types --test tests/saasTenantConfiguration.test.ts`; confirm new cases fail.
- [ ] Extract focused workspace, add Overview/Settings/Plan & Usage/Support/History underline tabs. Preserve Members inside Settings; support access and authorized Diagnostics are panels under Support, not extra primary tabs. Preserve existing subscription/billing/SMS/services/support links and lifecycle actions with their existing permission checks.
- [ ] Use route query for tab; show the same generic “Tenant not found or outside your access” for absent/out-of-scope tenants. On tenant change, clear local proposed changes and re-fetch the selected context.
- [ ] Run targeted tests and `npm run test:saas`; expect PASS. Commit `feat: add scoped SaaS tenant control workspace`.

## Task 2: Consented configuration with exact target

**Files:** panels/TenantConfigurationPanel.tsx, TenantSupportAccessPanel.tsx; support/configurationPort.ts, configurationTransitions.ts; existing support/TicketsPage.tsx; tests/saasTenantConfiguration.test.ts and tenant supportConfiguration.test.ts.
**Interfaces:** propose/apply and ConfigurationRequest exactly match spec section 4.1. Use shared SettingsPort and support repository from tenant plan, never local duplicated approved flags.

- [ ] Add failing cases `proposalDoesNotMutatePreferences`, `applyBeforeApprovalDenied`, `singleUserScopePreserved`, `changedPayloadNeedsNewConsent`, `sameOperationReplayReturnsResult`, `differentOperationAfterAppliedDenied`, `expiredRevokedOrDifferentStaffDenied`, `concurrentRevisionConflict`.
- [ ] Run `node --experimental-strip-types --test tests/saasTenantConfiguration.test.ts tests/supportConfiguration.test.ts`; expect failures.
- [ ] Implement setting/module search, scope picker, eligible allowlisted settings, current/source display and proposed diff. Require ticket and safe reason; only values passing descriptor schema accepted. SET vs RESET remains explicit in diff.
- [ ] Propose → tenant approve/decline → assigned engineer apply once. Consent TTL 15 minutes from approval, tested with injected clock. State transitions and shared preference change occur together; failure leaves both unchanged.
- [ ] Block protected financial/security/role changes, arbitrary keys and paid capability bypass. Apply checks current plan, permission and revision. Undo is a new authorized mutation that restores previous scoped override, and conflicts if intervening changes exist.
- [ ] Run targeted tests; browser switches demo actors to complete same-business consent/apply/Undo and confirms only approved target changes. Commit `feat: add consented tenant configuration preview`.

## Task 3: Feature/grant explanation and bounded trial

**Files:** panels/TenantFeaturesPanel.tsx, support/configurationTransitions.ts or separate featureGrantTransitions.ts if responsibility needs separation; types.ts/seed.ts/validateState.ts; tests/saasFeatureGrants.test.ts.
**Interfaces:** grantReportTrial from section 4.1 returns explicit start/end. Effective feature display consumes ExperienceSnapshot plus separate typed grants; it does not parse Plan.features marketing text.

- [ ] Write failing tests `includedVersusPurchasedVersusComplimentarySources`, `sevenDayTrialEndsExactly`, `oneTrialPerNinetyDays`, `supportCannotGrantSMSOrRefund`, `reportTrialDoesNotUnlockRichLedger`, `subscriptionExpiryKeepsIndependentPass`.
- [ ] Run `node --experimental-strip-types --test tests/saasFeatureGrants.test.ts`; expect failures.
- [ ] Show plan inclusion, grants, expiry, quota, prerequisites and disabled-by-customer state distinctly. Complimentary action requires features.grant + ticket/reason; use seven days and once/90-day rule. No duration picker granting arbitrary access.
- [ ] Preview fixture budget: default three trial grants/operator/day, explicitly labeled planner test limit, not an owner-approved commercial policy. Backend final budget awaits operational review. Budget overflow shows escalation, never silent success.
- [ ] Run tests including clock boundaries and duplicate operation IDs; commit `feat: explain tenant features and controlled trials`.

## Task 4: Shared state migration and history

**Files:** state.ts, types.ts, validateState.ts, seed.ts, panels/TenantHistoryPanel.tsx; tests/saasTenantConfiguration.test.ts and existing saasState.test.ts.
**Interfaces:** Versioned preview records reference actual tenant/ticket/staff IDs. Settings, commercial grant and diagnostic-access events use distinct action categories. Existing audit viewer consumes events through its selectors.

- [ ] Add failing tests `legacySaasStatePreserved`, `newFieldsDefaultSafely`, `historyDoesNotExposeInternalNotes`, `roleRevokedAfterConsentDenied`, `storageFailureWarnsNoFalseDurability`.
- [ ] Run targeted test files; expect intended failures.
- [ ] Migrate browser demo state without deleting existing billing/SMS/service/ticket records. Reject malformed grants safely; stale textual legacy support requests are read-only legacy requests, not active authority under the new exact-action contract.
- [ ] Add history rows for proposal/consent/apply/Undo and grants with actual actor, target and safe diff. Do not imply in-browser history is tamper-proof backend audit. Customer Recent changes excludes private staff notes/diagnostics.
- [ ] Run targeted tests and existing SaaS tests; commit `feat: preserve SaaS previews with scoped configuration history`.

## Task 5: Sanitized diagnostic model and selectors

**Files:** src/saas/diagnostics/types.ts, redact.ts, selectors.ts, previewAdapter.ts; tests/saasDiagnostics.test.ts.
**Interfaces:** DiagnosticEvent = {id:string; tenantId:string|null; occurredAt:string; severity:'INFO'|'WARN'|'ERROR'; module:string; action:string; code:string; summary:string; outcome:'REPORTED'|'COMMITTED'|'FAILED'|'UNKNOWN'; correlationId:string; build:string; source:'FRONTEND'|'BACKEND'; metadata:Record<string,string|number|boolean>}.
DiagnosticsQuery = {from:string; to:string; module?:string; severity?:DiagnosticEvent['severity']; code?:string; correlationId?:string; cursor?:string; limit:number}.
DiagnosticsPort.list(tenantId:string,query:DiagnosticsQuery):Promise<{items:DiagnosticEvent[];nextCursor:string|null}>;
DiagnosticsPort.detail(tenantId:string,eventId:string):Promise<DiagnosticEvent>;
DiagnosticsPort.exportPreview(tenantId:string,query:DiagnosticsQuery,purpose:string):Promise<{rows:DiagnosticEvent[];expiresAt:string}>.
Export redactDiagnosticEvent(raw:unknown):DiagnosticEvent|null and selectTenantDiagnostics(events,tenantId,query,authorization) from focused modules. Authorization is injected preview context; future server authority never trusts this from a client.

- [ ] Write failing tests `passwordOtpPinCookieTokenHeadersDropped`, `rawBodyAndStorageDropped`, `unrecognizedMetadataDropped`, `foreignTenantCorrelationNoResult`, `tenantActorDenied`, `forgedClientTenantNotAuthoritative`, `committedOutcomeNotFailedOnLostResponse`.
- [ ] Run `node --experimental-strip-types --test tests/saasDiagnostics.test.ts`; expect failures.
- [ ] Implement an allowlist: metadata keys requestDurationMs, attempt, screen, statusCode only, with finite bounded values. summary is generated from a safe code catalog, never copied from raw exceptions. No raw stack, business amount, name/phone or payload. Unknown raw event shape is rejected.
- [ ] Seed sanitized fixtures after redaction, tenant-scoped selectors, bounded pagination and permission denial. No actual console interception, network collector, full request logging or API calls in this UI task.
- [ ] Test backend/frontend attribution explicitly with t1/t2 fixtures; pre-auth tenantId=null never appears in tenant views. Commit `feat: add safe tenant diagnostic preview model`.

## Task 6: Diagnostics panel, ticket links and export preview

**Files:** panels/TenantDiagnosticsPanel.tsx, support/TicketsPage.tsx, panels/TenantHistoryPanel.tsx; tests/saasDiagnostics.test.ts.
**Interfaces:** Task 5 DiagnosticsPort; existing ticket context; separate diagnostics.view and diagnostics.export.

- [ ] Write failing cases `viewPermissionCannotExport`, `exportRedactedAndAudited`, `outsideScopeDetailDenied`, `queryBoundsValidated`, `collectorUnavailableNotEmptySuccess`, `revokedStaffCannotReadNextPage`.
- [ ] Run diagnostic tests; expect failures.
- [ ] Implement list/detail, date/module/severity/code/correlation filters, pagination and ticket-link workflow. Show Sample diagnostic events, frontend-reported/backend outcome labels and safe copy-correlation action. Do not show raw error strings.
- [ ] Export only already-redacted bounded preview rows after purpose/permission check; label “Export sample events”. Enforce planner preview defaults max seven-day query, 100 rows/page, 1,000 rows/export and 15-minute expiry. These values are future operational proposals, not revised owner retention promises.
- [ ] Log diagnostic view/detail/export access in protected platform fixture history, not customer thread. Tenant routes/direct URLs must have no diagnostics port access. Test loading/empty/no match/error/denied/expired sample states.
- [ ] Run tests; commit `feat: add scoped SaaS diagnostics and ticket context`.

## Task 7: Whole workspace review and backend handoff

**Files:** scripts/saas-control-center-browser.cjs, package.json; update docs/saas/README.md and docs/settings/experience-consumers.md as appropriate.
**Interfaces:** Stable ports from both plans; exact deferred HTTP contracts live in shared spec section 8.

- [ ] Write failing browser journeys: t1 support can propose a t1 user setting but not t2; tenant t1 approves its exact request; support applies once; tenant sees change/Undo; Pro gets connections but no rich ledger; trial grants only reports; staff diagnostics deny tenant/foreign staff and scrub secrets; direct links and reload preserve allowed context.
- [ ] Use desktop 1440×900, tablet 768×1024, mobile 390×844, light/dark and English/Bangla/bilingual. Keyboard tab/arrow navigation and screen-reader labels must work with the existing tab implementation.
- [ ] Implement only missing functionality exposed by journeys. Register `test:saas-control-center` following existing Playwright/Vite script conventions.
- [ ] Run `npm test`, `npm run test:saas-control-center`, `npm run test:saas`, `npm run test:settings-experience`, `npm run check:ui-contract`, `npm run test:table-typography`, `npm run build`; expect PASS or document exact pre-existing failures without suppression.
- [ ] Document screenshots/review routes and mapping preview transitions → future server commands; label sample logs/no live access. Commit `test: verify SaaS control center review journeys`.
- [ ] Hand over for owner review; do not merge, deploy, enable collectors or begin the backend phase.

## Review and deferred work

The shared spec defines the later ByabsIQ entities/routes, session/tenant authority, storage/retention proposals and production gates. Do not copy the browser authorization implementation to the backend. Backend planning must add real integration tests, migrations and operational review before rollout.

Self-review coverage: workspace section 6 → Tasks 1–4; diagnostics decisions → Tasks 5–6; all cross-surface stories → Task 7. Five Review Focus items have explicit tests. No production claim, actual diagnostic access or runtime test result is made by this document.
