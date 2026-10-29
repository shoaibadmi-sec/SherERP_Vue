# HisabIQ Bangla Phase 8 — shared workspace shell

## Scope implemented

- Translated top-bar actions for global search, clear, new sale, notifications, calculator and user menu, plus keyboard skip-to-workspace link.
- Translated mobile navigation sheet labels and desktop sidebar quick actions, collapsed tooltips, main/branch helper labels and accessibility names.
- Sidebar navigation continues to derive groups, routes and access from the existing `erpNavigation` source. Full Bangla mode no longer displays English as a second line under Bangla labels; mixed mode retains the Bangla helper.
- Translated the appearance picker (Light, Dark, System labels only) and calculator copy/backspace feedback. Underlying theme values and calculator math remain unchanged.
- Localized the four static dashboard-notification examples for Bangla presentation. Sample IDs, names, invoice and purchase reference numbers and amounts were not changed in the source.
- The notification popover now truthfully says **Sample notifications · UI preview only**. It no longer shows a hard-coded unread dot/count or an inert **Mark all read** control; the replacement **Close** action actually closes the popover.
- Sign out was previously a no-op that only closed the menu. It is now intentionally disabled and clearly identified as unavailable in the UI preview rather than suggesting an authenticated logout occurred.

## Locked contracts

- Keep current Magic Patterns layout, font, width, shadcn UI control family, popover focus handling, light/dark tokens and touch target sizes.
- Preserve Ctrl+K global search focus, quick-clear, existing search submission, ctrl+B sidebar shortcut, mobile sheet Escape/focus trap, and keyboard navigation.
- Preserve `erpNavigation` IDs, routes, feature permissions, `aria-current` selection, and settings URLs; business settings navigation now uses an explicit route instead of comparing translated display labels.
- Do not localize stored tenant preferences, theme IDs, notification IDs, data values, user names, invoice IDs, amounts, transaction records or payment directions.
- No backend integration: notification read state and authenticated sign out are not implemented; they must not be simulated.

## Regression

- `npm run test:bangla-workspace-shell` tests English / English + Bangla / Bangla at phone (390px) and desktop (1440px): localized search/accessibility labels, Ctrl+K, quick-clear, theme selection, notification copy and popover close, calculator, account settings route, disabled sign out, mobile sheet and desktop sidebar.
- `tests/banglaPhase8WorkspaceShellContract.test.ts` enforces preserved routes, storage preference, theme IDs and preview-source values.
- CI also needs strict TypeScript, ESLint, `npm test`, build, layout, global search, settings and existing Finance/POS/Vendor tests green.

## Deferred

- Dynamic SMS/WhatsApp provider response localization and actual outbox statuses, which need backend contracts.
- Other secondary ERP/SaaS Settings screens, custom export/print templates and remaining specialist action text.
- Real authenticated login/logout, live notification read state and durable cash/ledger posting.
