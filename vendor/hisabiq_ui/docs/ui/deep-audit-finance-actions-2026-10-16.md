# Finance action names — 16 October 2026

## DPI-17 — P1

Axe found `button-name` violations in Loans & Owners (five transaction actions) and Money Accounts (five account actions and three transfer actions). Twelve whole-document snapshots at 390/1440 in both themes reproduced these findings. New-transaction snapshots also included the background tab controls; those are not additional dialog defects. The dedicated regression baseline failed all six mobile action-family cases because the triggers had no accessible name.

Add a localized accessible name and the source ID/account name to the three existing button families. Existing handlers, dialog titles, table/card layouts, money and data remain unchanged. Use the existing text helper: English and bilingual `Actions for …`; Bangla `কাজ …`. Source account names are data, not untranslated interface copy.

## Test inventory

`scripts/deep-finance-actions-browser.cjs` defines 144 journeys: three action families × eight exact viewports × two themes × three languages.

Each family checks names for all visible seed actions, opens a representative source action by touch (through 1024px) or mouse, asserts the correct record in its dialog, checks viewport bounds and background scroll lock, closes with Escape, verifies focus return, reopens with Enter, closes and verifies focus again. Loans & Owners and Money Accounts get 24 axe audits scoped to Finance main content across 390/1440, both themes and all languages. Failures retain screenshots and traces.

The transaction, account and transfer representatives are FIN-000188, Main Cash Counter and TRF-000041. This does not claim that every edit/reverse/print action within those dialogs is audited. The separate validation slice tests malformed and valid monetary edits/manual entries.

## Release limits

Full ERP nested-workflow coverage, real software keyboards, downloaded fonts and backend integration are not certified by this slice. No PR is merged without user approval.

The first expanded run scanned the whole document and caught existing desktop bilingual sidebar `label-content-name-mismatch` findings. Those belong to PR #123; the corrected regression scopes axe to Finance main content. They remain recorded and are checked again in the combined branch with that sidebar repair applied. This is not a whole-page zero-violation claim.
