import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults } from '../src/settings/model.ts';
import * as mod from '../src/settings/sqlBackup.ts';

test('encrypted SQL snapshot is authenticated, tenant checked and never accepts arbitrary SQL', async () => {
  const state = defaults();
  state.sections.business.name = "Shuvo's দোকান; DROP TABLE users;";
  const sql = mod.settingsToSql(state);
  assert.deepEqual(mod.settingsFromSql(sql, 't1'), state);
  assert.throws(() => mod.settingsFromSql(sql, 'other'), /business|tenant|backup/i);
  assert.throws(() => mod.settingsFromSql(sql + '\nDROP TABLE users;', 't1'), /format|SQL|backup/i);
  const key = 'HisabIQ test secret key 123';
  const encrypted = await mod.encryptSettingsSql(state, key);
  const encrypted2 = await mod.encryptSettingsSql(state, key);
  assert.notEqual(encrypted, encrypted2, 'Salt and IV must be fresh');
  assert.ok(!encrypted.includes('দোকান'));
  assert.deepEqual(await mod.decryptSettingsSql(encrypted, key, 't1'), state);
  await assert.rejects(() => mod.decryptSettingsSql(encrypted, 'incorrect secret key', 't1'), /key|damaged/i);
  const envelope = JSON.parse(encrypted);
  envelope.ciphertext = (envelope.ciphertext[0] === 'A' ? 'B' : 'A') + envelope.ciphertext.slice(1);
  await assert.rejects(() => mod.decryptSettingsSql(JSON.stringify(envelope), key, 't1'), /key|damaged/i);
  envelope.iterations = 999999999;
  await assert.rejects(() => mod.decryptSettingsSql(JSON.stringify(envelope), key, 't1'), /format|backup/i);
  await assert.rejects(() => mod.encryptSettingsSql(state, 'short'), /12/);
  await assert.rejects(() => mod.decryptSettingsSql('x'.repeat(2000001), key, 't1'), /large|backup/i);
});
