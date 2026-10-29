import test from 'node:test';
import assert from 'node:assert/strict';
import { getPartyPreviewSnapshot, resetPartyPreviewForTest } from '../src/data/partyPreviewStore.ts';
import {
 getVendorPreviewSnapshot, subscribeVendorPreview, dispatchVendorPreview, resetVendorPreviewForTest
} from '../src/vendor/vendorPreviewStore.ts';

test('seed Vendor preview has linked real Party IDs and an unpriced source',()=>{
 resetPartyPreviewForTest();resetVendorPreviewForTest();
 const state=getVendorPreviewSnapshot();
 assert.ok(state.sources.some(s=>s.sourceKind==='sourcing'&&s.unitCostBasePaisa===null));
 assert.ok(state.sources.every(s=>getPartyPreviewSnapshot().parties.some(p=>p.id===s.vendorPartyId&&p.roles.includes('Vendor'))));
});
test('one simulation dispatch emits one notification; invalid, retry and unsubscribed do not emit',()=>{
 resetPartyPreviewForTest();resetVendorPreviewForTest();
 let notices=0;
 const off=subscribeVendorPreview(()=>{notices++;});
 const before=getVendorPreviewSnapshot();
 const cmd={type:'record-sourcing' as const,operationId:'t2-new',vendorPartyId:'v1',
   source:{id:'t2-source',productId:'p1',baseQty:2,date:'2026-10-10',unitCostBasePaisa:null}};
 const after=dispatchVendorPreview(cmd);
 assert.equal(after.revision,before.revision+1);
 assert.equal(notices,1);
 assert.equal(dispatchVendorPreview(cmd),after);
 assert.equal(notices,1);
 assert.throws(()=>dispatchVendorPreview({...cmd,operationId:'invalid',vendorPartyId:'not-a-vendor'}),/Vendor role/i);
 assert.equal(getVendorPreviewSnapshot(),after);
 assert.equal(notices,1);
 off();
 dispatchVendorPreview({...cmd,operationId:'next',source:{...cmd.source,id:'t2-next'}});
 assert.equal(notices,1);
});
test('reset restores demo source and clears test writes',()=>{
 resetVendorPreviewForTest();
 assert.equal(getVendorPreviewSnapshot().sources.some(s=>s.id==='t2-source'),false);
});
