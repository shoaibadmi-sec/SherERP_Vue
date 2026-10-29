# HisabIQ SaaS Administration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for native implementation after plan review. Steps use checkbox syntax for tracking.

**Goal:** Build a usable HisabIQ platform administration UI with configurable staff roles and connected tenant, subscription, payment, SMS, service and support workflows.

**Architecture:** Keep the existing business application and add a separate `/saas` shell. Use one React context and reducer for versioned, local demonstration state; split transitions by domain and keep permissions in one pure function. Reuse the existing design-system exports and semantic theme tokens, with focused accessibility adapters where the bundled components lack behavior.

**Tech Stack:** Existing React, TypeScript, Vite, React Router, bundled shadcn-style design system, Lucide, Sonner, Node test runner, Playwright and axe. No new runtime library or backend is required.

**Spec:** `docs/superpowers/specs/2026-10-08-saas-administration-design.md`, including its configurable-role amendment. Domain language: `CONTEXT.md`.

## Global Constraints

- Repository: `shuvodelux-commits/hisabiq_ui`; implementation must be on a feature branch, not main/master.
- “Configurable roles are part of the first release.”
- “There are no per-user permission overrides or explicit deny rules in v1; create a small custom role for an additional responsibility.”
- “Permissions are additive, evaluated with the scope of the role assignment that grants them.”
- “No role combination permits approving a payment submission created by the same employee”.
- “English is the naming language. Bangla helper text is quieter but readable and associated with its English label.”
- “Reuse semantic theme tokens for every surface, input, badge, chart, tooltip, menu and dialog.”
- “Monetary calculations use integer minor units; display BDT and Asia/Dhaka timestamps in examples.”
- “A UI prototype sends no real messages.”
- “Existing business routes, POS compound units, theme persistence and existing tests continue to work.”
- KISS: ordinary typed records, arrays, explicit transitions and small page components. No generic workflow engine, custom permission-expression language, event-sourcing platform or cross-product abstraction.
- Frontend permissions are demonstration behavior; real authorization, settlement, messaging and support access require backend integration.

## Review Focus

1. Broad support access combined with narrow finance access must not expand the finance scope; test in Task 1.
2. Repeated or stale submissions must not duplicate money, SMS credit or entitlement effects; test in Tasks 3 and 4.
3. Switching employee/tenant while a form is open must not apply a draft to the wrong business; test in Tasks 2 and 7.
4. Blocked, malformed or quota-limited browser storage must not crash the app or pretend data was saved; test in Tasks 1 and 7.
5. Private notes, staff-only articles and evidence must stay out of tenant views and unauthorized exports; test in Tasks 5 and 6.

## File and interface map

Create `src/saas/` for this feature. Shared files: `types.ts`, `seed.ts`, `permissions.ts`, `state.ts`, `SaasProvider.tsx`, `SaasShell.tsx`, `SaasRoutes.tsx`, and `components.tsx`. Domain files live under `tenants/`, `billing/`, `messaging/`, `services/`, `support/` and `admin/`. Each domain owns its page components and transition function; no single component handles every module.

- `SaasState`: schema version; tenants, staff, roles, role assignments, plans, subscriptions, invoices, submissions, receipts, allocations, financial adjustments, SMS ledger/messages/packages, service catalog/orders, tickets/messages, articles, announcements, access grants, audit events and settings.
- `Actor`: `{ kind: 'staff' | 'tenant'; id: string; tenantId?: string }`. Identity comes from the visibly labelled demo-session selector, never an editable tenant ID inside a mutation form.
- `RoleAssignment`: `{ staffId: string; roleId: string; tenantIds: 'all' | string[] }`.
- `can(state: SaasState, actor: Actor, permission: Permission, tenantId?: string): boolean`. Global operations require global authority; absent tenant ID must not widen a scoped grant.
- `applyCommand(state: SaasState, actor: Actor, command: SaasCommand, now: string): CommandResult`. Result is `{ ok: true; state: SaasState }` or `{ ok: false; error: string }`. Validate permissions, scope, expected record version and workflow rules before changing records; failed commands return no partial changes.
- Domain commands are discriminated unions. Generate IDs outside reducers; include a command ID on mutating requests. Store completed IDs to make retries safe in the demonstration state.
- `useSaas()` returns `{ state, actor, setActor, dispatch, resetDemo, persistenceError }`; `dispatch(command)` returns success/error. Use functional state updates to avoid stale closure writes.
- `visibleTenantIds(state, actor): string[]` and domain selectors return only authorized records. UI route guards and buttons call the same permission function used by mutations.
- `SaasDialog` adapts existing visuals with labelled modal semantics, Escape, focus trap/return and unsaved-change protection. Shared `PageHeading`, `FilterBar`, `DataTable`, `EmptyState` and `ConfirmAction` cover repeated presentation only.

