/*
 * Coverage claims, read by `pnpm test:inventory` (owner request 2026-09-03).
 *
 * @covers screen:dashboard
 * @covers screen:products
 * @covers screen:pos
 */
import { expect, test } from '@playwright/test';

import { signIn } from './support/ui';
import { OWNER } from './support/seed';

/**
 * What the important screens look like (§15).
 *
 * **This exists over an earlier decision against it, and answers that
 * decision's objection rather than ignoring it.** `playwright.config.ts`
 * recorded on 2026-09-03 that screenshot baselines "break on font rendering,
 * get bulk-approved after the third false alarm, and from that moment catch
 * nothing". That is true of a naive baseline over every screen, so this is not
 * one:
 *
 *  - **Six screens, not forty-five.** A baseline nobody reads is a baseline
 *    everybody approves. These are the screens a shopkeeper looks at all day.
 *  - **Animations off and the caret hidden**, so a diff is never a frame of a
 *    transition.
 *  - **Every genuinely dynamic figure masked** — the clock, the business date,
 *    anything derived from "today". What is compared is the layout, which is
 *    what a visual test can actually defend.
 *  - **A tolerance, not an exact match.** Sub-pixel antialiasing differs
 *    between machines and is not a defect; a moved button is.
 *
 * Visual tests supplement functional ones and replace none of them (§15's own
 * last line). Nothing here asserts a number — the figures are checked against
 * the ledger in the API suites, where they can be checked properly.
 */

test.setTimeout(180_000);

/** The screens worth a picture, and what on each is genuinely time-dependent. */
const SCREENS: readonly { readonly name: string; readonly route: string }[] = [
  { name: 'dashboard', route: '/dashboard' },
  { name: 'products', route: '/products' },
  { name: 'pos', route: '/pos' },
  { name: 'sales', route: '/sales' },
  { name: 'daily-cash', route: '/daily-cash' },
  { name: 'settings', route: '/settings' },
];

/**
 * Anything showing a clock or a date the run itself moves.
 *
 * Masked rather than frozen: freezing time would need the server's clock too,
 * and a suite that lies to the application about the date is a suite whose
 * business dates no longer mean anything.
 */
const DYNAMIC = [
  '[data-testid="business-date"]',
  // The global header shows today's Dhaka business date on every page.
  // Keeping this unmasked would make all six visual tests fail at midnight.
  '.bizdate-value',
  '.day-status-chip',
  '.sher-clock',
  'time',
];

test.describe('the screens a shopkeeper looks at all day', () => {
  test.beforeEach(async ({ page }) => {
    await page.addStyleTag({
      content: `*, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }`,
    });
  });

  for (const screen of SCREENS) {
    test(`${screen.name} looks the way it did`, async ({ page }) => {
      await signIn(page, { identifier: OWNER.identifier, password: OWNER.password });
      await page.goto(screen.route);
      await page.waitForLoadState('networkidle');

      await expect(page).toHaveScreenshot(`${screen.name}.png`, {
        fullPage: true,
        mask: [
          ...DYNAMIC.map((selector) => page.locator(selector)),
          // Invoice and daybook rows display the live business date as text,
          // outside the global header. Mask only exact ISO date leaves.
          page.getByText(/^\d{4}-\d{2}-\d{2}$/),
        ],
        // Antialiasing differs between machines; a moved control does not.
        maxDiffPixelRatio: 0.02,
        animations: 'disabled',
      });
    });
  }
});
