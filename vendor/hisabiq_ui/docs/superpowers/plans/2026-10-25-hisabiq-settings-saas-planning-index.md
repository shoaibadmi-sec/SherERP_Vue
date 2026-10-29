# HisabIQ Settings and SaaS UI Planning Package

**Date:** 25 October 2026 (Asia/Dhaka).  
**Status:** Written for review; UI design/implementation and backend execution have not started.

## Read in this order

**First apply the [ERP-wide KISS UI/UX contract](../specs/2026-10-25-hisabiq-erp-wide-kiss-uiux-contract.md).** It supersedes older screen/tab counts and optional UI steps while preserving all agreed product and safety behavior.

1. [Final owner decisions](../specs/2026-10-25-hisabiq-approved-business-model-decisions.md), sections 10–12.
2. [Shared UI design and backend requirements](../specs/2026-10-25-hisabiq-settings-saas-ui-backend-design.md).
3. [Tenant Settings and ERP experience UI plan](2026-10-25-hisabiq-settings-erp-experience-ui.md).
4. [SaaS tenant Control Center UI plan](2026-10-25-hisabiq-saas-control-center-ui.md).

## Execution order

| Stage | Deliverable | Prerequisite / stop point |
|---|---|---|
| A | Shared types, catalog, resolver and preview ports | Settings Task 1; preserve existing state |
| B | Tenant settings and real module consumers | Settings Tasks 2–6; Basic/Medium/Premium verified independently |
| C | Recycle Bin and tenant support consent | Settings Tasks 7–8; safe draft adapter only, no financial resurrection |
| D | SaaS workspace/configuration/grants/history | SaaS Tasks 1–4; same contracts and actual shared preview settings |
| E | SaaS-only diagnostic samples | SaaS Tasks 5–6; no real collector or private payloads |
| F | Commerce/payment/SMS UI | Required 12-task companion plan and shared commerce contracts |
| G | Combined review | All three plans' final browser tasks; no merge/deployment |
| Later | ByabsIQ backend | Separate approval and execution plan based on shared spec section 8 |

The two UI plans share contracts and fixtures; do not run competing edits to those shared files concurrently. Each task has an independent verification and review gate. Native sequential execution fits the existing shared state; this package does not select or authorize an execution method.

## Final interface policy

- **Basic:** simple essential screens, standard module navigation and complete standard routes to essential work.
- **Medium / Pro:** connected records and contextual actions; selected operational columns; no full Premium breakdowns.
- **Premium / Plus:** full implemented rich UI and precise optional settings, subject to role rights and quotas.
- Recovery and required financial/security/history access remain available independently of interface richness.
- Tenant technical logs appear only in authorized SaaS diagnostics.

Counter's additional experience inclusion is not silently decided; the preview uses Basic plus existing explicit benefits until the owner confirms the production catalog.

## Main screens

- Tenant: Interface & workflows, module column/detail/link controls, scoped changes/review/reset, Recycle Bin and restore conflict states, support consent and Recent changes.
- SaaS tenant: Overview, Configuration, Features & Limits, Members, Support Access, Diagnostics and History; existing billing/SMS/services links retained.
- Future backend: session-derived effective access, persistent scoped preferences, commercial grants/expiry, domain-safe recovery, consented support commands, redacted diagnostics and access audit.

## Validation of this planning work

Existing source paths, routes, package scripts and backend boundaries were inspected. A fresh builder review identified scope-reset/inheritance and Medium-column ambiguities; the shared contract now explicitly defines RESET/removal of overrides, scoped snapshots, descriptor value schemas, server time/version metadata and Medium's payment-method/brand columns as planner defaults. A second check confirmed these fixes and identified a missing customer-safe proposal reason; that field is now part of proposal, consent and future HTTP contracts.

No new merchant research, runtime verification, production security certification or backend readiness is claimed. Execution must refresh repository instructions and file drift, preserve the approved design and run the checks specified in each task.

## Commerce completeness extension

The SaaS plan must also cover platform payment collection, independent verification, source-linked activation, expiry/Free downgrade, renewals, refunds, SMS sales, provider procurement/configuration, delivery and reconciliation.

Read these additional documents before finalizing architecture or generating the SaaS UI:
5. [Commerce/payment/SMS operations design and deferred backend requirements](../specs/2026-10-25-hisabiq-saas-commerce-messaging-design.md).
6. [Commerce and messaging UI plan — 12 tasks](2026-10-25-hisabiq-saas-commerce-messaging-ui.md).

The original 16 Settings/Control Center tasks plus these 12 commerce tasks form a 28-task UI planning package. Complete the commerce contract layer after shared experience types; run its workflows alongside existing billing/SMS/services panels before the final combined review. Do not declare the SaaS dashboard complete based only on configuration/support/log screens.

Bank payout is separate from verified customer collection. A settled provider success/verified manual collection fulfills exactly once; browser proof alone does not. Trial/pass/paid-plan expiry recomputes Free plus surviving grants. Merchant SMS credits and wholesale supplier procurement are separate ledgers.

Counter/grace/checkout deadlines/provider/tax/operational defaults are explicitly flagged where proposed, not silently turned into approved business policy. Backend APIs, drivers, jobs, migrations and real reconciliation remain later work.

## KISS refinement applied

The 28 tasks are engineering/review work, not 28 pages. Merchant settings now use one module selector and progressive disclosure; harmless personal changes save inline. SaaS tenant workspace has five primary tabs, with existing Members and Diagnostics preserved inside appropriate panels. Checkout is shared across products; activation/refund/exception views stay in existing workflows.

Premium retains full eligible capabilities with coherent defaults and details on demand. Basic keeps its standard workable routes; Medium retains connected actions. All financial, privacy, consent, recovery and tenant-isolation checks remain mandatory.

Both Opus/Magic Patterns chats must read the KISS contract before finalizing screens.
