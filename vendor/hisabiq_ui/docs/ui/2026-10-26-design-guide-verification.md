# Complete design guide v2.0 — scope and verification

26 October 2026. Baseline: main 79c51fdbbc8ce47364488127a1e2c5762f6526d9. Magic Patterns editor: https://www.magicpatterns.com/c/t6q3mxi6nhuak3qjvx8cwn, agnishuvo@gmail.com.

The authored guide consolidates 32 chapters and distinguishes existing implementations, standardized defaults and known gaps. It inventories all 238 authored TSX files, 148 imported Lucide names, 16 typed ERP primitives, 192 bundled runtime exports and 59 color roles in each theme. Inventory is generated, not a claim that every old screen conforms. The implementation adds no package dependency and changes no business transaction handler.

## Deliverables

- Canonical rules: HISABIQ-DESIGN-GUIDE.md; portable AI instruction: AI-UI-PROMPT.md.
- Machine inventory: design-system.json; generated visual text: src/data/designGuide.json.
- Existing /#/design-system route now has searchable chapters, exact copy/download, complete searchable source/color/icon/export inventory and actual shared-component examples.
- AGENTS.md requires the guide before UI work; README points to it. Existing check:ui-contract now checks generated-guide drift. `npm run sync:design-guide`, `check:design-guide` and `test:design-guide` expose the maintenance/check workflow.
- Magic Patterns receives the same canonical Markdown, visual chapter data, source inventory and portable AI instructions. Its guide uses its existing primitives; GitHub-only runtime examples stay in the implementation repo. Source inventory explicitly identifies the GitHub baseline rather than pretending every export exists in the prototype.

## Source review corrections

Independent builder review corrected exact logo clear space/minimums, the existing AppDatePicker export, actual Input/Button typography and padding, and TSX inventory coverage beyond components/. Additional review checked modal runtime geometry against the bundled implementation, separated typed from bundled exports, and retained narrower table/control/motion contracts. Known missing wrappers and MotionTabList keyboard responsibilities remain explicit.

## Executed checks

TypeScript, production Vite build, lint of changed UI and scripts, git diff --check, existing UI contract suite, generated-guide drift check and both focused guide tests passed. The unit check verifies that visual copy/download reconstructs the entire authored document byte for byte and preserves table/Bangla formatting. Build retains the existing large-main-chunk warning; this change does not address general bundle architecture.

The browser check passed all six profiles:

| Width | Theme | Example language |
| --- | --- | --- |
| 1440px | Light | English + Bangla |
| 1440px | Dark | English |
| 768px | Light | English |
| 768px | Dark | Bangla |
| 390px | Light | Bangla |
| 390px | Dark | English + Bangla |

Verified: 32 chapters, search/no-results/reset, expand/collapse, section navigation preserving HashRouter, byte-exact clipboard and download, all 59 palette rows, source export search, numeric arrows, select keyboard commit, 48px explicit sample CTA, nested select Escape before modal close, return focus, tab arrow navigation, 13/12/11 table roles and proportional figures, filtered empty state, no whole-page overflow and no runtime errors. Axe WCAG A/AA checks passed for the new guide, source inventory and shared-component playground. Desktop/dark and phone screenshots were visually inspected. Earlier phone overflow in identity swatch/grid specimens was fixed locally within the guide.

Chromium headless shell 134 was used through the existing Playwright dependency with an executable override; this environment needs PLAYWRIGHT_SINGLE_PROCESS=1. No dependency/version was changed. Physical Android/iOS, every original identity-board accessibility detail, the whole ERP's existing divergences, backend posting and real auth/SMS/payment integrations are outside this guide change's verification claim.

## Maintenance

Edit the canonical Markdown or actual source token/component, run `npm run sync:design-guide`, then `npm run check:design-guide` and the checks relevant to the change. Preserve the same guide version/content in Magic Patterns. New visual patterns use the guide's composition/extension policy rather than a parallel primitive. Git history and the Magic Patterns timeline preserve previous versions. Merge remains a separate user decision.
