> Historical delivered design. For subsequent Reports work, conflicting visual/navigation/demo guidance is superseded by the [canonical26 October specification](2026-10-26-hisabiq-reports-final-uiux-design.md). Existing behavior and source evidence remain valid references.

# Reports workspace design

The user requested implementation of the reporting roadmap with Superpowers and Impeccable, and selected Business overview as the default landing view. This request authorizes a working UI extension in hisabiq_ui, preserving the incumbent visual system.

## Approach
Extend the existing Reports route with grouped report navigation and one shared filter/table/detail/output engine. A static chart-only screen cannot satisfy the request. A separate BI builder would add unnecessary configuration. Use current preview stores, label the source clearly and leave backend integration explicit.

## Scope
Overview; sales/returns/product/category/customer performance, cost-aware margins and discounts; purchases/supplier totals and unit-cost evidence; stock/low stock/ageing/expiry/movements/reorder planning; receivables/payables with invoice age rather than invented overdue dates; cash books/expenses/finance controls; warranty and data quality. Provide catalog entries with explicit missing-source explanations for financial statements and future analyses requiring absent contracts.

Date and comparison filters, text/entity/status filters, sorting, pagination, visible-column controls, filtered CSV and print, persistent saved views and favorites, query-string state, drill-down dialogs and safe links to current source modules must work. Purchase planning has editable lead/review/safety/budget inputs and a downloadable purchase list; it never claims to post an order.

## Data rules
Posted actual previews exclude drafts/deleted/reversed records. Keep invoice revenue separate from receipts. Historical sale costs come only from sale-time evidence, never the product master. Unknown profit stays unknown. Allocate invoice discount/rounding in integer paisa. Aggregate quantities only by compatible units. Snapshot stock is explicitly current; date filters apply to movement/demand windows, not fabricated historic balances. Future due dates/allocations do not exist in all fixtures, so label current outstanding balances and invoice age. Selected account filters use actual split amounts, not whole-invoice receipts. Internal transfers remain separate from business cash movement.

## Interaction and appearance
Operate mode. Inherit existing PageHeader, Panel, Button, Input, NumericInput, SearchSelect, AppSelect, AppDateRangePicker, Table, Dialog, StatusBadge and motion tabs. Default overview + six report groups; fewer permanent navigation entries than catalog reports. Filters collapse; active selections remain visible. All normal controls 36px, no monospaced digits. Responsive tables scroll within their container. Bangla/English/bilingual and light/dark remain functional.

## Boundaries
No backend work, subscription enforcement system, automated messages, live AI recommendations or edits to posted financial records. Report printing/export operates on the exact displayed selection. Missing source data is explained, not simulated as a successful action. Saved views store filters/preferences, not financial records, scoped to the current demo business/user.

## Verification
Unit tests for real projection/filter/aggregation behavior; browser tests for navigation, filters, comparison, saved views, detail, CSV/print, purchasing inputs, responsive layout and languages/themes; project build and UI-contract checks. Two pre-existing quotation tests fail at baseline due to dated fixtures; report separately. Fresh finish/code review before opening PR; no merge.

