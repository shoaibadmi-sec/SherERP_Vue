const { chromium } = require('playwright');
const assert = require('node:assert/strict');
async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 4183, strictPort: true } });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1320, height: 960 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  const root = 'http://127.0.0.1:4183/#/app/';
  try {
    await page.goto(root + 'daybook');
    await page.evaluate(() => localStorage.setItem('hisabiq-theme', 'dark'));
    await page.reload();
    assert.equal(await page.getAttribute('html', 'data-theme'), 'dark');

    // The Sales customer filter was the original gray native popup screenshot.
    await page.goto(root + 'sales');
    const salesCustomer = page.getByRole('combobox', { name: 'All customers', exact: true });
    await salesCustomer.click();
    const salesOptions = page.getByRole('listbox', { name: 'All customers options' });
    assert.equal(await salesOptions.evaluate((node) => getComputedStyle(node).backgroundColor),
      'rgb(20, 38, 59)', 'Sales customer popup is navy, not native charcoal');
    await salesOptions.locator('[role="option"][data-value="Rahman Hardware"]').click();
    assert.equal(await salesCustomer.getAttribute('data-value'), 'Rahman Hardware');
    await page.goto(root + 'daybook');

    const status = page.getByRole('combobox', { name: 'Status', exact: true });
    await status.click();
    const options = page.getByRole('listbox', { name: 'Status options' });
    await options.waitFor();
    assert.equal(await options.evaluate((node) => getComputedStyle(node).backgroundColor),
      'rgb(20, 38, 59)', 'dark dropdown uses HisabIQ popover color');
    await page.getByRole('option', { name: 'Posted', exact: true }).click();
    assert.match(await status.innerText(), /Posted/);
    await status.focus();
    await status.press('ArrowDown');
    await status.press('Enter');
    assert.match(await status.innerText(), /Draft/, 'keyboard arrows update the selected option');

    const range = page.getByRole('button', { name: 'Daybook date range' });
    await range.click();
    const calendar = page.getByRole('dialog', { name: 'Daybook date range calendar' });
    await calendar.waitFor();
    assert.equal(await calendar.evaluate((node) => getComputedStyle(node).backgroundColor),
      'rgb(20, 38, 59)', 'dark calendar uses HisabIQ popover color');
    const monthGrids = calendar.locator('[role="grid"]');
    assert.equal(await monthGrids.count(), 2, 'two month calendars rendered on desktop');
    console.log('Calendar layout:', JSON.stringify(await calendar.evaluate((node) => ({
      popup: { rect: node.getBoundingClientRect().toJSON(), display: getComputedStyle(node).display, visibility: getComputedStyle(node).visibility },
      grids: [...node.querySelectorAll('[role="grid"]')].map((grid) => ({
        rect: grid.getBoundingClientRect().toJSON(), display: getComputedStyle(grid).display,
        visibility: getComputedStyle(grid).visibility,
        content: grid.textContent.slice(0, 80),
        parent: grid.parentElement?.className
      }))
    }))));

    assert.equal(await monthGrids.nth(0).isVisible(), true);
    assert.equal(await monthGrids.nth(1).isVisible(), true, 'second month visible on desktop');
    await calendar.locator('[data-calendar-date="2026-10-06"]').click();
    await calendar.locator('[data-calendar-date="2026-10-09"]').click();
    await calendar.getByRole('button', { name: 'Apply' }).click();
    assert.match(await range.innerText(), /6 Oct 2026 – 9 Oct 2026/);

    await range.click();
    await calendar.getByRole('button', { name: 'Last month' }).click();
    await calendar.getByRole('button', { name: 'Cancel' }).click();
    assert.match(await range.innerText(), /6 Oct 2026 – 9 Oct 2026/, 'cancel does not alter applied range');

    await range.click();
    await calendar.getByRole('button', { name: 'Clear' }).click();
    assert.match(await range.innerText(), /All dates/, 'clear removes the date filter');

    await page.goto(root + 'audit-ledger');
    const audit = page.getByRole('button', { name: 'Audit date range' });
    await audit.click();
    await page.getByRole('button', { name: 'This month' }).click();
    await page.getByRole('button', { name: 'Apply' }).click();
    assert.doesNotMatch(await audit.innerText(), /All dates/);

    await page.goto(root + 'accounts');
    await page.getByRole('tab', { name: /^Ledger/ }).click();
    const ledger = page.getByRole('button', { name: 'Account ledger date range' });
    await ledger.click();
    await page.getByRole('button', { name: 'Clear' }).click();
    assert.match(await ledger.innerText(), /All dates/, 'account ledger accepts an unbounded range');

    // Expenses Reports: this formerly had two decorative, disconnected date fields.
    await page.goto(root + 'expenses');
    await page.getByRole('tab', { name: /^Reports/ }).click();
    const expenseRange = page.getByRole('button', { name: 'Expense report date range' });
    assert.match(await expenseRange.innerText(), /1 Sep 2026 – 30 Sep 2026/);
    assert.equal(await page.getByText('Rent', { exact: true }).count() > 0, true,
      'expense category present for September');
    await expenseRange.click();
    const expenseCalendar = page.getByRole('dialog', { name: 'Expense report date range calendar' });
    await expenseCalendar.waitFor({ state: 'visible' });
    assert.equal(await expenseCalendar.evaluate((node) => getComputedStyle(node).backgroundColor),
      'rgb(20, 38, 59)', 'expense range popup uses navy theme');
    await expenseCalendar.locator('[data-calendar-date="2026-09-24"]').click();
    await expenseCalendar.locator('[data-calendar-date="2026-09-25"]').click();
    await expenseCalendar.getByRole('button', { name: 'Apply' }).click();
    assert.match(await expenseRange.innerText(), /24 Sep 2026 – 25 Sep 2026/);
    assert.equal(await page.getByText('Rent', { exact: true }).count(), 0,
      'expense report category totals react to range');
    assert.equal(await page.getByText('Utilities', { exact: true }).count() > 0, true);
    await expenseRange.click();
    await expenseCalendar.getByRole('button', { name: 'Clear' }).click();
    assert.match(await expenseRange.innerText(), /All dates/);
    assert.equal(await page.getByText('Rent', { exact: true }).count() > 0, true,
      'clearing range restores expense totals');

    // Accounts Statements: a single date range and dynamic accounting period presets.
    await page.goto(root + 'accounts');
    await page.getByRole('tab', { name: /^Statements/ }).click();
    const statementsRange = page.getByRole('button', { name: 'Financial statements date range' });
    assert.match(await statementsRange.innerText(), /1 Sep 2026 – 31 Oct 2026/);
    await page.getByRole('button', { name: 'This month', exact: true }).click();
    assert.match(await statementsRange.innerText(), /1 Oct 2026 – 31 Oct 2026/);
    await statementsRange.click();
    const statementCalendar = page.getByRole('dialog', { name: 'Financial statements date range calendar' });
    await statementCalendar.waitFor({ state: 'visible' });
    assert.equal(await statementCalendar.evaluate((node) => getComputedStyle(node).backgroundColor),
      'rgb(20, 38, 59)', 'statements range popup matches dark theme');
    await statementCalendar.getByRole('button', { name: 'Clear' }).click();
    assert.match(await statementsRange.innerText(), /All dates/);
    await page.getByText('Profit & Loss', { exact: true }).waitFor();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(root + 'daybook');
    await page.getByRole('button', { name: 'Daybook date range' }).click();
    const mobile = page.getByRole('dialog', { name: 'Daybook date range calendar' });
    await mobile.waitFor({ state: 'visible' });
    const mobileGrids = mobile.locator('[role="grid"]');
    assert.equal(await mobileGrids.count(), 2, 'both months retained for responsive UI');
    assert.equal(await mobileGrids.first().isVisible(), true);
    assert.equal(await mobileGrids.last().isVisible(), false, 'second month hidden on mobile');
    assert.ok((await mobile.boundingBox()).width <= 390);

    await page.evaluate(() => localStorage.setItem('hisabiq-theme', 'light'));
    await page.reload();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.getByRole('combobox', { name: 'Status', exact: true }).click();
    assert.equal(await page.getByRole('listbox', { name: 'Status options' }).evaluate((node) => getComputedStyle(node).backgroundColor),
      'rgb(255, 255, 255)', 'light dropdown matches card color');
    assert.deepEqual(errors, []);
    console.log('Themed menus and range calendars passed dark/light, pointer, keyboard, apply/cancel, preset, mobile checks.');
  } finally {
    await browser.close();
    await server.close();
  }
}
main().catch((err) => { console.error(err); process.exitCode = 1; });
