import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {productFormLabel,productFormOptions} from '../src/i18n/productFormsCopy.ts';

test('Phase 15 Product Settings and Add/Edit locale labels retain machine values',()=>{
 const modes=['English','English + Bangla','Bangla'] as const;
 for(const language of modes){
  for(const field of ['Category','Unit','Brand','Selling price','Opening stock','Save product']){
   assert.ok(productFormLabel(language,field));
   if(language!=='Bangla')assert.equal(productFormLabel(language,field),field);
  }
 }
 assert.equal(productFormLabel('Bangla','Add product'),'নতুন পণ্য');
 assert.equal(productFormLabel('Bangla','Edit product'),'পণ্য বদলান');
 assert.equal(productFormLabel('Bangla','Selling price'),'বিক্রির দাম');
 assert.equal(productFormLabel('Bangla','Required'),'বাধ্যতামূলক');
 assert.equal(productFormLabel('Bangla','Product name is required.'),'পণ্যের নাম লিখুন।');
 for(const id of ['prod-003','stock','Pcs','Gira','Gauge','FEFO-01','SNO-1200','SKU-1004','৳1,245']) {
  assert.equal(productFormLabel('Bangla',id),id,'source/user identifiers never translated');
 }
});
test('enumeration dropdown keeps persisted IDs across English and Bangla',()=>{
 const values=['Off','Optional','Required'];
 assert.deepEqual(productFormOptions('Bangla',values).map(x=>x.value),values);
 assert.deepEqual(productFormOptions('Bangla',['Days','Months','Years']).map(x=>x.value),['Days','Months','Years']);
 assert.deepEqual(productFormOptions('Bangla',['FIFO','FEFO']).map(x=>x.value),['FIFO','FEFO']);
 assert.deepEqual(productFormOptions('English',values).map(x=>x.label),values);
 assert.deepEqual(productFormOptions('Bangla',values).map(x=>x.label),['বন্ধ','ঐচ্ছিক','বাধ্যতামূলক']);
});
test('the full product editor uses the app language and source-safe reusable handlers',()=>{
 const read=(path:string)=>readFileSync(path,'utf8');
 const editor=read('src/components/products/AddProductDialog.tsx');
 const form=read('src/components/products/form/useAddProductForm.ts');
 const draft=read('src/utils/productDraft.ts');
 const copy=read('src/hooks/useFormCopy.ts');
 const settings=read('src/components/products/ProductSettings.tsx');
 assert.match(copy,/useUiCopy/);assert.match(editor,/onSave\(product, opening\)/);
 for(const name of ['createPreviewProductCategory','createPreviewProductBrand','createPreviewProductUnit'])assert.ok(form.includes(name));
 for(const name of ['duplicateSerials','normalizeSerials','resolveUnitChain','unitRelations','unitPurchasePrices','unitSellPrices'])assert.ok(draft.includes(name));
 assert.match(settings,/\['categories', 'Categories', Tags\]/);
 assert.match(settings,/\['units', 'Units', Ruler\]/);assert.match(settings,/\['brands', 'Brands', Tags\]/);
 assert.doesNotMatch(draft,/setSerialTracking\(pl\(/);
});
