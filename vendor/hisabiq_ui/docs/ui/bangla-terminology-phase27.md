# Phase 27 — Shared date picker and date-range language

## Why
The shared `AppDateRangePicker` and single-date `AppDatePicker` appear across ERP modules. Their popup presets, month/day labels, navigation, Clear/Cancel/Apply and accessible names remained English in full Bangla mode after Phase 26.

## Implementation
- Reuse the **existing calendar/popover** component. Display strings now depend on existing personal.language (English, English + Bangla, Bangla); no new preference and no alternate picker.
- `src/i18n/datePickerCopy.ts` maps the six preset names, weekday names, Gregorian month/day text and displayed date ranges. Full Bangla gets natural wording and localized numerals; English and bilingual keep their prior English primary text.
- `datePreset` receives the **original English key**; the actual range uses the existing `IsoRange` {from,to} and ISO YYYY-MM-DD strings, independent of UI language.
- Same `onChange` contract, calendar grid date attributes, Tab/arrow navigation, mouse/touch selection, keyboard Escape and focus return; no date business-logic changes.
- The popover remains collision-aware on narrow viewports, anchored correctly with single-date and range selection; no mobile-only clone.

## Acceptance and safety
| Area | Guarantee |
| --- | --- |
| Date math | Original `businessToday()`, `datePreset()`, `addDays()`, `isoDay()` and time zone unchanged |
| Stored dates | Same string values, date filters, ledger windows, transaction dates |
| Display | Full Bangla for month, weekday, presets, labels, accessible names; English preserved |
| Commit | Only Apply or Clear emits `onChange`; Cancel and Escape close without posting |
| Business | No changes to amounts, sales, vendor due, party opening, imports, printing or backend |

## Tests
- Contract: `tests/banglaPhase27SharedDatePickerContract.test.ts` protects ISO keys, display-only mapping, accessible controls and callbacks.
- Browser: `npm run test:bangla-shared-date-picker` checks language picker, Today preset, Last month cancelled change, Escape and single-date dialog across 390/768/1440px and three language modes.
- Existing date ledger, print, purchasing, reporting, POS/finance tests remain CI requirements.

Phase 28 will focus on responsive/a11y language-mode QA and any defects measured in those checks. Phase 29 remains a release-census audit, not backend readiness certification.
