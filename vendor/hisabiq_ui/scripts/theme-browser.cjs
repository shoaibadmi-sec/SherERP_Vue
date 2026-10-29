/* Run with npm run test:theme. Installs no browser or dependencies implicitly. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const routes = ['dashboard', 'pos', 'products', 'sales', 'purchases', 'purchases/new', 'parties', 'expenses', 'finance', 'daybook', 'accounts', 'audit-ledger', 'warranty', 'reconciliation', 'reports'];

async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 4174, strictPort: true } });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const base = 'http://127.0.0.1:4174';
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  const results = [];
  const axeSource = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
  async function go(route) { await page.goto(`${base}/#/app/${route}`); await page.waitForTimeout(250); }
  async function check(label, theme) {
    await page.waitForTimeout(180);
    assert.equal(await page.getAttribute('html', 'data-theme'), theme);
    // Catch vendor CSS overrides as well as foreground/background contrast errors.
    assert.equal(await page.evaluate(() => {
      const el = document.createElement('div'); el.style.background = 'var(--card)'; document.body.append(el);
      const actual = getComputedStyle(el).backgroundColor; el.remove(); return actual;
    }), theme === 'dark' ? 'rgb(20, 38, 59)' : 'rgb(255, 255, 255)');
    await page.addScriptTag({ content: axeSource });
    const audit = await page.evaluate(async () => {
      const result = await axe.run(document, { runOnly: ['color-contrast'] });
      return {
        failures: result.violations.flatMap(v => v.nodes.map(n => ({ target: n.target, summary: n.failureSummary }))),
        manual: result.incomplete.flatMap(v => v.nodes.map(n => ({ target: n.target, html: n.html })))
      };
    });
    results.push({ label, theme, ...audit });
    assert.deepEqual(audit.failures, [], `${theme} ${label}: ${JSON.stringify(audit.failures)}`);
    console.log(`PASS ${theme}: ${label}`);
  }
  async function selectTheme(value) {
    await page.getByRole('button', { name: /^Appearance:/ }).click();
    await page.getByRole('radio', { name: value, exact: true }).click();
  }
  try {
    await go('dashboard');
    for (const theme of ['light', 'dark']) {
      await selectTheme(theme === 'dark' ? 'Dark' : 'Light');
      assert.equal(await page.evaluate(() => localStorage.getItem('hisabiq-theme')), theme);
      await page.reload();
      for (const route of routes) { await go(route); await check(route, theme); }
      for (const [route, action] of [
        ['products', 'Add product'], ['finance', 'New transaction'], ['finance', 'New cheque'],
        ['finance', 'Finance people'], ['accounts', 'New voucher'], ['accounts', 'Opening balance']
      ]) {
        await go(route);
        await page.getByRole('button', { name: action, exact: true }).click();
        await page.locator(route==='products'?'[data-product-editor]':'[data-slot="dialog-content"]').first().waitFor();
        await check(`${route}: ${action}`, theme);
        await page.locator(route==='products'?'[data-product-editor]':'[data-slot="dialog-content"]').getByRole('button', { name: route==='products'?'Cancel':'Close', exact: true }).first().click();
      }
      await go('sales');
      await page.getByRole('button', { name: /^Actions for INV/ }).first().click();
      await check('sales: action menu', theme);
      await page.getByRole('button', { name: /^View invoice/ }).click();
      await check('sales: invoice details', theme);
      await page.locator('[data-slot="dialog-content"]').getByRole('button', { name: 'Close', exact: true }).first().click();
      await go('pos');
      for (const action of ['Calculator', 'Notifications', 'User menu']) {
        await page.getByRole('button', {
          name: action === 'User menu' ? /^User menu(?:\s|$)/ : action,
          exact: action !== 'User menu'
        }).click();
        await check(`header: ${action}`, theme);
        await page.keyboard.press('Escape');
      }
      const appearance = page.getByRole('button', { name: /^Appearance:/ });
      await appearance.focus(); await page.keyboard.press('Enter');
      await check('appearance menu', theme);
      await page.keyboard.press('Escape');
      assert.match(await page.evaluate(() => document.activeElement?.getAttribute('aria-label') || ''), /^Appearance:/);
      // Theme switching must preserve compound quantities already in the cart.
      assert.equal(await page.locator('input[value="12"]').count() > 0, true);
      await page.getByRole('button', { name: 'Exact', exact: true }).click();
      await page.getByRole('button', { name: /Preview sale/ }).hover();
      await check('POS: paid and primary hover', theme);
      await page.getByRole('button', { name: /Preview sale/ }).click();
      await check('POS: preview receipt', theme);
      await page.locator('[data-slot="dialog-content"]').getByRole('button', { name: 'Close', exact: true }).first().click();
      await go('pos');
      await page.setViewportSize({ width: 390, height: 844 });
      for (const route of ['dashboard', 'products', 'pos', 'finance']) { await go(route); await check(`mobile: ${route}`, theme); }
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    await go('dashboard');
    await selectTheme('System');
    await page.emulateMedia({ colorScheme: 'dark' }); await page.waitForTimeout(120);
    assert.equal(await page.getAttribute('html', 'data-theme'), 'dark');
    await page.emulateMedia({ colorScheme: 'light' }); await page.waitForTimeout(120);
    assert.equal(await page.getAttribute('html', 'data-theme'), 'light');
    const other = await context.newPage(); await other.goto(base);
    await other.evaluate(() => localStorage.setItem('hisabiq-theme', 'dark'));
    await page.waitForTimeout(120); assert.equal(await page.getAttribute('html', 'data-theme'), 'dark');
    await other.close();
    await page.emulateMedia({ media: 'print' });
    // Media emulation can resolve before Chromium applies the new print styles.
    await page.waitForFunction(() => window.matchMedia('print').matches &&
      getComputedStyle(document.body).backgroundColor === 'rgb(255, 255, 255)');
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).backgroundColor), 'rgb(255, 255, 255)');
    await page.emulateMedia({ media: 'screen' });
    assert.equal(await page.getAttribute('html', 'data-theme'), 'dark');
    assert.deepEqual(errors, []);
    console.log(`Passed ${results.length} rendered contrast states, theme persistence, OS changes, cross-tab sync, keyboard focus and print isolation.`);
  } finally {
    if (process.env.THEME_AUDIT_OUTPUT) fs.writeFileSync(path.resolve(process.env.THEME_AUDIT_OUTPUT), JSON.stringify({ results, errors }, null, 2));
    await browser.close(); await server.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
