# Reports: Magic Patterns → actual HisabIQ component mapping

**Canonical companions:** [spec](../superpowers/specs/2026-10-26-hisabiq-reports-final-uiux-design.md), [plan](../superpowers/plans/2026-10-26-hisabiq-reports-uiux-implementation-plan.md), [QA](reports-uiux-workflow-test-matrix.md), [index](reports/README.md). Reviewed against guide/library PR #206 at `6758e2cf…` and live artifact `5b1f6ae5…`, guide v2.2. Paths below are repository paths. **Existing** means present on that branch, not verified fully conforming at runtime by this review. **Extend** names real existing source; **New** is planned domain UI/behavior, not an installed primitive.

## Composition, controls and evidence

| Magic Patterns reference / element | GitHub implementation source | Disposition and constraint | Proof |
| --- | --- | --- | --- |
| `pages/Reports.tsx` common header | `src/pages/Reports.tsx`, `src/components/PageHeader.tsx` | Extend composition; keep current route/data/preferences; do not import prototype shell | NAV/VIS |
| `ReportsNav.tsx` | `src/motion/MotionTabList.tsx`, `src/motion/tokens.ts`, native tab buttons in current Reports/Party | Compose real MotionTabList + MotionTabIndicator with semantic keyboard handlers; new ReportsNav domain wrapper only | NAV02/03, VIS03 |
| Visual library Report toolbar specimen | `src/components/brand/ReportToolbarSpecimen.tsx`, `src/components/reports/ReportToolbar.tsx` | Existing actual search/date/compare/filter/chips/saved controls; use callbacks and definition dimensions | LIB02/03 |
| Column dialog | `src/components/ColumnVisibilityEditor.tsx` | Already extracted in #206 and used by real Reports; preserve required label column | LIB04 |
| Saved/pinned views | `src/reports/preferences.ts`, existing `src/pages/Reports.tsx` dialogs | Extend for screen; preserve tenant/actor storage,20-view cap, corruption warning and reload | LIB05/06 |
| Input/search fields | `src/components/{Input,NumericInput}.tsx`, `src/index.css` | Existing; v2.2 applies13/20 regular400 Ink600, muted placeholder; controlled search X and focus behavior | VIS02, A11Y03 |
| Short fixed option / searchable entity | `src/components/{AppSelect,SearchSelect,FormSelect}.tsx` | Actual appropriate primitive; replace raw prototype selects, preserve popup positioning/key behavior | LIB03, SAFE06 |
| Inline dependency creation | `src/components/{QuickAddSelect,QuickAddDialog}.tsx`, actual domain create handlers | Existing family; inline Add new, no external plus per field; no read-only report filter creation unless workflow needs it | BUY04, ACT08 |
| Date period/native prototype inputs | `src/components/AppDateRangePicker.tsx`, `src/utils/dateRange.ts` | Use actual single/range exports; Dhaka business dates, invalid bounds, previous equal-length period | LIB02 |
| `ReportBits` KPI / panels | `src/components/{Panel,PageHeader}.tsx`, `src/components/dashboard/{MetricCard,WidgetFrame}.tsx`, `src/components/reports/ReportOverview.tsx` | Adapt composition to current tokens. Do not blindly reuse a Dashboard footnote with known language gaps. No nested KPI/help buttons | VIS01, DET02 |
| Basic analytical tables | `src/components/Table.tsx`, `src/components/reports/ReportResults.tsx` | Existing roles13/12/11, overflow region, sorting/page, data markers and helper roles | LIB01/04, VIS02 |
| Buttons / status | `src/components/{Button,Badge,StatusBadge,Switch}.tsx` | Existing;36 px ordinary/48 px marked completion; actual switch API, no locally redrawn toggle | VIS02/04 |
| InfoTip/help, bilingual descriptions | `src/components/Tooltip.tsx`, `src/components/reports/ReportGuidance.tsx`, `src/reports/{copy,guidance}.ts`, `src/i18n/useUiCopy.ts` | Existing; text/focus/touch, translated accessible names; important instructions remain inline | A11Y01/03/05 |
| Generic overlay | `src/components/Dialog.tsx`, `src/utils/bodyScrollLock.ts` | Existing focus/portal/scroll owner; no second Modal/Drawer primitive or z9999 workaround | DET04, A11Y02 |
| Insight / chart / product / party evidence | `src/components/reports/ReportDetails.tsx`, `ReportRow.children` in `src/reports/types.ts` | Extend existing fact grid/child trail/print; new typed evidence adapter maps current sources, not a replacement dialog | DET01–06 |
| Premium plan preview | Existing settings/access context plus report-specific preview | Extend UI preview state; do not invent billing success/production entitlement enforcement | SAFE07 |

