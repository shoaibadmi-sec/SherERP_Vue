# Monthly/Yearly Business Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement task-by-task and superpowers:test-driven-development for each calculation.

**Goal:** Give Bangladeshi business owners an honest monthly/yearly overview and downloadable draft audit sheet with exact evidence.
**Architecture:** Pure review helpers take the existing `ReportData` preview and build period flows, snapshots and readiness; a single Reports-hosted UI selects and displays these without altering the eleven Magic Patterns destinations or 34-report library.
**Tech Stack:** React, TypeScript, Vite, Tailwind, Node strip-types tests, GitHub PR CI.
**Spec:** `docs/superpowers/specs/2026-10-27-business-review-audit-report.md`.

## Global Constraints
- Source-linked HisabIQ records only; no separate accounting source, fabricated historical coverage or false 'audited' certification.
- 36px controls, proportional digits, 13/12/11 table typography; English + Bangla, keyboard-accessible underline tabs.
- Unknown historical cost, period-end stock and unverified source coverage stay null with readiness reason.
- No PR merges or production deploys in this task.

## Review Focus
- A month with no recorded transactions has unknown coverage, not verified zero.
- 24 completed months excludes the current partial month; leap-year February handled.
- Reversal/return amounts cannot imply known historical issue cost.
- Closing stock and dues are as-of amounts, never additive monthly flows.
- Cash-book payments or transfers must not be called trading income or net profit.

### Task 1 — Pure readiness and date ranges (R1)
- [ ] RED: `tests/businessReview.test.ts` exercises empty coverage, leap periods, unknown COGS, historical snapshots, no mutation.
- [ ] GREEN: Create `src/reports/review/{types,businessReview}.ts` with typed metrics, source references and readiness.
- [ ] Run tests, TypeScript, lint and commit.

### Task 2 — Monthly schedule and owner priorities (R2)
- [ ] RED: 24 completed months, year totals, net sales and purchase/expense/cash separation, top-three evidence rows.
- [ ] GREEN: Extend pure helper; never sum closing stock/dues across months.
- [ ] Run tests and commit.

### Task 3 — Single Reports workspace (R3)
- [ ] Add `src/components/reports/BusinessReview.tsx` using existing shared inputs/underlined tabs and ReportDetails.
- [ ] Wire `?workspace=business-review` in `src/pages/Reports.tsx`, preserving URL state for 11 destinations.
- [ ] Show summary/monthly/documents/session history, scope hints and explicit missing records.

### Task 4 — Draft output and verification
- [ ] Print short owner sheet using existing report print engine; CSV monthly schedule with missing cells and readiness.
- [ ] Add browser smoke and test RTL/keyboard/light/dark/responsive against original reports.
- [ ] Update this plan and PR with verified results; leave as draft. Historical bank-ready reports and formal approval remain separate work.


### Task 5 — Five-page A4 owner pack replacing one-page print (user correction 27 October)
**Files:** New `src/reports/review/auditBook.ts` (pure ranking and supporting source composition); `src/reports/review/auditBookHtml.ts` (print-only five-page A4 portrait vector SVG document), update `src/components/reports/BusinessReview.tsx` owner print callback; new `tests/auditBook.test.ts`.
- [ ] RED: rank top products, buyers, suppliers, orders and known gross contribution from the same `ReportData`; avoid duplicate invoice-vs-line totals; compare known stock and dues to snapshot date; no historical fabricated closing stock; do not convert unrelated units; exclude invalid/unknown amounts.
- [ ] RED: HTML is exactly five A4 portrait pages with five page numbers and chart graphics on each; user labels and business records escaped; draft/not-certified and missing-data state visible.
- [ ] GREEN: build source-backed `AuditBook`, print-safe SVG bar/pie graphics and constrained top-five tables, no new charts for the on-screen Magic Patterns navigation.
- [ ] Integrate `Print owner summary` to 5-page A4 while retaining separate monthly schedule print and CSV.
- [ ] Run `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run check:ui-contract`, `npm run build`, and browser print acceptance at 1440, 1024, 768, 390, 360px. Inspect rendered five A4 pages and Bangla fonts. Maintain draft PR and no deploy.
