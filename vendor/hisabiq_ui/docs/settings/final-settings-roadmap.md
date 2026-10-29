# HisabIQ Final Settings Design and Implementation Roadmap

> **For agentic workers:** After design approval, use Superpowers `executing-plans` to implement the tasks in order. Checkboxes describe future work, not completed implementation. Read the design in Parts A–D before executing Part E. Separate SaaS and Reports workstreams have their own delivery gates.

**Date:** 27 October 2026 · Asia/Dhaka

**Status:** Consolidated proposal for review. No Settings application code or live Magic Patterns design changed by this document.

**Goal:** Combine GitHub’s working HisabIQ Settings, Magic Patterns’ useful composition, NestSherERP’s enforceable settings principles, and the owner’s module, terminology and printing requirements into one compact bilingual design and build sequence.

**Architecture:** Evolve the existing Settings provider and field catalogue. Local module Settings and central Settings compose the same editors and saved values. Keep presentation, employee permission, commercial entitlement, business policy, and implementation readiness independent.

**Tech stack:** Existing React 18, TypeScript, Vite, React Router 6, Tailwind, shared HisabIQ/shadcn-style primitives, Framer Motion, Node tests and Playwright. No new router, state library, form framework or competing design system.

**Spec:** Parts A–D of this document. At implementation, place the design in `docs/superpowers/specs/2026-10-27-final-settings-design.md` and Part E in `docs/superpowers/plans/2026-10-27-final-settings-roadmap.md`, with links between them.

## Read this first

This is the consolidated direction for the next Settings redesign. It replaces contradictory recommendations in the earlier Settings proposal and NestSherERP comparison. It preserves requirements that belong to other workstreams and links them to their owning module rather than claiming a Settings switch implements them.

The owner has already chosen the combined approach: retain GitHub behavior, adapt the best Magic Patterns design, adopt useful NestSherERP safeguards, and incorporate the owner’s recommendations. This document makes that choice concrete; it does not claim approval of unreviewed design details.

**Recommended first delivery:** one coherent Settings shell plus Party/Ledger Settings, financial terminology and real local/central save parity. Next deliver shared print designs, remaining module settings and access controls. SaaS commerce and Business Review follow as bounded workstreams. Do not regenerate the ERP or replace its stores with Magic Patterns demo stores.

## Global constraints

- Ordinary controls and Settings Save/Cancel are **36px**. **48px** is only for explicitly marked transaction-completion actions, not ordinary Settings buttons.
- Inputs: **13px/20px, weight 400**, Ink 600; muted placeholders. Labels: **13px/20px, weight 500**.
- Tables and responsive data rows: **13px data / 12px headings / 11px helpers and badges**.
- **Geist + Hind Siliguri**, Ink/Teal/Mint semantic tokens, proportional digits; no monospace numbers or new tabular-number styling.
- Party Ledger-style **2px underline content tabs** with one baseline. No filled pill navigation.
- Existing shared components, theme, focus, date, dialog and motion behavior remain authoritative.
- English, Bangla and bilingual UI; light/dark; desktop/tablet/phone; keyboard/touch/reduced motion.
- Preserve settings values, roles, drafts, unit chains, posting semantics, source links, historical records and purchased terms.
- One saved setting has one owner, validation rule, permission rule and canonical key regardless of entry point.
- New ordinary administrative permissions start owner-only unless an explicit existing equivalent grant is migrated.
- Real authentication, payments, provider delivery, server permissions and tenant isolation require backend services; label the local UI preview honestly.
- A visible control is complete only when its consumer works at the declared preview/live level. No false success or inert switches.
- Existing repository instructions prohibit merging without user approval; this roadmap authorizes no merge or deployment.

## Review focus

1. A dirty editor must retain its original business/member target when the user switches business, route, scope or browser history. T2/T3 own this.
2. Existing multi-role users must not lose unrelated permissions or gain new administration merely through a migration. T1/T10 own this.
3. Changing labels/order must move the actual financial values and totals consistently, including phone layouts and print, without changing accounting. T4/T5 own this.
4. A now-restricted user must not retrieve cost/profit through preview, search, print, exports or saved documents. T7/T9/T10/T15 own this.
5. Expiry, retries and another editor’s changes must not duplicate grants/credits, overwrite newer settings or reuse consumed support consent. T2/T12/T13/T15 own this.

---

# Part A — Evidence and decisions

## A1. Reviewed sources and freshness