## Analytical surfaces and data

| Live Magic Patterns source | GitHub reuse / planned extension | Difference to resolve |
| --- | --- | --- |
| `basic/OverviewReport.tsx` | Extend `src/components/reports/ReportOverview.tsx` | Eight tiles, dual area 250 px, attention and supporting evidence; preserve known-cost and snapshot rules |
| `basic/{Sales,Stock,Dues,Money}Report.tsx` | New `src/components/reports/basic/{SalesReport,StockReport,DuesReport,MoneyReport}.tsx`, existing catalog/model/results/toolbar | New compositions consume shared selectors; all fields/filters/details remain functional |
| `premium/AdvisorReport.tsx` | New `src/components/reports/premium/AdvisorReport.tsx`, `src/reports/insights.ts` | Preserve Ink/Mint focal layout; replace global localStorage, arbitrary Mark done and cross-tab-only evidence |
| `premium/ProfitReport.tsx` | New `premium/ProfitReport.tsx`, shared report evidence/model | Scatter230 px, profit bridge, compatible cost evidence; no missing-cost→0 |
| `premium/BuyingReport.tsx` | New `premium/BuyingReport.tsx` plus Planner | Toast-only Prepare PO becomes real saved-plan/order transition |
| `premium/CashflowReport.tsx` | New `premium/CashflowReport.tsx`, `src/reports/scenarios.ts` | Composed260 px, table and scenario;30-day baseline;7/90-day extension proposed |
| `premium/CustomersReport.tsx` | New `premium/CustomersReport.tsx`, existing Party/Sales sources | Cadence/risk evidence, actual collection/follow-up draft; age not invented overdue |
| Charts, legends and tooltip | Installed Recharts; existing Dashboard chart examples and report formatting; themed `src/theme.css` | Compose appropriate chart type; no new library. Add keyboard/touch table/detail alternative, avoid hardcoded white/tooltips/tabular digits |
| `pages/ReportsWorkbench.tsx` | Existing `src/reports/{catalog,types,model}.ts`, `src/components/reports/{ReportToolbar,ReportResults,ReportDetails}.tsx` | Discard older prototype engine; preserve GitHub34 IDs,27 preview views,7 readiness states |
| Prototype history/metrics/advisor | Existing `src/reports/model.ts` plus new typed demo fixture/insight selectors | Adapt ideas, not duplicate transaction history. Label demo/scenario/unknown; freeze unit/cost evidence |
| Prototype `DemoStore`, `useScreenInit`, routing | Existing preview stores, React Router HashRouter; new `src/reports/demo/{types,store,fixtures}.ts` | No copied store/router/scaffold. Missing subscriptions/projections and persistence are explicit Tasks 1–2 |
| Print/CSV | `src/utils/reportOutput.ts`, current Reports/detail handlers | Actual full filtered output and popup recovery; sample basis visible; no bare window.print transplant |

## Purchase and other domain actions

