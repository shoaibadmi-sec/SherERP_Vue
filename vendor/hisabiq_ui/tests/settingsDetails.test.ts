import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults, parseSettings, validateSection } from '../src/settings/model.ts';

test('employee joined date rejects invalid calendars while old records stay readable', () => {
  const state = defaults();
  const employee = state.sections.team.employees[0] as typeof state.sections.team.employees[0] & { joinedDate?: string };
  employee.joinedDate = '2026-02-30';
  assert.ok(validateSection('team', state.sections.team), 'Impossible joined date is rejected');
  employee.joinedDate = '2026-02-28';
  assert.equal(validateSection('team', state.sections.team), null);
  delete employee.joinedDate;
  const restored = parseSettings(JSON.stringify(state), 't1');
  assert.equal(restored.recovered, false);
  assert.equal(restored.state.sections.team.employees[0].joinedDate, undefined);
});
