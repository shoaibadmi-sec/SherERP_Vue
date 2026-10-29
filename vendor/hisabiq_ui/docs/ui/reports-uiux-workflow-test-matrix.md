# Reports UI/UX — workflow and verification matrix

**Scope:** Acceptance contract for future implementation, not a record that these UI checks have passed. Read the [spec](../superpowers/specs/2026-10-26-hisabiq-reports-final-uiux-design.md), [plan](../superpowers/plans/2026-10-26-hisabiq-reports-uiux-implementation-plan.md), [mapping](reports-magicpatterns-github-component-mapping.md) and [current consolidation checks](reports/2026-10-26-consolidation-review.md). Current product code is unchanged by this documentation PR. Historical #206/24 October results are not fresh runs.

## Reproducible setup and coverage

Pin demo dataset/as-of to2026-10-26 Asia/Dhaka, seed scope and fixture version; freeze screenshot clock and avoid locale-dependent arbitrary dates. Reset the story between independent cases; retain it across a linked workflow. Use stable source/operation IDs. Record commit, live reference artifact/guide hash, browser, device size, language, theme, reduced-motion setting, command, actual result, console/errors and capture paths. Never include personal/production customer data in demo captures.

| Profile | Viewport | Mandatory coverage |
| --- | --- | --- |
| Desktop |1440×900 | All 11 screens, library details, planner/PO/receipt and main source actions |
| Tablet landscape |1024×768 | Compact desktop cart, report table/filter/overlay, tracking/payment entry |
| Tablet portrait |768×1024 | Panel reflow, compound fields, PO detail/receipt, filter keyboard |
| Phone |390×844 | All 11 destinations, chart evidence, source dialog/return and complete buying journey |
| Narrow phone |360×800 | Long Bangla, totals/units/menus/More, controls and critical errors |
| Reflow/text zoom |320 CSS px and200% text zoom | Routine content reflows; comparison tables scroll internally; no lost actions |

Every changed surface needs English/Bilingual/Bangla × light/dark in the browser interaction matrix. Screenshot the six theme/language combinations for the main representative desktop/phone surfaces; also capture every screen in at least one profile and inspect both tablets. Audit all six combinations for each critical changed flow, not just the overview. Repeat keyboard/touch chart/detail/receipt checks with reduced motion on; default motion gets measured separately. A source-only inventory does not satisfy rendered coverage.

Bound Impeccable review to one batched inspection across these device classes, one batch of material fixes, then at most one confirmation pass. Automated regressions may run as needed for actual changes/failures. Physical low-end Android performance is an outstanding device check unless actually measured.

## Interaction and continuity

