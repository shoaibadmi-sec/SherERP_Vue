# HisabIQ Settings and SaaS Control Center — UI Design and Deferred Backend Requirements

> **KISS design precedence:** Apply the [ERP-wide KISS UI/UX contract](2026-10-25-hisabiq-erp-wide-kiss-uiux-contract.md) before this document. It supersedes older tab counts, screen fragmentation and optional confirmation steps; product capabilities, safety and backend contracts remain mandatory.

**Date:** 25 October 2026, Asia/Dhaka.  
**Status:** Planning package for review. No implementation, merge, production configuration or price publication is authorized.  
**Authority:** [Owner decisions](2026-10-25-hisabiq-approved-business-model-decisions.md), especially sections 10–12. Those sections override conflicting older commercial proposals.

## 1. Scope and delivery sequence

Deliver two independently reviewable UI workstreams in hisabiq_ui: (A) tenant Settings plus ERP-wide experience controls and recovery; (B) SaaS tenant configuration, grants, consented assistance and diagnostics. Write ByabsIQ backend requirements now; implement that backend only under a later explicit instruction.

Approved product behavior is already established. Extend the existing React application and its current design, rather than introduce a different dashboard or design system. Keep a shared typed capability model, separate customer and platform authority, and a replaceable preview adapter. Browser fixtures demonstrate UI behavior only; no local state is authentication, payment settlement, secure support access or production logging.

Approaches considered:
- Per-page flags: initially quick, but columns, deep links and paid grants diverge; reject.
- Shared capability catalog and narrow adapters in existing modules: selected planning approach, because both dashboards must explain the same effective setting.
- New admin application/general policy engine: unnecessary for current scope; defer.

These are implementation choices made for this plan, not new owner approvals. The plan does not reopen the accepted three-level product model.

## 2. Verified baseline

Source inspection: hisabiq_ui main tree 79c51fdbbc8ce47364488127a1e2c5762f6526d9; ByabsIQ main tree 17dcadfaa86ac868063408cc2be6209ca652e164. Refresh before execution and resolve path drift without changing the agreed behavior.

| Existing source | Reuse and limitation |
|---|---|
| src/settings/TenantSettingsPage.tsx, fields.ts, model.ts | Existing categories, search, review/save/discard and Simple/Advanced preference. Simple/Advanced is personal disclosure, not commercial access. |
| src/settings/TenantSettingsProvider.tsx | Existing revisioned settings; currentBusinessId is fixture t1 and personal storage is browser-local. Replace production context later. |
| src/settings/TenantSettingsHub.tsx, settingsHub.ts | Canonical shortcuts; avoid duplicate billing/security/notification screens. |
| src/navigation/erpNavigation.ts, resolveErpNavigation.ts | Registered routes/features and permission-aware navigation. Extend, do not create another navigation catalog. |
| src/saas/tenants/TenantsPage.tsx | TenantPage currently owns Overview/Members/context links/Activity; split focused panels without duplicating tenant identity. |
| src/saas/support/TicketsPage.tsx, transitions.ts | Existing request/consent/revoke UI has free-text scopes and up-to-24-hour requests; it does not create real support sessions. |
| src/saas/state.ts, types.ts, permissions.ts | Browser simulation; free-text Plan.features and textual grants cannot enforce production policy. |
| src/data/salesPreviewStore.ts, erpDemoStore.ts, partyPreviewStore.ts | Existing preview business records. Connect to these records through adapters; no second disconnected Sales dataset for recovery. |
| ByabsIQ common/database, idempotency, modules/audit, permissions, business-access | Reuse actual tenant transactions, session-derived context, role boundaries, idempotency and audit. |
| ByabsIQ modules/subscriptions and platform-admin | Existing PRO/PREMIUM, 30-day trial/read-only policy and audited manual review; permanent Free and capability grants are missing. |
| ByabsIQ products, inventory, product-configuration | Real backend services exist. POS, purchase and ledger API parity was not found in inspected main; do not claim all ERP integrations are finished. |

