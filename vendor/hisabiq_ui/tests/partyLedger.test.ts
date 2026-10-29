import test from 'node:test';
import assert from 'node:assert/strict';
import { projectPartyStatement, pagedStatementRows, computePartyBalanceSummary } from '../src/utils/partyLedger.ts';
import type { PartyLedgerRow, PartyPreviewState } from '../src/types/partyLedger.ts';

const make=(id:string,date:string,debit:number,credit:number,sequence:number,over:Partial<PartyLedgerRow>={}):PartyLedgerRow=>({
  id,partyId:'c1',relationship:'Customer',source:'sale',date,description:id,debit,credit,sequence,status:'Active',...over
});
const data=[
  make('opening','2026-09-01',100,0,1,{source:'opening'}),
  make('payment','2026-09-04',0,30,2,{source:'customer-payment'}),
  make('sale','2026-09-10',20,0,3),
];

test('date range statement includes opening, debit/credit and running balances',()=>{
  const result=projectPartyStatement(data,'c1','Customer',{from:'2026-09-04',to:'2026-09-10'},'2026-10-08');
  assert.equal(result.openingBalance,100);
  assert.equal(result.periodDebit,20);
  assert.equal(result.periodCredit,30);
  assert.equal(result.closingBalance,90);
  assert.deepEqual(result.rows.map(r=>r.runningBalance),[70,90]);
});
test('empty date period preserves opening and closing',()=>{
  const statement=projectPartyStatement(data,'c1','Customer',{from:'2026-09-05',to:'2026-09-09'},'2026-10-08');
  assert.equal(statement.rows.length,0);
  assert.equal(statement.openingBalance,70);
  assert.equal(statement.closingBalance,70);
});
test('all time resets opening; pagination does not recalculate row balance',()=>{
  const statement=projectPartyStatement(data,'c1','Customer',{from:'',to:''},'2026-10-08');
  assert.equal(statement.openingBalance,0);
  assert.equal(statement.closingBalance,90);
  assert.deepEqual(pagedStatementRows(statement,2,2).map(r=>r.runningBalance),[90]);
  assert.deepEqual(pagedStatementRows(statement,1,2,true).map(r=>r.runningBalance),[90,70]);
});
test('correction and reversed rows are excluded and same date keeps source sequence',()=>{
  const rows=[...data,make('same-second','2026-09-10',5,0,6),make('same-first','2026-09-10',4,0,4),
    make('reversed','2026-09-11',900,0,7,{status:'Reversed'}),
    make('correction','2026-09-11',100,0,8,{isCorrection:true}),
    make('note','2026-09-10',0,0,5,{source:'note'})];
  const statement=projectPartyStatement(rows,'c1','Customer',{from:'',to:''},'2026-10-08');
  assert.deepEqual(statement.rows.map(r=>r.id),['opening','payment','sale','same-first','note','same-second']);
  assert.equal(statement.closingBalance,99);
});
test('role selection cannot cross-net customer and supplier accounts',()=>{
  const supplier=make('purchase','2026-09-04',0,999,5,{relationship:'Supplier',source:'purchase'});
  assert.equal(projectPartyStatement([...data,supplier],'c1','Customer',{from:'',to:''},'2026-10-08').closingBalance,90);
  assert.equal(projectPartyStatement([...data,supplier],'c1','Supplier',{from:'',to:''},'2026-10-08').closingBalance,-999);
});
test('amounts use integer paisa and reject invalid/future dates',()=>{
  const rows=[make('a','2026-10-01',0.1,0,1),make('b','2026-10-02',0.2,0,2)];
  assert.equal(projectPartyStatement(rows,'c1','Customer',{from:'',to:''},'2026-10-08').closingBalance,0.3);
  assert.throws(()=>projectPartyStatement(rows,'c1','Customer',{from:'2026-10-01',to:''},'2026-10-08'),/both/i);
  assert.throws(()=>projectPartyStatement(rows,'c1','Customer',{from:'2026-10-11',to:'2026-10-12'},'2026-10-08'),/future/i);
  assert.throws(()=>projectPartyStatement(rows,'c1','Customer',{from:'2026-10-03',to:'2026-10-01'},'2026-10-08'),/after/i);
  assert.throws(()=>projectPartyStatement(rows,'c1','Customer',{from:'2026-02-31',to:'2026-10-01'},'2026-10-08'),/valid/i);
});
test('balance summary does not assume a negative net due is cash-backed refundable credit',()=>{
  const row=make('unproven','2026-09-01',0,125,1);
  const state:PartyPreviewState={parties:[],sources:[{id:row.id,partyId:row.partyId,relationship:row.relationship,
    kind:'customer-payment',date:row.date,sequence:1,description:'unproven',debit:0,credit:125,status:'Active'}],audit:[],revision:0};
  const summary=computePartyBalanceSummary(state,'c1','Customer');
  assert.equal(summary.netBalance,-125);
  assert.equal(summary.refundableCredit,0);
});
