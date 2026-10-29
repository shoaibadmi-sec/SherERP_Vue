> Historical completed plan. Do not execute it as the current Reports roadmap; use the [canonical26 October implementation plan](2026-10-26-hisabiq-reports-uiux-implementation-plan.md). Its execution results below are dated historical evidence.

# Reports Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver a detailed decision-oriented Reports UI with functioning selection, output and drill-down.
**Architecture:** Existing preview stores feed pure report projections. Shared catalog/filters/results/detail components extend the existing route; no second data ledger.
**Tech Stack:** Existing React/TypeScript, Recharts, Framer Motion, Playwright, Node tests.
**Spec:** docs/superpowers/specs/2026-10-24-report-workspace-design.md

## Global Constraints
36px controls; actual shared primitives; no monospaced digits; three language modes; light/dark; honest preview data; no backend posting or new dependency.

## Review Focus
- Unknown historical costs must not become master-price profit.
- Split account filtering must use that account's amount only.
- Stock snapshots must not imply historic balances or doubled reservations.
- URL/storage corruption must recover safely and browser Back must restore selection.
- CSV/print reflect every active filter, visible columns and full filtered set, not only one page.

### Task 1: Source projection and selection
Files: src/reports/{types,catalog,model,data}.ts; tests/reportWorkspace.test.ts.
Interface: buildReportData(input:ReportInput):ReportData; runReport(key:ReportKey,data:ReportData,filters:ReportFilters):ReportResult.
- [x] Write and run failing unit tests for date/category search, posted exclusion, discount allocation, unknown cost, split amounts, stock safety and previous-period dates.
- [x] Implement typed source adapter, report catalog, selection and aggregation.
- [x] Run tests and commit.

### Task 2: Shared report workspace
Files: src/pages/Reports.tsx; src/components/reports/{ReportToolbar,ReportResults,ReportOverview,ReportDetails}.tsx; src/reports/{useReportData,preferences}.ts.
- [x] Add failing browser scenarios for overview, group/report selection, filter reset, sorting, columns, source details and saved views.
- [x] Build shared components with current design primitives; add purchase assumptions and CSV/print, persistent favorites/views and URL state.
- [x] Verify browser scenarios and build; commit.

### Task 3: Verification and review
Files: scripts/report-workspace-browser.cjs; existing report-specific browser tests; docs reporting evidence.
- [x] Update legacy static September expectations to dynamic preview behavior.
- [x] Run unit suite, build, UI contract and targeted browser checks at desktop/tablet/mobile, languages and themes.
- [x] Inspect desktop/mobile captures in one batch; fix material defects, confirm once. Run Impeccable detector once.
- [x] Request fresh finish/code review; address material findings, publish branch and open PR without merging.


## Execution record

Implemented in this session on a fresh feature branch. Five code-review findings were fixed with regression coverage. See docs/ui/2026-10-24-report-workspace-verification.md for actual test results and two pre-existing quotation failures. Draft PR only; no merge.
