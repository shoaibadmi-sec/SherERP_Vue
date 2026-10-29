# HisabIQ Bangla Phase 9 — ERP Notifications & SMS preview

## Implemented
- The existing ERP Notifications workbench uses the same `personal.language` preference as POS, Finance and the shared workspace.
- Notification groups, event titles, audience/source helpers, filters, status toggles, trigger/recipient selections, reminder controls, errors, preview instructions and safety warnings are translated for English and Bangla.
- Mixed mode retains English primary controls with short Bangla event helpers; Bangla mode shows one primary Bangla event label.
- Search accepts English/Bangla event names and localized workflow categories.
- Eligibility reasons display in Bangla without changing the original machine-readable reason strings.
- The **SMS language** setting remains **separate** from the user interface language. Selecting a different interface language never rewrites a saved SMS template.
- Template placeholders remain exact ASCII tokens (for example `{number}`, `{paid}`, `{due}`). Preview examples interpolate those tokens using the existing renderer.

## Locked safety and storage behavior
- **No SMS sends, deliveries, scheduling, gateway traffic, charges or credits.** All rules still default OFF.
- Do not translate `ErpNotificationEvent` IDs, `NotificationGroup` stored values, `SmsLanguage` IDs (`English`/`Bangla`), `TriggerMode` IDs (`Manual`/`On event`), recipient role values, template content or placeholder keys.
- Consent, Bangladesh phone validation, 320-character message limit, reminder-day validation, quiet hours and gateway eligibility remain enforced in the existing notification domain.
- Original `notificationEvents` registry, snapshot subscriptions and `updateNotificationRule` remain unchanged.
- No new provider messages are invented or translated; unsupported future error strings fall back to their original text.
- Continue using the existing Input, AppSelect and Button primitives; do not change the desktop/phone layout or embedded Online Sales behavior.

## Tests
- `tests/banglaPhase9NotificationsContract.test.ts` verifies translated labels keep raw option values and preserve SMS defaults, consent, eligibility and template placeholders.
- `npm run test:bangla-notifications` tests English, English + Bangla and Bangla at 390px and 1440px. It checks message language independence, preview text, consent-independent gateway block, rule toggle, localized category filtering, search and preview-only notification.
- Continue running strict TypeScript, ESLint, unit tests, existing SMS fulfillment browser test, POS, Vendor, Finance, full responsive audit, and global search checks in CI.

## Deferred
- Real tenant-scoped event outbox, delivery receipts, gateway errors, consent verification and SMS billing/credits, to be developed with backend contracts.
- Scheduled WhatsApp/SMS outbound templates and advanced specialist print templates.
- Unlocalized standalone secondary/admin modules (separate phases).
