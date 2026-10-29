# Phase 29 — Accessibility remediation and honest Bangla coverage census

Baseline: Phase 28 PR #119 read-only audit: **222 tested route renders**, 0 hard errors, and nine inspected axe audit cases with recorded findings (three routes × three languages on phone/light). This phase is based on Phase 28 until it merges.

## Measured Phase 28 axe findings

| Severity | Route(s) | Rule | Baseline evidence | Phase 29 mitigation |
| --- | --- | --- | --- | --- |
| Serious | Dashboard, POS, Parties | `label-content-name-mismatch` | `button.pl-1` user avatar; Party range date trigger | Include visible initials/name in User menu accessible name; include shown range/date in calendar button name |
| Serious | Parties | `nested-interactive` | Party directory `li[role=option]` containing a button | Put option semantics/selection on the actual keyboard-operable button, use presentational `li` |
| Serious | Dashboard | `scrollable-region-focusable` | Recent Sales design-system table overflow wrapper | Add a measured `ResizeObserver` enhancement only to the overflowing Recent Sales table; make it keyboard-focusable with a human-readable name, remove added tab stop when it fits |

Browser gate: `npm run test:phase29-accessible-names` tests all three languages at 390px for these **specific** rules and Party date and selection behavior. `tests/phase29AccessibleNamesContract.test.ts` protects source IDs, callbacks and unchanged ISO date math.

## Bangla wording census — do not confuse this with release certification

The `npm run test:phase29-bangla-census` browser script visits 26 routed ERP pages at **390px and 1440px**, in full Bangla mode. It searches visible headings, button/tab labels, table headings, labels, placeholders and alerts for Latin-script word sequences, and saves the findings to the `phase29-bangla-label-census` CI artifact. **Each result is only a translation-review candidate**: real business/person names, invoice references, brands, item units, accounting IDs and externally sourced content may legitimately remain English.

Triage rules:
1. P0: financially significant confirmation/error/due direction; verify source truth and human-readable Bangla separately from accounting IDs.
2. P1: everyday controls, accessibility names, dialogs, touch/keyboard focus, table labels, status and settings.
3. P2: low-frequency help/decorative text.
4. Keep the existing `useUiCopy` language mode and Magic Patterns/shadcn-style source components. No new UI family, no fake server posting, no data mutation. Do not translate exported machine fields or persisted enum IDs.

### Remaining release blockers and limitations

- The census is heuristic, not full semantic translation proof. Follow up source-by-source for P0/P1 candidates rather than bulk-replacing English.
- Phase 28 axe report checks just three representative routes on phone/light; passing the Phase 29 targeted rule check does not prove WCAG 2.2 AA across the entire ERP.
- Full bilingual inline-span language marking, all transaction dialogs and print content, additional language modes × themes, shopkeeper tests and backend financial correctness remain **separate acceptance requirements**.
- Do not declare all localization work or HisabIQ production-ready merely because the Phase 29 PR merges; publish remaining findings and new dependency-ordered fixes.

## CI evidence
- `UI Check`: strict TS, lint, unit/contract, build, existing 27 phases, and Phase 29 focused a11y browser test.
- `Responsive UX Check`: existing 408-route baseline, Phase 28 multilingual matrix, and the Phase 29 census with downloadable JSON artifact.
