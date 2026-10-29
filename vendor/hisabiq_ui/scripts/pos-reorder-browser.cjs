/* POS reorder regression: touch/pointer drag, keyboard move, cart -> receipt order. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host: '127.0.0.1', port: 4182, strictPort: true } });
  await server.listen();
  const browser = await chromium.launch({
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ['--no-sandbox']
  });
  let page = await browser.newPage({ viewport: { width: 1460, height: 1050 }, reducedMotion: 'reduce' });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const rowOrder = async () => page.getByTestId('pos-cart-row').evaluateAll((nodes) =>
    nodes.map((node) => node.querySelector('p')?.textContent?.trim()));
  try {
    await page.goto('http://127.0.0.1:4182/#/app/pos');
    await page.getByTestId('pos-cart-row').first().waitFor();
    const original = await rowOrder();
    assert.deepEqual(original, ['PVC Pipe 1" (20 ft)', 'LED Bulb 12W', 'Wire Mesh Net 3 ft']);
    const totalBefore = await page.getByRole('button', { name: /Preview sale/ }).innerText();
    const lastHandle = page.getByRole('button', { name: /Reorder Wire Mesh Net 3 ft/ });
    await lastHandle.focus();
    await lastHandle.press('ArrowUp');
    assert.deepEqual(await rowOrder(), ['PVC Pipe 1" (20 ft)', 'Wire Mesh Net 3 ft', 'LED Bulb 12W']);
    await lastHandle.press('ArrowUp');
    assert.deepEqual(await rowOrder(), ['Wire Mesh Net 3 ft', 'PVC Pipe 1" (20 ft)', 'LED Bulb 12W']);
    assert.equal(await page.getByRole('button', { name: /Preview sale/ }).innerText(), totalBefore,
      'changing order does not alter totals');
    const rowFocus = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    assert.match(rowFocus, /Reorder Wire Mesh Net 3 ft/, 'keyboard focus remains on the moved row');

    await page.getByRole('button', { name: 'Exact', exact: true }).click();
    await page.getByRole('button', { name: /Preview sale/ }).click();
    const review = page.getByRole('dialog', { name: 'Review sale', exact: true });
    await review.waitFor();
    assert.match(await review.innerText(), /টাকা মাত্র/, 'amount in words appears before sale completion');
    await review.getByRole('button', { name: 'Confirm sale preview' }).click();
    const receipt = page.locator('[data-slot="dialog-content"]').last();
    await receipt.getByText(/Sale preview/).waitFor();
    const printed = await receipt.locator('ol > li').evaluateAll((nodes) =>
      nodes.map((node) => node.querySelector('span')?.textContent?.trim()));
    assert.deepEqual(printed.map((text) => text?.replace(/^\d+\. /, '')), [
      'Wire Mesh Net 3 ft', 'PVC Pipe 1" (20 ft)', 'LED Bulb 12W'
    ], 'invoice print preview follows reordered cart sequence');
    await receipt.getByRole('button', { name: 'Close', exact: true }).click();

    // Isolate the pointer test in its own browser context, rather than reusing a completed cart.
    await page.close();
    page = await browser.newPage({ viewport: { width: 1460, height: 1050 }, reducedMotion: 'reduce' });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto('http://127.0.0.1:4182/#/app/pos');
    await page.getByTestId('pos-cart-row').first().waitFor();
    assert.deepEqual(await rowOrder(), original);
    const source = page.getByTestId('pos-cart-row').nth(2).getByTestId('pos-drag-handle');
    const target = page.getByTestId('pos-cart-row').first().getByTestId('pos-drag-handle');
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();
    assert.ok(sourceBox && targetBox);
    const sx = sourceBox.x + sourceBox.width / 2, sy = sourceBox.y + sourceBox.height / 2;
    const tx = targetBox.x + targetBox.width / 2, ty = targetBox.y + targetBox.height / 2;
    await page.mouse.move(sx, sy);
    await page.mouse.down();
    await page.mouse.move(tx, ty - 8, { steps: 16 });
    await page.waitForTimeout(260);
    await page.mouse.up();
    await page.waitForTimeout(200);
    assert.equal((await rowOrder())[0], 'Wire Mesh Net 3 ft', 'dragging the handle moves the item');
    assert.equal(await page.getByTestId('pos-add-row').count(), 1, 'inline search remains below the cart');
    assert.deepEqual(errors, []);
    console.log('POS keyboard reorder, drag reorder, total invariance and invoice-preview order passed.');
  } finally {
    await browser.close();
    await server.close();
  }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