| Source | Reviewed baseline | How it contributes |
| --- | --- | --- |
| HisabIQ UI | GitHub `main` at `83ebbff4706acaffd918aba1b8ec4e56b13b7828` | Implementation source of truth; current guide/component library and existing settings foundation |
| Previous Settings source snapshot | `79c51fdbbc8ce47364488127a1e2c5762f6526d9` | Settings files inspected locally; GitHub comparison to current head shows no changed `src/settings` files |
| Current Magic Patterns | [HisabIQ editor](https://www.magicpatterns.com/c/t6q3mxi6nhuak3qjvx8cwn), active artifact `5b1f6ae5-d2c4-4e7b-8756-b74ffdb8f872` | SettingsWorkbench, InterfaceSettings, settings section catalogue, library adapter guidance; status rechecked this session |
| Brand/visual authority | Complete guide v2.2, 26 October 2026, and actual shared library | Component families, quieter inputs, sizing, token/theme, underline tabs, accessible responsive states |
| NestSherERP | `b1bad29961a968829be622dc812d476773e6db78`; current head rechecked | Catalogue, settings service, dependencies, roles and credential behavior; principles, not a code transplant |
| Owner requirements | This conversation, including financial names, local module settings, documents and Business Review | Current explicit product scope |
| Current repository planning | Owner decision record §§10–12 and ERP-wide KISS contract | Free/Medium/Premium ladder, 30-day recovery, SaaS-only diagnostics and fewer screens |
| Earlier project plans | Settings plan and NestSherERP review, read from their current saved versions and source snapshots | Requirements inventory and prior proposals to reconcile |

Source inspection is not rendered acceptance. No application tests, live-screen visual QA or production enforcement were verified in this planning turn. Reference README test results are historical evidence, not results of this redesign.

The supplied ZIP is the earlier ERP/brand export and has no Settings module. Use the later live Magic Patterns source for Settings; do not claim the ZIP contains it.

Pinned sources:

- [GitHub Settings model](https://github.com/shuvodelux-commits/hisabiq_ui/blob/83ebbff4706acaffd918aba1b8ec4e56b13b7828/src/settings/model.ts), [provider](https://github.com/shuvodelux-commits/hisabiq_ui/blob/83ebbff4706acaffd918aba1b8ec4e56b13b7828/src/settings/TenantSettingsProvider.tsx), [fields](https://github.com/shuvodelux-commits/hisabiq_ui/blob/83ebbff4706acaffd918aba1b8ec4e56b13b7828/src/settings/fields.ts), [connection limits](https://github.com/shuvodelux-commits/hisabiq_ui/blob/83ebbff4706acaffd918aba1b8ec4e56b13b7828/docs/settings/README.md).
- [Complete Brand Guide](https://github.com/shuvodelux-commits/hisabiq_ui/blob/83ebbff4706acaffd918aba1b8ec4e56b13b7828/docs/ui/HISABIQ-DESIGN-GUIDE.md), [repository instructions](https://github.com/shuvodelux-commits/hisabiq_ui/blob/83ebbff4706acaffd918aba1b8ec4e56b13b7828/AGENTS.md).
- [Owner commercial/recovery/diagnostics decisions](https://github.com/shuvodelux-commits/hisabiq_ui/blob/83ebbff4706acaffd918aba1b8ec4e56b13b7828/docs/superpowers/specs/2026-10-25-hisabiq-approved-business-model-decisions.md), [KISS contract](https://github.com/shuvodelux-commits/hisabiq_ui/blob/83ebbff4706acaffd918aba1b8ec4e56b13b7828/docs/superpowers/specs/2026-10-25-hisabiq-erp-wide-kiss-uiux-contract.md).
- [Existing ERP experience plan](https://github.com/shuvodelux-commits/hisabiq_ui/blob/83ebbff4706acaffd918aba1b8ec4e56b13b7828/docs/superpowers/plans/2026-10-25-hisabiq-settings-erp-experience-ui.md).
- [NestSherERP catalogue](https://github.com/shuvodelux-commits/nestshererp/blob/b1bad29961a968829be622dc812d476773e6db78/packages/core-contracts/src/settings.ts), [save service](https://github.com/shuvodelux-commits/nestshererp/blob/b1bad29961a968829be622dc812d476773e6db78/packages/core-application/src/settings/manage-settings-service.ts), [roles](https://github.com/shuvodelux-commits/nestshererp/blob/b1bad29961a968829be622dc812d476773e6db78/packages/core-application/src/users/manage-roles-service.ts).

## A2. What to take from each source

| Concern | Keep from GitHub | Adapt from Magic Patterns | Adopt/refine from NestSherERP | Final choice |
| --- | --- | --- | --- | --- |
| Settings data | Current typed model, validation, separate personal/business state, legacy migration | Descriptor metadata and useful preview | Closed catalogue; unknown values rejected | Extend existing model; map current fields rather than replacing 61 controls |
| Search/navigation | Bilingual/fuzzy field search, canonical security/billing routes | Grouped categories, compact setting rows | Clear grouping | One central index; local module Settings; shared editors |
| Save | Explicit business Save/Discard, revision protection, warnings | Inline save feedback, personal immediate preferences | Authorized audited no-op-aware saves | Immediate personal appearance; staged consequential/shared edits |
| Team | Multiple roles, custom roles, last-owner protection | Plain capability descriptions | Impact preview and protected role rules | Effective permission union bounded by explicit delegation ceiling |
| Security | Six-digit PIN/account walkthrough and fixed approved windows | Status presentation only | Set versus Change, session consequences | Preserve HisabIQ policies; real full-auth handoff later |
| Interface | Existing report/module columns and actual consumers | My view/Business defaults, optional inline preview | Dependency explanation | One capability resolver; no competing stores |
| Commercial | Existing tenant billing/SMS/payment records | Package, offer, feature/grant presentation | No usable billing implementation to copy | Separate staff catalogue and tenant purchase flow |
| Print | Current receipt/statement/report sources | Shared brand composition | Business Pad and safe display overrides in reference requirements | One versioned document-profile layer with domain renderers |
| Reliability | Existing stale-edit guard | Clear unavailable reasons | Validation/dependency/audit within one save boundary | UI contract now; server-enforced production integration later |

NestSherERP’s 22 settings descriptors are marked `inEffect: false`; saved configuration is not evidence of 22 working ERP consumers. Its four-digit PIN, broad warranty→serial dependency, single-role assumptions, costing ambiguity and permissive SaaS entitlement stub do not become HisabIQ rules.

## A3. Conflicts resolved in this consolidation

| Earlier conflict | Consolidated rule |
| --- | --- |
| Older assistant proposal preserved every contextual shortcut for Free | Follow owner-approved UI ladder: Free standard routes, Medium contextual connections, Premium richer optional detail. Inventory exact keys and migration before activating gates; keep essential standard actions usable |
| Earlier proposal omitted Recycle Bin | Preserve the approved 30-day eligible-record recovery workstream on every plan; place it under Data & recovery; never restore posted finance as an ordinary deleted draft |
| Fifteen large category/tab choices | A small central grouped index, module selector and a few local content tabs; no 15-tab strip or second permanent sidebar |
| Magic Patterns security is business-scoped with editable timing | Account-owned security; optional six-digit PIN; 30-minute lock with enable/disable; fixed 90-day trust |
| Old plan names/prices/quotas differ | Free / Medium / Premium presentation; stable existing IDs and versioned purchase snapshots. Pilot prices from product brief are not new public prices |
| Report catalogue versus future Premium packaging | Preserve existing individual report access in this Settings release. New Business Review/bank packs are separately proposed Premium benefits; broader report gating requires exact catalogue reconciliation |
| Module setting repeated centrally | Same editor, same value, same permission and revision; central search opens it in module context |
| Invoice-paper choice saved but renderer fixed | Offer only renderer-supported combinations; connect and verify actual A4/58/80mm/Business Pad output |
| Local words suggest Debit always means expense | Labels/order are presentation. Cash direction and relationship ledger posting remain separate contexts |
| General recovery/log screens proposed in merchant UI | Eligible recovery remains merchant-facing; technical diagnostics remain SaaS-only. Owner-visible business/configuration history stays available |

The UI ladder is already recorded owner direction. This document’s proposed rollout does not silently switch current users to newly restricted behavior. T1 inventories current rights; T2 supplies the minimum shared benefit resolver before T6; T12 introduces only the exact approved capabilities and preserves grandfathered purchases, record access and usable standard alternatives. Existing individual Reports access is the explicit preservation exception in this workstream.

## A4. Approaches and scope

1. Polish GitHub alone: lowest disruption, but leaves missing module, print, support and terminology controls.
2. Replace GitHub with Magic Patterns: attractive prototype, but loses working state/roles/theme and imports demo assumptions.
3. **Selected by the current request: combine the best into the existing codebase.** Adapt the design through actual shared components, preserve working behavior and add each missing consumer in small slices.

Three delivery workstreams share contracts but do not become one giant release:

- **Settings and documents:** central/local settings, terminology, views, profiles, roles/security UI and recovery.
- **SaaS and commerce:** package/offer publication, payment verification, grants, usage, messaging/provider administration, support configuration and diagnostics.
- **Reports → Business Review:** monthly/yearly/custom review, profit schedules, stock/bank packs, readiness and output history.

---

# Part B — Proposed Settings redesign

## B1. Central ERP Settings

Keep the current AppShell. A compact **Settings section selector/search** sits in the header; desktop can expand the grouped index as an on-demand side panel. Do not retain a second permanent 210px sidebar beside the ERP sidebar. This is a proposed layout choice to satisfy the current KISS contract.

| Group | Destination | Content and ownership |
| --- | --- | --- |
| Business | Business profile | English/Bangla identity, contacts, logo, financial year; read-only BDT/timezone context |
| Business | Module settings | Search/select a module; opens/composes its canonical local editor and preserves return context |
| Business | Names & Khata | Shared financial display defaults; relevant module overrides accessible from their modules |
| Business | Documents & printing | Shared templates/branding/language/paper; per-family assignments; numbering preview under Advanced |
| Administration | Users & access | Team, custom roles, effective access and sensitive data permissions |
| Administration | Plan & billing | Link to existing subscription workspace; benefits, usage, bills, purchase status |
| Administration | Notifications & messages | Existing canonical notification editor; in-app/SMS/WhatsApp state, templates and costs |
| Administration | Data & recovery | Settings backup/restore, contextual import/export links, eligible Recycle Bin and configuration activity |
| Administration | Support | Existing ticket workspace with approved-change history/consent; no duplicate support store |
| My account | Appearance | My theme/language/density/search/date/presentation preferences; scope says this browser initially |
| My account | Account & security | Own sign-in/recovery/PIN/lock/devices/accounts; memberships/session/account actions |

Use one chosen destination at a time. An item with its own existing workspace navigates there; it is not another embedded copy. All old `/app/settings/*`, notification, subscription and support deep links remain valid aliases to the canonical editor.

Search covers setting labels, Bangla names, aliases and module names. A result includes its path, for example `Parties → Settings → Names & Khata → Credit helper`. Selecting expands Advanced if necessary and focuses the real field. Do not expose protected values in search snippets.

## B2. Every module has Settings in context

Add **Settings** to each module’s existing underline navigation. If a module has no peer views, a visible Settings link opens the same contextual panel; do not invent extra empty tabs. On phone it remains discoverable without hover. Back restores list selection, period, filters, scroll and transaction draft.

Within Settings, use headings for **View**, **Names & layout**, **Defaults**, **Print**. Use one underline row only when a module’s content genuinely needs separate panels. Do not force four tabs onto a small module.

| Module | Local controls |
| --- | --- |
| Dashboard | Available widgets/arrangement and summary detail; preserve existing layout preference |
| POS/Sales/returns | Checkout/customer defaults, eligible columns/details/connections, rounding, print assignment; existing shortage/return policies only at supported readiness |
| Products/stock | Existing units/brands/categories via their canonical editors; new-product unit/serial/warranty/expiry defaults; stock view/columns; stock print; expired-stock policy when enforced |
| Purchases/returns | Supplier receipt/account defaults, attachments availability, columns/labels, purchase/return document assignments |
| Parties/Ledger | Relationship-specific words/helpers, Debit/Credit order, columns/details/connections and statement profile |
| Vendor | Goods/settlement names, ledger views/columns and memo/statement profiles; retain actual vendor semantics |
| Counter | Payment/view defaults, selected party balance/receipt options and financial names; no separate payment engine |
| Finance/Accounts/Daybook | Cashbook/account terminology, columns/order, payment account defaults, date basis and voucher/statement profiles |
| Expenses | View/columns, supported category/account defaults and expense/payment receipt profile |
| Reports | Saved filters/views, default periods/sections and print assignments; Business Review defaults only |
| Warranty/installments/bundles/quotations/online sales | Existing supported view/default/document choices; preserve domain behavior; no speculative toggles for absent features |

**Required example:** change Party credit helper locally → Save → central Names & Khata shows the same scoped value → reload → one change event. Editing centrally produces the same result in the module. A central shortcut is navigation, not a second authority.

## B3. Screen composition and brand rules

| Area | Design |
| --- | --- |
| Header | Page title, current business, section selector/search, small current-plan link. No decorative KPI cards |
| Section top | Title + useful Bangla helper; scope stated once; inherited/custom source only when relevant |
| Setting rows | Aligned concise title/helper and control; related fields share a Panel; rare options in one Advanced disclosure |
| Scope | Default My view for appearance. Owner/delegate can explicitly choose Business defaults. Policy fields show their fixed business/account scope |
| Preview | Optional inline ledger or document preview. Show representative asymmetric values, not a required wizard |
| Save | Personal appearance saves instantly with truthful status. Business/module defaults are staged with one Save/Discard area |
| Review | Only for cross-user, permission, dependency or operational impact. No extra confirmation for harmless own column changes |
| Feedback | Ready, unsaved, saving, saved, in-memory-only, failed, conflict, unavailable and restricted. Retain draft on failure |

Spacing: 12px phone/16px small/24px large gutters; 16px panel padding and related-field gaps; 8px toolbar gap; 6px label–field; 4px helper–field. Use current shared radii. Ordinary switch track stays intrinsic; its label row supplies the hit target.

Desktop ≥1024px: single main content area; compact aligned form; optional editor/preview columns where legible. Tablet 640–1023px: searchable section/module selector, one/two readable field columns, preview below on demand. Phone 320–639px: one column, scope and Save visible, labelled local tab strip, keyboard-safe footer and no whole-page horizontal overflow. Wide comparative tables scroll inside their own labelled region.

Use `MotionTabList`/indicator for a 200ms shared underline, add the actual tab keyboard/ARIA behavior; that wrapper alone does not provide it. Respect reduced motion. Use token surfaces in portals and print light documents independently of app theme.

## B4. Shared component mapping

Paths below are under `src/` in GitHub; inspect exports at implementation head.

| Element | Reuse |
| --- | --- |
| Buttons/text/search | `components/Button.tsx`, `components/Input.tsx`; search X clears and keeps focus |
| Labels/validation/Advanced | Existing `settings/ui.tsx` and `components/products/fields` family |
| Short choice/searchable module | `components/AppSelect.tsx`, `components/SearchSelect.tsx` |
| Dates | `components/AppDateRangePicker.tsx`; single-date picker is an export from this file |
| Boolean/columns | `components/Switch.tsx`; actual input-based API; `components/ColumnVisibilityEditor.tsx` now exists at current GitHub head |
| Group/table/status | `components/Panel.tsx`, `Table.tsx`, `StatusBadge.tsx`, `Badge.tsx` |
| Dialog/help | `components/Dialog.tsx`, `Tooltip.tsx`; existing error/feedback family |
| Content tabs | `motion/MotionTabList.tsx` and current module keyboard handlers |
| Documents | `components/brand/ReceiptPreview.tsx`, `utils/printReceipt.tsx`, existing `PartyStatementDialog`, `utils/reportOutput.ts` as renderer adapters |
| Account/support/commerce | Existing `settings/AccountSecuritySettings.tsx`, auth features, tenant subscription, support and SaaS permission surfaces |

`ColumnVisibilityEditor` was missing from the older snapshot but is now present; create no duplicate. There is no assumed authored universal Drawer or ActionMenu just because a library package exports one. Add a narrow shared extension only when composition cannot represent a necessary design.

## B5. Concrete redesign examples

| Screen | What the owner sees | Main action |
| --- | --- | --- |
| Party → Settings | Current relationship, My view/Business default, names preset, separate column-order choice, optional columns and inline sample ledger | Save changes for shared edits; instant own view |
| Finance → Names & Khata | Cash/Bank/Party/Loan/Capital groups, searchable terms, English/Bangla/helper fields; real before/after examples | Save names |
| Documents → Invoice | Template family, Standard/Premium availability, A4/thermal/Business Pad, language, supported sections and real preview | Save default |
| Users & access → Roles | Role name, grouped capability checks, affected members, effective permissions and protected-owner notice | Save role |
| Plan & billing | Current benefits/expiry/usage, one comparison entry and billing status | Eligible upgrade/buy action |
| Data & recovery | Precisely named settings backup, relevant imports, Recycle Bin link and recent configuration changes | Contextual task, not global Reset demo |

---

# Part C — Behavior specification

## C1. Settings contract, scope and saves

Keep the existing `TenantSettingsProvider.save(section, value, expectedRevision)` contract while adding narrow contracts for new domains. Do not rewrite all existing values into a new generic engine. Extend field metadata for catalogue/search/ownership/consumer readiness; operational settings and optional experience capabilities may remain distinct typed catalogues joined by the central index.

Every setting/control records: stable key; type and exact allowed values; shipped default; module/section; permitted scope; validator; edit/view authority; feature entitlement; dependencies; consumer source; readiness (`preview`, `live`, `unavailable`); and inheritance/reset semantics. No runtime arbitrary-key configuration or arbitrary scripts.

Presentation inheritance: shipped default → business default → module override → permitted personal module override. Reset removes an override, not a copied value. Account security has account scope; printer/device preference has device scope; policy cannot be overridden by a personal view. Store the source identity explicitly enough to explain inheritance.

Business save sequence: capture original context/revision → validate current authority/entitlement/dependencies → show meaningful impact if required → apply changed values and audit atomically → update subscribed consumers → report persisted/in-memory/conflict/failed result. No-op changes neither revision nor audit. Production performs authorization and atomicity on the server, including affected dependency revisions; browser data is never trusted authority.

Disabling parent features: show transitive dependents and active-obligation blockers; do not silently enable missing parents. Preserve dormant preferences and history. A subscription expiry recomputes access; it does not rewrite the user’s choices to false. Do not switch off banking or another required business flow merely to simplify navigation.

Navigation guard covers links, Back/Forward, module/scope/business/account switches, dialog close and programmatic navigation. Shared changes offer Save & continue / Discard & continue / Stay. Failed save stays in the original context. Native browser unload warning remains. Existing transaction Save Draft & Switch rules remain separate and intact.

## C2. ERP-wide names, helpers and Khata order

Naming and column order are separate controls. Stable semantic IDs retain the calculation and posting meaning. Never use global string replacement or infer a transaction type from its translated label/color.

| Preset | Left | Right | Appropriate preview |
| --- | --- | --- | --- |
| Accounting ledger | Debit · ডেবিট | Credit · ক্রেডিট | Account-aware debit/credit |
| Money movement | Money in · জমা | Money out · খরচ | Cash/Bank/MFS movement |
| Local party Khata | Credit · জমা | Debit · খরচ | Mohim-style party statement |
| Custom | User chooses label/helper and order independently | Corresponding actual values move together | Context selected explicitly |

Allow the owner’s requested custom Debit-left/Credit-right with helper text খরচ/জমা as presentation; do not call those universal accounting definitions. A helper may explain customer due increases/decreases rather than implying cash moved. Customer payment debits cash and credits receivable; a credit sale increases receivable without cash. Supplier, lender, borrower and owner relationships have their own context.

Term inventory: cash/bank/MFS money in/out; debit/credit; received/paid; customer due/receivable; supplier payable; advance received/paid; return credit/refund; vendor settlement/goods received/returned; owner investment/drawing; loan received/repayment; loan given/recovery; interest; discounts/waiver/adjustment; transfer/deposit/withdrawal; opening/running/closing/expected/counted/difference; revenue/expense/COGS/gross/net profit/loss; invoice/receipt/voucher/credit note/installment due. Each has editable English, Bangla and optional helper, scoped to its meaningful context.

Proposed editor limits: labels 1–60 trimmed characters; helpers 0–120; plain text only. These are implementation choices for approval, not existing commercial rules. Validate length, missing primary text and same-context duplicate labels; preserve stored prior valid labels on migration. Font/rows wrap rather than silently truncating numbers. Search includes canonical and customized aliases.

Apply resolution to tables, totals, phone rows, balance cards, forms, details, confirmations, report legends, print and human-readable exports. Human exports carry the chosen labels/order; raw/integration exports retain stable machine IDs and schema. Loan principal, transfers and owner drawing never become expense/revenue because of helper wording.

**Scope of wording:** custom English/Bangla names and helpers are business- or module-owned and require the explicit financial-terminology administration permission. An ordinary member may keep the existing personal Simple/Accounting display choice, choose a permitted preset and change their own column order; they cannot author custom names/helpers through My view. Personal display choices affect on-screen and explicitly labelled personal-view exports only. Official invoice/receipt/ledger/report output uses the authorized business/module terminology bound to its document profile. A one-off official wording override requires document-presentation authority and a linked audited revision; personal scope is never a way around it. The editor makes text fields read-only in My view and shows the inherited business wording.

Migration: existing Simple/Accounting preference resolves to a preset with identical visible meaning until customized. Legacy source keys remain compatible through one migration path; do not create a parallel global naming switch. Historical issued documents retain captured wording; new reports use the selected profile and show the period/context.

## C3. Views and module visibility

For each module inventory essential columns/actions, connected shortcuts and rich optional details separately. Essential identity, reference, date, monetary meaning/totals, warnings and source-safe correction remain accessible. Do not blanket-hide fields that serial/expiry/returns need.

My view changes presentation only. Business defaults affect inheriting members and do not erase their deliberate personal overrides. Hiding Profit does not revoke profit access; show a contextual Users & access link if the owner wants confidentiality. Permission-denied profit/cost is omitted from actual data payloads and all output paths in production.

Navigation visibility is not a transaction-policy switch. Settings, billing, security/recovery and support remain reachable. No arbitrary “hide all modules” action that strands the owner. Existing tablet defaults hide nonessential Items/Payment columns; a saved eligible view may override them without changing table fonts or control height.

## C4. Documents and printing

One **DocumentProfile** connects a versioned template, document family/kind, paper/orientation, language/digits, business branding, eligible columns/sections, signature/footer and terminology version. Renderers keep invoice, receipt, party-ledger and report semantics separate.

| Family/mode | Required initial designs | Restrictions |
| --- | --- | --- |
| Invoices | Standard A4; Classic and Compact additional Premium designs | Shared data, original item order, required references/totals |
| Receipts | Actual 80mm and 58mm support once verified | Do not offer a width that renderer cannot produce |
| Ledger statements | A4 portrait; landscape for wide ledger | Opening/period/closing meaning and repeated headings |
| Reports | A4 portrait summary; landscape wide-table | Title, period/as-of, scope, readiness and totals |
| Business Pad | Preprinted-paper mode | Suppress generated letterhead; supported margins/content start; realistic alignment preview |

Language is independent from app language: English / bilingual / Full Bangla. Translate system headings, totals, status, month labels and amount-in-words through actual locale helpers. Use stored Bangla names where supplied; preview lists missing data/fallback. Do not invent translations of names, references, serials or identifiers. English/Bangla displayed digits must preserve exact identifiers and leading zeros. Full Bangla is baseline language support on every plan; premium applies to extra designs/compositions.

Assignment precedence: shared branding → family default → module/document-kind assignment → report/party-relationship assignment → allowed one-off presentation override. Device printer preference cannot change official business content. Preview and print use the same validated data/profile. Incompatible template/paper/field combinations are refused with a useful correction.

**Legacy output without snapshots:** use an existing immutable PDF/image/original render snapshot when it exists and current access allows. When an older record has no original render evidence, generate a new snapshot from available source facts and an eligible current profile, visibly labelled “Reconstructed copy — original design unavailable” (localized). Show reconstruction time separately from the transaction/issued date and list missing historical wording/data where relevant. Never label today’s template or names as the original; do not invent old branding, reviewed status or a Premium template. Offer an eligible standard profile when historical design eligibility is unknown. This safe reconstruction keeps authorized old records printable without rewriting their source or claiming exact-original fidelity.

One-invoice display overrides may change permitted customer/product display aliases or supplied delivery/warranty/footer text. They are separately audited, labelled as display overrides and must not alter customer master data, product identity, amounts, tax, ledger side, unit conversion, warranty contract or posting. Required legal/source content cannot be concealed. An issued record keeps its original versioned render snapshot; a presentation correction creates a linked revision/derived document, never overwrites the original snapshot.

Paper QA: real dimensions/margins, Bangla font ready before print, long names/multi-units, repeated headers, page numbers, no clipped totals/blank last page, no navigation, useful monochrome. An A4 report is not squeezed into a thermal receipt. Browser Print/Save as PDF is acceptable in the UI phase; direct PDF/XLSX/image download must genuinely exist before a button claims it.

Numbering is domain-owned: define prefix preview, sequence scope/reset, concurrent uniqueness, future-only changes, immutable issued numbers and no reuse of void numbers. UI may preview this contract; it cannot guarantee uniqueness from browser counters.

Premium expiry: authorized historical documents retain their captured design for reprint; new output offers a standard eligible alternative. Reopening/reprinting rechecks current business/record/cost/profit authority. If an immutable report now contains forbidden data, deny that complete artifact; a redacted derivative is new, clearly labelled and does not inherit review status. Already-downloaded files cannot be retroactively revoked.

## C5. Roles and account security

Retain multiple roles and effective permission union. Separate view/edit settings, business defaults, feature toggles, sensitive financial policy, cost/profit data, invite/manage roles, billing, support configuration approval and document publishing. Add a new key only when no actual equivalent exists; owner-only default; explicitly migrate persisted owner arrays without broadening other roles.

Role editor: name → allowed capabilities → added/removed diff + affected members → required full reauth → Save. Delegated administrators cannot grant beyond their explicit grantable permission/scope ceiling. Protect last active owner and built-in role constraints; assigned custom role requires member reassignment before deletion. Role changes apply at the next protected action, including an already-open editor.

Account-owned security retains mobile sign-in, Google plus verified phone, Gmail OTP recovery then SMS fallback, optional **six-digit PIN**, **90-day** trusted-device authorization and **30-minute** optional inactivity lock. Multiple trusted accounts remain isolated. Last permitted business opens automatically; chooser appears only when needed. No editable security-window numbers copied from Magic Patterns.

Show Set/Change password and PIN-not-set/configured statuses; explain current/other session consequences. Full reauthentication uses the account’s supported method; do not force a new password for Google/mobile users merely because NestSherERP uses password confirmation. Never store real PIN/OTP/password in browser settings, backups, audit or logs. Cancelled auth keeps the settings draft and clears secrets. Ownership transfer/account closure remain non-mutating previews until their backend contract is delivered.

## C6. Feature and subscription matrix

These are separate axes: implementation readiness, business/account status, commercial benefit, employee/data permission, dependencies/capacity, then presentation. Entitlement never grants a role; a column preference never grants data authority.

| Capability | Free / Basic | Medium | Premium |
| --- | --- | --- | --- |
| Essential ordinary ERP workflows | Standard usable route | Same | Same |
| Cross-module name/reference links and contextual actions | Standard navigation alternative | Eligible connected shortcuts | Same connections |
| Optional information | Essential/common permitted set | Restricted operational set | Full implemented eligible rich set |
| Personal view | Within available capabilities | Within available capabilities | Can simplify eligible rich views |
| Identity/language/security | Available with proper authority | Same | Same |
| Full Bangla/basic readable print | Baseline | Baseline | Baseline |
| Extra invoice/print designs | Preview; apply by valid add-on/grant | Same | Included subject to catalogue |
| Existing individual report access | Preserve this release | Preserve | Preserve |
| New Business Review / bank packs | Proposed separate add-on/grant | Proposed separate add-on/grant | Proposed included benefit |
| Eligible Recycle Bin | 30 days | 30 days | 30 days; extension not finalized |
| SMS | Valid independently purchased/configured credits | Same + published inclusions | Same + published inclusions |
| WhatsApp, seats, devices, storage | Published eligible benefits | Published eligible benefits | Published eligible benefits |
| Staff package/offer/provider/verification tools | No tenant authority | No tenant authority | No tenant authority |

Product brief gives Medium ৳399 and Premium ৳599 as current pilot direction, Counter Pack ৳199 separately and 15-day trial. These are source data, not an instruction to publish prices or change plan IDs. Exact seats/devices/storage/SMS inclusion, repeat-trial eligibility, grace, fees/tax/proration and final new-pack prices remain commercial release decisions. Unknown quota says Not configured, never unlimited or zero.

Boolean benefits union across valid plan/purchase/trial/grants, bounded by scope and permission. Capacity floors combine by maximum; only explicitly additive purchased capacity adds by sum. Unknown base stays unknown; show known add-ons separately. Unlimited must be explicit. SMS/WhatsApp credit lots/reservations are separate ledgers, not maximum capacity. Never reset credits on plan rename. Quoted/purchased terms are immutable version snapshots, including expiry and capacity.

Expiry end is exclusive (`now >= expiresAt`): injected clock in preview, server time in production, Asia/Dhaka display. Keep dormant preferences/history; stop only newly unavailable use. Retain any independently valid purchase. Do not delete attachments, silently disable staff or remove the last owner on downgrade.

Availability copy distinguishes Paid benefit required / Ask owner for permission / Dependency disabled / Limit reached / Temporarily available until… / Not connected. Keep one short upgrade entry, not a wall of locked toggles. Failed verification never unlocks; verified but activation failed says activation pending and does not request another payment.

## C7. Support, packages, messaging and recovery

**Support:** keep ticket context. Engineer proposes exact before/after, target business/user/module, reason and scope. Owner approves a **15-minute, single-use** configuration request; engineer may apply only the reviewed patch with matching revisions/authority. Consumed, expired or revoked consent cannot be reused. Initial patches affect presentation only; no transaction, role, costing, security, payment or grant authority. Undo checks that the changed values are still the ones support wrote; never overwrites newer owner edits. Keep public/private messages isolated.

**SaaS:** retain the approved five tenant tabs: Overview / Settings / Plan & Usage / Support / History. Package/offer builders, grants and provider controls remain staff-only with separate permissions. Package drafts need typed benefits, eligibility, price/duration, snapshot/version and preview; publishing has its own permission. Staff complimentary grants are distinct from verified paid fulfillment; no fake payment. Diagnostics is a protected Support panel, not merchant technical Logs. Full commerce/provider implementation stays in the existing SaaS plans.

**Messaging:** one notification/event/template source. Show sender/connection/template state, recipient/contact/consent requirements and actual segment/cost preview where integration supports them. Tenant sees balance/buy/history; staff configure provider and prices. Missing service is Not connected, never fake Connected/Sent. Real secrets stay server-side. Manual authorized document sharing is separate from automated SMS/WhatsApp billing.

**Recovery:** 30 days on every plan for eligible drafts/notes/unused masters with dependency/duplicate checks. Transaction-linked masters archive. Posted sale/purchase/expense/payment and ledger entries use their source-linked reversal/correction, never ordinary Bin restore. Draft restore preserves identity, is retry-safe and posts no stock/money. Recycle Bin list/preview respects record/data access. No generic merchant Reset demo or destructive Empty Bin.

---

# Part D — Reports boundary and migration

## D1. Business Review belongs in Reports

Settings stores default period/sections/language/template and access configuration. **Reports → Business Review** generates and manages the actual prepared documents. Do not add monthly report forms to ERP Settings.

| Output | Requirement |
| --- | --- |
| Short owner summary | One information-rich overview: sales, supported profit, expenses, cash, receivable/payable, stock and useful priorities; expandable detail |
| Detailed monthly/yearly review | Optional 4–5-page A4 pack; top-selling/profitable/ordered products, buying customers, suppliers, dues/payables, expenses and finance summaries with useful graphs |
| Historical profit schedule | Monthly rows across 24 months or selected dates, annual totals and source-supported COGS/expenses; missing months/cost explicitly incomplete |
| Bank/business pack | As-of stock statement, profit schedule, balances, loans/capital and selected supporting schedules; completeness and review metadata |

One Monthly / Yearly / Custom period control with real calendar/range picker, not separate monthly/yearly engines. Provide source drilldowns, readiness check, preview, saved history and print/export through the shared profile contract. Charts support the information; do not add meaningless pie/bar/line charts only to fill every page.

Use historical transactions/cost evidence and stock movement/snapshot reconstruction; current stock is not proof of stock two years ago. Partial history cannot be reported as zero or extrapolated into a complete 24-month schedule. A generated pack is not an independently audited or bank-certified statement. Keep distinct from existing Audit Ledger activity/correction history.

Settings launch does not wait for this reporting engine. T16 is a companion workstream with its own data-contract gate and build plan; its catalogue entries are unavailable until implemented.

## D2. Preservation and migration rules

1. T1 produces a field-to-consumer inventory for all existing controls and special sections. Map each value to preserve/migrate/preview; remove none silently.
2. Read old personal Simple/Accounting/date keys through the existing migration; do not run two competing migrations. Preserve legacy data before a write and retain a compatible settings backup route.
3. Map old central module routes to canonical local panels; keep route query, selected record and `returnTo` context. No orphan deep links.
4. Preserve multiple-role membership and all explicit permission grants; add new administrative authority only to protected owners or mapped equivalents. Review any newly protected cost/profit data change explicitly.
5. Commercial IDs and purchased snapshots stay exact. Resolve aliases for presentation only. Never rewrite invoices or purchased benefits by lowercasing a plan display name.
6. Migrate document preferences only to supported equivalent profiles. Unsupported paper/template choice retains the stored intent with a repair message; do not silently choose and issue a different document.
7. Keep existing report catalogue access in this release; report product activation is a separate change. Optional interface gates have an exact approved key/baseline alternative and test before activation.
8. Preserve approved recovery/diagnostics requirements that earlier standalone plans accidentally omitted; deliver them in their own bounded slice.
9. Roll back a defective UI slice without reversing posted transactions or deleting new audit/history. Keep schema readers compatible; reverting a package never erases commercial evidence.

## D3. Delivery gates

| Gate | Evidence required |
| --- | --- |
| Design | This consolidated design reviewed, unresolved release policy recorded and selected screen composition approved |
| UI slice | Saved setting demonstrably changes its real local preview consumer; error/conflict/restricted states pass |
| Production integration | Authenticated tenant/member context; server value/permission/entitlement checks; atomic writes/audit; real services |
| Commercial activation | Exact capability matrix/catalogue/migration, purchase snapshots and expiry/verification behavior approved |
| Documents | Actual preview/print parity, paper dimensions/Bangla/multi-page checks, access-filtered output and snapshots |
| Release | Required checks pass or pre-existing failures explicitly bounded; desktop/tablet/mobile evidence; owner review before merge |

---

# Part E — Implementation roadmap

## E1. Phases and independently reviewable deliverables

| Phase | Tasks | Visible result | Depends on |
| --- | --- | --- | --- |
| 1. Preserve and unify | T1–T3 | Settings shell, search and local/central save parity | Design approval |
| 2. Names and module views | T4–T6 | Khata presets/custom names/order and real module Settings | Phase 1 |
| 3. Documents | T7–T9 | Multiple templates, Full Bangla, ledgers/reports, Business Pad | T2/T4/T5 |
| 4. Administration | T10–T11 | Clear roles/security and safe eligible recovery | T1–T3 |
| 5. Commercial/support | T12–T14 | Consistent eligibility, staff packages/offers, support changes and messages | Shared contracts; existing SaaS plans |
| 6. Release | T15 | Verified responsive/accessibility/print/migration behavior | Shipped Settings slices |
| Companion Reports | T16 | Business Review and bank/profit packs | T7–T9 + historical data readiness; separate implementation approval |

Tasks describe UI-preview implementation unless explicitly marked production integration. Do not run backend work in `hisabiq_ui`. Do not build all infrastructure first; finish Party/Ledger local edit → save → consumer → print parity before expanding modules.

## E2. Planned file boundaries

Existing files to extend: `src/settings/{model.ts,fields.ts,TenantSettingsProvider.tsx,TenantSettingsPage.tsx,TenantSettingsHub.tsx,settingsHub.ts,ui.tsx,TeamSettings.tsx,AccountSecuritySettings.tsx,DataSettings.tsx}`, navigation registry, actual module pages and existing receipt/statement/report output adapters.

Proposed new files, subject to checking current head: `src/settings/catalog.ts`, `changePolicy.ts`, `ModuleSettingsPanel.tsx`, `InterfaceSettings.tsx`, `FinancialTerminologySettings.tsx`, `DocumentDesignSettings.tsx`; `src/experience/{types.ts,catalog.ts,resolve.ts}` as in the existing repository roadmap; `src/financial-display/{types.ts,terms.ts,resolve.ts}`; `src/documents/{types.ts,templateCatalog.ts,resolveProfile.ts,DocumentPreview.tsx}`. Keep small related helpers together; do not create a provider per setting.

Reuse the existing planned `src/recovery/` and `src/support-configuration/` contracts if present when implementation starts. SaaS types/data remain in their owning existing directories. Tests and focused browser scripts are listed by task below. Proposed file names do not mean those files already exist.

### T1. Preservation inventory, source baseline and explicit migration

**Files:** extend `docs/settings/README.md`; create `docs/settings/settings-consumer-map.md`; inspect existing model/fields/provider, navigation, product brief, current experience/commercial plans. Tests: `tests/settingsMigration.test.ts` and existing `tests/tenantSettings.test.ts`.

**Interfaces:** produces one inventory row per stable key: `{key, currentValuePath, scope, consumerPath, readiness, permission, migration, test}`; canonical old-route→new-route map; exact interface capability map with standard Free alternatives. Keep existing `save` API intact.

- [ ] Pin current main/artifact; inspect instructions and actual exports. Map all 61 ordinary controls plus Team/Data/Personal/Security and distributed module preferences.
- [ ] Add failing migration assertions: `migrated.roles === original.roles` structurally; each old value retained; Simple/Accounting maps without visible meaning change; unknown privilege not granted.
- [ ] Run `node --experimental-strip-types --test tests/settingsMigration.test.ts tests/tenantSettings.test.ts`; record intended failures.
- [ ] Implement only required version migration/metadata; mark consumer gaps Preview/Unavailable. Update conflicting old plan references and list superseded sections.
- [ ] Run targeted tests; commit `docs/settings: consolidate preservation and migration contract` with any required small migration code. No commercial gate activation yet.

### T2. Shared scope, change policy and conflict-safe saves

**Files:** extend provider/model; create `src/settings/changePolicy.ts` and the minimal shared `src/experience/{types.ts,resolve.ts}` prerequisite; tests `tests/settingsChangePolicy.test.ts` and `tests/effectiveBenefits.test.ts`.

**Interfaces:** `previewSettingsChange(context: SettingsChangeContext, patch: SettingsPatch): ChangeImpact`; `applySettingsChange(context: SettingsChangeContext, patch: SettingsPatch, expectedRevision: number): SettingsChangeResult`. Define types together in `changePolicy.ts`; result discriminates `saved | memoryOnly | noop | invalid | forbidden | conflict`. Context captures original tenant/actor/scope; a preview adapter is not auth. Also produces `resolveEffectiveBenefits(snapshot, scope, now): EffectiveBenefits` from existing benefit records: valid source/scope/start/end, Boolean union, declared capacity combination and reason. This minimum resolver is required by T6; T12 extends its catalogue/migration and billing UI rather than creating another resolver.

- [ ] Pin prerequisite benefit tests: plan plus valid scoped add-on/grant union; role permission still independent; exact expiry; unknown quota preserved. Implement this minimum shared resolver in this task before T6, with no commercial gate activation.
- [ ] Add tests `failedBatchWritesNothing`, `noopKeepsRevisionAndAudit`, `dependentChangeUsesExpectedRevision`, `businessSwitchCannotRetargetPendingSave`, `memoryOnlyIsNotPersistedSuccess`.
- [ ] Assert conflict leaves draft intact, audit length unchanged and latest state unchanged. Run `node --experimental-strip-types --test tests/settingsChangePolicy.test.ts tests/effectiveBenefits.test.ts`; expect fail before implementation.
- [ ] Implement validation/permission/dependency preview and adapter through the existing save boundary. Only store changed keys; protect unknown values and reset-by-deletion semantics.
- [ ] Pass targeted tests and `npm test`; commit `feat(settings): unify scoped save and impact handling`.

### T3. Settings shell, bilingual search and module entry

**Files:** existing page/hub/search/navigation; create `ModuleSettingsPanel.tsx`, `catalog.ts`; tests `tests/settingsNavigation.test.ts`; new `scripts/settings-redesign-browser.cjs`.

**Interfaces:** `ModuleSettingsPanel({moduleId, returnTo})` composes canonical editor; `searchSettings(query: string, context: SettingsSearchContext): SettingsSearchResult[]` exposes path/key/focus target, never protected values. Types live with catalogue.

- [ ] Test aliases/deep links, Bangla/custom term search, permission filtering and local/central identity; `localSave.key === centralRead.key` and exactly one change event.
- [ ] Test dirty Back/Forward/scope/module/business changes, failed Save & continue, search clear/focus and restored parent filters/draft. Run targeted Node tests; confirm fail.
- [ ] Implement one section selector/grouped index, reusable panel and deterministic search-to-field focus. Reuse shared tabs/dialog; preserve old links and restore context.
- [ ] Run `npm run test:settings-hub`, `npm run test:settings` and `node scripts/settings-redesign-browser.cjs`; commit `feat(settings): add compact shell and module settings entry`.

### T4. Financial term registry and safe migration

**Files:** create `src/financial-display/{types.ts,terms.ts,resolve.ts}`; extend current accounting-label/i18n helpers rather than competing replacements; test `tests/financialTerminology.test.ts`.

**Interfaces:** `resolveFinancialTerm(termId: FinancialTermId, context: FinancialDisplayContext, profiles: FinancialDisplayProfiles): ResolvedFinancialTerm`; context includes module, account/party relationship and locale. IDs defined as a closed union; output includes primary/Bangla/helper/source.

- [ ] Test separate cash/customer/supplier/owner/lender/borrower contexts, presets, fallback and 60/120-character validation; old Simple/Accounting migration; no HTML execution.
- [ ] Assert label changes preserve original transaction type/amount and cash/receivable classification; credit sale has no inferred cash. Run `node --experimental-strip-types --test tests/financialTerminology.test.ts`; intended fail.
- [ ] Implement complete inventory C2 with existing locale helpers, shared resolution and aliases; no arithmetic in resolver.
- [ ] Pass new and existing party/accounting tests; commit `feat(settings): add context-aware financial terminology`.

### T5. Names & Khata editor and whole-column layout

**Files:** create `FinancialTerminologySettings.tsx`; extend Party/Finance/Accounts/Daybook and responsive consumers; tests `tests/financialColumnLayout.test.ts`; browser `scripts/financial-terminology-browser.cjs`.

**Interfaces:** `financialColumnOrder(context: FinancialDisplayContext, profile: FinancialLayoutProfile): readonly FinancialColumnId[]`; IDs stable; rendering uses column definitions with cells/totals as one unit. Editor consumes T4 and T2.

- [ ] Pin asymmetric values: debit 1250, credit 430, balance 820 in an appropriate account fixture; both column orders keep values under correct semantic header and totals. Include cash/customer/supplier previews.
- [ ] Test headings/cells/totals/mobile/details/confirmations/human export move together; raw schema unchanged. Run both targeted Node tests; intended fail.
- [ ] Implement preset-first English/Bangla/helper editor, independent order, My view (preset/order only) versus authorized business/module custom text scope, reset and optional sample preview. Official print ignores personal wording/preset overrides and uses its authorized profile. Connect each identified consumer; list any remaining gap explicitly.
- [ ] Run new browser test plus `npm run test:party-ledger`, `npm run test:bangla-accounting`, `npm run test:bangla-finance`; commit `feat(settings): deliver names and khata controls across ledgers`.

### T6. Module view/default controls and supported policy states

**Files:** create `InterfaceSettings.tsx`; extend experience catalogue/resolver and B2 module consumers; test `tests/moduleSettingsScope.test.ts`, `tests/erpExperienceConsumers.test.ts`; browser `scripts/module-settings-browser.cjs`.

**Interfaces:** use existing roadmap `accessFor(snapshot, capabilityKey)` and `visibleColumns(snapshot, moduleId)` through one shared implementation. Return availability/reason separately from enabled preference. `resolveModulePresentation(context, overrides)` returns values plus inheritance sources.

- [ ] Test essential columns/warnings cannot disappear, My view affects one scope, business defaults respect personal overrides, reset removes only target overrides, navigation hiding does not revoke/grant authority.
- [ ] Assert Medium contextual link eligible but Premium detail unavailable; role-denied profit absent; own presentation never grants entitlement. Run targeted tests; intended fail.
- [ ] Deliver in batches: Party/Finance already proven → Sales/Purchases/Products/POS/Counter → Expenses/Daybook/Reports → other supported modules. Extend existing Product Settings, never duplicate master editors.
- [ ] Specify Block/Warn/Allow expired-stock policy only with the actual transaction consumer/override authority. Keep unimplemented policy controls accurately unavailable; warranty works without blanket serial prerequisite. Costing remains unchanged until its owning domain contract resolves physical issue versus valuation.
- [ ] Run focused module scripts from current package.json for each touched batch, including POS/multi-unit/purchase/counter regressions; commit each independently reviewable module batch.

### T7. Versioned document profiles and renderer adapters

**Files:** create documents types/catalog/resolver/preview; extend existing receipt/PartyStatement/report adapters; test `tests/documentProfiles.test.ts`.

**Interfaces:** `resolveDocumentProfile(request: DocumentProfileRequest, context: DocumentAccessContext): DocumentProfileResolution`; assignment fields `{moduleId, documentKind, reportKey?, relationship?}`; return valid profile or typed incompatible/forbidden/unavailable reason. `DocumentRenderSnapshot` captures template/profile/terminology versions and permission-filtered data.

- [ ] Test C4 precedence, unsupported paper/family refusal, changed template creates new version, old snapshot unchanged, legacy no-snapshot reconstruction labelled without fabricated original design, device choice cannot override business content; forbidden cost/profit absent from data and preview.
- [ ] Assert `snapshotAfterDefaultChange === originalSnapshot` structurally; issued output references immutable version. Run targeted Node test; intended fail.
- [ ] Implement minimal typed profiles over existing renderers, initially Standard invoice and Party statement end to end; no generic HTML editor or template engine dependency.
- [ ] Run profile tests and existing receipt/report-print checks; commit `feat(documents): unify versioned print profiles`.

### T8. Template library, Full Bangla and Business Pad

**Files:** create `DocumentDesignSettings.tsx`; extend template catalogue/renderers and locale/amount words helpers; test `tests/documentLanguage.test.ts`, `tests/documentPaper.test.ts`; browser `scripts/document-designs-browser.cjs`.

**Interfaces:** `<DocumentPreview profile={profile} data={authorizedData} />` uses the same renderer as print; catalogue declares supported families/papers/languages/entitlement. Business Pad adds explicit header suppression and supported geometry.

- [ ] Test Full Bangla system strings and missing-name fallback, exact leading-zero identifiers, amount words, long compound-unit rows, Standard/Premium preview/apply distinction and actual 58/80mm/A4 CSS.
- [ ] Assert a bank landscape schedule rejects thermal mode; app dark theme still prints readable light document; width choice changes actual page rules. Run targeted tests; intended fail.
- [ ] Implement Standard + two additional branded A4 invoice designs, supported thermal receipts, portrait/landscape ledger/report profiles and pad alignment preview with existing brand components.
- [ ] Render short/long/multi-page samples; verify fonts, breaks, totals, headers/page numbers and monochrome. Pass browser/unit checks; commit `feat(documents): add Bangla templates and business pad mode`.

### T9. Safe one-document overrides, numbering and historical output

**Files:** invoice presentation editor and document profile/output adapters; tests `tests/documentHistory.test.ts`; extend document browser script.

**Interfaces:** `createPresentationRevision(sourceSnapshot, allowedPatch, context)` returns linked immutable derived snapshot or denial; allowedPatch is closed cosmetic fields only. Domain numbering port remains a separate owner service, not Settings arithmetic.

- [ ] Test edits cannot change money/master records/source IDs or original snapshot; numbering preview future-only; issued numbers never regenerated by print.
- [ ] Test current access revoked after generation, expired premium design reprint, draft choosing eligible standard alternative without loss, redacted derivative has no inherited review status. Run targeted test; intended fail.
- [ ] Implement permissible override UI/audit, historical-version selection and current permission checks. Mark backend numbering guarantees unavailable until owning service exists.
- [ ] Verify standard/premium history and cost/profit-denied print/download paths; commit `feat(documents): preserve history and audit presentation revisions`.

### T10. RBAC/custom roles and approved security UX

**Files:** existing TeamSettings/model/AccountSecuritySettings/auth previews; test `tests/settingsAccess.test.ts`, `tests/roleChangeImpact.test.ts`; existing auth/settings browser scripts.

**Interfaces:** `previewRoleChange(currentRole, proposedRole, members, actorAuthority): RoleChangeImpact`; result added/removed permissions, affected members and blocker. Existing effective multi-role combination preserved. Security uses existing account context and full-auth handoff, never browser secrets.

- [ ] Test multi-role preservation, grant ceiling, assigned-role reassignment, last-owner protection and new owner-only permission migration; removed permission affects next save/export from open screen.
- [ ] Test six-digit identifier including leading zero/Bangla input normalization, fixed 30-minute/90-day windows, account isolation, passwordless full auth/cancel and Set/Change status. Run targeted tests; intended fail.
- [ ] Implement underline Team/Roles views, accessible capability groups and meaningful impact review; keep security account-owned and honest preview until real services.
- [ ] Run `npm run test:settings`, `npm run test:auth-settings`, `npm run test:auth-login`; commit `feat(settings): refine access and account security flows`.

### T11. Data, settings backup and eligible recovery

**Files:** existing DataSettings/import links; planned `src/recovery/{types.ts,previewAdapter.ts,RecycleBinPage.tsx}` and actual draft stores; test `tests/recoveryPreview.test.ts`.

**Interfaces:** reuse existing roadmap RecoveryPort; `restore(recordId, expectedRevision)` checks actual domain state. No second unrelated demo recovery list.

- [ ] Test eligible draft delete→Undo/Restore keeps identity, retry idempotence, exact 30-day deadline expiry, duplicate identifier conflict, tenant/data scope and draft restoration with zero posting effects.
- [ ] Assert posted transactions never eligible, linked masters archive and all plans get basic recovery. Run targeted Node test; intended fail.
- [ ] Deliver first real draft adapter, search/deadline/reason states and settings-only backup/restore diff; preserve existing import previews without claiming product import succeeded.
- [ ] Run recovery browser journey and existing settings/import checks; commit `feat(settings): add safe draft recovery and precise backup flows`.

### T12. Shared benefits, plan/usage and exact commercial migration

**Files:** existing SaaS benefit/subscription stores and tenant subscription surface; experience resolver; test `tests/effectiveBenefits.test.ts`, `tests/experiencePolicy.test.ts`.

**Interfaces:** Extend the T2 `resolveEffectiveBenefits(snapshot, scope, now): EffectiveBenefits` implementation; it supplies source/end/capacity/reason to Settings and consumers; `accessFor` combines it with role/data/dependency checks, not just plan name. Keep existing commerce ports from the repository plans.

- [ ] Test Boolean union, floor maximum + declared additive capacity, member-scoped grants, unknown/unlimited, exclusive expiry, purchased snapshot stability and independent report/SMS benefits.
- [ ] Test Free standard route, Medium link/Premium detail separation, grandfathered terms, existing report preservation, live downgrade updates and no preference deletion. Run targeted tests; intended fail.
- [ ] Reconcile exact capability keys and aliases against owner decisions; activate only mapped approved interface gates. Add current-plan/usage/availability UI without self-upgrade fixture controls in merchant view.
- [ ] Exercise pending/partial/rejected/verified-but-unfulfilled payment and activation retry using existing preview records; no new provider integration. Pass relevant SaaS/settings journeys; commit `feat(settings): unify benefit availability and plan views`.

### T13. Staff package/offer and exact support-change flow

**Files:** existing SaaS package/offer/grant/support surfaces; planned `src/support-configuration/`; tests `tests/packageTerms.test.ts`, `tests/supportConfiguration.test.ts`.

**Interfaces:** reuse existing SaaS commands/permissions. `applyApprovedConfiguration(requestId, expectedRevision, now)` applies only approved target/patch once; snapshot captures all quoted terms, including capacities and credit expiry.

- [ ] Test tenant cannot publish/verify/grant; staff edit versus publish permissions; no package edit mutates old quote; complimentary grant distinct from paid activation.
- [ ] Test exact target/patch, 15-minute boundary, approval owner-only, single use, revoke, revision change, forbidden key and Undo after owner edit refused. Run targeted tests; intended fail.
- [ ] Adapt Magic Patterns builders and consent cards through existing stores/primitives; retain five tenant tabs; support presentation-only initial scope. Technical diagnostics stays protected SaaS Support panel with redaction/no replay mutation.
- [ ] Run SaaS/support browser journeys; commit bounded package and support slices separately. Follow the existing commerce/diagnostics backend plans for real integration, not this UI task.

### T14. Canonical notifications and messaging state

**Files:** current notifications editor/stores, Settings summary/routes and staff provider/SMS surfaces; test `tests/settingsMessaging.test.ts`.

**Interfaces:** one shared event/template/channel source; channel status and credit/billing ports remain from existing SaaS commerce plan. No tenant provider-secret field.

- [ ] Test central/module notification parity, missing connection/sender/credit reasons, role limits, honest unknown delivery, no fake Sent/Connected and manual document-share separation.
- [ ] Assert unsupported send cannot debit credits or create delivered state. Run targeted test; intended fail.
- [ ] Add concise channel/template/balance status and correct canonical links, extending current UI without parallel provider/notification stores.
- [ ] Run `npm run test:bangla-notifications`, relevant existing fulfillment/SMS preview tests and SaaS/settings checks; commit `feat(settings): consolidate notification and messaging controls`.

### T15. Release verification and handoff

**Files:** focused scripts from T3/T5/T6/T8, shared component specimens, guide/inventory and Settings README.

**Interfaces:** consumer coverage map reconciles every B2 module and C2 naming/output path to implemented/tested/deferred evidence. Deferred entries are not advertised Live.

- [ ] Check T1 preservation map against all delivered consumers and migrations; no missing user requirement silently dropped.
- [ ] Run `npm test`, `npm run build`, `npx tsc --noEmit`, changed-file lint, `npm run check:ui-contract`, `node scripts/sync-design-guide.cjs --check`; list actual failures and pre-existing baseline separately.
- [ ] Run relevant `test:settings`, `test:settings-hub`, `test:field-size-parity`, `test:table-typography`, `test:motion-navigation`, `test:theme`, touched module and print scripts from refreshed package.json; do not blindly rerun unrelated ERP workflows.
- [ ] Execute the matrix E3; inspect actual rendered screenshots/output. Verify no whole-page overflow, no clipped money/Bangla, no hidden permission leak, no draft loss and no fake status.
- [ ] Update visual component specimens/guide only for actual shared additions, regenerate inventory, record commands/results/limitations and provide preview/print evidence for owner review. Commit docs/evidence; request merge review, never auto-merge.

### T16. Companion Reports → Business Review

**Files:** current Reports workspace/catalogue/data adapters and shared documents profiles. Create a separate `2026-10-27-business-review-design.md` and build plan in Reports workstream before product implementation; reuse existing reporting requirements rather than inventing another engine.

**Interfaces:** `getBusinessReviewReadiness(period, requestedSections, context)` returns source coverage/missing evidence; `buildBusinessReview(authorizedSourceData, options)` produces canonical sections and provenance; shared renderer consumes authorized immutable report snapshot. These proposed signatures are specified further in the companion plan before coding.

- [ ] Map each D1 figure to actual source and historical-cost/stock capability; distinguish absent, incomplete, zero and sample. Do not build a summary by summing current invoice totals alone.
- [ ] Pin acceptance fixtures: requested 24 monthly rows with missing months marked incomplete; historical stock based on movements/as-of evidence; returns/expenses/loan/capital separate; unauthorized profit omitted; all totals reconcile to source schedules.
- [ ] Plan Monthly/Yearly/Custom calendar → sections/output → readiness → preview → save/print, source drilldown and history, with short owner summary and optional detailed pack.
- [ ] Add new Premium/add-on benefit descriptors only when actual workflow exists; keep existing individual reports intact. Test revoked data authority on history/reprint and missing-data warnings in print.
- [ ] Deliver through its own approved Reports plan and focused tests. Settings completion does not claim this module complete.

## E3. Test and acceptance matrix

| Dimension | Required profiles |
| --- | --- |
| Viewports | 320px reflow, 360/390px phones, 768px portrait tablet, 1024px landscape, 1440px desktop; on-screen keyboard and 200% zoom |
| Language/theme | English, Bangla, bilingual × light/dark: six modes; primary 390/768/1440 flows give 18 core profiles, plus focused boundary widths |
| Actors | Owner, delegated manager, multi-role cashier/accountant, view-only, restricted cost/profit; separately scoped SaaS support/billing/platform owner |
| Commercial | Free, Medium, Premium, trial, valid add-on, temporary grant, expired, over-limit, unknown quota, verified activation pending |
| Persistence | First load, valid legacy state, invalid storage, full/unavailable storage, two tabs, reset, failed/partial request, conflict, retry |
| Navigation | Local↔central parity; search→field; Back/Forward; scope/module/account/business switch; preserved transaction/list context |
| Financial display | Both orders, asymmetric totals, customer/supplier/cash/loan/owner, zero/negative/advance/refund, long custom words, human/raw exports |
| Documents | A4 portrait/landscape, 58/80mm supported output, Business Pad, short/long/multi-page, Full Bangla fallback, original snapshots and permission change |
| Accessibility | Visible focus, labelled errors, tab arrow keys/ARIA, nested dialog Escape/return, clear/search, non-color cues, reduced motion, readable contrast |
| Domain regression | POS V2, multi-unit chains, split payments, shortage handling, return/warranty/expiry semantics, source-linked ledger corrections |

Definition of done per control: discoverable at the correct scope; saves through the canonical path; actual declared consumer reacts; permission/entitlement/error/conflict/reset work; responsive/language/theme behavior is verified; print/export follows it when relevant; limitations accurately stated.

## E4. Remaining decisions and sequencing

These are release-blocking only for their owning features; they do not block shell, existing settings preservation, terminology or standard document design work:

- Final commercial quotas, taxes/fees/grace/proration/credit-expiry and new pack prices must come from published business policy.
- New financial-policy values/costing method transitions need the owning accounting/stock contract and historical treatment before enabling their controls.
- Real SMS/payment providers and credentials remain the separate backend integration choice.
- Reports need confirmed historical source coverage before promising 24 complete profit months or historical stock.
- Production data retention/account closure/recovery purge rules need their own explicit service policy; no destructive local substitute.

Design choices made here for review: on-demand central section index instead of a second permanent sidebar; Party/Ledger as the first complete module slice; preset-first term editor; 60/120-character term/helper limits; optional previews; existing report catalogue preservation; new Business Review/bank packs proposed Premium; Standard + two additional premium A4 designs; native sequential execution after approval.

---

# Part F — Magic Patterns redesign brief

Use this brief after the consolidated design is approved. It is prepared for the existing HisabIQ editor, not a request to create a new unrelated brand. Before generation, recheck current status/active artifact, preserve the version history and ensure the selected account can edit the target project. Read-only access does not establish write ownership. Do not send multiple paid generations for one requested concept.

> Redesign only HisabIQ Settings using the current complete HisabIQ Brand Guide v2.2 and Visual Component Library already in this project. Combine the useful SettingsWorkbench/InterfaceSettings composition with the working GitHub settings flows and the consolidated roadmap supplied below. GitHub remains implementation source of truth. Reuse source-faithful `hisabiq-library` controls for this prototype; its adapters stay prototype-only. Do not create another Button/Input/Dialog/theme or copy demo stores into production.
>
> Keep the existing ERP AppShell. Create one compact Settings header with searchable section selector and optional grouped index, avoiding a second permanent sidebar and long tab strips. Groups are Business, Administration and My account. Module settings remain available inside every module through existing Party Ledger underline navigation. Central search opens the same editor and value; never duplicate a configuration form/store. Use headings for View, Names & layout, Defaults and Print; tabs only for real peer panels.
>
> Follow 36px ordinary controls, quiet 13px regular input values, 13px labels, 13/12/11 table scale, Geist/Hind Siliguri, proportional digits, current Ink/Teal/Mint semantic tokens, intrinsic switches and 2px underline tabs. No filled navigation pills, oversized form fields, hardcoded white light-only surfaces, monospace numbers or decorative settings dashboards. Provide light/dark and English/Bangla/bilingual behavior, compact phone/tablet/desktop layouts, keyboard focus and error/retry/dirty states.
>
> Design these representative connected screens: (1) central Business profile and settings search; (2) Parties → Settings showing names preset, independent Debit/Credit order, My view/Business default and optional real sample ledger; (3) Names & Khata searchable English/Bangla/helper editor grouped by cash/customer/supplier/loans/capital; (4) Documents library with Standard/Premium A4 designs, thermal support, Business Pad, independent Full Bangla language, eligible sections and preview; (5) Team/Roles with affected-user/permission diff; (6) existing Plan & billing summary with truthful availability; (7) Data & recovery with 30-day eligible draft recovery.
>
> Custom wording is business/module-owned and permission-controlled; My view only changes permitted display presets/order and never official document wording. Older documents lacking an original snapshot use a clearly labelled reconstructed copy, never a fabricated original. Naming/order must never change accounting. Keep Cash money in/out distinct from Party debit/credit; move entire columns with data/totals and show asymmetric sample values. Owner drawing/loan principal/transfers are not expenses/revenue simply because custom helpers say খরচ/জমা. Explain missing Bangla content in print preview, preserve exact IDs/serials and immutable issued-document versions. Safe one-invoice display overrides never edit master data or financial facts.
>
> Preserve multiple roles, owner protection and delegated grant limits. Account security belongs to the person: six-digit optional PIN, 30-minute optional inactivity lock, fixed 90-day device trust, Google/mobile/full-auth handoff. Do not make security timing numeric controls. Never store real secrets or claim production authentication.
>
> Use Free standard navigation/workflows, Medium connected shortcuts, Premium eligible rich optional information; role permission always wins. Keep existing individual report access for this Settings release. New Business Review/bank packs and extra premium designs may have accurate previews/eligibility. No self-upgrade plan selector, invented quotas or fake payment activation. Staff package/offer/grant/provider tools stay in SaaS; merchant sees only eligible offers/status. Technical logs remain SaaS-only. Support changes require an exact presentation-only patch with owner approval, 15-minute single-use scope, revision check and conditional Undo.
>
> Personal appearance saves instantly; shared/business edits use one Save/Discard area, with impact review only when meaningful. Preserve drafts and current module context on Back/scope/business change. Show unavailable services honestly, keep legitimate controls functional at labelled preview level, and include blocked/conflict/loading/empty/restricted states. Do not implement new costing or stock/accounting rules.
>
> Reports → Business Review is a separate reporting workflow. In Settings show only default period/sections/document-profile assignment and link to Reports. Monthly/yearly/custom summaries, 24-month profit schedules and bank stock packs are generated there, with historical-data readiness and source evidence. Do not add report generation forms to Settings.
>
> Deliver a focused reviewable Settings design and representative local-module screens using clearly labelled sample data. Preserve unrelated ERP modules and the Brand Guide. Show what changed, component sources reused and any prototype limitation. Production porting follows the approved task roadmap and real GitHub components.

## Plan-review record

Prepared from current-source checks and prior saved plans. A fresh Superpowers builder review identified three consequential gaps: legacy no-snapshot document handling, personal-versus-business wording authority and the early benefit-resolver dependency. This revision resolves all three explicitly in C2/C4 and T2/T5/T7/T12. Structural self-check confirmed all 16 tasks, six document parts and future checklists are present. No application tests listed as future tasks have been represented as executed. Application implementation and live Magic Patterns generation await the design review gate.
