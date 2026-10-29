import test from 'node:test';
import assert from 'node:assert/strict';
import {getPartyPreviewSnapshot,resetPartyPreviewForTest,commitPartyImportBatch,
 subscribePartyPreview} from '../src/data/partyPreviewStore.ts';
import {planPartyImport,resolvePartyImportDecisions} from '../src/import/partyImport.ts';
import type {StagedImportRow} from '../src/import/importTypes.ts';
import {activePartyOpening} from '../src/utils/partyOpening.ts';
import {customerSettlementAsOf,supplierSettlementAsOf} from '../src/utils/partySettlement.ts';
const row=(sourceRow:number,phone:string,amount=0,direction='Dr'):StagedImportRow=>({
 sourceSheet:'CSV',sourceRow,original:{},mapped:{name:'Imported '+sourceRow,phone,
 openingAmount:amount,openingDirection:amount?direction:'',openingDate:amount?'2026-10-01':''},
 issues:[],decision:'create'
});
const plan=(rows:StagedImportRow[],target:'customer'|'supplier',sessionId:string)=>
 planPartyImport(rows,target,getPartyPreviewSnapshot(),{sessionId,today:'2026-10-09'});
test('one revision and notification per batch with audited, unverified opening sources',()=>{
 resetPartyPreviewForTest();let calls=0;const unsubscribe=subscribePartyPreview(()=>{calls++});
 const before=getPartyPreviewSnapshot();
 const p=plan([row(2,'01766000001',550),row(3,'01766000002',400)],'customer','batch-1');
 assert.equal(p.changes.length,2);
 const first=commitPartyImportBatch(p);
 const after=getPartyPreviewSnapshot();
 assert.equal(first.created,2);assert.equal(first.openingSources,2);
 assert.equal(after.revision,before.revision+1);assert.equal(calls,1);
 assert.equal(after.parties.length,before.parties.length+2);
 const customer=after.parties.find(x=>x.phone==='01766000001')!;
 const opening=activePartyOpening(after.sources,customer.id,'Customer')!;
 assert.equal(opening.debit,550);assert.equal(opening.credit,0);
 assert.equal(opening.amountPaid,0);assert.equal(opening.provenance,'legacy-unverified');
 assert.deepEqual(opening.paymentSplits,[]);
 assert.equal(opening.importSessionId,'batch-1');assert.equal(opening.importSourceRow,2);
 assert.ok(after.audit.some(a=>a.importSessionId==='batch-1'&&a.sourceRow===2));
 assert.deepEqual(commitPartyImportBatch(p),first);
 assert.equal(getPartyPreviewSnapshot(),after);assert.equal(calls,1);
 unsubscribe();
});
test('same person can gain Customer and Supplier roles with independent opening directions',()=>{
 resetPartyPreviewForTest();
 const seed=getPartyPreviewSnapshot().parties.find(p=>p.id==='v1')!;
 const customerRows=resolvePartyImportDecisions([row(4,seed.phone,600)],'customer',getPartyPreviewSnapshot());
 const first=planPartyImport([{...customerRows[0],decision:'add-role'}],'customer',getPartyPreviewSnapshot(),
  {sessionId:'add-customer',today:'2026-10-09'});
 assert.equal(first.changes[0]?.action,'add-role');
 commitPartyImportBatch(first);
 const supplierRows=resolvePartyImportDecisions([row(6,seed.phone,750,'Cr')],'supplier',getPartyPreviewSnapshot());
 const second=planPartyImport([{...supplierRows[0],decision:'add-role'}],'supplier',getPartyPreviewSnapshot(),
  {sessionId:'add-supplier',today:'2026-10-09'});
 commitPartyImportBatch(second);
 const snap=getPartyPreviewSnapshot();
 const same=snap.parties.find(p=>p.id==='v1')!;
 assert.ok(same.roles.includes('Customer')&&same.roles.includes('Supplier'));
 assert.equal(activePartyOpening(snap.sources,'v1','Customer')?.debit,600);
 assert.equal(activePartyOpening(snap.sources,'v1','Supplier')?.credit,750);
});
test('invalid late source rolls back parties, openings, audit and revisions',()=>{
 resetPartyPreviewForTest();const before=getPartyPreviewSnapshot();let calls=0;
 const unsubscribe=subscribePartyPreview(()=>{calls++});
 const proposed=plan([row(2,'01766000201',300),row(3,'01766000202',400)],'customer','late-invalid');
 assert.equal(proposed.changes.length,2);
 const last=proposed.changes[1];
 if(last.opening)last.opening.date='2026-02-30';
 assert.throws(()=>commitPartyImportBatch(proposed),/date/i);
 assert.equal(getPartyPreviewSnapshot(),before);assert.equal(calls,0);
 unsubscribe();
});
test('stale snapshot, preexisting opening, and unconfirmed phone collision are blocked',()=>{
 resetPartyPreviewForTest();const before=getPartyPreviewSnapshot();
 const stale=plan([row(2,'01766000301')],'customer','stale');
 stale.baseRevision--;
 assert.throws(()=>commitPartyImportBatch(stale),/changed/i);
 const conflict=plan([row(3,'01911-305566',100)],'customer','no-confirm');
 assert.ok(conflict.issues.some(issue=>/Creating a separate Party with a matched phone/i.test(issue.message)), 'Planner must refuse an unconfirmed matched identity');
 assert.throws(()=>commitPartyImportBatch(conflict),/Resolve or skip invalid Party rows/i);
 const original=before.parties.find(p=>p.id==='c1')!;
 const mapped=row(4,original.phone,100);mapped.mapped.partyId='c1';
 const decided=resolvePartyImportDecisions([mapped],'customer',before);
 assert.equal(decided[0].decision,'skip');
 assert.equal(decided[0].match?.hasRole,true);
 assert.equal(getPartyPreviewSnapshot(),before);
});

test('unverified Customer credit cannot fund a refund; Supplier Dr remains a separate advance',()=>{
 resetPartyPreviewForTest();
 commitPartyImportBatch(plan([row(2,'01766000401',300,'Cr')],'customer','unverified-customer-credit'));
 commitPartyImportBatch(plan([row(2,'01766000402',450,'Dr')],'supplier','unverified-supplier-advance'));
 const snap=getPartyPreviewSnapshot();
 const customer=snap.parties.find(p=>p.phone==='01766000401')!;
 const supplier=snap.parties.find(p=>p.phone==='01766000402')!;
 const customerState=customerSettlementAsOf(snap.sources,customer.id,'2026-10-09');
 const supplierState=supplierSettlementAsOf(snap.sources,supplier.id,'2026-10-09');
 assert.equal(customerState.unverifiedCredit,300);
 assert.equal(customerState.refundableCredit,0);
 assert.equal(supplierState.unverifiedCredit,450);
 assert.equal(supplierState.refundableCredit,0);
 assert.equal(activePartyOpening(snap.sources,supplier.id,'Supplier')?.debit,450);
});
