import type { LedgerStatement } from '../types/partyLedger';

const safe=(value:unknown):string=>{
  let s=String(value??'');
  if(typeof value!=='number'&&/^[\s]*[=+@-]/.test(s))s="'"+s;
  return /[,\n\r"]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;
};
export function statementPrintRows(statement:LedgerStatement):LedgerStatement['rows'] {
  return statement.rows.filter(row=>row.status==='Active'&&!row.isCorrection);
}
export function serializePartyStatementCsv(
  statement:LedgerStatement,metadata:{business:string;party:string}
):string {
  const lines=[
    ['Business',metadata.business],
    ['Party',metadata.party],
    ['Relationship',statement.relationship],
    ['From',statement.from||'All time'],
    ['To',statement.to||'All time'],
    ['Opening balance',statement.openingBalance],
    ['Date','Type','Reference','Description','Debit','Credit','Running balance']
  ];
  for(const row of statementPrintRows(statement)){
    lines.push([row.date,row.source,row.reference??'',row.description,row.debit,row.credit,row.runningBalance]);
  }
  lines.push(['Period debit',statement.periodDebit],['Period credit',statement.periodCredit],['Closing balance',statement.closingBalance]);
  return '\uFEFF'+lines.map(row=>row.map(safe).join(',')).join('\r\n')+'\r\n';
}