## Task 1: Shared state and configurable staff permissions

**Files:** Create shared types, seed, permissions, state and provider files; `src/saas/admin/TeamPage.tsx`, `RoleEditor.tsx`; `tests/saasPermissions.test.ts`, `tests/saasState.test.ts`.

**Produces:** The state, actor, command, permission and provider interfaces above; commands `staff.invite`, `staff.update`, `staff.disable`, `staff.revokeSessions`, `role.save`, `role.delete`, `assignment.save`, `assignment.remove`, `demo.reset`.

- [ ] Write failing tests: union of Support + Verifier grants both actions; support-all plus verify-tenant-A denies verification for B; removing one duplicate grant retains access; removing the final grant revokes it; disabled staff have no authority; owner assignment cannot be delegated by non-owners; last owner cannot be disabled; an assigned role cannot disappear without a confirmed reassignment/removal.
- [ ] Run `node --experimental-strip-types --test tests/saasPermissions.test.ts tests/saasState.test.ts`; expect failures because the new modules do not exist.
- [ ] Implement a single permission catalog grouped by module/action; the nine supplied roles are editable presets. Action grants add required view permission. Preserve each role assignment's tenant scope rather than flattening roles into a global permission set.
- [ ] Implement deterministic seed records for an owner, combined support/verifier, support-only employee and tenant owner. Implement schema-validated local persistence with visible recovery/reset and an in-memory fallback that clearly says changes are not persistent.
- [ ] Build Team and Roles tabs, multi-role invitation/edit forms, per-role scope picker, effective-permission inspector and change preview showing affected staff. Make invite acceptance/revocation a labelled demo transition, not a fake sent email.
- [ ] Add malformed/blocked-storage tests and tests for command rejection without partial state changes. Run both test files; expect all passing. Commit this working permission/state slice.

## Task 2: Platform shell, overview and tenants

**Files:** Create `SaasShell.tsx`, `SaasRoutes.tsx`, `components.tsx`, `OverviewPage.tsx`, `tenants/TenantsPage.tsx`, `tenants/TenantPage.tsx`, `tenants/transitions.ts`; modify `src/App.tsx`; create `tests/saasTenants.test.ts`, `scripts/saas-browser.cjs`.

**Consumes:** Task 1 provider and permission functions. **Produces:** `/saas/overview`, `/saas/tenants`, `/saas/tenants/:id`, `/saas/team`; commands `tenant.create`, `tenant.update`, `tenant.suspend`, `tenant.reactivate`, `tenant.archive`, `tenant.inviteOwner`.

- [ ] Write failing transition tests for independent tenant/subscription status, suspension reason, archive blockers, repeated owner invitation and invalid tenant IDs. Run the tenant test file; expect failures before implementation.
- [ ] Build the separate 236px sidebar and compact header with appearance picker, demo account selector and mobile drawer. Default `/saas` to My work; show only permitted navigation and guard direct routes.
- [ ] Build combined work queues and linked metric cards from state selectors. Use the existing typography and neutral/teal token system. Clearly distinguish recurring revenue, receipts and outstanding balances.
- [ ] Build searchable tenant directory with URL filters and pagination, onboarding steps and full profile tabs. Use the same profile shell as billing/support tabs are filled in later tasks; do not ship dead tab actions.
- [ ] Add browser scenarios for multi-role navigation, direct forbidden route, create tenant, suspend/reactivate, keyboard modal behavior and mobile navigation. Start Vite and Chromium in the same test process, following `theme-browser.cjs`.
- [ ] Verify identity changes close stale dialogs and reset context-specific drafts with an unsaved warning. Run tenant unit tests and available browser scenarios; expect all passing. Commit.

## Task 3: Plans, subscriptions, invoices and payment verification

**Files:** Create `billing/PlansPage.tsx`, `SubscriptionsPage.tsx`, `InvoicesPage.tsx`, `InvoicePage.tsx`, `PaymentsPage.tsx`, `PaymentReview.tsx`, `transitions.ts`, `selectors.ts`; `tests/saasBilling.test.ts`; extend routes/browser scenarios.

