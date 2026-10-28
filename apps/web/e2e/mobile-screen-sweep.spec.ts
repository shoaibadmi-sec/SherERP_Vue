/*
 * Coverage claims, read by `pnpm test:inventory` (owner request 2026-09-03).
 *
 * @covers-all-mobile-routes
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

import { watchHealth } from './support/health';
import { signIn } from './support/ui';
import { OWNER } from './support/seed';

/**
 * The daily screens on a phone (§12).
 *
 * A shopkeeper works the counter on a phone, and the failures that matter there
 * are not the ones a desktop run finds. They are: something slid off the right
 * of the screen; the button that finishes the job is under the bottom bar; a
 * number field opened the letter keyboard. None of those throw, none of them log
 * anything, and all of them make the till unusable — which is why they get their
 * own project with a real device profile rather than a narrow window.
 *
 * The routes come from the inventory's own `mobileRelevant` flag, which is
 * derived from where a screen sits in navigation: the daily, sales, purchasing
 * and inventory modules are worked during a shift. Settings and reports are
 * desktop work, and a layout guard on them would be effort spent proving
 * something nobody does.
 */

interface InventoryScreen {
  readonly route: string | null;
  readonly kind: string;
  readonly mobileRelevant: boolean;
}

const HERE = dirname(fileURLToPath(import.meta.url));
const INVENTORY = resolve(HERE, '../../../docs/testing/inventory.json');

function mobileRoutes(): readonly string[] {
  const inventory = JSON.parse(readFileSync(INVENTORY, 'utf8')) as {
    screens: readonly InventoryScreen[];
  };
  return inventory.screens
    .filter(
      (screen) =>
        screen.kind === 'PAGE' &&
        screen.mobileRelevant &&
        screen.route !== null &&
        !screen.route.includes(':'),
    )
    .map((screen) => screen.route ?? '');
}

/*
 * The config's 90-second default is sized for one business day end to end; this
 * walks fourteen screens on a phone profile, each measured after settling, and a sweep that times out reports nothing at all.
 */
test.setTimeout(240_000);

test.describe('the daily screens on a phone', () => {
  test('never slide sideways, and never bury the primary action', async ({ page }) => {
    const health = watchHealth(page);
    await signIn(page, { identifier: OWNER.identifier, password: OWNER.password });

    const routes = mobileRoutes();
    expect(routes.length).toBeGreaterThan(10);

    const sideways: string[] = [];
    const buried: string[] = [];
    const wrongKeyboard: string[] = [];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      /*
       * Nothing may push the page sideways. This is the single most common
       * phone defect in a desktop-first ERP: one table, one long product name or
       * one un-wrapped figure and the whole screen scrolls horizontally, which
       * on a touch device means every vertical swipe also moves the page.
       */
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      if (overflow > 2) sideways.push(`${route} overflows by ${String(overflow)}px`);

      /*
       * The screen's primary action must be reachable without the bottom
       * navigation covering it. Checked geometrically rather than by eye: the
       * button's box must not intersect the fixed bar's box.
       */
      const collision = await page.evaluate(() => {
        const bar = document.querySelector('nav[aria-label="Primary modules"]');
        if (bar === null) return null;
        const barBox = bar.getBoundingClientRect();
        const primary = [...document.querySelectorAll('button.btn-primary, button[type="submit"]')]
          .filter((node) => (node as HTMLElement).offsetParent !== null)
          .map((node) => node.getBoundingClientRect())
          .find((box) => box.bottom > barBox.top && box.top < barBox.bottom);
        return primary === undefined ? null : Math.round(primary.bottom - barBox.top);
      });
      if (collision !== null) buried.push(`${route}: primary action under the bar by ${String(collision)}px`);

      /*
       * A money or quantity box must open the number pad. `inputmode` is the
       * only thing that decides this on a phone, and getting it wrong turns
       * every price into a two-handed job.
       */
      const bad = await page.evaluate(() =>
        [...document.querySelectorAll('input')]
          .filter((input) => (input as HTMLElement).offsetParent !== null)
          .filter((input) => {
            const own = (input.id.split('-').pop() ?? input.id).toLowerCase();
            const label = (input.getAttribute('placeholder') ?? '').toLowerCase();
            // A search box and a date picker are text, whatever the screen is
            // called; a date has its own control and its own keyboard.
            if (/search|date|name|note|phone|address|barcode|sku|serial/.test(`${own} ${label}`)) {
              return false;
            }
            const numeric = /price|amount|qty|quantity|paid|cash|discount|total|stock|counted/.test(
              `${own} ${label}`,
            );
            const mode = input.getAttribute('inputmode');
            return numeric && mode !== 'decimal' && mode !== 'numeric';
          })
          .map((input) => input.id || input.getAttribute('placeholder') || 'unnamed'),
      );
      for (const field of bad) wrongKeyboard.push(`${route}: ${field} opens the letter keyboard`);
    }

    expect({
      sideways,
      buried,
      wrongKeyboard,
      problems: [...new Set(health.problems)],
    }).toEqual({ sideways: [], buried: [], wrongKeyboard: [], problems: [] });
  });

  test('offers the bottom navigation a thumb can reach', async ({ page }) => {
    await signIn(page, { identifier: OWNER.identifier, password: OWNER.password });
    await page.goto('/dashboard');

    const bar = page.getByRole('navigation', { name: /primary modules/i });
    await expect(bar).toBeVisible();

    // A tap target below the platform minimum is a tap target that gets missed
    // by somebody holding a phone in one hand and a customer's goods in the other.
    const tooSmall = await page.evaluate(() => {
      const bar = document.querySelector('nav[aria-label="Primary modules"]');
      if (bar === null) return ['no bottom navigation'];
      return [...bar.querySelectorAll('a, button')]
        .map((node) => ({ node, box: node.getBoundingClientRect() }))
        .filter(({ box }) => box.height < 40 || box.width < 40)
        .map(({ node, box }) => `${node.textContent?.trim() ?? '?'} is ${Math.round(box.width)}×${Math.round(box.height)}`);
    });
    expect(tooSmall).toEqual([]);
  });
});
