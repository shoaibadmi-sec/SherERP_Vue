/**
 * Vendor domain for the UI-only preview. Neither this store nor its balances
 * are backend accounting transactions. Quantities are always in base units,
 * known money in integer paisa; null price is explicitly unknown.
 */
export type VendorSide = 'payable' | 'receivable';
export type VendorSourceKind = 'sourcing' | 'issue';
export type VendorPricingStatus = 'unpriced' | 'partially-priced' | 'priced' | 'closed';
export type VendorSettlementKind = 'pay' | 'return-to-vendor' | 'receive-money' | 'receive-goods' | 'pay-and-return';

export type VendorPartyIdentity = {
 id:string; roles:readonly string[]; status?:'Active'|'Inactive';
};
export type VendorSource = {
 id:string; vendorPartyId:string; sourceKind:VendorSourceKind;
 productId:string; baseQty:number; readonly unitCostBasePaisa:number|null;
 sourceAmountPaisa:number|null; pricingStatus:VendorPricingStatus;
 /** Quantity priced at original quote after any earlier in-kind returns. */ pricedBaseQty?:number;
 date:string; reference?:string; sourceInvoiceId?:string; sourceSaleLineId?:string;
 memoId?:string; correctsSourceId?:string; status:'Active'|'Reversed';
};
export type VendorSourceInput = Pick<VendorSource,'id'|'productId'|'baseQty'|'date'|'unitCostBasePaisa'> &
 Partial<Pick<VendorSource,'reference'|'sourceInvoiceId'|'sourceSaleLineId'|'memoId'>>;
export type VendorOpening = {
 id:string; vendorPartyId:string; side:VendorSide; openingAmountPaisa:number;
 date:string; reason?:string; operationId:string;status?:'Active'|'Reversed';
};
export type VendorSettlementAllocation = {sourceId:string;amountPaisa:number|null;baseQty?:number};
export type VendorSettlement = {
 id:string;vendorPartyId:string;side:VendorSide;kind:VendorSettlementKind;date:string;
 amountPaisa:number|null;allocations:VendorSettlementAllocation[];
 paymentSplits?:Array<{id:string;method:'Cash'|'Bank'|'Mobile Banking';accountId:string;amountPaisa:number}>;
 reason?:string;status:'Active'|'Reversed';operationId:string;
};
export type VendorLedgerEvent = {
 id:string;vendorPartyId:string;side:VendorSide;kind:'opening'|'sourcing'|'issue'|'pricing'|'settlement'|'reversal';
 sourceId?:string;reference?:string;date:string;sequence:number;
 deltaPaisa:number;operationId:string;description:string;status:'Active'|'Reversed';
 /** Reversal is a compensating event: original event remains visible and active. */
 reversesEventId?:string;actor?:string;reason?:string;
};
export type VendorPreviewSale = {
 id:string;invoiceId:string;date:string;vendorPartyIds:string[];
 sourceIds:string[];sourceMode:'demo';
};
export type VendorPreviewState = {
 parties:VendorPartyIdentity[];sources:VendorSource[];
 settlements:VendorSettlement[];events:VendorLedgerEvent[];
 openings:VendorOpening[];sales:VendorPreviewSale[];
 operations:string[];revision:number;
 /** Replay protection: exact retry is a no-op; conflicting payload must reject. */
 operationPayloads?:Record<string,string>;
 /** Standard Purchases received in demo inventory once per invoice ID. */
 recordedPurchaseIds?:string[];
 /** Simulated available owned product quantity; never production stock. */ inventory?:Record<string,number>;
};
export type VendorPreviewCommand =
 | {type:'record-sourcing'|'issue-goods';operationId:string;vendorPartyId:string;source:VendorSourceInput}
 | {type:'record-purchase-inventory';operationId:string;vendorPartyId:string;purchaseId:string;lines:Array<{productId:string;baseQty:number}>}
 | {type:'issue-goods-memo'|'record-sourcing-memo';operationId:string;vendorPartyId:string;memoId:string;date:string;reference?:string;sources:VendorSourceInput[]}
 | {type:'set-opening';operationId:string;vendorPartyId:string;side:VendorSide;amountPaisa:number;date:string;reason?:string}
 | {type:'set-source-price';operationId:string;vendorPartyId:string;sourceId:string;date:string;unitCostBasePaisa:number;reason?:string}
 | {type:'settle-source';operationId:string;vendorPartyId:string;side:VendorSide;kind:VendorSettlementKind;date:string;amountPaisa:number|null;allocations:VendorSettlementAllocation[];paymentSplits?:VendorSettlement['paymentSplits'];reason?:string}
 | {type:'clear-source-due';operationId:string;vendorPartyId:string;sourceId:string;date:string;cashPaisa:number;returnBaseQty:number;paymentSplits:VendorSettlement['paymentSplits'];reason?:string}
 | {type:'reverse-event';operationId:string;vendorPartyId:string;eventId:string;date:string;reason:string;actor:string}
 | {type:'correct-source';operationId:string;vendorPartyId:string;sourceId:string;date:string;reason:string;actor:string;replacement:VendorSourceInput}
 | {type:'simulate-pos-sale';operationId:string;sale:VendorPreviewSale;sources:Array<{vendorPartyId:string;source:VendorSourceInput}>};
export type VendorBalances = {
 knownPayablePaisa:number;knownReceivablePaisa:number;
 unpricedSourceBaseQty:number;unpricedSourceCount:number;
};
export type VendorOutstanding = {
 unpricedBaseQty:number;pricedBaseQty:number;returnedBaseQty:number;
 monetaryDuePaisa:number|null;
};
