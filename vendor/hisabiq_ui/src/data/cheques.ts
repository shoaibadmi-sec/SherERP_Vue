export type ChequeDirection = 'Received' | 'Issued';
export type ChequeStatus = 'Received' | 'Issued' | 'Deposited' | 'Presented' | 'Cleared' | 'Bounced' | 'Returned' | 'Cancelled' | 'Stopped';

export type ChequeRecord = {
  id: string;
  direction: ChequeDirection;
  chequeNumber: string;
  bank: string;
  branch?: string;
  accountHolder?: string;
  amount: number;
  party: string;
  partyId?: string;
  receivedOrIssuedDate: string;
  chequeDate: string;
  depositAccount?: string;
  depositAccountId?: string;
  reference?: string;
  attachment?: string;
  note?: string;
  status: ChequeStatus;
  createdAt?: string;
  postedBy?: string;
  statusReason?: string;
  statusUpdatedAt?: string;
  statusUpdatedBy?: string;
};

export const cheques: ChequeRecord[] = [
  {
    id: 'CHQ-000031',
    direction: 'Received',
    chequeNumber: '458923',
    bank: 'Islami Bank Bangladesh',
    branch: 'Nawabpur',
    accountHolder: 'Rahman Hardware',
    amount: 35000,
    party: 'Rahman Hardware',
    partyId: 'c1',
    receivedOrIssuedDate: '2026-10-06',
    chequeDate: '2026-10-10',
    depositAccount: 'Dutch-Bangla Bank · 4582',
    depositAccountId: 'acc-dbl',
    reference: 'INV-000241',
    status: 'Received',
    createdAt: '2026-10-06T16:20:00+06:00',
    postedBy: 'Anis'
  },
  {
    id: 'CHQ-000030',
    direction: 'Issued',
    chequeNumber: '091144',
    bank: 'Dutch-Bangla Bank',
    amount: 22000,
    party: 'Karim Traders',
    partyId: 's1',
    receivedOrIssuedDate: '2026-10-05',
    chequeDate: '2026-10-08',
    depositAccount: 'Dutch-Bangla Bank · 4582',
    depositAccountId: 'acc-dbl',
    reference: 'PUR-000118',
    status: 'Presented',
    createdAt: '2026-10-05T14:05:00+06:00',
    postedBy: 'Shuvo'
  },
  {
    id: 'CHQ-000029',
    direction: 'Received',
    chequeNumber: '773210',
    bank: 'BRAC Bank',
    amount: 18500,
    party: 'Mim Construction',
    partyId: 'c3',
    receivedOrIssuedDate: '2026-10-03',
    chequeDate: '2026-10-03',
    depositAccount: 'BRAC Bank · 7714',
    depositAccountId: 'acc-brac',
    reference: 'INV-000236',
    status: 'Cleared',
    createdAt: '2026-10-03T11:45:00+06:00',
    postedBy: 'Rafiq'
  }
];
