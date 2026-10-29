/* Phase 7: shared cash-drawer dialog, including real count/variance guards in the UI preview. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 4392, strictPort: true } });
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
          reducedMotion: 'reduce', hasTouch: width === 390
        });
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.addInitScript(lang => localStorage.setItem('hisabiq-erp-personal-v1', JSON.stringify({
          mode: 'Simple', language: lang, density: 'Compact',
          terminology: 'simple', dateView: 'transaction'
        })), language);

        const bangla = language === 'Bangla';
        await page.goto('http://127.0.0.1:4392/#/app/finance');
        await page.getByRole('tab', { name: bangla ? 'ক্যাশ সেশন' : 'Cash Sessions', exact: true }).click();
        await page.getByRole('button', {
          name: bangla ? 'ক্যাশ গুনুন / সেশন বন্ধ করুন' : 'Count / close cash session', exact: true
        }).click();

        const dialog = page.getByRole('dialog').last();
        await dialog.getByRole('heading', { name: bangla ? 'ক্যাশ মিলানো' : /Cash reconciliation/ }).waitFor();
        if (language === 'English') {
          assert.equal(await dialog.getByText('ক্যাশ মিলানো', { exact: true }).count(), 0,
            'English mode must not display a Bangla heading helper');
        }
        if (language === 'English + Bangla') {
          assert.ok(await dialog.getByText('ক্যাশ মিলানো', { exact: true }).count() > 0,
            'Mixed mode retains the Bangla helper');
        }
        const count = dialog.getByRole('textbox', { name: bangla ? 'হাতে গোনা টাকা' : 'Cash counted' });
        const close = dialog.getByRole('button', { name: bangla ? 'সেশন বন্ধ করুন' : 'Close session' });
        const save = dialog.getByRole('button', { name: bangla ? 'গণনা সংরক্ষণ করুন' : 'Save count' });
        assert.ok(await save.isDisabled(), 'Blank count must not be saved');
        assert.ok(await close.isDisabled(), 'Blank count must not close the drawer');

        await count.fill('48000');
        assert.ok(await close.isDisabled(), 'Variance requires a reason before closing');
        const note = dialog.getByRole('textbox', { name: bangla ? /মন্তব্য/ : /Note/ });
        await note.fill('Counted twice, review short cash');
        assert.equal(await close.isDisabled(), false);
        await close.click();

        await page.getByRole('button', {
          name: bangla ? 'ক্যাশ সেশন খুলুন' : 'Open cash session', exact: true
        }).first().click();
        const reopen = page.getByRole('dialog').last();
        await reopen.getByRole('heading', {
          name: bangla ? 'ক্যাশ সেশন খুলুন' : 'Open cash session'
        }).waitFor();
        const float = reopen.getByRole('textbox', { name: bangla ? 'শুরুর টাকা' : 'Opening cash' });
        await float.fill('7000');
        await reopen.getByRole('button', { name: bangla ? 'সেশন খুলুন' : 'Open session' }).click();

        await page.getByRole('button', {
          name: bangla ? 'ক্যাশ গুনুন / সেশন বন্ধ করুন' : 'Count / close cash session', exact: true
        }).click();
        const next = page.getByRole('dialog').last();
        await next.getByRole('button', { name: bangla ? 'নোট গুনুন' : /Count notes/ }).click();
        await next.getByRole('textbox', { name: (bangla ? 'নোটের সংখ্যা ' : 'Number of notes ') + '৳500' }).fill('2');
        await next.getByRole('button', { name: bangla ? 'গণনা সংরক্ষণ করুন' : 'Save count' }).click();
        assert.deepEqual(errors, [], language + ' ' + width + 'px errors');
        await context.close();
        console.log('Cash drawer Phase 7 ' + language + ' @ ' + width + 'px passed');
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
