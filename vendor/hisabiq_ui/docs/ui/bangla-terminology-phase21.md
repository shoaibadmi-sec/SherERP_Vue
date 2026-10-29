# Phase 21 — Party Editor, Party Detail and opening-balance language

Baseline: Phase 20 was merged as PR #111 at `5409eaf86b8c0985c79a637ade47f0ca9da124b1`.

## Scope

Finish shared Party profile edit/create, visible Party Detail actions, source-reference read-only dialog, notes create/edit/delete confirmations, and the opening-balance dialog in the existing three ERP language modes.

| Surface | English | English + Bangla | Bangla |
| --- | --- | --- | --- |
| Party name, phone, address, relationship selection | English | English primary with the established helper | Bangla labels |
| Opening balances per relationship | English direction labels | Existing English · Bangla direction hints | Bangla direction labels |
| Party actions, note validation/confirmations | English | English primary | Everyday Bangla |
| Source details, opening-balance safety notes | English | English primary | Bangla, clearly **preview-only** |

## Financial and UX invariants

- `PartyRole` relationship enum values, `'debit'|'credit'` balance directions, source IDs and reference numbers **never** change. `partyCopy.ts` transforms only visible labels.
- Customer, Supplier, Vendor, Owner, Lender, Borrower and Payee balances remain independent. Existing default side, existing source detection and editing/correction math remain untouched.
- Opening balance edits remain ledger-only browser preview. They are not cash, bank, refundable credit, verified payment or backend posting. Old source data is audited as before.
- Reuse `PartyEditorDialog`, `PartyDetail`, `PartyOpeningDialog`, `AppSelect`, `AppDatePicker`, `Input` and `Button`. No competing cart, selector or design system.
- Preserve keyboard flow, mobile layouts and Magic Patterns tokens; the changes are copy-only.

## Regression gates

- `node --experimental-strip-types --test tests/banglaPhase21PartyEditorDetailContract.test.ts`
- `npm run test:bangla-party-editor-detail`: 3 languages × 390 / 768 / 1440 widths; editor roles, both relationship opening entries, opening-balance safety guidance, note add/edit/delete, no uncaught browser errors.
- Keep Phase 20 multilingual smoke green: its Party Editor dialog/button selectors now respect Bangla.
- Existing `test:parties`, `test:party-opening`, `test:party-settlement`, `test:theme`, `npm test`, strict TypeScript, build and complete UI workflow CI remain required.

## Remaining follow-ups, not declared complete

The directory result labels/filter roles, RoleBadge, PartyPaymentDialog, PartyCreditRefundDialog, PartyFinanceDialog, PartyStatementDialog and PartyTransactionDialog have a separate language census and should be handled in later small phases. Avoid changing their financial handlers during localization. Do not declare the ERP-wide language audit complete from Phase 21.