This planning task does not certify runtime behavior or rerun the repositories' historic tests.

## 3. Product rules and unresolved scope

| Profile | Required behavior |
|---|---|
| Basic / Free | Essential readable information; ordinary module navigation; no optional cross-module shortcuts or rich breakdowns. |
| Medium / Pro | Interconnectivity and contextual actions; selected operational columns; restrained detail. |
| Premium / Plus | All implemented eligible links, details, optional columns and controls, bounded by permissions/quotas. |
| Counter | Existing commercial benefits preserved. Planning default is Basic interface plus its explicit purchased capabilities, not automatic Medium. Owner confirmation required before public catalog/enforcement release. |

User terminology Basic/Medium/Premium maps to Free/Pro/Plus in this package. Use stable internal codes; never identify a plan by translated display name. The exact initial Medium optional columns (single payment-method label and brand) are planner-selected defaults for UI review, not a new owner decision. Do not change deployed codes/prices in the UI design phase.

Basic always retains normal sale/payment/return, invoice retrieval/reprint, essential statements/export, security and eligible recovery. Correctness and historical-data access are outside optional shortcut gating. A receipt can be opened from its canonical Sales workflow on Basic even if Party → Invoice is unavailable.

A report pass grants its specific reports, not the whole Premium interface. Preferences never create paid rights. Paid rights never override employee permissions. Optional module entitlement remains separate from how richly an available module is displayed.

Other decisions still needed before production: Counter interface inclusion, which additional nonfinancial record types have safe restore adapters, longer Premium recovery duration, diagnostic retention/export limits, and backend deployment/storage choice. UI fixtures must label these as preview proposals; none blocks writing or reviewing the UI plans. Defaults below are planner proposals where explicitly marked.

## 4. Shared capability contract

Proposed new UI files: src/experience/types.ts, catalog.ts, resolve.ts, previewAdapter.ts, ExperienceProvider.tsx. They contain no React page-specific markup except the provider.

Use:
- PlanCode = 'FREE' | 'COUNTER' | 'PRO' | 'PLUS'.
- ExperienceTier = 'BASIC' | 'CONNECTED' | 'RICH'.
- SettingScope = {kind:'tenant'} | {kind:'user'; userId:string}.
- SettingValue = boolean | string | number; every descriptor validates its actual closed value set.
- Denial = 'PLAN_REQUIRED' | 'ROLE_DENIED' | 'DEPENDENCY_OFF' | 'NOT_IMPLEMENTED' | 'ACCOUNT_RESTRICTED'.
- AccessDecision = {available:boolean; enabled:boolean; reason:Denial|null; source:'default'|'tenant'|'user'|'grant'}.
- CapabilityDescriptor = {key:string; module:string; label:string; labelBn:string; minimumTier:ExperienceTier; defaultValue:SettingValue; domain:'presentation'|'workflow'; scopes:SettingScope['kind'][]; requires:string[]; implemented:boolean; valueSchema:{kind:'boolean'}|{kind:'enum'; options:string[]}|{kind:'integer'; min:number; max:number}; sensitivePermission?:string}.
- ExperienceSnapshot = {tenantId:string; actorId:string; planCode:PlanCode; revision:number; serverNow:string; catalogVersion:number; contractVersion:1; scope:SettingScope; overrides:Record<string,SettingValue>; descriptors:CapabilityDescriptor[]; values:Record<string,SettingValue>; decisions:Record<string,AccessDecision>}.
- SettingChange = {op:'SET'; key:string; scope:SettingScope; value:SettingValue} | {op:'RESET'; key:string; scope:SettingScope}.
- SaveSettingsCommand = {operationId:string; expectedRevision:number; changes:SettingChange[]}.
- SaveResult = {ok:true; snapshot:ExperienceSnapshot} | {ok:false; code:'CONFLICT'|'FORBIDDEN'|'VALIDATION'; message:string}.
- accessFor(snapshot:ExperienceSnapshot,key:string):AccessDecision; unknown key fails closed with NOT_IMPLEMENTED.
- visibleColumns(snapshot:ExperienceSnapshot,module:string,viewport:'mobile'|'tablet'|'desktop'):string[].
- SettingsPort.load(scope?:SettingScope):Promise<ExperienceSnapshot>; SettingsPort.save(command:SaveSettingsCommand):Promise<SaveResult>.

