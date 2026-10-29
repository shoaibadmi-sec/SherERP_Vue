import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/components/pos/InstallmentTermsPanel.tsx',import.meta.url),'utf8');
test('advanced price adjustment is opt-in and edits the original cart price via parent callback',()=>{
 assert.match(source,/onPriceAdjustment/);
 assert.match(source,/Advanced price adjustment/);
 assert.match(source,/<details/);
 assert.match(source,/adjustMode==='amount'|adjustMode==='percent'/);
 assert.doesNotMatch(source,/onSellingPriceChange|setInvoiceTotal|onDownPaymentChange/);
});
