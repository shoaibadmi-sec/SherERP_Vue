# Purchase list and safe return source review

The old return form selected the first ambiguous supplier match, showed the first comma-separated summary item as a return line, and calculated a refund as 10% of the purchase total. Changing its quantity did not change the refund, and Complete return only displayed success. No returnable line, unit snapshot, allocation, payment or history was saved.

This removes the fabricated financial operation. Source review shows the actual selected reference, supplier, summary, total, paid and due. If a created purchase includes inventory lines, their recorded base quantities and costs are visible; unknown cost remains unknown. The screen clearly explains that verified remaining quantities, previous return allocations and historical units are unavailable. It offers the original bill and another source selection. Empty, missing and ambiguous references have explicit errors. It never reports a return/refund/stock movement as completed.

| Action | Frontend outcome |
| --- | --- |
| Search / supplier / Paid-Partial-Due | Combined filters change rows; reset and empty state |
| View bill | Existing BillDetailDialog, actual source/payment information |
| Print bill | Real isolated print document for exactly the selected bill |
| Review return | Selected source remains in the current module; route tab updates; original bill accessible |
| Return source search | Exact reference wins; empty/missing/ambiguous matches do not silently select a bill |
| Return history export | Real CSV of visibly labelled sample history |
| New purchase | Existing canonical PurchaseEditor and shared cart/payment workflow retained |

Reuses actual FloatingPanel, Button, Input, FormSelect/AppSelect, Table, BillDetailDialog and reportOutput. No new cart, quantity editor or refund calculator. Tablet filters stack for readable controls; source review wraps on phones in both themes.

Still needed for frontend integration readiness: canonical source-linked purchase correction, bill payment and return editor with historical unit/price/lot snapshots, checked remaining quantities and prior allocations, supplier-credit/cash refund choices, reason/impact review and source mutation. Backend must provide/verify those snapshots and post stock, accounts, supplier ledger and audit atomically and idempotently. A summary-only seed bill is intentionally ineligible; receipt/bill payment integration states remain explicit from PR #74. This safety slice does not claim the entire Purchase module is finished.

Validation: eight complete browser journeys at 390/768/1024/1440 in light/dark; combined filter/empty/reset, actual bill and row print contents, ambiguous/blank/missing source rejection, no fabricated quantity/refund/Complete return, selected original bill, sample CSV and page geometry. Build, helper suite, UI contract and changed-source lint; existing full Purchase creation and Expense regression. Stacked on PR #74; review #73, then #74, then this PR. No merge without approval.
