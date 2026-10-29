# Phase 20 — Party directory and financial-preview action language

## Scope
Audit finding: `src/pages/Parties.tsx` still displayed English-only labels and messages for financial source actions, opening balances, payments, credit refunds, correction, reversal and imports. These are safety-critical because users must distinguish UI-preview actions from actual bank/ledger posting.

This slice uses the existing `useUiCopy().text` for:
- Directory header explanation, Import Excel / CSV, Add party and empty state.
- Payment and refund preview feedback, with an explicit statement that **nothing posts to bank**.
- Capital/loan preview, opening-balance audit preservation, payment corrections, and reversible source transaction feedback.
- Party creation/edit preview messages, not-yet-connected source actions, note errors and legacy import notification.

## Domain invariants
- Preserve all original Party/PartyRole, relationship, ledger source and `All types` filter keys.
- Preserve separate balances by relationship (customer receivable must not offset supplier payable).
- Leave `dispatchPartyPreview` payloads and actions, state source references, permission decisions, and audit revisions untouched.
- Do not translate user-entered names, Party IDs, source references, reason/audit text, monetary calculations or import records.
- Shared PartyEditorDialog and PartyDetail remain unchanged; no duplicated editor, fake success, or backend posting.

## Acceptance
- `tests/banglaPhase20PartiesContract.test.ts`: source and relationship safety, language modes.
- `npm run test:bangla-parties-feedback`: 3 language modes × 390 and 1440px; directory labels, shared PartyEditor open/cancel, no JavaScript page errors.
- Full UI, Party-source/ledger domain, responsive accessibility and finance regression suites pass.
- Integrate after Phase 19 Expenses, combining package and UI workflow entries additively. Never replace one suite with another.

## Known remaining gaps
The nested PartyEditorDialog and PartyDetail have their own English-only form copy and may need a separate shared component-level language pass. Real transaction editing must be domain source-linked, not simulated by localized toast. An ERP-wide full language census is not yet complete.
