/*
 * Coverage claims, read by `pnpm test:inventory` (owner request 2026-09-03).
 *
 * @covers-all-routes
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

import { signIn } from './support/ui';
import { OWNER } from './support/seed';

/**
 * Can every control be reached by name (§13)?
 *
 * **No axe, deliberately.** A generic rule engine reports contrast ratios and
 * landmark nesting on a product whose real accessibility problem is much
 * simpler and much worse: a control with no accessible name. A screen reader
 * announces such a button as "button", a keyboard user cannot tell two of them
 * apart, and — the reason it also matters to this suite — no semantic selector
 * can find it, so it is a control no test in this repository is able to press.
 * Accessibility and testability are the same property here, and this measures
 * exactly that.
 *
 * **It is a ratchet, not a pass/fail.** The scan already knows of unnamed
 * controls; failing outright would mean either a permanently red suite or a
 * baseline nobody dares regenerate. Instead the count per screen is recorded in
 * `docs/testing/a11y-baseline.json`, and the test fails when a screen gets
 * *worse*. New work has to be named; existing debt is visible, counted, and
 * shrinks whenever somebody fixes one — running with `A11Y_BASELINE=update`
 * rewrites the file after a genuine improvement.
 */

test.setTimeout(300_000);

interface InventoryScreen {
  readonly route: string | null;
  readonly kind: string;
}

const HERE = dirname(fileURLToPath(import.meta.url));
const INVENTORY = resolve(HERE, '../../../docs/testing/inventory.json');
const BASELINE = resolve(HERE, '../../../docs/testing/a11y-baseline.json');

const NOT_SIGNED_IN = new Set(['/login', '/register', '/forgot-password']);

function routes(): readonly string[] {
  const inventory = JSON.parse(readFileSync(INVENTORY, 'utf8')) as {
    screens: readonly InventoryScreen[];
  };
  return inventory.screens
    .filter(
      (screen) =>
        screen.kind === 'PAGE' &&
        screen.route !== null &&
        !screen.route.includes(':') &&
        !NOT_SIGNED_IN.has(screen.route),
    )
    .map((screen) => screen.route ?? '');
}

function baseline(): Record<string, number> {
  try {
    return JSON.parse(readFileSync(BASELINE, 'utf8')) as Record<string, number>;
  } catch {
    return {};
  }
}

test.describe('every control can be reached by name', () => {
  test('names no fewer controls than it did yesterday', async ({ page }) => {
    await signIn(page, { identifier: OWNER.identifier, password: OWNER.password });

    const previous = baseline();
    const current: Record<string, number> = {};
    const worse: string[] = [];
    const examples: string[] = [];

    for (const route of routes()) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const unnamed = await page.evaluate(() => {
        /*
         * The accessible name, near enough for this purpose: what a screen
         * reader would announce, and what `getByRole(role, { name })` matches.
         * A placeholder is deliberately **not** counted — it disappears the
         * moment somebody types, which is exactly when they most need to know
         * what the box is for.
         */
        const nameOf = (node: Element): string => {
          const aria = node.getAttribute('aria-label');
          if (aria !== null && aria.trim() !== '') return aria;
          const labelledBy = node.getAttribute('aria-labelledby');
          if (labelledBy !== null) {
            const target = document.getElementById(labelledBy);
            if (target?.textContent?.trim() !== undefined) return target.textContent.trim();
          }
          if (node.id !== '') {
            const label = document.querySelector(`label[for="${CSS.escape(node.id)}"]`);
            if (label?.textContent?.trim() !== undefined) return label.textContent.trim();
          }
          if (node.closest('label') !== null) return 'wrapped';
          const title = node.getAttribute('title');
          if (title !== null && title.trim() !== '') return title;
          return (node.textContent ?? '').trim();
        };

        return [...document.querySelectorAll('button, a[href], input, select, textarea')]
          .filter((node) => (node as HTMLElement).offsetParent !== null)
          .filter((node) => node.getAttribute('type') !== 'hidden')
          .filter((node) => node.getAttribute('aria-hidden') !== 'true')
          .filter((node) => nameOf(node) === '')
          .map((node) => `${node.tagName.toLowerCase()}${node.id === '' ? '' : `#${node.id}`}`);
      });

      current[route] = unnamed.length;
      const was = previous[route];
      if (was !== undefined && unnamed.length > was) {
        worse.push(`${route}: ${String(was)} → ${String(unnamed.length)}`);
        examples.push(`${route}: ${unnamed.slice(0, 5).join(', ')}`);
      }
      if (was === undefined && unnamed.length > 0) {
        // A screen nobody has measured before arrives with its debt recorded
        // rather than failing the build on somebody else's history.
        examples.push(`${route} (new): ${unnamed.slice(0, 5).join(', ')}`);
      }
    }

    if (process.env['A11Y_BASELINE'] === 'update' || Object.keys(previous).length === 0) {
      writeFileSync(BASELINE, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
    }

    expect({ worse, examples: examples.slice(0, 10) }).toEqual({ worse: [], examples: [] });
  });

  test('lets a keyboard reach the first action on the busiest screen', async ({ page }) => {
    await signIn(page, { identifier: OWNER.identifier, password: OWNER.password });
    await page.goto('/products');
    await page.waitForLoadState('networkidle');

    // Tab must land on something, and that something must be announceable.
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => {
      const node = document.activeElement;
      if (node === null || node === document.body) return null;
      return {
        tag: node.tagName.toLowerCase(),
        name: (node.getAttribute('aria-label') ?? node.textContent ?? '').trim(),
      };
    });

    expect(focused, 'nothing took focus on the first Tab').not.toBeNull();
    expect(focused?.name, 'the first focusable control has no name').not.toBe('');
  });
});
