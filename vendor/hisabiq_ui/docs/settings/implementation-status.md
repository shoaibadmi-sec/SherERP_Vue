# Settings implementation status — 28 October 2026

This branch delivers the first UI implementation slice of [the approved roadmap](final-settings-roadmap.md). It does not close all 16 roadmap tasks. HisabIQ UI remains a browser preview with no production authorization or accounting backend.

## Implemented behavior

| Area | Working behavior and source |
| --- | --- |
| Settings shell | Selected section title, horizontal underline main tabs, Party-aligned responsive sub-settings navigation, bilingual field search, shared Save/Discard, stale-revision checks, memory-only save warning and unsaved navigation guard. Existing Simple/Advanced compatibility is retained. |
| Module entry | Settings opens the same canonical editor inside the module; the underlying page stays mounted so filters and drafts survive returning. Switching modules closes the local editor. |
| Names & Khata | Closed financial term registry, English/Bangla/helper edits per relationship, account-aware previews, independent whole-column ordering. Party tables/balances/statements and account ledgers consume the shared settings. Custom wording never changes canonical debit/credit amounts or posting rules. |
| Module columns | Sales and Products share their existing column choosers with Settings. Personal browser overrides take precedence over business defaults; required identity/totals stay visible. Tablet Sales keeps its existing separate preference key. Column visibility is not data authorization. |
| Invoice designs | Shared preview/print renderer; Standard, Classic and Compact; English, bilingual and Bangla; A4, 80 mm, 58 mm and Business Pad; orientation/margins/top offset; business/customer/product fields; serial/warranty details, bundle contents, payment accounts, change, totals, notes/terms/message/footer, signatures and section order. Source values and internal costs are not rewritten. |
| Historical display | Captured document snapshots are retained when present. Older uncaptured invoices are explicitly labelled reconstructed. Sales supports customer/product display aliases and a printed note, preserving the previous copy and presentation audit in the session store. |
| Ledger/report output | Separate A4 language/orientation/margin/header/signature/footer profiles. Print consumers read canonical current settings, including memory-only saves. Raw CSV remains the original machine-readable contract. |
| Roles | NestSherERP's ten implemented permission descriptors, six system-role identities, custom roles, grouped capabilities, protected Owner, assigned-role deletion refusal, affected-member preview, grant ceiling, separate user actions, read gates and save-time validation. Existing multiple role assignments and legacy settings grants are preserved. |
| Recovery | Archiving an actual Sales draft moves it to the session Recycle Bin with Undo and a 30-day restore deadline. Restore preserves the original draft identity and validates source-product availability. No posted financial record is deleted or restored. |

## NestSherERP source fidelity

The reference repository was checked at `b1bad29961a968829be622dc812d476773e6db78`. Implemented RBAC references are `apps/web/src/pages/RolesPage.vue`, `packages/core-contracts/src/permissions.ts`, `roles.ts` and `packages/core-application/src/users/manage-roles-service.ts`.

That repository has invoice requirements in its SRS, but no invoice screen or renderer to copy. These invoice screens implement the supplied specification using HisabIQ's Magic Patterns controls and brand rules; they are not a claimed pixel copy of unavailable UI. RBAC behavior is adapted to this repository's existing multi-role preview and stable saved data. Production password step-up and request-time server checks are not simulated by collecting a password.

## Remaining roadmap work