Descriptor keys are stable and independently testable:
| Key | Minimum | Meaning |
|---|---|---|
| sales.links.customerLedger | CONNECTED | Customer in Sales opens Party ledger |
| sales.actions.receivePayment | CONNECTED | Invoice contextual payment entry |
| parties.links.invoice | CONNECTED | Ledger source opens invoice |
| products.links.stockHistory | CONNECTED | Product-to-stock movement context |
| purchases.links.supplierLedger | CONNECTED | Bill-to-supplier context |
| finance.links.sourceDocument | CONNECTED | Optional source shortcut; required correction route stays free |
| dashboard.details.breakdowns | RICH | Expanded optional metrics |
| sales.columns.paymentMethod | CONNECTED | Single method label; split-method detail remains Rich |
| products.columns.brand | CONNECTED | Optional brand column, no stock valuation |
| sales.columns.items | RICH | Items preview column |
| sales.columns.paymentBreakdown | RICH | Split-method details beyond essential paid/due |
| products.columns.stockValue | RICH | Optional stock valuation column |
| parties.ledger.items | RICH | Inline item breakdown |
| parties.ledger.directionIcons | RICH | Money In/Out/Adjust decorative cues; text/amount direction remains readable on Basic |
| parties.ledger.expandedDetails | RICH | Expanded optional ledger content |

For other optional fields/links, register literal per-module keys in catalog.ts and the inventory described below; no wildcard “all Premium” toggle and no dynamically constructed arbitrary setting names. A module's essential columns are a fixed protected baseline, not editable through this registry.

Resolution: implemented and safe business state → commercial plan/grant → employee permission → dependencies → tenant default → user preference → local form-factor layout. Commercial/role decisions are AND conditions, not overridable “priority” sources. If a parent is off, reject enabling its child; disabling a parent previews dependent unavailability without deleting child preferences. Detect unknown dependencies/cycles.

Snapshot.overrides contains only stored overrides at the selected scope; values contains resolved current values, decisions contains access/source explanations. load(scope) selects tenant defaults or an authorized user in the current business; production user selection requires tenant-owner/management permission. RESET removes the selected override and restores inheritance, not a copied application default. Support proposals and Undo carry SET/RESET plus exact scope and revision; Undo restores prior override presence/value, not only its previous effective value. Persist original preference intent separately from effective values. Downgrade hides ineligible controls but preserves intent; upgrade can restore that preference. Re-check dirty saves against current entitlement/revision. The existing Simple/Advanced mode only folds eligible controls and can never upgrade access.

### 4.1 Additional UI adapter contracts

Proposed src/recovery/types.ts:
- RecoveryRecord = {id:string; tenantId:string; recordType:'SALE_DRAFT'|'QUOTATION_DRAFT'|'TEMPLATE'|'NOTE'|'UNUSED_PRODUCT'|'UNUSED_PARTY'; recordId:string; label:string; deletedAt:string; deletedBy:string; recoverUntil:string; revision:number; state:'DELETED'|'RESTORED'; canRestore:boolean; reason:string|null}.
- RecoveryQuery = {search?:string; recordType?:RecoveryRecord['recordType']; cursor?:string; limit?:number}.
- RecoveryPage = {items:RecoveryRecord[]; nextCursor:string|null; serverNow:string}.
- RecoveryPort.list(query:RecoveryQuery):Promise<RecoveryPage>.
- RecoveryPort.restore(id:string,command:{operationId:string; expectedRevision:number}):Promise<{ok:true; record:RecoveryRecord}|{ok:false; code:'CONFLICT'|'FORBIDDEN'|'EXPIRED'|'VALIDATION'; message:string}>.