**Consumes:** State and scoped permissions. **Produces:** plan, subscription, invoice and payment routes; commands `plan.saveDraft`, `plan.publish`, `plan.retire`, `subscription.change`, `subscription.extendTrial`, `subscription.cancel`, `subscription.undoCancellation`, `invoice.issue`, `invoice.void`, `payment.submit`, `payment.claim`, `payment.requestInfo`, `payment.reject`, `payment.verify`, `payment.allocate`, `payment.refund`, `payment.reverse`.

- [ ] Write failing tests for self-approval, cross-tenant allocation, duplicate normalized reference per collection account/channel, invalid or nonpositive amounts, partial settlement, overpayment credit, replayed verification, stale reviewer decisions, plan snapshots and scheduled cancellation.
- [ ] Run the billing test file; expect failures. Implement integer-minor-unit receipt/allocation calculations and explicit transition guards. Verification creates one receipt; full qualifying settlement applies purchased benefits once. Persist historical plan/invoice descriptions.
- [ ] Build plan editor and publish preview, subscription change quote/effective-date form, cancellation/trial dialogs, searchable invoice directory/detail, printable invoice and partial-payment display.
- [ ] Build payment queue and side-by-side evidence review, claim/request-information/reject/verify dialogs and allocation preview. Restrict attachments to supported image/PDF evidence with a size limit and error state; never insert evidence HTML. Local evidence persistence must report quota failures rather than discarding files silently.
- [ ] Build refund/reversal adjustment flows with finance permissions, audit reason and impact preview. An adjustment links to the original receipt; it does not overwrite history. Preserve the no-self-approval rule even for owners.
- [ ] Add browser journey: submit proof → request information → resubmit → verify → inspect invoice/subscription; repeat with partial payment and duplicate reference. Run billing tests, then `npm test`; expect all passing. Commit.

## Task 4: SMS and services linked to billing

**Files:** Create `messaging/SmsPage.tsx`, `SmsPackages.tsx`, `transitions.ts`; `services/ServicesPage.tsx`, `ServiceOrderPage.tsx`, `transitions.ts`; `tests/saasOperations.test.ts`.

**Consumes:** Billing settlement effects and financial selectors. **Produces:** SMS/package/log/ledger and service routes; commands `sms.packageSave`, `sms.packageOrder`, `sms.reserve`, `sms.complete`, `sms.retry`, `sms.templateSave`, `service.catalogSave`, `service.request`, `service.quote`, `service.approve`, `service.assign`, `service.schedule`, `service.start`, `service.deliver`, `service.complete`, `service.cancel`.

- [ ] Write failing tests for package settlement replay, expired/reserved credit unavailability, failed-delivery release policy, retry duplicate consumption, forbidden state jumps and service completion independent of payment. Run operations tests; expect failures.
- [ ] Implement source-based credit ledger entries with reservation/consumption/release links and configured expiry. Show provider health as unknown when disconnected. Demo delivery is an explicit simulation action, never a real send.
- [ ] Build SMS overview, package editor/order form, tenant ledger, delivery log details and retry confirmation. Include recipient masking, configured segment estimates and cost preview; do not promise automatic failed-message refunds.
- [ ] Build service catalog/order list and detail, quote/assignment/schedule dialogs, deliverable records and tenant-visible updates. One-time service invoices and recurring add-ons use Task 3 contracts.
- [ ] Add browser package-purchase and service-delivery journeys, then run operations and billing tests; expect all passing. Commit.

## Task 5: Support and tenant-facing billing/support

**Files:** Create `support/TicketsPage.tsx`, `TicketPage.tsx`, `KnowledgePage.tsx`, `transitions.ts`, `TenantSubscriptionPage.tsx`, `TenantSupportPage.tsx`; modify `src/App.tsx` and business `Sidebar.tsx`; create `tests/saasSupport.test.ts`.

**Consumes:** Scoped state, billing/messaging/service selectors. **Produces:** platform support/articles routes and `/app/subscription`, `/app/support`; commands `ticket.create`, `ticket.assign`, `ticket.reply`, `ticket.note`, `ticket.transition`, `article.save`, `article.publish`, `access.request`, `access.consent`, `access.revoke`.

