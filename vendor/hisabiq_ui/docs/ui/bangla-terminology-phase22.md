# Phase 22 — Party financial dialogs and statement semantics

## Why
Phase 21 localized Party Editor and Party Detail. Existing payment, refund, finance and source-correction dialogs still contained English-only validation errors. Party Statement print used English-only ledger impact badges in Bangla mode. These are financially sensitive messages.

## Implementation
- Shared `src/i18n/partyFinancialCopy.ts` maps **known validation messages and ledger impact labels** to plain Bangla. Unknown source errors are shown unchanged rather than hiding cause; English/bilingual use original text.
- Payment review now shows a localized action rather than displaying an English enum/action inside Bangla confirmation.
- Credit refund errors for mandatory reason and split mismatch use language copy; exception errors use the shared known-message translator.
- Finance transaction review displays `financeLabel(language,type)` but preserves `financeType` key. Corrected a misleading preview message that implied an existing source was edited during initial finance record creation.
- Party source correction/reversal validation now uses the same error vocabulary, without changing editable fields or callbacks.
- Party statement table translates `ledgerImpact(row).label` while the CSV serializer, source references, numeric values, and date filtering remain identical.

## Acceptance and safety
| Check | Required |
| --- | --- |
| Modes | English, English + Bangla, Bangla |
| Widths | 390px mobile, 768px tablet, 1440px desktop |
| Posting semantics | Preview only: no real bank, ledger or backend posting |
| Relationship isolation | Customer/Supplier and Owner/Lender/Borrower remain distinct |
| Source data | Same party IDs, `relationship`, `financeType`, `date`, splits, `sourceId`, numeric values |
| Print/CSV | Human-visible impact wording localized; CSV machine layout unchanged |
| Design | Existing `Dialog`, `AppDatePicker`, `AppSelect`, `FinancePaymentSplitEditor`; no duplicated controls |

## Tests
- `node --experimental-strip-types --test tests/banglaPhase22PartyFinanceContract.test.ts` validates source invariants and localization boundaries.
- `npm run test:bangla-party-financial` checks payment reviews, opening-impact labels in Party print, owner-finance error and preview messaging across three languages × three widths.
- All existing Phase 1–21 workflows, `npm test`, `npm run build`, `npm run check:ui-contract`, TypeScript, lint and responsive/theme suites remain required.

## Deliberate exclusions
This slice does not change validation math, acceptance conditions, bank accounting, discount allocation, credit availability, refunds, imports, or audit reversals. Any untranslated developer-only error with dynamic values remains unmodified for a later validated error-code localization pass. It does not certify ERP-wide localization complete.
