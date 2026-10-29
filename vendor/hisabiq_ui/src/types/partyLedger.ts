import type { Party, PartyRole } from './erp';
import type { FinanceTransactionType } from '../data/financeAccounts';

export type PartyRelationship = PartyRole;
export type PartyLedgerSource = 'sale' | 'sale-return' | 'customer-payment' | 'customer-credit-refund' | 'supplier-credit-refund' | 'customer-credit-apply' | 'purchase' | 'purchase-return' | 'supplier-payment' | 'finance' | 'expense' | 'opening' | 'note';
export type PartyLedgerRow = {
  id: string;
  partyId: string;
  relationship: PartyRelationship;
  source: PartyLedgerSource;
  sourceId?: string;
  reference?: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  amountPaid?: number;
  discount?: number;
  method?: string;
  accountId?: string;
  financeType?: FinanceTransactionType;
  attachment?: {name:string; url?:string};
  status: 'Active' | 'Reversed' | 'Deleted';
  isCorrection?: boolean;
  sequence: number;
};
export type PartySourceRecord = {
  id: string;
  partyId: string;
  relationship: PartyRelationship;
  kind: PartyLedgerSource;
  date: string;
  sequence: number;
  reference?: string;
  description: string;
  debit: number;
  credit: number;
  amountPaid?: number;
  discount?: number;
  method?: string;
  accountId?: string;
  invoiceId?: string;
  financeType?: FinanceTransactionType;
  /** Credit-proof for settlement replay; legacy fixtures are never refund-eligible by default. */
  provenance?: 'verified' | 'legacy-unverified';
  paymentSplits?: Array<{id:string; method:'Cash'|'Bank'|'Mobile Banking'; accountId:string; amount:number}>;
  status: 'Active' | 'Reversed' | 'Deleted';
  createdAt?: string;
  importSessionId?:string;
  importSourceSheet?:string;
  importSourceRow?:number;
};
export type PartyAuditEvent = {id:string; sourceId?:string; partyId:string; action:string; before?:unknown; after?:unknown; actor:string; at:string; reason?:string; importSessionId?:string; sourceSheet?:string; sourceRow?:number; relationship?:PartyRelationship};
export type PartyMoneySplit = { id:string; method:'Cash'|'Bank'|'Mobile Banking'; accountId:string; amount:number };
export type PartyPaymentPayload = {
  partyId:string; relationship:'Customer'|'Supplier'; date:string; amount:number;
  discount?:number; reason?:string; invoiceId?:string; operationId?:string;
  splits:PartyMoneySplit[];
};
export type PartyOpeningPayload = {
  partyId:string; relationship:PartyRelationship; date:string; amount:number;
  side:'debit'|'credit'; note?:string;
};
export type PartyRefundPayload = {
  partyId:string; relationship:'Customer'|'Supplier'; date:string;
  amount:number; reason:string; operationId?:string; splits:PartyMoneySplit[];
};
export type PartyFinancePayload = {
  partyId:string; relationship:'Owner'|'Lender'|'Borrower'; financeType:FinanceTransactionType;
  amount:number; date:string; operationId?:string; note?:string; reference?:string;
  splits:PartyMoneySplit[];
};
export type PartyPreviewState = { parties: Party[]; sources: PartySourceRecord[]; audit: PartyAuditEvent[]; revision: number };
export type LedgerStatement = {
  partyId:string;
  relationship:PartyRelationship;
  from:string;
  to:string;
  openingBalance:number;
  rows:Array<PartyLedgerRow & {runningBalance:number}>;
  periodDebit:number;
  periodCredit:number;
  closingBalance:number;
};
export type PartyBalanceSummary = { relationship:PartyRelationship; netBalance:number; due:number; availableCredit:number; refundableCredit:number; labels:Record<string,number> };
export type PartyAction = 'view'|'edit'|'delete'|'reverse'|'print'|'return'|'source';
export type PartyDraft = Pick<Party,'name'|'roles'|'phone'|'area'> & Partial<Party>;
