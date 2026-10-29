import type {IsoRange} from '../utils/dateRange.ts';
import type {Purchase} from '../types/erp.ts';
import type {LedgerStatement,PartyLedgerSource} from '../types/partyLedger.ts';
import {vendorBalances} from './vendorModel.ts';
import {projectVendorStatement,type VendorStatement} from './vendorLedger.ts';
import {projectVendorActivity,ordinaryVendorPurchaseDuePaisa,type VendorActivityRow} from './vendorActivity.ts';
import type {VendorPreviewState,VendorSide} from './vendorTypes.ts';

export type VendorPartyProfile={
 partyId:string;
 summary:{takenDuePaisa:number;givenDuePaisa:number;purchaseDuePaisa:number;priceNotSetBaseQty:number;priceNotSetCount:number};
 takenStatement:VendorStatement;
 givenStatement:VendorStatement;
 activity:VendorActivityRow[];
 documents:VendorActivityRow[];
 payments:VendorActivityRow[];
};

/** Read-only Vendor view shared between operational Vendor and Party profile. */
export function projectVendorPartyProfile(
 state:VendorPreviewState,purchases:readonly Purchase[],partyId:string,range:IsoRange
):VendorPartyProfile{
 const balances=vendorBalances(state,partyId);
 const activity=projectVendorActivity(state,partyId,purchases,range);
 return {
  partyId,
  summary:{
   takenDuePaisa:balances.knownPayablePaisa,
   givenDuePaisa:balances.knownReceivablePaisa,
   purchaseDuePaisa:ordinaryVendorPurchaseDuePaisa(purchases,partyId),
   priceNotSetBaseQty:balances.unpricedSourceBaseQty,
   priceNotSetCount:balances.unpricedSourceCount
  },
  takenStatement:projectVendorStatement(state,partyId,'payable',range),
  givenStatement:projectVendorStatement(state,partyId,'receivable',range),
  activity,
  documents:activity.filter(e=>['sourcing','issue','purchase'].includes(e.kind)),
  payments:activity.filter(e=>['settlement','purchase-payment'].includes(e.kind))
 };
}

/** Adapter to the same compact Party ledger presentation used for Suppliers.
 * A Vendor's two directions must be viewed separately: no fake net running.
 */
export function projectVendorPartyLedger(profile:VendorPartyProfile,side:VendorSide):LedgerStatement{
 const st=side==='payable'?profile.takenStatement:profile.givenStatement;
 const sign=side==='payable'?-1:1;
 const rows=st.rows.map(e=>{
  const delta=e.deltaPaisa/100;
  const debit=side==='payable'?Math.max(0,-delta):Math.max(0,delta);
  const credit=side==='payable'?Math.max(0,delta):Math.max(0,-delta);
  const source:PartyLedgerSource=e.kind==='settlement'?'supplier-payment'
   :e.kind==='opening'?'opening':'purchase';
  return {
   id:e.id,sourceId:e.sourceId,partyId:profile.partyId,relationship:'Vendor' as const,
   source,reference:e.reference??e.sourceId??e.operationId,date:e.date,description:e.description,
   debit,credit,sequence:e.sequence,status:'Active' as const,
   runningBalance:sign*e.runningPaisa/100
  };
 });
 return {partyId:profile.partyId,relationship:'Vendor',from:st.from,to:st.to,
  openingBalance:sign*st.openingPaisa/100,rows,
  periodDebit:(side==='payable'?st.periodDecreasePaisa:st.periodIncreasePaisa)/100,
  periodCredit:(side==='payable'?st.periodIncreasePaisa:st.periodDecreasePaisa)/100,
  closingBalance:sign*st.closingPaisa/100};
}
