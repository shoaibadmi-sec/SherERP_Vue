# Visible control names — 16 October 2026

Independent audit slice based on Phase 29 main `768186c`; follows the interaction evidence in #121 and Cash Sessions fix in #122.

## Measured defects and correction

- **DPI-05 / P1 — navigation groups:** desktop English + Bangla group buttons show English and Bangla, while Expand/Collapse labels omit the visible Bangla helper. Append the helper in that mode and separate the visible text nodes with a space. Keep the original expansion state, destinations, permissions and keyboard activation.
- **DPI-06 / P1 — user menu:** at desktop width, initials, name and role concatenate in the DOM (`ARAnisur RahmanOwner`), although the accessible name has spaces. Add explicit text spaces between the existing spans; preserve the Phase 29 descriptive accessible name, initials, role and menu behavior.
- **DPI-07 / P1 — Purchase quick-item tiles:** visible product/price/unit text is larger than the name exposed as Quick add. Include the existing formatted price/unit in that name and separate the text nodes. Prices, units, click callbacks and cart arithmetic do not change. Two existing tests now find the specific LED product by a bounded accessible-name prefix; their increment/cart assertions remain unchanged.

The existing shared components are retained: ErpNavMenu, TopBar/FloatingPanel and PurchaseCart. No separate menu, cart or accessibility framework is introduced. No styles, fonts, language preferences, transaction records or backend claims change.

The focused baseline regression fails in both themes for the measured `label-content-name-mismatch` rule. Earlier diagnostic runs assumed the Dashboard heading was named Dashboard; the actual heading is Good morning, Anis. The corrected test waits for the actual page heading before measuring axe. Those initial locator failures are not classified as product defects.

## Browser gate

`PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium node scripts/deep-visible-labels-browser.cjs` runs English / English + Bangla / Bangla × 390/1440 × light/dark: **12 interaction journeys and 30 targeted axe scans expected**. Actual results are saved in `results.json`, not inferred from the expected matrix. Each case checks the live visible-name rule, desktop group Enter toggling or mobile drawer open/close, User menu Escape/focus return, Purchase tile naming, and a real touch/mouse add to the cart. Exceptions and measured violations fail the gate; failures save screenshots/traces. Passing this targeted rule is not WCAG 2.2 AA certification for every state.

## Wider audit evidence and remaining gates

The first inventory enumerated 32 ERP routes across all eight requested sizes/themes and representative tabs/subtabs, with controls retained per view. The combined diagnostic run completed **511 default route views, 136 additional tab views, and 39 axe cases**; a desktop Dashboard navigation timed out in the managed environment. The duplicate interrupted desktop run is excluded. These are discovery/measurement counts, not completed workflows. Independent CI Responsive UX Check passed the original 408-route sweep and Phase 28 multilingual matrix.

The inventory measured three recurring visible-name root causes above, plus a phone Party-profile `target-size` finding on Edit party (partially obscured target). That Party geometry and the local-only invoice-background contrast result remain open; the latter was not reproduced by CI's green theme suite. Real software keyboards, all hidden/nested dialog states, inline mixed-language spans and complete per-action coverage remain open.

The refreshed Phase 29 census measured **52 route-width views, 337 Latin-script candidates, 120 distinct candidate strings and 0 uncaught errors**. This is neither 337 confirmed untranslated controls nor a complete localization audit. Triage separates:

| Class | Measured examples | Disposition |
| --- | --- | --- |
| Source names and brands | AR / Anisur Rahman, Rahman Hardware, Hossain Electric, Nur Enterprise, bank/MFS account names | Preserve source/user data. The avatar name alone accounts for 52 candidate occurrences. |
| IDs, units, protocol terms | SKU, COD, SMS, Gira, phone templates | Review context; preserve persisted identifiers and product units. Do not bulk translate. |
| Real interface copy, P1 | Business settings, Simple, Advanced, Search settings…, Show advanced options, Restore defaults, Discard, Save changes, Add finance entry, View all, Counter / Receive pay, Transfer / Between accounts, Reconcile / Bank statement, Daybook / All transactions, My subscription, Submit proof, My support tickets, New ticket | Confirmed interface wording candidates requiring dedicated translation fixes. Several settings section labels show bilingual helpers even in full Bangla. |
| Low-frequency wording, P2 | Settings backup, Download/Restore settings backup, Settings activity | Translate through the existing copy system after common workflow controls. |
| Template/source configuration | SMS sample with `{business}`, `{item}`, `{number}` | Preserve machine placeholders and distinguish editable message content from UI labels. |

Local Google Fonts access is unavailable; fallback font geometry is recorded as a limitation. The intended Geist/Hind Siliguri imports remain unchanged. Frontend release acceptance and backend integration readiness remain separate and unestablished.
