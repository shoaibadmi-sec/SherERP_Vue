# Sidebar resize target-size audit — 17 October 2026

## Finding

**SHELL-A11Y-01 · P1 · Desktop sidebar resize target was too narrow.** The Reports whole-page matrix had recorded axe `target-size` on the desktop resize handle at 1440px in English and Bangla, both themes. Playwright measured its button at 8px wide, below the 24px minimum.

## Change

Expanded the resize button's hit target to 24px while keeping a 4px hover/focus indicator centered on the sidebar boundary. The control retains its accessible name and action. Its hit area extends slightly into the workspace; it does not add a visible rail at rest.

## Verification

`scripts/deep-sidebar-target-size-browser.cjs` passed **48/48** profiles across 320×700, 360×800, 390×844, 430×932, 768×1024, 1024×768, 1280×800 and 1440×900; light/dark; English, English + Bangla and Bangla. At desktop widths it asserts the 24px target, checks scoped axe, exercises touch/mouse collapse plus keyboard Enter collapse/expand, and reports zero sidebar axe violations across 18 scans. At narrower widths it verifies the desktop resize control stays hidden and the mobile navigation trigger is available. No runtime errors occurred.

Local gates: `npm test` passed 121 files; TypeScript passed; lint had 0 errors and 185 existing warnings; UI contract passed; production build passed with the existing large-chunk advisory. This does not certify physical screen readers, browser zoom, or downloaded-font rendering.