Proposed src/support-configuration/types.ts:
- ConfigurationRequest = {id:string; tenantId:string; ticketId:string; reason:string; staffId:string; staffName:string; target:SettingScope; changes:SettingChange[]; expectedSettingsRevision:number; revision:number; status:'REQUESTED'|'APPROVED'|'DECLINED'|'REVOKED'|'EXPIRED'|'APPLIED'; approvedBy:string|null; expiresAt:string|null; operationId:string|null}.
- SupportConfigurationPort.listRequests():Promise<ConfigurationRequest[]>.
- SupportConfigurationPort.respond(id:string,decision:'APPROVE'|'DECLINE'|'REVOKE',command:{operationId:string; expectedRevision:number}):Promise<ConfigurationRequest>.
- SupportConfigurationPort.undo(id:string,command:{operationId:string; expectedSettingsRevision:number}):Promise<SaveResult>.

Platform additions in src/saas/support/configurationPort.ts:
- propose(tenantId:string,input:{ticketId:string; reason:string; target:SettingScope; changes:SettingChange[]; expectedSettingsRevision:number}):Promise<ConfigurationRequest>.
- apply(tenantId:string,id:string,command:{operationId:string}):Promise<SaveResult>.
- grantReportTrial(tenantId:string,input:{ticketId:string; reason:string; operationId:string}):Promise<{grantId:string; startsAt:string; endsAt:string}>.

All UI ports reject with a normalized typed safe error on load/respond/propose failure; mutation-specific unions retain the explicit error codes above. The preview adapter injects clock and identity from one demo context; the future HTTP adapter obtains authoritative identity/time from the server. No second tenant/user selector is embedded in production UI.

## 5. Tenant Settings UI

Add /app/settings/interface and /app/settings/recycle-bin through the existing :section route and navigation catalog. Extend special-section handling in TenantSettingsPage so new routes never index missing business settings or accidentally save a business draft. Existing security, notifications, subscription and data routes remain canonical.

Interface & workflows screen:
1. Heading and one small plan label; default to My preferences, with an explicit Business defaults option for authorized owners.
2. One searchable module selector and common eligible controls first.
3. Columns, Details and Links & Actions use short section headings; only add one underline-tab row when separate views are actually needed.
4. Rare controls sit under one Advanced disclosure. Show effective source on demand, never raw keys.
5. Inline Save/Discard. Compact impact review only for other-user/business/dependency/operational changes; harmless personal display changes require no second confirmation.
6. Reset restores inheritance in the selected scope; optional inline preview uses the same column resolver.
7. Basic gets a brief extra-controls explanation, not a wall of locked toggles. Recycle Bin is grouped under Data & recovery with its direct route preserved.

Medium sees eligible connection controls and limited columns. Premium sees the full eligible catalog and can simplify it. User scope cannot edit other employees without explicit authority. No personal preference can override an owner-enforced security permission.

Recycle Bin:
- List record type, identifier, deleted time/by, recovery deadline and Restore where allowed.
- Search and module filter on all plans. Date/type enhanced filtering is a potential later Premium feature, not necessary for basic recovery.
- Details show safe summary and dependencies/conflict explanation.
- Restore preview, confirm, pending, restored, already restored, expired, conflict, denied and retry states.
- Exactly 30 × 24 hours from server deletion instant; now >= deadline means expired. UI countdown uses the supplied serverNow, stored timestamps UTC, display Asia/Dhaka.
- Draft restore returns the same draft identity; no stock/payment posting.
- Unused product/party requires dependency validation. Used master data uses Archive/reactivate separately. Posted invoice/payment/ledger entries cannot appear as ordinary restore candidates.
- No Empty Bin or automatic destructive cleanup implementation in the UI phase.

