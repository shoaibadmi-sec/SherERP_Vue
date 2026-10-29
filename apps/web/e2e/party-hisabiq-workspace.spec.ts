/*
 * HisabIQ unified Party workspace. UI navigation, not posting.
 * The existing API and accounting tests remain responsible for journal integrity.
 * @covers screen:parties
 * @covers screen:party-ledger
 */
import { expect, test } from '@playwright/test';

import { MANAGER } from './support/seed';
import { signIn } from './support/ui';

test.describe('HisabIQ unified Party workspace', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, MANAGER);
    await page.goto('/parties?role=CUSTOMER');
    await page.waitForLoadState('networkidle');
  });

  test('shows a directory and an inline customer ledger on desktop', async ({ page }) => {
    await expect(page.getByRole('region', { name: 'Party directory' })).toBeVisible();
    await expect(page.getByRole('button', { name: /E2E Customer/i }).first()).toBeVisible();
    await expect(page.getByRole('region', { name: /E2E Customer ledger/i })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Party ledger sections' })).toBeVisible();

    // Tabs present read-only filtered journal views, not new financial operations.
    await page.getByRole('navigation', { name: 'Party ledger sections' })
      .getByRole('button', { name: /Invoices/i }).click();
    await expect(page.getByRole('button', { name: /Invoices/i })).toHaveAttribute('aria-current', 'page');
    await page.getByRole('navigation', { name: 'Party ledger sections' })
      .getByRole('button', { name: /Ledger/i }).click();
  });

  test('switching role uses a real supplier ledger and never mixes customer rows', async ({ page }) => {
    await page.getByRole('navigation', { name: 'Party role' })
      .getByRole('button', { name: /Suppliers/i }).click();
    await expect(page).toHaveURL(/role=SUPPLIER/);
    await expect(page.getByRole('button', { name: /E2E Supplier/i }).first()).toBeVisible();
    await expect(page.getByRole('region', { name: 'Party directory' }))
      .not.toContainText('E2E Customer');
    await expect(page.getByRole('button', { name: /Pay supplier/i }).first()).toBeVisible();
  });

  test('customer actions open existing POS flow without posting a new entry', async ({ page }) => {
    const newSale = page.getByRole('button', { name: /New sale/i }).first();
    await expect(newSale).toBeVisible();
    await newSale.click();
    await expect(page).toHaveURL(/\/pos\?customer=/);
  });

  test('original full table remains available for advanced management', async ({ page }) => {
    await page.getByRole('button', { name: /Table view/i }).click();
    await expect(page.getByRole('table').first()).toBeVisible();
    await page.getByRole('button', { name: /Party workspace/i }).click();
    await expect(page.getByRole('region', { name: 'Party directory' })).toBeVisible();
  });
});
