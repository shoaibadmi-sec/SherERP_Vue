import type { AccountingGroup, AccountingSourceTransaction, PostingLine } from '../types/accounting.ts';
import type { AuditSourceRecord } from '../types/audit.ts';
import type { ChequeDirection, ChequeStatus } from '../data/cheques.ts';
import type { TransactionSource } from '../types/transactions.ts';

export type ChequeLifecycleAction = {
  id: string;
  label: string;
  nextStatus: ChequeStatus;
  tone?: 'default' | 'warning' | 'danger';
  reasonRequired?: boolean;
};

const action = (
  id: string,
  label: string,
  nextStatus: ChequeStatus,
  tone: ChequeLifecycleAction['tone'] = 'default',
  reasonRequired = false
): ChequeLifecycleAction => ({ id, label, nextStatus, tone, reasonRequired });

export function chequeLifecycleActions(input: { direction: ChequeDirection; status: ChequeStatus }): ChequeLifecycleAction[] {
  if (input.status === 'Cleared' || input.status === 'Cancelled' || input.status === 'Stopped' || input.status === 'Returned' || input.status === 'Bounced') return [];

  if (input.direction === 'Received') {
    if (input.status === 'Received') {
      return [
        action('deposit', 'Mark deposited', 'Deposited'),
        action('return', 'Return cheque', 'Returned', 'warning', true),
        action('cancel', 'Cancel cheque', 'Cancelled', 'danger', true)
      ];
    }
    if (input.status === 'Deposited') {
      return [
        action('clear', 'Mark cleared', 'Cleared'),
        action('bounce', 'Mark bounced', 'Bounced', 'danger', true),
        action('return', 'Return cheque', 'Returned', 'warning', true)
      ];
    }
  }

  if (input.direction === 'Issued') {
    if (input.status === 'Issued') {
      return [
        action('present', 'Mark presented', 'Presented'),
        action('stop', 'Stop payment', 'Stopped', 'warning', true),
        action('cancel', 'Cancel cheque', 'Cancelled', 'danger', true)
      ];
    }
    if (input.status === 'Presented') {
      return [
        action('clear', 'Mark cleared', 'Cleared'),
        action('stop', 'Stop payment', 'Stopped', 'warning', true),
        action('return', 'Mark returned', 'Returned', 'danger', true)
      ];
    }
  }

  return [];
}

const duplicableDaybookSources = new Set<TransactionSource>(['sale']);

export type DaybookContextAction = 'print' | 'duplicate' | 'go-source';

export function daybookContextActions(source: TransactionSource): DaybookContextAction[] {
  return duplicableDaybookSources.has(source)
    ? ['print', 'duplicate', 'go-source']
    : ['print', 'go-source'];
}

export function isManualAccountingSource(source: AccountingSourceTransaction['source']) {
  return source === 'receipt-voucher' ||
    source === 'payment-voucher' ||
    source === 'transfer' ||
    source === 'adjustment' ||
    source === 'opening-balance';
}

export function openingBalanceLines(
  accountId: string,
  group: AccountingGroup,
  amount: number
): PostingLine[] {
  if (group === 'Asset' || group === 'Expense') {
    return [
      { accountId, debit: amount, credit: 0 },
      { accountId: 'equity-opening', debit: 0, credit: amount }
    ];
  }
  return [
    { accountId: 'equity-opening', debit: amount, credit: 0 },
    { accountId, debit: 0, credit: amount }
  ];
}

export function auditDeleteImpact(source: Pick<AuditSourceRecord, 'source'> & Partial<AuditSourceRecord>) {
  const impacts = ['Source transaction'];
  if (source.partyId || source.party) impacts.push('Party balance');
  if (source.source === 'transfer' || source.paymentAccounts?.length) impacts.push('Money Accounts');
  if ((source.source === 'sale' || source.source === 'purchase') && (source.quantity !== undefined || source.cogs !== undefined)) impacts.push('Stock / COGS');
  impacts.push('Accounting posting', 'Daybook', 'Affected reports');
  return impacts;
}
