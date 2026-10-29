import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {uiText} from '../src/i18n/uiCopy.ts';

test('Expenses labels obey existing English, mixed and Bangla modes',()=>{
  for(const [english,bangla] of [
    ['Active expenses','চালু খরচ'],['Expense categories','খরচের ধরনসমূহ'],
    ['Expense payees','টাকা প্রাপকদের তালিকা'],['View receipt','রসিদ দেখুন'],
    ['Active total','চালু খরচের মোট'],['Total paid','মোট দেওয়া']
  ]){
    assert.equal(uiText('English',english,bangla),english);
    assert.equal(uiText('English + Bangla',english,bangla),english);
    assert.equal(uiText('Bangla',english,bangla),bangla);
  }
});

test('Expense records, payment methods, filters and CSV machine headers retain original IDs and values',()=>{
  const s=readFileSync('src/pages/Expenses.tsx','utf8');
  for(const source of [
    "type Tab = 'expenses' | 'categories' | 'payees' | 'reports'",
    "useState('All categories')",
    "useState('All payees')",
    "useState('All payment methods')",
    "useState('Active')",
    "categoryFilter === 'All categories' || expense.category === categoryFilter",
    "payeeFilter === 'All payees' || expense.payee === payeeFilter",
    "methodFilter === 'All payment methods' || paymentsFor(expense).some(payment => payment.method === methodFilter)",
    "statusFilter === 'All status' || active === (statusFilter === 'Active')",
    "paymentLabel(expense) === 'Multiple'",
    "documentMethod(language,paymentLabel(expense))",
    "downloadReport(filename, report.headers, report.rows)",
    "['Reference', 'Date', 'Category', 'Payee', 'Details', 'Amount', 'Paid', 'Due', 'Status']",
    "savePreviewExpense(expense)",
    "savePreviewExpense(expense, reason)",
    "cancelPreviewExpense(cancelling.id, cancelReason)",
    "dispatchPartyPreview({type: 'deactivate-party', id: payee.id})",
    "setPreviewExpenseCategoryActive(category, !active)",
    "refreshCategories(n => n + 1)"
  ])assert.ok(s.includes(source),'source contract missing: '+source);
  for(const forbidden of ["setCategoryFilter(text(","setPayeeFilter(text(","setMethodFilter(text(","setStatusFilter(text(","downloadReport(text(","payment.method = text("])
    assert.ok(!s.includes(forbidden),'persisted or exported data must not be translated: '+forbidden);
  assert.ok(s.includes("text('Expense cancelled in preview','প্রিভিউ খরচ বাতিল হয়েছে')"));
  assert.ok(s.includes("text('Keep the Payee or Vendor relationship for expense entries."));
  assert.ok(s.includes('aria-label={text("Expense category filter"'));
});