Support inside tenant ERP:
- Reuse /app/support ticket pages; add Pending configuration changes and Recent changes.
- Consent shows engineer, business, target user, exact proposed changes, reason/ticket, expiry and “Approve once / Decline”.
- Approval is single-use, valid 15 minutes; exact changed proposal requires new consent. Consent creates no owner session.
- Applied change has before/after, engineer and Undo (new audited revisioned mutation).
- No customer Diagnostics/Logs route. Customer sees a useful error with correlation code and “Contact support”, not stack traces.

## 6. SaaS dashboard UI

Extend /saas/tenants/:id using five primary tabs: ?tab=overview|settings|plan-usage|support|history. Refresh and direct links retain permitted tenant/tab/panel. Legacy configuration/features/members/support-access/diagnostics query values redirect to the corresponding new tab/panel, as defined in the KISS contract. Preserve existing billing/SMS/services/support links.

| Tab | Content |
|---|---|
| Overview | Business/account/plan summary, current issue and next action |
| Settings | Module controls, exact proposal diff and existing authorized Members/Users & Permissions panel |
| Plan & Usage | Plan inclusion, independent grants, expiry, quotas and canonical commerce links |
| Support | Tickets, consent/access state and authorized direct-linkable Diagnostics panel |
| History | Configuration, commercial and access audit summaries with details on demand |

Configuration workflow: choose business and target → choose eligible setting → preview diff → send approval request → tenant approves → assigned support applies once → exact approved tenant/user preference changes → owner sees result and Undo. Disable Apply until actual approval, re-check permission/current plan/revision/expiry on apply. Support role cannot edit contract prices, balances, security or its own authority.

Complimentary trial: Reports Plus seven days; at most once per business per 90 days and within operator's allowed budget. Reason and ticket required. Longer grants, SMS credits, refunds and financial overrides need separate authority. No payment-looking success for a complimentary grant.

Diagnostics:
- List time, severity, module/action, safe error code/summary, outcome, build and correlation ID.
- Filters: date range, severity, module, error code/correlation, ticket context; pagination; allowlisted safe details.
- Mark frontend-reported vs backend-confirmed. A lost response is not proof of failed posting.
- No default request bodies, financial values, file contents or secret-bearing stack traces.
- Minimal log view uses diagnostics.view + assigned tenant/ticket. Export uses separate diagnostics.export, redaction, purpose and audit. Customer accounts have neither.
- Loading, empty, no match, denied, expired data, redacted details, unavailable collector and failed query must look distinct.
- Seeded UI logs clearly say “Sample diagnostic events”; no real telemetry ingestion or background collection in the UI phase.

## 7. All-module experience inventory

The Settings plan must change actual consumers, not only save switches. No module is complete with a saved-only setting.

| Module / existing files | Basic baseline | Connected addition | Rich addition |
|---|---|---|---|
| Dashboard / pages/Dashboard.tsx | Essential totals and warnings | Links to canonical permitted records | Optional breakdown widgets |
| POS/Counter / pages/Pos.tsx, Finance.tsx counter mode | Working cart, accurate units/payments | Existing supported record connections | Optional history/detail panels; do not resize the cart |
| Sales/Returns / pages/Sales.tsx, components/sales | Reference/date/customer/total/paid/due/status, normal editors | Customer ledger, contextual payment, related invoice | Items/payment breakdown columns and expansions |
| Purchases / pages/Purchases.tsx, PurchaseEditor.tsx | Supplier/ref/total/paid/due, ordinary purchase/return | Supplier ledger and related record links | Optional item/payment/cost breakdowns |
| Products / pages/Products.tsx | Name/code/unit/quantity/price; required stock warnings | Stock/history links | Value/lot/optional tracking columns |
| Party ledger / components/parties/LedgerTable.tsx, LedgerTableResponsive.tsx, PartyLedgerRowActions.tsx, PartyLedgerIndicators.tsx | Date/ref/description/debit/credit/balance | Invoice/source opening and contextual actions | Inline items, icons, optional expanded details |
| Finance/Expenses/Daybook / pages/Finance.tsx, Expenses.tsx, Daybook.tsx, Accounts.tsx, Reconciliation.tsx, AuditLedger.tsx | Correct balances, standard payment/correction routes | Optional contextual source navigation | Optional allocations/detail columns |
| Reports / pages/Reports.tsx, reports/catalog.ts | Essential summaries/export | Permitted related-record navigation | Advanced reports only when separately entitled; report pass scope is preserved |
| Vendors/Warranty / pages/Vendors.tsx, Warranty.tsx | Existing entitled standard workflow | Connected source/customer/product | Optional rich panels |
| Quotations/Online sales / pages/Quotations.tsx, OnlineSales.tsx | Existing entitled standard workflow | Related customer/order context | Optional fulfillment/details |
| Bundles/installments / bundles/, installments/, data/installmentPreviewStore.ts | Existing entitled correct transaction data | Permitted source connections | Optional component/schedule analysis, never hiding required installment amounts or bundle cost permissions |

