import {getPartyPreviewSnapshot,subscribePartyPreview} from '../data/partyPreviewStore.ts';
import {applyVendorCommand} from './vendorModel.ts';
import {products} from '../data/products.ts';
import type {VendorPreviewCommand,VendorPreviewState} from './vendorTypes.ts';

/** No persistence, accounting posting or cross-module stock mutation. */
const listeners=new Set<()=>void>();
const identities=()=>getPartyPreviewSnapshot().parties.map(p=>({
 id:p.id,roles:[...p.roles],status:p.status??'Active' as const
}));
function fresh():VendorPreviewState {
 let state:VendorPreviewState={parties:identities(),sources:[],settlements:[],
   events:[],openings:[],sales:[],operations:[],revision:0,
   inventory:Object.fromEntries(products.filter(p=>p.kind!=='Service').map(p=>[p.id,Math.max(0,p.stock)]))};
 // Source/sale/demo links intentionally use existing Party and Product fixture IDs.
 const cases=[
 {type:'record-sourcing',operationId:'vendor-seed-unpriced',
  vendorPartyId:'v1',source:{id:'vendor-seed-source-pending',productId:'p1',
  baseQty:3,date:'2026-10-09',unitCostBasePaisa:null,reference:'DEMO-INV-201'}},
 {type:'record-sourcing',operationId:'vendor-seed-priced',
  vendorPartyId:'s3',source:{id:'vendor-seed-source-priced',productId:'p2',
  baseQty:2,date:'2026-10-09',unitCostBasePaisa:12000,reference:'DEMO-INV-202'}},
 {type:'issue-goods',operationId:'vendor-seed-issued',
  vendorPartyId:'v1',source:{id:'vendor-seed-goods-issued',productId:'p2',
  baseQty:1,date:'2026-10-08',unitCostBasePaisa:12800,reference:'DEMO-MEMO-16'}}
 ] satisfies VendorPreviewCommand[];
 for(const cmd of cases)if(state.parties.some(p=>p.id===cmd.vendorPartyId&&p.roles.includes('Vendor')))
   state=applyVendorCommand(state,cmd);
 return state;
}
let state=fresh();
export function getVendorPreviewSnapshot():VendorPreviewState{return state;}
export function subscribeVendorPreview(listener:()=>void):()=>void {
 listeners.add(listener);
 return ()=>{listeners.delete(listener);};
}
const notify=()=>{for(const f of listeners)f();};
export function dispatchVendorPreview(command:VendorPreviewCommand):VendorPreviewState {
 // Use current identity membership; Quick Add role changes remain visible.
 const parties=identities();
 const basis={...state,parties};
 const next=applyVendorCommand(basis,command);
 if(state.operations.includes(command.operationId))return state;
 state=next;
 notify();
 return state;
}
export function resetVendorPreviewForTest():void {
 state=fresh();notify();
}
// Recompute role identities when Party editor adds a Vendor or deactivates one.
subscribePartyPreview(()=>{
 const next=identities();
 if(JSON.stringify(next)===JSON.stringify(state.parties))return;
 state={...state,parties:next,revision:state.revision+1};
 notify();
});
