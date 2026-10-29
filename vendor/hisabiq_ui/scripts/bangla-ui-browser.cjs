/* Three-mode language regression in phone + desktop viewports; no business data writes. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 4386, strictPort: true } });
  await server.listen();
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox']
  });
  try {
    for (const language of ['English', 'English + Bangla', 'Bangla']) {
      for (const width of [390, 1440]) {
        const context = await browser.newContext({
          viewport: { width, height: width === 390 ? 844 : 900 },
          reducedMotion: 'reduce',
          hasTouch: width === 390
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.addInitScript(lang => {
          localStorage.setItem('hisabiq-erp-personal-v1', JSON.stringify({
            mode: 'Simple', language: lang, density: 'Compact',
            terminology: 'simple', dateView: 'transaction'
          }));
        }, language);
        await page.goto('http://127.0.0.1:4386/#/app/pos');
        const checkout = page.locator('[data-pos-checkout]');
        await checkout.waitFor();
        const cart = page.locator('[data-cart-header]');
        await cart.waitFor({ state: 'attached' });
        const isBangla = language === 'Bangla';
        assert.match(await checkout.innerText(), isBangla ? /মোট দিতে হবে/ : /Total payable/, language);
        assert.match((await cart.textContent()) || '', isBangla ? /পরিমাণ/ : /Quantity/, language);
        const walkIn = checkout.getByText(isBangla ? 'সাধারণ ক্রেতা' : 'Walk-in customer', { exact: true });
        assert.equal(await walkIn.count(), 1, language + ': customer choice');
        const nameField = checkout.getByPlaceholder(isBangla ? 'ক্রেতার নাম' : 'Customer name');
        assert.equal(await nameField.count(), 1, language + ': invoice customer input');
        await page.goto('http://127.0.0.1:4386/#/app/sales');
        const name = isBangla ? 'বিক্রয়' : 'Sales';
        await page.getByRole('heading', { name, exact: true }).waitFor();
        if (language === 'English + Bangla') {
          assert.equal(await page.getByText('বিক্রয়', { exact: true }).count() > 0, true,
            'bilingual heading keeps Bangla helper');
        }
        await page.goto('http://127.0.0.1:4386/#/app/counter');
        await page.getByRole('group', { name: 'Counter actions' })
          .getByRole('button', { name: isBangla ? /ক্রেতার টাকা নিন/ : /Customer Receive/ }).waitFor();
        assert.deepEqual(errors, [], language + ' ' + width + 'px page errors');
        await context.close();
        console.log('Bangla UX ' + language + ' @ ' + width + 'px passed');
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
