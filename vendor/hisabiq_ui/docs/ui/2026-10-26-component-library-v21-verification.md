# Component library v2.1 — scope and verification

26 October 2026. Follow-up to the v2.0 guide in PR #206. Magic Patterns editor: https://www.magicpatterns.com/c/t6q3mxi6nhuak3qjvx8cwn, agnishuvo@gmail.com. Published artifact: `b97ce3f5-9aa9-4882-9162-4e53d9be12f7`.

## Result

The design-system page leads with a searchable, interactive component library. Eleven specimen groups cover Party Ledger headers, the report workspace toolbar, buttons, cards/charts, fields, compound quantities, selectors/Quick Add, dates, overlays/help, prepared feedback states and uploads/disclosure. Examples import actual HisabIQ components. The source inventory remains a separate index of 243 authored TSX files, 152 imported Lucide names, 16 typed ERP exports, 192 bundled runtime exports and 59 color roles per theme. Icon entries now render the actual glyphs. The canonical guide has 32 chapters at v2.1.

The screenshot patterns are live specimens: focused search; two-month desktop date range (one month on phone); comparison, filters/chips, columns, saved views; English/Bangla report help; and relationship-dependent Party actions. Role selection changes the complete action set rather than just the avatar. The source tables distinguish identity icons from action icons and preserve posting context:

| Relationship | Action | Lucide icon / context |
| --- | --- | --- |
| Customer | Receive payment | HandCoins |
| Supplier | Make payment | Banknote |
| Owner | Add capital / Owner drawing | PiggyBank / Wallet; Owner Credit / Owner Debit |
| Lender | Repay loan / Loan received | Landmark / ArrowDownLeft; Lender Debit / Lender Credit |
| Borrower | Collect repayment / Lend money | HandCoins / ArrowUpRight; Borrower Credit / Borrower Debit |
| Vendor | Pay vendor / Receive money | Banknote / HandCoins; vendor settlement context |
| Payee | Opening balance | BookOpen; no invented Customer receipt action |

Refund availability still comes from verified credit and its source, not an arbitrary balance sign. Library actions open explicitly labelled previews and never post financial records. The mobile sheet preserves primary/secondary roles and returns focus to More after a nested preview closes.

## Shared implementation changes

`ColumnVisibilityEditor` is extracted from the Reports dialog and reused by both the real Reports page and its library specimen. The protected identity column and existing report filter/URL callbacks are preserved. `Button` forwards its ref to the existing design-system primitive so dialogs and sheets can return focus. `PartyActionSheet` uses the existing language preference for its helper and close label. Prepared `FeedbackState` compositions have explicit status in the catalogue. Existing chart and photo-upload copy/accessibility limitations are visibly labelled as migration work; they are not approved defaults for future UI.

`npm run export:component-library -- <directory>` exports the runtime dependency graph for Magic Patterns. It keeps source component code and the existing Tailwind/theme contracts, with isolated adapters for the prototype's SDK primitives, language preview, pure report defaults/date validation and themed portal host. It copies no finance backend. `docs/ui/COMPONENT-LIBRARY-PREVIEW.md` in Magic Patterns documents those boundaries. The actual guide, generated inventory and glyph atlas match the repository. Source export completed successfully with 63 files including the scoped stylesheet. No dependency was added.

## Executed checks

TypeScript, production Vite build, changed-file lint (zero errors), `git diff --check`, `npm run check:ui-contract`, both guide-copy/formatting unit checks and the export command passed. The build retains its existing large-main-chunk warning. Lint retains the Button star-export verification warning and four existing Reports non-null-assertion warnings; no lint exception was added.

The six-profile browser run passed at 1440px light English + Bangla, 1440px dark English, 768px light English, 768px dark Bangla, 390px light Bangla and 390px dark English + Bangla. It used Chromium headless shell 134 with the executable override and single-process mode, without changing package versions.

Assertions covered all seven role/action icon sets and Owner finance type, mobile More → Add note → preview → Escape → focus return, language-sensitive sheet helpers, report search, responsive month count, comparison, protected identity/hiding Amount, saved-view restoration, bilingual help and viewport containment, prepared Retry, all eleven specimen groups and axe WCAG A/AA checks for the new library. The existing guide checks also passed: all chapters and color rows, source search, exact copy/download, ordinary/terminal sizing, table type hierarchy, modal and selector keyboard behavior, tabs, theme/language and no whole-page overflow/runtime errors. An additional real Reports-page check opened the extracted Columns editor, toggled an optional column, confirmed state and URL changes, and closed the dialog. Desktop and phone captures were visually inspected.

An independent reviewer first calibrated against a deliberately wrong Customer icon in an isolated copy, then reviewed the real implementation. Findings about grouped field semantics, saved-view name containment, supported filter dimensions, mobile overflow actions, nested Switch labels and language descriptions were corrected. These checks establish the changed library and shared interactions; they do not certify every existing ERP screen, physical devices, legacy chart/upload gaps or backend integrations.

Magic Patterns compiled and activated the v2.1 artifact with `index.js`, its source map and `index.css`. Its hosted runtime was not included in the local six-profile browser claim. PR #206 remains open; merge requires the user's separate approval under AGENTS.md.
