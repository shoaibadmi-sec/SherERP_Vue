import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePartyCsv } from '../src/utils/partyImport.ts';

test('CSV import supports Bangla, quoted commas and multiple roles', () => {
  const csv='name,nameBn,phone,area,roles\n"New, Store",নতুন দোকান,01711,Dhaka,Customer|Supplier\n';
  const result=parsePartyCsv(csv);
  assert.equal(result.rejected.length,0);
  assert.equal(result.valid[0]?.name,'New, Store');
  assert.equal(result.valid[0]?.nameBn,'নতুন দোকান');
  assert.deepEqual(result.valid[0]?.roles,['Customer','Supplier']);
});
test('invalid role, blank name and malicious formulas are rejected independently', () => {
  const csv='name,phone,roles\n,01711,Customer\n=MALICIOUS,01999,Supplier\nGood Shop,01988,Unknown\nValid Shop,01722,Customer\n';
  const result=parsePartyCsv(csv);
  assert.equal(result.rejected.length,3);
  assert.equal(result.valid.length,1);
  assert.equal(result.valid[0].name,'Valid Shop');
});
test('malformed quotes or absent name header never import arbitrary rows', () => {
  assert.throws(()=>parsePartyCsv('foo,phone\nbar,01711'),/name column/i);
  assert.throws(()=>parsePartyCsv('name,roles\n"unterminated,Customer'),/quoted field/i);
});
