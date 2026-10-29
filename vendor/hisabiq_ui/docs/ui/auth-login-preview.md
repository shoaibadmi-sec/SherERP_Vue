# Authentication login design implementation — 2026-10-22

## Authorized slice

Implement the owner's approved, refined login mockups in `hisabiq_ui`: normal sign-in, Quick PIN and multi-account selection. Preserve the Brand Guide composition and actual shared components. Impeccable governs visual refinement; Ponytail keeps the change local. This authorization supersedes the earlier review-only restriction for this frontend slice, not for the remaining authentication roadmap.

1. Reuse one responsive Ink/form layout, actual logo and current theme/typography.
2. Add the empty mobile/password form, password visibility, validation and language selection.
3. Add explicit sample-account/PIN review routes, safe fallback and honest preview feedback.
4. Verify browser interactions, responsive/language/theme combinations and existing repository gates; publish a feature branch for review without merging or deploying.

## Boundaries and decisions

- Existing ERP entry stays unchanged; the login preview is at `/#/login`. Quick PIN and account selection are reached through the review footer, never inferred from browser storage.
- Three language modes use existing pure copy helpers; public language preference has a dedicated key because tenant settings are unavailable before authentication.
- Shared `Input` must treat masked numeric codes as identifiers. Password inputs with numeric input mode do not receive quantity steppers. No PIN verifier, cryptographic key, attempt counter, trust cookie, enrollment or browser identity is implemented.
- One real shared masked input presents six decorative PIN slots, preserving leading zeros, paste and keyboard editing. Choosing a sample account is not authorization.
- Signup and recovery now have complete routed UI-only walkthroughs. Google remains an explanatory dialog. Field submission never authenticates, creates accounts, changes passwords or navigates to the ERP. Secrets are not stored or sent.
- No new dependencies, backend changes, Worker API, Hyperdrive, database migrations, deployment or merge. The other authentication flows and production integration remain later work.

## Acceptance coverage

`scripts/auth-login-browser.cjs` exercises empty/invalid inputs, Bangla digits, password visibility, dialog escape/focus restoration, PIN leading zeros and absence of quantity behavior, account switching, full-login fallback, secret/storage/network boundaries, blocked-storage touch input and existing ERP entry. All three states run at four viewport widths across three languages and both themes (72 combinations), with automated WCAG AA scans at representative desktop/mobile sizes. The targeted workflow is included in PR CI. Node regressions, TypeScript, ESLint, UI contract and Vite build remain repository gates.

The first browser run was observed failing because `/login` did not exist. Tests certify preview behavior only; they do not certify real authentication, SMS delivery or trusted-browser security.

Final review identified a query-only account change retaining an unsubmitted PIN. Its regression was observed failing with `000123` retained, then the whole form was keyed by effective sample identity so secrets and feedback reset together. Pathname changes already remount through `PageBoundary`. The sample-account caption was clarified because fixture rows do not prove browser enrollment.

## Observed verification

- `npm test`: 689 passed; no failures.
- `npm run test:auth-login`: passed, including all 72 combinations, accessibility scans, blocked storage, touch and unsent-secret clearing.
- `npx tsc --noEmit`, `npm run check:ui-contract`, `npm run build`: passed. The build retains existing large-chunk warnings.
- `npm run lint`: zero errors, 214 existing warnings. Changed TypeScript files also pass focused ESLint.
- `scripts/dialog-accessibility-browser.cjs`: passed against the shared dialog implementation.
- Impeccable detector: no findings in the new auth surface; rendered light/dark desktop/mobile views inspected.
- Additional existing `scripts/number-fuzzy-browser.cjs` smoke stops at its absent POS `Customer name` textbox selector (line 38). Reproduced unchanged on base commit `2e99832c73f5ccc4d9846c71b2d56492c4423e5f`; it is not a login regression. Its preceding number-entry wheel/arrow checks pass. This unrelated stale-selector test was not modified.

Browser verification used Chromium 153 through the existing `PLAYWRIGHT_EXECUTABLE_PATH` mechanism because this environment's default Playwright browser download returned an invalid archive. No production services, real credentials or live SMS were exercised. No screen-reader or non-Chromium certification is claimed.


## Extension — 24 October 2026: signup and recovery

The visual flow was expanded without changing the established auth layout, brand guide composition or existing ERP entry.

- `/#/signup` (`/#/register`) — name, Bangladeshi mobile, password/confirmation, code-entry preview, initial business name, and explicit no-account-created finish.
- `/#/recovery` (`/#/forgot-password`) — mobile identification, Gmail OTP selected by default **when linked**, SMS fallback, code-entry preview, new password/confirmation, and explicit no-password-changed finish.
- Both screens reuse AuthLayout, Input and Button; theme, public English/Bangla/bilingual language preference, focus feedback and responsive layout are shared with sign-in.
- Code-entry validation is **format-only**. Entering any six digits advances a visual preview, not an identity check. No OTP, account, business, device authorization, Google OAuth or password state is ever created or changed.
- Browser suite now checks the five routes across 4 viewport widths × 3 language modes × 2 themes (120 states) and exercises both multi-step previews. Its results must be read from the latest PR CI run; the observed login-only verification above is from the earlier design slice.
- PR #201 stays draft; main was merged into the feature branch with a clean conflict resolution that retains the ERP's shared 36px input standard and excludes password/phone OTP inputs from quantity steppers.
- A separate Cloudflare feature-preview deployment is still required. The production worker is not updated by this PR.
