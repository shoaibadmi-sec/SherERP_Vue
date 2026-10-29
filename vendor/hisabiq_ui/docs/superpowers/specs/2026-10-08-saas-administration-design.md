# HisabIQ SaaS administration design

Status: proposed design for review. Repository: `shuvodelux-commits/hisabiq_ui`.

## Purpose and scope

Give HisabIQ platform staff a practical workspace to onboard tenant businesses, manage subscriptions, verify payments, operate SMS and services, and resolve tenant support requests. Keep the compact existing HisabIQ style, English primary labels, smaller Bangla helper labels, and Light/Dark/System themes.

The user confirmed HisabIQ UI as the project. This design assumes one tenant represents one subscribing business. Branches belong to that business; they are not independent tenants. Staff permissions here are separate from roles inside a tenant's ERP.

This is a UI design project. Proposed workflows will use clearly identified demonstration data until connected to a backend. Payment gateways, SMS delivery, authentication, financial settlement and secure authorization are integration work; frontend role controls do not provide security by themselves.

## Structure and approach

Recommended: a dedicated platform administration shell at `/saas`, inside the existing application, sharing theme tokens and reusable components. It preserves the business workspace at `/app` and makes the active context unmistakable with a “Platform administration” header label. Do not add platform administration links to ordinary tenant navigation.

Alternatives considered: mixing platform tools into the business sidebar creates ambiguous invoices and permissions; a separate application creates unnecessary duplication for this UI repository. A dedicated shell provides clear separation while retaining a consistent visual language.

Navigation groups:

- Overview
- Customers: Tenants, Subscriptions, Plans
- Revenue: Invoices, Payment verification
- Operations: SMS, Services
- Support: Tickets, Knowledge base
- Administration: Team & roles, Announcements, Reports, Audit log, Settings

Each employee sees the combined permitted groups from all their assigned roles. Direct navigation to a forbidden route shows an access-denied screen with a safe return action. A visible prototype employee selector may demonstrate combined roles but must be labelled “Demo staff account”. No multi-product selector in this version.

## Layout and visual direction

Use the current 236px desktop sidebar, compact header, restrained teal accents, layered neutral surfaces, and consistent table density. The header contains breadcrumbs, contextual search, notifications, appearance picker and staff menu. Search results respect the current role and tenant scope.

Overview: a short page heading and reporting period, four useful metrics, actionable work queues, then trends and recent activity. Keep revenue charts secondary to pending work. Each metric opens its underlying filtered records and displays its date range and definition.

Directories: heading, primary action, search/filter toolbar, result count, table, pagination. Persist filters in the route. Give statuses a label plus icon where useful; do not communicate status by color alone. Tables offer explicit row menus rather than making every cell an action.

Detail pages: identity and status at top, relevant primary action, summary strip, tabbed content. A right-side drawer handles quick inspection; a full detail route supports deep links and long tasks. Payment review uses evidence beside invoice and payer information. Support uses a queue beside the conversation and a tenant-context panel.

On narrow screens, navigation becomes a drawer; details stack; filter controls collapse into a labelled sheet. Prioritize identity, status and amount in table rows, with remaining fields in expandable details. Avoid page-level horizontal scrolling.

English is the naming language. Bangla helper text is quieter but readable and associated with its English label. Use existing proportional typography for currency and counts. Reuse semantic theme tokens for every surface, input, badge, chart, tooltip, menu and dialog.

Contrast acceptance targets: normal text including Bangla helpers at least 4.5:1; eligible large text at least 3:1; essential control boundaries, state indicators and graphical information at least 3:1 against adjacent colors. AAA is optional. Check actual rendered pairs in both themes, including hover, selected, error and focus states. Do not weaken helper text through arbitrary opacity. Disabled controls remain understandable and show why unavailable. This is a contrast target, not a claim of complete accessibility certification.

## Roles and authority

Configurable roles are part of the first release. One employee has one account and can hold multiple roles simultaneously: for example, Support Engineer + Payment Verifier + Service Coordinator. They do not need separate accounts or a role-switching step to do their daily work. The table below describes starter permission presets, not mutually exclusive job positions. Its restrictions mean permissions absent from that preset; another assigned role may grant them. Non-overridable operational rules, such as preventing self-approval, remain in effect across all roles.

Administrators can create, duplicate, rename and edit roles, select module/action permissions, and assign several roles to an employee. Use a searchable multi-select with role chips on invitation and staff edit forms. A permission matrix groups actions such as view, create, edit, assign, verify, refund, export and configure. Required view access is included when an action is enabled and explained in the editor. There are no per-user permission overrides or explicit deny rules in v1; create a small custom role for an additional responsibility.

