import { postingForTransaction } from './accountingProjection.ts';
import type {
  AuditChange,
  AuditEvent,
  AuditImpact,
  AuditSourceRecord,
  AuditState,
  AuditValidation,
  CorrectionCommand,
  DeleteCommand
} from '../types/audit.ts';

const financialFields = new Set([
  'transactionDate',
  'reference',
  'partyId',
  'party',
  'amount',
  'paid',
  'due',
  'paymentAccounts',
  'cogs',
  'quantity',
  'expenseAccountId',
  'debitAccountId',
  'creditAccountId',
  'fromAccount',
  'toAccount'
]);

function freezeEvent(event: Omit<AuditEvent, 'changes'> & { changes: AuditChange[] }): AuditEvent {
  const changes = Object.freeze(event.changes.map((change) => Object.freeze({ ...change })));
  return Object.freeze({ ...event, changes });
}

function rebuildDerived(sources: AuditSourceRecord[], auditEvents: AuditEvent[]): AuditState {
  const postings = sources.map((source) => {
    const entry = postingForTransaction(source);
    return source.status === 'Deleted' ? { ...entry, status: 'Deleted' as const } : entry;
  });

  const moneyBalances: Record<string, number> = {};
  const partyBalances: Record<string, number> = {};

  for (const source of sources) {
    if (source.status !== 'Posted') continue;

    const moneySign =
      source.source === 'sale' || source.source === 'customer-payment' || source.source === 'receipt-voucher'
        ? 1
        : source.source === 'purchase' || source.source === 'supplier-payment' || source.source === 'expense' || source.source === 'payment-voucher'
          ? -1
          : 0;

    if (source.source === 'transfer') {
      if (source.fromAccount) moneyBalances[source.fromAccount] = (moneyBalances[source.fromAccount] ?? 0) - source.amount;
      if (source.toAccount) moneyBalances[source.toAccount] = (moneyBalances[source.toAccount] ?? 0) + source.amount;
    } else if (moneySign) {
      for (const payment of source.paymentAccounts ?? []) {
        moneyBalances[payment.account] = (moneyBalances[payment.account] ?? 0) + payment.amount * moneySign;
      }
    }

    if (source.partyId) {
      if (source.source === 'sale') partyBalances[source.partyId] = (partyBalances[source.partyId] ?? 0) + source.due;
      if (source.source === 'customer-payment') partyBalances[source.partyId] = (partyBalances[source.partyId] ?? 0) - source.amount;
      if (source.source === 'purchase') partyBalances[source.partyId] = (partyBalances[source.partyId] ?? 0) - source.due;
      if (source.source === 'supplier-payment') partyBalances[source.partyId] = (partyBalances[source.partyId] ?? 0) + source.amount;
    }
  }

  return { sources, postings, auditEvents, moneyBalances, partyBalances };
}

export function createAuditState(sources: AuditSourceRecord[]): AuditState {
  return rebuildDerived(sources.map((source) => ({ ...source })), []);
}

function sourceFor(state: AuditState, sourceId: string) {
  return state.sources.find((source) => source.id === sourceId);
}

function changesFor(source: AuditSourceRecord, patch: CorrectionCommand['patch']): AuditChange[] {
  return Object.entries(patch)
    .filter(([field, after]) => JSON.stringify(source[field as keyof AuditSourceRecord]) !== JSON.stringify(after))
    .map(([field, after]) => ({
      field,
      before: source[field as keyof AuditSourceRecord],
      after
    }));
}

export function validateCorrection(command: CorrectionCommand, state: AuditState): AuditValidation {
  const source = sourceFor(state, command.sourceId);
  if (!source) return { allowed: false, fieldErrors: { _source: 'Source transaction not found.' } };

  const fieldErrors: Record<string, string> = {};
  if (source.status === 'Deleted') fieldErrors._source = 'Deleted transactions cannot be corrected.';

  const fields = Object.keys(command.patch);
  if (fields.some((field) => financialFields.has(field)) && !command.reason.trim()) {
    fieldErrors._reason = 'A reason is required for financial changes.';
  }

  if (typeof command.patch.quantity === 'number' &&
      typeof source.returnedQuantity === 'number' &&
      command.patch.quantity < source.returnedQuantity) {
    fieldErrors.quantity = 'Quantity cannot be lower than the already returned quantity (' + source.returnedQuantity + ').';
  }

  const nextAmount = command.patch.amount ?? source.amount;
  const nextPaid = command.patch.paid ?? source.paid;
  if (nextPaid > nextAmount) fieldErrors.paid = 'Paid amount cannot be greater than the transaction amount.';

  const nextFrom = command.patch.fromAccount ?? source.fromAccount;
  const nextTo = command.patch.toAccount ?? source.toAccount;
  if (source.source === 'transfer' && nextFrom && nextTo && nextFrom === nextTo) {
    fieldErrors.toAccount = 'From and To money accounts must be different.';
  }

  if (command.patch.paymentAccounts) {
    const splitTotal = command.patch.paymentAccounts.reduce((sum, payment) => sum + payment.amount, 0);
    if (Math.abs(splitTotal - nextPaid) > 0.001) fieldErrors.paymentAccounts = 'Payment split must equal the paid amount.';
  }

  return { allowed: Object.keys(fieldErrors).length === 0, fieldErrors };
}

