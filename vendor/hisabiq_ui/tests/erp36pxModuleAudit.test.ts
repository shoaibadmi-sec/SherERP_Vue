import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (file: string) => readFileSync(file,'utf8');

test('all ERP regular control sizes use canonical 36px token without touch inflation',()=>{
 const css=read('src/index.css');
 assert.match(css,/--erp-control-height:\s*36px/);
 assert.match(css,/\.hisabiq-button\s*\{[\s\S]*?height:\s*var\(--erp-control-height\)\s*!important/);
 assert.match(css,/button\[role="combobox"\]/);
 assert.match(css,/\[data-hisabiq-numeric\]/);
 assert.doesNotMatch(css,/min-height:\s*44px;/);
});
test('Party responsive buttons use the same 36px height as ledger filters',()=>{
 const party=read('src/components/parties/PartyDetailResponsive.tsx');
 const toolbar=read('src/components/parties/PartyLedgerToolbarResponsive.tsx');
 assert.doesNotMatch(party,/min-h-1[01]/);
 assert.doesNotMatch(toolbar,/min-h-1[01]/);
 assert.equal((toolbar.match(/data-ledger-filter-action=""/g)||[]).length,2);
 assert.match(toolbar,/h-9 min-h-9/);
 assert.match(party,/onChangeParty/);
});
test('Sales row filters, receipt actions and return editors use 36px',()=>{
 const sales=read('src/pages/Sales.tsx');
 const mobile=read('src/components/sales/SalesMobileLayout.tsx');
 assert.match(sales,/data-sales-header-new=""/);
 assert.match(sales,/data-sales-credit-receive=""/);
 assert.match(sales,/Returned serials for/);
 assert.doesNotMatch(sales,/className="h-8 text-right"/);
 assert.match(mobile,/size-9 shrink-0 p-0/);
});
test('POS checkout and party selector use 36px without changing payment handlers',()=>{
 const checkout=read('src/components/pos/CheckoutPanel.tsx');
 const picker=read('src/components/pos/CustomerPicker.tsx');
 const product=read('src/components/pos/ProductCombobox.tsx');
 assert.match(checkout,/setSinglePayment\(totals.total\)/);
 assert.match(checkout,/setSinglePayment\(amount, 'Cash'\)/);
 assert.match(checkout,/className="h-9 rounded-md border border-teal-200/);
 assert.match(picker,/flex h-9 w-full min-w-0 items-center rounded-lg/);
 assert.match(product,/className=\{\x60h-9 w-full rounded-lg border border-dashed/);
});
test('Product Add/Discard and cash-session form use 36px, retaining actions',()=>{
 const add=read('src/components/products/AddProductDialog.tsx');
 const discard=read('src/components/products/form/DiscardDialog.tsx');
 const session=read('src/components/layout/CashSessionDialog.tsx');
 assert.match(add,/className="-ml-2 h-9 gap-1/);
 assert.match(discard,/onDiscard/);
 assert.doesNotMatch(discard,/h-11|sm:h-10/);
 assert.match(session,/className="mt-2 h-9 text-right text-lg"/);
});
test('Audit, vouchers, reconciliation and topbar use 36px for ordinary controls',()=>{
 const vouchers=read('src/components/accounts/VoucherDialog.tsx');
 const audit=read('src/components/audit/AuditEditDialog.tsx');
 const recon=read('src/pages/Reconciliation.tsx');
 const top=read('src/components/layout/TopBar.tsx');
 assert.match(vouchers,/size-9 items-center justify-center/);
 assert.match(audit,/size-9 items-center justify-center/);
 assert.match(recon,/className="h-9 w-full"/);
 assert.match(top,/className="hidden h-9 items-center gap-2/);
});
test('Vendor workspace retains money work handlers but removes 44px buttons',()=>{
 const vendor=read('src/components/vendor/VendorTabs.tsx');
 assert.doesNotMatch(vendor,/min-h-11/);
 assert.match(vendor,/selectTab\('taken'/);
});
