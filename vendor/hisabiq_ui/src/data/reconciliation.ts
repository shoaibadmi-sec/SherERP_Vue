import type {
  ErpReconciliationTransaction,
  ReconciliationAccount,
  ReconciliationHistory,
  StatementTransaction
} from '../types/erp';

export const reconciliationAccounts: ReconciliationAccount[] = [
  { id: 'acc-bank-dbbl', name: 'DBBL Current Account', type: 'Bank', balance: 312400, detail: 'A/C ending 2451' },
  { id: 'acc-bkash', name: 'bKash Merchant', type: 'Mobile Banking', balance: 68450, detail: '01811-000111' },
  { id: 'acc-nagad', name: 'Nagad Merchant', type: 'Mobile Banking', balance: 22180, detail: '01711-000222' },
  { id: 'acc-cash', name: 'Cash Counter', type: 'Cash', balance: 48250, detail: 'Counter 1' }
];

export const statementTransactions: StatementTransaction[] = [
  {
    id: 'st-001',
    accountId: 'acc-bank-dbbl',
    date: '30 Sep 2026',
    description: 'BEFTN CREDIT RAHMAN HARDWARE',
    reference: 'BEFTN-982411',
    amount: 25000,
    direction: 'in',
    status: 'Matched',
    suggestedErpId: 'erp-001',
    matchedErpId: 'erp-001',
    confidence: 100
  },
  {
    id: 'st-002',
    accountId: 'acc-bank-dbbl',
    date: '30 Sep 2026',
    description: 'TRANSFER KARIM TRADERS',
    reference: 'DBBL-740119',
    amount: 40000,
    direction: 'out',
    status: 'Matched',
    suggestedErpId: 'erp-002',
    matchedErpId: 'erp-002',
    confidence: 100
  },
  {
    id: 'st-003',
    accountId: 'acc-bank-dbbl',
    date: '30 Sep 2026',
    description: 'SHOP RENT OCTOBER',
    reference: 'TRF-550194',
    amount: 35000,
    direction: 'out',
    status: 'Review',
    suggestedErpId: 'erp-003',
    confidence: 86
  },
  {
    id: 'st-004',
    accountId: 'acc-bank-dbbl',
    date: '30 Sep 2026',
    description: 'CASH DEPOSIT NAWABPUR',
    reference: 'CDM-009441',
    amount: 12000,
    direction: 'in',
    status: 'Unmatched'
  },
  {
    id: 'st-005',
    accountId: 'acc-bank-dbbl',
    date: '29 Sep 2026',
    description: 'BANK CHARGE VAT',
    reference: 'FEE-7734',
    amount: 575,
    direction: 'out',
    status: 'Unmatched'
  },
  {
    id: 'st-006',
    accountId: 'acc-bank-dbbl',
    date: '29 Sep 2026',
    description: 'MIM CONSTRUCTION PAYMENT',
    reference: 'BEFTN-981052',
    amount: 18000,
    direction: 'in',
    status: 'Review',
    suggestedErpId: 'erp-004',
    confidence: 74
  },
  {
    id: 'st-007',
    accountId: 'acc-bank-dbbl',
    date: '28 Sep 2026',
    description: 'PADMA ELECTRIC SUPPLY',
    reference: 'RTGS-330211',
    amount: 20530,
    direction: 'out',
    status: 'Matched',
    suggestedErpId: 'erp-005',
    matchedErpId: 'erp-005',
    confidence: 100
  },
  {
    id: 'st-008',
    accountId: 'acc-bank-dbbl',
    date: '28 Sep 2026',
    description: 'INTEREST CREDIT',
    reference: 'INT-SEP26',
    amount: 1250,
    direction: 'in',
    status: 'Unmatched'
  },
  {
    id: 'st-bk-001',
    accountId: 'acc-bkash',
    date: '01 Oct 2026',
    description: 'PAYMENT 01815660372',
    reference: '9KJ27XQ1',
    amount: 4000,
    direction: 'in',
    status: 'Matched',
    suggestedErpId: 'erp-bk-001',
    matchedErpId: 'erp-bk-001',
    confidence: 100
  },
  {
    id: 'st-bk-002',
    accountId: 'acc-bkash',
    date: '30 Sep 2026',
    description: 'MERCHANT PAYMENT DESCO',
    reference: '8FF21PP0',
    amount: 4860,
    direction: 'out',
    status: 'Review',
    suggestedErpId: 'erp-bk-002',
    confidence: 91
  }
];

export const erpReconciliationTransactions: ErpReconciliationTransaction[] = [
  { id: 'erp-001', accountId: 'acc-bank-dbbl', date: '30 Sep 2026', type: 'Customer payment', party: 'Rahman Hardware', partyId: 'c1', reference: 'RCV-000104', amount: 25000, direction: 'in' },
  { id: 'erp-002', accountId: 'acc-bank-dbbl', date: '30 Sep 2026', type: 'Purchase payment', party: 'Karim Traders', partyId: 's1', reference: 'PAY-000054', amount: 40000, direction: 'out' },
  { id: 'erp-003', accountId: 'acc-bank-dbbl', date: '28 Sep 2026', type: 'Expense', party: 'Shop rent — Nawabpur', reference: 'EXP-000059', amount: 35000, direction: 'out' },
  { id: 'erp-004', accountId: 'acc-bank-dbbl', date: '29 Sep 2026', type: 'Customer payment', party: 'Mim Construction', partyId: 'c3', reference: 'RCV-000103', amount: 17000, direction: 'in' },
  { id: 'erp-005', accountId: 'acc-bank-dbbl', date: '27 Sep 2026', type: 'Purchase payment', party: 'Padma Electric Supply', partyId: 's3', reference: 'PAY-000052', amount: 20530, direction: 'out' },
  { id: 'erp-bk-001', accountId: 'acc-bkash', date: '01 Oct 2026', type: 'Sale payment', party: 'Nur Enterprise', partyId: 'c4', reference: 'INV-000239', amount: 4000, direction: 'in' },
  { id: 'erp-bk-002', accountId: 'acc-bkash', date: '25 Sep 2026', type: 'Expense', party: 'DESCO (Electricity)', partyId: 'py1', reference: 'EXP-000058', amount: 4860, direction: 'out' }
];

export const reconciliationHistory: ReconciliationHistory[] = [
  {
    id: 'REC-000011',
    accountId: 'acc-bank-dbbl',
    accountName: 'DBBL Current Account',
    period: '01–31 Aug 2026',
    statementFile: 'DBBL-Aug-2026.pdf',
    statementClosing: 271925,
    erpClosing: 271925,
    matched: 44,
    review: 0,
    status: 'Completed'
  },
  {
    id: 'REC-000012',
    accountId: 'acc-bank-dbbl',
    accountName: 'DBBL Current Account',
    period: '01–30 Sep 2026',
    statementFile: 'DBBL-Sep-2026.pdf',
    statementClosing: 313650,
    erpClosing: 312400,
    matched: 5,
    review: 5,
    status: 'In progress'
  },
  {
    id: 'REC-000013',
    accountId: 'acc-bkash',
    accountName: 'bKash Merchant',
    period: '01–30 Sep 2026',
    statementFile: 'bKash-Sep-2026.pdf',
    statementClosing: 68450,
    erpClosing: 68450,
    matched: 31,
    review: 0,
    status: 'Completed'
  }
];
