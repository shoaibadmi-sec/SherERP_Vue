# Sales phone layout — Magic Patterns integration

Scope: Sales, Sales Return, Return History, customer credit, drafts/templates, Quotations and Online Sales. The approved compact prototype supplies presentation only. The GitHub application remains the source of truth for data, permissions, calculations and preview operations.

The breakpoint is **767px maximum**. The initial integration retained tablet/desktop markup; the follow-up below changes only their filter disclosure. No store, API, posting rule, cart algorithm, role gate or dependency changes.

## Action preservation

| Area | Phone presentation | Existing outcome retained |
| --- | --- | --- |
| Invoice list | Flat records, search, filter disclosure | Customer/status/payment filtering; controlled search and clear |
| Invoice fields | Main figures and expandable details | Column preferences, line items, phone, date/time, cost/profit, paid and payment method |
| List actions | More → Columns / Export | Persisted column preferences and filtered CSV download |
| Invoice menu | Existing InvoiceActions | Invoice preview/print, payment, return, linked customer ledger and contextual source actions with existing guards |
| New sale | Header primary action | Existing POS route and editor |
| Sales Return | Collapsible invoice chooser and labelled item grid | Customer/invoice selection; quantity, reason, serial/lot/bundle evidence; original refund allocation, settlement and validation |
| Return History | Flat records and existing menu | Detail/print, linked customer ledger, another return |
| Customer credit | Flat balances and existing menu | Receive payment, apply to invoice, refund and ledger; original disabled conditions |
| Drafts/templates | Compact existing sections | Resume, duplicate, remove and reusable customer template editor; existing confirmations |
| Quotations | Flat records and status filter disclosure | Existing shared cart, product selection, compound quantities, discounts, draft/edit, status, duplicate, delete, print and handoff |
| Online orders | Flat records and channel/status filter disclosure | Existing order draft editor, shared cart, customer/address/payment mode, stage actions and POS handoff |
| Courier / COD | Compact records with courier evidence | Assign courier, tracking, COD report, clearing, payout and fulfillment print previews |
| CRM / SMS | Existing workbenches in compact phone shell | Lead create/update, notification rules and explicit preview-only messaging |
| Resize | Alternate presentations of the same state | Search, filter, selected source and draft state remain owned by the page |

## Shared components

Presentation helpers reuse `Button`, `FloatingPanel`, `Input`, `FormSelect`/`AppSelect`, `Dialog`, `StatusBadge`, `MotionTabList`, `useUiCopy`, and `useMediaQuery`. Existing transaction editors continue to use `TransactionCartEditor`, POS `ProductCombobox`, `CompoundQuantityInput`, existing quick-add controls and payment rows. No prototype cart or store was copied.

The phone chooser remains mounted when collapsed. Invoice detail disclosure is outside the record button, avoiding nested interactive controls. Phone column choices render inside their parent menu, avoiding nested portal dismissal. All CSS is scoped to the phone breakpoint.

## Verification

- Existing unit suite: 681 passed.
- UI contract guard: passed (3 tests).
- Targeted ESLint: no errors; two pre-existing hook dependency warnings.
- TypeScript: passed.
- Production build: passed; existing chunk-size advisory remains.
- Initial phone-only integration before/after screenshots: seven routes at 768px and 1440px were pixel-identical under the same fonts, language, density and reduced-motion settings.
- Browser regression scripts cover list preferences/export, invoice/detail, split payment arithmetic, return source/quantity/reason/settlement, credits, quotation draft/status/duplicate/delete, online order/courier/COD/payout, CRM and SMS preview.
- Responsive matrix covers 360, 390, 430, 768, 1024 and 1440px, all three language modes, light/dark and search state across the breakpoint.

Financial, courier and SMS preview limitations are unchanged. This change does not introduce backend posting or messaging. Shared POS and purchase editors are deliberately unchanged; other tablet/desktop redesign remains deferred.

Reproduce browser checks after `npm run build`: run `node scripts/sales-mobile-layout-browser.cjs`, `node scripts/bangla-sales-browser.cjs`, then `TEST_MOBILE=1 node scripts/quotations-browser.cjs` and `TEST_MOBILE=1 node scripts/online-sales-browser.cjs`. Set `PLAYWRIGHT_EXECUTABLE_PATH` only when using a system Chromium instead of the Playwright browser.

## Follow-up: tablet and desktop filters

