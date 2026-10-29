import test from 'node:test';
import assert from 'node:assert/strict';
import { serializePartyStatementCsv, statementPrintRows } from '../src/utils/partyStatement.ts';
import type { LedgerStatement } from '../src/types/partyLedger.ts';

const statement:LedgerStatement={
  partyId:'c1',relationship:'Customer',from:'2026-09-04',to:'2026-09-10',
  openingBalance:100,periodDebit:20,periodCredit:30,closingBalance:90,
  rows:[{id:'1',partyId:'c1',relationship:'Customer',source:'customer-payment',
    date:'2026-09-04',description:'Payment',debit:0,credit:30,status:'Active',sequence:1,runningBalance:70},
    {id:'2',partyId:'c1',relationship:'Customer',source:'sale',date:'2026-09-10',
      reference:'INV-1',description:'=HYPERLINK("evil", "danger")',debit:20,credit:0,
      status:'Active',sequence:2,runningBalance:90}]
};
test('CSV includes full statement dates, opening, period and closing',()=>{
  const csv=serializePartyStatementCsv(statement,{business:'Sher Hardware',party:'রহমান হার্ডওয়্যার'});
  assert.match(csv,/Opening balance,100/);
  assert.match(csv,/Closing balance,90/);
  assert.match(csv,/Period debit,20/);
  assert.match(csv,/Period credit,30/);
  assert.match(csv,/রহমান হার্ডওয়্যার/);
  assert.match(csv,/2026-09-04/);
});
test('CSV escapes spreadsheet formulas and embedded quotes',()=>{
  const csv=serializePartyStatementCsv(statement,{business:'Shop',party:'Person'});
  assert.match(csv,/'=HYPERLINK/);
  assert.match(csv,/""evil""/);
  assert.doesNotMatch(csv,/,[=+@]/);
});
test('print rows preserve running balances and never create synthetic changes',()=>{
  assert.deepEqual(statementPrintRows(statement).map(r=>r.runningBalance),[70,90]);
  assert.equal(statementPrintRows({...statement,rows:[]}).length,0);
});

test('supplier credit balances remain numeric negative amounts in exported CSV',()=>{
  const negative={...statement,relationship:'Supplier' as const,openingBalance:-100,closingBalance:-90};
  const csv=serializePartyStatementCsv(negative,{business:'Shop',party:'Supplier'});
  assert.match(csv,/Opening balance,-100\r?\n/);
  assert.match(csv,/Closing balance,-90\r?\n/);
  assert.doesNotMatch(csv,/Opening balance,'-100/);
});
