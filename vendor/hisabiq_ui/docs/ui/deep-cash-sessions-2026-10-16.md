# Cash Sessions history containment — 16 October 2026

Independent follow-up to deep audit PR #121, based on Phase 29 main `768186c`.

**DPI-04 / P1:** Finance → Cash Sessions → history, at 390×844 in both themes, produces a 648px-wide document. A page-only Finance Overview check misses it. The explicit browser regression failed twice on the baseline and saved screenshots/traces.

The Cash Sessions grid uses an implicit mobile track and an unconstrained desktop `1fr`; the history section's intrinsic table width expands that track. The correction uses one explicit mobile column, `minmax(0,1fr)` beside the existing 360px desktop summary, and `min-w-0` on the history section. This retains the existing shared Table's horizontal scrolling and shared CashSessionDetailsDialog. No table, drawer, modal or input system is introduced. Counts, denominations, balances, source IDs, calculations and transactions are unchanged.

`PLAYWRIGHT_EXECUTABLE_PATH=/usr/bin/chromium node scripts/deep-cash-sessions-browser.cjs` measured **16 passed / 0 failed** locally: 320×700, 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×800, 1440×900, each light/dark. It activates the actual Cash Sessions tab, checks document bounds, keyboard-focuses and opens the off-screen history action, checks the dialog's bounds and CS-000240's ৳41,350 expected / ৳41,300 counted values, closes with Escape, checks focus return, switches tabs and reopens history. Test mutations do not post money. Early diagnostic runs used the wrong Accounts tab name; corrected to the visible Money Accounts label before reporting the measured results.

The dedicated CI uploads the measured JSON plus screenshots/traces on failure. Full UI Check and Responsive UX Check remain required. Local Google Font requests are unavailable in this managed environment and are aborted promptly during this interaction test; production font imports are unchanged. Real software-keyboard behavior, all cash counting/confirmation combinations, other modules' overlays and backend cash persistence remain separate acceptance requirements.

The wider audit still has P1 accessible-name findings on desktop sidebar/user-menu controls and Purchase quick-add tiles, plus a phone Party-profile target-size finding. These are not cleared by this containment patch. Frontend release readiness and backend readiness are not established by these 16 journeys.
