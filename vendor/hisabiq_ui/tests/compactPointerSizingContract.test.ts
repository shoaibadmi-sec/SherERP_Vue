import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path: string) => readFileSync(path, 'utf8');

test('universal control sizing keeps 36px form controls on every pointer device', () => {
  const css = read('src/index.css');
  assert.match(css, /--erp-control-height:\s*36px;/);
  for (const marker of ['.hisabiq-button', 'button[role="combobox"]',
    'input[data-slot="input"]', '[data-hisabiq-numeric]', '[data-hisabiq-field-shell]']) {
    assert.ok(css.includes(marker), marker + ' participates in the 36px contract');
  }
  assert.match(css, /\[data-cart-row\] input, \[data-cart-row\] button \{ min-height: var\(--erp-control-height\); \}/);
  assert.doesNotMatch(css, /(?:min-)?height:\s*44px;/);
  assert.ok(css.includes('[data-number-stepper] > button'),
    'Stepper half-buttons stay internal, not full-height controls');
});

test('Sales table ledger link explicitly keeps compact inline sizing and navigation', () => {
  const source = read('src/pages/Sales.tsx');
  const start = source.indexOf("filtered.map((invoice) => (");
  const link = source.indexOf('data-compact-control', start);
  assert.ok(start !== -1 && link > start, 'Sales row marks linked customer as compact');
  const surrounding = source.slice(link - 180, link + 270);
  assert.match(surrounding, /button[\s\S]*data-compact-control/);
  assert.match(surrounding, /event\.stopPropagation\(\); navigate\(/);
  assert.match(surrounding, /leading-5 text-teal-700/);
  assert.match(source.slice(link, link + 700), /invoice\.phone/, 'phone stays next to customer link');
});

test('clear input remains a compact native button, not a primary action', () => {
  const source = read('src/components/Input.tsx');
  assert.match(source, /<button type="button" aria-label=\{'Clear '/);
  assert.match(source, /size-7 -translate-y-1\/2/);
});
