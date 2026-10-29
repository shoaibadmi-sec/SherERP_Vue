import type { AccountingAccount, AccountingSourceTransaction, VoucherType } from '../types/accounting';

export const accountingAccounts: AccountingAccount[] = [
  { id: 'asset-cash', code: '1010', name: 'Cash in Hand', helperBn: 'হাতে থাকা নগদ টাকা', group: 'Asset', parent: 'Cash & Money', active: true },
  { id: 'asset-bank', code: '1020', name: 'Bank Accounts', helperBn: 'ব্যাংকে থাকা টাকা', group: 'Asset', parent: 'Cash & Money', active: true },
  { id: 'asset-mfs', code: '1030', name: 'Mobile Banking', helperBn: 'bKash, Nagad, Rocket-এর টাকা', group: 'Asset', parent: 'Cash & Money', active: true },
  { id: 'asset-ar', code: '1100', name: 'Accounts Receivable', helperBn: 'গ্রাহকের কাছ থেকে পাবো', group: 'Asset', parent: 'Current Assets', active: true },
  { id: 'asset-inventory', code: '1200', name: 'Inventory', helperBn: 'মজুদ পণ্যের মূল্য', group: 'Asset', parent: 'Current Assets', active: true },
  { id: 'asset-borrower', code: '1300', name: 'Borrower Receivable', helperBn: 'যাকে টাকা দিয়েছি, তার কাছ থেকে পাবো', group: 'Asset', parent: 'Other Receivables', active: true },
  { id: 'liability-ap', code: '2010', name: 'Accounts Payable', helperBn: 'সাপ্লায়ারকে দিতে হবে', group: 'Liability', parent: 'Current Liabilities', active: true },
  { id: 'liability-loan', code: '2100', name: 'Loans Payable', helperBn: 'ধার নেওয়া টাকা ফেরত দিতে হবে', group: 'Liability', parent: 'Borrowings', active: true },
  { id: 'liability-vat', code: '2200', name: 'VAT / Tax Payable', helperBn: 'ভ্যাট বা ট্যাক্স হিসেবে দিতে হবে', group: 'Liability', parent: 'Statutory Dues', active: true },
  { id: 'equity-capital', code: '3010', name: 'Owner Capital', helperBn: 'মালিক ব্যবসায় টাকা দিয়েছেন', group: 'Equity', parent: 'Equity', active: true },
  { id: 'equity-withdrawal', code: '3020', name: 'Owner Withdrawal', helperBn: 'মালিক ব্যবসা থেকে টাকা নিয়েছেন', group: 'Equity', parent: 'Equity', active: true },
  { id: 'equity-opening', code: '3090', name: 'Opening Balance Equity', helperBn: 'শুরুর হিসাব মিলানোর অস্থায়ী খাত', group: 'Equity', parent: 'Equity', active: true },
  { id: 'income-sales', code: '4010', name: 'Sales Revenue', helperBn: 'পণ্য বিক্রি থেকে আয়', group: 'Income', parent: 'Income', active: true },
  { id: 'income-other', code: '4020', name: 'Other Income', helperBn: 'অন্য উৎস থেকে আয়', group: 'Income', parent: 'Income', active: true },
  { id: 'expense-cogs', code: '5010', name: 'Cost of Goods Sold', helperBn: 'যে পণ্য বিক্রি হয়েছে তার খরচ', group: 'Expense', parent: 'Direct Cost', active: true },
  { id: 'expense-rent', code: '6010', name: 'Shop Rent', helperBn: 'দোকান ভাড়া', group: 'Expense', parent: 'Operating Expenses', active: true },
  { id: 'expense-salary', code: '6020', name: 'Salary & Wages', helperBn: 'বেতন ও মজুরি', group: 'Expense', parent: 'Operating Expenses', active: true },
  { id: 'expense-utility', code: '6030', name: 'Electricity & Utility', helperBn: 'বিদ্যুৎ ও অন্যান্য বিল', group: 'Expense', parent: 'Operating Expenses', active: true },
  { id: 'expense-transport', code: '6040', name: 'Transport & Delivery', helperBn: 'পরিবহন ও ডেলিভারি খরচ', group: 'Expense', parent: 'Operating Expenses', active: true },
  { id: 'expense-discount', code: '6050', name: 'Sales Discount', helperBn: 'বিক্রিতে দেওয়া ছাড়', group: 'Expense', parent: 'Selling Expenses', active: true },
  { id: 'expense-misc', code: '6090', name: 'Miscellaneous Expense', helperBn: 'অন্যান্য খরচ', group: 'Expense', parent: 'Operating Expenses', active: true }
];

