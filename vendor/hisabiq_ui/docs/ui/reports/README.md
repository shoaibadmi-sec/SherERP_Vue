# HisabIQ Reports — documentation index

Start with the canonical documents below. They consolidate the five 26 October proposals, actual GitHub behavior and the **current HisabIQ · Visual component library v2.2**. Documentation/planning only is authorized in this PR; no Reports UI or backend implementation and no merge.

| Document | Role |
| --- | --- |
| [Final UI/UX specification](../../superpowers/specs/2026-10-26-hisabiq-reports-final-uiux-design.md) | Requirements/decisions, eleven destinations, visual contract, details, demo architecture and complete workflows |
| [Implementation plan](../../superpowers/plans/2026-10-26-hisabiq-reports-uiux-implementation-plan.md) | Dependency-ordered file/interface/test tasks; all future UI tasks remain unchecked |
| [Component mapping](../reports-magicpatterns-github-component-mapping.md) | Magic Patterns composition → actual shared components and named gaps |
| [Workflow test matrix](../reports-uiux-workflow-test-matrix.md) | Concrete interaction/data/visual/language/theme/device/accessibility gates |
| [Consolidation source and review record](2026-10-26-consolidation-review.md) | Exact source versions, independent findings, synchronization and checks actually run |

## Implementation progress

The [27 October first Reports UI build](2026-10-27-report-ui-first-build.md) records the initial implementation slice, exact delivered behaviors, verification and remaining canonical tasks. The [review/decision record](2026-10-27-first-build-review.md) and [eight UI captures](qa-2026-10-27/) accompany it. It supersedes this documentation branch’s earlier authorization boundary only for the newly requested implementation; it does not mark the whole plan complete.

## Read order and authority

Read [AGENTS](../../../AGENTS.md) → [v2.2 guide](../HISABIQ-DESIGN-GUIDE.md) → specification → relevant existing contract/actual source → component mapping → implementation plan/QA. Current explicit user choices and narrower current contracts retain priority. Magic Patterns Reports is the page-composition reference; the current visual library is the control-styling reference; GitHub is the implementation source of truth.

This branch is stacked on [PR #206](https://github.com/shuvodelux-commits/hisabiq_ui/pull/206), `docs/complete-hisabiq-design-guide-20261026` at `6758e2cf0b6a68f80563918e6f8168928e0529ab`, which already carries the guide/library/input fixes and generation scripts. Main was inspected at `79c51fdbbc8ce47364488127a1e2c5762f6526d9`. Neither PR is merged by this task. When #206 is separately approved and merged, retarget this documentation PR to main and verify it still contains only documentation changes.

Live [Magic Patterns](https://www.magicpatterns.com/c/t6q3mxi6nhuak3qjvx8cwn) capture: artifact `5b1f6ae5-d2c4-4e7b-8756-b74ffdb8f872`, guide v2.2. Attached ZIP and older captured artifacts remain historical references. Do not override the current source with them.

## Related binding and implementation references

- [Portable AI instructions](../AI-UI-PROMPT.md), [generated inventory](../design-system.json); generated runtime data at `src/data/designGuide.json`, source catalogue at `src/data/componentCatalog.json`.
- [Cart and shared UI contract](../transaction-cart-design-contract.md), [Products table typography](../2026-10-24-table-typography-contract.md), [36/48 px realignment](../2026-10-25-magic-patterns-brand-realignment.md), [motion](../framer-motion-navigation-contract.md).
- [Context-complete workflows](../../superpowers/specs/2026-10-09-erp-kiss-contextual-workflows-design.md), [purchase source workflow](../purchase-source-workflows-2026-10-12.md), [source review](../purchase-source-review-2026-10-12.md).
- [Historical 24 October Reports implementation verification](../2026-10-24-report-workspace-verification.md) and [historical UI review](../2026-10-24-report-workspace-ui-review.md). Their dated results are retained, not rerun claims.

## Preserved research and superseded guidance

The imported documents below retain their complete original text after a supersession notice. They contain historical evidence and alternative proposals; use the canonical specification to resolve conflicts.

| Historical document | Useful evidence / superseded direction |
| --- | --- |
| [GitHub vs Magic Patterns audit](history/HisabIQ_Reports_GitHub_vs_MagicPatterns_Audit_2026-10-26.md) | Catalog/functionality/security findings; GitHub-as-visual-target and production-only data restrictions are superseded for this demo |
| [Real-world workflow research](history/HisabIQ_Reports_Real_World_Workflow_Research_2026-10-26.md) | Morning/collection/buying/margin/cash journeys and source links; alternatives are not new approvals |
| [Earlier final UI/UX proposal](history/HisabIQ_Reports_Final_UIUX_Superpowers_Design_2026-10-26.md) | Purchase plan/order/receipt workflow; six-tab IA is superseded |
| [Magic Patterns-first proposal](history/HisabIQ_Reports_MagicPatterns_First_Superpowers_Design_2026-10-26.md) | Composition/charts/behavior; seven-plus-five nested navigation remains unapproved |
| [Superpowers/Impeccable QA proposal](history/HisabIQ_Reports_UIUX_Superpowers_Impeccable_Design_QA_2026-10-26.md) | Details/QA/guide gates; v2.1 and missing-guide assumptions updated by current v2.2/#206 evidence |
| [24 October design](../../superpowers/specs/2026-10-24-report-workspace-design.md) / [plan](../../superpowers/plans/2026-10-24-report-workspace.md) | Record of delivered library behavior; future conflicting visual/navigation instructions are superseded |

Do not implement UI tasks from the historical files. Material alternatives in the final specification remain labeled proposed until reviewed. The current brief authorizes writing this consolidated plan now, overriding older proposals that said to wait before writing documentation.
