# Vendor page — Parties-style split workspace (2026-10-18)

## UX decision
Replace the former two-step Vendor page (standalone directory, followed by a full-width vendor profile) with the **same master–detail layout as Parties**. The Vendor module is the place to complete Vendor business; linking back to a separate Party profile is not a required step.

## Layout parity
- Reuse the Parties page's desktop grid breakpoints: `lg: 340px + remaining width`, `xl: 380px + remaining width`, with the existing 16px gap and the same card, typography and color tokens.
- Desktop left panel contains search, compact filter chips (All, Needs price, To pay, To receive), balance-aware vendor rows and selected-row highlighting. Selection preserves Vendor deep links and unsaved-work guards.
- **Phone/tablet below `lg`**: show compact selected Vendor and `Change Vendor` above the ledger. Open the same directory/search/filter/balances in a focus-managed dialog; do **not** stack the tall directory over the ledger. Keep approved desktop action names, underline tabs and source context. Switching away from unsaved goods uses a shared bilingual confirmation and preserves work when canceled.
- Right panel always contains the selected Vendor. Header: avatar, bilingual name/contact and two separate balances. Toolbar: Take/Give products, Set price, Pay/Return, Receive settlement, New purchase, Print statement, Edit Vendor. Tabs: Ledger, Taken, Given, Purchases, Payments.
- Vendor directory balance details, price-pending status, and separated receivables/payables are Vendor-specific: they are **not** modeled as a single scalar Party balance.
- Add/Edit Vendor reuse the **existing `PartyEditorDialog` and `dispatchPartyPreview`** with Vendor role enforced; existing party identities can gain the Vendor role without creating duplicates.
- **Inner workspaces never create another split-screen layout.** Taken, Given and Payments use a compact single-column panel: selected memo summary and form stay together; `Browse memos` opens a searchable, keyboard-accessible **modal** (shared `VendorMemoPickerDialog`) without shifting or hiding the underlying settlement form.
- Vendor settlement keeps split money accounts, optional goods return, due preview and correction actions in one vertical flow, with no nested two-column payment/return cards. Pricing and due calculations remain unchanged.

## Behavior preserved
| User action | Existing source reused |
| --- | --- |
| Set agreed goods price | `VendorSourceWorkspace` / `VendorPriceForm` |
| Take or give goods | `VendorGoodsEditor`, using existing product picking/cart logic |
| Pay, return, receive or split settlement | `VendorClearDuePanel`, `VendorActionDialog`, `VendorPaymentsWorkspace` |
| Purchase from selected Vendor | `PurchaseEditor` embedded with supplier locked |
| Read/print/export Vendor statement | `VendorStatementDialog` |
| Correct posted source and inspect audit | `VendorCorrectionDialog` |
| Add/Edit Vendor party identity | shared `PartyEditorDialog` and party preview store |

No new posting rules, pricing engine, financial offsetting or page-local product cart were introduced. This remains a UI-preview workflow and does not imply backend accounting integration.

## Acceptance & verification
- `npm run build` and `npm run check:ui-contract`
- `npm run test:vendor-party-layout`: directory/detail geometry at 1440, 1024, 768, 390 and 320px; in-place add/edit modal; selected vendor, tabs, sourcing and payments.
- `node scripts/vendor-kiss-browser.cjs`: at 390/768/1024/1440px and light/dark, Taken/Given/Payments are always a single panel; modal memo picker supports Search, Enter, Escape, and row selection; price dropdown and numeric input heights/vertical positions match; no whole-page overflow.
- `npm run test:vendor-module`, `node scripts/vendor-kiss-browser.cjs`, `npm run test:vendor-context`, `npm run test:vendor-workflow`, `npm run test:vendor-correction`, `npm run test:vendor-receipt`
- Test dropdown/popover visibility, vendor selector, modal focus and keyboard selection, compact memo chooser, light/dark contrast and overflow before merging.
- Review gate: do **not** merge without explicit approval.

## Scope boundaries
Only Vendor directory, Vendor details and narrow-screen nested Vendor subworkspaces change. Parties, POS, purchase posting, stock and Vendor settlement reducers remain the reference behavior.