export const voucherLabels: Record<VoucherType, { label: string; helperBn: string }> = {
  receipt: { label: 'Receipt Voucher', helperBn: 'টাকা পেয়েছি' },
  payment: { label: 'Payment Voucher', helperBn: 'টাকা দিয়েছি' },
  transfer: { label: 'Account Transfer', helperBn: 'নিজের এক অ্যাকাউন্ট থেকে আরেকটিতে টাকা সরানো' },
  adjustment: { label: 'Adjustment Entry', helperBn: 'হিসাব ঠিক বা সমন্বয় করার এন্ট্রি' }
};

export const accountingSources: AccountingSourceTransaction[] = [
  {
    id: 'as-sale-1',
    source: 'sale',
    reference: 'INV-000240',
    transactionDate: '2026-10-01',
    createdAt: '2026-10-01T11:05:00+06:00',
    postedBy: 'Anis',
    amount: 1840,
    paid: 1840,
    due: 0,
    paymentAccounts: [{ account: 'Main Cash Counter', amount: 1840 }],
    cogs: 1275,
    description: 'Counter sale'
  },
  {
    id: 'as-sale-2',
    source: 'sale',
    reference: 'INV-000239',
    transactionDate: '2026-10-01',
    createdAt: '2026-10-01T10:31:00+06:00',
    postedBy: 'Rafiq',
    amount: 9620,
    paid: 6000,
    due: 3620,
    paymentAccounts: [
      { account: 'bKash Business · 412', amount: 4000 },
      { account: 'Main Cash Counter', amount: 2000 }
    ],
    cogs: 7010,
    description: 'Partial sale to Nur Enterprise'
  },
  {
    id: 'as-customer-payment',
    source: 'customer-payment',
    reference: 'CP-000091',
    transactionDate: '2026-10-07',
    createdAt: '2026-10-07T09:42:00+06:00',
    postedBy: 'Rahim',
    amount: 10000,
    paid: 10000,
    due: 0,
    paymentAccounts: [{ account: 'bKash Business · 412', amount: 10000 }],
    description: 'Customer payment from Rahman Hardware'
  },
  {
    id: 'as-purchase-1',
    source: 'purchase',
    reference: 'PUR-000117',
    transactionDate: '2026-09-28',
    createdAt: '2026-09-28T12:00:00+06:00',
    postedBy: 'Anis',
    amount: 78400,
    paid: 40000,
    due: 38400,
    paymentAccounts: [
      { account: 'Dutch-Bangla Bank · 4582', amount: 30000 },
      { account: 'Main Cash Counter', amount: 10000 }
    ],
    description: 'Purchase from Bismillah Steel House'
  },
  {
    id: 'as-expense-1',
    source: 'expense',
    reference: 'EXP-000060',
    transactionDate: '2026-09-30',
    createdAt: '2026-09-30T18:00:00+06:00',
    postedBy: 'Anis',
    amount: 42000,
    paid: 42000,
    due: 0,
    paymentAccounts: [
      { account: 'Main Cash Counter', amount: 30000 },
      { account: 'Dutch-Bangla Bank · 4582', amount: 12000 }
    ],
    expenseAccountId: 'expense-salary',
    description: 'Staff salary — September'
  },
  {
    id: 'as-transfer-1',
    source: 'transfer',
    reference: 'TRF-000041',
    transactionDate: '2026-10-06',
    createdAt: '2026-10-06T14:00:00+06:00',
    postedBy: 'Anis',
    amount: 25000,
    paid: 25000,
    due: 0,
    fromAccount: 'Main Cash Counter',
    toAccount: 'Dutch-Bangla Bank · 4582',
    description: 'Cash deposit'
  },
  {
    id: 'as-owner-capital',
    source: 'finance',
    reference: 'FIN-000188',
    transactionDate: '2026-10-06',
    createdAt: '2026-10-06T13:00:00+06:00',
    postedBy: 'Anisur Rahman',
    amount: 50000,
    paid: 50000,
    due: 0,
    paymentAccounts: [{ account: 'Dutch-Bangla Bank · 4582', amount: 50000 }],
    financeKind: 'owner-investment',
    description: 'Additional working capital'
  },
  {
    id: 'as-adjustment-1',
    source: 'adjustment',
    reference: 'ADJ-000019',
    transactionDate: '2026-10-06',
    createdAt: '2026-10-06T17:15:00+06:00',
    postedBy: 'Rafiq',
    amount: 1650,
    paid: 0,
    due: 0,
    description: 'Month-end utility accrual',
    lines: [
      { accountId: 'expense-utility', debit: 1650, credit: 0 },
      { accountId: 'liability-ap', debit: 0, credit: 1650 }
    ]
  }
];
