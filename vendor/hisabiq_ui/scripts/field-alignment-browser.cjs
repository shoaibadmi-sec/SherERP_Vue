/* Read-only ERP-wide form geometry audit. Includes phone/tablet/desktop and modals.
 * FIELD_ALIGNMENT_FULL=1 checks all viewport/language/theme combinations.
 * Never submits a transaction, alters stock, or records a payment.
 */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const routes = [
  'dashboard', 'pos', 'counter', 'sales', 'quotations', 'online-sales',
  'notifications', 'warranty', 'reconciliation', 'finance', 'daybook',
  'accounts', 'audit-ledger', 'products', 'parties', 'purchases',
  'purchases/new', 'vendors', 'expenses', 'reports', 'settings/business',
  'settings/personal'
];
const full = process.env.FIELD_ALIGNMENT_FULL === '1';
const sizes = full ? [390, 768, 1024, 1440] : [390, 1440];
const languages = full ? ['English', 'English + Bangla', 'Bangla'] : ['English'];
const themes = full ? ['light', 'dark'] : ['light'];
const output = process.env.FIELD_ALIGNMENT_OUTPUT;
const findings = [];
let checked = 0;

async function scan(page, contextName) {
  const audit = await page.evaluate(() => {
    const visible = el => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return r.width > 0 && r.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const rect = el => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    };
    const fits = (inner, outer) => inner.y >= outer.y - 2 && inner.bottom <= outer.bottom + 2;
    const failures = [];
    const report = (message, element, extra = {}) =>
      failures.push({ message, control: element?.getAttribute('aria-label') || element?.getAttribute('placeholder') || element?.tagName, ...extra });
    let controls = 0, joined = 0, numeric = 0, combos = 0;
    for (const field of document.querySelectorAll('input:not([type="hidden"]), select, textarea')) {
      if (!visible(field)) continue;
      controls++;
      // Inputs must remain inside their shared numeric shell. The outer shell,
      // not a child input, owns the border and focus ring.
      const numericShell = field.closest('[data-numeric-input]');
      if (numericShell && visible(numericShell)) {
        numeric++;
        if (!fits(rect(field), rect(numericShell)))
          report('Numeric field protrudes vertically from its wrapper', field, { field: rect(field), shell: rect(numericShell) });
      }
      const joinedShell = field.closest('[data-numeric-joined]');
      if (joinedShell && visible(joinedShell)) {
        joined++;
        if (!fits(rect(field), rect(joinedShell)))
          report('Joined field protrudes vertically from its outer border', field, { field: rect(field), shell: rect(joinedShell) });
      }
      // A single-line field with asymmetric vertical padding can make its
      // value and placeholder appear vertically offset despite correct height.
      if (field.tagName === 'INPUT' && !['checkbox', 'radio', 'range', 'file', 'color'].includes(field.type)) {
        const style = getComputedStyle(field);
        const top = parseFloat(style.paddingTop) || 0, bottom = parseFloat(style.paddingBottom) || 0;
        if (Math.abs(top - bottom) > 2)
          report('Unequal top/bottom field padding', field, { top, bottom });
      }
    }
    for (const select of document.querySelectorAll('button[role="combobox"][aria-haspopup="listbox"]')) {
      if (!visible(select)) continue;
      combos++;
      const label = select.querySelector(':scope > span');
      if (visible(label) && Math.abs((rect(select).y + rect(select).height / 2) - (rect(label).y + rect(label).height / 2)) > 2)
        report('Dropdown label is not vertically centered', select, { label: rect(label), trigger: rect(select) });
      const joinedShell = select.closest('[data-numeric-joined]');
      if (joinedShell && !fits(rect(select), rect(joinedShell)))
        report('Dropdown trigger protrudes from joined field', select, { trigger: rect(select), shell: rect(joinedShell) });
    }
    for (const shell of document.querySelectorAll('[data-field-shell="money-unit"]')) {
      if (!visible(shell)) continue;
      const height = rect(shell).height;
      if (Math.abs(height - 36) > 2)
        report('Amount/unit shell differs from universal 36px height', shell, { height });
    }
    for (const stepper of document.querySelectorAll('[data-number-stepper]')) {
      if (!visible(stepper)) continue;
      const shell = stepper.closest('[data-numeric-input]');
      if (!shell) continue;
      const a = rect(stepper), b = rect(shell);
      if (Math.abs(a.y + a.height / 2 - (b.y + b.height / 2)) > 2)
        report('Stepper buttons shifted from numeric field center', stepper, { stepper: a, shell: b });
    }
    return { failures, controls, joined, numeric, combos };
  });
  checked += audit.controls + audit.combos;
  for (const failure of audit.failures) findings.push({ ...contextName, ...failure });
  return audit;
}

async function main() {
  const { createServer } = await import('vite');
  const port = Number(process.env.FIELD_ALIGNMENT_PORT || 4884);
  const server = await createServer({ server: { host: '127.0.0.1', port, strictPort: true } });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] });
  try {
    for (const width of sizes) for (const theme of themes) for (const language of languages) {
      const viewport = { width, height: width === 390 ? 844 : width === 768 ? 1024 : width === 1024 ? 768 : 900 };
      const browserContext = await browser.newContext({ viewport, hasTouch: width <= 1024, colorScheme: theme, reducedMotion: 'reduce' });
      const page = await browserContext.newPage();
      const errors = [];
      page.on('pageerror', err => errors.push(err.message));
      await page.route('https://fonts.googleapis.com/**', route => route.abort());
      await page.addInitScript(({ language, theme }) => {
        localStorage.setItem('hisabiq-theme', theme);
        localStorage.setItem('hisabiq-erp-personal-v1', JSON.stringify({
          mode: 'Simple', language, density: 'Compact', terminology: 'simple', dateView: 'transaction'
        }));
      }, { language, theme });
      for (const route of routes) {
        errors.length = 0;
        await page.goto(`http://127.0.0.1:${port}/#/app/${route}`, { waitUntil: 'domcontentloaded' });
        await page.locator('#erp-main').waitFor();
        await page.waitForTimeout(75);
        await scan(page, { width, theme, language, route, surface: 'page' });
        if (errors.length) findings.push({ width, theme, language, route, message: 'Runtime errors', errors: [...errors] });
        // Sample the actual rendered dialog fields too; do not submit anything.
        if (route === 'products' || route === 'quotations') {
          const label = route === 'products' ? /Add product/i : /New quotation/i;
          const button = page.getByRole('button', { name: label }).first();
          if (await button.count()) {
            await button.click();
            const dialog = route === 'products' ? page.locator('[data-product-editor]') : page.getByRole('dialog').first();
            await dialog.waitFor();
            await scan(page, { width, theme, language, route, surface: 'dialog' });
            if(route==='products')await dialog.getByRole('button',{name:'Cancel',exact:true}).click();else await page.keyboard.press('Escape');
          }
        }
      }
      await browserContext.close();
      console.log('Field alignment checked', width, theme, language);
    }
  } finally {
    await browser.close();
    await server.close();
  }
  if (output) {
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, JSON.stringify({ checked, findings }, null, 2));
  }
  assert.deepEqual(findings, [], 'ERP field vertical alignment regressions');
  console.log(`Field alignment: ${checked} control observations passed across ${routes.length} ERP routes`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
