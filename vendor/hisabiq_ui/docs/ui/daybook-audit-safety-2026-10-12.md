# Day Book / Audit Ledger: source safety and real output

Main baseline: `0cc3a9a`. This independent PR does not merge or replace the Vendor/Finance/responsive PRs.

- Day Book no longer marks a displayed projection Deleted and claims money/stock reversal. “Review reversal” opens a readable explanation and an actual source-audit entry, where the full source impact can be reviewed. It leaves Day Book rows unchanged.
- Day Book and Audit Ledger print the **filtered records** in an isolated print document. Party statement CSS cannot hide the report. Row-level Day Book print includes only that transaction; Audit detail print includes the source identity/amount/due plus its exact posting lines.
- CSV exports contain actual filtered rows, preserve Bangla and escape spreadsheet formulas. Text printed as HTML is escaped.
- Audit reversal explicitly describes a sample posting, retains existing balanced engine and return-dependency validation, and uses the current timestamp.
- Remove duplicate `note` label in impact preview (build warning).

Shared controls, source permissions and original ledger calculations remain. Live source posting/durable cross-module projections are backend dependencies; the preview does not claim to reverse real finance or stock. Both pages show this limitation.

## Verification
Build, unit tests and UI contract; `scripts/daybook-audit-browser.cjs` tests filtered print, real downloads and unchanged projection after reversal review at 390/768/1024/1440px in light/dark. `tests/reportOutput.test.ts` tests exact data and HTML/CSV escaping. Full audit TypeScript/lint baseline failures remain.
