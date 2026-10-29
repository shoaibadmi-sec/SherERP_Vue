# HisabIQ Bangla Phase 11 — Warranty case and receipt display

## Objective
Make warranty intake, case lists, actions, supplier handoffs, status filters, temporary replacement warnings, case history and printable warranty receipts usable in everyday Bangla without changing the existing workflows or source records.

## Implementation
- Uses the existing `useUiCopy` language setting (`English`, `English + Bangla`, `Bangla`) and `warrantyLabel` display mapping.
- Keeps English as the primary label in English + Bangla mode; the existing Bangla subtitle remains a helper only in bilingual mode. No new language preference.
- The existing `FormSelect` wraps shared `AppSelect`; `warrantyOptions` changes displayed labels but retains `value` IDs (status, route and resolution).
- The same `WarrantyCase` arrays, intake/advance/send/receive/return transitions, customer links and timeline events are used. Event titles are translated for display only.
- `warrantyDocument(item,language)` passes the current language to `printReport` for translated receipt headings and status labels, while preserving case ID, dates, serials, party, product, note and reference values.
- The CSV export remains identical, including English machine-readable headers and source values. It is not silently localized.
- Printable receipts are UI previews; they must not imply backend claim submission, stock mutation or financial posting.

## Checks before merge
1. `npm test`, `npm run build`, `npx tsc --noEmit`, `npm run lint`, and `npm run check:ui-contract`.
2. `npm run test:bangla-warranty`: 3 language modes × 390px/1440px, source-value preserving status filters, case detail, intake, keyboard escape and horizontal overflow.
3. Existing warranty/customer links, Sales invoice opening, supplier routing, `Print receipt`, temporary replacement return-before-close validation and CSV columns.
4. Light/dark, phone/tablet, keyboard and touch checks. Merge only after CI passes and user approval.

## Deferred
- Persistence, service ticket notifications, expiry rules, warranty eligibility enforcement, backend-ledger/stock integration and alternate receipt templates.
- Separate workflow redesign or custom cart is out of scope.
