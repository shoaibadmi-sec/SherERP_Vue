# Finance overview table keyboard access — 17 October 2026

## Finding

At 320px, the Finance overview table overflowed horizontally while its scroll wrapper was not keyboard focusable. Axe reported `scrollable-region-focusable` with the Finance people dialog both closed and open. The shared Table wrapper now exposes a named, visibly focused scroll region only when it actually overflows. Arrow keys scroll only when that wrapper owns focus, leaving inputs and other child controls' key behavior intact.

## Local browser evidence

`scripts/deep-finance-table-scroll-browser.cjs` covers all eight requested viewport sizes, light/dark, and English, English + Bangla, and Bangla.

- **48/48 Playwright profiles passed.** Every profile checks the Finance table before and during the nested people dialog, Escape/focus return, and preservation of the parent amount draft.
- **96/96 whole-page axe scans passed** (two per profile).
- Where the wrapper overflows, the regression verifies keyboard focus, a visible focus ring, ArrowRight scrolling, and that ArrowRight on a table child input moves its caret. Fitting wrappers add no tab stop; 1440px is required to fit.
- Touch taps are used through 1024px; desktop uses pointer clicks. The regression has no force-clicks or arbitrary sleeps.

## Local gates and limits

TypeScript, the full 116-file unit suite, lint (0 errors; 168 warnings), UI contract, and production build passed locally. Manual screen-reader operation and downloaded-font rendering remain unverified.
