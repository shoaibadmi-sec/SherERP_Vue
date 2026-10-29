/* Purchase UI smoke test. No API/network persistence expected in this phase. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ cacheDir: '.superpowers/purchase-browser-cache', server: { host: '127.0.0.1', port: 4177, strictPort: true } });
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1400, height: 950 }, reducedMotion: 'reduce' });
  page.setDefaultNavigationTimeout(60000);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  try {
    await page.goto('http://127.0.0.1:4177/#/app/purchases');
    await page.getByRole('button', { name: 'New purchase' }).click();
    await page.getByRole('heading', { name: /New purchase/ }).waitFor();
    assert.equal(await page.locator('[role="dialog"]').count(), 0, 'purchase editor must not be a modal');

    await page.getByRole('combobox',{name:'Supplier',exact:true}).click();
    await page.getByText('Add new supplier',{exact:true}).click();
    const supplierDialog = page.locator('[data-slot="dialog-content"]').last();
    await supplierDialog.waitFor({ timeout: 8000 });
    await supplierDialog.getByPlaceholder('Supplier or business name').fill('Browser QA Supplier');
    await supplierDialog.getByPlaceholder('01XXXXXXXXX').fill('01700000123');
    await supplierDialog.getByRole('button', { name: 'Add supplier' }).click();
    await supplierDialog.waitFor({ state: 'hidden' });
    assert.match(await page.getByRole('combobox', { name: 'Supplier' }).innerText(), /Browser QA Supplier/, 'quick-added supplier selected automatically');

    await page.getByRole('button', { name: 'New product' }).click();
    const productDialog = page.locator('[data-slot="dialog-content"]').last();
    await productDialog.waitFor();
    await productDialog.getByRole('button', { name: 'Cancel', exact: true }).click();
    await productDialog.waitFor({ state: 'hidden' });

    assert.ok(await page.getByRole('button', { name: /^Quick add/ }).count() >= 6, 'Quick Items must be touch-friendly');
    // Regression: the purchase dropdown must behave like POS, not clip inside the scrollable cart.
    await page.keyboard.press('F2');
    const purchaseSearch = page.getByRole('combobox', { name: 'Search product to add to purchase' });
    assert.equal(await purchaseSearch.evaluate((node) => document.activeElement === node), true, 'F2 focuses search');
    await purchaseSearch.fill('wire');
    const firstOptionId = await purchaseSearch.getAttribute('aria-activedescendant');
    await purchaseSearch.press('ArrowDown');
    const secondOptionId = await purchaseSearch.getAttribute('aria-activedescendant');
    assert.notEqual(firstOptionId, secondOptionId, 'ArrowDown selects the next search suggestion');
    await purchaseSearch.press('ArrowUp');
    assert.equal(await purchaseSearch.getAttribute('aria-activedescendant'), firstOptionId, 'ArrowUp selects previous suggestion');
    await purchaseSearch.fill('bulb');
    const suggestion = page.getByRole('option', { name: /LED Bulb 12W/ });
    await suggestion.waitFor();
    const floatingList = page.getByRole('listbox', { name: 'Purchase product suggestions' });
    await floatingList.waitFor({ state: 'visible' });
    assert.equal(await floatingList.evaluate((node) => {
      const cartScroller = document.querySelector('[data-testid="purchase-cart"]')?.parentElement;
      return !cartScroller?.contains(node) && node.getBoundingClientRect().width > 0;
    }), true, 'suggestions must render outside the cart scrolling container');
    await purchaseSearch.press('Escape');
    await floatingList.waitFor({ state: 'hidden' });
    await purchaseSearch.click();
    await floatingList.waitFor({ state: 'visible' });

    await page.getByRole('combobox', { name: 'Search product to add to purchase' }).press('Enter');
    const boxQty = page.getByLabel('Box quantity for LED Bulb 12W', {exact:true});
    assert.equal(await boxQty.evaluate((node) => document.activeElement === node), true, 'selecting product focuses quantity');
    await boxQty.press('Enter');
    const pcsQty = page.getByLabel('Pcs quantity for LED Bulb 12W', {exact:true});
    assert.equal(await pcsQty.evaluate((node) => document.activeElement === node), true, 'Enter moves large to small unit');
    await pcsQty.press('Enter');
    const purchaseCostInput = page.getByLabel('Purchase cost for LED Bulb 12W', {exact:true});
    assert.equal(await purchaseCostInput.evaluate((node) => document.activeElement === node), true, 'Enter moves to cost');
    await purchaseCostInput.press('Enter');
    const salePriceInput = page.getByLabel('Lot selling price for LED Bulb 12W', {exact:true});
    assert.equal(await salePriceInput.evaluate((node) => document.activeElement === node), true, 'Enter moves to lot sale price');
    await salePriceInput.press('Enter');
    assert.equal(await purchaseSearch.evaluate((node) => document.activeElement === node), true, 'Enter returns to new product');

    await boxQty.fill('2');
    await pcsQty.fill('5');
    await purchaseCostInput.fill('1500');
    const lotSellInput = page.getByLabel('Lot selling price for LED Bulb 12W', {exact:true});
    if (!(await lotSellInput.isVisible())) await page.getByRole('button', { name: /Lot details for LED Bulb 12W/ }).click();
    await lotSellInput.fill('185');
    assert.equal(await page.getByTestId('purchase-cart-row').count(), 1);
    assert.equal(await page.getByTestId('purchase-cart').locator(':scope > *').last().getAttribute('data-testid'), 'purchase-add-row');
    assert.match(await page.locator('aside').last().innerText(), /3,750/);
    const bulbRow = page.getByTestId('purchase-cart-row').first();
    await bulbRow.getByRole('radio', { name: 'Pcs', exact: true }).click();
    const baseOnlyQty = bulbRow.getByLabel('Quantity for LED Bulb 12W', {exact:true});
    assert.equal(await baseOnlyQty.inputValue(), '25', 'switch to Pcs shows one base quantity');
    assert.equal(await bulbRow.getByLabel('Purchase cost for LED Bulb 12W', {exact:true}).inputValue(), '150');
    assert.equal(await bulbRow.getByLabel('Box quantity for LED Bulb 12W', {exact:true}).count(), 0, 'base-unit mode only has a single quantity input');
    assert.match(await page.locator('aside').last().innerText(), /3,750/, 'switch does not change purchase total');
    await bulbRow.getByRole('radio', { name: 'Box', exact: true }).click();
    assert.equal(await bulbRow.getByLabel('Box quantity for LED Bulb 12W', {exact:true}).inputValue(), '2');
    assert.equal(await bulbRow.getByLabel('Pcs quantity for LED Bulb 12W', {exact:true}).inputValue(), '5');
    assert.equal(await bulbRow.getByLabel('Purchase cost for LED Bulb 12W', {exact:true}).inputValue(), '1500');
    assert.match(await page.locator('aside').last().innerText(), /3,750/);


    await page.getByRole('button', { name: /Quick add PVC Pipe/ }).first().click();
    assert.equal(await page.getByTestId('purchase-cart-row').count(), 2);
    assert.equal(await page.getByTestId('purchase-cart').locator(':scope > *').last().getAttribute('data-testid'), 'purchase-add-row');
    await page.getByRole('button', { name: /Quick add Gate Valve/ }).click();
    await page.getByRole('textbox', { name: /Serial numbers for Gate Valve/ }).fill('QA-GATE-2026-001');
    await page.getByRole('button', { name: /Quick add Cement/ }).click();
    const expiryRow = page.getByTestId('purchase-cart-row').last();
    await expiryRow.getByLabel('Batch / lot number').fill('CEM-QA-BATCH');
    await expiryRow.getByLabel('Expiry date').fill('2026-12-31');
    assert.equal(await page.getByTestId('purchase-cart-row').count(), 4);
    await purchaseSearch.fill('PVC Pipe');
    await page.getByRole('option', { name: /PVC Pipe/ }).first().click();
    assert.equal(await page.getByTestId('purchase-cart-row').count(), 5, 'mouse click on floating suggestion adds a cart line');
    await page.getByTestId('purchase-cart-row').last().getByRole('button', { name: /Remove PVC Pipe/ }).click();
    assert.equal(await page.getByTestId('purchase-cart-row').count(), 4, 'remove restores cart');
    await page.keyboard.press('F8');
    const firstPaymentInput = page.getByLabel('Paid amount 1', {exact:true});
    assert.equal(await firstPaymentInput.evaluate((node) => document.activeElement === node), true, 'F8 focuses payment amount');
    await page.getByRole('radio', { name: '%', exact: true }).click();
    await page.getByRole('textbox', { name: 'Discount' }).fill('10');
    const purchasePaymentPanel = page.getByTestId('purchase-payment-panel');
    assert.match(await purchasePaymentPanel.innerText(), /Discount applied/);
    const discountedTotal = (await purchasePaymentPanel.getByTestId('purchase-net-total').innerText()).trim();
    assert.notEqual(discountedTotal, '', 'discount and total should update live');
    await page.getByRole('button', { name: 'Exact', exact: true }).click();
    assert.match(await purchasePaymentPanel.innerText(), /Supplier due/);
    assert.match(await purchasePaymentPanel.innerText(), /৳0(?!\d)/, 'fully paid');

    assert.match(await purchasePaymentPanel.innerText(), /Supplier due/);
    await page.getByRole('button', { name: 'Complete purchase' }).click();
    const reviewPurchase = page.getByRole('dialog', { name: 'Review purchase', exact: true });
    await reviewPurchase.waitFor();
    assert.match(await reviewPurchase.innerText(), /টাকা মাত্র/, 'Bangla amount wording is shown before posting');
    await reviewPurchase.getByRole('button', { name: 'Confirm purchase preview' }).click();
    await page.getByRole('heading', { name: 'Purchases', exact: true }).waitFor();
    await page.getByRole('link', { name: 'Browser QA Supplier' }).waitFor();
    const savedRow = page.locator('tbody tr').filter({ hasText: 'Browser QA Supplier' });
    await savedRow.getByRole('button', { name: /^Actions for/ }).click();
    await page.getByRole('button', { name: 'Review return', exact: true }).click();
    const snapshots = page.getByRole('region', { name: 'Purchase source item snapshots' });
    assert.match(await snapshots.innerText(), /LED Bulb 12W/);
    assert.doesNotMatch(await snapshots.innerText(), /cost not available/, 'created purchase preserves its recorded cost');
    assert.equal(await page.getByRole('button', { name: 'Complete return', exact: true }).count(), 0,
      'historical return allocations are still required even when original purchase lines exist');

    await page.goto('http://127.0.0.1:4177/#/app/parties');
    await page.getByText('Browser QA Supplier', { exact: true }).last().waitFor();
    await page.goto('http://127.0.0.1:4177/#/app/purchases/new');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('combobox', { name: 'Search product to add to purchase' }).waitFor();
    await page.keyboard.press('F9');
    await page.getByText('Select or quick-add a supplier.', { exact: true }).last().waitFor();
    assert.match(page.url(), /purchases\/new/, 'F9 validates instead of navigating on an incomplete purchase');
    await page.goto('http://127.0.0.1:4177/#/app/pos');
    const posCart = page.getByTestId('pos-cart');
    await posCart.getByTestId('pos-add-row').waitFor();
    const posOrder = await posCart.locator(':scope > *').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-testid')));
    assert.equal(posOrder[posOrder.length - 1], 'pos-add-row', 'POS inline search must be last');
    assert.equal(await posCart.getByTestId('pos-cart-row').count() >= 1, true, 'sale rows remain in the cart');
    assert.equal(await posCart.evaluate((node) => {
      const add = node.querySelector('[data-testid="pos-add-row"]');
      const rows = [...node.querySelectorAll('[data-testid="pos-cart-row"]')];
      return !!add && rows.every((row) => Boolean(row.compareDocumentPosition(add) & Node.DOCUMENT_POSITION_FOLLOWING));
    }), true, 'sortable sale rows remain ahead of the POS search');
    assert.deepEqual(errors, []);
    console.log('Purchase full page, supplier quick-add, multi-unit cart, payment and navigation smoke test passed.');
  } finally {
    await browser.close();
    await server.close();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
