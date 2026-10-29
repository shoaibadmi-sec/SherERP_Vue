import test from 'node:test';
import assert from 'node:assert/strict';
import { businessToday, datePreset, addDays, addMonths, formatRange, expenseDateIso } from '../src/utils/dateRange.ts';

test('Bangladesh today uses Asia/Dhaka date rather than UTC date', () => {
  assert.equal(businessToday(new Date('2026-10-07T19:15:00Z')), '2026-10-08');
  assert.equal(businessToday(new Date('2026-10-08T17:59:59Z')), '2026-10-08');
});
test('date presets work for any date and month/year boundary', () => {
  assert.deepEqual(datePreset('Today', '2026-10-08'), { from: '2026-10-08', to: '2026-10-08' });
  assert.deepEqual(datePreset('Yesterday', '2026-10-08'), { from: '2026-10-07', to: '2026-10-07' });
  assert.deepEqual(datePreset('Last 7 days', '2026-10-08'), { from: '2026-10-02', to: '2026-10-08' });
  assert.deepEqual(datePreset('This week', '2026-10-08'), { from: '2026-10-05', to: '2026-10-11' });
  assert.deepEqual(datePreset('This month', '2026-10-08'), { from: '2026-10-01', to: '2026-10-31' });
  assert.deepEqual(datePreset('Last month', '2026-01-03'), { from: '2025-12-01', to: '2025-12-31' });
  assert.equal(addDays('2026-02-28', 1), '2026-03-01');
  assert.equal(addMonths('2026-12-10', 1), '2027-01-01');
  assert.equal(formatRange({ from: '', to: '' }), 'All dates');
});

test('statement month, quarter and year presets are dynamic and calendar-aligned', () => {
  assert.deepEqual(datePreset('This quarter', '2026-10-08'), { from: '2026-10-01', to: '2026-12-31' });
  assert.deepEqual(datePreset('This quarter', '2026-02-08'), { from: '2026-01-01', to: '2026-03-31' });
  assert.deepEqual(datePreset('This year', '2026-10-08'), { from: '2026-01-01', to: '2026-12-31' });
});
test('expense report comparisons use ISO dates and reject invalid legacy labels', () => {
  assert.equal(expenseDateIso('30 Sep 2026'), '2026-09-30');
  assert.equal(expenseDateIso('1 Oct 2026'), '2026-10-01');
  assert.equal(expenseDateIso('2026-09-20'), '2026-09-20');
  assert.equal(expenseDateIso('31 Feb 2026'), '');
  assert.equal(expenseDateIso('unknown'), '');
  assert.equal(['30 Sep 2026', '8 Oct 2026'].map(expenseDateIso)
    .filter(day => day >= '2026-10-01' && day <= '2026-10-31').length, 1);
});
