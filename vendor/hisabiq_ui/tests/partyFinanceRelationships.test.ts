import test from 'node:test';
import assert from 'node:assert/strict';
import {getPartyPreviewSnapshot,dispatchPartyPreview,resetPartyPreviewForTest} from '../src/data/partyPreviewStore.ts';
import {projectPartyStatement} from '../src/utils/partyLedger.ts';
import {financeRelationshipSourceRows,financePartyMoneyImpact} from '../src/utils/partyFinance.ts';
import {financePersonIdByPartyId,normalizePartyFixture} from '../src/data/partyFixtureAdapter.ts';
import {parties,ledgerEntries} from '../src/data/parties.ts';
import type {PartyFinancePayload,PartyRelationship} from '../src/types/partyLedger.ts';

const create=()=>dispatchPartyPreview({type:'create-party',party:{
 id:'finance-party-qa',name:'Mixed Role Person',roles:['Owner','Lender','Borrower'],phone:'01700011223',area:'Dhaka'}});
const payload=(type:PartyFinancePayload['financeType'],relationship:PartyFinancePayload['relationship'],amount=100):PartyFinancePayload=>{
 const opening=type.startsWith('Opening ');
 return {partyId:'finance-party-qa',relationship,financeType:type,date:'2026-10-05',amount,
   operationId:'finance-'+type.replaceAll(' ','-'),note:'Recorded in preview',
   splits:opening?[]:[{id:'split-1',method:'Cash',accountId:'acc-cash',amount}]};
};
const net=(relationship:PartyRelationship)=>{
 const state=getPartyPreviewSnapshot();
 return projectPartyStatement(financeRelationshipSourceRows(state,'finance-party-qa',relationship),
  'finance-party-qa',relationship,{from:'',to:''},'2026-10-08').closingBalance;
};
test('owner investment and withdrawal change capital without affecting other roles',()=>{
 resetPartyPreviewForTest();create();
 dispatchPartyPreview({type:'record-finance',payload:payload('Owner Credit','Owner',100)});
 dispatchPartyPreview({type:'record-finance',payload:payload('Owner Debit','Owner',20)});
 assert.equal(net('Owner'),-80);
 assert.equal(net('Lender'),0);
 assert.equal(net('Borrower'),0);
});
test('lender credit/debit are liability and borrower debit/credit are loan receivable',()=>{
 resetPartyPreviewForTest();create();
 dispatchPartyPreview({type:'record-finance',payload:payload('Lender Credit','Lender',500)});
 dispatchPartyPreview({type:'record-finance',payload:payload('Lender Debit','Lender',150)});
 dispatchPartyPreview({type:'record-finance',payload:payload('Borrower Debit','Borrower',240)});
 dispatchPartyPreview({type:'record-finance',payload:payload('Borrower Credit','Borrower',40)});
 assert.equal(net('Lender'),-350);
 assert.equal(net('Borrower'),200);
});
test('opening capital and loans change relation only, not cash/bank',()=>{
 resetPartyPreviewForTest();create();
 for(const [type,relationship] of [
  ['Opening Owner Capital','Owner'],['Opening Loan','Lender'],['Opening Borrower Loan','Borrower']
 ] as const){
  dispatchPartyPreview({type:'record-finance',payload:payload(type,relationship,1000)});
 }
 const state=getPartyPreviewSnapshot();
 assert.equal(net('Owner'),-1000);assert.equal(net('Lender'),-1000);assert.equal(net('Borrower'),1000);
 assert.equal(financePartyMoneyImpact(state.sources,'finance-party-qa'),0);
 assert.equal(state.sources.filter(x=>x.partyId==='finance-party-qa'&&x.kind==='finance'&&x.financeType?.startsWith('Opening')).length,3);
});
test('role mismatch and unsupported account splits do not change preview state',()=>{
 resetPartyPreviewForTest();create();
 const before=getPartyPreviewSnapshot();
 assert.throws(()=>dispatchPartyPreview({type:'record-finance',payload:payload('Lender Credit','Owner')}),/role|type|relationship/i);
 assert.throws(()=>dispatchPartyPreview({type:'record-finance',payload:{...payload('Owner Credit','Owner'),splits:[]}}),/payment|split|source/i);
 assert.throws(()=>dispatchPartyPreview({type:'record-finance',payload:{...payload('Opening Loan','Lender'),splits:[{id:'bad',method:'Cash',accountId:'acc-cash',amount:100}]}}),/opening|money|source/i);
 assert.strictEqual(getPartyPreviewSnapshot(),before);
});
test('preview finance transactions reverse with audit, but original Finance source remains protected',()=>{
 resetPartyPreviewForTest();create();
 const created=dispatchPartyPreview({type:'record-finance',payload:payload('Lender Credit','Lender',250)});
 const source=created.sources.find(x=>x.partyId==='finance-party-qa'&&x.kind==='finance');
 assert.ok(source);
 assert.equal(financePartyMoneyImpact(created.sources,'finance-party-qa'),250);
 const reversed=dispatchPartyPreview({type:'reverse-source',sourceId:source.id,reason:'Finance record was duplicate'});
 assert.equal(reversed.sources.find(x=>x.id===source.id)?.status,'Reversed');
 assert.equal(net('Lender'),0);
 assert.equal(financePartyMoneyImpact(reversed.sources,'finance-party-qa'),0);
 assert.equal(reversed.audit.at(-1)?.action,'reverse-source');
 assert.throws(()=>dispatchPartyPreview({type:'reverse-source',sourceId:'finance:FIN-000188',reason:'Test'}),/original|not allowed|source/i);
});
test('explicit owner finance identity mapping never auto-matches lender or borrower by name',()=>{
 const snapshot=normalizePartyFixture(parties,ledgerEntries);
 assert.equal(financePersonIdByPartyId.o1,'fp1');
 assert.equal(financePersonIdByPartyId.l1,undefined);
 assert.equal(financePersonIdByPartyId.b1,undefined);
 const owner=financeRelationshipSourceRows(snapshot,'o1','Owner');
 assert.ok(owner.some(x=>x.sourceId==='finance:FIN-000188'));
 const lender=financeRelationshipSourceRows(snapshot,'l1','Lender');
 assert.ok(lender.every(x=>x.sourceId!=='finance:FIN-000187'));
});
