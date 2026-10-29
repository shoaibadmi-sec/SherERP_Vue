import test from 'node:test';
import assert from 'node:assert/strict';
import { applyCorrection, applyDelete, auditTimelineFor, createAuditState } from '../src/utils/auditEngine.ts';
import { profitAndLoss, trialBalance } from '../src/utils/accountingProjection.ts';
import type { AuditSourceRecord } from '../src/types/audit.ts';

function balanced(posting: { lines: Array<{ debit: number; credit: number }> }) {
  const debit = posting.lines.reduce((sum, line) => sum + line.debit, 0);
  const credit = posting.lines.reduce((sum, line) => sum + line.credit, 0);
  return Math.abs(debit - credit) < 0.001;
}

test('partial sale, later payment, corrections and safe delete stay consistent end to end', () => {
  const sale: AuditSourceRecord = {
    id: 'sale-1',
    source: 'sale',
    reference: 'INV-1',
    transactionDate: '2026-10-07',
    createdAt: '2026-10-08T09:00:00+06:00',
    postedBy: 'Rahim',
    amount: 15000,
    paid: 10000,
    due: 5000,
    paymentAccounts: [{ account: 'bKash Business · 412', amount: 10000 }],
    cogs: 9000,
    partyId: 'c1',
    party: 'Rahman Hardware',
    description: 'Partial sale',
    status: 'Posted'
  };
  const laterPayment: AuditSourceRecord = {
    id: 'payment-1',
    source: 'customer-payment',
    reference: 'CP-1',
    transactionDate: '2026-10-07',
    createdAt: '2026-10-08T10:00:00+06:00',
    postedBy: 'Shuvo',
    amount: 5000,
    paid: 5000,
    due: 0,
    paymentAccounts: [{ account: 'Dutch-Bangla Bank · 4582', amount: 5000 }],
    partyId: 'c1',
    party: 'Rahman Hardware',
    description: 'Remaining invoice payment',
    status: 'Posted'
  };

  let state = createAuditState([sale, laterPayment]);

  assert.equal(state.moneyBalances['bKash Business · 412'], 10000);
  assert.equal(state.moneyBalances['Dutch-Bangla Bank · 4582'], 5000);
  assert.equal(state.partyBalances.c1, 0);
  assert.ok(state.postings.every(balanced));

  const pnlBefore = profitAndLoss(state.postings, { from: '2026-10-07', to: '2026-10-07' });
  assert.equal(pnlBefore.netProfit, 6000);

  state = applyCorrection({
    sourceId: 'sale-1',
    patch: { transactionDate: '2026-10-05' },
    reason: 'Invoice belongs to 5 Oct',
    user: 'Shuvo',
    at: '2026-10-08T11:00:00+06:00'
  }, state);
  const correctedSale = state.sources.find((item) => item.id === 'sale-1')!;
  assert.equal(correctedSale.transactionDate, '2026-10-05');
  assert.equal(correctedSale.createdAt, '2026-10-08T09:00:00+06:00');
  assert.equal(profitAndLoss(state.postings, { from: '2026-10-07', to: '2026-10-07' }).netProfit, 0);

  state = applyCorrection({
    sourceId: 'payment-1',
    patch: { paymentAccounts: [{ account: 'Main Cash Counter', amount: 5000 }] },
    reason: 'Payment was received in cash',
    user: 'Shuvo',
    at: '2026-10-08T11:10:00+06:00'
  }, state);
  assert.equal(state.moneyBalances['Dutch-Bangla Bank · 4582'] ?? 0, 0);
  assert.equal(state.moneyBalances['Main Cash Counter'], 5000);
  assert.ok(state.postings.every(balanced));

  state = applyDelete({
    sourceId: 'payment-1',
    reason: 'Duplicate payment',
    user: 'Shuvo',
    at: '2026-10-08T11:20:00+06:00'
  }, state);

  assert.equal(state.partyBalances.c1, 5000);
  assert.equal(state.moneyBalances['Main Cash Counter'] ?? 0, 0);
  assert.equal(state.postings.find((item) => item.sourceId === 'payment-1')?.status, 'Deleted');
  assert.equal(auditTimelineFor(state, 'payment-1')[0]?.type, 'Deleted');
  assert.ok(state.postings.filter((item) => item.status === 'Posted').every(balanced));

  const tb = trialBalance(state.postings);
  assert.equal(tb.totalDebit, tb.totalCredit);
});