Do not create missing modules or promise all advanced modules on Basic. For every optional control, inventory exact consumer and standard Basic alternative; test both themes, languages and form factors. Where no optional richness exists, document “no change” with source evidence rather than inventing a feature.

## 8. Deferred ByabsIQ backend requirements

This is a future implementation contract, not a migration or deployment plan. Proposed paths are new unless listed as existing. Preserve AGENTS.md invariants: session-derived tenant, active membership, separate platform authority, non-bypass runtime DB role, atomic stock/financial operations, audit and idempotency. Online-only/single-shop V1 remains.

### 8.1 Service/file ownership

| Domain | Proposed future location | Reuse |
|---|---|---|
| Capabilities/contracts | packages/contracts/src/experience.ts | Existing permissions and subscription contracts |
| Settings | apps/api/src/modules/tenant-settings/{controller,service,repository,schema}.ts using repository naming conventions | DatabaseService.tenantTransaction, auth/CSRF, AuditService |
| Commercial access | apps/api/src/modules/subscriptions/experience-policy.service.ts | Current subscription policy/repository; extend without a second financial ledger |
| Recovery | apps/api/src/modules/recovery/{recovery.controller,recovery.service,recovery.repository,recovery.schema}.ts | Domain-owned draft/master commands; common idempotency |
| Support config | apps/api/src/modules/support-configuration/ | Dedicated platform permission checks and bounded customer delegation |
| Diagnostics | apps/api/src/modules/diagnostics/ | Sanitized request context, protected staff access; separate append/search store |
| Data schemas | packages/db/src/schema/tenant-settings.ts, capability-grants.ts, recovery-records.ts, support-configuration.ts | Existing subscriptions, audit, businesses, tenant policies |

“{controller,service,...}” in tenant-settings means tenant-settings.controller.ts etc. Support/diagnostic domains use the same explicit file-name pattern; do not create single giant admin.service.ts. Future migrations are generated after backend design review; no migration numbers are reserved now.

### 8.2 Entities and invariants

- Settings: business_id, scope_kind, target_user_id nullable, key, typed value, revision, updated_by/at. Unique scope/key. Employee must belong to the same business. Unknown keys/values denied. Defaults need no stored row.
- Catalog/grants: immutable published plan/SKU versions; feature keys, source/order/trial, start/end, quota and status. Existing PRO/PREMIUM migration needs explicit mapping to final codes and preserved contract snapshots. Missing subscription must not grant Premium.
- Recovery: tenant, type/id, deletion actor/time, server-derived 30-day deadline, version/status and original references. Retain dependencies and use domain-owned soft delete/restore. Do not duplicate live financial data into a generic JSON restore table. Transaction and audit are atomic. Expired diagnostic/bin views do not authorize financial purges.
- Support proposal: tenant, ticket, engineer, target scope, exact changes/hash, expected settings revision, approver, status, expires_at, apply operation ID and result. Approval deadline is 15 minutes from approval, pending proposal validity separately shown; changing payload (including reason/target/SET-or-RESET changes) invalidates consent. Reason is required, customer-visible, trimmed, 1–300 characters and must not contain internal notes or secret diagnostic payloads. One successful apply only. Wrong engineer/tenant, revoked permission, changed plan or stale revision fails.
- Diagnostics: tenant attribution, event/time, severity/code/module/action, correlation/operation, build, trusted source/outcome and allowlisted metadata. No arbitrary raw payloads. Staff view/export access is audited separately.

