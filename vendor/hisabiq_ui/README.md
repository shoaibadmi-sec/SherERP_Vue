# HisabIQ — ERP UI Preview

HisabIQ is a bilingual (English / বাংলা) POS, inventory, finance and accounting interface for Bangladesh small businesses. This repository is a **frontend/UI preview**, not a live tenant accounting backend. Sample orders, payments, inventory and ledgers do **not** certify real posting or persistence.

## Run locally

```bash
npm ci                   # Install pinned dependencies
npm run dev              # Start Vite development server
npm test                 # Unit/regression tests
npx tsc --noEmit         # Strict TypeScript checks
npm run lint             # ESLint (existing warnings may remain)
npm run check:ui-contract # Shared POS/cart/picker contract guard
npm run build            # Production frontend bundle
```

Focused browser workflows are available via `npm run test:remaining-audit`, `npm run test:sales-audit`, `npm run test:purchases` and related `test:*` scripts. These use Playwright/Chromium. Set `PLAYWRIGHT_EXECUTABLE_PATH` only if your local Chromium path requires it.

## Architecture

- `/#/login` — sign-in preview; `/#/login/pin` and `/#/login/accounts` show returning-user states. `/#/signup` (alias `/#/register`) and `/#/recovery` (alias `/#/forgot-password`) show the mobile-first registration and password-recovery walkthroughs. The Brand Guide links to the login. Existing `/app/*` entry remains unchanged.
- `/app/*` — tenant ERP screens: Dashboard, POS, Counter, Sales, Purchases, Products, Parties, Finance and related workflows.
- `/saas/*` — separate SaaS platform administration (roles, tenant subscriptions, support and billing).
- `src/components/pos`, `src/components/purchases`, `src/components/transactions` — shared product transaction UI family.
- `src/data/*PreviewStore.ts` — demo/session preview records, not production data storage.

### Login design review

The login preview reuses `LogoLockup`, `Button`, `Input`, `AppSelect`, `Dialog`, existing theme tokens and Geist/Hind Siliguri. It supports English, বাংলা and bilingual copy independently of tenant settings. Only the public language preference is saved; passwords and PINs remain in component memory and are cleared after a preview submission or when leaving the screen.

Submissions validate the fields and report that no authentication request was sent. Create account and Forgot password navigate to full UI-only walkthroughs (phone registration, verification-code entry, business name; recovery Gmail OTP default with SMS fallback and reset-password entry). Any six-digit code advances the visual preview only. No code is sent or verified, no account/business is created and no password is changed. Google still opens an explanatory dialog; no OAuth, OTP, session, enrollment or tenant authorization is simulated. The account chooser contains explicit sample accounts, not discovered users. The six-slot PIN presentation uses one masked input without arithmetic steppers. Real PIN/device-proof feasibility and ByabsIQ integration remain separate work.

Run `npm run test:auth-login` for focused Chromium coverage. To capture review screenshots, set `AUTH_SCREENSHOT_DIR` to a local output directory. No dependency or hosting changes are required.

See [login implementation scope and verification](docs/ui/auth-login-preview.md) for the preview boundaries and known unrelated test limitation.

## Rules before making changes

The [complete HisabIQ Design Guide v2.2](docs/ui/HISABIQ-DESIGN-GUIDE.md) covers tokens, every shared component family, states, tables, filters, navigation, motion, icons, Bangla, accessibility and KISS composition. Open `/#/design-system` for searchable chapters, copy/download and the live shared-component playground. Give any AI the [portable UI instruction](docs/ui/AI-UI-PROMPT.md). Run `node scripts/sync-design-guide.cjs --check` to detect drift between the authored guide, visual reference and [generated source inventory](docs/ui/design-system.json).

Read [AGENTS.md](AGENTS.md), the [transaction cart design contract](docs/ui/transaction-cart-design-contract.md), and the [context-complete workflow contract](docs/superpowers/specs/2026-10-09-erp-kiss-contextual-workflows-design.md). Preserve the original [Magic Patterns UI](https://www.magicpatterns.com/c/t6q3mxi6nhuak3qjvx8cwn), current shared inputs, Bangla text, keyboard/touch controls, and POS-style carts. Never present a sample payment or stock change as a real backend posting.

Cloudflare scripts, if configured in your environment, are `npm run cf:preview` and `npm run cf:deploy`; review the deployment configuration before deploying.


The visual library leads the guide with working Party role actions, the actual report toolbar/calendar/help, field states, shared columns, quantity/unit controls and labelled future feedback compositions. See `src/data/componentCatalog.json` for source and state coverage.

## Reports planning

The [canonical Reports documentation](docs/ui/reports/README.md) consolidates the current Visual component library, Magic Patterns Reports, preserved source details and connected purchase/demo workflows. It is documentation for review, not implemented Reports UI.
