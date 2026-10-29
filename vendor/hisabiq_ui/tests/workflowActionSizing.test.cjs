const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');

test('ordinary controls retain 36px and explicitly marked completion actions use 48px', () => {
  const css = read('src/index.css');
  assert.match(css, /--erp-control-height:\s*36px/);
  assert.match(css, /--erp-workflow-action-height:\s*48px/);
  assert.ok(css.includes(':is(.hisabiq-button, button[data-slot="button"])[data-erp-workflow-action="complete"]'));
  assert.match(css, /height:\s*var\(--erp-workflow-action-height\)\s*!important/);
});

test('major sale, purchase and return CTAs opt in; ordinary buttons need no change', () => {
  for (const file of [
    'src/components/pos/CheckoutPanel.tsx',
    'src/components/purchases/PurchasePaymentPanel.tsx',
    'src/pages/Sales.tsx',
  ]) {
    assert.match(read(file), /<Button\b[^>]*data-erp-workflow-action="complete"/s, file);
  }
  assert.match(read('src/components/brand/PrimitivesSection.tsx'), /data-erp-workflow-action="complete"/);
});

test('browser field size survey expects marked completion actions at 48px', () => {
  assert.ok(read('scripts/field-size-parity-browser.cjs').includes(
    'const expected = el.matches(\'button[data-erp-workflow-action="complete"]\') ? 48 : 36;'
  ));
});
