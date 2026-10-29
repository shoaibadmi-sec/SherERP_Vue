# HisabIQ Bangla Phase 7 — shared cash drawer entry

## Implemented in this slice

- The shared `CashSessionDialog` now reads the existing `personal.language` through `useUiCopy`.
- Opening float, count total, denomination count, status, variance, note, save/close controls, accessible labels, preview warnings and success messages render in English or Bangla. English + Bangla keeps primary English labels with short Bangla helpers where relevant.
- The top-bar cash session entry uses the same selected language.
- Before staff count cash, the comparison shows **—** rather than presenting the empty count as a genuine zero count.
- Tablet/phone buttons wrap rather than forcing a fixed horizontal layout.

## Locked behavior

- Session state still uses the original `CashSessionContext`; no new ledger postings, transactions or bank clearance.
- `counted = sum(denomination × quantity)` or manually entered total; `variance = counted − expected`.
- **Close** stays disabled until a valid count is entered, and if variance is nonzero, a reason is required. **Save count** can record a count without closing.
- Opening float, expected cash, sample movements, session-open state, and saved values remain raw numbers/booleans, not localized strings.
- The entire dialog remains a UI **preview**, reset on reload. Localized success messages do not claim backend persistence.
- Existing CSV schema, invoice IDs, payment methods, POS cart, and tenant settings are unchanged.

## Regression gates

Run `npm test`, `npx tsc --noEmit`, `npm run lint`, `npm run build` and `npm run test:bangla-cash-drawer`. The browser script tests English, English + Bangla, and Bangla at 390px and 1440px and verifies the count/variance/note/close flow.

## Remaining for later phases

- Other top-bar language labels and contextual global widgets.
- Scheduled SMS/WhatsApp text and provider-supplied messages (never claim actual delivery in a UI-only preview).
- More specialized print templates and untranslated secondary/administrative modules.
- Durable authenticated cash-session posting and cross-module finance data require backend integration; frontend localization does not supply it.
