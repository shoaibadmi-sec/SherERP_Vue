import type { PartySourceRecord } from '../types/partyLedger';

type CreditLot = { id:string; kind:'advance'|'return'|'unverified'; remaining:number; verified:boolean };
export type CustomerSettlementState = {
  partyId:string; asOf:string; netBalance:number; invoiceDue:number; cashBackedAdvance:number;
  returnCredit:number; unverifiedCredit:number; nonCashAdjustment:number; consumedCredit:number;
  refundedCredit:number; refundableCredit:number; availableCredit:number;
};
export type SupplierSettlementState = CustomerSettlementState & { purchaseDue:number; supplierAdvance:number };
export type CustomerPaymentInput = {amount:number;discount?:number;reason?:string};
export type CustomerRefundInput = {amount:number};
export type SettlementPreview = {
  appliedAmount:number;discount:number;cashMoved:number;newDue:number;newCredit:number;
  sourceIds:string[];
};
const cents=(n:number)=>Math.round(n*100);
const amount=(n:number)=>Number((n/100).toFixed(2));
const assertAmount=(n:number,label:string)=>{
  if(!Number.isFinite(n)||n<0||Math.round(n*10000)!==Math.round(n*100)*100)
    throw new Error(label+' must be a nonnegative amount with at most two decimals.');
  return cents(n);
};
function asOfValid(date:string){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date)
    throw new Error('Valid business date required.');
}
function settle(events:readonly PartySourceRecord[],partyId:string,asOf:string,relationship:'Customer'|'Supplier'){
  asOfValid(asOf);
  const matching=events.filter(e=>e.partyId===partyId&&e.relationship===relationship&&e.status==='Active'&&e.date<=asOf)
    .sort((a,b)=>a.date.localeCompare(b.date)||a.sequence-b.sequence||a.id.localeCompare(b.id));
  let due=0,discount=0,consumed=0,refunded=0;
  const seen=new Set<string>();
  const lots:CreditLot[]=[];
  const consumeCredit=(need:number,requireVerified=false)=>{
    let remaining=need;
    for(const lot of lots){
      if(!remaining)break;
      if(requireVerified&&!lot.verified)continue;
      const applied=Math.min(lot.remaining,remaining);
      lot.remaining-=applied;remaining-=applied;
    }
    return need-remaining;
  };
  const addDue=(amountCents:number)=>{
    due+=amountCents;
    if(due>0){
      const applied=consumeCredit(due);
      due-=applied;
      consumed+=applied;
    }
  };
  const decreaseDue=(total:number,kind:CreditLot['kind'],id:string,verified:boolean)=>{
    const applied=Math.min(due,total);
    due-=applied;
    if(total>applied)lots.push({id,kind,remaining:total-applied,verified});
  };
  const isCustomer=relationship==='Customer';
  for(const e of matching){
    if(seen.has(e.id))continue;
    seen.add(e.id);
    if(!/^\d{4}-\d{2}-\d{2}$/.test(e.date))throw new Error('Invalid settlement event date.');
    const verified=e.provenance==='verified';
    const debit=assertAmount(e.debit,'Debit');
    const credit=assertAmount(e.credit,'Credit');
    const rebate=assertAmount(e.discount??0,'Discount');
    if((isCustomer&&e.kind==='sale')||(!isCustomer&&e.kind==='purchase')){
      addDue(isCustomer?debit:credit);
    }else if((isCustomer&&e.kind==='customer-payment')||(!isCustomer&&e.kind==='supplier-payment')){
      // In the new preview source credit/debit = cash + rebate, amountPaid = real cash.
      // Historic imported entries without amountPaid use the field as cash only.
      const cash=assertAmount(e.amountPaid??(isCustomer?e.credit:e.debit),'Cash received or paid');
      if(rebate>due)throw new Error('Discount exceeds open invoice due.');
      due-=rebate;discount+=rebate;
      decreaseDue(cash,'advance',e.id,verified);
    }else if((isCustomer&&e.kind==='sale-return')||(!isCustomer&&e.kind==='purchase-return')){
      decreaseDue(isCustomer?credit:debit,'return',e.id,verified);
    }else if((isCustomer&&e.kind==='customer-credit-refund')||(!isCustomer&&e.kind==='supplier-credit-refund')){
      const refund=isCustomer?debit:credit;
      if(consumeCredit(refund,true)!==refund)throw new Error('Refund exceeds available verified credit as of event date.');
      refunded+=refund;
    }else if(isCustomer&&e.kind==='customer-credit-apply'){
      const toApply=credit;
      if(toApply>due||consumeCredit(toApply)!==toApply)throw new Error('Credit application exceeds open invoice or available credit.');
      due-=toApply;consumed+=toApply;
    }else if(e.kind==='opening'){
      if(isCustomer&&debit) addDue(debit);
      if(!isCustomer&&credit) addDue(credit);
      // Unproven credit opening balance is still shown in net amount, but never refundable.
      const openingAdvance=isCustomer?credit:debit;
      if(openingAdvance)decreaseDue(openingAdvance,'unverified',e.id,false);
    }
  }
  const available=lots.reduce((n,lot)=>n+lot.remaining,0);
  const verified=lots.reduce((n,lot)=>n+(lot.verified?lot.remaining:0),0);
  const cash=lots.reduce((n,lot)=>n+(lot.verified&&lot.kind==='advance'?lot.remaining:0),0);
  const returned=lots.reduce((n,lot)=>n+(lot.verified&&lot.kind==='return'?lot.remaining:0),0);
  return {due,discount,consumed,refunded,available,verified,cash,returned,
    unknown:available-verified,net:isCustomer?due-available:available-due,
    matchedSourceIds:[...seen]};
}
export function customerSettlementAsOf(sources:readonly PartySourceRecord[],partyId:string,date:string):CustomerSettlementState{
  const s=settle(sources,partyId,date,'Customer');
  return {partyId,asOf:date,netBalance:amount(s.net),invoiceDue:amount(s.due),
    cashBackedAdvance:amount(s.cash),returnCredit:amount(s.returned),unverifiedCredit:amount(s.unknown),
    nonCashAdjustment:amount(s.discount),consumedCredit:amount(s.consumed),refundedCredit:amount(s.refunded),
    refundableCredit:amount(s.verified),availableCredit:amount(s.available)};
}
export function supplierSettlementAsOf(sources:readonly PartySourceRecord[],partyId:string,date:string):SupplierSettlementState{
  const s=settle(sources,partyId,date,'Supplier');
  const state:CustomerSettlementState={partyId,asOf:date,netBalance:amount(s.net),invoiceDue:amount(s.due),
    cashBackedAdvance:amount(s.cash),returnCredit:amount(s.returned),unverifiedCredit:amount(s.unknown),
    nonCashAdjustment:amount(s.discount),consumedCredit:amount(s.consumed),refundedCredit:amount(s.refunded),
    refundableCredit:amount(s.verified),availableCredit:amount(s.available)};
  return {...state,purchaseDue:state.invoiceDue,supplierAdvance:state.cashBackedAdvance};
}
export function validateCustomerPayment(state:CustomerSettlementState,input:CustomerPaymentInput):SettlementPreview {
  const cash=assertAmount(input.amount,'Payment');
  const rebate=assertAmount(input.discount??0,'Discount');
  if(cash+rebate<=0)throw new Error('Enter a positive cash payment or invoice discount.');
  const due=cents(state.invoiceDue);
  if(rebate>due)throw new Error('Discount exceeds available invoice due.');
  if(rebate&&!input.reason?.trim())throw new Error('Discount requires a reason.');
  const applied=Math.min(due-rebate,cash);
  return {appliedAmount:amount(applied),discount:amount(rebate),cashMoved:amount(cash),
    newDue:amount(due-rebate-applied),newCredit:amount(cents(state.availableCredit)+cash-applied),sourceIds:[]};
}
export function validateCustomerRefund(state:CustomerSettlementState,input:CustomerRefundInput):SettlementPreview {
  const requested=assertAmount(input.amount,'Refund');
  if(requested<=0)throw new Error('Refund amount must be positive.');
  if(requested>cents(state.refundableCredit))throw new Error('Refund exceeds available verified credit.');
  return {appliedAmount:amount(requested),discount:0,cashMoved:amount(-requested),newDue:state.invoiceDue,
    newCredit:amount(cents(state.availableCredit)-requested),sourceIds:[]};
}
