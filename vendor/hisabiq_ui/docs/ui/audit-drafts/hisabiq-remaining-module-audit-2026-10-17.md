# HisabIQ remaining module UI audit — 17 October 2026

## Outcome

The remaining automated frontend audit pass is complete for the currently merged UI source, with one verified workflow gap: **Counter Supplier Pay cannot allocate payments to individual purchase bills** (FIN-22, P1 completeness). No application code was changed. The repository checkout remained clean.

Source comparison: fetched `main` is `8516a0baa0f6af3416f0418455ce995269d718b8`. The local integrated browser-test checkout at `073c230` has the same source tree; its only diff from `origin/main` is one `package.json` command entry. Browser testing used that current source and Chromium installed in the environment.

## Finding — FIN-22: Supplier Pay is aggregate-only

**Priority: P1 workflow-completeness gap.** Counter → Supplier Pay has no bill allocation control. A supplier with multiple open purchase bills can only be paid against the aggregate supplier payable, and confirmation records an aggregate supplier-payment source without `invoiceId`.

Playwright reproduction at 390×844: select Karim Traders, whose local preview has two open purchase sources (`purchase:pu118`, `purchase:pu112`) and ৳82,600 due. The Invoice allocation control count is zero. Full due fills ৳82,600. Confirming records `supplier-payment` for party `s1`, amountPaid `82600`, with no invoice ID. Users therefore cannot choose or review which bill a partial or full payment settles.

The report from the focused reproduction is [hisabiq-counter-supplier-pay-audit-2026-10-17.md](hisabiq-counter-supplier-pay-audit-2026-10-17.md). Recommended implementation: preserve purchase source IDs, show remaining bill dues and exact allocation before confirmation, and validate allocation against the source’s remaining payable. If the intended policy is oldest-first, make the references and amounts visible.

## Local Playwright coverage completed or confirmed

- **Finance/Counter:** transfer identity, date/reference history and reversal passed 48 journeys across eight viewports, light/dark and three language modes. Counter expense, zero-allocation handling, split review/edit/confirm and validation passed 10 journeys at 390px. A separate tap test confirmed that removing an added split removes it from the review and saved source. Dynamic-account payment identity remains covered by the merged 48-journey browser regression.
- **Supplier Pay:** the aggregate payment/source identity regression passed in the existing merged test; the new browser reproduction confirmed the missing bill allocation above.
- **Accounts and source corrections:** Finance source review passed 6 workflows and 6 axe scans at 390px, covering duplicate transfer labels, transfer date/reference, expense provider/account identity, metadata correction and translated report amounts. Inactive historical correction sources remained tied to their saved account IDs. Duplicate-name transfer balance/reversal regression passed.
- **Cheques:** lifecycle smoke passed all 12 declared actions across light/dark at 390px, including cancel/reopen, deposit/clearance bank eligibility, and terminal/reversal behavior. The merged output suite separately checks the attachment filename disclosure and print preview.
- **Purchases:** source correction, payment, bounded return quantity, refund/credit choice, and source history passed at 320, 390, 768, 1024 and 1440px in light/dark (10 profiles).
- **Expenses:** actions, filters, contextual payee/category creation, correction, cancellation, receipt, CSV/print and purchase-bill payment safety passed at the same five widths in light/dark (10 profiles).
- **Parties:** Party → POS context preservation passed 6 journeys (390px × two themes × three languages) with 12 whole-page axe scans. Counter Quick Add passed 6 journeys and 12 dialog axe scans. Party import and settlement/edit/reversal browser flows passed.
- **Products and bundles:** product Quick Add/conversions/Purchase integration and product import passed. Product overlay audit passed 12 journeys with zero failures. Bundle editor, component shortage/serial dialogs, handoff stale-recipe review, whole-Set return and POS revision/Set-integrity workflows passed on phone/tablet profiles.
- **Sales, Quotations, Online Sales and Warranty:** Sales list/column controls/export/return/credit language journeys passed at 390 and 1440px across three language modes. A direct print-popup check verified that the Sales receipt retains invoice `INV-000241` and its totals. Quotation create/compound-unit/discount/status/duplicate/delete flow passed. Online order/COD/CRM preview passed. Warranty passed six language/device profiles, including receipt popup, case ID, intake cancel and status selection.
- **Settings, imports, notifications and SaaS screens:** Settings hub, CSV import wizard, product/party imports, Accounting/Audit/Party localization, Notifications language journeys, and SaaS role editor, scoped routes, tenant creation, persistence, mobile navigation and contrast checks passed.
- **Prior full matrices retained as evidence:** Reconciliation/Daybook passed 96 whole-page axe scans at the eight required viewports, two themes and three languages. Reports passed its 48-scan matrix. Shared table/sidebar and document output slices have separate merged audit reports. Those records are scoped, not an assertion that every screen/action was exhaustively tested in this turn.

## Test-harness notes

The existing account-identity smoke currently fails two assertions because its locator expects the option label to contain literal `acc-`. The current helper deliberately displays a unique last-four ID suffix (`-dbl` in the screenshot) when account numbers do not distinguish same-name accounts. The UI options were visibly distinct, the separate duplicate-transfer/reversal regression passed, and the inactive historical-source check passed; this mismatch is a stale test locator, not a reproduced product defect.

Two older browser scripts initially timed out waiting for the browser `load` event. Scratch-only reruns that blocked external font requests and waited for DOM readiness passed for Product Quick Add and Quotations. The first Sales print probe used a receipt heading that does not exist; the corrected check asserted the invoice reference and totals and passed. No production script or test file was edited.

## Remaining certification limits

This completes the remaining module audit pass against the local preview UI; it does **not** certify the entire product as production-ready. Physical software keyboards, downloaded-font rendering on target devices, manual screen-reader operation, authenticated tenant isolation, and durable backend/bank/SMS integration remain unverified. FIN-22 remains for the implementation pass. No PR was merged or created during this audit.