| ID | Procedure / inputs | Required observable result | Task |
| --- | --- | --- | --- |
| NAV01 | Open each of11 screen URLs and every legacy34 report URL; reload/back/forward | Correct destination and catalog ID; unknown input falls back; no removed reports |3 |
| NAV02 | Premium/basic presentation; Overview first-entry; click across overflow rail on phone | All destinations discoverable; initial reference order retained; active item visible; no unapproved regrouping |3 |
| NAV03 | Tab/ShiftTab, ArrowLeft/Right, Home/End on outer and nested content tabs | Roving focus, selected state and associated panel; one2 px underline; keyboard handlers beyond motion wrapper |3 |
| NAV04 | Change screen/filters → Details → source → Return/Back; include reload | Restore screen/report/period/filter/sort/columns/page/chart/selection/scroll and connected focus |3–4 |
| NAV05 | Open source while plan/editor dirty; Save/Discard/Stay; missing return context | Each choice does what it says; no lost draft, invalid external return blocked, safe fallback |4/6–8 |
| LIB01 | Enumerate catalog and seven readiness entries |34 IDs retained,27 baseline preview views; all missing-source states still explained; optional demo example labeled separately |3 |
| LIB02 | Presets/custom/previous period; leap/end dates, invalid/reversed/future ranges, Dhaka midnight | Visible records/totals/compare match valid selection; clear error otherwise; stock snapshot not historic balance |3 |
| LIB03 | Search name/ref/Bangla, entity/status/account filters, active chips, Clear | Actual row count/numbers change; reset query focus stays; split accounts use selected amount only |3 |
| LIB04 | Sort/page/pageSize/visible columns; attempt to hide identity | Current table/output match; label stays;13/12/11 typography including details and responsive rows |3–4 |
| LIB05 | Save/name/open/delete/favorite;20-view limit; reload and actor/business switch | Exact filters/columns restored; proper scope; cap explained; no preference leakage |1/3 |
| LIB06 | Corrupt JSON, storage denied/quota, invalid/malicious URL values | Safe validated fallback with inline storage warning; current session/draft preserved; no false durable-save message |1/3 |
| DET01 | From all Basic and every Premium screen, open representative customer/supplier/product/invoice/purchase/expense/payment/finance/stock/insight | Correct contextual facts/status/basis/as-of/source IDs; details reads do not mutate sources |4–5 |
| DET02 | KPI/chart point/bar/segment/recommendation → contributing records | Selection corresponds to exact period/series/entity; claim and records reconcile; no generic blank dialog or tab-only substitute |4–5 |
| DET03 | Nested children → child→Back; print child; open exact source | Current-child print correct, trail retained; destination opens actual source ID, not only search results |4 |
| DET04 | Dialog open/close, nested tooltip/select Escape first, multiple overlays, removed trigger | Trap/return focus, background scroll lock, no horizontal shift; fallback focus if opener gone |4 |
| DET05 | Source deleted/reversed/changed/permission denied/wrong tenant | Readable reason and safe return; no stale editable source, no cross-tenant ID resolution |1/4 |
| DET06 | Close detail at page3/table horizontal scroll, reopen selected chart evidence | Same outer/internal scroll/page/chart state; keyboard focus does not jump to top |4 |
| OUT01 | CSV with filters/columns and more rows than one page | Full filtered rows once, selected headers/order/units/totals/period/basis, Bangla preserved |3–4 |
| OUT02 | Print report/details/PO/forecast in both themes; popup blocked | Real printable light document, correct source child and repeat headers, sample labels; recovery if popup blocked |3–8 |

## Data and purchasing simulation

