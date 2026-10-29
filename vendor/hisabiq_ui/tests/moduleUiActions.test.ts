import assert from 'node:assert/strict';
import test from 'node:test';

import {
  auditDeleteImpact,
  chequeLifecycleActions,
  daybookContextActions,
  isManualAccountingSource,
  openingBalanceLines
} from '../src/utils/moduleUiActions.ts';

test('received cheque lifecycle exposes deposit and settlement states', () => {
  assert.deepEqual(
    chequeLifecycleActions({ direction: 'Received', status: 'Received' }).map((item) => item.nextStatus),
    ['Deposited', 'Returned', 'Cancelled']
  );
  assert.deepEqual(
    chequeLifecycleActions({ direction: 'Received', status: 'Deposited' }).map((item) => item.nextStatus),
    ['Cleared', 'Bounced', 'Returned']
  );
});

test('issued cheque lifecycle exposes presented, cleared and stop states', () => {
  assert.deepEqual(
    chequeLifecycleActions({ direction: 'Issued', status: 'Issued' }).map((item) => item.nextStatus),
    ['Presented', 'Stopped', 'Cancelled']
  );
  assert.deepEqual(
    chequeLifecycleActions({ direction: 'Issued', status: 'Presented' }).map((item) => item.nextStatus),
    ['Cleared', 'Stopped', 'Returned']
  );
  assert.deepEqual(chequeLifecycleActions({ direction: 'Issued', status: 'Cleared' }), []);
});

test('daybook duplicate is limited to source-owned reusable transactions', () => {
  assert.deepEqual(daybookContextActions('sale'), ['print', 'duplicate', 'go-source']);
  assert.deepEqual(daybookContextActions('expense'), ['print', 'go-source']);
  assert.deepEqual(daybookContextActions('customer-payment'), ['print', 'go-source']);
  assert.deepEqual(daybookContextActions('transfer'), ['print', 'go-source']);
});

test('manual accounting sources are owned by Accounts', () => {
  for (const source of ['receipt-voucher', 'payment-voucher', 'transfer', 'adjustment'] as const) {
    assert.equal(isManualAccountingSource(source), true);
  }
  assert.equal(isManualAccountingSource('sale'), false);
});

test('opening balance lines stay balanced against opening equity', () => {
  assert.deepEqual(openingBalanceLines('asset-bank', 'Asset', 25000), [
    { accountId: 'asset-bank', debit: 25000, credit: 0 },
    { accountId: 'equity-opening', debit: 0, credit: 25000 }
  ]);
  assert.deepEqual(openingBalanceLines('liability-loan', 'Liability', 12000), [
    { accountId: 'equity-opening', debit: 12000, credit: 0 },
    { accountId: 'liability-loan', debit: 0, credit: 12000 }
  ]);
});

test('audit delete preview is contextual rather than a generic checklist', () => {
  const impacts = auditDeleteImpact({
    source: 'sale',
    partyId: 'c1',
    paymentAccounts: [{ account: 'bKash', amount: 6000 }],
    quantity: 5,
    cogs: 4200
  });
  assert.deepEqual(impacts, [
    'Source transaction',
    'Party balance',
    'Money Accounts',
    'Stock / COGS',
    'Accounting posting',
    'Daybook',
    'Affected reports'
  ]);
});
