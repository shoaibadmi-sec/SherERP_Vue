import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=(path:string)=>readFileSync(path,'utf8');

test('Finance keeps money direction, account IDs and split arithmetic unchanged',()=>{
 const finance=source('src/pages/Finance.tsx'),split=source('src/components/finance/FinancePaymentSplitEditor.tsx'),drafts=source('src/utils/financePaymentDrafts.ts');
 assert.match(finance,/direction: meta\.direction/);
 assert.match(finance,/paymentAccounts: isOpening \? undefined : paymentSplits/);
 assert.match(finance,/!financePaymentSplitsAreValid\(paymentRows, accounts, value\)/);
 assert.match(drafts,/method: row\.method/);
 assert.match(drafts,/accountId: account\?\.id/);
 assert.match(split,/options=\{\(\['Cash', 'Bank', 'Mobile Banking'\] as const\)\.map\(value=>\(\{value,label:financeLabel/);
});
test('Bank reconciliation keeps persisted match states and CSV schema',()=>{
 const reconcile=source('src/pages/Reconciliation.tsx');
 assert.match(reconcile,/reconciliationCsv\(filtered\)/);
 assert.match(reconcile,/setStatusFilter\('All status'\)/);
 assert.match(reconcile,/updateSelectedStatus\('Matched', erpId\)/);
 assert.match(reconcile,/setCompleted\(current=>\(\{\.\.\.current,\[accountId\]:false\}\)\)/);
 assert.match(reconcile,/options=\{\['All status', 'Matched', 'Review', 'Unmatched', 'Ignored'\]\.map\(value=>\(\{value,label:financeLabel/);
 assert.match(reconcile,/canCompleteReconciliation\(accountStatement,accountErp,difference\)/);
});
test('Party settlement and refund safeguards remain intact',()=>{
 const pay=source('src/components/parties/PartyPaymentDialog.tsx');
 const refund=source('src/components/parties/PartyCreditRefundDialog.tsx');
 const edit=source('src/components/parties/PartyTransactionDialog.tsx');
 assert.match(pay,/invoiceId:invoiceId\|\|undefined/); // underlying invoice allocation identifier stays unchanged
 assert.match(refund,/amount>available/);
 assert.match(pay,/Math\.abs\(paymentSplits\.reduce/);
 assert.match(edit,/onReverse\(source\.id,reason\.trim\(\)\)/);
});
test('New glossary is for presentation; all original model values are preserved',()=>{
 const c=source('src/i18n/financeCopy.ts');
 assert.match(c,/uiText\(language,value,financeWords\[value\]\?\?value\)/);
 const finance=source('src/pages/Finance.tsx');
 assert.match(finance,/options=\{financeTypeOptions\.map\(value=>\(\{value,label:financeLabel/);
});
