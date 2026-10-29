import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=(path:string)=>readFileSync(path,'utf8');

test('Party ledger translations preserve source names, row identity and accounting directions',()=>{
 const copy=src('src/i18n/partyLedgerCopy.ts');
 for(const key of ["sale:","purchase:","finance:","opening:","'sale-return':","'purchase-return':","'customer-payment':","'supplier-payment':","'customer-credit-refund':","'supplier-credit-refund':","'customer-credit-apply':","expense:"]){
  assert.ok(copy.includes(key),key);
 }
 for(const action of ["view:","edit:","delete:","reverse:","print:","return:","source:"]){
  assert.ok(copy.includes(action),action);
 }
 assert.match(copy,/partyLedgerImpactText\(language,label\)/);
 const table=src('src/components/parties/LedgerTable.tsx');
 for(const expression of [
  "financial.columns.map(side", "row[side]","row.runningBalance","statement.periodDebit","statement.periodCredit",
  "statement.openingBalance","statement.closingBalance","row.source","row.reference",
  "row.attachment.name","onAction={onAction}","actionsForRow(row)","'Dr':'Cr'"
 ])assert.ok(table.includes(expression),expression);
 assert.match(table,/partyLedgerSourceLabel\(language,row.source\)/);
 const shared=src('src/components/parties/LedgerImpactAmount.tsx');
 assert.match(shared,/partyLedgerCaption\(language, row, info.label, info.kind\)/);
 assert.ok(table.includes('LedgerImpactAmount'),'Desktop reuses the shared translated amount renderer');
 assert.ok(table.includes("useUiCopy()"));
});
test('Party ledger action menu translates labels without altering permissions or callbacks',()=>{
 const s=src('src/components/parties/PartyLedgerRowActions.tsx');
 for(const expression of ["disabled={!enabled}","onAction(action,row)","onClick={toggle}","reason??partyLedgerActionLabel(language,action)","(action==='delete'||action==='reverse'"]){
  assert.ok(s.includes(expression),expression);
 }
 assert.ok(s.includes("partyLedgerActionLabel(language,action)"));
 assert.ok(s.includes("row.reference??row.id"));
});
test('Ledger dates, money, search/filter, source actions and printing remain delegated to existing components',()=>{
 const c=src('src/components/parties/PartyLedgerToolbar.tsx');
 for(const expression of ["value={range} onChange={onRange}","value={kind} onChange={onKind}","onQuery(event.target.value)","onPageSize(Number(value))","onClick={onStatement}","onClick={onReset}"]){
  assert.ok(c.includes(expression),expression);
 }
 const detail=src('src/components/parties/PartyDetail.tsx');
 assert.match(detail,/<LedgerTable statement=\{shownStatement\} visibleRows=\{shownRows\}/);
 const statement=src('src/components/parties/PartyStatementDialog.tsx');
 assert.ok(statement.includes("partyLedgerImpactText"));
});

test('Party ledger source badges and attachment controls retain real source actions',()=>{
 const badge=src('src/components/parties/PartyLedgerIndicators.tsx');
 for(const source of ['opening','purchase','sale','customer-payment','supplier-payment','sale-return','purchase-return','finance','note']){
  assert.ok(badge.includes(source+':')||badge.includes("'"+source+"':"),'source color '+source);
 }
 for(const expression of ['PartyLedgerAttachment','attachment.name','onClick={onClick}','Paperclip','PartyLedgerSourceBadge']){
  assert.ok(badge.includes(expression),'indicator '+expression);
 }
 const desktop=src('src/components/parties/LedgerTable.tsx');
 const responsive=src('src/components/parties/LedgerTableResponsive.tsx');
 for(const table of [desktop,responsive]){
  assert.ok(table.includes('PartyLedgerSourceBadge'),'source badge rendered');
  assert.ok(table.includes('PartyLedgerAttachment'),'attachment rendered');
  assert.ok(table.includes('onOpenAttachment(row)'),'existing attachment handler kept');
 }
});
test('Party tabs and ledger controls follow compact reference styling while preserving handlers',()=>{
 for(const path of ['src/components/parties/PartyDetail.tsx','src/components/parties/PartyDetailResponsive.tsx']){
  const view=src(path);
  assert.ok(view.includes('data-testid="party-tab-count"'));
  assert.ok(view.includes("tab===t.id ? 'bg-teal-50"),'active tab count tinted');
  assert.ok(view.includes('FilePlus2'),'new invoice icon');
  assert.ok(view.includes('onNewInvoice'),'invoice handler');
 }
 for(const path of ['src/components/parties/PartyLedgerToolbar.tsx','src/components/parties/PartyLedgerToolbarResponsive.tsx']){
  const view=src(path);
  assert.ok(view.includes('RotateCcw'),'Clear filters icon');
  assert.ok(view.includes('onClick={onReset}'),'reset handler');
  assert.ok(view.includes('onChange={onKind}'),'transaction type selection retained');
  assert.ok(view.includes('AppDateRangePicker'),'date selection retained');
 }
});
