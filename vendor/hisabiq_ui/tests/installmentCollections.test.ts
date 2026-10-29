import {test} from 'node:test';
import assert from 'node:assert/strict';
import {generateInstallmentSchedule} from '../src/installments/schedule.ts';
import {allocateOldestInstallments,projectInstallmentBalance,type InstallmentPaymentPreviewEvent} from '../src/installments/collections.ts';
import type {PreviewInstallmentAgreement} from '../src/data/installmentPreviewStore.ts';

const agreement=():PreviewInstallmentAgreement=>({
 id:'agree-1',invoiceReference:'INV-000242',customerId:'customer-1',customerName:'Shop Customer',
 createdAt:'2026-10-17T10:00:00Z',operationId:'op-sale',totalPaisa:3300000,downPaymentPaisa:300000,
 schedule:generateInstallmentSchedule({remainingPaisa:3000000,count:6,firstDueDate:'2026-11-17',frequency:'Monthly'}),
 lineSnapshot:[{key:'line',productId:'product',amountPaisa:3300000}],
 paymentSnapshot:[{method:'Cash',account:'Cash',amountPaisa:300000}]
});
const receipt=(id:string,amountPaisa:number,allocations:InstallmentPaymentPreviewEvent['allocations'],date='2026-11-17'):InstallmentPaymentPreviewEvent=>({
 id,agreementId:'agree-1',operationId:'op-'+id,date,amountPaisa,allocations,
 splits:[{method:'Cash',accountId:'acc-cash',amountPaisa}],createdAt:date+'T10:00:00Z'
});
test('partial collection keeps down payment separate and allocates oldest unpaid first',()=>{
 const a=agreement();
 let rows=allocateOldestInstallments(a,[],200000);
 assert.deepEqual(rows,[{scheduleItemId:'inst-1',amountPaisa:200000}]);
 const first=receipt('r1',200000,rows);
 rows=allocateOldestInstallments(a,[first],500000);
 assert.deepEqual(rows,[{scheduleItemId:'inst-1',amountPaisa:300000},{scheduleItemId:'inst-2',amountPaisa:200000}]);
 const second=receipt('r2',500000,rows);
 const state=projectInstallmentBalance(a,[first,second],'2026-11-17');
 assert.equal(state.totalOutstandingPaisa,2300000);
 assert.equal(state.rows[0].outstandingPaisa,0);
 assert.equal(state.rows[1].paidPaisa,200000);
 assert.equal(state.rows[1].outstandingPaisa,300000);
 assert.equal(state.rows[0].status,'Paid');
 assert.equal(state.rows[1].status,'Partial');
});
test('overdue due today upcoming and paid are distinct on business calendar dates',()=>{
 const a=agreement();
 let state=projectInstallmentBalance(a,[],'2026-11-17');
 assert.equal(state.dueTodayPaisa,500000);
 assert.equal(state.overduePaisa,0);
 assert.equal(state.rows[0].status,'Due');
 assert.equal(state.rows[1].status,'Upcoming');
 state=projectInstallmentBalance(a,[],'2026-12-20');
 assert.equal(state.overduePaisa,1000000);
 assert.equal(state.rows[0].status,'Overdue');
 assert.equal(state.rows[1].status,'Overdue');
});
test('early payment may reach future installments but never another agreement',()=>{
 const a=agreement();
 const paid=allocateOldestInstallments(a,[],1500000);
 assert.deepEqual(paid.map(p=>p.scheduleItemId),['inst-1','inst-2','inst-3']);
 const foreign=receipt('r3',100000,[{scheduleItemId:'inst-1',amountPaisa:100000}]);
 foreign.agreementId='other';
 assert.throws(()=>projectInstallmentBalance(a,[foreign],'2026-11-20'),/agreement/i);
});
test('repeated over-allocation and duplicate receipt ids cannot hide negative outstanding',()=>{
 const a=agreement();
 const tooMuch=receipt('bad',600000,[{scheduleItemId:'inst-1',amountPaisa:600000}]);
 assert.throws(()=>projectInstallmentBalance(a,[tooMuch],'2026-11-17'),/exceed|over|remaining/i);
 const one=receipt('r1',200000,[{scheduleItemId:'inst-1',amountPaisa:200000}]);
 assert.throws(()=>projectInstallmentBalance(a,[one,one],'2026-11-17'),/duplicate/i);
 assert.throws(()=>allocateOldestInstallments(a,[],3000001),/outstanding|exceed/i);
});
test('invalid allocation sums and invalid business dates reject without mutation',()=>{
 const a=agreement();
 const invalid=receipt('bad',500,[{scheduleItemId:'inst-1',amountPaisa:300}]);
 assert.throws(()=>projectInstallmentBalance(a,[invalid],'2026-11-17'),/allocation|total/i);
 assert.throws(()=>projectInstallmentBalance(a,[],'2026-02-30'),/date/i);
 assert.equal(a.schedule[0].amountPaisa,500000);
});
