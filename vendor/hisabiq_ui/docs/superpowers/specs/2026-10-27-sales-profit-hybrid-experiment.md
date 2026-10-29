# HisabIQ Sales & Profit — Hybrid Experiment (27 Oct 2026)

## Brief / approved design
Create a **separate Sales & Profit Experiment** destination immediately next to the existing Sales & profit tab, without deleting, redirecting, renaming or replacing any current screen or the 34-report library. This is an opt-in comparison, not a rollout.

## Layout
- Keep HisabIQ Reports header and underline navigation.
- Show **one Report Library toolbar** (date, search, comparison, advanced filters, columns and saved views). Use one URL-backed operational source.
- Present a compact performance visual drawn from existing report charts / the original Magic Patterns Sales & profit source, with an affordance to expand the exact imported Magic Patterns four-way grouped view. Do not rewrite the original `SalesReport.tsx` or copy markup.
- Below, a single detailed-report selector offers seven relevant source reports: Sales register, Product performance, Category performance, Customer performance, Product gross profit, Sales returns, Discount review.
- Use the existing `ReportResults` for sortable columns, paging and details; `ReportDetails` for nested evidence, back, close and current-child print. Global print/CSV and saved views already exist in Reports, and must operate on the selected detail report.
- On selection, preserve date range/comparison but clear invalid dimensions; **do not claim Magic Patterns grouping reflects advanced filters** unless scoped source data has actually been reconciled. The canonical source table always reflects its toolbar filters. Chart scope labelled.
- The summary is collapsible to prioritize records; keyboard, phone, tablet, desktop, English/Bangla and dark/light retained. No separate generic info box with redundant heading/question text.
- Keep the experiment isolated behind `?screen=sales-lab` and a dedicated draft PR. Do not merge or deploy production.

## Execution / verification
1. RED tests prove navigation addition, unchanged original 11 screens and 34 reports, URL round trip, per-report dimension reset and historical-cost integrity.
2. Minimal screen adapter, nav entry, hybrid view and existing toolbar/results reuse.
3. Fresh TypeScript, ESLint, UI design contract, Node tests, Vite build and browser smoke across desktop/tablet/phone, Bangla and dark. Compare both original Sales & profit and the new experiment without changing originals.
