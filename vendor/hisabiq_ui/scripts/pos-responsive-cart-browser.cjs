/* POS must behave like the existing desktop cart when the workspace can fit it. */
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- This is a Node Playwright script. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const sizes = [
  [320, 760, 'small phone'],
  [390, 844, 'phone'],
  [600, 960, 'small tablet portrait'],
  [768, 1024, 'tablet portrait'],
  [1024, 768, 'tablet landscape'],
  [1180, 820, 'large tablet landscape'],
  [1280, 800, 'small laptop'],
  [1366, 768, 'laptop'],
  [1440, 900, 'desktop'],
  [1600, 900, 'wide desktop'],
  [1920, 1080, 'wide monitor'],
];
async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 4327, strictPort: true } });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] });
  try {
    for (const theme of ['light', 'dark']) {
      for (const [width, height, name] of sizes) {
        const context = await browser.newContext({ viewport: { width, height }, hasTouch: width <= 1024, reducedMotion: 'reduce' });
        await context.addInitScript((t) => localStorage.setItem('hisabiq-theme', t), theme);
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto('http://127.0.0.1:4327/#/app/pos');
        await page.locator('[data-cart-kind="sale"] [data-cart-row]').first().waitFor();
        const before = await page.evaluate(() => {
          const rect = (element) => {
            const r = element.getBoundingClientRect();
            return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
          };
          const root = document.querySelector('.pos-screen');
          const cart = document.querySelector('[data-cart-kind="sale"]');
          const header = cart.querySelector('[data-cart-header]');
          const checkout = document.querySelector('[data-pos-checkout]');
          const add = cart.querySelector('[data-cart-add]');
          const rows = [...cart.querySelectorAll('[data-cart-row]')];
          return {
            root: rect(root), cart: rect(cart), checkout: rect(checkout), add: rect(add),
            headerVisible: getComputedStyle(header).display !== 'none',
            rows: rows.slice(0, 3).map((row) => ({
              frame: rect(row),
              controls: [...row.children].map((el) => ({
                frame: rect(el),
                display: getComputedStyle(el).display,
                row: getComputedStyle(el).gridRowStart,
              })),
            })),
            scrollWidth: cart.scrollWidth, clientWidth: cart.clientWidth,
            documentWidth: document.documentElement.scrollWidth,
          };
        });

        const desktopCart = before.cart.width >= 760;
        const sideBySide = before.root.width >= 1056;
        assert.equal(before.headerVisible, desktopCart, name + ' (' + theme + '): desktop header must follow available cart width');
        assert.ok(before.scrollWidth <= before.clientWidth + 2, name + ': cart must not scroll sideways');
        assert.ok(before.documentWidth <= width + 2, name + ': screen must not overflow horizontally');
        for (const row of before.rows) {
          assert.ok(row.frame.width <= before.cart.width + 1, name + ': row must fit its cart');
          for (const control of row.controls) {
            if (control.display === 'none' || control.display === 'contents') continue;
            assert.ok(control.frame.left >= before.cart.left - 1 && control.frame.right <= before.cart.right + 1,
              name + ': cart control must stay within the cart frame');
          }
          if (!desktopCart) {
            assert.equal(row.controls[1].row, '1', name + ': product first row');
            assert.equal(row.controls[5].row, '1', name + ': total beside product');
            assert.equal(row.controls[2].row, '2', name + ': quantity below product');
            assert.ok(row.frame.height < 230, name + ': compact row must not turn into a large card');
          }
        }
        if (sideBySide) {
          assert.ok(before.checkout.left >= before.cart.right - 2, name + ': checkout sits beside the cart');
          assert.ok(Math.abs(before.checkout.top - before.cart.top) <= 3, name + ': checkout aligns with cart top');
        } else {
          assert.ok(before.checkout.top > before.cart.bottom, name + ': checkout follows the cart on small workspaces');
        }

        // Focus and change a genuine compound quantity, not a static mock.
        const quantity = page.locator('[data-cart-kind="sale"] [data-testid="compound-quantity"] input').first();
        if (await quantity.count()) {
          const original = await quantity.inputValue();
          await quantity.focus();
          const frame = await quantity.boundingBox();
          const cartFrame = await page.locator('[data-cart-kind="sale"]').boundingBox();
          assert.ok(frame.x >= cartFrame.x - 1 && frame.x + frame.width <= cartFrame.x + cartFrame.width + 1,
            name + ': focused compound quantity remains within the cart');
          await quantity.press('ArrowUp');
          assert.notEqual(await quantity.inputValue(), original, name + ': stepping remains functional');
        }
        // Sidebar collapse changes available space without changing viewport orientation.
        if (width === 1180 && theme === 'light') {
          await page.getByRole('button', { name: 'Collapse sidebar' }).first().click();
          await page.waitForFunction(() => document.querySelector('.pos-screen').getBoundingClientRect().width >= 1056);
          const expandedRoom = await page.evaluate(() => {
            const cart = document.querySelector('[data-cart-kind="sale"]').getBoundingClientRect();
            const payment = document.querySelector('[data-pos-checkout]').getBoundingClientRect();
            return { beside: payment.left >= cart.right - 2 };
          });
          assert.ok(expandedRoom.beside, 'Collapsing sidebar should allow side-by-side checkout in landscape');
          await page.getByRole('button', { name: 'Expand sidebar' }).first().click();
          await page.waitForFunction(() => document.querySelector('.pos-screen').getBoundingClientRect().width < 1056);
          const smallRoom = await page.evaluate(() => {
            const cart = document.querySelector('[data-cart-kind="sale"]').getBoundingClientRect();
            const payment = document.querySelector('[data-pos-checkout]').getBoundingClientRect();
            return { stacked: payment.top > cart.bottom };
          });
          assert.ok(smallRoom.stacked, 'Expanded sidebar should restore stacked checkout when space is tight');
        }
        assert.deepEqual(errors, [], name + ': no browser exceptions');
        if (process.env.POS_RESPONSIVE_SCREENSHOTS && theme === 'light') {
          const filename = name.replace(/[^a-z0-9]+/g, '-');
          await page.screenshot({ path: process.env.POS_RESPONSIVE_SCREENSHOTS + '/pos-' + filename + '.png', fullPage: true });
        }
        await context.close();
        console.log(name + ' ' + width + 'x' + height + ' ' + theme + ': ' +
          (desktopCart ? 'desktop table' : 'compact inline rows') + ', ' + (sideBySide ? 'side-by-side' : 'stacked checkout'));
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
