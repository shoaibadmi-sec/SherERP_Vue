import test from 'node:test';
import assert from 'node:assert/strict';
import {counterExpensePayment} from '../src/utils/counterExpensePayment.ts';
import type {FinanceAccount} from '../src/data/financeAccounts.ts';
import {getExpensePreviewSnapshot,resetExpensePreviewForTest,savePreviewExpense} from '../src/data/expensePreviewStore.ts';
import {businessToday} from '../src/utils/dateRange.ts';

const rocket:FinanceAccount={id:'rocket-qa',type:'Mobile Banking',name:'Rocket Merchant',institution:'Rocket',status:'Active',balance:500,openingBalance:500,lastActivity:''};

test('Counter expenses retain exact source IDs and do not guess MFS providers from display names',()=>{
  const split={id:'source-1',method:'Mobile Banking' as const,accountId:rocket.id,amount:7.25};
  assert.deepEqual(counterExpensePayment(split,[rocket]),{...split,method:'Mobile Banking',account:'Rocket Merchant'});
  const renamed={...rocket,name:'Nagad promotion',institution:'bKash'};
  assert.equal(counterExpensePayment(split,[renamed]).method,'bKash','explicit provider is authoritative even after a display-name change');
  assert.throws(()=>counterExpensePayment({...split,accountId:'missing'},[rocket]),/not found/);
});

test('duplicate bank names and numbers keep distinct identities in expense sources',()=>{
  const accounts:FinanceAccount[]=[{...rocket,id:'bank-one',name:'Shared bank',institution:'Bank',type:'Bank',number:'1234'},
    {...rocket,id:'bank-two',name:'Shared bank',institution:'Bank',type:'Bank',number:'1234'}];
  const one=counterExpensePayment({id:'one',method:'Bank',accountId:'bank-one',amount:1},accounts);
  const two=counterExpensePayment({id:'two',method:'Bank',accountId:'bank-two',amount:2},accounts);
  assert.equal(one.accountId,'bank-one');assert.equal(two.accountId,'bank-two');
  assert.notEqual(one.account,two.account);
});

test('expense source save and metadata correction retain a generic MFS account and method',()=>{
  resetExpensePreviewForTest();
  const payment=counterExpensePayment({id:'source-1',method:'Mobile Banking',accountId:rocket.id,amount:7.25},[rocket]);
  const expense={id:'expense-source-qa',ref:'EXP-QA',date:businessToday(),category:'Transport',payee:'Counter',note:'Original',amount:7.25,paid:7.25,method:payment.method,payments:[payment]};
  savePreviewExpense(expense);
  savePreviewExpense({...expense,note:'Corrected memo'},'Correct memo only');
  assert.deepEqual(getExpensePreviewSnapshot().expenses.find(e=>e.id===expense.id)?.payments,[payment]);
  assert.equal(getExpensePreviewSnapshot().audit.length,2);
});
