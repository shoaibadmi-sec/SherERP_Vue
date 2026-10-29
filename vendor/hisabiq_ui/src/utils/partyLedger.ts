import type { IsoRange } from './dateRange';
import { businessToday } from './dateRange.ts';
import { customerSettlementAsOf, supplierSettlementAsOf } from './partySettlement.ts';
import type { PartyBalanceSummary, PartyLedgerRow, PartyPreviewState, LedgerStatement, PartyRelationship } from '../types/partyLedger';

const paisa=(value:number)=>Math.round(value*100);
const money=(value:number)=>Math.round(value)/100;
function validIso(value:string):boolean {
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const d=new Date(value+'T12:00:00Z');
  return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;
}
function checkRange(range:IsoRange,today:string):void {
  if(!range.from&&!range.to)return;
  if(!range.from||!range.to)throw new Error('Choose both From and To dates.');
  if(!validIso(range.from)||!validIso(range.to))throw new Error('Choose valid ISO business dates.');
  if(range.from>range.to)throw new Error('From date cannot be after To date.');
  if(range.to>today)throw new Error('Statement To date cannot be in the future.');
}
export function projectPartyStatement(
  rows:readonly PartyLedgerRow[],partyId:string,relationship:PartyRelationship,
  range:IsoRange,today=businessToday()
):LedgerStatement {
  if(!partyId||!relationship)throw new Error('Select a party and relationship.');
  checkRange(range,today);
  const ordered=rows.filter(row=>row.partyId===partyId&&row.relationship===relationship
    &&row.status==='Active'&&!row.isCorrection&&validIso(row.date)&&row.date<=today)
    .sort((a,b)=>a.date.localeCompare(b.date)||a.sequence-b.sequence||a.id.localeCompare(b.id));
  const from=range.from;
  const to=range.to;
  let openingPaisa=0;
  let debitPaisa=0;
  let creditPaisa=0;
  let runningPaisa=0;
  const displayed:LedgerStatement['rows']=[];
  for(const row of ordered){
    const dr=paisa(row.debit),cr=paisa(row.credit);
    if(!Number.isFinite(dr)||!Number.isFinite(cr)||dr<0||cr<0)throw new Error('Invalid ledger money amount.');
    if(from&&row.date<from){openingPaisa+=dr-cr;continue;}
    if(to&&row.date>to)continue;
    if(!displayed.length)runningPaisa=openingPaisa;
    debitPaisa+=dr;creditPaisa+=cr;runningPaisa+=dr-cr;
    displayed.push({...row,runningBalance:money(runningPaisa)});
  }
  return {partyId,relationship,from:from||'',to:to||'',openingBalance:money(openingPaisa),
    rows:displayed,periodDebit:money(debitPaisa),periodCredit:money(creditPaisa),
    closingBalance:money(openingPaisa+debitPaisa-creditPaisa)};
}
export function pagedStatementRows(statement:LedgerStatement,page:number,pageSize:number,descending=false):LedgerStatement['rows'] {
  const size=Math.max(1,Math.min(200,Math.trunc(pageSize)||1));
  const index=Math.max(0,(Math.trunc(page)||1)-1)*size;
  const rows=descending?[...statement.rows].reverse():statement.rows;
  return rows.slice(index,index+size);
}
export function computePartyBalanceSummary(
  state:PartyPreviewState,partyId:string,relationship:PartyRelationship
):PartyBalanceSummary {
  const rows:PartyLedgerRow[]=state.sources.map(s=>({
    id:s.id,partyId:s.partyId,relationship:s.relationship,source:s.kind,
    sourceId:s.id,reference:s.reference,date:s.date,sequence:s.sequence,description:s.description,
    debit:s.debit,credit:s.credit,status:s.status,
    amountPaid:s.amountPaid,discount:s.discount,method:s.method,accountId:s.accountId
  }));
  const netBalance=projectPartyStatement(rows,partyId,relationship,{from:'',to:''}).closingBalance;
  if(relationship==='Customer'||relationship==='Supplier'){
    const snapshot=relationship==='Customer'
      ? customerSettlementAsOf(state.sources,partyId,businessToday())
      : supplierSettlementAsOf(state.sources,partyId,businessToday());
    return {relationship,netBalance:snapshot.netBalance,due:snapshot.invoiceDue,
      availableCredit:snapshot.refundableCredit,refundableCredit:snapshot.refundableCredit,
      labels:{due:snapshot.invoiceDue,netBalance:snapshot.netBalance,
        unknownCredit:snapshot.unverifiedCredit,cashBackedAdvance:snapshot.cashBackedAdvance,
        returnCredit:snapshot.returnCredit}};
  }
  const receives=['Customer','Borrower'].includes(relationship);
  const due=receives?Math.max(0,netBalance):Math.max(0,-netBalance);
  // Refundable balances require replayable credit provenance (settlement slice);
  // a generic negative balance must never authorize a cash refund.
  return {relationship,netBalance,due,availableCredit:0,refundableCredit:0,
    labels:{due,netBalance}};
}
