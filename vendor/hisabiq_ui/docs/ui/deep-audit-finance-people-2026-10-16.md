# Nested Finance people and accounts — 16 October 2026

Baseline: current main `f61a66d6108a490234bb27da47384bd7eaafcf5b`. PRs #121–129 are merged; all 44 applicable head workflows were independently read and report success. This is frontend preview evidence, not backend certification.

## Browser reproductions

- DPI-20 / P0: create a second Hafizur Rahman with a distinct phone, choose the second lender, record 123, then rename that second person. FIN-000189 remains assigned to the first lender. The new-transaction selector used names as identity. Use IDs for values and show phones to distinguish people; retain transaction IDs, directions and arithmetic.
- DPI-21 / P1: deactivate Hafizur, open New transaction, open and wait for the visible options list: the inactive lender remains selectable. Filter by active status and the selected transaction role. Explicitly selected people that become ineligible must not silently become another person.
- DPI-22 / P1: enter an amount/reference in New transaction; no contextual people/account creation control exists. Reuse the existing FinancePeopleManagerDialog and AccountDialog, preserve the parent form, auto-select the created person/account, and restore focus. Role buttons expose their existing selected state with aria-pressed.

The first inactive probe checked an absent option before asserting that its list was visible and gave a false pass. The strengthened probe reproduces the defect; only that observation is counted.

- DPI-26 / P0: deactivate Hafizur, correct FIN-000187 to 123, save. Its party silently becomes Abdul Karim because correction filtered out the historical identity and fell back to the first active person. The original source person remains eligible only for its original transaction type, even if inactive or its present-day roles changed. Other inactive identities remain unavailable; explicit missing IDs cannot fall back to another person.
- DPI-27 / P0: create another Dutch-Bangla Bank · 4582 with opening 1, select the second bank for a 123 receipt. The second balance stays 1 while the first gets the money. Shared payment rows now use account IDs, and show balance suffixes for duplicate names. No account schema or movement formula changes.

- DPI-28 / P0: in a half-filled default-lender transaction, open the nested manager and deactivate Hafizur. The parent silently switches to Abdul Karim because the default was derived from the current first eligible person. Pin the initial displayed default to its ID; when it becomes ineligible, require an explicit eligible choice without losing the parent draft.

## Regression inventory

`scripts/deep-finance-people-browser.cjs` runs five journeys across all eight requested viewports, light/dark and English/bilingual/Bangla (240 journeys). Touch through 1024px; mouse above. It retains screenshots/traces on failure and measured JSON counts.

| Journey | Real interactions and outcome |
| --- | --- |
| Same-name identity | Add second lender with different phone → choose it → review/confirm → rename it → FIN-000189 follows the second ID; existing FIN-000187 stays unchanged. |
| Historical correction | Inactive original lender → correct amount → save/reopen retains source person ID and source reference. |
| Same-name money accounts | Create second bank → choose its option → confirm receipt → second balance 124, first remains 214650. |
| Active role eligibility | Half-fill parent → nested deactivate its default lender → no silent reassignment; amount/reference retained and review blocked → visible options exclude it → Escape keeps parent → switch to borrower → only borrower options appear. |
| Nested parent draft | Half-complete transaction → people validation/create and role selection → auto-select → reopen/edit/cancel/Escape/focus return → account invalid opening/cancel → create bank → preserve reference/note/amount → cancel/reopen parent → review/confirm correct person/account/123.25. |

Parent-dialog axe scans run at 390 and 1440 in both themes/all languages. The manager also had a separate exploratory phone scan without violations. These are scoped checks, not a complete WCAG assertion. No force clicks or arbitrary waits.

## Remaining scope

Other account lifecycle/source-correction controls, larger-list search/Quick Add consolidation and duplicate-person deduplication rules need separate measured follow-up. The historical correction exception is limited to the original person/type, not new transactions. Cheque edit/cancel and unknown-account clearance were independently reproduced and belong to the next slice. Counter hidden selection is being investigated separately. Real keyboards, downloaded fonts, manual screen readers and backend posting remain unverified.

Local and hosted run results must be reported from completed execution; the test's expected matrix size alone is not evidence of passing.
