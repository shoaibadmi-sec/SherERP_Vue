/* Counter → existing Finance transaction modal → confirm → Finance ledger.
 * Smoke across phone and desktop; the finance preview remains in memory while navigating.
 */
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

async function main() {
  const { createServer } = await import('vite');
  const port = 4473;
  const server = await createServer({ server: { host: '127.0.0.1', port, strictPort: true } });
  await server.listen();
  let browser;
  try {
    browser = await chromium.launch({ args: ['--no-sandbox'] });
    for (const [width, height] of [[390, 844], [1280, 800]]) {
      const context = await browser.newContext({ viewport: { width, height }, hasTouch: width < 600 });
      try {
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`http://127.0.0.1:${port}/#/app/counter`);
        const financeAction = page.getByRole('button', { name: /Finance transaction/ });
        await financeAction.waitFor({ state: 'visible' });
        assert.equal(await financeAction.getAttribute('aria-haspopup'), 'dialog');
        if (width < 600) await financeAction.tap(); else await financeAction.click();
        const modal = page.getByRole('dialog', { name: /New finance transaction/ });
        await modal.waitFor({ state: 'visible' });

        // Finance person follows the approved Brand select + attached gear pattern.
        const joined = modal.getByRole('group', { name: 'Finance person' });
        assert.equal(await joined.getByRole('combobox').count(), 1);
        const managePeople = joined.getByRole('button', { name: 'Manage people', exact: true });
        assert.equal(await managePeople.getAttribute('aria-haspopup'), 'dialog');
        assert.equal(await managePeople.locator('svg').count(), 1);
        assert.equal(await modal.getByRole('button', { name: 'Add account', exact: true }).count(), 0);
        if (width < 600) await managePeople.tap(); else await managePeople.click();
        const peopleDialog = page.getByRole('dialog', { name: /Finance people/ });
        await peopleDialog.waitFor({ state: 'visible' });
        await peopleDialog.getByRole('button', { name: 'Done', exact: true }).click();
        await peopleDialog.waitFor({ state: 'hidden' });
        await modal.waitFor({ state: 'visible' });

        // Amount is derived live from valid source rows, including split payments.
        const amountInput = modal.locator('label').filter({ hasText: /^Amount/ }).getByRole('textbox');
        assert.equal(await amountInput.getAttribute('readonly'), '');
        const sources = modal.getByText('Payment sources', { exact: true })
          .locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
        await sources.getByRole('textbox').first().fill('100');
        assert.equal(await amountInput.inputValue(), '100');
        await modal.getByRole('button', { name: 'Add', exact: true }).click();
        await sources.getByRole('textbox').nth(1).fill('75');
        assert.equal(await amountInput.inputValue(), '175');
        assert.match(await modal.getByTestId('amount-in-words').first().innerText(), /একশত পঁচাত্তর|একশো পঁচাত্তর/);
        await modal.getByRole('button', { name: 'Review transaction', exact: true }).click();
        await modal.getByText('Review finance transaction', { exact: true }).waitFor();
        await modal.getByRole('button', { name: 'Confirm finance transaction', exact: true }).click();
        await modal.waitFor({ state: 'hidden' });

        const preview = async () => page.evaluate(async () => {
          const { getFinancePreviewSnapshot } = await import('/src/data/financePreviewStore.ts');
          const snapshot = getFinancePreviewSnapshot();
          return {
            item: snapshot.transactions.find(row => row.id === 'FIN-000189'),
            cash: snapshot.accounts.find(row => row.id === 'acc-cash')?.balance
          };
        });
        const saved = await preview();
        assert.equal(saved.item?.type, 'Lender Credit');
        assert.equal(saved.item?.amount, 175);
        assert.equal(saved.cash, 48250 + 175);

        // Navigate without a page refresh; the same preview record remains visible.
        await page.evaluate(() => { window.location.hash = '/app/finance'; });
        const loansTab = page.getByRole('tab', { name: 'Loans & Owners', exact: true });
        await loansTab.waitFor({ state: 'visible' });
        await loansTab.click();
        await page.locator('tbody').getByText(/FIN-000189/).waitFor({ state: 'visible' });
        const afterNavigation = await preview();
        assert.equal(afterNavigation.item?.id, saved.item.id);
        assert.equal(afterNavigation.cash, saved.cash);
        assert.deepEqual(errors, [], `No page errors at ${width}px`);
        console.log(`Counter Finance transaction completed and retained at ${width}px`);
      } finally {
        await context.close();
      }
    }
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
