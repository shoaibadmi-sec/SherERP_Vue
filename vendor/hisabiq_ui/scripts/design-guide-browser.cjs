/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { verifyComponentLibrary } = require('./component-library-browser-checks.cjs');

async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 4993, strictPort: true } });
  await server.listen();
  let browser;
  const canonical = fs.readFileSync('docs/ui/HISABIQ-DESIGN-GUIDE.md', 'utf8');
  const profiles = [
    { width: 1440, theme: 'light', language: 'English + Bangla' },
    { width: 1440, theme: 'dark', language: 'English' },
    { width: 768, theme: 'light', language: 'English' },
    { width: 768, theme: 'dark', language: 'Bangla' },
    { width: 390, theme: 'light', language: 'Bangla' },
    { width: 390, theme: 'dark', language: 'English + Bangla' },
  ];
  try {
    for (const profile of profiles) {
      browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox', ...(process.env.PLAYWRIGHT_SINGLE_PROCESS === '1' ? ['--no-zygote', '--single-process'] : [])] });
      const context = await browser.newContext({ viewport: { width: profile.width, height: 960 }, hasTouch: profile.width < 1024, reducedMotion: 'reduce', permissions: ['clipboard-read', 'clipboard-write'] });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.addInitScript((value) => {
        localStorage.setItem('hisabiq-theme', value.theme);
        localStorage.setItem('hisabiq-erp-personal-v1', JSON.stringify({ mode: 'Simple', language: value.language, density: 'Compact', terminology: 'simple', dateView: 'transaction' }));
      }, profile);
      await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
      await page.goto('http://127.0.0.1:4993/#/design-system', { waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { name: 'One guide for every HisabIQ screen' }).waitFor();
      await verifyComponentLibrary(page, profile);
      assert.equal(await page.locator('#complete-guide details[id^="guide-"]').count(), 32);
      await page.locator('#guide-search').fill('no-match-xyz');
      await page.getByText('No matching design rule', { exact: true }).waitFor();
      await page.getByRole('button', { name: 'Clear search', exact: true }).click();
      assert.equal(await page.locator('#complete-guide details[id^="guide-"]').count(), 32);
      await page.getByRole('button', { name: 'Expand all', exact: true }).click();
      await page.waitForFunction(() => document.querySelectorAll('#complete-guide details[id^="guide-"][open]').length === 32);
      await page.getByRole('button', { name: 'Collapse all', exact: true }).click();
      await page.waitForFunction(() => document.querySelectorAll('#complete-guide details[id^="guide-"][open]').length === 0);
      await page.getByRole('button', { name: '08. Buttons and action priority', exact: true }).click();
      assert.equal(await page.locator('#guide-08').getAttribute('open'), '');
      const palette = page.locator('#source-inventory details').nth(1);
      await palette.locator('summary').click();
      assert.equal(await palette.locator('tbody tr').count(), 59);
      await page.locator('#guide-inventory-search').fill('AppDatePicker');
      await page.locator('#source-inventory details').first().locator('summary').click();
      assert.equal(await page.locator('#source-inventory li').filter({ hasText: 'AppDateRangePicker.tsx' }).count(), 1);
      await page.locator('#guide-inventory-search').fill('');
      if (profile === profiles[0]) {
        await page.getByRole('button', { name: 'Copy complete guide', exact: true }).click();
        assert.equal(await page.evaluate(() => navigator.clipboard.readText()), canonical);
        const downloaded = page.waitForEvent('download');
        await page.getByRole('button', { name: 'Download guide', exact: true }).click();
        const file = await downloaded;
        assert.equal(fs.readFileSync(await file.path(), 'utf8'), canonical);
        await page.locator('header').getByRole('button', { name: 'Typography', exact: true }).click();
        assert.equal(new URL(page.url()).hash, '#/design-system', 'Section navigation preserves HashRouter route');
      }
      const examples = page.locator('#live-components');
      await examples.scrollIntoViewIfNeeded();
      const number = examples.locator('input[id$="-amount"]');
      await number.focus(); await number.press('ArrowUp');
      assert.equal(await number.inputValue(), '1251');
      const method = examples.locator('button[id$="-method"]');
      await method.focus(); await method.press('End'); await method.press('Enter');
      assert.equal(await method.getAttribute('data-value'), 'mfs');
      const complete = examples.locator('[data-erp-workflow-action="complete"]');
      assert.equal(Math.round((await complete.boundingBox()).height), 48);
      await complete.click();
      const dialog = page.locator('[data-dialog-root]');
      await dialog.waitFor();
      await dialog.getByRole('combobox').click();
      await page.getByRole('listbox').waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await dialog.count(), 1, 'Escape closes select before modal');
      await page.keyboard.press('Escape');
      await dialog.waitFor({ state: 'hidden' });
      assert.equal(await complete.evaluate((element) => element === document.activeElement), true);
      const tab = examples.getByRole('tab').first();
      await tab.focus(); await tab.press('ArrowRight');
      assert.equal(await examples.getByRole('tab').nth(1).getAttribute('aria-selected'), 'true');
      const typography = await examples.locator('table').evaluate((table) => ({
        data: getComputedStyle(table.querySelector('td')).fontSize,
        heading: getComputedStyle(table.querySelector('th')).fontSize,
        badge: getComputedStyle(table.querySelector('[data-slot="badge"]')).fontSize,
        figures: getComputedStyle(table.querySelector('td')).fontVariantNumeric,
      }));
      assert.deepEqual(typography, { data: '13px', heading: '12px', badge: '11px', figures: 'normal' });
      const sampleSearch = examples.locator('input[type="search"]');
      await sampleSearch.fill('no-match');
      assert.equal(await examples.locator('tbody tr').count(), 1, 'Filtered empty state');
      await sampleSearch.fill('');
      const overflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth,
        offenders: [...document.querySelectorAll('body *')].filter((element) => element.getBoundingClientRect().right > innerWidth + 2).slice(0, 6).map((element) => ({ tag: element.tagName, text: element.textContent.slice(0, 60) })) }));
      assert.ok(overflow.scroll <= overflow.width, JSON.stringify({ profile, overflow }));
      await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
      const violations = await page.evaluate(async () => (await window.axe.run({ include: ['#complete-guide', '#live-components'] }, { runOnly: ['wcag2a', 'wcag2aa'] })).violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) })));
      assert.deepEqual(violations, [], JSON.stringify(profile) + ' accessibility');
      assert.deepEqual(errors, [], 'No runtime errors');
      if (process.env.DESIGN_GUIDE_CAPTURE) {
        fs.mkdirSync(process.env.DESIGN_GUIDE_CAPTURE, { recursive: true });
        await page.evaluate(() => scrollTo(0, 0));
        await page.screenshot({ path: path.join(process.env.DESIGN_GUIDE_CAPTURE, 'guide-' + profile.width + '-' + profile.theme + '.png') });
      }
      if (profile === profiles[0]) {
        await page.goto('http://127.0.0.1:4993/#/app/reports?report=sales-register');
        await page.locator('#erp-main').waitFor();
        await page.getByRole('button', { name: 'Columns', exact: true }).click();
        const actualColumns = page.locator('[data-dialog-root]');
        assert.equal(await actualColumns.locator('fieldset input:disabled').count(), 1);
        const option = actualColumns.getByRole('checkbox').nth(1);
        const checked = await option.isChecked(), before = page.url();
        await option.setChecked(!checked);
        assert.equal(await option.isChecked(), !checked, 'Shared editor changes the real Reports column state');
        assert.notEqual(page.url(), before, 'Real Reports retains its URL column preference');
        await actualColumns.getByRole('button', { name: 'Done', exact: true }).click();
      }
      console.log('PASS guide', profile.width, profile.theme, profile.language);
      await context.close();
      await browser.close();
      browser = undefined;
    }
  } finally { if (browser) await browser.close(); await server.close(); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
