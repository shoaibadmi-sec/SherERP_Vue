# Vendor KISS workflow slice — 11 October 2026

Base: PR #66 (`feat/vendor-ux-polish`), which is unmerged. Review/merge #66 before this slice; this PR deliberately targets that branch. Main audited at `0cc3a9a`.

## Changes
- Directory: named To pay / To receive / Needs price filters; independent dues; price-first source entry; phone and tablet rows retain visible amounts.
- Selected Vendor: compact independent balances and five visible task tabs; buttons wrap instead of overflowing.
- Taken/Given: the currently selected memo opens its existing price/settlement form immediately. Below 1024px, a labeled button swaps between memo list and work area. Desktop keeps the existing two-panel workspace.
- Payments: same mobile list/workspace pattern, using the existing single-entry split-payment form.
- Source deep-link changes update the selected memo even when the tab stays mounted.

## Action coverage
| Entry | Outcome | Shared implementation |
| --- | --- | --- |
| Needs price → Vendor | Opens unpriced source in Taken | sourceOutstanding, VendorPriceForm |
| To pay / To receive → Vendor | Opens appropriate source side | existing source workspace |
| Choose another memo → row | Returns to selected source form | existing settlement reducers |
| Confirm price | Records preview price, updates due | existing Vendor price command |
| Pay / return | Existing stock/due checks and combined settlement | VendorClearDuePanel |
| Receive | Amount entered once per account | VendorActionDialog |
| Purchases tab | Existing full purchase editor remains open | PurchaseEditor, shared cart/quick add |
| All Vendors | Retains directory filter/search in mounted route | existing change guard |

No new cart, picker, finance engine, backend posting or visual system. Ordinary purchase invoice settlement and full language-mode coverage remain separate audit items.

## Verification
Added `scripts/vendor-kiss-browser.cjs`: price-first entry, phone memo selection, payment workspace and document overflow at 390/768/1024/1440px in light/dark. Run with `node scripts/vendor-kiss-browser.cjs` (optional PLAYWRIGHT_EXECUTABLE_PATH).
Existing Vendor module, receipt, purchase context and combined due tests are also run. Repository-wide TypeScript/lint failures predate this slice and are recorded in the full audit; build and unit tests are separate checks.
