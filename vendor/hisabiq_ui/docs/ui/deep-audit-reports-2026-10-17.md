# Reports audit — 17 October 2026

Base: fetched `origin/main` snapshot `c10ec66b1278de7dc26747040419d1c626afb566` (no newer commit was available). No hosted CI was used as test evidence, and no PR was merged.

## Reproduced gap and repair

| ID | Priority | Finding | Result |
| --- | --- | --- | --- |
| REP-02 | P2 | Reports had a real accountant CSV but no print path for the same September report. | Added **Print report**. It opens the shared isolated report document, includes the same source values/sections as CSV with translated table labels, identifies the numbers as sample/non-live, and gives actionable feedback when popups are blocked. |
| REP-03 | P1 | Once the expense pie finished animating, axe found six unlabeled chart-sector images (`svg-img-alt`). | Marked the chart as decorative because the adjacent category list already contains all six labels, amounts and percentages; named that list for navigation and removed the decorative pie root from keyboard tab order. Browser verification waits for all six sectors before scanning. |

The existing September export remains a real CSV download. Only September is enabled because the other period values have no source data. Profit & Loss still opens Accounts Statements with tab state preserved across reload/back/forward; Stock valuation opens Product Stock lots. Daybook and the cash/account reconciliation cards remain direct working routes/dialog actions. The receivable/payable age rows contain only static aggregate figures and no source record IDs, so this audit does not invent a drill-down or imply those rows are linked to a party ledger. The report remains a disclosed UI sample, not an authoritative accounting statement.

## Local browser verification

- `scripts/reports-print-browser.cjs`: passed four combinations: 320×700 light/English, 390×844 dark/Bangla, 1024×768 light/English + Bangla, and 1440×900 dark/English. It verifies Enter activation, touch activation, the real popup, title, sample-data disclosure, all four report sections, print invocation, opener isolation, blocked-popup feedback, and no page errors.
- Existing `scripts/document-actions-browser.cjs`: passed all 10 width/theme profiles. It confirms the CSV download, Profit & Loss reload/history, Stock valuation route, other document actions, and blocked print feedback.
- `scripts/reports-a11y-matrix-browser.cjs`: 48 whole-page scans (8 requested sizes × light/dark × English/English + Bangla/Bangla); the pie is fully rendered before scans and all six expense values remain in a named text list. No report-specific axe violations, horizontal page overflow, or runtime errors. Two other cross-page findings remain: serious `scrollable-region-focusable` on `.overflow-x-auto` at 320px in all language/theme pairs and at 360px in English/bilingual (10 profiles); serious `target-size` on `.inset-y-0` at 1440px in English/Bangla in both themes (4 profiles). The first is the shared Table issue tracked in the existing unmerged #135 work; the latter is the narrow sidebar resize toggle, outside this Reports action change. The matrix is not reported as violation-free.
- `npx tsc --noEmit` passed; `npm test` passed all 121 files; `npm run lint` exited successfully with 0 errors and the existing 185 warnings; `npm run check:ui-contract` passed; `npm run build` passed with the existing large-chunk advisory.

## Deferred

There is no live tenant/date-period report source or per-party aging allocation in this UI snapshot. No backend integration, fiscal correctness, or authenticated tenant export is certified. The shared table and sidebar target-size findings remain separate cross-page accessibility work.
