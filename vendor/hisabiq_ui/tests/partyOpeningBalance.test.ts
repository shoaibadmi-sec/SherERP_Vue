import test from 'node:test';
import assert from 'node:assert/strict';
import {getPartyPreviewSnapshot,dispatchPartyPreview,resetPartyPreviewForTest} from '../src/data/partyPreviewStore.ts';
import {projectPartyStatement,computePartyBalanceSummary} from '../src/utils/partyLedger.ts';
import type {PartyRelationship,PartyLedgerRow} from '../src/types/partyLedger.ts';

function opening(partyId:string,relationship:PartyRelationship,side:'debit'|'credit',amount:number,date='2026-09-01'){
 return {type:'set-opening' as const,payload:{partyId,relationship,side,amount,date,note:'Opening verified against paper register'}};
}
function rows(){return getPartyPreviewSnapshot().sources.map(s=>({
 id:s.id,partyId:s.partyId,relationship:s.relationship,source:s.kind,
 sourceId:s.id,date:s.date,sequence:s.sequence,debit:s.debit,credit:s.credit,
 description:s.description,status:s.status
})) as PartyLedgerRow[];}
test('new party has one opening per relationship with independent debit and credit signs',()=>{
 resetPartyPreviewForTest();
 dispatchPartyPreview({type:'create-party',party:{id:'open-qa',name:'Multiple role',phone:'01700000011',area:'Dhaka',roles:['Customer','Supplier']}});
 dispatchPartyPreview(opening('open-qa','Customer','debit',5000));
 dispatchPartyPreview(opening('open-qa','Supplier','credit',3200));
 assert.equal(projectPartyStatement(rows(),'open-qa','Customer',{from:'',to:''},'2026-10-09').closingBalance,5000);
 assert.equal(projectPartyStatement(rows(),'open-qa','Supplier',{from:'',to:''},'2026-10-09').closingBalance,-3200);
 assert.equal(getPartyPreviewSnapshot().sources.filter(s=>s.partyId==='open-qa'&&s.kind==='opening'&&s.status==='Active').length,2);
});
test('updating opening preserves reversed source and auditable correction without bank splits',()=>{
 resetPartyPreviewForTest();
 const before=getPartyPreviewSnapshot();
 const first=dispatchPartyPreview(opening('c1','Customer','debit',4500,'2026-08-28'));
 const second=dispatchPartyPreview(opening('c1','Customer','credit',1000,'2026-08-28'));
 assert.equal(second.revision,before.revision+2);
 assert.equal(second.sources.filter(s=>s.partyId==='c1'&&s.relationship==='Customer'&&s.kind==='opening'&&s.status==='Active').length,1);
 assert.equal(second.sources.filter(s=>s.partyId==='c1'&&s.relationship==='Customer'&&s.kind==='opening'&&s.status==='Reversed').length>=1,true);
 const active=second.sources.find(s=>s.partyId==='c1'&&s.relationship==='Customer'&&s.kind==='opening'&&s.status==='Active');
 assert.equal(active?.credit,1000);
 assert.equal(active?.amountPaid,0);
 assert.deepEqual(active?.paymentSplits,[]);
 assert.equal(second.audit.at(-1)?.action,'set-opening');
 assert.ok(second.audit.at(-1)?.before);
 assert.ok(second.audit.at(-1)?.after);
 assert.equal(first.audit.length+1,second.audit.length);
 const statement=projectPartyStatement(rows(),'c1','Customer',{from:'2026-09-01',to:'2026-10-09'},'2026-10-09');
 assert.ok(statement.openingBalance<0,'opening before statement date contributes to opening running balance');
 assert.equal(computePartyBalanceSummary(second,'c1','Customer').refundableCredit>=0,true);
});
test('credit opening is unverified, not eligible for customer refund',()=>{
 resetPartyPreviewForTest();
 dispatchPartyPreview({type:'create-party',party:{id:'open-credit',name:'Credit balance',phone:'01700000222',area:'Dhaka',roles:['Customer']}});
 dispatchPartyPreview(opening('open-credit','Customer','credit',1000));
 const summary=computePartyBalanceSummary(getPartyPreviewSnapshot(),'open-credit','Customer');
 assert.equal(summary.netBalance,-1000);
 assert.equal(summary.refundableCredit,0);
 assert.equal(summary.labels.unknownCredit,1000);
});
test('zero amount clears opening while retaining an audit record',()=>{
 resetPartyPreviewForTest();
 dispatchPartyPreview(opening('c1','Customer','debit',1500,'2026-08-28'));
 const next=dispatchPartyPreview(opening('c1','Customer','debit',0,'2026-08-28'));
 assert.equal(next.sources.filter(s=>s.partyId==='c1'&&s.relationship==='Customer'&&s.kind==='opening'&&s.status==='Active').length,0);
 assert.equal(next.audit.at(-1)?.action,'set-opening');
});
test('invalid parties, role, amount, date and chronology fail atomically',()=>{
 resetPartyPreviewForTest();
 for(const command of [
 opening('nonexistent','Customer','debit',100),
 opening('c1','Supplier','credit',100),
 opening('c1','Customer','debit',-5),
 opening('c1','Customer','debit',0.001),
 opening('c1','Customer','debit',5,'2099-01-01'),
 opening('c1','Customer','debit',5,'2026-10-09')
 ]){
  const snapshot=getPartyPreviewSnapshot();
  assert.throws(()=>dispatchPartyPreview(command));
  assert.strictEqual(getPartyPreviewSnapshot(),snapshot);
 }
});
