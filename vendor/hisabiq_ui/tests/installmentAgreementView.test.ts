import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const component=readFileSync(new URL('../src/components/pos/InstallmentAgreementPreview.tsx',import.meta.url),'utf8');
const pos=readFileSync(new URL('../src/pages/Pos.tsx',import.meta.url),'utf8');
test('agreement details display source-derived paid, due, overdue and receipt history',()=>{
 for(const term of ['projectInstallmentLifecycle','Receipt history','row.paidPaisa','row.outstandingPaisa','receipts','onReceive','Receive payment'])
   assert.ok(component.includes(term),term);
 assert.ok(pos.includes('InstallmentReceivePaymentDialog'));
 assert.ok(pos.includes('listInstallmentReceipts'));
 assert.ok(pos.includes('onRecorded'));
 assert.doesNotMatch(component,/dispatchPartyPreview|financeAccountBalance|postLedger/);
});

test('closed history must not redirect a new sale receipt to a previously opened agreement',()=>{
 assert.match(pos,/installmentHistoryOpen&&historySelected/);
});
