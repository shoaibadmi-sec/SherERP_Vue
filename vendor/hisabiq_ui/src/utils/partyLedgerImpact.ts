import type {PartyLedgerRow} from '../types/partyLedger';
import {financeTypeMeta} from './partyFinance.ts';
export type LedgerImpact={kind:'in'|'out'|'due'|'adjustment'|'opening'|'neutral';label:string};
export function ledgerImpact(row:PartyLedgerRow):LedgerImpact {
 if(row.source==='opening')return{kind:'opening',label:'Opening balance'};
 if(row.source==='finance'){
  const type=row.financeType;
  const meta=type?financeTypeMeta[type]:undefined;
  if(!meta)return{kind:'neutral',label:'Finance entry'};
  if(meta.opening)return{kind:'opening',label:'Opening balance'};
  return meta.direction==='in'?{kind:'in',label:'Money in'}
    :meta.direction==='out'?{kind:'out',label:'Money out'}
    :{kind:'neutral',label:'Finance entry'};
 }
 if(row.source==='customer-payment'||row.source==='supplier-credit-refund')return{kind:'in',label:'Money in'};
 if(row.source==='supplier-payment'||row.source==='customer-credit-refund')return{kind:'out',label:'Money out'};
 if(row.source==='sale')return{kind:'due',label:'Customer due increased'};
 if(row.source==='purchase')return{kind:'due',label:'Supplier payable increased'};
 if(row.source==='sale-return'||row.source==='purchase-return'||row.source==='customer-credit-apply')
  return{kind:'adjustment',label:'Non-cash adjustment'};
 return{kind:'neutral',label:row.source==='note'?'Note · No money movement':'Account entry'};
}
