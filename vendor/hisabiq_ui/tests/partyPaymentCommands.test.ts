import test from 'node:test';
import assert from 'node:assert/strict';
import {getPartyPreviewSnapshot,dispatchPartyPreview,resetPartyPreviewForTest} from '../src/data/partyPreviewStore.ts';
import {financeAccounts} from '../src/data/financeAccounts.ts';

const command=(override:Record<string,unknown>={})=>({
  type:'record-payment' as const,payload:{partyId:'c1',relationship:'Customer' as const,
    date:'2026-10-06',amount:100,discount:0,reason:'',
    splits:[{id:'s1',method:'Cash' as const,accountId:'acc-cash',amount:70},
      {id:'s2',method:'Mobile Banking' as const,accountId:'acc-bkash',amount:30}],
    ...override}
});
test('customer multi-payment is one audited source and total splits match cash',()=>{
 resetPartyPreviewForTest();const before=getPartyPreviewSnapshot();
 const after=dispatchPartyPreview(command());
 assert.equal(after.revision,before.revision+1);
 const payment=after.sources.filter(x=>x.kind==='customer-payment').at(-1);
 assert.equal(payment?.partyId,'c1'); assert.equal(payment?.credit,100);
 assert.equal(payment?.amountPaid,100);
 assert.deepEqual(payment?.paymentSplits?.map(p=>p.amount),[70,30]);
 assert.equal(payment?.provenance,'verified');
 assert.equal(after.audit.at(-1)?.sourceId,payment?.id);
});
test('invalid bank, wrong type, missing split, negative splits reject atomically',()=>{
 resetPartyPreviewForTest();
 for(const splits of [
  [{id:'a',method:'Bank',accountId:'acc-bkash',amount:100}],
  [{id:'a',method:'Cash',accountId:'nonexistent',amount:100}],
  [{id:'a',method:'Cash',accountId:'acc-cash',amount:-100}],
  [{id:'a',method:'Cash',accountId:'acc-cash',amount:99}]
 ]){
   const before=getPartyPreviewSnapshot();
   assert.throws(()=>dispatchPartyPreview(command({splits})));
   assert.strictEqual(getPartyPreviewSnapshot(),before);
 }
});
test('discount requires explanation, stays out of cash and does not increase refundable credit',()=>{
 resetPartyPreviewForTest();
 const before=getPartyPreviewSnapshot();
 assert.throws(()=>dispatchPartyPreview(command({discount:5,reason:''})),/reason/i);
 assert.strictEqual(getPartyPreviewSnapshot(),before);
 const after=dispatchPartyPreview(command({discount:5,reason:'Round-off authorized'}));
 const payment=after.sources.filter(x=>x.kind==='customer-payment').at(-1);
 assert.equal(payment?.amountPaid,100);
 assert.equal(payment?.credit,105);
 assert.equal(payment?.discount,5);
});
test('purchase payments have supplier-side debit sign and strict party relation',()=>{
 resetPartyPreviewForTest();
 assert.throws(()=>dispatchPartyPreview(command({partyId:'c1',relationship:'Supplier'})),/relationship/i);
 const after=dispatchPartyPreview(command({partyId:'s1',relationship:'Supplier',discount:0}));
 const source=after.sources.filter(x=>x.kind==='supplier-payment').at(-1);
 assert.equal(source?.debit,100);assert.equal(source?.credit,0);
});
test('counter preview accepts selected active finance accounts created in the current account list',()=>{
 resetPartyPreviewForTest();
 const createdAccount={...financeAccounts[1],id:'acc-preview-bank',name:'New bank account',number:'•••• 9999'};
 const payment=command({partyId:'s1',relationship:'Supplier',splits:[{id:'bank-row',method:'Bank',accountId:createdAccount.id,amount:100}]});
 const after=dispatchPartyPreview(payment,[...financeAccounts,createdAccount]);
 const source=after.sources.filter(row=>row.kind==='supplier-payment').at(-1);
 assert.equal(source?.partyId,'s1');
 assert.deepEqual(source?.paymentSplits?.map(split=>[split.accountId,split.amount]),[[createdAccount.id,100]]);
});
test('payment targeting invoice must belong to party and not predate it',()=>{
 resetPartyPreviewForTest();
 assert.throws(()=>dispatchPartyPreview(command({invoiceId:'PUR-000118'})),/invoice|party|reference/i);
 assert.throws(()=>dispatchPartyPreview(command({invoiceId:'INV-000241',date:'2026-09-20'})),/date|before/i);
});
