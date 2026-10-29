# Deep interaction audit — 16 October 2026

Base: `main` at `768186c7c864423acdc13f940dfd3a319dd9cf60` (Phase 29 merged).

## Release assessment

**Audit in progress; frontend release acceptance is not established.** This first slice repairs product-entry defects found through actual browser interactions. A route render, activated tab, or passing existing script is not proof that every action within a module works. No backend readiness is claimed; all test mutations are UI preview state.

Read before editing: `AGENTS.md`, `CONTEXT.md`, the transaction cart and contextual workflow contracts, the ERP source audit, the 12 October full audit, and Phase 28/29 reports. History reviewed for the shared Dialog, the canonical ProductCombobox extraction (`4deee33`), and the quotation/online editors. The existing POS, Purchase and shared transaction cart families remain in use.

## Verified defect inventory

| ID | Priority | Reproduction on baseline | Root cause and correction | Regression |
| --- | --- | --- | --- | --- |
| DPI-01 | P1 | Purchase → Add product → type a name absent from catalog. Empty message and Create new product are invisible. | Shared `ProductCombobox` renders the empty list but resets its position to null when results are empty. Position empty lists using the existing placement path. | `empty-search-quick-add`: tap/click Create, validate missing category name, create category, preserve product draft, cancel back to Purchase. |
| DPI-02 | P0 | New quotation → enter customer → product search → Escape. Both suggestions and quotation close; unsaved customer is lost. | Product input lets Escape propagate to shared Dialog. Consume the dismissal in the existing picker; retain second-Escape dialog close and trigger focus restoration. Document listener respects the topmost dialog. | `quotation-escape-preserves-draft`: one Escape closes only popup; second closes dialog and restores opener. |
| DPI-03 | P0 | New quotation or online order → search `a` → ArrowDown to MS Angle → Enter. No product added; browser throws `Cannot read properties of undefined (reading 'unit')`. | Both editors compare two absent optional values as equal, then dereference `altUnit`. Require an alternate unit before reading it. Existing compound-unit price and quantity rules are unchanged. | `keyboard-cart-quotations`, `keyboard-cart-online-sales`: first Enter adds single-unit product, pointer adds compound-unit LED product. |
| DPI-04 | P1, open | Finance → Cash Sessions at 390px, both themes. Whole document grows to 648px. | History table/grid sizing needs a separate narrow change. Source and count values must remain unchanged. | Inventory screenshots and `inventory.json`; dedicated interaction regression still required. |

Baseline screenshots/traces are under `.superpowers/deep-audit/before`, `before-corrected`, `before-online-corrected`, and the initial probe screenshots. The corrected online reproduction records two failed journeys (light/dark). Raw early harness failures also include an initial-load timeout and a wrong online button locator; these are **not product defects**. Later tests use the actual New online order label, wait for React state, and poll resize geometry.

## Reusable evidence and commands

- `PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium node scripts/deep-product-overlay-browser.cjs`: six journeys × eight exact requested viewport sizes × two themes = **96 expected journey results**. Actual pass/fail counts are in `results.json`; expectations are not reported as measured passes.
- Sizes: 320×700, 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×800, 1440×900. Touch activation at mobile/tablet sizes; mouse at laptop/desktop; actual keyboard arrows/Enter/Escape at every size.
- Tests verify empty result recovery, nested Quick Add error/save/cancel, parent inputs, scroll restoration, real single/compound product selection, clear buttons, repeated Escape and focus, popup bounds before/after resizing. Shrinking the viewport is an emulator check, **not a real mobile software-keyboard certification**.
- New CI `Deep Product Overlay Check` uploads measured results and failure screenshots/traces, including on failure. `DEEP_AUDIT_OUTPUT` changes the output directory; smoke/case/port variables support local diagnosis only.
- `node scripts/deep-interaction-inventory-browser.cjs`: eight sizes × two themes across 32 ERP routes. Opens top tabs and discovered subtabs at 390/1440, stores every visible control name/disabled state per view, checks page overflow/runtime errors, and measures axe WCAG A/AA through 2.2 on ten representative routes at those two sizes/themes. **Enumerated controls remain unverified until their expected action result is tested.** It does not mark a module complete.
- Full UI Check browser commands are taken from `.github/workflows/ui-check.yml`; per-command logs/results live in `.superpowers/deep-audit/ui-check` for this run.

The managed environment cannot reach Google Fonts. Local browser runs fail those external font requests promptly and therefore use fallback fonts. Geist/Hind Siliguri imports and source typography are unchanged; final font rendering/wrapping needs a browser with those fonts loaded.

## Module and inside-module coverage ledger

Every row remains **partial** until the all-action acceptance matrix is finished. The existing script column identifies retained executable workflows, not an assertion that every possible action is covered.