### 8.3 Proposed HTTP boundary

Tenant endpoints derive the business from the session; they do not accept a business_id override. Platform paths name a business explicitly but require independently verified staff scope.

| Route | Purpose / minimum input |
|---|---|
| GET /api/experience | Effective ExperienceSnapshot including serverNow and contract/catalog version |
| GET /api/tenant-settings | Authorized values/descriptors for tenant or self scope |
| PATCH /api/tenant-settings | SaveSettingsCommand; validate every key and commit all changes or none |
| GET /api/recovery | Safe scoped metadata, query/type/cursor/limit |
| POST /api/recovery/:id/restore | operationId + expectedRevision; same-record restore, not repost |
| GET /api/support-configuration/requests | Requests visible to consenting owner/delegated target |
| POST /api/support-configuration/:id/approve or /decline | operationId + expectedRevision; authenticated consent |
| POST /api/support-configuration/:id/revoke | Revokes unapplied authority; immutable history retained |
| POST /api/platform-admin/tenants/:id/configuration-proposals | Ticket, customer-safe reason, target scope, exact changes, expectedRevision |
| POST /api/platform-admin/tenants/:id/configuration-proposals/:proposalId/apply | operationId; validate live consent + every boundary atomically |
| GET /api/platform-admin/tenants/:id/experience | Scoped staff access explanation |
| POST /api/platform-admin/tenants/:id/feature-grants | Typed feature, ticket/reason, bounded duration; no settings bypass |
| GET /api/platform-admin/tenants/:id/diagnostics | Scoped list/search/correlation; bounded pagination |
| POST /api/platform-admin/tenants/:id/diagnostic-exports | Redacted export, separate permission, purpose/ticket, expiring download |

Do not add an API that retrieves raw diagnostics for tenant users. Do not encode paid “came from Sales” as a trusted query string. Canonical invoice retrieval stays available where permitted; optional workflow capabilities are evaluated by server-provided experience and domain authorization, not a secret URL.

Contract errors: UNAUTHENTICATED 401; FORBIDDEN 403 without tenant enumeration; NOT_FOUND 404; CONFLICT 409; VALIDATION 422; RECOVERY_EXPIRED 409; RATE_LIMITED 429. Reuse existing ApiError envelope; UI adapters translate it to the typed UI results. Request DTO rejects unknown authority fields. Use string decimals for money and UTC timestamps.

### 8.4 Production gates

1. Permanent Free cannot be implemented by setting all features ACTIVE; commercial expiry and tenant suspension differ.
2. Preference writes use row locking/optimistic revision, transactional audit and idempotency, including exact support retries after consent consumption.
3. Permission revocation/expiry is checked on every protected operation; browser hiding never enforces staff profit confidentiality.
4. Privacy filtering applies before API serialization, exports, print/report generation and log ingestion. List/detail projection services return optional inline rich aggregates only when the specific commercial capability and employee permission both allow them; never send all Premium aggregates and rely solely on hidden columns. This does not prohibit Basic from reading its authorized canonical invoice/ledger through the standard workflow. Client-supplied tier/origin/projection requests cannot grant capability. Medium/Basic richness presentation is distinct from an employee's confidential field rights.
5. Telemetry uses strict allowlists before durable storage; frontend attribution is untrusted and rate-limited. Session switching preserves original operation context; pre-auth errors have no guessed tenant.
6. Diagnostic retention proposal: 30 days of redacted technical events; query max 7 days/page and limit 100; exports max 1,000 events and expire after 15 minutes. These are planner defaults for later operational/privacy approval, not finalized owner terms. Security/financial audit has separate retention.
7. Logging failure must not falsely report rollback of committed financial work. Financial audit that is part of a transaction follows the existing atomic policy; best-effort diagnostics stay outside that atomic guarantee. Test lost-response vs committed outcomes.
8. No live interactive support visits in this phase; no support MFA/owner impersonation bypass.
9. Backup/restore, tenant RLS, error redaction, concurrent restore and time-bound grants must be tested against real PostgreSQL before production.
10. Do not implement purging/Empty Bin until data retention, unique-key handling for soft-deleted masters and legal requirements are separately approved.

