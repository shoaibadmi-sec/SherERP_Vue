# ERP table typography contract

The user selected the existing Products table as the standard on 24 October 2026. This supersedes the earlier proposal to use 14px report data and 12px badges.

| Role | Required size | Weight |
| --- | --- | --- |
| Main data: names, references, quantities, prices, balances | 13px | Existing regular/medium/semibold emphasis |
| Column headings | 12px | Existing medium weight |
| Supporting text: Bangla helpers, SKU, secondary date/phone, explanatory captions | 11px | Existing regular/medium emphasis |
| Status badges | 11px | Existing medium weight |

## Implementation

`src/index.css` owns three `--erp-table-*-size` tokens. The actual shared `Table` opts into this contract with `data-erp-table`. Native UI tables carry the same attribute, including settings, quotations and document previews. `data-erp-table-view` covers responsive Sales and Party ledger rows; existing cart row/header markers cover POS, Purchases, quotations, online sales and bundle product grids.

Within these surfaces, typography inherits by role instead of changing with old page-local utility sizes. Supporting fields explicitly use `data-table-helper`; custom badge buttons use `data-table-badge`; existing Badge and Bangla-helper attributes are recognized directly. Text inside these roles inherits its parent's size. Color, font weight, alignment, handlers and control geometry remain owned by the existing components. Responsive cart field labels use the 12px heading role.

Keep Geist/Hind Siliguri and proportional UI digits. Preserve the universal 36px normal controls, existing padding/density settings, report breathing room and numeric alignment. This contract is for UI tables and their responsive equivalents; it does not change page titles, dashboard totals, ordinary forms, calendars or generated standalone print-document styles.

New native UI tables must opt in. New supporting fields inside a table must identify their helper role. Do not add a new font scale for one module or change these tokens without the user's decision.

## Verification

`npm run test:table-typography` verifies all authored native table entry points, then checks computed sizes over 25 business route views in three profiles: bilingual light desktop, English dark tablet, and Bangla dark phone. It also opens report record details to check portal-hosted tables. It asserts data/headings/helpers/badges, no page overflow and no runtime errors. Current run: 75 route/profile views and 3,218 text observations passed. Closed-dialog variants are covered by shared component/source opt-in, not claimed as individually opened.

This check runs inside the existing PR workflow for shared UI changes. Helpers cannot wrap entry controls; ledger money/running balances and control values are independently checked at 13px rather than inferred from helper markers.

Additional checks passed: TypeScript, production build, UI contract, ESLint with zero errors (220 existing warnings), four report-guidance/accessibility profiles, phone/tablet editable-cart checks in both themes, and 586 shared controls across 22 routes at three widths. Full unit suite: 711 tests, 709 pass and the same two pre-existing quotation failures from PR #200. The detector reports three existing font-preference warnings; Geist is the approved product font and is intentionally retained. Fresh review findings about nested helper labels and ledger amounts were fixed and the reviewer returned Ship.
