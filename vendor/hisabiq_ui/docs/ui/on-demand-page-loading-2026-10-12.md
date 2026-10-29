# On-demand ERP and SaaS page loading

Every route previously imported its whole page upfront. The production main JavaScript bundle was 2,249.02 kB (609.45 kB gzip). React.lazy now loads the existing named page exports on demand; the main bundle is 625.34 kB (187.24 kB gzip), approximately 72% smaller. These are build-output sizes, not measured end-user startup times. Shared code, CSS and the active page still download; the main chunk remains above Vite's 500 kB advisory limit.

The route definitions, permissions, transaction components and calculators are unchanged. A shared PageBoundary around each shell's Outlet keeps the existing sidebar, header and settings/cash-session providers mounted during loading. It shows a compact bilingual status and a themed content placeholder. A failed download or render shows a real Reload page button while leaving navigation available. Changing pathname clears the error boundary; query-only changes preserve the current page's state. The design-system route has the same boundary without an ERP shell.

Reused components: AppShell, SaasShell, actual shared Button and existing page components. No new cart, picker, payment or field variant. No dependencies added. No backend posting implied.

## Validation

- Production-build Playwright checks: all 43 ERP, SaaS and design-system deep links in light/dark; cold Dashboard does not request unrelated POS/Product/Expense/Report chunks.
- Delayed Product chunk: status, preserved header and no overflow at 320, 390, 768, 1024 and 1440 px in both themes.
- Failed Product chunk: error state, usable navigation and successful real Reload recovery in both themes.
- Existing built receipt printing, POS reordering/receipt order, Purchase source workflows, ERP navigation and SaaS regression journeys.
- Strict TypeScript, build, lint, helper tests and design-contract checks.
- POS reorder browser test now waits for the first rendered cart row before reading row order; all original reorder and monetary assertions remain.

## Position of the wider audit

Numeric controls (#82) are implemented and all latest CI runs pass. Expense initialization (#80) and Purchase source workflows (#81) are implemented and checked. All remain reviewable, unmerged PRs; this loading slice is stacked on #82.

Remaining frontend work includes language-setting coverage, global search, Sales template editing and source-backed report date selection. The older parallel Vendor, reconciliation and responsive PRs also need dependency-ordered integration and a final composite regression pass after review. Purchase source snapshots and allocations are guarded, but independent Party/Finance/Audit preview stores are not canonical backend projections. Serial/batch returns and legacy seed records remain restricted where verified source data is missing. The full ERP is not declared production-ready.
