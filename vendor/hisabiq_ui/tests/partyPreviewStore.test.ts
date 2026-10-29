import test from 'node:test';
import assert from 'node:assert/strict';
import { getPartyPreviewSnapshot, subscribePartyPreview, dispatchPartyPreview, resetPartyPreviewForTest } from '../src/data/partyPreviewStore.ts';

test('create, update and multi-role selection are one atomic preview source', () => {
  resetPartyPreviewForTest();
  const initial = getPartyPreviewSnapshot();
  const created = dispatchPartyPreview({ type:'create-party', party: {name:'New Vendor',phone:'01812345678',area:'Sylhet',roles:['Supplier','Customer']} });
  assert.equal(created.revision, initial.revision+1);
  const party = created.parties.find(x=>x.name==='New Vendor');
  assert.ok(party);
  assert.deepEqual(party.roles, ['Supplier','Customer']);
  const edited = dispatchPartyPreview({ type:'update-party', id: party.id, patch: {name:'Updated Vendor',phone:'01911111111',area:'Dhaka',roles:['Supplier']} });
  assert.equal(edited.parties.find(x=>x.id===party.id)?.name,'Updated Vendor');
  assert.equal(initial.parties.find(x=>x.id===party.id),undefined);
  assert.equal(edited.audit.length,2);
});

test('duplicate id and invalid edit leave revision and state unchanged', () => {
  resetPartyPreviewForTest();
  const before = getPartyPreviewSnapshot();
  assert.throws(()=>dispatchPartyPreview({type:'create-party',party:{id:'c1',name:'Dup',roles:['Customer'],phone:'',area:''}}),/already exists/i);
  assert.throws(()=>dispatchPartyPreview({type:'update-party',id:'c1',patch:{name:' '}}),/name/i);
  assert.strictEqual(getPartyPreviewSnapshot(),before);
});

test('adding, editing and removing notes never changes monetary movements', () => {
  resetPartyPreviewForTest();
  const initial = getPartyPreviewSnapshot();
  const initialMoney = initial.sources.reduce((sum,source)=>sum+source.debit-source.credit,0);
  const withNote = dispatchPartyPreview({type:'add-note',partyId:'c1',text:'Call Friday'});
  const note=withNote.sources.find(x=>x.kind==='note'&&x.description==='Call Friday');
  assert.ok(note);
  dispatchPartyPreview({type:'edit-note',sourceId:note.id,text:'Call Monday'});
  const after=dispatchPartyPreview({type:'delete-note',sourceId:note.id});
  assert.equal(after.sources.find(x=>x.id===note.id)?.status,'Deleted');
  assert.equal(after.sources.reduce((sum,x)=>sum+x.debit-x.credit,0),initialMoney);
});

test('subscribers get one notification per valid state change', () => {
  resetPartyPreviewForTest();
  let count=0;
  const unsubscribe=subscribePartyPreview(()=>count++);
  dispatchPartyPreview({type:'add-note',partyId:'c1',text:'Test'});
  assert.equal(count,1);
  assert.throws(()=>dispatchPartyPreview({type:'add-note',partyId:'nope',text:'Test'}));
  assert.equal(count,1);
  unsubscribe();
  dispatchPartyPreview({type:'add-note',partyId:'c1',text:'Again'});
  assert.equal(count,1);
});

test('financially linked parties cannot be deactivated', () => {
  resetPartyPreviewForTest();
  assert.throws(()=>dispatchPartyPreview({type:'deactivate-party',id:'c1'}),/linked transactions/i);
});

test('notes belong to the selected relationship, never the first role by accident', () => {
  resetPartyPreviewForTest();
  const state=dispatchPartyPreview({type:'add-note',partyId:'c2',relationship:'Supplier',text:'Supplier discussion'});
  const note=state.sources.find(x=>x.kind==='note'&&x.description==='Supplier discussion');
  assert.equal(note?.relationship,'Supplier');
});
