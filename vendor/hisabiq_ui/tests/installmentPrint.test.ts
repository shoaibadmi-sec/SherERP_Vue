import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderInstallmentLifecyclePrint} from '../src/installments/printLifecycle.ts';
import {generateInstallmentSchedule} from '../src/installments/schedule.ts';
import type {PreviewInstallmentAgreement} from '../src/data/installmentPreviewStore.ts';
import type {InstallmentLifecycleEvent} from '../src/installments/lifecycle.ts';
const a:PreviewInstallmentAgreement={id:'ag1',invoiceReference:'INV-000077',
 customerId:'c1',customerName:'<script>alert(1)</script>',createdAt:'2026-10-17T10:00:00Z',
 operationId:'sale1',totalPaisa:3300000,downPaymentPaisa:300000,
 schedule:generateInstallmentSchedule({remainingPaisa:3000000,count:6,firstDueDate:'2026-11-17',frequency:'Monthly'}),
 lineSnapshot:[{key:'l1',productId:'p1',amountPaisa:3300000}],
 paymentSnapshot:[{method:'Cash',account:'Cash counter',amountPaisa:300000}]};
const event:InstallmentLifecycleEvent={type:'agreement-reduction',agreementId:a.id,id:'settle1',
 operationId:'settle-op1',actorId:'manager',reason:'Approved test settlement',effectiveDate:'2026-10-18',
 revision:1,sequence:1,amountPaisa:50000};
test('printable audit includes source invoice, schedule, totals, reason and conspicuous PREVIEW notice',()=>{
 const html=renderInstallmentLifecyclePrint(a,[],[event],'2026-10-18');
 for(const phrase of ['INV-000077','PREVIEW — NOT POSTED','Approved test settlement',
  '2026-11-17','33,000.00','500.00'])assert.ok(html.includes(phrase),phrase);
 assert.ok(html.includes('Installment history'));
 assert.match(html,/print|@media/i);
});
test('unsafe customer text is escaped in printed markup',()=>{
 const html=renderInstallmentLifecyclePrint(a,[],[event],'2026-10-18');
 assert.ok(!html.includes('<script>alert(1)</script>'));
 assert.match(html,/&lt;script&gt;/);
});
