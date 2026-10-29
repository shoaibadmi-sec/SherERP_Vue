import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {productInventoryLabel,productInventoryOptions} from '../src/i18n/productInventoryCopy.ts';

test('Phase 16 inventory copy uses current language mode without translating stock source data',()=>{
 for(const text of ['Available lots','Source / lot','Stock movement audit trail','Add stock','Remove stock','Set exact stock','Discount type']){
  assert.equal(productInventoryLabel('English',text),text);
  assert.equal(productInventoryLabel('English + Bangla',text),text);
  assert.notEqual(productInventoryLabel('Bangla',text),text);
 }
 for(const userData of ['SKU-AB48','Gira','Gauge','Pcs','PUR-1049','SN-001','2026-10-15','Steel','2 Box 6 Pcs']){
  assert.equal(productInventoryLabel('Bangla',userData),userData);
 }
});
test('stock adjustments, reasons and offers keep stable source enums',()=>{
 const enums=['Add stock','Remove stock','Set exact stock'];
 assert.deepEqual(productInventoryOptions('Bangla',enums).map(x=>x.value),enums);
 const reasons=['Count correction','Damage / loss','Found stock','Personal use','Data correction','Other'];
 assert.deepEqual(productInventoryOptions('Bangla',reasons).map(x=>x.value),reasons);
 const discount=['Percentage','Fixed'];
 assert.deepEqual(productInventoryOptions('Bangla',discount).map(x=>x.value),discount);
 assert.equal(productInventoryOptions('Bangla',discount)[0].label,'শতাংশ');
 assert.equal(productInventoryOptions('English',discount)[0].label,'Percentage');
});
test('inventory display localization does not touch stock allocation, totals, validation, serial or offer business rules',()=>{
 const views=readFileSync('src/components/products/ProductInventoryViews.tsx','utf8');
 const dialog=readFileSync('src/components/products/ProductInventoryDialogs.tsx','utf8');
 for(const snippet of ['available * lot.unitCost','movement.quantity','movement.balance','lotExpiryState(','productById(','formatStock(','productFilter']){
  assert.ok((views+'\n'+dialog).includes(snippet),snippet);
 }
 for(const snippet of ['previewStock - product.stock','onSave({ newStock: previewStock, delta, reason, note: note.trim() })','toBaseQuantity(','duplicateSerials(','normalizeSerials(','requiredSerialCount(','validateOffer(','onSaveOffers(drafts)','priceForOfferUnit(','offerEffectiveInUnit(']){
  assert.ok(dialog.includes(snippet),snippet);
 }
 assert.ok(views.includes("const pl=(english:string)=>productInventoryLabel(language,english)"));
 assert.ok(dialog.includes("productInventoryOptions(language,['Count correction'"));
 assert.ok(dialog.includes("productInventoryOptions(language,['Percentage', 'Fixed'])"));
 assert.doesNotMatch(dialog,/setMode\(pl\(/);
 assert.doesNotMatch(dialog,/setReason\(pl\(/);
 assert.doesNotMatch(dialog,/discountType:\s*pl\(/);
});
