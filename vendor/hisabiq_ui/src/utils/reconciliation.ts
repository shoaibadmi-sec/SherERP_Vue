import type {ErpReconciliationTransaction,StatementTransaction} from '../types/erp.ts';

/** Matching links two records; it must never silently change a financial amount. */
export function reconciliationMatchError(row:StatementTransaction,entry:ErpReconciliationTransaction,rows:readonly StatementTransaction[]):string|null {
 if(row.accountId!==entry.accountId)return 'Choose a transaction from the same account.';
 if(row.direction!==entry.direction)return 'Money in must match money in; money out must match money out.';
 if(!Number.isFinite(row.amount)||!Number.isFinite(entry.amount)||row.amount<=0||entry.amount<=0)return 'Both amounts must be greater than zero.';
 if(Math.round(row.amount*100)!==Math.round(entry.amount*100))return 'Amounts differ. Review the source before matching.';
 if(rows.some(other=>other.id!==row.id&&other.status==='Matched'&&other.matchedErpId===entry.id))return 'This transaction is already matched to another statement row.';
 return null;
}

export function canCompleteReconciliation(rows:readonly StatementTransaction[],entries:readonly ErpReconciliationTransaction[],difference:number):boolean {
 return rows.length>0&&Number.isFinite(difference)&&Math.abs(difference)<0.005&&rows.every(row=>{
  const entry=entries.find(item=>item.id===row.matchedErpId);
  return row.status==='Matched'&&entry!==undefined&&!reconciliationMatchError(row,entry,rows);
 });
}

export function reconciliationCsv(rows:readonly StatementTransaction[]):string {
 const cell=(value:string|number)=>{let text=String(value);if(typeof value==='string'&&/^\s*[=+@-]/.test(text))text="'"+text;return '"'+text.replace(/"/g,'""')+'"';};
 return '\uFEFF'+[['Date','Description','Reference','Money in','Money out','Status','Matched ERP'],...rows.map(row=>[row.date,row.description,row.reference??'',row.direction==='in'?row.amount:0,row.direction==='out'?row.amount:0,row.status,row.matchedErpId??''])].map(row=>row.map(cell).join(',')).join('\r\n');
}
