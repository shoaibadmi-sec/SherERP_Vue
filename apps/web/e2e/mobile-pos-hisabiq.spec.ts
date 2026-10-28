/*
 * The HisabIQ POS stays usable on narrow touch devices and landscape tablets.
 * Playwright's mobile project uses a touch-capable Pixel profile.
 *
 * @covers screen:pos
 */
import { expect, test, type Page } from '@playwright/test';

import { MANAGER, PRODUCT_A } from './support/seed';
import { signIn } from './support/ui';

async function widthOverflow(page: Page): Promise<number> {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

test.describe('HisabIQ POS mobile and tablet layout', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, MANAGER);
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
  });

  test('phone shows cart above checkout without pushing the whole document sideways', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: /scan barcode or search products/i });
    await search.fill(PRODUCT_A.name);
    await page.getByRole('button', { name: new RegExp(PRODUCT_A.name, 'i') }).first().tap();

    await expect(page.locator('.cart__editing')).toBeVisible();
    await expect(page.locator('.cart__checkout')).toBeVisible();

    const editor = await page.locator('.cart__editing').boundingBox();
    const checkout = await page.locator('.cart__checkout').boundingBox();
    expect(editor).not.toBeNull();
    expect(checkout).not.toBeNull();
    if (editor === null || checkout === null) return;
    expect(checkout.y, 'checkout must follow the editable cart on a phone')
      .toBeGreaterThanOrEqual(editor.y + editor.height - 2);
    expect(await widthOverflow(page), 'POS introduces document-level sideways scrolling')
      .toBeLessThanOrEqual(1);

    const sell = page.getByRole('button', { name: /complete sale/i }).first();
    await sell.scrollIntoViewIfNeeded();
    await expect(sell).toBeVisible();
  });

  test('long cart remains scrollable inside its panel while the money stays reachable', async ({ page }) => {
    const search = page.getByRole('searchbox', { name: /scan barcode or search products/i });
    await search.fill(PRODUCT_A.name);
    await page.getByRole('button', { name: new RegExp(PRODUCT_A.name, 'i') }).first().tap();
    expect(await page.locator('.cart__lines').evaluate((element) => {
      const css = getComputedStyle(element);
      return ['auto', 'scroll'].includes(css.overflowX);
    })).toBe(true);
    await expect(page.getByText(/Grand Total/i).first()).toBeVisible();
  });
});
