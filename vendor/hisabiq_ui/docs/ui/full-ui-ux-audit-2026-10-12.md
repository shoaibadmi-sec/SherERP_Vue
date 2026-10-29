# HisabIQ UI/UX audit — 12 October 2026

## Scope and evidence

Latest GitHub main verified at `0cc3a9a` (PR #65). PR #66 remains unmerged; Vendor improvements in #67 are based on it. Attached Magic Patterns ZIP contains 92 files: 38 match main and 54 differ; no attachment-only file. It is the older visual reference, not a replacement for GitHub.

Review covers routes, page sources, shared controls and event handlers, preview state and financial helper tests. Browser entry-screen sweep initially covered 23 entries at four widths in light/dark (184 renders); no runtime crash, but whole-page overflow in Dashboard, Parties, Finance and Reports. After shared fixes, all 184 passed including phone/tablet touch contexts. Expanded project sweep includes every settings section and SaaS list/detail routes. Browser sweeps verify rendering/geometry, **not every business action**. Changed journeys have separate action tests. Full production certification and moderated testing with actual shopkeepers are still pending.

## Product direction

Keep the existing tokens, Geist/Bangla type, shadcn-style primitives, compact information and current POS/Purchase cart family. One clear everyday task per screen. English with useful Bangla help; icons always have visible text or an accessible name. Amounts, direction and due must be explicit; color alone must not carry financial meaning.

Vendor entry should answer: **Who? What needs a price? What should I pay or receive?** Price-later goods are quantities, never a made-up zero cost. Keep sourcing and ordinary Purchase dues separate. Opening balances remain in Party. On phones, show the selected task with a compact record chooser; desktop may keep list and workspace side by side.

Cash entry should be **count → compare → explain difference → save/close**. Bank entry should be **choose row → compare → resolve source issue → match → review**. Neither workflow should manufacture a balancing transaction automatically.

## Prioritized findings

| ID | Severity | Evidence | Required action / status |
| --- | --- | --- | --- |
| V01 | P1 | Vendors.tsx: old card directory only showed payable; default ledger adds a step | #66 plus #67 add independent dues, price-first entry and To pay / To receive |
| V02 | P1 | VendorSourceWorkspace/VendorPaymentsWorkspace: long list precedes settlement below desktop breakpoint | #67 shows selected form with memo chooser on phone/tablet |
| V03 | P1 | Same-tab source link did not refresh selected local source ID | #67 synchronizes source changes |
| V04 | P2 | Full-width Vendor directory columns applied at 640px; five long labels/summary buttons | #67 changes tablet rows, keeps tabs visible and wraps actions |
| B01 | P0 | Reconciliation.matchSelected marked arbitrary candidate Matched | #68 validates account, direction, exact paisa and one-to-one link |
| B02 | P0 | UploadStatementDialog stored filename; success said transactions ready | #68 removes false import; backend parser explicitly pending |
| B03 | P1 | Finish/history/export were toast-only; empty account could finish | #68 records review snapshot, opens real history and downloads CSV; empty/ignored denied |
| B04 | P1 | Bank list above work area on phone; Finance account query ignored | #68 adds chooser and respects account deep links |
| C01 | P1 | CashSessionDialog: predefined count, Save count lacks record; opening float ignored | #68 uses blank total/optional notes, shared saved count and actual opening |
| C02 | P1 | Finance Cash reconciliation link opens bank page | #68 uses same cash dialog |
| R01 | P1 | Panel intrinsic width, WidgetFrame min-width, Party tabs and Finance headings overflow | Shared responsive PR fixes actual layout causes; no global overflow hiding |
| A01 | P1 | Exported Dialog lacks consistent role, focus containment, Escape/return behavior | Shared wrapper retains styling, adds roles/labels, portal, Tab/Escape, nested scroll/focus restoration |
| A02 | P2 | Dense button/input sizes are difficult to touch | Shared coarse-pointer targets 44px; desktop stays compact |
| D01 | P0 | Daybook.deleteTransaction marks projection Deleted and claims balanced reversal; no source reversal | Must stop projection-only deletion; review at owning source |
| D02 | P1 | index.css print rule hides everything except Party statement | Daybook/Audit browser print can be blank; scope printing to explicit selected report |
| D03 | P1 | Daybook/Audit are separate static snapshots | Need one source-backed projection before cross-module edits can be called durable |
| E01 | P1 | Expenses filters have no controlled values/onChange; action menus/categories/payees only toast | Wire real preview filters and entity actions with existing Quick Add controls |
| P01 | P0 | BillDetailDialog payment handler toasts success; purchase return example toasts without validated lines | Shared settlement/return command and source-linked due/stock/refund validation, or clearly disabled pending integration |
| S01 | P1 | Sales Print/Export and several return/template actions only toast | Real filtered exports/print and canonical editor; do not claim a physical print |
| W01 | P1 | Warranty Print/Export only toast | Real case artifact and source-aware actions |
| G01 | P1 | Products Export, Reports export and P&L/valuation links only toast | Real data artifacts or explicit unavailable state; report period must affect data |
| L01 | P1 | Personal language is saved but most pages contain hard-coded bilingual strings | Central language rendering and full translation coverage, including portals; avoid cosmetic toggle claims |
| T01 | P1 | TypeScript has missing generated design-system declarations and cascading implicit-any/unused/source-union errors | Add accurate types and fix source errors; CI currently omits TypeScript/lint |
| T02 | P2 | Initial JS bundle about 2.21 MB minified / 596 KB gzip; App imports all pages eagerly | Route-level lazy loading after source correctness; test loading/error states |

P0 = financial truth/integrity. P1 = ordinary task/accessibility/production gate. P2 = efficiency/clarity.

## Module coverage and next ordinary tasks

| Module | Existing useful behavior to preserve | Remaining audit work |
| --- | --- | --- |
| Dashboard | Customizable widgets and drilldown | Shared overflow fixed; period/source context and overview data freshness |
| Vendor | Unknown-cost sources, combined money/products, stock validation, PurchaseEditor | #66/#67 review; ordinary purchase due source settlement and complete translations |
| POS | Compound units, shortage modes, draft/cart reorder and split payments | Phone cart workflow and customer quick-add; durable source posting |
| Sales | Payments, customer credit/refund and return previews | Print/export/template/return action coverage and context preservation |
| Purchases | Shared product/supplier quick-add, unit/cart/payment editor | Real bill due settlement and validated purchase return |
| Products | Create/edit/stock/lots and nested quick-add | Export/settings edit action gaps; phone list/card parity |
| Parties | Role-isolated ledger, opening balance, date ranges and statement | Shared tab overflow fixed; context-preserving invoice/bill actions and attachment gaps |
| Expenses | New expense and related entity quick-add | Filters, management menus, receipt/edit/report actions |
| Finance & Bank | Account/relationship/transfer/cheque previews | Shared overflow and cash links fixed; reconcile/store consistency and dates/quick-add |
| Cash Reconciliation | Live denomination arithmetic | #68 simple count, save/close and opening reviewed; server sessions still pending |
| Bank Reconciliation | Candidate comparison | #68 validation/history/export/phone view; actual parser and source correction API pending |
| Day Book | Date/account/type filters, projection, detail and CSV | Projection-only deletion, print scoping, source context |
| Audit Ledger | Balanced helper engine, correction impact, source history | Print scoping, persisted source audit, current timestamps and context |
| Accounts | Simple/accounting terminology, vouchers and source statements | Shared date/quick-add parity, source/store consistency |
| Reports | Summary/trend/breakdown preview | Real selected-period data, exports and working drilldown |
| Warranty | Case transitions, replacement and supplier movements | Print/export, linked customer/source context and server notifications |
| Quotations | Shared cart, print and conversion preview | Customer quick-add/context; phone/touch source lifecycle |
| Online Sales | Orders/COD/courier/CRM preview | Buyer quick-add, real fulfillment/credit events and contextual actions |
| ERP Notifications | Opt-in configuration and grouped events | Provider/outbox/consent/credits/delivery logs; no preview may imply real send |
| Tenant Settings | Ten sections, simple/advanced mode, revision validation | Actual language consumption, controls affected by settings and reversible draft behavior |
| Tenant Subscription/Support | UI portal previews | Real tenant authentication/data isolation and durable requests |
| SaaS Administration | Permission guards, configurable staff roles, billing/support/service previews | All routes responsive; verify actual authorization and payment/provider behavior after backend |
| Brand guide/design primitives | Existing visual authority | Maintain accurate types, accessible interactions and themed portals |

## Changes and review order

1. Review #66 (existing Vendor polish), then #67 (small mobile/task follow-up). #67 targets #66's branch; retarget after #66 merges.
2. Review #68 (independent cash/bank safety slice).
3. Review shared responsive/dialog slice (independent; no cart/business-engine changes).
4. Resolve Daybook projection-only deletion and financial report print scoping.
5. Expense workflow actions, Purchase settlement/returns and false print/export actions, each as a domain PR.
6. Full language application and mobile POS/Purchase task testing; then TypeScript/lint gates and lazy route loading.

No merge is authorized. UI preview success is not production readiness. Remaining backend dependencies: authenticated tenant/session, durable finance/stock/ledger sources, atomic/idempotent commands and audit, real bank parser, receipt storage, SMS gateway/outbox and actual subscription/payment integration.

## Validation record

Main: 327 helper tests and UI contract pass; production build passes with duplicate note-key and bundle warning. TypeScript and lint fail before these changes; lint has 58 errors/201 warnings, largely compiled design bundle plus real source errors. These are not hidden or treated as passed.

#67: 327 unit tests, build, contract, Vendor module/receipt/Purchase context/combined due and new eight device/theme journey checks pass.

#68: 330 unit tests, build, contract and bank/cash journeys in eight device/theme combinations pass. Helpers deny account/direction/amount/duplicate matches and empty/ignored completion; CSV formula injection escaped.

Shared: 184 ERP renders pass after fixes; nested Quick Add/Tab/Escape/focus/geometry test plus existing Product quick-add, Purchase and Vendor context regressions. Expanded full project sweep: 51 routes × four device sizes × two themes = **408 renders**, all passed; recorded by `scripts/responsive-audit-browser.cjs`.

## Acceptance before declaring the whole ERP production-ready

Every visible action must create/update real preview state, open a working editor, generate an artifact, or be disabled with a readable reason. Retain half-filled drafts during quick-add and navigation. Validate financial changes against their sources, show impact and preserve audit. Test keyboard, touch, phone, both tablet orientations and desktop in both themes. Complete language-mode coverage and realistic shopkeeper usability trials. Run build, TypeScript, lint, helpers and domain browser journeys, then connect and verify backend behavior separately.
