const { chromium } = require('playwright');
const assert = require('node:assert/strict');

async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 4396, strictPort: true } });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, hasTouch: true });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('http://127.0.0.1:4396/#/app/daybook');
    await page.getByRole('heading', { name: 'Daybook' }).waitFor();

    const calendar = page.getByRole('button', { name: /Daybook date range/ });
    await calendar.click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'This month', exact: true }).click();
    await dialog.getByRole('button', { name: 'Apply', exact: true }).click();
    const search = page.getByRole('textbox', { name: /Search transaction/ });
    await search.fill('INV-000241');
    const sale = page.locator('main tbody tr').filter({ hasText: '2 items' }).first();
    await sale.waitFor();
    assert.equal(await page.locator('main tbody tr').count(), 3, 'date and search filters narrow the Daybook rows');
    await page.getByRole('combobox', { name: /Transaction type/ }).click();
    await page.getByRole('option', { name: 'Sale', exact: true }).click();
    assert.equal(await page.locator('main tbody tr').count(), 1, 'type filter narrows to the selected sale');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    const savedScroll = await page.evaluate(() => window.scrollY);

    await sale.getByRole('button', { name: /Actions for/ }).click();
    await page.getByRole('button', { name: 'Duplicate', exact: true }).click();
    await page.getByText(/Duplicating INV-000241/).waitFor();
    assert.match(page.url(), /mode=duplicate&invoice=INV-000241/);
    await page.goBack();
    await page.getByRole('heading', { name: 'Daybook' }).waitFor();
    assert.equal(await search.inputValue(), 'INV-000241', 'search survives returning from duplicate POS');
    assert.equal(await page.locator('main tbody tr').count(), 1, 'filtered rows survive returning from duplicate POS');
    assert.equal(await page.getByRole('combobox', { name: /Transaction type/ }).getAttribute('data-value'), 'Sale');
    assert.match(await calendar.getAttribute('aria-label'), /1 Oct.*31 Oct/, 'date range survives returning from duplicate POS');
    assert.equal(await page.evaluate(() => window.scrollY), savedScroll, 'scroll position survives returning from duplicate POS');

    await sale.getByRole('button', { name: /Actions for/ }).click();
    await page.getByRole('button', { name: 'Edit', exact: true }).click();
    await page.waitForURL(/#\/app\/audit-ledger\?editRef=INV-000241/);
    await page.goBack();
    await page.getByRole('heading', { name: 'Daybook' }).waitFor();
    assert.equal(await page.getByRole('textbox', { name: /Search transaction/ }).inputValue(), 'INV-000241');
    assert.equal(await page.locator('main tbody tr').count(), 1);
    assert.equal(await page.getByRole('combobox', { name: /Transaction type/ }).getAttribute('data-value'), 'Sale');
    assert.deepEqual(errors, []);
    console.log('Daybook search/date filters survive Duplicate-to-POS and Edit-to-Audit round trips.');
  } finally {
    await browser.close();
    await server.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