Permissions are additive, evaluated with the scope of the role assignment that grants them. A Support role covering all tenants plus a Payment Verifier role scoped to assigned tenants must not grant payment verification across all tenants. Each assignment selects all tenants or an explicit tenant set; ticket/payment work assignment filters are a further restriction where applicable. The staff detail page shows effective permissions, their source roles and the applicable tenant scope.

A multi-role employee gets one combined “My work” landing page with permitted ticket, payment and service queues. Single-role staff may use the preset landing page below. A preferred landing page must remain within their effective permissions and fall back to My work when access is removed.

Role editing previews affected employees and added/removed permissions before saving. Unchecking a permission in one role does not revoke the same permission granted by another role; the preview explains retained access. Removing a role assignment is different from deleting the shared role. Deleting an assigned role requires reassignment or explicit removal from affected employees. Only staff with role-management authority can manage roles; they cannot grant authority beyond their own delegable permissions. Super Admin assignment and owner-level authority remain owner-only. Prevent removal or disablement of the last active owner.

Sensitive operations record the operator, reason and affected record. No role combination permits approving a payment submission created by the same employee; a tenant-submitted payment can be verified by an employee who also handled its support ticket. When no other eligible reviewer exists, the UI leaves the staff-created submission pending and explains the blocker instead of silently bypassing the rule. Permission changes update navigation, queues and open actions together; backend integration must recheck authorization on every operation.

| Role | Default landing | Allowed responsibilities | Important boundaries |
| --- | --- | --- | --- |
| Super Admin | Platform overview | Platform configuration, staff authority, all operational modules | Cannot bypass duplicate-payment protections or approve own submission; cannot remove last active owner |
| Operations Admin | Tenant operations | Onboarding, tenant lifecycle, subscriptions and service coordination | No payment approval or elevated staff-role assignment by default |
| Finance Manager | Revenue overview | Invoice corrections, allocations, verifier escalation, credits and refund workflow | Completed money records are adjusted, never silently overwritten |
| Payment Verifier | Verification queue | Inspect evidence, request information, verify or reject assigned submissions | No self-approval, plan pricing changes, refund approval or unrelated ERP data access |
| Support Lead | Team support queue | Assign tickets, manage priorities, escalations and knowledge content | Cannot approve money or silently access a tenant workspace |
| Support Engineer | My tickets | Public replies, internal notes, troubleshooting, escalation | Assigned tenant/ticket scope; no role elevation or financial approval |
| Messaging Operator | SMS operations | Delivery diagnostics, templates, sender configuration and credit-adjustment requests | No unreviewed financial credits or broad access to message contents |
| Service Coordinator | Service orders | Assign, schedule and complete services; record deliverables | Billing changes go through finance |
| Analyst / Auditor | Reports | Permitted reports and audit records | Read-only; sensitive exports separately controlled |

Invitations show pending, accepted, expired and revoked states. Role changes show affected permissions before save. Disabling a staff member includes session-revocation intent and reassignment of open work. Collection-account and provider configuration permissions are explicit, not implicitly granted to every administrator.

## Screen inventory and interactions

| Screen | Main information and filters | Actions and details |
| --- | --- | --- |
| Overview | Active/trial/suspended tenants, recurring revenue, cash collected, renewals, pending verification, support backlog | Role-specific queues; drill-down from every metric; clearly separate recurring revenue from receipts |
| Tenants | Business/tenant ID, owner, plan, tenant status, subscription status, renewal, outstanding balance; search and status/plan filters | Create tenant, invite owner, open profile, extend trial, suspend/reactivate with reason and impact preview |
| Tenant profile | Overview, Members, Subscription, Billing, SMS, Services, Support, Activity tabs | Cross-links retain tenant context; show pending actions and activity timeline; guarded archive action |
| Plans | Name, monthly/yearly price, published version, entitlements, limits, availability | Create/edit draft, compare, publish, retire; publish preview explains effect on new subscriptions; preserve existing invoice snapshots |
| Subscriptions | Tenant, plan, period, next renewal, trial/grace dates, status and scheduled change | Upgrade/downgrade quote, renew, extend trial, schedule cancellation, undo future cancellation |
| Invoices | SaaS invoice number, tenant, issued/due dates, total, paid, remaining, status | Issue invoice, view line items, record submission, allocate verified payment, credit/void as permitted, print/download |
| Payment verification | Submission age, tenant, amount, channel, reference, evidence, reviewer, status | Side-by-side review, duplicate warning, claim assignment, request information, reject or verify with allocation preview |
| SMS overview | Available/reserved/used credits, low balances, failure rate, provider health | Drill into tenant ledger, package orders and delivery logs; health remains unknown when integration is absent |
| SMS packages and logs | Package units/price/expiry; messages by tenant, date, status and provider reference | Buy/request package, inspect segmented usage, retry eligible failures, manage templates; mask recipient details by role |
| Services | Catalog and orders with tenant, assignee, price, due date and progress | Request/quote/approve, assign, schedule, start, add deliverable, complete or cancel |
| Support inbox | Ticket ID, tenant, subject, priority, assignee, status, SLA due; My/Unassigned/Team views | Assign, reply, internal note, escalate, link operational records, resolve/reopen; separate public and private composers |
| Knowledge base | Searchable articles, audience, category, draft/published status | Draft, preview and publish articles; internal articles are never shown in tenant portal |
| Team & roles | Staff, multiple role chips, per-role tenant scopes, invitation/session state; separate Roles tab | Invite, assign multiple roles, create/duplicate/edit roles, inspect effective permissions, preview affected staff, disable, revoke sessions |
| Announcements | Audience, channels, schedule and delivery summary | Draft, preview audience and message, schedule/send confirmation, cancel pending delivery |
| Reports | Revenue, collections/dues, renewals/churn, SMS usage, services, support | Date filters, metric definitions and permission-controlled exports |
| Audit log | Actor, action, timestamp, tenant, entity, reason and before/after | Search and filter; inspect event; no edit/delete action |
| Settings | Business timezone, currency, billing policies, collection accounts, integrations | Validate changes, mask secrets, connection-test feedback, permission-based access |

