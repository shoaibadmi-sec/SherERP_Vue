import assert from 'node:assert/strict';
import {test} from 'node:test';
import {generateInstallmentSchedule} from '../src/installments/schedule.ts';
import {recordInstallmentPreview,resetInstallmentPreviewsForTest,listInstallmentPreviews,getInstallmentPreview} from '../src/data/installmentPreviewStore.ts';
const input=()=>({operationId:'inst-preview-INV-000242',invoiceReference:'INV-000242',customerId:'c1',customerName:'Rahman Hardware',totalPaisa:3300000,downPaymentPaisa:300000,schedule:generateInstallmentSchedule({remainingPaisa:3000000,count:6,firstDueDate:'2026-11-17',frequency:'Monthly'}),lineSnapshot:[{key:'line1',productId:'fridge',amountPaisa:3300000}],paymentSnapshot:[{method:'Cash',account:'Cash Register',amountPaisa:300000}]});
test('stores one immutable-preview snapshot with six scheduled future payments',()=>{
 resetInstallmentPreviewsForTest();
 const created=recordInstallmentPreview(input());
 assert.equal(created.totalPaisa,3300000);
 assert.equal(created.schedule.length,6);
 assert.equal(listInstallmentPreviews().length,1);
 assert.deepEqual(getInstallmentPreview(created.id),created);
 created.schedule[0].amountPaisa=1;
 assert.equal(getInstallmentPreview(created.id)?.schedule[0].amountPaisa,500000);
});
test('same operation and snapshot is idempotent, but changed source is rejected',()=>{
 resetInstallmentPreviewsForTest();
 const a=recordInstallmentPreview(input());
 const b=recordInstallmentPreview(input());
 assert.equal(a.id,b.id);
 assert.equal(listInstallmentPreviews().length,1);
 assert.throws(()=>recordInstallmentPreview({...input(),operationId:'new-op'}),/invoice|agreement/i);
 assert.throws(()=>recordInstallmentPreview({...input(),totalPaisa:3400000}),/operation|different|already/i);
});
test('rejects mismatched totals, missing customer and duplicate price line identity',()=>{
 resetInstallmentPreviewsForTest();
 assert.throws(()=>recordInstallmentPreview({...input(),downPaymentPaisa:100000}),/schedule|balance|payment/i);
 assert.throws(()=>recordInstallmentPreview({...input(),lineSnapshot:[{key:'x',productId:'fridge',amountPaisa:100}]}),/line|invoice/i);
 assert.throws(()=>recordInstallmentPreview({...input(),customerId:''}),/customer/i);
 assert.throws(()=>recordInstallmentPreview({...input(),paymentSnapshot:[{method:'Cash',account:'Cash Register',amountPaisa:200000}]}),/payment|split/i);
 assert.throws(()=>recordInstallmentPreview({...input(),lineSnapshot:[{key:'same',productId:'x',amountPaisa:1000000},{key:'same',productId:'y',amountPaisa:2300000}]}),/duplicate/i);
});