Later backend execution must read ByabsIQ AGENTS.md/docs/development.md, use Node 24/pinned pnpm, run lint/typecheck/tests/build and documented real-service/browser/E2E gates, and write a migration/backfill/rollback rehearsal plan. Missing POS/ledger domain APIs must be built under their own approved parity work, not faked by these modules.

## 9. Visual and functional acceptance

Use Ink/Teal/Mint, Geist/Hind Siliguri, shared shadcn-style primitives and existing components. Ordinary controls 36px; explicitly marked major transaction CTAs 48px; data 13px, headings 12px, helpers/badges 11px. No monospaced numeric font. Underline tabs, no oversized pill navigation. English/Bangla/bilingual, keyboard focus, responsive cards/tables, clear labels and light/dark are required.

Preview catalog/actor selectors live only in a clearly marked demo toolbar, outside merchant settings, so users cannot mistake them for buying access. Production adapter must remove those controls. Preview state with unavailable storage warns and stays in memory; never silently resets settings or fails as “saved”.

Required end-to-end review stories:
- Basic user records a sale, finds invoice via Sales, records payment through normal workflow and restores an eligible draft.
- Medium clicks Sales customer → ledger → invoice and receives payment contextually, but sees no Premium item/payment breakdown.
- Premium controls columns/details, turns optional features off and restores defaults without losing roles or data.
- Support proposes Profit column off for one user; owner approves; apply changes exact target once; Undo creates a new revision.
- Unauthorized staff/tenant direct-links to diagnostics and gets no data; sample secret is redacted before display/export.
- Plan downgrades or role changes while settings are dirty: save is denied/reconciled safely and historical records remain accessible.

## 10. Planning acceptance and coverage

UI plans reference this contract rather than inventing independent settings, grant and recovery models. Backend requirements are later work; the UI may claim “preview applied” only when fixture records actually change. No live provider or background collector is implied.

Owner decisions 10 → sections 3–7; decision 11 → section 5/recovery backend; decision 12 → section 6/diagnostics backend; consent and grants → sections 4, 6, 8; design consistency → section 9. Counter catalog and proposed backend operational defaults remain explicit release decisions, not hidden assumptions.

## 11. Required commerce and messaging extension

The [SaaS Commerce Operations design](2026-10-25-hisabiq-saas-commerce-messaging-design.md) completes platform billing and messaging behavior that this Settings/Control Center specification references but does not fully define. Its [UI implementation plan](../plans/2026-10-25-hisabiq-saas-commerce-messaging-ui.md) is a required companion.

Use one canonical commercial order/payment/grant/credit model. Configuration panels and the existing grants UI consume that ledger; do not implement separate fulfillment or complimentary-grant stores per page. The shared experience resolver reads active source-linked grants and never manufactures paid rights from a preference.

The extension specifies authoritative quotes, manual and integrated collection, evidence review, capture versus payout, deterministic fulfillment, activation delay, calendar renewal, optional trial expiry, writable Free fallback, independently purchased passes, SMS lots/reservations, supplier configuration/procurement, encoding, unknown dispatch outcomes, refunds and exception reconciliation.

Actual gateway/SMS driver contracts, secrets, production jobs, migrations and tax/retention approval remain deferred. The later backend plan must implement both documents' requirements, not just the Settings endpoints.
