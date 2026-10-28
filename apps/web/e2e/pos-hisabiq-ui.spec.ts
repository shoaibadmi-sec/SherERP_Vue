/*
 * HisabIQ POS Vue UX contract. These tests exercise the existing real sale
 * screen without posting a transaction or changing the seeded shop's books.
 * The accounting side remains guarded by manager-daily-flow and API suites.
 *
 * @covers screen:pos
 */
import { expect, test } from '@playwright/test';

import { MANAGER, PRODUCT_A } from './support/seed';
import { signIn } from './support/ui';

test.describe('HisabIQ cart-first POS', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, MANAGER);
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
  });

  test('keyboard selects a product and returns to search after quantity', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: /scan barcode or search products/i });
    await search.fill(PRODUCT_A.name);
    await expect(page.getByRole('button', { name: new RegExp(PRODUCT_A.name, 'i') }).first()).toBeVisible();
    await search.press('Enter');

    await expect(page.locator('.cart__line')).toHaveCount(1);
    await expect(page.locator('.cart__qty input').first()).toBeFocused();
    await page.locator('.cart__qty input').first().press('Enter');
    await expect(search).toBeFocused();

    // An existing product remains in the editable cart, not only a tile.
    await expect(page.getByRole('complementary', { name: 'Sale cart' })).toContainText(PRODUCT_A.name);
  });

  test('a repeated product tap increments the existing line without duplicating it', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: /scan barcode or search products/i });
    await search.fill(PRODUCT_A.name);
    const tile = page.getByRole('button', { name: new RegExp(PRODUCT_A.name, 'i') }).first();
    await tile.click();
    await tile.click();
    await expect(page.locator('.cart__line')).toHaveCount(1);
    await expect(page.locator('.cart__line-total').first()).toContainText('300');
  });

  test('checkout remains visually separate from editable cart on desktop', async ({ page }) => {
    await expect(page.locator('.cart__editing')).toBeVisible();
    await expect(page.locator('.cart__checkout')).toBeVisible();
    const editor = await page.locator('.cart__editing').boundingBox();
    const checkout = await page.locator('.cart__checkout').boundingBox();
    expect(editor).not.toBeNull();
    expect(checkout).not.toBeNull();
    if (editor === null || checkout === null) return;
    expect(checkout.x, 'checkout must be placed to the right of the cart on desktop')
      .toBeGreaterThan(editor.x + editor.width - 2);
  });

  test('search, quantity and sale button have accessible names and keyboard focus', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: /scan barcode or search products/i });
    await search.focus();
    await expect(search).toBeFocused();
    await expect(page.getByRole('button', { name: /complete sale/i }).first()).toBeVisible();

    const unnamed = await page.locator('[data-ui="hisabiq-pos-v2"] button')
      .evaluateAll((buttons) => buttons.filter((button) => {
        const element = button as HTMLButtonElement;
        if (element.offsetParent === null) return false;
        return !((element.getAttribute('aria-label') ?? element.getAttribute('title') ?? element.textContent ?? '').trim());
      }).length);
    expect(unnamed, 'POS added unnamed buttons').toBe(0);
  });
});
