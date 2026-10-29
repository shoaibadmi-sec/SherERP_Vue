# Phase 28 — Multilingual responsive/accessibility QA gates

Baseline: Phase 27 PR #118 merged into `main` (merge `3e08519cb19e958fd8703ba2db1713f0733db87c`).

## Concrete accessibility defect fixed

The ERP's entry document always had `<html lang="en">` even when the visible UI preference was full Bangla. A screen reader may apply English pronunciation rules to Bangla text. The existing `Workspace` component now sets `document.documentElement.lang = "bn"` for full Bangla, and `"en"` for English or English + Bangla (English remains primary). It resets to English after leaving the ERP for the SaaS portal. This is **document metadata only**, driven by the existing `useUiCopy()` preference; no duplicate settings state.

For bilingual helper fragments, language-specific span markup is a separate future audit requirement. This phase does **not** assert that marking the document English makes every Bangla helper screen-reader correct.

## Measurable test matrix

- English, English + Bangla, Bangla.
- 390×844 phone portrait; 768×1024 tablet portrait; 1024×768 tablet landscape for POS, Purchases, Vendors and Party; 1440×900 desktop.
- Light and dark color schemes. Touch at phone/tablet widths.
- Representative ERP routes: Dashboard, POS, Counter, full-page Purchase Editor, Vendors, Products, Party Ledger, Finance, Daybook, Reports and Personal Settings.
- 222 route renders expected (3 languages × 2 themes × (11 × 3 sizes + 4 tablet landscape routes)); the script writes the actual count, rather than assuming success.
- Hard gate: DOM language matches current preference; no document-wide horizontal scroll; no uncaught page exceptions; ERP main/skip link exist; Enter on the skip link focuses the main landmark.
- Run `axe-core` WCAG A/AA (through WCAG 2.2) on Dashboard, POS and Party in phone portrait/light for each language. Record violation IDs, severity and selectors as a JSON artifact. Because this is an **audit baseline** with potentially pre-existing product-wide violations, axe findings are reported and intentionally **not** treated as pass/fail. Phase 29 must triage and repair them before localization/accessibility certification.

## Test commands and evidence

- `npm test` includes `tests/banglaPhase28ResponsiveA11yContract.test.ts`, protecting source, route and callback constraints.
- `npm run test:phase28-responsive-a11y` runs the new read-only browser matrix.
- The `Responsive UX Check` workflow still runs the original full 51-route × 4 sizes × 2 themes sweep and the existing dialog focus/overlay tests. It now also runs the Phase 28 matrix.
- JSON evidence artifact: `phase28-language-responsive-a11y`, file `.superpowers/phase28/accessibility-audit.json`.

## Non-regression boundaries

Keep existing POS V2, purchase/cart responsiveness, business logic, source ledgers, transactions, date formats, bilingual glossary, Magic Patterns design primitives and print output. There are no new workflows, monetary mutations, source-data changes, or UI clones in this phase.

## Phase 29 remaining

1. Reconcile all routed screens and shared controls against the measured language-mode census.
2. Triage axe findings (critical/serious first), including mixed-language inline spans, then add targeted fixes and regression gates.
3. Record **measured** untranslated labels, accessibility names, financial confirmation text, and print/export gaps. Do not silently mark an entire area green from a route-render test.
4. Test with real Bangladeshi shopkeepers and confirm backend-dependent business flows **separately** before production readiness can be claimed.
