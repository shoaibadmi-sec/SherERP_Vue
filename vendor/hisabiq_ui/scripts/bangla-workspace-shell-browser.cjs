/* Phase 8: language-aware shared workspace, source IDs and navigation behavior unchanged. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 4393, strictPort: true } });
  await server.listen();
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
    args: ['--no-sandbox']
  });
  try {
    for (const language of ['English', 'English + Bangla', 'Bangla']) {
      for (const width of [390, 1440]) {
        const ctx = await browser.newContext({
          viewport: { width, height: width === 390 ? 844 : 900 },
          reducedMotion: 'reduce', hasTouch: width === 390
        });
        const page = await ctx.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.addInitScript(lang => localStorage.setItem('hisabiq-erp-personal-v1', JSON.stringify({
          mode: 'Simple', language: lang, density: 'Compact',
          terminology: 'simple', dateView: 'transaction'
        })), language);
        const bn = language === 'Bangla';
        await page.goto('http://127.0.0.1:4393/#/app/dashboard');
        const top = page.locator('header[data-print-hide]');
        const search = top.getByRole('combobox', { name: bn ? 'সবখানে খুঁজুন' : 'Global search' });
        await search.waitFor();
        assert.equal(await search.getAttribute('placeholder'),
          bn ? 'পণ্য, ক্রেতা, বিল খুঁজুন…' : 'Search products, parties, invoices…');
        await page.keyboard.press('Control+k');
        assert.equal(await search.evaluate(node => document.activeElement === node), true,
          'Ctrl+K still focuses global search');
        await search.fill('valve');
        await top.getByRole('button', { name: bn ? 'খোঁজা মুছুন' : 'Clear global search' }).click();
        assert.equal(await search.inputValue(), '', 'quick-clear must preserve original behavior');

        const appearance = top.getByRole('button', { name: bn ? /চেহারা:/ : /Appearance:/ });
        await appearance.click();
        const appearancePanel = page.getByRole('dialog', { name: bn ? 'চেহারা' : 'Appearance' });
        await appearancePanel.getByRole('radio', { name: bn ? 'গাঢ়' : 'Dark' }).click();
        await appearancePanel.waitFor({ state: 'hidden' });
        assert.equal(await appearance.getAttribute('aria-expanded'), 'false');

        await top.getByRole('button', { name: bn ? 'নোটিফিকেশন' : 'Notifications' }).click();
        const notices = page.getByRole('dialog', { name: bn ? 'নোটিফিকেশন' : 'Notifications' });
        await notices.getByText(bn ? 'নমুনা নোটিফিকেশন · শুধু UI প্রিভিউ' : 'Sample notifications · UI preview only', { exact: true }).waitFor();
        assert.match(await notices.innerText(), bn ? /নমুনা নোটিফিকেশন/ : /Sample notifications/);
        await notices.getByText(bn ? 'bKash পেমেন্ট পাওয়া গেছে' : 'bKash payment received', { exact: true }).waitFor();
        assert.equal(await notices.getByRole('button', { name: 'Mark all read' }).count(), 0,
          'do not advertise nonexistent read-status mutation');
        await notices.getByRole('button', { name: bn ? 'বন্ধ করুন' : 'Close' }).click();
        await notices.waitFor({ state: 'hidden' });

        await top.getByRole('button', { name: bn ? 'ক্যালকুলেটর' : 'Calculator' }).click();
        const calculator = page.getByRole('dialog', { name: bn ? 'ক্যালকুলেটর' : 'Calculator' });
        await calculator.getByRole('button', { name: bn ? 'ফলাফল কপি করুন' : 'Copy result' }).waitFor();
        await page.keyboard.press('Escape');
        await calculator.waitFor({ state: 'hidden' });

        await top.getByRole('button', { name: bn ? 'ব্যবহারকারীর মেনু' : 'User menu' }).click();
        const user = page.getByRole('dialog', { name: bn ? 'ব্যবহারকারীর মেনু' : 'User menu' });
        await user.waitFor();
        assert.equal(await user.getByRole('button', {
          name: bn ? 'সাইন আউট (শুধু প্রিভিউ)' : 'Sign out (preview only)'
        }).isDisabled(), true, 'preview must not pretend to sign out');
        await user.getByRole('button', { name: bn ? 'ব্যবসার সেটিংস' : 'Business settings' }).click();
        assert.ok(page.url().includes('/app/settings/business'),
          'business settings route must not depend on translated label');

        if (width === 390) {
          await top.getByRole('button', { name: bn ? 'ERP মেনু খুলুন' : 'Open ERP navigation' }).click();
          const drawer = page.getByRole('dialog', { name: bn ? 'ERP মেনু' : 'ERP navigation' });
          await drawer.getByRole('navigation', { name: bn ? 'মোবাইল ERP মেনু' : 'Mobile ERP navigation' }).waitFor();
          await drawer.getByText(bn ? 'কাজের মেনু' : 'Workspace', { exact: true }).waitFor();
          await drawer.getByRole('link', { name: bn ? 'সাহায্য ও সাপোর্ট' : 'Help & Support' }).waitFor();
          await page.keyboard.press('Escape');
          await drawer.waitFor({ state: 'hidden' });
        } else {
          const nav = page.getByRole('navigation', { name: bn ? 'মূল মেনু' : 'Main' });
          await nav.waitFor();
          await nav.getByText(bn ? 'কাজের মেনু' : 'Workspace', { exact: true }).waitFor();
          const sidebar = page.locator('aside[data-sidebar="sidebar"]');
          await sidebar.getByRole('link', { name: bn ? 'সাহায্য ও সাপোর্ট' : 'Help & Support' }).waitFor();
        }

        assert.deepEqual(errors, [], language + ' ' + width + 'px runtime errors');
        await ctx.close();
        console.log('Phase 8 shared shell ' + language + ' @ ' + width + 'px passed');
      }
    }
  } finally {
    await browser.close();
    await server.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
