import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(p:string)=>readFileSync(p,'utf8');

test('Counter localizes financial validation without renaming posting types',()=>{
 const c=read('src/components/finance/CounterWorkspace.tsx');
 assert.match(c,/type Action='Customer Receive'\|'Supplier Pay'\|'Expense'\|'Bank Transfer'/);
 assert.match(c,/text\('Enter a valid amount with up to two decimal places\.'/);
 assert.match(c,/text\('Cash plus settlement exceeds outstanding due\./);
 assert.match(c,/This records an in-browser ERP preview/);
});
test('Purchase and Sales keep machine-stable payment methods and allocation IDs',()=>{
 const purchase=read('src/components/purchases/PurchasePaymentPanel.tsx');
 const sales=read('src/pages/Sales.tsx');
 assert.match(purchase,/options=\{methods\.map\(method=>\(\{value:method,label:text/);
 assert.match(sales,/value:'Settle oldest due',label:text/);
 assert.match(sales,/value:'Keep as customer credit',label:text/);
});
test('Expense copy still discloses preview and requires correction reasons',()=>{
 const c=read('src/components/purchases/BillDialog.tsx');
 assert.match(c,/UI preview\. Cash and ledger posting require backend integration\./);
 assert.match(c,/Enter a reason for the correction\./);
});
