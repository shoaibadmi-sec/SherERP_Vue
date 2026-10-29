import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const field=readFileSync('src/components/MoneyUnitInput.tsx','utf8');
const form=readFileSync('src/components/products/form/AdvancedStockPanel.tsx','utf8');
test('approved unit rows reuse searchable master-data and joined numeric primitives',()=>{
 assert.match(form, /draft.unitLevels.map/);assert.match(form, /<SearchSelect/);assert.match(form, /<QuantityUnitInput/);
 assert.match(form, /Add another unit/);assert.match(form,/removeUnitLevel/);assert.match(form,/unitsLocked/);
});
test('joined inputs retain compact cart behavior and use shared search for product unit lists',()=>{
 for(const pattern of [/data-numeric-joined/,/stepperCompact=\{compact && !readOnlyAmount\}/,/readOnly=\{readOnlyAmount\}/,/<AppSelect /,/<SearchSelect /])assert.match(field,pattern);
});
