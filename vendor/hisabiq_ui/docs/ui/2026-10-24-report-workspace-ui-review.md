> Historical visual review, preserved below. Current Reports presentation and styling direction are defined by the [canonical26 October specification](../superpowers/specs/2026-10-26-hisabiq-reports-final-uiux-design.md) and current Visual component library. This dated review is not fresh rendered verification.

# Reports workspace UI review — 2026-10-24

## Scope and authority

This is an ordinary extension of the incumbent HisabIQ/Magic Patterns Reports surface, under `PRODUCT.md` and `docs/superpowers/specs/2026-10-24-report-workspace-design.md`. It is not an approved replacement of the visual system. The default is Business overview.

Reviewed implementation: `src/pages/Reports.tsx` and `src/components/reports/ReportToolbar.tsx`, `ReportOverview.tsx`, `ReportResults.tsx`, and `ReportDetails.tsx`.

Impeccable's `reference/document.md` informed the source extraction and incumbent comparison. This task records surface evidence only; it creates no `DESIGN.md`, `.impeccable/design.json`, tokens, or new global design rules.

## Incumbent comparison

| Area | Incumbent evidence | Reports extension evidence |
| --- | --- | --- |
| Shell | `.impeccable/review/incumbent.png` shows the ERP sidebar, top bar, pale workspace, teal selection and white panels. | Desktop capture retains that shell and surface vocabulary. The change is the workspace content and navigation. |
| Colors | `src/theme.css` defines shared background, card, ink, border, primary and semantic roles for light and dark. | Reports uses those roles; the chart reads `--primary`, `--border`, `--helper` and `--popover`. No report palette is introduced. |
| Panels | `src/components/Panel.tsx` and `src/pages/Dashboard.tsx` establish bordered, softly rounded cards, compact headers and restrained shadow. | Overview reuses `Panel`; summaries, filters, library and results use the same card/border/rounded vocabulary. |
| Controls | `Button.tsx`, `Input.tsx`, `AppSelect.tsx` and the canonical control block in `src/index.css` establish normal 36px controls. | Reports imports the shared wrappers, date picker and search selector. Report group tabs and library entries use the same 36px rhythm; content cards remain content-sized. |
| Typography | `src/index.css` supplies Geist with Hind Siliguri support. Existing headings, labels and tables use compact sans-serif hierarchy. | Reports retains sans-serif amounts, restrained 12–14px supporting text and stronger summary totals. It introduces no monospaced type or explicit tabular-number utility. See inherited caveat below. |
| Navigation | Existing ERP motion tabs and shared dialog/select components define selection and contextual actions. | Seven report groups organize the catalog; desktop has a searchable library, while smaller layouts use the existing report selector. Details use the shared dialog. |

## Surface behavior evidenced in source

- The overview leads with recorded sales, gross profit, purchases, expenses and current outstanding balances; summaries open the corresponding report.
- Filters remain together in a shared toolbar. Additional dimensions collapse; active selections can be cleared. Column controls, saved views, sorting and pagination use shared controls.
- `ReportResults.tsx` makes reference/name cells drill-down buttons and right-aligns numeric columns. `Table.tsx` supplies a named, keyboard-scrollable region when its wrapper overflows.
- `ReportDetails.tsx` retains the current context in a dialog, supports contributing-record navigation and offers source-module links where a route exists.
- Visible-column selection feeds table, CSV and print paths in `Reports.tsx`; this is source evidence of shared selection handling, not a claim that every output path was retested in this documentation pass.
- Group tabs declare selection, panel relationships and keyboard navigation. Inputs, icon actions, sort controls and details include accessible names/focus treatments in source.

## Responsive, language and theme evidence

Supporting captures are `.impeccable/review/desktop.png`, `tablet.png`, `mobile.png` and `incumbent.png`.