- [ ] Write failing tests that tenant selectors never include internal notes/articles, cross-tenant attachments or staff records; support-only cannot verify payment; combined support/verifier can verify eligible tenant submissions; reopened tickets preserve history; expired/revoked grants do not permit access.
- [ ] Run support tests; expect failures. Implement audience filtering before presentation/export, not only hidden UI elements. Require tenant consent for access grants, with explicit scope, reason and expiry.
- [ ] Build My/Unassigned/Team support queues, searchable tickets, conversation detail, distinct internal-note composer, public-reply audience preview, attachment errors, assignment/escalation/resolve/reopen dialogs and knowledge editor.
- [ ] Build tenant subscription/usage, SaaS invoices, proof submission, SMS package purchase, service request and support pages from the same state. The business UI's demo tenant identity is explicit; tenant members without billing permission cannot reach billing data.
- [ ] Show access grants as requests/consents in the UI; do not implement genuine account impersonation. Preserve reply drafts on validation failure and resolve stale assignment conflicts.
- [ ] Add browser staff/tenant conversation and billing round trips. Run support and permission tests; expect all passing. Commit.

## Task 6: Announcements, reports, audit and settings

**Files:** Create `admin/AnnouncementsPage.tsx`, `ReportsPage.tsx`, `AuditPage.tsx`, `SettingsPage.tsx`, `transitions.ts`; `tests/saasAdministration.test.ts`.

**Consumes:** Authorized domain selectors and immutable audit events. **Produces:** remaining platform routes; commands `announcement.save`, `announcement.schedule`, `announcement.cancel`, `announcement.simulateDelivery`, `settings.update`.

- [ ] Write failing tests for segmented-audience scope, cancellation preventing simulated sends, audit before/after and actor attribution, protected collection-account changes, report totals from partial/refunded receipts and export scope. Run the new tests; expect failures.
- [ ] Implement drafts, audience preview, channel/cost preview and schedule/cancel flows. Demonstration time and delivery are visible; no implied background scheduler while the browser is closed.
- [ ] Build reports with metric definitions and filtered CSV exports; escape formula-leading cells. Separate recurring revenue, cash, dues and adjustments. Exports use exactly the authorized filtered records.
- [ ] Build read-only audit detail and filters. Build settings forms for currency/timezone, configured policy values, collection methods and provider placeholders. Do not store real provider secrets in browser storage; disconnected integration checks say so honestly.
- [ ] Add browser scenarios for audience preview/cancellation, scope-limited export and settings validation. Run administration tests and the full unit suite; expect all passing. Commit.

## Task 7: Whole-workflow and accessibility verification

**Files:** Extend `scripts/saas-browser.cjs`, `scripts/theme-browser.cjs`, `package.json`; add `docs/saas/README.md`; apply focused fixes in owning feature files.

**Consumes:** All routes and command contracts. **Produces:** `npm run test:saas` browser gate and a documented demo walkthrough.

- [ ] Finish browser scenarios for stale open forms after actor/tenant switching, reload persistence, corrupt/quota-limited storage recovery, direct forbidden routes, combined-role work queues and public/private data boundaries.
- [ ] Check every platform and tenant page in Light and Dark, plus representative forms, popovers, badges and menus. Run axe contrast checks; explicitly inspect incomplete results and non-text controls. Verify System follows OS changes and retains the existing theme setting.
- [ ] Verify desktop and 390px mobile layouts, no page-level horizontal overflow, keyboard form completion, dialog Escape/focus return, accessible names, status announcements and error recovery. Capture representative screenshots for visual review.
- [ ] Run `npm test`, `npm run build`, `npm run test:saas` and `npm run test:theme`; expect exit code 0 for all. Compare any TypeScript output with the pre-existing generated-library baseline and fix new errors only.
- [ ] Fix concrete failures with reproducing tests; avoid unrelated ERP refactors. Recheck existing compound-unit POS sales through the existing browser/unit checks.
- [ ] Document demo routes/accounts, persistence/reset, supported workflows, test evidence and backend integration boundaries. Commit the verified implementation.

## Review and delivery

After plan approval, use native execution in this session: one implementer, then one independent whole-branch review as required by executing-plans. That keeps task-by-task coordination small while still checking permission and financial boundaries independently. Address critical/important findings with regression tests.

Push the feature branch and open an implementation PR against the latest main. Re-read GitHub main before creating the remote tree so unrelated changes are preserved. Do not merge or deploy as an implicit part of this plan; provide the completed PR and verification results for visual review. Previous deployment-account access was blocked, so deployment requires a separately available authorized path.

Plan review status: approved by the user. Native implementation completed in `feat/saas-administration`; verification and supported demo boundaries are recorded in `docs/saas/README.md`. The independent reviewer was read-only; all code was written and fixed natively.
