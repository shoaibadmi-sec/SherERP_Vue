import assert from 'node:assert/strict';
import {test} from 'node:test';
import {generateInstallmentSchedule} from '../src/installments/schedule.ts';
import {validateInstallmentDraft} from '../src/installments/validateDraft.ts';
const base=()=>({customerId:'c1',customerName:'Customer',phone:'01711222333',totalPaisa:3300000,downPaymentPaisa:300000,schedule:generateInstallmentSchedule({remainingPaisa:3000000,count:6,firstDueDate:'2026-11-17',frequency:'Monthly'})});
test('valid six-installment sale passes draft validation',()=>{
 assert.deepEqual(validateInstallmentDraft(base()),[]);
});
test('requires durable customer reference for installment due',()=>{
 assert.match(validateInstallmentDraft({...base(),customerId:undefined}).join(' '),/customer|select/i);
 assert.match(validateInstallmentDraft({...base(),customerId:''}).join(' '),/customer|select/i);
});
test('rejects invalid price, full payment, or too large down payment',()=>{
 assert.match(validateInstallmentDraft({...base(),totalPaisa:0}).join(' '),/selling|price|total/i);
 assert.match(validateInstallmentDraft({...base(),downPaymentPaisa:3400000}).join(' '),/down|exceed|payment/i);
 assert.match(validateInstallmentDraft({...base(),downPaymentPaisa:3300000}).join(' '),/remaining|regular/i);
});
test('does not silently rewrite a manually edited installment schedule',()=>{
 const rows=base().schedule;
 rows[1]={...rows[1],amountPaisa:400000,editedAmount:true};
 assert.match(validateInstallmentDraft({...base(),schedule:rows}).join(' '),/balance|difference|match|scheduled/i);
});
test('rejects schedule with duplicate due date or negative amounts',()=>{
 const rows=base().schedule;
 rows[1]={...rows[1],dueDate:rows[0].dueDate};
 assert.match(validateInstallmentDraft({...base(),schedule:rows}).join(' '),/date|sequence/i);
 rows[1]={...rows[1],dueDate:'2026-12-17',amountPaisa:-100};
 assert.match(validateInstallmentDraft({...base(),schedule:rows}).join(' '),/amount/i);
});
