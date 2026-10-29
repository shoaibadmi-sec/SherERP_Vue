import test from 'node:test';
import assert from 'node:assert/strict';
import {dispatchPartyPreview,getPartyPreviewSnapshot,resetPartyPreviewForTest,quickAddPartyPreview,PartyQuickAddConflict} from '../src/data/partyPreviewStore.ts';
import {businessToday} from '../src/utils/dateRange.ts';

test('Quick Add merges all selected relationships without changing profile or historical sources',()=>{
  resetPartyPreviewForTest();
  const before=getPartyPreviewSnapshot();
  const original=before.parties.find(p=>p.id==='c1');
  assert.ok(original);
  const {party,reused}=quickAddPartyPreview({name:' RAHMAN HARDWARE ',phone:'01711 482093',area:'',nameBn:'',roles:['Supplier','Vendor']});
  assert.equal(reused,true);
  assert.deepEqual(party,{...original,roles:['Customer','Supplier','Vendor']});
  assert.strictEqual(getPartyPreviewSnapshot().sources,before.sources);
  assert.equal(getPartyPreviewSnapshot().parties.length,before.parties.length);
});

test('Quick Add retains existing opening balances and can open only a new relationship',()=>{
  resetPartyPreviewForTest();
  const before=getPartyPreviewSnapshot();
  assert.throws(()=>quickAddPartyPreview({name:'Rahman Hardware',phone:'01711-482093',area:'',roles:['Customer','Supplier']},[
    {relationship:'Customer',amount:1,side:'debit',date:businessToday()}
  ]),(error:unknown)=>error instanceof PartyQuickAddConflict&&error.reason==='existing-opening');
  assert.strictEqual(getPartyPreviewSnapshot(),before);
  const {party}=quickAddPartyPreview({name:'Rahman Hardware',phone:'01711-482093',area:'',roles:['Supplier']},[
    {relationship:'Supplier',amount:125.5,side:'credit',date:businessToday()}
  ]);
  const sources=getPartyPreviewSnapshot().sources;
  assert.equal(party.id,'c1');
  assert.deepEqual(sources.filter(s=>before.sources.some(old=>old.id===s.id)),before.sources);
  assert.equal(sources.find(s=>!before.sources.some(old=>old.id===s.id))?.credit,125.5);
});

test('Quick Add refuses inactive and ambiguous exact identities without changing state',()=>{
  resetPartyPreviewForTest();
  dispatchPartyPreview({type:'create-party',party:{id:'inactive-qa',name:'Inactive QA',phone:'01700991122',area:'',roles:['Customer']}});
  dispatchPartyPreview({type:'deactivate-party',id:'inactive-qa'});
  const inactive=getPartyPreviewSnapshot();
  assert.throws(()=>quickAddPartyPreview({name:'Inactive QA',phone:'01700991122',area:'',roles:['Supplier']}),
    (error:unknown)=>error instanceof PartyQuickAddConflict&&error.reason==='inactive');
  assert.strictEqual(getPartyPreviewSnapshot(),inactive);
  dispatchPartyPreview({type:'create-party',party:{name:'Rahman Hardware',phone:'01711-482093',area:'Different branch',roles:['Customer']}});
  const ambiguous=getPartyPreviewSnapshot();
  assert.throws(()=>quickAddPartyPreview({name:'Rahman Hardware',phone:'01711-482093',area:'',roles:['Supplier']}),
    (error:unknown)=>error instanceof PartyQuickAddConflict&&error.reason==='ambiguous');
  assert.strictEqual(getPartyPreviewSnapshot(),ambiguous);
});

test('same names with different phones stay separate and new profiles retain their entered fields',()=>{
  resetPartyPreviewForTest();
  const {party,reused}=quickAddPartyPreview({name:'Rahman Hardware',phone:'01700993344',area:'Sylhet',nameBn:'নতুন শাখা',roles:['Supplier']});
  assert.equal(reused,false);
  assert.notEqual(party.id,'c1');
  assert.equal(party.area,'Sylhet');
  assert.equal(party.nameBn,'নতুন শাখা');
});
