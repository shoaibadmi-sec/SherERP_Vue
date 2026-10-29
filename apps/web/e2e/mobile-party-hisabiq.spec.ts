/*
 * HisabIQ Party workflow: mobile directory → one person's ledger → directory.
 * Does not modify the shop database.
 * @covers screen:parties
 * @covers screen:party-ledger
 */
import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { MANAGER } from './support/seed';
import { signIn } from './support/ui';

async function noPageOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, 'party view must not cause document-level horizontal scroll').toBeLessThanOrEqual(1);
}

async function phoneScreenshot(page: Page, testInfo: TestInfo, label: string): Promise<void> {
  await page.screenshot({ path: testInfo.outputPath(`${label}.png`), fullPage: true, animations: 'disabled' });
  const preview = await page.screenshot({ type: 'jpeg', quality: 38, scale: 'css', animations: 'disabled' });
  const encoded = preview.toString('base64');
  console.log(`PARTY_PREVIEW_BEGIN ${label}`);
  for (let i = 0; i < encoded.length; i += 4000)
    console.log(`PARTY_PREVIEW_CHUNK ${label} ${encoded.slice(i, i + 4000)}`);
  console.log(`PARTY_PREVIEW_END ${label}`);
}

test('Party directory remains simple and navigable on a phone', async ({ page }, testInfo: TestInfo) => {
  await signIn(page, MANAGER);
  await page.goto('/parties?role=CUSTOMER');
  await page.waitForLoadState('networkidle');

  const directory = page.getByRole('region', { name: 'Party directory' });
  await expect(directory).toBeVisible();
  await noPageOverflow(page);
  await phoneScreenshot(page, testInfo, 'mobile-customer-directory');

  await directory.getByRole('button', { name: /E2E Customer/i }).first().tap();
  const back = page.getByRole('button', { name: /All people/i });
  await expect(back).toBeVisible();
  await expect(directory).toBeHidden();
  await expect(page.getByRole('navigation', { name: 'Party ledger sections' })).toBeVisible();
  await noPageOverflow(page);
  await phoneScreenshot(page, testInfo, 'mobile-customer-ledger');

  await back.tap();
  await expect(directory).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Party ledger sections' })).toBeHidden();
});