| ID | Procedure / inputs | Required observable result | Task |
| --- | --- | --- | --- |
| DATA01 | Same invoice/product/party/purchase across Reports, source page and ledger | Stable matching IDs/dates/costs/units; no separate screenshot totals or duplicate synthetic history |1–2 |
| DATA02 | Commit one purchase/payment while Reports remains mounted | Exactly one coherent revision; relevant module selectors update immediately, stock movement present |1–2/8–9 |
| DATA03 | Same command twice; retry with same key; same key/different payload; stale revision | Identical retry returns same IDs; different payload rejects; stale draft preserved, no partial side effect |1/7–9 |
| DATA04 | Reload linked story including offer/follow-up/request, change actor/tenant, confirm Reset under More, corrupt saved envelope | Linked sources/PO/receipt survive together or honest session-only state; tenant isolation; confirmed reset is coherent |1 |
| DATA05 | Missing sale-time cost/terms/stock/demand; scenario vs recorded numbers | Unknown is not0/master cost; invoice age not overdue; incomplete/illustrative labels and inputs visible |1/5–6 |
| BUY01 | FixtureB: stock 120 ft,demand 20/day,lead 8,review 1,safety 2 days,pack 20 ft | Safety40,target 220,shortfall 100,suggest 5packs; old safety-base-unit input remains unchanged through adapter |2/6 |
| BUY02 | Confirmed incoming40 due within horizon; draft/late/cancelled PO; reservations/unusable lots | Eligible incoming reduces suggestion once; drafts are warnings only; late stock not silently counted |6–7 |
| BUY03 | Qty/unit/supplier/cost edits, zero/missing cost, fractional feet, negative stock/zero demand | Accurate selected totals and pack logic; incompatible feet/boxes/pcs demands never summed; no NaN/infinity; explicit unknown/zero distinction; free/zero-cost confirmation blocked with deferred-support reason |2/6 |
| BUY04 | Add product/supplier in half-filled plan, nested category/brand/unit Quick Add | Actual shared selector/dialog; duplicate check, auto-select, parent quantities/filter/focus preserved |6 |
| BUY05 | Manual override then recalculate/change master conversion | Explicit diff, overrides retained unless accepted; frozen quantities/unit price history unchanged |2/6 |
| BUY06 | Soft budget too small; Apply budget proposal; optional hard mode | Warning plus alternatives; no silent cuts; explicit acceptance changes selected lines |6 |
| BUY07 | Save/reopen/rename/duplicate/revise/archive; partial conversion | Stable plan/line links, current totals; reconversion excludes allocated qty, no posting |6–7 |
| PO01 | Three products, two suppliers, one unassigned; grouping/retry | Shows2drafts plus unresolved line; blocks/excludes only by explicit choice; stable operation IDs prevent duplicates |7 |
| PO02 | Draft→Ordered, term edit/revision, print, expected date late | Correct states/history; no stock/cash/payable change; no sent status from order/print |7 |
| PO03 | Cancel unreceived; close partial remainder; delete draft with dependencies | Incoming removed appropriately; committed receipt/ledger retained; reason and trace survive |7–8 |
| PO04 | Orders list/detail/query/back, existing purchase/return tabs | Purchases owns all PO states; navigation highlight correct; no disconnected workspace or legacy link break |7 |
| REC01 | FixtureA first4of6 pipes at 1250; expected1200; pay Cash 2000+Bank 1000 |80 ft accepted; actual 5000; due 2000; cash sources−3000; remaining2 pipes/40 ft; PO original estimate7200 |8 |
| REC02 | FixtureA final 2at1200 unpaid | Cumulative120 ft, actual 7400,due 4400,variance 200; complete once; all source links reconcile |8 |
| REC03 | Separate reset FixtureB receive40 ft then60 ft | Stock 120→160→220; remaining100→60→0; don't mix FixtureA amounts |8 |
| REC04 | Long chain CT/BOX/PCS/feet, cost in intermediate BOX; fractional base quantities | No base/alt-only rejection; exact frozen factors, per-unit price, paisa allocation; inline readable units |2/8 |
| REC05 | Missing/duplicate serial, batch/expiry/warranty requirements, invalid date/payment split | Completion blocked with exact field error/draft intact; tracked data retained in accepted lot/source |8 |
| REC06 | Double complete/retry/reload/back; two stale receipt drafts | One receipt/purchase/projection; conflicting quantity shows diff, no oversubscription or duplicate ledger |1/8 |
| REC07 | Overdelivery | Block by default; explicit reasoned PO quantity revision and variance review before accepted extra |7–8 |
| REC08 | Receipt correction/reversal with and without subsequent allocations | Permission/revision/reason review; compensating stock/cash/ledger/PO delta once; allocation-safe support or honestly incomplete gate |8 |
| REC09 | Supplier return after accepted goods, with refund/credit; tracked-stock return | Stock/credit follows selected lot/serial source; no automatic incoming replacement; explicit linked replacement order needed |8 |
| REC10 | Receive/Save draft/cancel/review failure before confirm | No stock/lot/payment/payable projection; manual non-PO purchase still works |8 |

## Other decisions and presentation quality

