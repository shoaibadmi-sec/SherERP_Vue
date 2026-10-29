import test from 'node:test';
import assert from 'node:assert/strict';
import { availableParties, createPreviewParty } from '../src/data/erpDemoStore.ts';
import { getPartyPreviewSnapshot, resetPartyPreviewForTest } from '../src/data/partyPreviewStore.ts';

test('supplier quick-add is visible to both Purchase and Party directory through one identity', () => {
  resetPartyPreviewForTest();
  createPreviewParty({id:'test-new-supplier',name:'Supplier from Purchase',phone:'017000333',area:'Dhaka',
    roles:['Supplier'],balance:0,avatarColor:'#000000',lastActivity:'Now'});
  assert.equal(availableParties().filter(p=>p.id==='test-new-supplier').length,1);
  assert.equal(getPartyPreviewSnapshot().parties.filter(p=>p.id==='test-new-supplier').length,1);
});