- Desktop: the library and main report sit side by side; summaries form three columns; chart and attention list share a row. Toolbar actions wrap within their panel.
- Tablet: the library becomes a selector; summaries form two columns; the chart, attention list and secondary panels stack. The shell uses its compact header.
- Mobile: the dark Bangla capture shows stacked controls and panels, two-column summaries, a report selector and a table clipped inside its own horizontal scroll area. Group tabs also scroll horizontally.
- `useUiCopy()` reads the existing Settings language. Bangla receives translated labels; English and Bilingual follow the incumbent English-primary/helper-slot convention. PageHeader retains a Bangla helper in the bilingual tablet capture.
- Dark appearance comes from shared theme roles rather than a local report override. These captures demonstrate selected combinations, not exhaustive proof of every language/theme/report state.

## Data honesty and product limits

The workspace explicitly says “UI preview · current in-browser records · not live accounting.” `src/reports/useReportData.ts` projects the existing sales, product, expense and finance preview stores plus demo purchase, stock, daybook and warranty sources. This is a working UI over preview records, not authenticated backend accounting or evidence of complete business records.

Unknown historical cost appears as “—” with an explanation; expenses are identified as not a complete P&L. Stock and outstanding balances are labeled current snapshots, with basis information available beside the report. Empty results explain that missing records are not invented.

`src/reports/catalog.ts` carries explicit unavailable-source explanations for P&L, Balance Sheet, installment ageing, supplier delivery performance, seasonal comparison and bundle profitability. Reconciliation points to its existing workspace. These entries explain missing ledger, contract, delivery or historical-cost evidence; they do not claim those reports are complete. Print/CSV actions are disabled for unavailable definitions.

Purchase planning exposes editable assumptions and a downloadable list. The UI calls its costs estimates and identifies absent incoming orders, reservations and lost-sales evidence; it does not claim to post a purchase order.

## Review disposition and remaining details

The supplied finish review returned **SHIP**, no material visual issues, and detector `[]`. The captures and source comparison support an incumbent-consistent extension; this document does not independently certify backend accounting or full report coverage.

Three minor finishing details remain: mobile table/tab scrolling has a weak discoverability cue; the long desktop search placeholder truncates; chart tick dates use MM-DD even when surrounding UI is Bangla. The table and search still have explicit accessible names, and exact dates are available in report records.

Inherited typography caveat: `src/index.css` sets body `font-feature-settings: 'tnum' 1`. Reports adds no monospaced or tabular-number class, but source alone cannot establish the requested proportional digits while that inherited rule applies. Resolving the global rule is outside this documentation boundary and is not recorded as a new design-system decision.

Only this review file is written by the documentation pass.

## Follow-up: semantic cues and guided help

The user requested green/blue semantic colors, badges, Bangla helpers and guided tooltips. `src/reports/guidance.ts` now maps existing semantic roles: sales/positive values use green, purchases/information blue, customer dues/review/missing costs amber, and expenses/payables/losses/expired stock red. Zero or absent numeric values remain neutral where appropriate. Status badges retain explicit text, so color is supplementary.

`ReportGuidance.tsx` provides labels and contextual explanations for amounts, payments, invoice age, historical costs, margins, stock and purchasing assumptions. English, Bangla and bilingual helpers follow the existing Settings language; bilingual labels and help include Bangla support. Missing-cost cells now use an explicit amber “Cost missing” badge while unknown summary totals retain a dash and explanation.

The shared `Tooltip.tsx` adds opt-in interactive portal help that escapes clipped tables/panels and supports pointer, keyboard and touch. Default tooltip behavior remains intact. Help uses the existing theme roles and normal 36px trigger controls; no new tokens or source calculations were introduced.

Inspected captures: `.impeccable/review/guidance-1440-light.png`, `guidance-1440-dark.png`, `guidance-390-light.png` and `guidance-390-dark.png`. They retain the incumbent shell, card hierarchy and responsive layout while showing the semantic totals, text badges and help affordances. The bilingual desktop capture shows Bangla helper labels; the dark mobile capture shows Bangla copy.

Supplied verification reports passing pointer/keyboard/touch tooltip checks in four profiles, passing main report workflows and print tests, and zero axe issues on the stock route in those four profiles. This follow-up does not claim an accessibility audit of every report route.

The final finish review returned **SHIP**, detector `[]`, after customer receivables were made consistently amber. Existing preview-data limits, unavailable-report explanations and minor observations above still apply. This documentation follow-up modifies only this review file.