| Module | Existing workflow inventory | New audit coverage / remaining interactions |
| --- | --- | --- |
| Dashboard | theme, navigation, Phase 29 names/scroll region | Tabs/actions enumerated; axe/geometry measured. Widget configuration and drilldowns need all-action coverage. |
| POS | cart reorder, compound units, Vendor sourcing, Counter UX | Shared picker keyboard/search/clear/resize. Serial, shortage, checkout, all customer menus and nested Quick Add still need complete matrix. |
| Purchases | purchase editor, source review/returns, product Quick Add | Empty search → product → category validation/save → parent draft/cancel; picker selection. All payment/review/source menus remain to certify. |
| Sales | documents, sales/returns/credit language scripts | Tabs/actions enumerated; every row menu and nested financial action still to certify. |
| Vendors | source, settlements, corrections, goods, profile, receipt scripts | Five-tab/action inventory; all combinations of source and nested editors still to certify. |
| Parties | ledger, opening, settlement, finance, import, date/statement scripts | Directory/profile tabs enumerated; axe findings measured. Every role/action/date-filter path still to certify. |
| Finance | Counter, finance, cheque and cash drawer scripts | All tabs opened on representative phone/desktop; Cash Sessions overflow found. All financial review and confirmation paths still to certify. |
| Counter | quick clear, split settlement, Bangla amount scripts | Action inventory and axe; all invalid splits/review/cancel/reopen combinations still to certify. |
| Cash reconciliation | reconciliation safety, cash drawer scripts | Entry/actions inventoried; actual mobile keyboard and count/reopen chain still to certify. |
| Bank reconciliation | source match/history/export safety scripts | Controls and axe measured; drawer/candidate/date/filter/confirmation combinations still to certify. |
| Daybook | source safety and multilingual print scripts | Tabs/actions and axe; source-editor round trips and all filters still to certify. |
| Audit Ledger | correction, select contract and multilingual audit scripts | Tabs/actions and axe; complete correction/reversal review chain still to certify. |
| Accounts | accounting/statement language scripts | Tabs/actions enumerated; voucher/opening/entity nested selectors still to certify. |
| Products | product forms/inventory/import/Quick Add scripts | Product/category nested validation and preservation through Purchase. Remaining Brand/Unit/lot/serial/edit menus still to certify. |
| Expenses | expense workflow and multilingual expense scripts | Tabs/actions enumerated; all nested payee/category/account/receipt/edit paths still to certify. |
| Quotations | quote lifecycle, print and conversion scripts | Draft preservation on popup Escape; single/compound selection. Complete save/reopen/status/duplicate/order chain still to certify. |
| Online Sales | orders/COD/CRM/fulfillment scripts | Single/compound product selection. All courier, review, lead and nested document actions still to certify. |
| Warranty | warranty transitions and document scripts | Tabs/actions enumerated; replacement/supplier/settlement nested paths still to certify. |
| Reports | report/print language and document scripts | Tabs/actions enumerated; every period/drilldown/export remains to certify. |
| Notifications | configuration/fulfillment language scripts | Tabs/actions enumerated; all rule/edit/preview/reset flows still to certify; real sends require backend. |
| Settings | settings hub, tenant settings and product settings scripts | Ten section routes/actions enumerated; every form/disabled/reset/nested selector still to certify. |
| Subscription / Support | SaaS and settings browser scripts | ERP portal action inventory; backend submissions/permissions not certified. |
| SaaS administration | SaaS browser suite, 51-route responsive baseline | Existing suite retained; new deep inventory is ERP-focused. All SaaS internal actions remain outside this first repair slice. |

## Accessibility and translation triage

Phase 29's census is a Latin-script candidate list, not a translation defect count. Product names, brands, party names, IDs, units and source data must remain separate from untranslated interface strings. This slice changes no language modes, labels, persisted enums or source data.

Early new axe measurements at 390/light: Dashboard, POS, Counter, Finance, Reconciliation, Daybook, Audit Ledger and Products reported no WCAG-tagged violations in the **inspected view**; Purchase Editor reported eight `label-content-name-mismatch` nodes; Party profile reported one `target-size` node. Final measurement totals and selectors belong in the generated inventory JSON. Passing a page-level axe scan does not certify dropdowns, dialogs, contrast in unvisited states, mixed-language spans, or screen reader pronunciation.

Remaining work is ordered: finish shared popup/modal keyboard/visual-viewport/stacking coverage; fix Cash Sessions containment; triage measured accessible names and target sizes; complete role/module nested workflow matrices; then certify all language modes and actual mobile keyboards. No zero-P0/P1 or complete-release claim is made while those gates remain open.