| UI or workflow | Actual family / new owner | Implementation gap and safeguard |
| --- | --- | --- |
| Editable planner lines | `src/components/purchases/PurchaseCart.tsx`, `src/components/transactions/TransactionCartEditor.tsx`, `src/utils/{purchaseCart,multiUnitTransactions}.ts` | Extend semantic planning/order mode using actual family; no second product cart or picker; domain stock/payment semantics stay separate |
| Product search | `src/components/pos/ProductCombobox.tsx` and existing transaction editor search | Search Bangla/English metadata, keys/touch/clear, Quick Add; do not create a select listing products |
| Compound quantity/price | `src/components/transactions/{CompoundQuantityInput,MultiUnitQuantityInput}.tsx`, `src/components/MoneyUnitInput.tsx` | Preserve inline `1 CT 2 BOX 3 PCS` family, configured chain/price unit; shared extension only where needed |
| Unit snapshots/source validation | `src/utils/{unitChain,multiUnitTransactions,purchaseCart,purchaseSource}.ts` | Extend validator beyond base/alternate to intermediate chain units, preserve frozen profile and entered map; Task 2 |
| Saved plan | New `src/reports/planning.ts`, `planning/{PurchasePlanner,SavedPurchasePlans}.tsx` | Stable IDs, explicit recalculation, overrides, supplier pack/budget and converted allocations; nonposting |
| Purchase Orders list/detail/editor | New `src/purchases/{orderTypes,orders}.ts`, `src/components/purchases/orders/*` inside `src/pages/Purchases.tsx` | New orders tab/query parser; confirmed revisions, supplier split, actual sample print; no actual payment in PO |
| Actual goods receiving | `src/pages/PurchaseEditor.tsx`, new `src/purchases/receiptHandoff.ts` | New receipt seed; initialPurchase is correction, not new receipt. Stable commit links receipt/PO/purchase once |
| Purchase payments / review | `src/components/purchases/PurchasePaymentPanel.tsx`, `src/components/TransactionReviewDialog.tsx`, `src/utils/{purchaseCheckout,purchaseSupplierGuard,purchasePaymentMethods}.ts` | Existing split/review family; reconcile actual goods/cost/payment; marked 48 px only actual completion |
| Purchase correction/return | `src/components/purchases/PurchaseSourceDialog.tsx`, `src/utils/purchaseSource.ts`, `src/data/erpDemoStore.ts` | Existing revision/date/permission/reason checks; tracked-stock returns and later-allocation correction need tested extension, not bypass |
| Customer collection/supplier payment | `src/components/parties/{PartyDetail,PartyPaymentDialog,PartyFinanceDialog}.tsx`, `src/components/finance/FinancePaymentSplitEditor.tsx` | Reuse role capabilities `src/components/parties/partyRoleActions.ts`; source allocation and demo projection once |
| Supplier/product/expense/source navigation | Existing pages and `src/navigation/{erpNavigation,resolveErpNavigation}.ts` | New exact-source opener/validated return contract; existing `?q=` only filters |
| Pricing / slow stock / expiry | `src/pages/Products.tsx`, `src/components/products/ProductInventoryDialogs.tsx`, `src/data/productOffers.ts` | Use real product/offer/lot editor; migrate current page-local offers to shared persisted source adapter, future price not historic rewrite |
| Expense/cash actions | `src/pages/{Expenses,Finance,Counter}.tsx`, existing finance/expense source handlers | Reuse domain operation, not report-local form or duplicated cash entry |
| Follow-up/send/upgrade | New demo request/task record through existing presentation where possible | Draft/preview only until integration; success requires created record, never claims external delivery |

## Guide/library synchronization ledger

| Requested source | Repository counterpart on #206 | Status for this PR |
| --- | --- | --- |
| `docs/ui/HISABIQ-DESIGN-GUIDE.md` | Same path | v2.2 exact authored guide; reused |
| `docs/ui/AI-UI-PROMPT.md` | Same path | Exact portable instructions; reused |
| `docs/ui/design-system.json` | Same path | Generated inventory with guide hash; reused, not manually edited |
| Magic Patterns `data/designGuide.json` | `src/data/designGuide.json` | Same generated content; prototype path differs intentionally |
| `hisabiq-library/data/componentCatalog.json` | `src/data/componentCatalog.json` | Same11 specimen groups; namespace is export adapter, not production source |
| `docs/ui/COMPONENT-LIBRARY-PREVIEW.md` | Produced with namespace by `scripts/export-component-library.cjs` | Export README, not missing runtime feature; inspect reference/export contract rather than add duplicate docs |
| `hisabiq-library/components/brand/VisualComponentLibrary.tsx` | `src/components/brand/VisualComponentLibrary.tsx` and source dependency graph | Source-faithful prototype adapter, never copy namespace into src |

Guide SHA256: `6c3cc838038f8a0f9828c914216e345ff9c40d3477644c04b5995af39194d496`. One authored guide generates inventory/cache via `scripts/sync-design-guide.cjs`; source export via `scripts/export-component-library.cjs`. #206 is still open; “available on dependency branch” is not “merged on main.” The source-review records fresh byte comparisons and command results.

Known library labels remain meaningful: FeedbackState is a prepared shared composition, not proof of adoption throughout ERP; chart/footnote/upload accessibility or language gaps are migration work; MotionTabList supplies presentation, not automatic ARIA keyboard behavior. There is no approved authored ERP Card, Drawer, ActionMenu, ProductPicker or TransactionCart wrapper merely because older plans named one. Use Panel and actual named components; record the smallest justified shared addition with states, i18n and tests.
