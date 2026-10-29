# Finance cheque output audit — 17 October 2026

## Finding and behavior

The New Cheque form accepted an image or PDF but retained only the filename in the local preview record. The detail view presented that name as an attachment without saying that the file bytes were not uploaded or stored, and the cheque print report omitted the name. This UI does not have attachment persistence.

The form now labels the field as an attachment filename and says in English and Bangla that the preview does not upload or store the file. The detail view and print report label the value as a filename that was not uploaded. The print report includes the filename metadata; it does not imply that the file itself is available.

## Local browser evidence

`scripts/deep-cheque-output-browser.cjs` exercises cheque creation, valid PDF selection, save, detail reopen, print preview, parent-dialog preservation and a scoped axe scan. It verifies no file download link is exposed for a filename-only value and that the report preserves the bank, amount, filename and disclosure.

- 48/48 browser profiles passed: 8 viewport sizes × 2 themes × English, English + Bangla, and Bangla.
- Axe reported zero tagged WCAG A/AA violations in the cheque detail dialog in each profile.
- Touch taps are used through 1024px; desktop uses pointer clicks.
- The browser test uses condition-based Playwright assertions without force-clicks or arbitrary sleeps.

## Limits

The selected bytes are not uploaded, retained, downloadable or attached to a backend record. A real printer, software keyboard, downloaded-font rendering, manual screen-reader operation and backend integration were not tested by this preview audit.
