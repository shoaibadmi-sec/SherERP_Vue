import test from 'node:test';import assert from 'node:assert/strict';
import {purchaseSupplierGuard} from '../src/utils/purchaseSupplierGuard.ts';
test('embedded Vendor purchase cannot be assigned to another Party',()=>{
 assert.equal(purchaseSupplierGuard('v1','v1'),null);
 assert.match(purchaseSupplierGuard('s2','v1')??'',/selected Vendor/i);
 assert.match(purchaseSupplierGuard('','v1')??'',/selected Vendor/i);
 assert.equal(purchaseSupplierGuard('s2',undefined),null);
});
