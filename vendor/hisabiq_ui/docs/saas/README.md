# HisabIQ SaaS administration UI

This is the UI/UX phase in `HisabIQ_ui`. No API server, database, authentication service, payment gateway or SMS provider is implemented. Local React state simulates the workflows so the screens can be reviewed before backend integration.

## Open the screens

Use the existing Vite development server and visit `/#/saas/overview`. Tenant-facing billing and support are at `/#/app/subscription` and `/#/app/support`.

The header's **Demo staff account** selector changes the employee being demonstrated. It is not an authentication mechanism. Tenant portal pages likewise have a clearly labelled demo business selector.

- **Shoaib Rahman**: platform owner, all modules.
- **Amina Akter**: support across tenants, payment verification for Nawabpur Hardware House only. Both responsibilities work without switching roles.
- **Rahat Hasan**: support for Bismillah Fabrics only.

In Team & roles, create/duplicate/edit permission presets, assign multiple roles, choose each role's tenant scope and inspect effective access. Owner authority is protected. Additive role assignments do not widen another role's tenant scope.

## Review journeys

1. Create a tenant, inspect its profile, suspend/reactivate it and observe independent subscription status.
2. Inspect plans, schedule a next-renewal plan change, extend a trial or schedule cancellation.
3. Review seeded payment PAY-1001 beside its evidence and linked invoice. Confirm collection review and verify. Inspect the paid invoice, subscription, receipt and audit event. Exercise partial payments, unapplied credit, refunds and reversal dialogs.
4. From the tenant portal, submit proof or resubmit requested information. Staff and tenant screens share the same demonstration records.
5. Order an SMS package; its invoice must be fully settled before credits arrive. Compose a demo message using a template, simulate failed delivery and retry. No message is sent externally.
6. Request a service, quote/approve it, assign/schedule it, record a deliverable and complete it. Delivery and payment remain separate records.
7. Reply to a support ticket and add an internal note. Switch to the tenant portal to verify only public messages and attachments appear. Temporary support access requires tenant consent and is a request/consent UI only.
8. Preview announcement audiences/channels, schedule/cancel drafts, inspect reports and immutable audit events, and configure demo collection/policy labels.

## Demo persistence and data boundaries

Changes use the `hisabiq-saas-v1` browser storage key. Reset from Platform settings to restore example data. Blocked or full storage shows a warning in staff and tenant views; changes then remain in memory. Malformed saved records recover to defaults instead of crashing pages.

Example pricing, 14-day trial, grace policy and provider segment estimates are demo values. Scheduled renewals/cancellations and announcement delivery are represented in the UI; there is no background scheduler. Live support impersonation and actual financial/SMS settlement are intentionally absent from this UI repository. The recurring-service catalog presents the commercial offer; recurring billing execution belongs to the future backend integration.

Backend integration must replace the demo actor selector and local persistence, enforce permissions/tenant scope on the server, and provide real settlement, attachment storage, concurrency and delivery services. The UI's transition checks demonstrate expected behavior; they are not security enforcement.

## Verification

Final checks: 87/87 unit tests, production build, 58 SaaS rendered contrast states and 64 existing ERP rendered contrast states passed. The SaaS browser run also covers combined roles, tenant creation/reload, payment settlement, public/private support, SMS retry, service invoicing, storage failure and mobile dialog navigation. Full TypeScript checking still reports the existing generated-library errors; no diagnostics point to `src/saas`.

- `npm test`: existing ERP tests plus SaaS permission, state, billing, SMS/service, support and administrative workflow tests.
- `npm run build`: Vite production build.
- `npm run test:saas`: browser journeys, role guards, persistence, private/public support, SMS/service controls, responsive navigation and rendered contrast checks.
- `npm run test:theme`: existing ERP theme regression suite.

Browser scripts start their own Vite server. Set `PLAYWRIGHT_EXECUTABLE_PATH` when using an existing Chromium headless shell. Optional `SAAS_SCREENSHOT_DIR` controls screenshot output; the default is ignored scratch under `.superpowers/saas-preview`.

Use the shared Light/Dark/System theme, English primary labels with smaller Bangla helpers, proportional numbers and the bundled design-system primitives. The Bangla font fallback is bundled locally under its included SIL Open Font License.

Contrast checks cover normal text at AA levels in the tested rendered states; they do not constitute full WCAG certification. Existing TypeScript declaration issues in the generated design-system bundle remain outside this change; new `src/saas` files are checked separately in the full diagnostic output.
