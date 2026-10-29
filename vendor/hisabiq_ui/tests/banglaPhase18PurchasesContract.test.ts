import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {purchaseLabel,purchaseReturnMethod} from '../src/i18n/purchaseCopy.ts';

test('Phase 18 Purchases presents correct labels in three existing language modes',()=>{
  for(const term of ['Purchases','Reset filters','Find purchase','Refund method','Purchase return history','Source history']){
    assert.equal(purchaseLabel('English',term),term);
    assert.equal(purchaseLabel('English + Bangla',term),term);
    assert.notEqual(purchaseLabel('Bangla',term),term);
  }
  assert.equal(purchaseLabel('Bangla','Supplier credit'),'সরবরাহকারীর জমা');
  assert.equal(purchaseLabel('Bangla','Due'),'দেনা');
  for(const source of ['PUR-000117','PR-000028','01711482093','Hossain Electric','MS Angle 1.5" · 45 Kg','৳4,410']){
    assert.equal(purchaseLabel('Bangla',source),source);
  }
});

test('Refund and supplier-credit rendering preserves raw method and source amount',()=>{
  const src=['Supplier credit','Cash refund','Refund ৳2,450','Refund ৳0'];
  assert.deepEqual(src.map(s=>purchaseReturnMethod('English',s)),src);
  assert.deepEqual(src.map(s=>purchaseReturnMethod('English + Bangla',s)),src);
  assert.deepEqual(src.map(s=>purchaseReturnMethod('Bangla',s)),['সরবরাহকারীর জমা','ক্যাশে ফেরত','ফেরত টাকা ৳2,450','ফেরত টাকা ৳0']);
});

test('Purchase UI localization does not mutate domain filters, source guards or CSV export values',()=>{
  const page=readFileSync('src/pages/Purchases.tsx','utf8');
  for(const contract of [
    "type Tab = 'purchases' | 'return' | 'return-history'",
    "useState('All suppliers')",
    "useState('All status')",
    "statusFilter === 'All status' || status === statusFilter",
    "supplierFilter === 'All suppliers' || p.supplier === supplierFilter",
    "const position=(p:Purchase)=>purchasePosition(p,events)",
    "sourceReturnable(returnPurchase)",
    "mode:'return'",
    "mode:'payment'",
    "mode:'correction'",
    "purchase={sourceAction.purchase}",
    "returnHistory.map(item => [item.id,item.date,item.purchase,item.supplier,item.items,item.amount,item.method])",
    "downloadReport('hisabiq-purchase-return-preview.csv', ['Reference','Date','Purchase','Supplier','Items','Amount','Method']",
    "printReport({title:p.ref,language",
  ]) assert.ok(page.includes(contract),'source contract missing: '+contract);
  assert.ok(page.includes("purchaseReturnMethod(language,item.method)"),'localize history only at display');
  assert.ok(page.includes(">{pl(returnError)}</p>"),'store original error; localize only rendering');
  assert.ok(page.includes('aria-label={`${pl("Actions for")} ${p.ref}`}'),'accessible action menu localized');
  assert.ok(!page.includes("setSupplierFilter(pl("),'filter identifier cannot change');
  assert.ok(!page.includes("setStatusFilter(pl("),'status identifier cannot change');
  assert.ok(!page.includes("downloadReport(pl("),'CSV machine schema cannot change');
});
