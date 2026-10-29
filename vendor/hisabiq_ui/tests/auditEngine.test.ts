import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyCorrection,
  applyDelete,
  auditTimelineFor,
  buildImpactPreview,
  createAuditState,
  validateCorrection,
  validateDelete
} from '../src/utils/auditEngine.ts';
import type { AuditSourceRecord, CorrectionCommand, DeleteCommand } from '../src/types/audit.ts';

const sale: AuditSourceRecord = {
  id: 'sale-1',
  source: 'sale',
  reference: 'INV-1',
  transactionDate: '2026-10-07',
  createdAt: '2026-10-07T10:00:00+06:00',
  postedBy: 'Rahim',
  amount: 15000,
  paid: 10000,
  due: 5000,
  paymentAccounts: [{ account: 'bKash Business · 412', amount: 10000 }],
  cogs: 9000,
  description: 'Sale to Rahman Hardware',
  partyId: 'c1',
  party: 'Rahman Hardware',
  quantity: 5,
  returnedQuantity: 2,
  status: 'Posted'
};

function command(patch: CorrectionCommand['patch'], reason = 'Correcting wrong entry'): CorrectionCommand {
  return {
    sourceId: sale.id,
    patch,
    reason,
    user: 'Shuvo',
    at: '2026-10-07T15:00:00+06:00'
  };
}

test('transaction date can change without changing immutable created date', () => {
  const before = createAuditState([sale]);
  const after = applyCorrection(command({ transactionDate: '2026-10-05' }), before);
  const updated = after.sources.find((item) => item.id === sale.id)!;

  assert.equal(updated.transactionDate, '2026-10-05');
  assert.equal(updated.createdAt, sale.createdAt);
  const event = auditTimelineFor(after, sale.id)[0];
  assert.deepEqual(event.changes[0], { field: 'transactionDate', before: '2026-10-07', after: '2026-10-05' });
  assert.equal(event.reason, 'Correcting wrong entry');
});

test('changing customer moves due balance from old party to new party', () => {
  const before = createAuditState([sale]);
  const after = applyCorrection(command({ partyId: 'c2', party: 'Karim Hardware' }), before);

  assert.equal(after.partyBalances.c1 ?? 0, 0);
  assert.equal(after.partyBalances.c2, 5000);
});

test('changing payment account moves money effect between accounts', () => {
  const before = createAuditState([sale]);
  const after = applyCorrection(command({
    paymentAccounts: [{ account: 'Dutch-Bangla Bank · 4582', amount: 10000 }]
  }), before);

  assert.equal(before.moneyBalances['bKash Business · 412'], 10000);
  assert.equal(after.moneyBalances['bKash Business · 412'] ?? 0, 0);
  assert.equal(after.moneyBalances['Dutch-Bangla Bank · 4582'], 10000);
});

test('changing amount recalculates due and balanced accounting posting atomically', () => {
  const before = createAuditState([sale]);
  const after = applyCorrection(command({ amount: 14000 }), before);
  const updated = after.sources[0];
  const posting = after.postings[0];

  assert.equal(updated.amount, 14000);
  assert.equal(updated.due, 4000);
  assert.ok(posting.lines.some((line) => line.accountId === 'asset-ar' && line.debit === 4000));
  assert.ok(posting.lines.some((line) => line.accountId === 'income-sales' && line.credit === 14000));
  assert.equal(
    posting.lines.reduce((sum, line) => sum + line.debit, 0),
    posting.lines.reduce((sum, line) => sum + line.credit, 0)
  );
});

test('dependency validation blocks only invalid quantity while leaving other fields valid', () => {
  const state = createAuditState([sale]);
  const result = validateCorrection(command({ quantity: 1, partyId: 'c2', party: 'Karim Hardware' }), state);

  assert.equal(result.allowed, false);
  assert.match(result.fieldErrors.quantity ?? '', /returned/i);
  assert.equal(result.fieldErrors.party, undefined);
  assert.equal(result.fieldErrors.partyId, undefined);
});

test('financial changes require a reason but note-only edit does not', () => {
  const state = createAuditState([sale]);
  assert.match(validateCorrection(command({ amount: 14000 }, ''), state).fieldErrors._reason ?? '', /reason/i);
  assert.equal(validateCorrection(command({ note: 'Spelling corrected' }, ''), state).allowed, true);
});

test('impact preview lists before-after changes and only relevant effects', () => {
  const state = createAuditState([sale]);
  const preview = buildImpactPreview(command({
    transactionDate: '2026-10-05',
    paymentAccounts: [{ account: 'Dutch-Bangla Bank · 4582', amount: 10000 }]
  }), state);

  assert.deepEqual(preview.changes.map((item) => item.field), ['transactionDate', 'paymentAccounts']);
  assert.ok(preview.impacts.includes('Daybook'));
  assert.ok(preview.impacts.includes('Money Accounts'));
  assert.ok(preview.impacts.includes('Accounting posting'));
  assert.equal(preview.impacts.includes('Stock'), false);
});

test('delete blocks a source with dependent return and explains the blocker', () => {
  const state = createAuditState([sale]);
  const validation = validateDelete({
    sourceId: sale.id,
    reason: 'Wrong transaction',
    user: 'Shuvo',
    at: '2026-10-07T16:00:00+06:00'
  }, state);
  assert.equal(validation.allowed, false);
  assert.match(validation.message ?? '', /return/i);
});

test('delete undoes the complete source posting and retains immutable audit history', () => {
  const cleanSale = { ...sale, returnedQuantity: 0 };
  const before = createAuditState([cleanSale]);
  const deleteCommand: DeleteCommand = {
    sourceId: cleanSale.id,
    reason: 'Duplicate transaction',
    user: 'Shuvo',
    at: '2026-10-07T16:00:00+06:00'
  };
  const after = applyDelete(deleteCommand, before);

  assert.equal(after.sources[0].status, 'Deleted');
  assert.equal(after.postings[0].status, 'Deleted');
  assert.equal(after.moneyBalances['bKash Business · 412'] ?? 0, 0);
  assert.equal(after.partyBalances.c1 ?? 0, 0);
  const event = auditTimelineFor(after, sale.id)[0];
  assert.equal(event.type, 'Deleted');
  assert.equal(event.reason, 'Duplicate transaction');
  assert.equal(Object.isFrozen(event), true);
  assert.equal(Object.isFrozen(event.changes), true);
});


test('every Audit Ledger posting references a known accounting account', async () => {
  const { auditSourceRecords } = await import('../src/data/auditLedger.ts');
  const { accountingAccounts } = await import('../src/data/accounting.ts');
  const known = new Set(accountingAccounts.map((account) => account.id));
  const state = createAuditState(auditSourceRecords);

  for (const posting of state.postings) {
    for (const line of posting.lines) {
      assert.equal(known.has(line.accountId), true, `Unknown account ${line.accountId} in ${posting.reference}`);
    }
  }
});
