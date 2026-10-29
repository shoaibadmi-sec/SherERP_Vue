# ERP sidebar navigation contract

This React/Tailwind sidebar follows the accessible interaction design from the official shadcn `sidebar-07` registry block without replacing HisabIQ's existing router, permissions, mobile drawer, or design tokens.

- Top-level modules **with children** are single full-width expandable buttons. Clicking the label, icon, or chevron toggles the same group. They never navigate by themselves.
- The first child is the module's landing page. Child links perform navigation, retaining query-parameter deep links and current-module highlighting.
- Top-level modules **without children** are direct links (including POS).
- Only one submenu is expanded at a time; active navigation expands the corresponding parent on route changes.
- Desktop sidebar can collapse into an icon rail using the consistent `SidebarTrigger` with the default shadcn-style PanelLeft glyph, the Ctrl/Cmd+B shortcut, or the narrow sidebar rail. Preference persists per browser.
- In icon mode direct links keep working; groups open the expanded sidebar at the requested group. Every icon has an accessible label and a title tooltip.
- Mobile ERP navigation remains an accessible dialog/drawer with the same full-row expandable group behavior. Clicking a child closes the drawer.
- Maintain theme tokens (`sidebar-*`), Bangla helper labels, compact density, keyboard focus indication, routes/feature access gates.
- Do not add a second navigation library or make the business card appear to be an operational selector until real branch-switching exists.

Regression coverage: `npm run test:erp-navigation` checks parent label and chevron parity, route invariants, icon mode, persistence, shortcut, and mobile.
