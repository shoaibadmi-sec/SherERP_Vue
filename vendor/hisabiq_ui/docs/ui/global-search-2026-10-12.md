# Working global search

Update, 18 October: see [shared numeric entry and fuzzy ERP search](number-fields-fuzzy-search-2026-10-18.md) for current zero-on-focus, wheel and matching behavior. The implementation history below is retained.

The header search was an uncontrolled text field with a decorative Ctrl K hint. It now accepts a query and opens a real results page on Enter or the visible Search button. Ctrl/Cmd K focuses and selects the existing header input; it does not move focus outside an open modal draft.

The on-demand results page uses available module navigation, current preview Products/Parties/Purchase bills and the existing sample Sales invoice dataset. Match English or Bangla names, phone, SKU, bill number and multiple words; Bangla digits normalize for matching without changing source references. Empty queries show modules; missing results have a bilingual helper. At most 50 results display with a narrowing helper. Every result is a normal keyboard/touch accessible link.

Module results use the same permission/feature filtering as the sidebar. Product results open the Product list filtered by its original SKU; invoice/bill results open their existing list filtered by the exact source reference; Party results open the selected Party and a valid relationship. Existing menus, editors, calculations and print operations remain in those modules. Query-only route changes update the local list search without replacing transaction stores. No new product picker or transaction editor was introduced.

Reuses PageHeader, AppShell, existing list controls and existing navigation/preview sources. The header retains its approved compact search styling and now has a functional submit button. The new page is lazy-loaded; its production chunk is 3.98 kB and the main chunk remains 626.46 kB (187.55 kB gzip).

## Validation

- 345 helper tests pass including Bangla digits/name, multiword, exact source link and blank-query behavior.
- Strict TypeScript, build and design-contract checks pass; lint has zero errors and 167 existing warnings.
- Global search: 320/390/768/1024/1440 in light/dark, keyboard shortcut and Enter, touch submit, Bangla product/identifier, exact invoice/bill filter, Party and module link, no-result state, modal draft focus protection.
- Existing header geometry, calculator, notification/user panels and navigation: 320/360/390/640/768/1024/1440 in light/dark.
- Built route/loading/recovery check extended to include Search and verify it is absent from cold Dashboard downloads.

## Integration boundary and remaining audit

Search is preview-only: Sales invoices still use their existing sample dataset, while Products, Parties and Purchases use their shared preview sources. It does not promise live, cross-tenant or backend search. Backend integration needs authorized tenant-scoped queries and canonical source results.

Language coverage, Sales template editing, report periods and final composite integration of parallel unmerged PRs remain. This slice is stacked on the on-demand loading PR (#83), which is stacked on the numeric controls PR (#82). No merge or backend changes are included.
