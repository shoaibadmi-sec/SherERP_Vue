# Phase 23 — Party directory, relationship badges, CSV import entry

## Scope
Phase 22 translated the Party financial dialogs and statement impacts. This slice fills Party directory and two Party import entry surfaces in English, English + Bangla, and Bangla.

| Surface | UX changes |
| --- | --- |
| Party directory | Search placeholder and accessible labels, seven relationship filter names and All, list heading/count, receivable/payable/settled labels, multi-ledger hint and no-results state |
| Role badges | Use the existing `partyRoleLabel` map; preserve the original status tones |
| Customer/supplier Excel chooser | Localized dialog title, relationship selection, Cash/Bank/Mobile warning, cancel and legacy fallback |
| Legacy multi-role CSV preview | Localized upload labels, valid/rejected row counts, row issues, relationship display, cancel/confirm; unknown parser errors remain visible unchanged |
| Success toast | Plain Bangla success text only when Bangla mode is selected |

## Source integrity
- **No change** to import parsing, accepted CSV headers (`name`, `nameBn`, `phone`, `area`, `roles`), Party identity merging, role enum values, balances, row rejection, tenant scoping or preview transactions.
- English stored Party roles remain `Customer`, `Supplier`, `Vendor`, `Lender`, `Borrower`, `Payee`, `Owner`. Only visible copy is translated.
- Import remains **browser-preview-only**, with Customer and Supplier opening balances kept independent. It must not move Cash, Bank or Mobile funds.
- Reuses existing `PartyDirectory`, `RoleBadge`, `PartyExcelImportDialog`, `PartyImportDialog`, `ImportWizard`, `AppSelect`, `Input` and `Button`. No competing UI components.
- The shared multi-step `ImportWizard` and its map/review vocabulary are intentionally **not** modified in this Party-only slice to avoid changing Product imports without separate acceptance tests.

## Acceptance
- `node --experimental-strip-types --test tests/banglaPhase23PartyDirectoryImportContract.test.ts`
- `npm run test:bangla-party-directory-import` exercises role filter, blank query, Party Excel selector safety note, legacy CSV valid/invalid rows and Cancel across 3 languages × 390/768/1440px.
- Keep legacy `npm run test:party-import`, all other Party/POS, strict TypeScript, lint, build, theme and responsiveness checks green before merging.
- Never claim production backend writes, bank posting or complete ERP-wide bilingual coverage.
