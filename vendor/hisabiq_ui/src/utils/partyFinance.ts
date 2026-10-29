import type {FinanceTransactionType} from '../data/financeAccounts';
import type {PartyLedgerRow,PartyPreviewState,PartyRelationship,PartySourceRecord} from '../types/partyLedger';

export type FinanceRole='Owner'|'Lender'|'Borrower';
type FinanceMeta={role:FinanceRole;entry:'debit'|'credit';direction:'in'|'out'|'none';opening:boolean};
export const financeTypeMeta:Partial<Record<FinanceTransactionType,FinanceMeta>>={
 'Owner Credit':{role:'Owner',entry:'credit',direction:'in',opening:false},
 'Owner Debit':{role:'Owner',entry:'debit',direction:'out',opening:false},
 'Lender Credit':{role:'Lender',entry:'credit',direction:'in',opening:false},
 'Lender Debit':{role:'Lender',entry:'debit',direction:'out',opening:false},
 'Borrower Debit':{role:'Borrower',entry:'debit',direction:'out',opening:false},
 'Borrower Credit':{role:'Borrower',entry:'credit',direction:'in',opening:false},
 'Opening Owner Capital':{role:'Owner',entry:'credit',direction:'none',opening:true},
 'Opening Loan':{role:'Lender',entry:'credit',direction:'none',opening:true},
 'Opening Borrower Loan':{role:'Borrower',entry:'debit',direction:'none',opening:true}
};

export function financeRelationshipSourceRows(state:PartyPreviewState,partyId:string,role:PartyRelationship):PartyLedgerRow[]{
 if(!['Owner','Lender','Borrower'].includes(role))return [];
 return state.sources.filter(x=>x.partyId===partyId&&x.relationship===role&&x.kind==='finance')
   .map(x=>({id:x.id,partyId:x.partyId,relationship:x.relationship,source:x.kind,sourceId:x.id,
     reference:x.reference,date:x.date,description:x.description,debit:x.debit,credit:x.credit,
     sequence:x.sequence,status:x.status,amountPaid:x.amountPaid,discount:x.discount,
     method:x.method,accountId:x.accountId}));
}
export function financePartyMoneyImpact(sources:readonly PartySourceRecord[],partyId:string):number {
 const paisa=sources.filter(s=>s.partyId===partyId&&s.kind==='finance'&&s.status==='Active')
   .reduce((sum,s)=>{
     const meta=s.financeType?financeTypeMeta[s.financeType]:null;
     if(!meta||meta.opening)return sum;
     const movement=(s.paymentSplits??[]).reduce((n,p)=>n+Math.round(p.amount*100),0);
     return sum+(meta.direction==='in'?movement:-movement);
   },0);
 return paisa/100;
}
