import { parties as partiesFromSeed, ledgerEntries as ledgerFromSeed } from '../src/data/parties.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePartyDraft, resolvePartySelection, matchesPartySearch } from '../src/utils/partyIdentity.ts';
import { normalizePartyFixture, financePersonIdByPartyId } from '../src/data/partyFixtureAdapter.ts';
import type { Party } from '../src/types/erp.ts';

const parties: Party[] = [
  { id: 'c1', name: 'Rahman Hardware', nameBn: 'রহমান হার্ডওয়্যার', phone: '01711', area: 'Dhaka', roles: ['Customer'], balance: 10, lastActivity: '', avatarColor: '#123456' },
  { id: 'c2', name: 'Hossain', phone: '01822', area: 'Dhaka', roles: ['Customer', 'Supplier'], balance: 0, lastActivity: '', avatarColor: '#123456' }
];

test('party drafts require a name and at least one distinct role', () => {
  assert.match(validatePartyDraft({ id: 'p3', name: ' ', phone: '', area: '', roles: [] }, parties).join(' '), /name/i);
  assert.match(validatePartyDraft({ id: 'p3', name: 'Shop', phone: '', area: '', roles: [] }, parties).join(' '), /role/i);
  assert.deepEqual(validatePartyDraft({ id: 'p3', name: ' Shop ', phone: '', area: '', roles: ['Supplier', 'Customer'] }, parties), []);
  assert.match(validatePartyDraft({ id: 'c1', name: 'Duplicate', phone: '', area: '', roles: ['Customer'] }, parties).join(' '), /already exists/i);
});

test('selected party and relationship are resolved together', () => {
  assert.deepEqual(resolvePartySelection(parties, 'c2', 'Supplier'), { partyId: 'c2', relationship: 'Supplier' });
  assert.deepEqual(resolvePartySelection(parties, 'c1', 'Supplier'), { partyId: 'c1', relationship: 'Customer' });
  assert.deepEqual(resolvePartySelection(parties, 'nonexistent', 'Owner'), { partyId: 'c1', relationship: 'Customer' });
  assert.equal(resolvePartySelection([], '', ''), null);
});

test('directory search includes Bangla names, phone and area', () => {
  assert.equal(matchesPartySearch(parties[0], 'রহমান'), true);
  assert.equal(matchesPartySearch(parties[0], '01711'), true);
  assert.equal(matchesPartySearch(parties[0], 'dhaka'), true);
  assert.equal(matchesPartySearch(parties[0], 'not-here'), false);
});

test('legacy fixture dates normalize and financial references are not double counted', () => {
  const ledger = [
    { id: 'legacy-sale', partyId: 'c1', date: '01 Oct 2026', type: 'invoice' as const, ref: 'INV-000241', debit: 25550, credit: 0, description: 'Current sale' },
    { id: 'old-payment', partyId: 'c1', date: '03 Sep 2026', type: 'payment' as const, debit: 0, credit: 50, description: 'Old cash payment' }
  ];
  const state = normalizePartyFixture(parties, ledger);
  assert.equal(state.sources.filter(x => x.partyId === 'c1' && x.reference === 'INV-000241').length, 1);
  assert.ok(state.sources.some(x => x.partyId === 'c1' && x.date === '2026-09-03' && x.credit === 50));
  assert.equal(financePersonIdByPartyId.o1, 'fp1');
  assert.equal(financePersonIdByPartyId.c1, undefined);
});

test('seeded invoices and purchases include their original paid amounts exactly once', () => {
  const snapshot=normalizePartyFixture(partiesFromSeed, ledgerFromSeed);
  const paidCustomer=snapshot.sources.filter(x=>x.partyId==='c4'&&x.relationship==='Customer'&&x.kind==='customer-payment'&&x.invoiceId==='INV-000239');
  assert.equal(paidCustomer.length,1);
  assert.equal(paidCustomer[0].credit,6000);
  assert.equal(paidCustomer[0].amountPaid,6000);
  const paidSupplier=snapshot.sources.filter(x=>x.partyId==='s2'&&x.relationship==='Supplier'&&x.kind==='supplier-payment'&&x.invoiceId==='PUR-000117');
  assert.equal(paidSupplier.length,1);
  assert.equal(paidSupplier[0].debit,40000);
  assert.equal(paidSupplier[0].amountPaid,40000);
});
