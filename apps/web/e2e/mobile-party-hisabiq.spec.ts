/*
 * HisabIQ Party workflow: mobile directory → one person's ledger → directory.
 * Creates its own isolated customer and opening through the real E2E API.
 * @covers screen:parties
 * @covers screen:party-ledger
 */
import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { MANAGER } from './support/seed';
import { call } from './support/api';
import { baseline, signIn, today } from './support/ui';

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
  process.stdout.write(`PARTY_PREVIEW_BEGIN ${label}\n`);
  for (let i = 0; i < encoded.length; i += 4000)
    process.stdout.write(`PARTY_PREVIEW_CHUNK ${label} ${encoded.slice(i, i + 4000)}\n`);
  process.stdout.write(`PARTY_PREVIEW_END ${label}\n`);
}

test('Party directory remains simple and navigable on a phone', async ({ page }, testInfo: TestInfo) => {
  const token = baseline().ownerToken;
  // Desktop design-review specs already post an opening to E2E Customer.
  // The full suite shares one database, so this mobile case must own its
  // own customer instead of trying to post a second opening to that party.
  const mobileCustomer = await call<{ id: string }>('/api/v1/parties', {
    method: 'POST', token, idempotent: true,
    body: {
      name: 'E2E Mobile Customer',
      roles: ['CUSTOMER'],
      phone: '01709090909',
      address: null, guardianName: null, nid: null, email: null,
      notes: null, customerGroupId: null, creditLimitMinor: null,
    },
  });
  await call(`/api/v1/parties/${mobileCustomer.id}/opening`, {
    method: 'POST', token, idempotent: true,
    body: { role: 'CUSTOMER', direction: 'RECEIVABLE', amountMinor: 987_654_321, businessDate: today() },
  });
  await signIn(page, MANAGER);
  await page.goto('/parties?role=CUSTOMER');
  await page.waitForLoadState('networkidle');

  const directory = page.getByRole('region', { name: 'Party directory' });
  await expect(directory).toBeVisible();
  await noPageOverflow(page);
  await phoneScreenshot(page, testInfo, 'mobile-customer-directory');

  await directory.getByRole('button', { name: /E2E Mobile Customer/i }).first().tap();
  const back = page.getByRole('button', { name: /All people/i });
  await expect(back).toBeVisible();
  await expect(directory).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Customers', exact: true })).toBeHidden();
  await expect(page.getByRole('navigation', { name: 'Party role' })).toBeHidden();
  await expect(page.getByRole('navigation', { name: 'Party ledger sections' })).toBeVisible();
  await noPageOverflow(page);
  await phoneScreenshot(page, testInfo, 'mobile-customer-ledger');
  const journal = page.getByRole('list', { name: 'Party transactions' });
  await expect(journal).toBeVisible();
  await expect(journal.locator('.party-mobile-entry')).toHaveCount(1);
  await expect(page.locator('.embedded-ledger .table-wrap')).toBeHidden();
  await expect(journal).toContainText('9,876,543.21');
  await journal.locator('.party-mobile-entry').scrollIntoViewIfNeeded();
  await phoneScreenshot(page, testInfo, 'mobile-customer-transaction');

  await back.tap();
  await expect(directory).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Party ledger sections' })).toBeHidden();
});
