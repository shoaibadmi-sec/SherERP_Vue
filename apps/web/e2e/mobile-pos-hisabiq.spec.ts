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

  test('phone shows cart above checkout without pushing the whole document sideways', async ({ page }, testInfo) => {
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
    await page.screenshot({ path: testInfo.outputPath('hisabiq-pos-phone.png'), fullPage: true });
  });

  test('landscape tablet keeps product, quantity, price and total in one cart row', async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.getByRole('searchbox', { name: /scan barcode or search products/i }).fill(PRODUCT_A.name);
    await page.getByRole('button', { name: new RegExp(PRODUCT_A.name, 'i') }).first().tap();
    const row = page.locator('.cart__line-main').first();
    const name = await row.locator('.cart__line-name').boundingBox();
    const qty = await row.locator('.cart__qty').boundingBox();
    const price = await row.locator('.cart__price').boundingBox();
    const total = await row.locator('.cart__line-total').boundingBox();
    expect(name).not.toBeNull();
    expect(qty).not.toBeNull();
    expect(price).not.toBeNull();
    expect(total).not.toBeNull();
    if (name && qty && price && total) {
      expect(Math.abs(qty.y - name.y)).toBeLessThan(14);
      expect(Math.abs(price.y - name.y)).toBeLessThan(14);
      expect(Math.abs(total.y - name.y)).toBeLessThan(14);
    }
    expect(await widthOverflow(page)).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath('hisabiq-pos-tablet.png'), fullPage: true });
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