| ID | Procedure / inputs | Required observable result | Task |
| --- | --- | --- | --- |
| ACT01 | FixtureC due 5000,collect Cash 1000+MFS 500 via correct Party | Due 3500, Cash+1000/MFS+500, linked invoice allocation, customer ledger/account/report agree once |9 |
| ACT02 | Pay supplier through role-correct control; inspect supplier costs | Exact source payable reduction/account effect; comparable unit cost evidence; no wrong role button from balance sign |5/9 |
| ACT03 | Review/save price change and inspect old invoice margins | Future product price updates; historical costs/prices unchanged; modeled benefit labeled |5/9 |
| ACT04 | Slow/expired lot → offer/stock review | Eligible draft/lot action persisted across Products remount/reload and cleared or reseeded on confirmed reset; source constraints respected; no automatic promotion/posting |9 |
| ACT05 | Expense spike → source correction; mixed cash split/transfer | Updated expense/source accounts reconcile; no expense/cash double counting; transfer excluded operating forecast |5/9 |
| ACT06 | Change30-day cash assumptions/save scenario then confirm real demo collection | Scenario only until source action; projected cash item replaced rather than counted twice |5/9 |
| ACT07 | Advisor evidence/plan/start/resolution/manual reason/snooze/dismiss/restore | Correct lifecycle/source version and scope; no click-to-fake-done, overlapping ROI not summed |5/9 |
| ACT08 | Customer follow-up/upgrade/send supplier order action | Created persisted labeled demo draft/request across navigation/reload and cleared or reseeded on confirmed reset, or honest disabled preview; never claims SMS/email/WA or external payment succeeded |9 |
| ACT09 | Supplier purchase/quote comparison with different packs/base units/landed assumptions; choose alternative | Normalized evidence/unknown terms visible; Planner receives supplier/unit/expected cost/source refs, saved plan→PO uses them, Return restores comparison; no master/history rewrite |5–9 |
| VIS01 | Side-by-side target Basic/Premium/library/planner views | Current visual library controls + Magic Patterns composition, eight KPIs/Ink-Mint/scatter/composed plot; no generic replacement |3–10 |
| VIS02 | Computed styles for fields/tables/controls across widths/languages/themes | Input 13/20/400Ink600; table 13/12/11;36 normal/48 only marked final; proportional digits; no bold oversized input |All |
| VIS03 | Tabs, cards, icons, radius, spacing, moving active marker | Actual family;2 px underline/13 px text, fields8/buttons10/panels12; role/icon meaning maintained |All |
| VIS04 | Default/hover/focus/selected/disabled/read-only/loading/empty/error/success | Stable geometry and values; meaningful disabled reason and inline error, success tied to actual demo result |All |
| VIS05 | All profile sizes, long Bangla, large/fractional/negative values | No clipped units/amounts/diacritics, no body overflow; table internal scroll and reachable More/action |All |
| A11Y01 | Keyboard only end-to-end, screen-reader names, no nested interaction | All routine tasks reachable, visible focus, semantic labels/status and no trap beyond owned dialog |All |
| A11Y02 | Dialog/popup viewport edges/touch/calendar/tooltip, text zoom | Correct reposition/portal/theme; Escape child first; background inert/locked without shift |All |
| A11Y03 | Full English/Bangla/bilingual including errors/status/buttons/tooltips/print | No critical untranslated copy; helpers only in correct mode; identifiers preserve leading zeros |All |
| A11Y04 | Contrast and axe per changed screen/theme/language | Normal text≥4.5:1, large/nontext essentials≥3:1; no critical/serious violations or hidden workflow |10 |
| A11Y05 | Chart pointer/focus/touch plus equivalent table/detail | Equal evidence access; labels/legend non-color, exact amount/period available |4–5 |
| MOT01 | Default timings and reduced-motion preference | Existing110/190/120/220/200 ms motion budget; dialog220/veil180 guide target; no financial count-up or delayed action |All |
| PERF01 | Empty/100/1000 rows, filter typing, chart updates, throttled representative device | Responsive input, bounded rendering, no console error/NaN, stable axes/geometry; report measured time rather than assumed performance |10 |
| SAFE01 | Permission missing/source changed/correct-reverse | Existing safeguards stay; no direct deletion of projections or bypass for visual demo |1/8–9 |
| SAFE06 | Source/QuickAdd/select clear and stepper focus/wheel/key | Current semantic interaction preserved; unfocused wheel scrolls, focused qty steps; no quantity input for phone/PIN |2/6 |
| SAFE07 | Basic/Premium/missing data/disabled permission/demo mode | Visible translated Demo data in Reports and linked Planner/PO/Purchase headers, nearby illustrative labels, distinct explanations; no accidental commercial policy or production security claim |3/5 |

