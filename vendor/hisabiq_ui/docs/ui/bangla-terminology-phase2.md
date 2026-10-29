# HisabIQ Bangla UI — Phase 2

**Scope:** Transaction-facing interface copy in Sales invoice/payment/credit dialogs and list; Purchases list, payment panel, source payment/return dialogs; Expenses editor, category and cancellation dialogs; Counter validation, settlement and review; shared bill detail and transaction review.

**Translation rule:** Always read the existing Settings language through `useUiCopy()`. In *English* and *English + Bangla*, keep English primary copy; Bangla-only mode uses short everyday Bangla. Preserve the existing secondary helper only in mixed mode.

**Financial semantics and contract:**
- *Customer due* = ক্রেতার কাছে পাওনা / বাকি; *supplier due* = সরবরাহকারীকে দেনা. Do not make a positive due appear as a credit.
- *Credit* means money already overpaid or on account. Label it অগ্রিম জমা, not ordinary cash received.
- Keep purchase return refund distinct from a supplier credit left on account.
- Keep persisted payment method values (Cash, Bank, Mobile Banking), status values, option identifiers, invoice references, audit descriptions and source amounts unchanged. Only select option labels and UI copy change.
- A preview transaction **does not** post actual money, inventory or backend ledger entries. Never omit that warning.
- Keep POS cart keyboard handling and shared purchase cart interaction unchanged.

**Verification:** Node copy-contract tests and a Playwright three-language workflow smoke test; existing strict TS, lint, UI contract, browser transaction regression suites and responsive checks must remain green.

**Not included:** Complete localization of every report, date, invoice print template, product settings screen, all generated error messages, or external/provider metadata. Those require additional reviewed slices. The Phase 2 PR must not be called an ERP-wide full localization.
