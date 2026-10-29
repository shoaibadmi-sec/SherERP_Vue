import test from 'node:test';
import assert from 'node:assert/strict';
import {reconciliationMatchError,canCompleteReconciliation,reconciliationCsv} from '../src/utils/reconciliation.ts';
import type {StatementTransaction,ErpReconciliationTransaction} from '../src/types/erp.ts';
const row:StatementTransaction={id:'s1',accountId:'a1',date:'2026-10-11',description:'Payment',amount:100,direction:'in',status:'Review'};
const entry:ErpReconciliationTransaction={id:'e1',accountId:'a1',date:row.date,type:'Other',party:'Shop',reference:'r1',amount:100,direction:'in'};
test('matches require same account, direction, finite positive amount and exact paisa',()=>{
 assert.equal(reconciliationMatchError(row,entry,[row]),null);
 for(const patch of [{accountId:'a2'},{direction:'out' as const},{amount:99.99},{amount:NaN},{amount:0}])assert.ok(reconciliationMatchError(row,{...entry,...patch},[row]));
});
test('one ERP entry cannot be reused and empty or ignored statements cannot finish',()=>{
 const matched={...row,status:'Matched' as const,matchedErpId:'e1'};
 assert.ok(reconciliationMatchError({...row,id:'s2'},entry,[matched]));
 assert.equal(canCompleteReconciliation([],[],0),false);
 assert.equal(canCompleteReconciliation([{...row,status:'Ignored'}],[entry],0),false);
 assert.equal(canCompleteReconciliation([matched],[entry],0),true);
 assert.equal(canCompleteReconciliation([matched,{...matched,id:'s2'}],[entry],0),false);
 assert.equal(canCompleteReconciliation([matched],[{...entry,amount:99}],0),false);
 assert.equal(canCompleteReconciliation([matched],[entry],1),false);
});
test('export preserves direction and escapes CSV formulas',()=>{
 const csv=reconciliationCsv([{...row,description:'=BAD,"value"'}]);
 assert.ok(csv.includes('"\'=BAD,""value"""'));
 assert.ok(csv.includes('"100","0","Review"'));
});