## Existing commands and genuinely new checks

Existing on inspected #206 base; run only when the owning implementation changes or at final integration:

| Command | What it can establish |
| --- | --- |
| `node scripts/sync-design-guide.cjs --check` | Generated guide/inventory drift; no rendered parity |
| `node --experimental-strip-types --test tests/designGuide.test.ts` | Guide extraction/copy regressions |
| `npm run export:component-library` | Export source graph when needed, not production installation |
| `npm run test:report-workspace` | Existing library/filter/detail/CSV/planner browser regression |
| `npm run test:report-guidance` | Help/tooltips/language/accessibility |
| `npm run test:reports-a11y-matrix` | Existing report accessibility across profiles; extend for new screens |
| `npm run test:reports-print` / `npm run test:bangla-reports-print` | Output and popup recovery |
| `npm run test:table-typography` / `npm run test:field-size-parity` | Computed table/control roles |
| `npm run test:motion-navigation` | Shared navigation motion/reduced motion |
| `npm run test:purchases` / `npm run test:parties` / `npm run test:party-ledger` | Canonical purchase/Party/ledger regressions |
| `npm run test:compound-units` / `npm run test:multi-unit-products` | Existing unit control flows |
| `npm run test:erp-navigation` | Shell/query destination behavior |
| `npm run check:ui-contract` | Shared component/control guards; no allowlist expansion to hide a new violation |
| `npx tsc --noEmit`, `npm run build`, changed-code lint, `npm test` | Types/build/lint and pure regression suite when dependencies are available |

The browser scripts have their own runtime/dev-server/Playwright prerequisites; read each existing script before invoking. Missing dependencies or a failed browser start is **blocked**, never a pass. No new dependency installation was authorized by this documentation task. Historical full-suite quotation fixture failures must be rechecked/reported, not assumed still failing or silently ignored.

New plan-owned pure tests cover source coherence/deduplication, full chain validation, evidence/context, insights/scenarios, budget/planning, PO lifecycle, receipt/source reversal and other action projections. New browser entry points are `reports-details-browser.cjs`, `reports-insights-browser.cjs`, `reports-buying-browser.cjs`, `purchase-orders-browser.cjs`, `reports-purchase-cycle-browser.cjs`, `reports-actions-browser.cjs`; register `test:reports-details`, `test:reports-insights`, `test:reports-buying`, `test:purchase-orders`, `test:reports-purchase-cycle`, `test:reports-actions` when each is implemented. They do **not** exist yet. Extend existing checks rather than duplicate their assertions in a new all-ERP suite.

## Release evidence and failure policy

Gate 0 guide/source authority; Gate 1 target composition; Gate 2 controls/state; Gate 3 original Details; Gate 4 coherent purchase chain; Gate 5 language/theme/accessibility/motion; Gate 6 focused automated regression plus fresh independent review. Every relevant matrix case has a passed, failed, blocked or not-applicable result with evidence. All meaningful CTAs have an actual editor/mutation/output/preview or an intentional unavailable state. Required tracked-source/correction gaps keep Gate 4 incomplete.

Do not merge with P0/P1 defects. Classify P0 as misleading financial/stock completion, duplicate posting or source/scope corruption; P1 as lost workflow/evidence/draft, inaccessible routine action or material calculation mismatch; P2 as nonblocking layout/copy issue; P3 as polish. Source-only review can identify issues but cannot award rendered conformance. User visual/workflow acceptance and PR merge remain separate decisions.
