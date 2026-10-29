# HisabIQ motion and tab-selection UI contract

**Scope:** Existing ERP visual polish only. Preserve Magic Patterns/shadcn styles, POS/Purchase cart contracts, all selection handlers and financial behavior.

## Motion policy
- Reuse installed Framer Motion; no second animation library.
- `src/motion/tokens.ts` owns durations and deceleration.
- For actual module/nested tabs, use `MotionTabList` + one `MotionTabIndicator` inside the selected native button. Use `role=tablist`, `role=tab`, and existing `aria-selected`, focus/keyboard handlers. Layout groups isolate independent strips.
- Animated underline is 2px high and themed `bg-primary`. It tracks selection without delaying content, remounting editors or modifying URL/deep-link behavior.
- No secondary inset-shadow or filled selection treatment on migrated tablists, including Online Sales.
- Reduced-motion preference uses a static underline (no layout travel).
- Exclude payment modes, quantity/unit toggles, action button groups, and ordinary status filters; these are not section navigation.

## Initial source census (2026-10-19)
All twelve known ERP tablist locations:
1. `src/components/parties/PartyDetail.tsx`
2. `src/components/vendor/VendorTabs.tsx`
3. `src/components/products/ProductSettings.tsx` (nested Products settings)
4. `src/pages/Products.tsx`
5. `src/pages/Sales.tsx`
6. `src/pages/Purchases.tsx`
7. `src/pages/Finance.tsx`
8. `src/pages/Accounts.tsx`
9. `src/pages/Reconciliation.tsx`
10. `src/pages/Expenses.tsx`
11. `src/pages/Warranty.tsx`
12. `src/pages/OnlineSales.tsx`

This is a minimum; a new or previously hidden actual tablist must join the same contract.

## Other motion boundaries
- Desktop sidebar: 256px/64px, initial render instant, animated explicit toggle only. Keep Ctrl/Cmd+B and persistent collapsed choice.
- Navigation: active parent and child indicators have distinct layout IDs, per nav instance; pointer-hover motion only on fine hover devices.
- Numeric: only stepper opacity is animated; input dimensions, stepper absolute centering, wheel/keyboard/click arithmetic and tab order are unchanged.
- Never animate financial figures or postpone validation, posting, focus, screen-reader state or table reordering.

## Verification
- `npm run build`, `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run check:ui-contract`
- `npm run test:motion-navigation`, `node scripts/numeric-steppers-browser.cjs`
- `npm run test:sidebar-target-size`, `npm run test:erp-navigation`, `npm run test:vendor-party-layout`
- Review light/dark, Bangla/English, mobile/tablet/desktop, print, and reduced-motion. Actual low-end Android responsiveness requires physical-device verification.

## Rollback
The entire change is isolated on `feat/impeccable-framer-motion-tabs-20261019` and draft PR #176. Revert or close the PR before merge to keep `main` unchanged. If individual motion additions regress input or navigation behavior, remove that presentational layer; never alter calculations to accommodate animation.
