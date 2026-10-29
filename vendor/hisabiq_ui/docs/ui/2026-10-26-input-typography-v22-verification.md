# Input typography v2.2 — verification

26 October 2026. Follow-up to the v2.1 component library in PR #206. The user requested smaller, lighter and less dark text in input fields. The corrected Magic Patterns artifact is `5b1f6ae5-d2c4-4e7b-8756-b74ffdb8f872` at https://www.magicpatterns.com/c/t6q3mxi6nhuak3qjvx8cwn.

## Change

`src/index.css` defines shared input typography tokens: 13px size, 20px line height and regular 400 weight. Shared Input, NumericInput, joined editors and native app text fields/textarea use the existing Ink 600 theme color. Placeholders use the existing muted foreground at regular weight and full placeholder opacity. Field values no longer inherit the medium weight of surrounding labels. The label, headings, totals and other non-input emphasis keep their existing roles.

The stylesheet retains control height, multiline geometry, numeric alignment, stepping/parsing, clear behavior, focus/error treatments, disabled opacity and calculator-specific text. No POS cart layout, unit conversion, quantity map, pricing-unit or transaction handler is changed. The guide and AI handoff now explicitly carry this contract at v2.2, including textarea. Generated guide data and inventory are synchronized. Source file/icon/color counts are unchanged.

## Executed checks

- TypeScript, production Vite build, changed-script ESLint, `git diff --check`, UI contract suite, both exact-copy/formatting guide unit checks and the component-library export passed. No dependency was added. The build retains the existing large-chunk warning.
- The full design-guide browser script passed all six existing profiles: 1440 light English + Bangla, 1440 dark English, 768 light English, 768 dark Bangla, 390 light Bangla and 390 dark English + Bangla.
- Added browser assertions verify actual computed 13px/20px/400 and active-theme Ink 600 on text/search/tel/read-only/disabled inputs, textarea and numeric/joined specimens. Placeholder weight/opacity and search clear/focus are checked. Existing report, calendar, tooltip, Party icons, modal focus, table 13/12/11 roles, 36/48px controls, overflow, runtime error and axe checks also pass.
- A production-preview input-card capture was visually inspected. The initial development-server navigation waited on the browser load event and timed out; the harness now waits for DOM content and then its existing ready heading. The complete retry passed. A separate clean-preview lookup for the screenshot's Napa product had no matching fixture; it does not establish a four-unit business-workflow regression result.
- Independent source review found no deviations. Calculated text/card contrast: Ink 600 values 8.63:1 light and 9.46:1 dark; muted placeholders 5.46:1 light and 8.13:1 dark. The review was calibrated against a deliberately wrong weight in an isolated copy; that proof covers typography detection, not geometry.
- The existing exporter included the corrected shared CSS. Magic Patterns compiled and activated the artifact with the same guide/inventory and source typography. Its hosted runtime is not part of the local browser claim.

The user requested ideas before any POS multi-unit layout implementation. The current editor explicitly uses one grid column for three-or-more-unit products, explaining the tall row in the screenshot. Proposed layout options are discussion only. No cart redesign or new quantity-entry grammar was implemented.

The verification covers changed library typography and its existing interaction checks, not every ERP/auth field, physical device, finance posting, legacy accessibility gap or backend integration. PR merge remains a separate user decision under AGENTS.md.
