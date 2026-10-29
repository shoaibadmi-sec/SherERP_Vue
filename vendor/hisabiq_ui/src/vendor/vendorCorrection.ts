import type {VendorPreviewState,VendorSource} from './vendorTypes.ts';

export type VendorCorrectionImpact={
 sourceId:string;vendorPartyId:string;sourceKind:'sourcing'|'issue';
 linkedSaleInvoiceId:string|null;
 linkedSettlementIds:string[];linkedPricingEventIds:string[];
 requiresCustomerReturnReview:boolean;
 reversible:boolean;blocker:string|null;
};
/**
 * Read-only impact assessment. It must never perform a sale return, restock
 * or erase Vendor money. Review is mandatory before correcting sale-linked
 * source records; source and Vendor subledger remain distinguishable.
 */
export function vendorCorrectionImpact(
 state:VendorPreviewState,sourceId:string
):VendorCorrectionImpact{
 const source:VendorSource|undefined=state.sources.find(s=>s.id===sourceId);
 if(!source)throw new Error('Vendor source not found.');
 const settlements=state.settlements.filter(s=>s.status==='Active'
  &&s.vendorPartyId===source.vendorPartyId
  &&s.allocations.some(a=>a.sourceId===sourceId));
 const reversedEvents=new Set(state.events.filter(e=>e.kind==='reversal'&&e.reversesEventId)
  .map(e=>e.reversesEventId));
 const pricingEvents=state.events.filter(e=>e.sourceId===sourceId&&e.kind==='pricing'
  &&!reversedEvents.has(e.id));
 let blocker:string|null=null;
 if(source.status==='Reversed')blocker='This Vendor source was already reversed.';
 else if(settlements.length)blocker='Reverse linked settlement(s) before changing this Vendor source.';
 else if(pricingEvents.length)blocker='Reverse the confirmed price before correcting the original sourcing.';
 return {sourceId,vendorPartyId:source.vendorPartyId,sourceKind:source.sourceKind,
  linkedSaleInvoiceId:source.sourceInvoiceId??null,
  linkedSettlementIds:settlements.map(s=>s.id),
  linkedPricingEventIds:pricingEvents.map(e=>e.id),
  requiresCustomerReturnReview:source.sourceKind==='sourcing'&&Boolean(source.sourceInvoiceId),
  reversible:!blocker,blocker};
}
