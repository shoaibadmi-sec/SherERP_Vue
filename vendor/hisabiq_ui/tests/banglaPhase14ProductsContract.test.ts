import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {productLabel} from '../src/i18n/productsCopy.ts';
import {bundleInventoryValue} from '../src/bundles/bundleProjection.ts';
import {products} from '../src/data/products.ts';

test('Phase 14 catalog uses existing three language modes without translating stored values',()=>{
 for(const english of ['Products','Product','Stock value','Add product','Edit product','Low stock']){
  assert.equal(productLabel('English',english),english);
  assert.equal(productLabel('English + Bangla',english),english);
 }
 assert.equal(productLabel('Bangla','Products'),'পণ্য');
 assert.equal(productLabel('Bangla','Add product'),'নতুন পণ্য');
 assert.equal(productLabel('Bangla','Low stock'),'কম স্টক');
 assert.equal(productLabel('Bangla','Stock value'),'স্টকের দাম');
 assert.equal(productLabel('Bangla','Out of stock'),'স্টক শেষ');
 assert.equal(productLabel('Bangla','Adjust stock'),'স্টক ঠিক করুন');
 for(const value of ['LED Bulb 12W','SKU-001','2 Box 5 Pcs','Generic / No brand','Electrical','all','low','out','৳12,450']){
  assert.equal(productLabel('Bangla',value),value,'unknown source/user data remains intact: '+value);
 }
});

test('Phase 14 only localizes Products catalogue presentation, never product source IDs or export columns',()=>{
 const src=readFileSync('src/pages/Products.tsx','utf8');
 for(const anchored of [
  "const {language,showHelper}=useUiCopy()",
  "const pl=(english:string)=>productLabel(language,english)",
  "category !== 'All'",
  "stockFilter === 'low'",
  "stockFilter === 'out'",
  "statusMeta[s].tone",
  "bundleInventoryValue(p)",
  "availableProductCategories()",
  "visible[column.id]",
  "useModuleColumns('products',columnStorageKey",
  "formatStock(p)",
  "downloadReport('hisabiq-products.csv'",
  "['Name','Bangla name','SKU','Category','Brand','Base unit','Stock (base unit)'",
  "<ProductSettings />",
  "<AddProductDialog",
  "<StockLotsView",
  "<StockHistoryView"
 ]) assert.ok(src.includes(anchored),'source invariant: '+anchored);
 assert.match(src,/\{pl\(statusMeta\[s\]\.label\)\}/);
 assert.match(src,/\{showHelper&&<span/);
 assert.match(src,/\{pl\('Add product'\)\}/);
 assert.match(src,/\{pl\('Clear filters'\)\}/);
 assert.doesNotMatch(src,/stockStatus\(pl\(/);
 assert.doesNotMatch(src,/setCategory\(pl\(/);
 assert.doesNotMatch(src,/setStockFilter\(pl\(/);
});


test('Products stock-value contract excludes virtual packages without changing ordinary stock valuation',()=>{
 const stock=products.find(p=>p.kind!=='Service'&&p.stock>0)!;
 assert.equal(bundleInventoryValue(stock),stock.stock*stock.purchasePrice);
 assert.equal(bundleInventoryValue({...stock,kind:'Bundle',stock:1000}),0);
 assert.equal(bundleInventoryValue({...stock,kind:'Service',stock:1000}),0);
});
