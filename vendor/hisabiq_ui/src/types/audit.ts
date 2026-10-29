import type { AccountingSourceTransaction, Posting } from './accounting';

export type AuditSourceRecord = AccountingSourceTransaction & {
  partyId?: string;
  party?: string;
  quantity?: number;
  returnedQuantity?: number;
  note?: string;
  status: 'Posted' | 'Deleted';
};

export type AuditChange = Readonly<{
  field: string;
  before: unknown;
  after: unknown;
}>;

export type AuditEventType = 'Created' | 'Edited' | 'Deleted' | 'Posting rebuilt';

export type AuditEvent = Readonly<{
  id: string;
  sourceId: string;
  type: AuditEventType;
  user: string;
  at: string;
  reason?: string;
  changes: readonly AuditChange[];
}>;

export type CorrectionPatch = Partial<Pick<
  AuditSourceRecord,
  | 'transactionDate'
  | 'reference'
  | 'partyId'
  | 'party'
  | 'amount'
  | 'paid'
  | 'due'
  | 'paymentAccounts'
  | 'cogs'
  | 'description'
  | 'note'
  | 'quantity'
  | 'expenseAccountId'
  | 'debitAccountId'
  | 'creditAccountId'
  | 'fromAccount'
  | 'toAccount'
>>;

export type CorrectionCommand = {
  sourceId: string;
  patch: CorrectionPatch;
  reason: string;
  user: string;
  at: string;
};

export type DeleteCommand = {
  sourceId: string;
  reason: string;
  user: string;
  at: string;
};

export type AuditValidation = {
  allowed: boolean;
  fieldErrors: Record<string, string>;
};

export type DeleteValidation = {
  allowed: boolean;
  message?: string;
};

export type AuditImpact = {
  changes: AuditChange[];
  impacts: string[];
};

export type AuditState = {
  sources: AuditSourceRecord[];
  postings: Posting[];
  auditEvents: AuditEvent[];
  moneyBalances: Record<string, number>;
  partyBalances: Record<string, number>;
};
