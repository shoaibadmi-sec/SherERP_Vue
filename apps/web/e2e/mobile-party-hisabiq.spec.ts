/*
 * HisabIQ Party workflow: mobile directory → one person's ledger → directory.
 * Does not modify the shop database.
 * @covers screen:parties
 * @covers screen:party-ledger
 */
import { expect, test, type Page } from '@playwright/test';

import { MANAGER } from './support/seed';
import { signIn } from './support/ui';

async function noPageOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, 'party view must not cause document-level horizontal scroll').toBeLessThanOrEqual(1);
}

test('Party directory remains simple and navigable on a phone', async ({ page }) => {
  await signIn(page, MANAGER);
  await page.goto('/parties?role=CUSTOMER');
  await page.waitForLoadState('networkidle');

  const directory = page.getByRole('region', { name: 'Party directory' });
  await expect(directory).toBeVisible();
  await noPageOverflow(page);

  await directory.getByRole('button', { name: /E2E Customer/i }).first().tap();
  const back = page.getByRole('button', { name: /All people/i });
  await expect(back).toBeVisible();
  await expect(directory).toBeHidden();
  await expect(page.getByRole('navigation', { name: 'Party ledger sections' })).toBeVisible();
  await noPageOverflow(page);

  await back.tap();
  await expect(directory).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Party ledger sections' })).toBeHidden();
});
