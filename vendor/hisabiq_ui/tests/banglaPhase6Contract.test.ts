import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const file=(p:string)=>readFileSync(p,'utf8');

test('Cheque stored lifecycle enum and money clearance rules remain untouched',()=>{
 const cheque=file('src/components/finance/ChequeDialogs.tsx');
 const actions=file('src/components/finance/ChequeActionDialog.tsx');
 const workflow=file('src/utils/moduleUiActions.ts');
 assert.ok(cheque.includes("const status: ChequeStatus = direction === 'Received' ? 'Received' : 'Issued'"));
 assert.ok(cheque.includes("direction,"));
 assert.ok(cheque.includes("status,"));
 assert.ok(actions.includes('onStatus(cheque, pendingAction.nextStatus, reason.trim() || undefined)'));
 assert.ok(actions.includes('pendingAction.reasonRequired && !reason.trim()'));
 assert.ok(workflow.includes("action('clear', 'Mark cleared', 'Cleared')"));
 assert.ok(workflow.includes("action('bounce', 'Mark bounced', 'Bounced', 'danger', true)"));
 assert.ok(actions.includes('financeLabel(language,pendingAction.nextStatus)'));
});
test('Cash variance remains counted minus expected, not an automatic entry',()=>{
 const cash=file('src/components/finance/CashSessionDetailsDialog.tsx');
 assert.ok(cash.includes('session.countedCash - session.expectedCash'));
 assert.ok(cash.includes('onReconcile(session)'));
 assert.ok(cash.includes('printReport({title:'));
 assert.ok(!cash.includes('window.print()'));
});
test('Finance transaction and account mutations preserve IDs, direction, and reversals',()=>{
 const finance=file('src/components/finance/FinanceRecordDialogs.tsx');
 assert.ok(finance.includes('direction: meta.direction'));
 assert.ok(finance.includes('paymentAccounts: opening ? undefined : paymentSplits'));
 assert.ok(finance.includes('!financePaymentSplitsAreValid(paymentRows, accounts, value)'));
 assert.ok(finance.includes('onReverse(transaction)'));
 assert.ok(finance.includes('onReverse(transfer)'));
 assert.ok(finance.includes('onManualEntry(account, manualDirection, value'));
 assert.ok(finance.includes('onToggleStatus(account)'));
 assert.ok(finance.includes("({value,label:financeLabel(language,value)})"));
});
test('Isolated prints use existing preference; CSV/report infrastructure remains unchanged',()=>{
 const cheque=file('src/components/finance/ChequeActionDialog.tsx');
 const finance=file('src/components/finance/FinanceRecordDialogs.tsx');
 const report=file('src/utils/reportOutput.ts');
 assert.ok(cheque.includes('printReport({title:'));
 assert.ok(finance.includes('printReport({title:'));
 assert.ok(finance.includes('language,subtitle:'));
 assert.ok(report.includes('export function reportCsv('));
});
