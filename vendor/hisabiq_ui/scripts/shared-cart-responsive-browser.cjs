/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Node Playwright CLI. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const viewports = [
  [320, 740, 'phone 320'],
  [390, 844, 'phone 390'],
  [600, 960, 'small tablet portrait'],
  [768, 1024, 'tablet portrait'],
  [1024, 768, 'tablet landscape'],
  [1180, 820, 'wide tablet landscape'],
  [1366, 768, 'small laptop'],
  [1600, 900, 'desktop'],
];
async function inspectCart(page, kind, name) {
  const info = await page.locator('[data-cart-kind="' + kind + '"]').evaluate((root) => {
    const rect = (node) => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    };
    const row = root.querySelector('[data-cart-row]');
    const header = root.querySelector('[data-cart-header]');
    return {
      root: rect(root),
      header: getComputedStyle(header).display !== 'none',
      scrollWidth: root.scrollWidth,
      width: root.clientWidth,
      documentWidth: document.documentElement.scrollWidth,
      row: rect(row),
      columns: [...row.children].map((el) => ({
        box: rect(el),
        display: getComputedStyle(el).display,
        gridRow: getComputedStyle(el).gridRowStart,
      })),
      add: rect(root.querySelector('[data-cart-add]')),
    };
  });
  const threshold = kind === 'purchase' ? 840 : 780;
  assert.equal(info.header, info.width >= threshold, name + ' should switch table at inner container width ' + info.width + 'px');
  assert.ok(info.scrollWidth <= info.width + 2, name + ': cart must not scroll sideways');
  assert.ok(info.row.width <= info.root.width + 1, name + ': row stays inside cart');
  for (const part of info.columns) {
    if (part.display === 'none' || part.display === 'contents') continue;
    assert.ok(part.box.x >= info.root.x - 2 && part.box.right <= info.root.right + 2,
      name + ': row controls must not overflow the cart');
  }
  if (!info.header) {
    assert.equal(info.columns[1].gridRow, '1', name + ': product at top of compact row');
    assert.equal(info.columns[kind === 'purchase' ? 6 : 5].gridRow, '1', name + ': total at top of compact row');
    assert.ok(info.row.height < 210, name + ': compact row is not an oversized mobile card (height ' + info.row.height + 'px, columns ' + JSON.stringify(info.columns.map(c => ({height:c.box.height, gridRow:c.gridRow}))) + ')');
  }
  return info;
}

async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 4331, strictPort: true } });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] });
  try {
    for (const theme of ['light', 'dark']) {
      for (const [width, height, label] of viewports) {
        const context = await browser.newContext({ viewport: { width, height }, hasTouch: width <= 1024, reducedMotion: 'reduce' });
        await context.addInitScript((t) => localStorage.setItem('hisabiq-theme', t), theme);
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        const root = 'http://127.0.0.1:4331/#/app/';

        await page.goto(root + 'purchases/new');
        await page.getByRole('button', { name: /^Quick add LED Bulb 12W(?:\s|$)/ }).click();
        const purchase = await inspectCart(page, 'purchase', label + ' Purchase ' + theme);
        const layout = await page.evaluate(() => {
          const cart = document.querySelector('[data-cart-kind="purchase"]').getBoundingClientRect();
          const pay = document.querySelector('[data-purchase-checkout]').getBoundingClientRect();
          const screen = document.querySelector('.purchase-workspace').getBoundingClientRect();
          return { beside: pay.left >= cart.right - 2, stacked: pay.top > cart.bottom, screenWidth: screen.width };
        });
        assert.equal(layout.beside, layout.screenWidth >= 1220,
          label + ': Purchase customer/payment side-by-side only when workspace fits');
        if (!layout.beside) assert.ok(layout.stacked, label + ': Purchase checkout stays below cart');
        const qty = page.getByRole('textbox', { name: 'Box quantity for LED Bulb 12W', exact: true });
        await qty.fill('2.50');
        await qty.press('ArrowUp');
        assert.equal(await qty.inputValue(), '3.50', label + ': Purchase stepper still works');
        await page.getByRole('button', { name: 'Decrease Box quantity for LED Bulb 12W', exact: true }).click();
        assert.equal(await qty.inputValue(), '2.50', label + ': Purchase decrement still works');
        if (process.env.CART_SCREENSHOTS && theme === 'light') {
          const screenshotName = label.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
          await page.screenshot({ path: process.env.CART_SCREENSHOTS + '/purchase-' + screenshotName + '.png', fullPage: true });
        }

        for (const mode of ['quotation', 'online']) {
          await page.goto(root + (mode === 'quotation' ? 'quotations' : 'online-sales'));
          if (mode === 'quotation') await page.getByRole('button', { name: 'New quotation', exact: true }).click();
          else await page.getByRole('button', { name: 'New online order', exact: true }).click();
          const search = page.getByRole('combobox', { name: mode === 'quotation' ? 'Add product to quotation' : 'Add online order product', exact: true });
          await search.fill('LED Bulb');
          await page.getByRole('option', { name: /LED Bulb 12W/ }).first().click();
          const info = await inspectCart(page, 'shared', label + ' ' + mode + ' ' + theme);
          const cart = page.locator('[data-cart-kind="shared"]');
          const q = cart.getByRole('textbox', { name: mode === 'quotation' ? 'Quantity row 1' : 'Order Quantity row 1', exact: true });
          await q.fill('2');
          await q.press('ArrowUp');
          assert.equal(await q.inputValue(), '3', mode + ' quantity should still step');
          assert.ok(info.root.width <= width + 2, label + ': editor stays within viewport');
          if (process.env.CART_SCREENSHOTS && theme === 'light') {
            const screenshotName = label.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
            await cart.screenshot({ path: process.env.CART_SCREENSHOTS + '/' + mode + '-' + screenshotName + '.png' });
          }
        }
        assert.deepEqual(errors, [], label + ': no browser exceptions in Purchase, Quotation, Online Sales');
        console.log(label + ' ' + width + 'x' + height + ' ' + theme + ' - Purchase ' +
          (purchase.header ? 'table' : 'compact') + ', Quote/Online shared cart passed');
        await context.close();
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
}
main().catch((err) => { console.error(err); process.exitCode = 1; });
