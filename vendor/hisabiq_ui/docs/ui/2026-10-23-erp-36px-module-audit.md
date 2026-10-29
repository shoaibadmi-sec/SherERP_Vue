# HisabIQ ERP — deep module-by-module 36px control audit

**Date:** 23 October 2026  
**Baseline:** `main`, squash merge `47e9037` (PR #198, universal 36px)  
**Follow-up:** branch `audit/erp-36px-components-20261023`  
**Status:** source review and targeted cleanup completed; PR Fast CI, including a live Playwright size check across 22 routes at 390/768/1440px, passed. Native controls and opened subdialogs still require targeted visual review.

## What "36px universal" means

The ERP's standard single-line interactive control is **36 CSS px tall** on phone, tablet and desktop, with the existing theme, visual weight, handlers, keyboard interaction and bilingual labels preserved.

**Includes:** primary/secondary/outline buttons, icon-only standalone actions (36×36), text/number/search inputs, native/selectable combobox triggers, date-picker triggers, standalone payment controls, and the outside border of compound amount/unit fields.

**Internal and content exceptions (not independent 36px peers):** checkbox/radio circles, stepped number-arrow halves, drag handles, in-field quick-clear icons, calculator keys, multiline textareas, full-card clickable regions, whole-row navigation surfaces, rich two-line suggestion rows, calendar day grid and the inner subfields of joined editors. These must not be made 36px with a blanket selector; inspect their outer control instead.

**Accessibility:** 36px visual controls can have insufficient touch targets where spacing is tight. Check pointer spacing, focus rings and labels; do not increase visible height to 44px against the owner's decision without separately approving a touch-area solution.

## Root-level findings

1. **PR #198 correctly introduced** `--erp-control-height: 36px` in `src/index.css`. Shared `Button`, `Input`, AppSelect/FormSelect/SearchSelect, date triggers, numeric shells and joined amount/unit shells receive the baseline.
2. **Residual module-level classes:** `h-8`, `h-10`, `h-11`, `h-12`, `min-h-11` and `size-8` survive in ordinary page actions. Several are effectively suppressed by global CSS but obscure the real contract and can reappear in portals or native controls.
3. **Native button coverage gap:** local `<button>` elements often bypass `.hisabiq-button` or `button[data-slot="button"]`. A 36px global token alone does not prove those are 36px.
4. **Rich popovers and responsive exceptions:** one- and two-line list rows, mobile details, table-cell inline links, calculator interactions and calendar internals need classification; blindly forcing 36px can clip information or break keyboard/touch behavior.
5. **Prevention tools:** `npm run audit:erp-controls` scans every ERP TSX component and reports explicit height candidates per module; `npm run test:field-size-parity` captures computed sizes in 22 routes × 3 viewports and now inventories native exceptions too. Neither is a substitute for opened dialogs, expanded filters, English/Bangla and light/dark inspection.

## Per-module review

| Module / group | Source findings | Change in follow-up | Still requiring runtime confirmation |
| --- | --- | --- | --- |
| Dashboard | Mostly shared actions; few input fields in page container, several reusable widget controls | No page-specific change | Widget customization modal, recent-sales row actions |
| POS V2 / Checkout | Native quick-payment buttons were 32px; checkout post button declared 48px; customer trigger and product search were 40px | Standardized checkout amount shortcuts, post control, customer trigger and product search to `h-9` | Compound units, inventory search option rows, touch stepper arrows, cart input alignment, split payment |
| Sales / Returns / Credit / Drafts | Desktop Columns formerly native 32px; mobile action bar had taller local values; return serial/quantity/price inputs retained `h-8` | PR #198 unified toolbar; follow-up removes return `h-8` and native menu control drift | Batch returns, mobile credit actions, column-picker popover, return modals |
| Party / Ledgers | Ledger filter bar now uses `h-9`; responsive detail and finance action clusters still declared `min-h-10/11`; selector/ledger row menus include native actions | Cleaned obsolete 40/44px responsive action declarations; preserved money-in/out handlers | Bangla labels wrapping in tight two-column actions; ledger row and More popup |
| Products / Add/Edit Product | Full-page product form now references shared control token, but Back and Discard dialogs used `h-11` / `sm:h-10` | Changed Back and Discard controls to `h-9` | Advanced stock, warranty, serial/expiry, product bundle editor, segmented controls |
| Purchases / Bill / Returns | Native cart buttons and bill dialogs mix with shared inputs; source has few explicit size deviations | Preserved purchase-cart workflow | Payment modal, product quick-add, serials/expiry, cart table and refund editor |
| Shared transaction cart / compound units | Number arrow halves and joined money/unit fields are deliberately nested | No geometry rewrite | Inner/outer shell clipping, every multi-unit chain, portrait and landscape |
| Counter / Finance / Cash Session | Numerous shared form fields; Cash counted and settlement amount fields still declared `h-11` | Cash session fields changed to `h-9` | Split allocation, Cash/Bank/MFS forms and dialog action rows |
| Vendor workspace | Tabs and money-action panels still used `min-h-11` for normal buttons | Vendor action triggers changed to `h-9` | Multi-label button fit, vendor memo rows and source settlement dialog |
| Accounts / Voucher | Most voucher actions use shared Button; one native remove-payment icon was `size-8` | Changed icon-only remove to 36×36px | Ledger/account picker menus and voucher allocation rows |
| Audit Ledger | Audit detail/edit use shared fields; remove-payment icon was 32×32px | Changed icon-only remove to 36×36px | Audit filters, rich edit dialog and destructive confirmation |
| Daybook | Date/type filters use shared components; row action menu built with native buttons | No page-specific change | Daybook row action and transaction dialog, popup rows |
| Reconciliation | Mobile transaction chooser used `min-h-11` | Changed to `h-9` | Split panels, selection and keyboard traversal at phone width |
| Quotations | Mostly shared inputs with locally rendered controls | No page-specific change | Quote cart, edit/duplicate/export and customer selection |
| Online Sales | Large mixture of shared inputs and AppSelect; source has no prominent explicit override | No page-specific change | Lead/status/edit/CRM dialogs and mobile cards |
| Warranty / Serial | Many Input and FormSelect usages; primarily inherited shared token | No page-specific change | Warranty claim intake, serial selection, error messages |
| Expenses | Conventional shared input/select forms | No page-specific change | Category/payee editors and receipt attachments |
| Reports | Fewer editable controls; report filters and export | No page-specific change | Export, date selector, drill-down popup |
| Notifications | Shared filters, fewer direct controls | No page-specific change | Rules/quiet-hour selectors and alert templates |
| ERP Shell / Search / Navigation | Cash-session header was 32px; calculator and notification icons 32px; profile menu items variable | Updated header cash/notification/calculator and menu actions | GlobalSearch rich result rows, theme/user picker, accessibility of top bar at narrow widths |
| Business Settings / Team / Data Import | Shared Input and Button common; independent settings input families also present | Audit only | Advanced settings, dialogs, import mapping, CSV picker |
| Brand Guide / SaaS administration | Separate product surfaces, not part of in-business ERP workspace | **Excluded** from ERP-wide visual enforcement | Audit separately if a 36px SaaS-wide rule is approved |

## Residual risks, ranked

**P1 — Functional/visual regressions to check before merging follow-up:** Button labels clipped by 36px `max-height` in Bangla; mobile Party action columns; POS quantity/unit steppers and payment cart; dialog action baselines; keyboard focus after searchable dropdowns. Do not merge new CSS overrides to "fix" a clipped label without testing the real layout.

**P2 — Remaining native controls:** Search suggestions with two-line label/helper, inline table actions, account pickers, global navigation menu rows, daybook row actions, invoices/return popup rows. Inventory these with rendered geometry; ordinary standalone buttons should be 36px, while whole clickable rows may need a documented content exception.

**P3 — Tests and coverage:** One source-level static inventory is not proof of displayed pixels. Add samples with mobile 390px, tablet 768px, desktop 1440px, English/Bangla, light/dark, and dialog/filter open states. Reduce false alarms by flagging only peers that must be 36px.

## Verified CI evidence (23 October 2026)

[PR #199 CI](https://github.com/shuvodelux-commits/hisabiq_ui/actions/runs/39914147352) completed successfully after the full rendered-size check, POS fast checkout, Party directory/ledger, calculator and dialog accessibility smoke tests.

- Source inventory scanned **226 TSX files** and detected **671 shared Button tags, 290 native button tags, 545 input/select tags** (source occurrences, not number simultaneously visible).
- Lightweight source regex marked **11 explicit sizing candidates**, including **2 Brand Guide candidates outside the business ERP scope**. This is not an exhaustive defect count.
- Playwright's strict shared-control size check passed on **531 visible sampled control instances**, across **22 routes at 390px, 768px and 1440px**.
- A separate *nonblocking* native-control inventory still found height outliers. Among 1440px routes, Sales had 20 and POS 22; among 390px routes, Sales had 12 and ERP Notifications 36. These counts include rich selectable rows, navigation, internal clear controls and other likely intentional exceptions. **They are not 36px defect totals** until inspected individually.
- The CI browser check measured default rendered surfaces, not every expanded popup or modal in each language/theme.

### Interpretation

The shared-control 36px standard is **verified on the sampled rendered controls**, and the earlier Party/Sales visual mismatches are addressed in source. The separate native-control population (290 JSX occurrences) remains the most important *remaining audit category*. The user should not be told every button or nested panel is pixel-perfect based solely on the green CI.

## Validation commands

- `npm run check:ui-contract` — source contracts and lightweight full-code inventory (CI).
- `npm run test` and `npm run build` — business behavior and compilation (CI).
- `npm run audit:erp-controls` — static source coverage; write JSON via `ERP_CONTROL_AUDIT_OUTPUT=...`.
- `npm run test:field-size-parity` — live 22-route browser dimensions; write JSON via `FIELD_SIZE_REPORT=...`.
- `npm run test:field-alignment` — compound amount/unit alignment.

The 36px changes from PR #198 **are merged**. The follow-up audit/fix branch has passed its CI—including rendered checks—but remains **unmerged** pending review of native controls and rich popup exceptions.
