# HisabIQ Bangla Phase 10 — Quotation workspace and printable quotation

## Goal
Use straightforward Bangla labels in Quotation list, draft editor, customer-facing preview and its existing print mode. English + Bangla retains English primary copy. Follow the approved HisabIQ KISS terminology and existing layout/components.

## Scope
- Localize action buttons, filters, status badges, date labels, customer fields, quote totals, item table, print disclaimers and delete confirmation.
- Keep quotations **quotes**, not invoices, financial entries, revenue or stock reservations.
- Use `useUiCopy` and the `quotationLabel(language, english)` helper for presentation. Never persist translated status or recipient strings.
- Only one existing quotation store: `quotePreviewStore`. All calculations (`quoteLineTotal`, `quoteSubtotal`, `quoteTotal`) and lifecycle transitions remain as before.
- Continue using the same dialog, table, POS-style `TransactionCartEditor`, date picker and `window.print()`. Keep user-provided note, customer, product, quantity, currency and quote identifiers untouched.
- Printed quote is a **UI preview** and cannot be confused with an invoice or payment request.

## Regression acceptance
- Node contract test asserts status IDs, quote totals and unchanged store snapshot, presence of original store functions, and print-only safe copy.
- Browser test in English, English + Bangla and Bangla at phone 390px and desktop 1440px: quote list, status filters, printable detail labels, existing subtotal/total, editor, cancellation and overflow.
- Existing Quote → Online order → POS flow, finance, customer, sales, purchases and theme regression suites must remain passing.

## Deferred
- Backend quotation posting/sending, SMS integration, numbering rules, customer consent, actual print language user preference beyond current workspace language.
- Remaining secondary modules and specialist print surfaces will follow only after regression review.