| Roadmap | Remaining work |
| --- | --- |
| T1–T2 | Complete all-consumer migration inventory; authenticated scope/change-policy services and entitlement resolver. |
| T3–T6 | Complete every module's settings/default consumers and term inventory; replace legacy global Advanced mode with local disclosures; permission-filter confidential source data, detail views and exports. |
| T7–T9 | Durable issuance/version storage, all invoice-family adapters, reserved numbering, richer safe overrides, entitlement-aware template activation, image/share/physical-printer integrations. Browser Print/Save as PDF is the current output path. |
| T10 | Server RBAC, password step-up, session revocation, authenticated employee invitations and complete operation-level authorization. Client checks cannot secure bundled data. Existing six-digit PIN/security walkthrough remains explicitly a preview. |
| T11 | Durable recovery audit and other eligible entity adapters. Current draft recovery resets on reload with the existing session store. Settings backup covers preferences and role configuration, not transaction data. |
| T12–T14 | Shared benefits, exact plan/pack/support approval migration, canonical provider/channel/credit and delivery services. Existing SaaS routes remain separate. |
| T15 | Production integration acceptance after the remaining services exist. This branch's UI validation is listed below. |
| T16 | Companion Reports → Business Review workstream; this change does not add a report generator or treat report design as report generation. |

## Shared controls and actions

Reuses the actual `Button`, `Input`, `AppSelect`, settings `Switch`/`SettingsField`/`SettingCard`/`SettingsDialog`, `MotionTabList`, existing tables and date selectors. There is no new product picker, cart, payment editor, dependency or design system. The POS completion path only captures the invoice design and descriptive product data for the existing receipt.

| Action | Observable result |
| --- | --- |
| Save / Save and continue | Validation and current authority/revision checks; one canonical state update; durable-save or memory-only status. |
| Local Settings / Back to module | Same editor and settings data; original module remains mounted. |
| Change role / employee | Draft review followed by shared Save; denied grants and protected identities fail without mutation. |
| Invoice preview / Print | Same renderer and chosen profile; escaped source content and browser output. |
| Save presentation revision | New display copy plus previous snapshot/audit; source master data, amounts, payments, stock and ledger untouched. |
| Archive / Undo / Restore draft | Real session-store removal/recovery; permission, tenant, expiry and source checks; no posting. |
| Change columns | Actual table columns change; business defaults and personal overrides have explicit scope. |

## Validation

Baseline: 734 unit tests passed before changes. Added tests cover migration, role command boundaries, context semantics, asymmetric column values, profiles, preservation of receipt details, memory-only document consumers, presentation immutability and draft recovery.

Run `npm test`, `npx tsc --noEmit`, `npm run check:ui-contract` and `npm run build`. Browser checks: `scripts/settings-responsive-browser.cjs`, `settings-redesign-browser.cjs`, `settings-browser.cjs`, `settings-hub-browser.cjs`, `auth-settings-browser.cjs`, `party-ledger-browser.cjs`, `pos-fast-counter-browser.cjs`, `table-typography-browser.cjs`, `dialog-accessibility-browser.cjs` and `calculator-scratchpad-browser.cjs`. A custom Chromium path can be supplied with `PLAYWRIGHT_EXECUTABLE_PATH`.

Final verification results and review resolutions are recorded in the PR. Existing large production chunks and existing lint warnings are not presented as newly solved work.


### Approved library and detail follow-up — 28 October 2026

Shared Reports library/search and toolbar shells now serve Settings. Employee list has actual search, status/role/date filtering, optional joined dates, column choices and pagination; activity has search, dates, section filter and columns. Employee dates are optional for legacy records and use the existing account-edit/save-time permission checks. Settings backup adds an authenticated encrypted SQL snapshot with a user-held HisabIQ secret key and strict parse/review/authorized restore; arbitrary SQL is never run. This is a Settings-only snapshot, not a full business/server database backup. Three invoice templates now render all three document-language styles, secondary Bangla helpers and language-correct amount words. Custom user-entered data is not auto-translated. Server database backup/recovery, key custody/rotation and production scheduling remain backend work.


### Header search and horizontal scroll follow-up — 28 October 2026

Global Settings search now sits before Preview as in the page header with attached, bounded results; the full-width search row below the tabs is removed. Sidebar and employee searches remain contextual. Horizontal Settings tab rows use real shared left/right scroll buttons only when needed, with disabled boundary states and no category/draft changes while scrolling. Selected-tab titles and Party 768/1024 responsive bands remain unchanged. See the updated verification notes for browser coverage and author-review provenance.
