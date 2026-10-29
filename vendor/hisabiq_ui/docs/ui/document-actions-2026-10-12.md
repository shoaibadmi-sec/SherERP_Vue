# Real frontend documents and exports

Sales, Warranty, Products and Reports claimed printing/export success without creating an output. Sales return View only showed a toast. Replace those with actual isolated print documents, source detail and downloadable CSV files.

| Action | Result |
| --- | --- |
| Sales row/dialog Print | Uses the actual shared ReceiptPreview, with the selected source's ordered lines, compound quantity, customer/guardian/address, serial/warranty, discount/rounding and Total/Paid/Due |
| Sales Export | CSV of the current combined filters; original source amounts and item descriptions, no fabricated profit calculation |
| Sales return View / Print | Readable source preview with original invoices, items, amount, settlement and optional refund account; no new financial posting |
| Warranty row/dialog Print | Selected case, received date, customer, product/serial, issue, route/supplier/reference, resolution, temporary replacement and history |
| Warranty Export | Current tab, query, status and route filtered cases |
| Products Export | Current product query/category/stock selection, labelled base units for stock, minimum and prices; Bangla name retained |
| Reports Export for accountant | Real CSV of the labelled September demo profit/expenses, monthly gross/net and aging source figures; no invented XLSX or live accounting claim |
| Reports Profit & Loss | Canonical Accounts Statements workspace with working tab query, including reload/back/forward |
| Reports Stock valuation | Existing Product Stock lots workspace |
| Other report periods | Explicitly disabled because changing the label did not change the static source figures |
| Popup blocked | Actionable error; no claim that a printer received an invoice |

Reuses ReceiptPreview, reportOutput (formula-safe CSV, escaped report HTML), existing controls and editors. Receipt rendering is loaded only after printing is requested. The popup is opened synchronously to retain the browser gesture, isolated from the opener, styled from the existing HisabIQ CSS in light mode, and printed after styles/fonts load. Source text is React-escaped and long item names wrap when printed. Receipt items and financial values are not recalculated or sorted. There is no duplicated cart/payment editor or source mutation on print/export.

## Verification

Three pure source-adapter tests cover order, compound units, customer fields, serial/warranty, exact discount/rounding, split method and return source amount. Ten complete browser journeys (320/390/768/1024/1440, light/dark, touch on phone/tablet) verify actual downloaded CSV contents, selected-source popup contents, the print call, print visibility, source text escaping, source return detail, report deep links/reload/back/forward, and blocked-popup feedback. A separate built-app check verifies the lazy print chunk, production CSS/font loading and actual print call in both themes. Inspected receipt in both themes. Existing helpers, build and UI contract checked; dedicated browser workflow added.

## Still needed

These are UI source previews, not fiscal/accounting certification or backend posting. Integrate authenticated source data, tenant business branding, real dates/period filtering and authoritative inventory/COGS/payments. Reports' static figures do not represent live Accounts projections. Service/Warranty stock and customer communications remain separate integration work. Source-linked Purchase correction/payment/return, remaining Sales/template and Product-settings actions, global search, language modes, TypeScript/lint and route loading remain frontend work. No module is declared complete by this output slice.

Stacked after PR #76; review #73 → #74 → #75 → #76 before this branch. Shared dialog accessibility (#69) and design declarations (#71) remain separately pending. Do not merge without approval.
