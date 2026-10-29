# HisabIQ — Bangla Phase 3: reports and print documents

## Scope
- Reports dashboard charts, summaries, receivable/payable aging, navigation labels and demo-data disclosures
- Daybook tables, filters, status display, print headings and reversal explanation
- POS/Sales receipt preview and standalone receipt print HTML
- Sales return preview documents, Purchase bill print, Expense print reports, shared Bill detail print
- Expense category/payee/payment report headings

## Financial and output contract
- **Values, IDs and calculations remain unchanged**: customer receivable (পাওনা) is separate from supplier payable (দেনা).
- Print-only text selects Bangla from the already-existing Settings preference; there is no second language setting.
- Standalone receipt printing uses an explicit `language` prop because React context is not available in the isolated static-markup renderer.
- **CSV export headers stay English**, preserving documented columns, existing integrations, and import expectations.
- All external text is HTML-escaped in printed documents. Bengali font fallbacks use locally installed fonts; the app does not send or bundle font files.
- Never remove **UI preview** warnings or imply that data is live accounting. September chart values are sample figures.
- No cart, payment, stock, ledger mutation, permissions or tenant data changes.

## Remaining work
This is **not ERP-wide complete localization**. Unchanged areas include advanced report drilldowns, complete audit-ledger printable statements, all finance/Party-specific print designs, automated SMS templates, all screen-reader helper copy and arbitrary provider-generated messages.
