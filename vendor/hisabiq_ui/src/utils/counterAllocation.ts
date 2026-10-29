import type {PartySourceRecord,PartyPaymentPayload} from '../types/partyLedger';

/** Open sale/purchase balances in paisa. Unassigned payments always settle oldest debts first.
 * Explicit invoice payments settle that invoice; any remaining credit is applied FIFO.
 * This is a UI preview projection; the shared party ledger remains authoritative for net due.
 */
export type CounterOpenInvoice={id:string;reference:string;date:string;due:number;description:string;opening:boolean};
export function counterOpenInvoices(sources:readonly PartySourceRecord[],partyId:string,asOf:string,relationship:'Customer'|'Supplier'='Customer'):CounterOpenInvoice[]{
 const customer=relationship==='Customer';
 const events=sources.filter(s=>s.partyId===partyId&&s.relationship===relationship&&s.status==='Active'&&s.date<=asOf)
  .sort((a,b)=>a.date.localeCompare(b.date)||a.sequence-b.sequence||a.id.localeCompare(b.id));
 type Row=CounterOpenInvoice & {remaining:number};
 const invoices:Row[]=[];
 let advance=0;
 const settle=(money:number,target?:string)=>{
  let left=money;
  const selected=target?invoices.find(r=>r.id===target||r.reference===target):undefined;
  const ordered=selected?[selected,...invoices.filter(r=>r!==selected)]:invoices;
  for(const row of ordered){
   if(left<=0)break;
   const paid=Math.min(row.remaining,left);
   row.remaining-=paid;left-=paid;
  }
  advance+=left;
 };
 for(const event of events){
  if(event.kind===(customer?'sale':'purchase')||event.kind==='opening'&&(customer?event.debit:event.credit)>0){
   const due=Math.max(0,Math.round((customer?event.debit:event.credit)*100));
   const row:Row={id:event.id,reference:event.reference||'Opening balance',date:event.date,
     description:event.description,due:due/100,remaining:due,opening:event.kind==='opening'};
   const applied=Math.min(advance,row.remaining);row.remaining-=applied;advance-=applied;
   invoices.push(row);
  }else if(event.kind===(customer?'customer-payment':'supplier-payment')||event.kind===(customer?'sale-return':'purchase-return')||(customer&&event.kind==='customer-credit-apply')
       ||event.kind==='opening'&&(customer?event.credit:event.debit)>0){
   settle(Math.max(0,Math.round((customer?event.credit:event.debit)*100)),event.invoiceId);
  }else if(event.kind===(customer?'customer-credit-refund':'supplier-credit-refund')){
   // A returned advance is not a payment against an invoice.
   advance=Math.max(0,advance-Math.round((customer?event.debit:event.credit)*100));
  }
 }
 return invoices.filter(row=>row.remaining>0).map(({remaining,...row})=>({...row,due:remaining/100}));
}
/** Validate at the source boundary as well as in Counter, including edits and stale bills. */
export function assertCounterInvoiceAllocation(sources:readonly PartySourceRecord[],payment:PartyPaymentPayload) {
 if(!payment.invoiceId)return;
 const matching=sources.filter(row=>row.partyId===payment.partyId&&row.relationship===payment.relationship&&
  (row.kind===(payment.relationship==='Customer'?'sale':'purchase')||row.kind==='opening'&&(payment.relationship==='Customer'?row.debit:row.credit)>0)&&row.status==='Active'&&row.date<=payment.date&&
  (row.id===payment.invoiceId||row.reference===payment.invoiceId));
 const source=matching.find(row=>row.id===payment.invoiceId)??(matching.length===1?matching[0]:undefined);
 if(!source)throw new Error('Invoice or purchase reference must belong to this party and predate payment.');
 const remaining=counterOpenInvoices(sources,payment.partyId,payment.date,payment.relationship).find(row=>row.id===source.id);
 if(!remaining||Math.round((payment.amount+(payment.discount??0))*100)>Math.round(remaining.due*100))
  throw new Error('Payment exceeds this invoice outstanding due. Refresh the customer or supplier balance and try again.');
}
export function counterAllocateOldest(invoices:readonly CounterOpenInvoice[],amount:number){
 let remaining=Math.max(0,Math.round(amount*100));
 return invoices.map(invoice=>{
  const applied=Math.min(Math.round(invoice.due*100),remaining);remaining-=applied;
  return {invoice:invoice.reference,amount:applied/100};
 }).filter(item=>item.amount>0);
}
