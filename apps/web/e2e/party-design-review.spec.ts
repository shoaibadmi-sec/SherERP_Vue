/*
 * Party design accuracy: screenshots plus structural checks at desktop/tablet.
 * All images contain only seeded E2E shop/party data, never a live tenant.
 * @covers screen:parties
 * @covers screen:party-ledger
 */
import { expect, test, type Page, type TestInfo } from '@playwright/test';

import { MANAGER, tokenFor } from './support/seed';
import { call } from './support/api';
import { baseline, signIn, today } from './support/ui';

async function capture(page: Page, testInfo: TestInfo, name: string): Promise<void> {
  await page.screenshot({
    path: testInfo.outputPath(`${name}.png`),
    fullPage: true,
    animations: 'disabled',
  });
  // A compact preview in CI logs enables remote review without untrusted
  // artifact download URLs. Full-resolution PNGs remain in the Actions artifact.
  const preview = await page.screenshot({
    type: 'jpeg',
    quality: 38,
    scale: 'css',
    animations: 'disabled',
  });
  const encoded = preview.toString('base64');
  process.stdout.write(`PARTY_PREVIEW_BEGIN ${name}\n`);
  for (let i = 0; i < encoded.length; i += 4000) {
    process.stdout.write(`PARTY_PREVIEW_CHUNK ${name} ${encoded.slice(i, i + 4000)}\n`);
  }
  process.stdout.write(`PARTY_PREVIEW_END ${name}\n`);
}

async function noHorizontalPageOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow, 'page-level horizontal overflow').toBeLessThanOrEqual(1);
}

test('desktop Party workspace retains two aligned panels and legible ledger', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // A journal-backed amount large enough to expose truncated money columns.
  // Only the isolated E2E tenant is modified; no fake UI figures.
  const seeded = baseline();
  const token = await tokenFor(MANAGER);
  await call(`/api/v1/parties/${seeded.customerId}/opening`, {
    method: 'POST', token, idempotent: true,
    body: { role: 'CUSTOMER', direction: 'RECEIVABLE', amountMinor: 123_456_789, businessDate: today() },
  });
  const posted = await call<{ balance: { netMinor: number } }>(
    `/api/v1/parties/${seeded.customerId}`, { token },
  );
  expect(posted.balance.netMinor).toBe(123_456_789);
  await signIn(page, MANAGER);
  await page.goto('/parties?role=CUSTOMER');
  await expect(page.getByRole('region', { name: /E2E Customer ledger/i })).toBeVisible();
  await expect(page.getByRole('region', { name: /E2E Customer ledger/i })
    .getByRole('row', { name: /Opening balance/i })).toBeVisible();
  await noHorizontalPageOverflow(page);

  const layout = await page.evaluate(() => {
    const directory = document.querySelector('.party-directory')?.getBoundingClientRect();
    const detail = document.querySelector('.party-detail')?.getBoundingClientRect();
    const heading = document.querySelector('.embedded-ledger .ledger-head h2');
    if (!directory || !detail || !heading) return null;
    return {
      directory: { x: directory.x, width: directory.width, right: directory.right },
      detail: { x: detail.x, width: detail.width },
      headingFont: Number.parseFloat(getComputedStyle(heading).fontSize),
      docOverflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
  expect(layout, 'directory, detail and embedded heading must render').not.toBeNull();
  expect(layout!.directory.width).toBeGreaterThanOrEqual(278);
  expect(layout!.directory.right).toBeLessThan(layout!.detail.x);
  expect(layout!.detail.width).toBeGreaterThan(450);
  expect(layout!.headingFont).toBeGreaterThanOrEqual(16);
  process.stdout.write(`PARTY_DESIGN_METRICS desktop ${JSON.stringify(layout)}\n`);
  await capture(page, testInfo, 'desktop-customer-ledger');

  await page.getByRole('navigation', { name: 'Party role' })
    .getByRole('button', { name: /Suppliers/i }).click();
  await expect(page.getByRole('button', { name: /E2E Supplier/i }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /Pay supplier/i }).first()).toBeVisible();
  await noHorizontalPageOverflow(page);
  await capture(page, testInfo, 'desktop-supplier-ledger');
});

test('tablet Party directory and detail fit without clipped actions', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 820, height: 1080 });
  await signIn(page, MANAGER);
  await page.goto('/parties?role=CUSTOMER');

  const directory = page.getByRole('region', { name: 'Party directory' });
  await expect(directory).toBeVisible();
  await expect(page.getByRole('region', { name: /E2E Customer ledger/i })).toBeHidden();
  await noHorizontalPageOverflow(page);
  await capture(page, testInfo, 'tablet-customer-directory');

  await directory.getByRole('button', { name: /E2E Customer/i }).first().click();
  await expect(directory).toBeHidden();
  await expect(page.getByRole('heading', { name: 'Customers', exact: true })).toBeHidden();
  await expect(page.getByRole('navigation', { name: 'Party role' })).toBeHidden();
  await expect(page.getByRole('navigation', { name: 'Party ledger sections' })).toBeVisible();
  await noHorizontalPageOverflow(page);

  const backSize = await page.getByRole('button', { name: /All people/i }).evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  });
  expect(backSize.height, 'tablet back action should be a touch target').toBeGreaterThanOrEqual(40);
  process.stdout.write(`PARTY_DESIGN_METRICS tablet ${JSON.stringify({ backSize })}\n`);
  await capture(page, testInfo, 'tablet-customer-ledger');
});
