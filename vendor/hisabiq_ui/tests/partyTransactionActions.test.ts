import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchPartyPreview, getPartyPreviewSnapshot, resetPartyPreviewForTest } from '../src/data/partyPreviewStore.ts';
import { customerSettlementAsOf } from '../src/utils/partySettlement.ts';

const split=(amount:number)=>[{id:'cash1',method:'Cash' as const,accountId:'acc-cash',amount}];
const create=()=>dispatchPartyPreview({type:'create-party',party:{
 id:'source-edit-qa',name:'Source Edit Customer',phone:'01711000000',area:'Dhaka',roles:['Customer']
}});
const payment=(amount=70,date='2026-10-02')=>dispatchPartyPreview({type:'record-payment',payload:{
 partyId:'source-edit-qa',relationship:'Customer',date,amount,splits:split(amount),operationId:'qa-original'
}});
const refund=(amount=20)=>dispatchPartyPreview({type:'refund-credit',payload:{
 partyId:'source-edit-qa',relationship:'Customer',date:'2026-10-03',amount,splits:split(amount),
 reason:'Return unspent balance',operationId:'qa-refund'
}});

test('payment source edit updates its original record once and writes an audit event',()=>{
 resetPartyPreviewForTest();create();payment();
 const source=getPartyPreviewSnapshot().sources.find(x=>x.id==='party-payment:qa-original');
 assert.ok(source);
 const after=dispatchPartyPreview({type:'edit-source-payment',sourceId:source.id,
  reason:'Correct payment amount',payload:{partyId:'source-edit-qa',relationship:'Customer',
  date:'2026-10-02',amount:90,splits:split(90)}});
 assert.equal(after.sources.filter(x=>x.id===source.id).length,1);
 assert.equal(after.sources.find(x=>x.id===source.id)?.credit,90);
 assert.equal(customerSettlementAsOf(after.sources,'source-edit-qa','2026-10-04').refundableCredit,90);
 assert.equal(after.audit.at(-1)?.action,'edit-source-payment');
});

test('reversing preview payment preserves an audit record and blocks double reversal',()=>{
 resetPartyPreviewForTest();create();payment();
 const before=getPartyPreviewSnapshot();
 const after=dispatchPartyPreview({type:'reverse-source',sourceId:'party-payment:qa-original',
  reason:'Entered twice'});
 assert.equal(after.revision,before.revision+1);
 assert.equal(after.sources.find(x=>x.id==='party-payment:qa-original')?.status,'Reversed');
 assert.equal(customerSettlementAsOf(after.sources,'source-edit-qa','2026-10-04').refundableCredit,0);
 assert.throws(()=>dispatchPartyPreview({type:'reverse-source',sourceId:'party-payment:qa-original',reason:'Again'}),/active|reversed/i);
});

test('credit refund dependency prevents erasing or reducing its funding payment',()=>{
 resetPartyPreviewForTest();create();payment(70);refund(50);
 const before=getPartyPreviewSnapshot();
 assert.throws(()=>dispatchPartyPreview({type:'reverse-source',sourceId:'party-payment:qa-original',reason:'Correction'}),/refund|credit|available/i);
 assert.throws(()=>dispatchPartyPreview({type:'edit-source-payment',sourceId:'party-payment:qa-original',
  reason:'Lower original amount',payload:{partyId:'source-edit-qa',relationship:'Customer',
  date:'2026-10-02',amount:30,splits:split(30)}}),/refund|credit|available/i);
 assert.strictEqual(getPartyPreviewSnapshot(),before);
});

test('ledger preview never directly reverses original Sales invoice or legacy opening record',()=>{
 resetPartyPreviewForTest();
 const before=getPartyPreviewSnapshot();
 assert.throws(()=>dispatchPartyPreview({type:'reverse-source',sourceId:'sale:s241',reason:'Wrong'}),/source|original|allowed/i);
 assert.strictEqual(getPartyPreviewSnapshot(),before);
});
