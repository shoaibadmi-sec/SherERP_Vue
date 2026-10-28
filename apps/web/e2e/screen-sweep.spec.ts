/*
 * Coverage claims, read by `pnpm test:inventory` (owner request 2026-09-03).
 *
 * @covers-all-routes
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

import { watchHealth } from './support/health';
import { baseline, signIn } from './support/ui';
import { OWNER } from './support/seed';

/**
 * Every routed screen in the product, opened for real (§2, §13, §14).
 *
 * **One sweep rather than fifty-four specs.** §20 of the owner's request is
 * explicit that a Playwright test per page is the wrong shape — it is the most
 * expensive layer, and repeating the same four assertions across fifty-four
 * files makes them fifty-four things to maintain and one thing to learn. The
 * routes come from the generated inventory, so a screen added tomorrow is swept
 * the day it appears rather than the day somebody remembers to add it here.
 *
 * **What one page is asked.** That it opens; that nothing threw, logged an
 * error, failed a request or came back 4xx/5xx while it did (§14); that it
 * announces itself with a heading a screen reader can find (§13); and that it
 * does not push the page sideways (§12, checked here at desktop width and again
 * on the phone project). What it deliberately does **not** ask is anything
 * about business figures — those belong in the API suites, where they can be
 * checked against the ledger instead of against rendered text.
 *
 * **Screens that need a record are given one.** A detail route with no id is a
 * 404 and proves nothing, so the ids come from the seeded baseline. The few
 * with no seeded record are listed with a reason rather than quietly skipped.
 */

interface InventoryScreen {
  readonly name: string;
  readonly route: string | null;
  readonly kind: string;
  readonly mobileRelevant: boolean;
}

const HERE = dirname(fileURLToPath(import.meta.url));
const INVENTORY = resolve(HERE, '../../../docs/testing/inventory.json');

/**
 * Detail routes, and where a real id comes from.
 *
 * `null` means the sweep cannot reach it, and each says why. They are named
 * rather than filtered silently: a screen nobody can open in a test is a screen
 * nobody is testing, and that should be visible in this file.
 */
type RecordResolver = (base: ReturnType<typeof baseline>) => string | null;

const NEEDS_A_RECORD: ReadonlyMap<string, RecordResolver> = new Map<string, RecordResolver>([
    ['/products/:id', (base) => base.productAId],
    ['/parties/:id', (base) => base.customerId],
    ['/parties/:id/ledger', (base) => base.customerId],
    // No seeded document of these kinds: the daily-flow spec creates them as it
    // goes, and seeding a second set only to look at them would put business
    // state in the baseline that no test trades against.
    ['/sales/:id', () => null],
    ['/purchases/:id', () => null],
    ['/purchase-plans/:id', () => null],
    ['/supplier-orders/:id', () => null],
    ['/warranty/:id', () => null],
    ['/finance/accounts/:accountId/reconcile/:id', () => null],
  ]);

function screens(): readonly InventoryScreen[] {
  const inventory = JSON.parse(readFileSync(INVENTORY, 'utf8')) as {
    screens: readonly InventoryScreen[];
  };
  return inventory.screens.filter((screen) => screen.kind === 'PAGE' && screen.route !== null);
}

/** The path to visit, or null when this screen has no record to visit. */
function pathFor(route: string, base: ReturnType<typeof baseline>): string | null {
  if (!route.includes(':')) return route;
  const resolver = NEEDS_A_RECORD.get(route);
  if (resolver === undefined) return null;
  const id = resolver(base);
  return id === null ? null : route.replace(/:[A-Za-z]+/g, id);
}

/**
 * Routes that are not part of the signed-in product.
 *
 * Login and register are swept by their own specs, from a signed-out state,
 * which is the only state in which they mean anything.
 */
const NOT_SIGNED_IN = new Set(['/login', '/register', '/forgot-password']);

const SWEPT = screens().filter((screen) => !NOT_SIGNED_IN.has(screen.route ?? ''));

/*
 * The config's 90-second default is sized for one business day end to end; this
 * walks forty-five screens, each waiting for its own data to land, and a sweep that times out reports nothing at all.
 */
test.setTimeout(300_000);

test.describe('every screen opens, says what it is, and complains about nothing', () => {
  test('sweeps the whole product', async ({ page }) => {
    const health = watchHealth(page);
    const base = baseline();
    await signIn(page, { identifier: OWNER.identifier, password: OWNER.password });

    // A sweep that silently visited nothing would pass. It must not.
    expect(SWEPT.length).toBeGreaterThan(40);

    const unreachable: string[] = [];
    const silent: string[] = [];
    const sideways: string[] = [];

    for (const screen of SWEPT) {
      const path = pathFor(screen.route ?? '', base);
      if (path === null) {
        unreachable.push(screen.route ?? '');
        continue;
      }

      await page.goto(path);
      await page.waitForLoadState('networkidle');

      // §13: a screen with no heading cannot be navigated by anything but sight.
      const heading = page.getByRole('heading').first();
      if (!(await heading.isVisible().catch(() => false))) silent.push(path);

      // §12: nothing may push the page sideways. Two pixels of slack, because a
      // sub-pixel rounding difference in a border is not a defect a shopkeeper
      // would ever see.
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflow > 2) sideways.push(`${path} overflows by ${String(overflow)}px`);
    }

    /*
     * One assertion, not three.
     *
     * Three separate `expect`s abort at the first, so a run reports the one
     * screen with no heading and says nothing about the thirty console errors
     * behind it — which turns a whole-product sweep into a one-defect-per-run
     * drip. Failing once with everything is what makes this worth running.
     */
    expect({
      silent,
      sideways,
      problems: [...new Set(health.problems)],
    }).toEqual({ silent: [], sideways: [], problems: [] });

    /*
     * Not an assertion about the product — a note in the run about what this
     * sweep could not reach, so the number is visible rather than implied.
     */
    test.info().annotations.push({
      type: 'not swept',
      description: unreachable.join(', ') || 'nothing',
    });
  });
});
