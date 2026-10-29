import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
const s=readFileSync(new URL('../src/components/pos/InstallmentTermsPanel.tsx',import.meta.url),'utf8');
test('terms panel reuses shared controls and derives numbers from checkout totals',()=>{
 for(const word of ['AppDateRangePicker','NumericInput','onEditSchedule','paidPaisa','invoiceTotalPaisa','schedule','taka'])assert.ok(s.includes(word),word);
 assert.doesNotMatch(s,/onDownPaymentChange|onSellingPriceChange|<CartTable|<CustomerPicker/);
});
