# Report table readability

The user requested slightly less compact report tables and cleaner typography, then selected Products as the typography standard for every table. Reports retains its added space and follows the shared [13/12/11px contract](2026-10-24-table-typography-contract.md).

## Changes
- Main table data: 13px; cell padding increases from 4px/8px to 8px/12px vertically/horizontally.
- Headings use a light existing surface tint, medium weight and clearer separation from Bangla helper text. Totals retain stronger weight and extra vertical space.
- Headings use 12px and helpers/badges use 11px; normal ERP controls retain their existing 36px sizing.
- Dates, references and amounts stay on one line. Narrow layouts retain the existing named, keyboard-scrollable table region.
- Report and contributing-record tables explicitly use proportional digits rather than inheriting the body's tabular-number feature. Geist/Hind Siliguri and all existing semantic colors remain.
- Contributing-record tables use the same data size and spacing. No report calculations, output formatting or filters change.

## Verification
The initial refinement compared sales-register tables on bilingual light desktop/tablet, English dark desktop and Bangla dark phone. Sorting and record details worked; four sales-register axe scans returned zero findings. One corrective pass retained single-line dates/references rather than stretching rows through wrapping. The user's subsequent typography decision changes text sizes to the shared Products standard; the ERP-wide contract records current computed-size coverage.

The existing guidance test passes four device/language/theme profiles, and the report-workspace browser smoke passes filters, details, columns, saved views, CSV and purchase planning. TypeScript, production build and focused ESLint pass with zero errors; one existing fast-refresh warning remains. Detector: no findings. Report-model tests and UI-contract results are recorded in the PR. Full repository unit tests are outside this presentation-only follow-up; PR #200 documented two pre-existing quotation failures.