Sales, Quotations and Online Sales now use `SalesWideToolbar`. Search, columns and export stay visible; an accessible filter icon expands all existing filters in a row below. Filters start collapsed, show an active count, and retain controlled values/results when collapsed or when switching device width. Framer Motion follows the existing reduced-motion preference. Phone layouts and all transaction workflows remain unchanged.

The responsive browser matrix checks keyboard expansion, hidden initial controls, every Sales and Online Sales selector, quotation status filtering, retained selections/results after collapse, all three language modes, and viewport overflow.

Filter-only follow-up verification: build, TypeScript, UI contract guard, all 681 unit tests, and the full responsive browser matrix pass. All seven 390px screenshots are pixel-identical to the phone-only implementation. Tablet/desktop collapsed and expanded screenshots were inspected together; only the requested filter toolbar behavior changes.

## Follow-up: tablet defaults and mobile invoice menu

At 768–1279px, Items and Payment start hidden in the Sales invoice table. Tablet column preferences use a separate storage key so users can enable either field without changing desktop/phone preferences. Switching widths preserves each preference set. Desktop defaults remain unchanged.

On mobile invoice records, the existing action menu is beside More details, below Total/Due, matching the annotated position 2. Its invoice, payment, return and ledger callbacks are unchanged. The browser matrix checks its position, opens invoice detail from the relocated menu, and verifies tablet defaults, opt-in, reload persistence and width changes in all three languages.

Verification: 681 unit tests, UI contract guard, TypeScript and build pass. Responsive browser checks pass across all three languages at 360/390/430/768/1024/1440px. All seven 1440px screenshots remain pixel-identical after this adjustment; mobile and tablet captures were inspected.

## Follow-up: tighter mobile invoice footer

The invoice action trigger uses a compact 32px target in the More details row. The inline-block baseline gap is removed, footer padding is reduced, and the detail control is closer to Total/Due. Scope is restricted to mobile invoice cards. Browser checks verify a usable menu target, detail-to-total spacing, menu opening and the responsive matrix; tablet/desktop screenshots remain unchanged. Build and UI contract checks pass.

## Follow-up: mobile customer ledger access

Linked invoice customer names use the same teal affordance and source-linked Party route as the desktop table. The customer button and invoice-open button are siblings, so keyboard/touch actions are distinct without nested interactive controls. Unlinked walk-in customers remain plain text. Compact menu/detail spacing is retained. Browser checks cover ledger navigation, invoice opening, no accidental invoice dialog on a customer action, usable menu size, and spacing in all three language modes. TypeScript, build, 681 unit tests and UI contract checks pass; all 14 tablet/desktop baseline screenshots remain unchanged.

## Follow-up: square toolbar menus and tighter customer rows

The two marked mobile Sales menus (beside New sale and Filters) now use existing outline Button styling with square bounds. The linked customer name no longer reserves a 24px minimum height; compact invoice cards remove the extra gap above the name and reduce the gap below it. Invoice top/bottom padding is tighter without changing text sizes or removing data. Regression checks verify the outlined square buttons, name/reference/total spacing, ledger navigation and existing invoice actions. Build, TypeScript, 681 tests and UI contract pass; tablet/desktop baseline screenshots remain identical.

## Follow-up: match Walk-in customer typography and spacing

Mobile invoice customer names now share explicit 13px, 18px line-height, regular-weight styling, whether rendered as a linked customer button or plain walk-in text. Both use the same tight reference/name/total spacing; linked customers retain their teal ledger action. Browser regression compares the actual linked and walk-in row heights, gaps and computed typography, alongside existing action/resize/language checks. Build, lint and UI contract checks pass; tablet/desktop screenshot baselines are unchanged.

## Root-cause correction: coarse-pointer 44px override

The earlier viewport matrix used a fine pointer, missing the global `@media (pointer: coarse)` rule. Reproduced with `hasTouch: true` and `isMobile: true`: the linked customer button was forced to 44px and its card to 126px, versus 18px / 100px for Walk-in customer. Cosmetic gap adjustments did not address that override.

The existing global touch-target rule now excludes explicitly marked `data-compact-control` controls. Only inline customer ledger buttons and the explicitly sized mobile More buttons receive that marker. The exclusion uses `:where` to preserve the original selector specificity for other controls. The linked customer row now measures 18px and its card 100px, matching Walk-in customer on the same touch viewport.

The browser matrix now enables coarse touch pointers on phones/tablets, mobile emulation on phones, asserts that pointer mode, checks the actual 18px name height, and uses taps for customer/action controls. Build, 681 tests, lint and UI contract checks pass.
