import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path: string) => readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const moduleTabs = [
  "src/components/parties/PartyDetail.tsx",
  "src/components/vendor/VendorTabs.tsx",
  "src/components/products/ProductSettings.tsx",
  "src/pages/Products.tsx",
  "src/pages/Sales.tsx",
  "src/pages/Purchases.tsx",
  "src/pages/Finance.tsx",
  "src/pages/Accounts.tsx",
  "src/pages/Reconciliation.tsx",
  "src/pages/Expenses.tsx",
  "src/pages/Warranty.tsx",
  "src/pages/OnlineSales.tsx"
] as const;

test('every existing ERP tab strip uses the shared moving underline', () => {
  for (const path of moduleTabs) {
    const source = read(path);
    assert.match(source, /<MotionTabList\b/, path + ': shared tablist');
    assert.match(source, /<MotionTabIndicator\b/, path + ': moving active underline');
    assert.doesNotMatch(source, /erp-tab-active/, path + ': no conflicting old inset underline');
  }
});

test('tab indicator scopes layout identity and supports reduced motion', () => {
  const source = read('src/motion/MotionTabList.tsx');
  assert.match(source, /LayoutGroup/);
  assert.match(source, /useId/);
  assert.match(source, /layoutId/);
  assert.match(source, /useReducedMotion/);
  assert.match(source, /data-motion-tab-indicator/);
});

test('Online Sales uses the shared underline rather than a selected filled pill', () => {
  const source = read('src/pages/OnlineSales.tsx');
  assert.doesNotMatch(source, /tab\s*===\s*key\s*\?\s*'bg-primary text-primary-foreground'/);
  assert.match(source, /<MotionTabIndicator active=\{tab\s*===\s*key\}/);
});
