export type FinanceAccountType = 'Cash' | 'Petty Cash' | 'Bank' | 'Mobile Banking';
export type FinanceAccountStatus = 'Active' | 'Inactive';

export type FinanceAccount = {
  id: string;
  name: string;
  type: FinanceAccountType;
  institution?: string;
  number?: string;
  balance: number;
  openingBalance: number;
  status: FinanceAccountStatus;
  lastActivity: string;
};

export function financeAccountOptionLabel(account: FinanceAccount, candidates: FinanceAccount[]): string {
  const sameName = candidates.filter((candidate) => candidate.name.trim().toLocaleLowerCase() === account.name.trim().toLocaleLowerCase());
  if (sameName.length < 2) return account.name;
  const numbers = sameName.map((candidate) => candidate.number?.trim() ?? '');
  if (numbers.every(Boolean) && new Set(numbers).size === sameName.length) return `${account.name} · ${account.number}`;
  const shortIdsAreUnique = new Set(sameName.map((candidate) => candidate.id.slice(-4))).size === sameName.length;
  return `${account.name} · ${shortIdsAreUnique ? account.id.slice(-4) : account.id}`;
}

export type FinancePersonRole = 'Owner' | 'Lender' | 'Borrower';

export type FinancePerson = {
  id: string;
  name: string;
  phone?: string;
  description?: string;
  roles: FinancePersonRole[];
  status: FinanceAccountStatus;
};

export function financePersonOptionLabel(person: FinancePerson, candidates: FinancePerson[]): string {
  const sameName = candidates.filter((candidate) => candidate.name.trim().toLocaleLowerCase() === person.name.trim().toLocaleLowerCase());
  if (sameName.length < 2) return person.name + (person.phone ? ' · ' + person.phone : '');
  const uniqueValue = (read: (candidate: FinancePerson) => string | undefined) => {
    const values = sameName.map(read).map((value) => value?.trim() ?? '');
    return values.every(Boolean) && new Set(values).size === sameName.length;
  };
  if (uniqueValue((candidate) => candidate.phone)) return `${person.name} · ${person.phone}`;
  if (uniqueValue((candidate) => candidate.description)) return `${person.name} · ${person.description}`;
  const shortIdsAreUnique = new Set(sameName.map((candidate) => candidate.id.slice(-4))).size === sameName.length;
  const identity = shortIdsAreUnique ? person.id.slice(-4) : person.id;
  return `${person.name} · ${identity}`;
}

export type FinanceTransactionType =
  | 'Owner Credit'
  | 'Owner Debit'
  | 'Lender Credit'
  | 'Lender Debit'
  | 'Borrower Debit'
  | 'Borrower Credit'
  | 'Opening Owner Capital'
  | 'Opening Loan'
  | 'Opening Borrower Loan'
  | 'Manual Bank Entry'
  | 'Transfer';

export type FinancePaymentSplit = {
  method: 'Cash' | 'Bank' | 'Mobile Banking';
  account: string;
  accountId: string;
  amount: number;
};

export type FinanceTransaction = {
  id: string;
  date: string;
  type: FinanceTransactionType;
  relationship?: 'Owner Balance' | 'Lender Balance' | 'Borrower Balance';
  party?: string;
  partyId?: string;
  method?: 'Cash' | 'Bank' | 'Mobile Banking';
  account?: string;
  accountId?: string;
  paymentAccounts?: FinancePaymentSplit[];
  amount: number;
  direction: 'in' | 'out' | 'none';
  reference?: string;
  note?: string;
  status: 'Active' | 'Reversed';
  createdBy: string;
};

export type AccountTransfer = {
  id: string;
  date: string;
  from: string;
  to: string;
  /** Stable endpoints; optional only for legacy transfer records. */
  fromAccountId?: string;
  toAccountId?: string;
  amount: number;
  reference?: string;
  status: 'Completed' | 'Reversed';
};

export type CashSessionRecord = {
  id: string;
  date: string;
  openedAt: string;
  closedAt?: string;
  openingCash: number;
  expectedCash: number;
  countedCash?: number;
  variance?: number;
  status: 'Open' | 'Closed' | 'Closing';
  note?: string;
};

export const financeAccounts: FinanceAccount[] = [
  {
    id: 'acc-cash',
    name: 'Main Cash Counter',
    type: 'Cash',
    balance: 48250,
    openingBalance: 15000,
    status: 'Active',
    lastActivity: 'Today, 8:42 PM'
  },
  {
    id: 'acc-dbl',
    name: 'Dutch-Bangla Bank · 4582',
    type: 'Bank',
    institution: 'Dutch-Bangla Bank',
    number: '•••• 4582',
    balance: 214650,
    openingBalance: 100000,
    status: 'Active',
    lastActivity: 'Today, 6:10 PM'
  },
  {
    id: 'acc-brac',
    name: 'BRAC Bank · 7714',
    type: 'Bank',
    institution: 'BRAC Bank',
    number: '•••• 7714',
    balance: 86500,
    openingBalance: 50000,
    status: 'Active',
    lastActivity: '05 Oct 2026'
  },
  {
    id: 'acc-bkash',
    name: 'bKash Business · 412',
    type: 'Mobile Banking',
    institution: 'bKash',
    number: '01711•••412',
    balance: 32780,
    openingBalance: 10000,
    status: 'Active',
    lastActivity: 'Today, 7:54 PM'
  },
  {
    id: 'acc-nagad',
    name: 'Nagad Merchant · 771',
    type: 'Mobile Banking',
    institution: 'Nagad',
    number: '01819•••771',
    balance: 14920,
    openingBalance: 5000,
    status: 'Active',
    lastActivity: 'Today, 5:21 PM'
  }
];

