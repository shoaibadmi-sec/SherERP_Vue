import assert from 'node:assert/strict';
import test from 'node:test';
import { financePersonOptionLabel, type FinancePerson } from '../src/data/financeAccounts.ts';

const person = (id: string, overrides: Partial<FinancePerson> = {}): FinancePerson => ({
  id, name: 'Samira Begum', roles: ['Lender'], status: 'Active', ...overrides,
});

test('finance person option labels retain phone details and disambiguate duplicate identities', () => {
  const withPhones = [person('fp-1', { phone: '01711' }), person('fp-2', { phone: '01822' })];
  assert.equal(financePersonOptionLabel(withPhones[0], withPhones), 'Samira Begum · 01711');
  assert.equal(financePersonOptionLabel(withPhones[1], withPhones), 'Samira Begum · 01822');

  const withDescriptions = [person('fp-1', { phone: '01711', description: 'Partner' }), person('fp-2', { phone: '01711', description: 'Supplier' })];
  assert.equal(financePersonOptionLabel(withDescriptions[0], withDescriptions), 'Samira Begum · Partner');
  assert.equal(financePersonOptionLabel(withDescriptions[1], withDescriptions), 'Samira Begum · Supplier');

  const indistinguishableDetails = [person('finance-person-1031'), person('finance-person-2042')];
  assert.equal(financePersonOptionLabel(indistinguishableDetails[0], indistinguishableDetails), 'Samira Begum · 1031');
  assert.equal(financePersonOptionLabel(indistinguishableDetails[1], indistinguishableDetails), 'Samira Begum · 2042');
});
