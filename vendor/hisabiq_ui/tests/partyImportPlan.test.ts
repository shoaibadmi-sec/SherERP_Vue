import test from 'node:test';
import assert from 'node:assert/strict';
import {getPartyPreviewSnapshot,resetPartyPreviewForTest} from '../src/data/partyPreviewStore.ts';
import {planPartyImport,resolvePartyImportDecisions} from '../src/import/partyImport.ts';
import type {StagedImportRow} from '../src/import/importTypes.ts';
const row=(mapped:Record<string,unknown>,sourceRow=2):StagedImportRow=>({
 sourceSheet:'CSV',sourceRow,original:{},mapped:{name:'New Hardware',phone:'01755550000',area:'Dhaka',...mapped},
 issues:[],decision:'create'
});
const opts={sessionId:'planner-test',today:'2026-10-09'};
test('Customer Dr and Supplier Cr are independently planned, with no payment splits',()=>{
 resetPartyPreviewForTest();
 for(const [target,direction,role] of [['customer','Dr','Customer'],['supplier','Cr','Supplier']] as const){
  const p=planPartyImport([row({phone:target==='customer'?'01755550001':'01755550002',
   openingAmount:'750.25',openingDirection:direction,openingDate:'2026-10-01'})],
    target,getPartyPreviewSnapshot(),opts);
  assert.deepEqual(p.issues,[]);
  assert.equal(p.changes.length,1);
  assert.equal(p.changes[0].opening?.relationship,role);
  assert.equal(p.changes[0].opening?.side,direction==='Dr'?'debit':'credit');
  assert.equal(p.changes[0].opening?.amount,750.25);
 }
});
test('numeric Excel phone is not reconstructed from a missing leading zero',()=>{
 resetPartyPreviewForTest();const state=getPartyPreviewSnapshot();
 const invalid=planPartyImport([row({phone:1712345678})],'customer',state,opts);
 assert.equal(invalid.changes.length,0);
 assert.match(invalid.issues[0]?.message,/leading zero/i);
 const valid=planPartyImport([row({phone:'01712345678'})],'customer',state,opts);
 assert.equal(valid.changes.length,1);
 if(valid.changes[0].action==='create')assert.equal(valid.changes[0].draft.phone,'01712345678');
});
test('strong Party ID and suggestive phone need explicit Add Role or Create separately',()=>{
 resetPartyPreviewForTest();const state=getPartyPreviewSnapshot();
 const strong=resolvePartyImportDecisions([row({partyId:'c1',phone:'01711-482093'})],'supplier',state);
 assert.equal(strong[0].decision,'skip');assert.equal(strong[0].match?.kind,'strong');
 const suggested=resolvePartyImportDecisions([row({phone:'01711-482093'})],'supplier',state);
 assert.equal(suggested[0].decision,'skip');assert.equal(suggested[0].match?.kind,'suggested');
 const roleRows=resolvePartyImportDecisions([{...suggested[0],decision:'add-role'}],'supplier',state);
 assert.equal(roleRows[0].decision,'add-role');
 assert.equal(planPartyImport(roleRows,'supplier',state,opts).changes[0]?.action,'add-role');
 const separate=resolvePartyImportDecisions([{...suggested[0],decision:'create'}],'supplier',state);
 assert.equal(separate[0].decision,'create');
 assert.equal(planPartyImport(separate,'supplier',state,opts).changes[0]?.action,'create');
});
test('duplicate identity, unknown ID and existing relationship are not auto-imported',()=>{
 resetPartyPreviewForTest();const state=getPartyPreviewSnapshot();
 const result=resolvePartyImportDecisions([
  row({phone:'01799999999'},2),row({phone:'01799999999'},3),
  row({phone:'01711-482093',partyId:'c1'},4),
  row({phone:'01711111111',partyId:'missing-id'},5)
 ],'customer',state);
 assert.equal(result[0].decision,'create');
 assert.equal(result[1].decision,'skip');
 assert.equal(result[2].decision,'skip');
 assert.equal(result[3].decision,'reject');
});
test('impossible dates, negative opening and missing direction are invalid',()=>{
 resetPartyPreviewForTest();const state=getPartyPreviewSnapshot();
 for(const invalid of [
  {openingAmount:500,openingDirection:'Dr',openingDate:'2026-02-30'},
  {openingAmount:500,openingDirection:'Dr',openingDate:'2027-01-01'},
  {openingAmount:-1},
  {openingAmount:500,openingDate:'2026-10-01'},
  {openingAmount:100.001,openingDate:'2026-10-01',openingDirection:'Cr'}
 ]){
  const proposed=planPartyImport([row(invalid)],'customer',state,opts);
  assert.equal(proposed.changes.length,0);
  assert.ok(proposed.issues.some(issue=>issue.severity==='error'));
 }
});
