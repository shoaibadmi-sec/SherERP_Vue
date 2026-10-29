const { chromium } = require('playwright');
const assert = require('node:assert/strict');

async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 4301, strictPort: true } });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] });
  try {
    for (const theme of ['light', 'dark']) for (const width of [390, 768, 1024, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 960 }, hasTouch: width < 1024, reducedMotion: 'reduce' });
      await context.addInitScript(theme => localStorage.setItem('hisabiq-theme', theme), theme);
      const page = await context.newPage();
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto('http://127.0.0.1:4301/#/app/audit-ledger');
      await page.getByRole('button', { name: 'Actions for INV-000239', exact: true }).click();
      await page.getByRole('button', { name: 'Correct', exact: true }).click();
      const editor = page.getByRole('dialog', { name: 'Correct transaction', exact: true });
      const party = editor.getByRole('combobox', { name: 'Party / Person', exact: true });
      assert.match(await party.innerText(), /Nur Enterprise/);
      assert.equal(await party.getAttribute('data-value'), 'c4');
      await party.click();
      await page.getByRole('option', { name: 'Rahman Hardware', exact: true }).click();
      assert.equal(await party.getAttribute('data-value'), 'c1');
      await party.focus(); await party.press('ArrowDown'); await party.press('ArrowDown'); await party.press('Enter');
      assert.equal(await party.getAttribute('data-value'), 'c2');
      assert.doesNotMatch(await page.locator('body').innerText(), /\[object Object\]/);
      await editor.getByRole('button', { name: 'Cancel', exact: true }).click();
      assert.deepEqual(errors, []);
      await context.close();
      console.log(`Audit party label/ID and keyboard selection passed: ${width}px ${theme}`);
    }
  } finally { await browser.close(); await server.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