function impactNames(source: AuditSourceRecord, fields: string[]) {
  const impacts = new Set<string>();

  if (fields.length) impacts.add('Source transaction');
  if (fields.includes('transactionDate')) {
    impacts.add('Daybook');
    impacts.add('Ledger');
    impacts.add('Accounting posting');
    impacts.add('Reports');
  }
  if (fields.some((field) => ['party', 'partyId', 'amount', 'paid', 'due'].includes(field))) {
    impacts.add('Party balance');
    impacts.add('Daybook');
    impacts.add('Accounting posting');
  }
  if (fields.some((field) => ['paymentAccounts', 'amount', 'paid', 'fromAccount', 'toAccount'].includes(field))) {
    impacts.add('Money Accounts');
    impacts.add('Accounting posting');
  }
  if (source.source === 'sale' && fields.some((field) => ['quantity', 'cogs'].includes(field))) {
    impacts.add('Stock');
    impacts.add('Profit & Loss');
    impacts.add('Accounting posting');
  }
  if (fields.some((field) => ['expenseAccountId', 'debitAccountId', 'creditAccountId', 'fromAccount', 'toAccount'].includes(field))) {
    impacts.add('Accounting posting');
    impacts.add('Reports');
  }

  return Array.from(impacts);
}

export function buildImpactPreview(command: CorrectionCommand, state: AuditState): AuditImpact {
  const source = sourceFor(state, command.sourceId);
  if (!source) return { changes: [], impacts: [] };
  const changes = changesFor(source, command.patch);
  return { changes, impacts: impactNames(source, changes.map((change) => change.field)) };
}

export function applyCorrection(command: CorrectionCommand, state: AuditState): AuditState {
  const validation = validateCorrection(command, state);
  if (!validation.allowed) throw new Error(Object.values(validation.fieldErrors)[0] ?? 'Correction is not allowed.');

  const source = sourceFor(state, command.sourceId)!;
  const changes = changesFor(source, command.patch);
  if (!changes.length) return state;

  const updated: AuditSourceRecord = { ...source, ...command.patch };
  if (('amount' in command.patch || 'paid' in command.patch) && !('due' in command.patch)) {
    updated.due = Math.max(0, updated.amount - updated.paid);
  }

  const nextSources = state.sources.map((item) => item.id === source.id ? updated : item);
  const event = freezeEvent({
    id: 'audit-' + source.id + '-' + (state.auditEvents.length + 1),
    sourceId: source.id,
    type: 'Edited',
    user: command.user,
    at: command.at,
    reason: command.reason.trim() || undefined,
    changes
  });

  return rebuildDerived(nextSources, [...state.auditEvents, event]);
}

export function validateDelete(command: DeleteCommand, state: AuditState) {
  const source = sourceFor(state, command.sourceId);
  if (!source) return { allowed: false, message: 'Source transaction not found.' };
  if (!command.reason.trim()) return { allowed: false, message: 'A reason is required to delete a posted transaction.' };
  if (source.status === 'Deleted') return { allowed: false, message: 'This transaction is already deleted.' };
  if (source.source === 'sale' && (source.returnedQuantity ?? 0) > 0) {
    return { allowed: false, message: 'This sale has a Return. Delete or correct the Return first.' };
  }
  return { allowed: true };
}

export function applyDelete(command: DeleteCommand, state: AuditState): AuditState {
  const validation = validateDelete(command, state);
  if (!validation.allowed) throw new Error(validation.message ?? 'Delete is not allowed.');
  const source = sourceFor(state, command.sourceId)!;

  const deleted: AuditSourceRecord = { ...source, status: 'Deleted' };
  const nextSources = state.sources.map((item) => item.id === source.id ? deleted : item);
  const event = freezeEvent({
    id: 'audit-' + source.id + '-' + (state.auditEvents.length + 1),
    sourceId: source.id,
    type: 'Deleted',
    user: command.user,
    at: command.at,
    reason: command.reason.trim(),
    changes: [{ field: 'status', before: 'Posted', after: 'Deleted' }]
  });

  return rebuildDerived(nextSources, [...state.auditEvents, event]);
}

export function auditTimelineFor(state: AuditState, sourceId: string) {
  return state.auditEvents.filter((event) => event.sourceId === sourceId).slice().reverse();
}

export function deletePostingLine(): never {
  throw new Error('Deleting an individual Debit/Credit posting line is not supported.');
}
