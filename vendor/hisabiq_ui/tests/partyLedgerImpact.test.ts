import test from 'node:test';
import assert from 'node:assert/strict';
import {ledgerImpact, type LedgerImpact} from '../src/utils/partyLedgerImpact.ts';
import type {PartyLedgerRow} from '../src/types/partyLedger.ts';
const row=(source:PartyLedgerRow['source'],relationship:PartyLedgerRow['relationship'],debit:number,credit:number):PartyLedgerRow=>({
 id:source,partyId:'qa',relationship,source,description:'Test',date:'2026-10-08',debit,credit,sequence:1,status:'Active'
});
const expectImpact=(r:PartyLedgerRow,kind:LedgerImpact['kind'])=>assert.equal(ledgerImpact(r).kind,kind);
test('classifies cash flows by source, never by debit/credit column',()=>{
 expectImpact(row('customer-payment','Customer',0,500),'in');
 expectImpact(row('supplier-payment','Supplier',250,0),'out');
 expectImpact(row('customer-credit-refund','Customer',150,0),'out');
 expectImpact(row('supplier-credit-refund','Supplier',0,150),'in');
 expectImpact(row('sale','Customer',1000,0),'due');
 expectImpact(row('purchase','Supplier',0,2000),'due');
});
test('opening, returns and notes are never mislabeled as cash transfer',()=>{
 expectImpact(row('opening','Customer',1000,0),'opening');
 expectImpact(row('sale-return','Customer',0,200),'adjustment');
 expectImpact(row('purchase-return','Supplier',100,0),'adjustment');
 expectImpact(row('note','Customer',0,0),'neutral');
});
test('finance role cash movement follows finance type not account-side debit sign',()=>{
 expectImpact({...row('finance','Owner',0,500),financeType:'Owner Credit'},'in');
 expectImpact({...row('finance','Borrower',500,0),financeType:'Borrower Debit'},'out');
 expectImpact({...row('finance','Borrower',0,500),financeType:'Borrower Credit'},'in');
 expectImpact({...row('finance','Lender',0,500),financeType:'Opening Loan'},'opening');
 expectImpact(row('finance','Owner',0,500),'neutral');
});
test('legacy unknown-source expenses are not asserted as cash payments',()=>{
 expectImpact(row('expense','Payee',0,100),'neutral');
});