Tenant creation is a short step flow: business and owner → plan/trial → entitlements preview → create/invite. Validate email/phone, required fields and duplicate business identifiers. Failed invitation delivery must not create a second tenant when retried.

Suspension requires a reason and shows the access consequence and billing treatment before confirmation. Suspension itself does not silently cancel a subscription or erase records. Archiving is unavailable while unpaid invoices, open services or unresolved tickets require action; present linked blockers.

## Subscription and payment journeys

Tenant lifecycle and subscription lifecycle are independent. Tenant: provisioning, active, suspended, archived. Subscription: trial, active, grace, expired, cancelled. A future cancellation is a scheduled change on an active subscription until its effective date.

Proposed initial policy: one current base subscription with optional add-ons. Changes take effect at the next renewal by default. Immediate upgrades require an explicit quote and effective date. Grace duration, pricing, tax treatment and credit rules are configurable policy values; do not invent them as production facts. A published plan version and invoice line descriptions are retained in historical records.

An invoice moves through issued/unpaid, partially paid, paid and void states; overdue is derived from due date and remaining amount. A payment submission is pending, needs information, verified or rejected. Verification creates one verified receipt. Refunds and reversals are linked adjustment records, not replacement statuses that destroy the original receipt.

Manual payment journey:

1. Tenant opens an invoice, chooses a configured collection method, enters amount/reference/date and attaches evidence. bKash, Nagad, Rocket and bank transfer are possible configured labels, not claims of live integrations.
2. Reviewer sees the evidence, destination collection account, payer details, matching invoice, prior submissions and possible duplicates. Evidence alone is not confirmation of receipt.
3. Reviewer may request missing information or reject with a tenant-visible reason. Resubmission retains history.
4. Verification shows receipt amount, allocations, remaining invoice amount, excess credit and resulting entitlement changes before confirmation. Reviewer cannot approve a submission they created.
5. A verified payment can be allocated across permitted invoices for the same tenant. Partial payments leave the balance due. Excess funds become an explicit unapplied credit. Repeated verification cannot create another receipt or credit.
6. Full qualifying settlement activates the purchased subscription, package or service once. Partial payment does not silently grant full entitlement. Corrections, refunds and reversals require finance authority and a visible consequence preview.

Duplicate matching considers collection account, payment channel and normalized reference. A suspected duplicate blocks automatic allocation and provides a finance escalation path. Support permission alone allows linking a payment issue; the same employee may verify it when also granted payment-verification permission for that tenant. Concurrent review conflicts should refresh the record rather than overwrite another decision.

## SMS and services

SMS balance is a ledger, with included, purchased and promotional sources and explicit expiry rules. Show available, reserved, consumed and released units separately. Estimate message segments using configured provider rules, with a clear estimate label. Failed delivery refunds depend on provider policy; do not promise blanket refunds.

Package purchase links an order to a SaaS invoice; qualifying settlement adds credits once. A retry preserves message identity, shows potential charge impact and prevents duplicate consumption. Logs show queued/sent/delivered/failed/unknown distinctly. Test sends and campaigns require recipient/audience, segment and cost previews. A UI prototype sends no real messages.

Service examples: onboarding, migration, training, invoice setup and extra storage. Catalog items identify one-time versus recurring charging. Orders progress requested → quoted → approved → scheduled → in progress → completed, with cancellation where allowed. Assignment, due dates, tenant-visible updates and deliverables live on the order. Completion and payment are separate facts. Recurring services link to subscription add-ons.

## Support and tenant-facing counterpart