export const financePeople: FinancePerson[] = [
  { id: 'fp1', name: 'Md. Anisur Rahman', phone: '01711 234567', roles: ['Owner'], status: 'Active', description: 'Owner' },
  { id: 'fp2', name: 'Hafizur Rahman', phone: '01812 442188', roles: ['Lender'], status: 'Active', description: 'Family lender' },
  { id: 'fp3', name: 'Rasel Enterprise', phone: '01915 772904', roles: ['Borrower'], status: 'Active', description: 'Short-term business loan' },
  { id: 'fp4', name: 'Abdul Karim', phone: '01713 551122', roles: ['Owner', 'Lender'], status: 'Active', description: 'Partner and occasional lender' }
];

export const financeTransactions: FinanceTransaction[] = [
  {
    id: 'FIN-000188',
    date: '06 Oct 2026',
    type: 'Owner Credit',
    relationship: 'Owner Balance',
    party: 'Md. Anisur Rahman',
    partyId: 'fp1',
    method: 'Bank',
    account: 'Dutch-Bangla Bank · 4582',
    accountId: 'acc-dbl',
    amount: 50000,
    direction: 'in',
    reference: 'CAP-1006',
    note: 'Additional working capital',
    status: 'Active',
    createdBy: 'Anisur Rahman'
  },
  {
    id: 'FIN-000187',
    date: '05 Oct 2026',
    type: 'Lender Debit',
    relationship: 'Lender Balance',
    party: 'Hafizur Rahman',
    partyId: 'fp2',
    method: 'Bank',
    account: 'BRAC Bank · 7714',
    accountId: 'acc-brac',
    amount: 20000,
    direction: 'out',
    reference: 'LOAN-REP-22',
    status: 'Active',
    createdBy: 'Anisur Rahman'
  },
  {
    id: 'FIN-000186',
    date: '04 Oct 2026',
    type: 'Borrower Debit',
    relationship: 'Borrower Balance',
    party: 'Rasel Enterprise',
    partyId: 'fp3',
    method: 'Cash',
    account: 'Main Cash Counter',
    accountId: 'acc-cash',
    amount: 15000,
    direction: 'out',
    reference: 'BL-0410',
    note: 'Short-term business advance',
    status: 'Active',
    createdBy: 'Anisur Rahman'
  },
  {
    id: 'FIN-000185',
    date: '03 Oct 2026',
    type: 'Lender Credit',
    relationship: 'Lender Balance',
    party: 'Abdul Karim',
    partyId: 'fp4',
    method: 'Mobile Banking',
    account: 'bKash Business · 412',
    accountId: 'acc-bkash',
    amount: 30000,
    direction: 'in',
    reference: 'LN-3003',
    status: 'Active',
    createdBy: 'Anisur Rahman'
  },
  {
    id: 'FIN-000184',
    date: '01 Oct 2026',
    type: 'Opening Owner Capital',
    relationship: 'Owner Balance',
    party: 'Md. Anisur Rahman',
    partyId: 'fp1',
    amount: 325000,
    direction: 'none',
    note: 'Opening relationship balance only — no cash movement',
    status: 'Active',
    createdBy: 'System'
  }
];

export const accountTransfers: AccountTransfer[] = [
  { id: 'TRF-000041', date: '06 Oct 2026', from: 'Main Cash Counter', to: 'Dutch-Bangla Bank · 4582', amount: 25000, reference: 'Cash deposit', status: 'Completed' },
  { id: 'TRF-000040', date: '05 Oct 2026', from: 'bKash Business · 412', to: 'BRAC Bank · 7714', amount: 12000, reference: 'Wallet settlement', status: 'Completed' },
  { id: 'TRF-000039', date: '02 Oct 2026', from: 'Dutch-Bangla Bank · 4582', to: 'Nagad Merchant · 771', amount: 8000, reference: 'Merchant float', status: 'Completed' }
];

export const cashSessions: CashSessionRecord[] = [
  {
    id: 'CS-000241',
    date: '06 Oct 2026',
    openedAt: '9:02 AM',
    openingCash: 32000,
    expectedCash: 48250,
    status: 'Open',
    note: 'Morning opening count'
  },
  {
    id: 'CS-000240',
    date: '05 Oct 2026',
    openedAt: '9:10 AM',
    closedAt: '9:04 PM',
    openingCash: 28000,
    expectedCash: 41350,
    countedCash: 41300,
    variance: -50,
    status: 'Closed',
    note: '৳50 short — needs reconciliation'
  },
  {
    id: 'CS-000239',
    date: '04 Oct 2026',
    openedAt: '9:06 AM',
    closedAt: '8:46 PM',
    openingCash: 30000,
    expectedCash: 37780,
    countedCash: 37780,
    variance: 0,
    status: 'Closed'
  }
];

export const relationshipSummary = {
  ownerCapital: 325000,
  ownerAdvance: 0,
  outstandingLoan: 60000,
  lenderCredit: 0,
  borrowerReceivable: 15000,
  borrowerCredit: 0
};
