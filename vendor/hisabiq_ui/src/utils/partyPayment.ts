import { financeAccounts, type FinanceAccount } from '../data/financeAccounts.ts';
import { businessToday } from './dateRange.ts';
import type { PartyMoneySplit, PartyPaymentPayload, PartyRefundPayload } from '../types/partyLedger';

export const toPaisa=(n:number,label:string)=>{
  if(!Number.isFinite(n)||n<0||!Number.isSafeInteger(Math.round(n*100))||Math.abs(Math.round(n*100)/100-n)>0.0000001)
    throw new Error(label+' must be a nonnegative amount with two decimal places at most.');
  return Math.round(n*100);
};
export function validateBusinessDate(date:string):void {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T12:00:00Z'))
    ||new Date(date+'T12:00:00Z').toISOString().slice(0,10)!==date||date>businessToday())
    throw new Error('Choose a valid business date not in the future.');
}
export function validatePartySplits(splits:readonly PartyMoneySplit[],amount:number,accounts:readonly FinanceAccount[]=financeAccounts):void {
  const desired=toPaisa(amount,'Payment');
  if(!splits.length&&desired>0)throw new Error('Choose a payment source.');
  if(!desired&&splits.length)throw new Error('No payment source is needed for zero cash.');
  let total=0;
  const seen=new Set<string>();
  for(const row of splits){
    if(seen.has(row.id))throw new Error('Duplicate payment split.');
    seen.add(row.id);
    const val=toPaisa(row.amount,'Payment split');
    if(val<=0)throw new Error('Payment split must be positive.');
    const account=accounts.find(a=>a.id===row.accountId&&a.status==='Active');
    if(!account)throw new Error('Payment account not found or inactive.');
    if(row.method==='Cash'?!['Cash','Petty Cash'].includes(account.type):row.method!==account.type)
      throw new Error('Payment method does not match the selected account.');
    total+=val;
  }
  if(total!==desired)throw new Error('Payment split total does not match entered amount.');
}
export function validatePartyPayment(payload:PartyPaymentPayload,accounts:readonly FinanceAccount[]=financeAccounts):void {
  validateBusinessDate(payload.date);
  const cash=toPaisa(payload.amount,'Payment');
  const discount=toPaisa(payload.discount??0,'Discount');
  if(cash+discount<=0)throw new Error('Cash payment or settlement must be positive.');
  if(discount&&!payload.reason?.trim())throw new Error('Discount requires a reason.');
  validatePartySplits(payload.splits,payload.amount,accounts);
}
export function validatePartyRefund(payload:PartyRefundPayload):void {
  validateBusinessDate(payload.date);
  if(toPaisa(payload.amount,'Refund')<=0)throw new Error('Refund must be positive.');
  if(!payload.reason?.trim())throw new Error('Refund requires a reason.');
  validatePartySplits(payload.splits,payload.amount);
}
