# HisabIQ appearance

The header Appearance control offers Light, Dark and System. System follows OS changes live. The preference persists under `hisabiq-theme`, synchronizes between tabs and still works when storage is blocked. The inline initializer applies the saved/system theme before React loads.

`src/theme.css` owns the palette. RGB channel tokens power Tailwind's opacity utilities; full-color semantic aliases power the bundled shadcn components. The semantic alias selector deliberately outranks the bundle's generic dark defaults. New UI should use `background`, `card`, `foreground`, `primary`, `primary-foreground`, `muted-foreground`, `helper`, `input`, and `ring`. Use status background/text pairs together. Filled primary controls need `primary-foreground`; links use `primary`. Avoid fixed white surfaces or white text on the lighter dark-mode primary.

Light primary is `#0D7C74` with white text. Dark primary is `#3DB8AC` with `#0B1A2C` text. Bangla helpers keep their smaller, lighter treatment but meet normal-text AA on standard surfaces. Input boundaries and keyboard focus use stronger tokens than decorative card/table borders.

Brand specimens retain their explicit colors; the brand guide and receipt preview use a scoped light palette. Print media uses a white canvas and readable dark text without changing the saved screen preference.

## Verification

- `npm test`: 56 tests, including preference initialization, blocked storage and palette contrast checks.
- `npm run build`: successful production build.
- `npx playwright install chromium`, then `npm run test:theme`: 64 rendered states across 14 operational routes, representative forms/dialogs, menus, a primary-button hover state, completed POS receipt, and four mobile routes in both themes. Also tests persistence, system changes, cross-tab synchronization, keyboard focus return and print isolation.
- Set `PLAYWRIGHT_EXECUTABLE_PATH` to use an existing browser. Set `THEME_AUDIT_OUTPUT` to save JSON findings.
- Rendered text checks use axe-core. SVG chart labels and clipped reconciliation rows can require manual review; their shared colors are covered by the palette tests. Automated results are not a WCAG certification and do not enumerate every possible application state.

Existing limitations: the repository's standalone TypeScript check already reports missing declarations for the generated design-system bundle and related component errors. This change introduces no additional error categories. The build still reports the pre-existing duplicate `note` key in `ImpactPreview` and a large bundle warning.

Tailwind remains at 3.4.17; upgrading it is independent of this appearance system.
