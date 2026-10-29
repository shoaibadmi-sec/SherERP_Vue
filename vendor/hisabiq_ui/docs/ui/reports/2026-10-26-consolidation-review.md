# Reports consolidation — source, synchronization and review record

**26 October 2026, Asia/Dhaka.** Scope is documentation consolidation/planning. No Reports UI implementation, dependency installation, backend work, deployment or PR merge. Read the [canonical index](README.md).

## Source provenance and scope of inspection

| Source | Verified revision / treatment |
| --- | --- |
| GitHub default main | `79c51fdbbc8ce47364488127a1e2c5762f6526d9`; actual Reports/catalog/details/preferences/output/Purchases/editor/stores/contracts and commands inspected |
| Open guide PR #206 | `docs/complete-hisabiq-design-guide-20261026`, head `6758e2cf0b6a68f80563918e6f8168928e0529ab`; this PR's dependency/base, not a merged main feature |
| Live Magic Patterns editor | `t6q3mxi6nhuak3qjvx8cwn`, active artifact `5b1f6ae5-d2c4-4e7b-8756-b74ffdb8f872`; actual Reports page,10 Basic/Premium views, nav, models/history and current library specimens read |
| Current visual library | Guide v2.2; Markdown/hash, AI prompt, generated inventory/designGuide,11-group component catalog, actual input/quantity/toolbar/Party specimens inspected |
| Attached `magic-patterns.zip` | Older starter export; inspected archive inventory, not substituted for live Reports/library |
| Five named planning documents | All read in full through primary/independent review; imported intact under `history/` with notices |
| Current brief | `Pasted text(1).txt`; authorizes documentation branch/PR and independent review only |

Live/source guide SHA256 is `6c3cc838038f8a0f9828c914216e345ff9c40d3477644c04b5995af39194d496`. The current guide itself embeds an older artifact as authoring evidence and its footer has v2.1/v2.0 entries; neither changes the v2.2 capture. This documentation task does not silently rewrite the guide or regenerate code/inventory for a Reports-only planning change.

## Synchronization status and actual gaps

#206 already owns `docs/ui/{HISABIQ-DESIGN-GUIDE.md,AI-UI-PROMPT.md,design-system.json}`, `src/data/{designGuide,componentCatalog}.json`, visual library/specimens, input typography and the generation/export commands. Reuse it. Magic Patterns `data/`/`hisabiq-library/` paths intentionally differ from GitHub `src/`; those adapters are not production files to import. The export's COMPONENT-LIBRARY-PREVIEW README is documented by `scripts/export-component-library.cjs`. No competing guide/cache/namespace is introduced here.

Missing behavior identified in source:

- Current Magic Patterns Prepare PO is toast-only; PO/plan/receipt persisted lifecycle and exact source lineage are new work.
- GitHub Reports has34 catalog IDs,27 preview views and7 readiness states, worth preserving; older prototype ReportsWorkbench has less functionality.
- Existing ReportDetails has nested contributors/print/route links; aggregate/Premium coverage, exact source opening and full return context need extension.
- Existing purchase arrays lack observable subscriptions; Reports lacks purchase/party subscriptions, and created purchases are absent from stock-movement history. Sales preview does not automatically project every stock/ledger/cash effect.
- Full-chain purchase cart can enter intermediate units, but source validation accepts only base/alternate cost units. Preserve frozen profile, per-unit prices and source-safe totals.
- Current receipt handoff is absent; `initialPurchase` means correction. Add a distinct receipt seed and one idempotent commit, not two postings.
- Current source return disallows serial/batch/expiry, and corrections are blocked after later payment/return allocations. Required tracked-safe support is an explicit task/gate, not assumed available.
- Advisor global localStorage/Mark done, chart keyboard access, some hardcoded English/white surfaces/tabular digits and raw selects need adaptation to the current library.
- Commercial Premium rights, grouped navigation, optional horizons/hard budget and replacement policy remain proposed choices; guide presence does not settle them.

## Independent architecture and UX review

Two independent reviewers inspected actual source and the five proposals before consolidation. Architecture review identified source subscription/projection gaps, chain-unit rejection, correction/return constraints, exact source navigation and receipt retry/lineage requirements. UX review reconciled the visual authority,11 destinations, input/table typography, chart/Details coverage, demo labeling, two distinct fixture stories and unresolved choices. These findings are reflected in the specification, tasks and matrix.

Final canonical-document review found and resolved: collection increases receiving accounts rather than reducing them; zero/free actual purchase support is explicitly deferred because existing source guards reject it; offers/follow-up/requests require shared persisted ownership; deleting a plan-generated draft releases allocations with retained history; supplier comparison has a complete Planner/PO handoff; Demo/reset placement and compatible-unit aggregation are explicit. Both reviewers then confirmed their material findings resolved; their final wording note about Reset clearing/reseeding was applied. No P0/P1 finding remains from that review. This is independent architecture/UX documentation review, not rendered acceptance or production financial certification.

## Checks actually run for this documentation PR

| Check actually executed | Result |
| --- | --- |
| `node scripts/sync-design-guide.cjs --check` | PASS: v2.2,32 chapters,243 component files,152 Lucide imports,59 color roles per theme |
| Byte comparison of live guide/AI prompt/inventory/designGuide/componentCatalog with #206 counterparts; parse3 JSON files | PASS: all5 files identical; guide SHA256 above |
| `node --experimental-strip-types --test tests/designGuide.test.ts tests/reportWorkspace.test.ts tests/purchaseCart.test.ts tests/purchaseCheckout.test.ts tests/purchaseSource.test.ts` | PASS:33 tests,0 failed; existing Node module-type warnings |
| `npm run check:ui-contract` | PASS: generation/shared-component guard,3 guard tests,3 sizing tests, focus/control static checks; inventory flags15 existing items for rendered review, not automatic invalidity |
| Local Markdown target/task/scenario/history validation | PASS:56 relative links across11 canonical/updated documents;11 task sections;69 unique scenario IDs after final review; all5 imported histories preserve the complete original text after notices |
| `git diff --cached --check -- . ':(exclude)docs/ui/reports/history/*'` / staged scope | PASS for authored/updated docs; only16 Markdown files changed relative to #206. Full diff flags original two-space Markdown hard breaks in imported histories; those sources are preserved exactly, not silently reformatted |

No dependencies were installed. Build, TypeScript compiler, full unit suite, browser workflows, screenshot comparison, axe, physical-device performance and all planned new scenarios were **not run** for this documentation-only change. The33 focused tests are existing code regression checks; they do not certify the newly planned workflows. The6 UI-contract tests are separate from that33 count. Existing npm proxy-configuration and Node module-type warnings were not changed. #206 and24 October browser results remain dated evidence, not current test claims.
