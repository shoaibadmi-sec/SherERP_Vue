/* Visual/behavioral contract for active ERP tabs. Existing financial handlers stay authoritative. */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 4362, strictPort: true } });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] });
  const pages = ['products', 'sales', 'purchases', 'finance', 'accounts', 'reconciliation', 'expenses', 'warranty', 'online-sales'];
  const errors = [];
  try {
    for (const reducedMotion of ['no-preference', 'reduce']) {
      for (const width of [390, 1440]) {
        const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion });
        page.on('pageerror', error => errors.push(error.message));
        for (const name of pages) {
          await page.goto('http://127.0.0.1:4362/#/app/' + name);
          const strip = page.getByRole('tablist').first();
          await strip.waitFor({ state: 'visible' });
          const tabs = strip.getByRole('tab');
          assert.ok(await tabs.count() >= 2, name + ' must expose real tabs');
          const selected = strip.locator('[role="tab"][aria-selected="true"]');
          assert.equal(await selected.count(), 1, name + ' must select precisely one tab');
          assert.equal(await selected.locator('[data-motion-tab-indicator]').count(), 1, name + ' must show one moving underline');
          const unselected = strip.locator('[role="tab"][aria-selected="false"]');
          assert.equal(await unselected.locator('[data-motion-tab-indicator]').count(), 0, name + ' must not have a duplicate underline');
          await tabs.nth(1).click();
          await page.waitForTimeout(reducedMotion === 'reduce' ? 0 : 260);
          assert.equal(await strip.locator('[data-motion-tab-indicator]').count(), 1, name + ' must retain underline after switching');
          const active = strip.locator('[role="tab"][aria-selected="true"]');
          assert.equal(await active.count(), 1, name + ' must update active tab immediately');
          const activeBox = await active.boundingBox();
          const lineBox = await active.locator('[data-motion-tab-indicator]').boundingBox();
          assert.ok(activeBox && lineBox && Math.abs(lineBox.height - 2) < 0.6, name + ' underline remains 2px high');
          assert.ok(lineBox.x >= activeBox.x - 2 && lineBox.x + lineBox.width <= activeBox.x + activeBox.width + 2, name + ' underline stays inside active tab');
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2), name + ' must not overflow at ' + width);
          if (name === 'products') {
            await tabs.last().click();
            const nested = page.getByRole('tablist').last();
            await nested.waitFor({ state: 'visible' });
            assert.ok(await nested.getByRole('tab').count() >= 2, 'Product Settings contains nested tabs');
            assert.equal(await nested.locator('[data-motion-tab-indicator]').count(), 1, 'Nested Product Settings also uses the moving underline');
          }
        }
        await page.close();
      }
    }
    assert.deepEqual(errors, []);
    console.log('Moving underline verified across ' + pages.length + ' module tabs on 390/1440px and normal/reduced motion');
  } finally {
    await browser.close();
    await server.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