Ticket lifecycle: open, in progress, waiting for tenant, waiting internally, resolved, closed; reopening returns a resolved/closed ticket to open and preserves history. SLA calculations and paused states follow configured support policy. Display timezone and explicit due times alongside relative timers.

Ticket detail includes conversation, attachments, assignee/priority controls, linked invoice/payment/SMS/service records and a contextual tenant summary. Internal notes use a distinct editor mode and visible “Internal note” label before posting. Public replies show recipient/audience. Errors preserve drafts. Assignment conflicts show the latest owner.

Temporary support access is a separate grant with tenant consent, scope, reason, expiration and revocation. Support never requests passwords. Access sessions are visibly marked and audited. This requires backend enforcement before real use.

Inside the business workspace, add “My subscription” and “Support” destinations. Tenant owners can see plan/usage/renewal, SaaS invoices and payment submissions, SMS packages/balance and service requests. Tenant support shows only public messages and allowed attachments. Tenant members need explicit billing/support permission; platform notes, staff-only articles and other tenants' records are never exposed.

## Shared behavior and data boundaries

Use reusable page headers, metric cards, filter bars, tables, status badges, detail drawers, activity timelines and confirmation dialogs. Separate platform shell, tenant directory, subscription, billing, messaging, services, support and staff permissions into focused modules. Share IDs and typed contracts, not page-local copies of financial balances.

Routes are proposed under the existing HashRouter: `/saas/overview`, `/saas/tenants/:id`, `/saas/subscriptions`, `/saas/plans`, `/saas/invoices/:id`, `/saas/payments/:id`, `/saas/sms`, `/saas/services/:id`, `/saas/support/:id`, `/saas/team`, `/saas/announcements`, `/saas/reports`, `/saas/audit`, `/saas/settings`. Directory routes coexist with their detail routes. Tenant counterparts are `/app/subscription` and `/app/support`.

Demonstration state should be shared and persistent across navigation with an explicit reset action. Every mutation records an audit event. Monetary calculations use integer minor units; display BDT and Asia/Dhaka timestamps in examples. Backend integration must enforce tenant scope, authorization, idempotency and concurrency independently of the UI.

Every page includes loading, useful empty, error/retry and forbidden states. Every primary action has a working form or clearly explained unavailable state. Forms validate inline, preserve entered data after failure and prevent duplicate submission. Destructive actions show the target name and consequence. Opening another tenant clears prior tenant-specific dialogs and drafts only after an unsaved-change warning where needed.

## Delivery slices

1. Platform shell, role-aware overview, shared tenant model, tenant directory/profile and staff permission demonstration.
2. Plans, subscriptions, SaaS invoices and payment verification with tenant billing counterpart.
3. SMS packages/ledger/logs and service catalog/orders, connected to billing.
4. Support queues/conversations, tenant support, knowledge articles and support-access grant design.
5. Announcements, reports, audit, configuration and complete cross-module walkthrough.

These are linked work packages, not five disconnected mockups. Detail implementation plans should be scoped per slice. The first slice must establish navigation, permissions, tenant identity and reusable UI patterns that later slices extend.

## Acceptance scenarios

- A Support Engineer + Payment Verifier sees both queues, can reply and verify eligible tenant submissions without changing accounts, and cannot use ungranted refund/settings actions.
- Custom roles can be created, duplicated, edited and assigned from the first release. Effective access shows source roles and tenant scopes; edits preview all affected employees.
- Removing one role preserves permissions still granted by another; removing the last grant removes routes and actions. Broad support scope never broadens a narrow payment-verification grant.
- Single-role and combined-role employees have appropriate landing pages; hidden navigation cannot be reached through an unguarded direct route in the prototype.
- Create a tenant, assign a trial, issue a renewal invoice, submit evidence, request information, resubmit, verify and observe the correct subscription update and audit entries.
- Cover partial payment, unapplied credit, duplicate reference, self-approval rejection, concurrent review, rejected proof and reversal without double activation.
- Buy SMS credit and inspect its ledger; repeated settlement or retry does not duplicate credit/charges. Expired/reserved credits are not spendable.
- Request a service, assign it, complete delivery and inspect billing independently.
- Tenant opens a ticket; engineer adds an internal note and public reply; tenant sees only the reply; escalation and reopening preserve history.
- Switch tenants and roles while a detail view is open; no stale tenant data or unauthorized actions remain.
- Validate keyboard navigation, visible focus, labelled forms, dialog focus/close/return behavior, screen-reader status announcements, mobile layout, and rendered contrast in Light/Dark/System.
- Existing business routes, POS compound units, theme persistence and existing tests continue to work.

Review outcome requested: confirm the dashboard structure, role boundaries and operational workflows before the first implementation plan is written. No product code is changed by this specification.
