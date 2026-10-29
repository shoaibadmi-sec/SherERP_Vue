/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const assert = require('node:assert/strict');

async function verifyComponentLibrary(page, profile) {
  const library = page.locator('#component-library');
  await library.waitFor();
  const entryStyles = await library.locator('#specimen-inputs input, #specimen-inputs textarea, #specimen-quantities input').evaluateAll((nodes) => nodes.map((node) => {
    const value = getComputedStyle(node), placeholder = getComputedStyle(node, '::placeholder');
    return { size: value.fontSize, weight: value.fontWeight, line: value.lineHeight, color: value.color,
      expectedColor: 'rgb(' + value.getPropertyValue('--color-ink-600').trim().split(/\s+/).join(', ') + ')',
      placeholderWeight: placeholder.fontWeight, placeholderOpacity: placeholder.opacity };
  }));
  assert.ok(entryStyles.length >= 10, 'Shared input, textarea and joined numeric specimens are present');
  for (const style of entryStyles) {
    assert.equal(style.size, '13px', 'Entry text keeps the compact scale in every viewport');
    assert.equal(style.weight, '400', 'Entry text does not inherit a medium-weight label');
    assert.equal(style.line, '20px');
    assert.equal(style.color, style.expectedColor, 'Entry text resolves the active theme Ink 600');
    assert.equal(style.placeholderWeight, '400');
    assert.equal(style.placeholderOpacity, '1');
  }
  const fieldSearch = library.locator('#specimen-inputs input[type="search"]');
  await fieldSearch.fill('sample');
  await library.locator('#specimen-inputs').getByRole('button', { name: /^Clear / }).click();
  assert.equal(await fieldSearch.inputValue(), '');
  assert.equal(await fieldSearch.evaluate((node) => node === document.activeElement), true);
  const party = library.locator('[data-library-party-role]');
  const selector = party.getByRole('combobox');
  const roleChecks = [
    ['Customer', 'receive-payment', 'hand-coins'], ['Supplier', 'make-payment', 'banknote'],
    ['Owner', 'add-capital', 'piggy-bank'], ['Lender', 'repay-loan', 'landmark'],
    ['Borrower', 'collect-repayment', 'hand-coins'], ['Vendor', 'pay-vendor', 'banknote'],
    ['Payee', 'opening-balance', 'book-open'],
  ];
  for (const [index, [role, action, glyph]] of roleChecks.entries()) {
    await selector.focus(); await selector.press('Home');
    for (let step = 0; step < index; step++) await selector.press('ArrowDown');
    await selector.press('Enter');
    assert.equal(await party.getAttribute('data-library-party-role'), role);
    assert.equal(await party.locator('[data-role-action="' + action + '"]:visible svg').getAttribute('class').then((value) => value.includes('lucide-' + glyph)), true, role + ' exact action icon');
    if (role === 'Owner') {
      assert.equal(await party.locator('[data-role-action="owner-drawing"]:visible svg').getAttribute('class').then((value) => value.includes('lucide-wallet')), true);
      assert.equal(await party.locator('[data-role-action="add-capital"]:visible').getAttribute('data-finance-type'), 'Owner Credit');
    }
  }
  if (profile.width < 768) {
    await party.locator('[data-library-party-more]').click();
    const sheet = page.getByRole('dialog', { name: /More actions|আরও কাজ/ });
    await sheet.waitFor();
    assert.equal(await sheet.locator('p[lang="bn"]').count(), profile.language === 'English + Bangla' ? 1 : 0);
    await sheet.locator('[data-role-action="add-note"]').click();
    await page.locator('[data-dialog-root]').waitFor();
    await page.keyboard.press('Escape');
    await page.locator('[data-dialog-root]').waitFor({ state: 'hidden' });
    await page.waitForFunction(() => document.querySelector('[data-library-party-more]') === document.activeElement, undefined, { timeout: 2000 });
  }
  const report = library.locator('[data-library-report-toolbar]');
  const search = report.locator('input[type="search"]').first();
  await search.fill('Rahman');
  assert.equal(await report.locator('tbody tr').count(), 1);
  await search.fill('');
  const date = report.locator('button[aria-haspopup="dialog"]').first();
  await date.click();
  const calendar = page.locator('[role="dialog"]').filter({ has: page.locator('[data-calendar-date]') });
  await calendar.waitFor();
  assert.equal(await calendar.getByRole('grid').count(), profile.width < 640 ? 1 : 2, 'Responsive real range calendar');
  await page.keyboard.press('Escape');
  const comparison = report.getByRole('combobox').first();
  await comparison.focus(); await comparison.press('End'); await comparison.press('Enter');
  assert.equal(await comparison.getAttribute('data-value'), 'previous');
  await report.getByRole('button', { name: /^(Columns|কলাম)$/ }).click();
  const columnDialog = page.locator('[data-dialog-root]');
  assert.equal(await columnDialog.locator('fieldset input:disabled').count(), 1, 'Identity column protected');
  await columnDialog.getByRole('checkbox', { name: /^(Amount|টাকা)$/ }).uncheck();
  await columnDialog.getByRole('button', { name: /^(Done|সম্পন্ন)$/ }).click();
  assert.equal(await report.getByRole('columnheader', { name: /^(Amount|টাকা)$/ }).count(), 0);
  await report.getByRole('button', { name: /^(Saved views|সংরক্ষিত ভিউ)$/ }).click();
  const viewDialog = page.locator('[data-dialog-root]');
  await viewDialog.getByRole('textbox').fill('Daily sample');
  await viewDialog.getByRole('button', { name: /^(Save sample view|নমুনা ভিউ সংরক্ষণ)$/ }).click();
  await viewDialog.getByRole('button', { name: /^(Done|সম্পন্ন)$/ }).click();
  await search.fill('missing record');
  await report.getByRole('button', { name: /^(Saved views|সংরক্ষিত ভিউ)$/ }).click();
  await page.locator('[data-dialog-root]').getByRole('button', { name: 'Daily sample', exact: true }).click();
  assert.equal(await search.inputValue(), '');
  assert.equal(await report.locator('tbody tr').count(), 2);
  const help = report.getByRole('button', { name: /About status|অবস্থা সম্পর্কে/ });
  await help.click();
  const tooltip = page.getByRole('tooltip');
  await tooltip.waitFor();
  if (profile.language === 'English + Bangla') assert.equal(await tooltip.locator('.font-bn.border-t').count(), 1, 'Bilingual help separator');
  const rect = await tooltip.boundingBox();
  assert.ok(rect.x >= 0 && rect.x + rect.width <= profile.width + 1, 'Help stays in viewport');
  await page.keyboard.press('Escape');
  await tooltip.waitFor({ state: 'hidden' });
  await library.getByRole('tab', { name: /^(Future compositions|ভবিষ্যতের ব্যবহার)$/ }).click();
  const stateSelect = library.getByRole('combobox');
  await stateSelect.focus(); await stateSelect.press('Home'); await stateSelect.press('ArrowDown'); await stateSelect.press('ArrowDown'); await stateSelect.press('Enter');
  assert.equal(await library.locator('[data-feedback-state="error"]').count(), 1);
  await library.getByRole('button', { name: /^(Retry sample|আবার চেষ্টা করুন)$/ }).click();
  assert.equal(await library.locator('[data-feedback-state="empty"]').count(), 1);
  await library.getByRole('tab', { name: /^(All components|সব উপাদান)$/ }).click();
  const snapshots = await library.locator('[id^="specimen-"]').count();
  assert.equal(snapshots, require('../src/data/componentCatalog.json').length, 'Every registered specimen is visible');
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const violations = await page.evaluate(async () => (await window.axe.run({ include: ['#component-library'] }, { runOnly: ['wcag2a', 'wcag2aa'] })).violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) })));
  assert.deepEqual(violations, [], JSON.stringify(profile) + ' library accessibility');
  if (process.env.DESIGN_GUIDE_CAPTURE) {
    await library.scrollIntoViewIfNeeded();
    await page.screenshot({ path: process.env.DESIGN_GUIDE_CAPTURE + '/library-' + profile.width + '-' + profile.theme + '.png' });
  }
}

module.exports = { verifyComponentLibrary };
