import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=(file:string)=>readFileSync(file,'utf8');

test('Calendar languages do not modify source date preset keys or ISO storage',()=>{
 const calendar=read('src/components/AppDateRangePicker.tsx');
 const copy=read('src/i18n/datePickerCopy.ts');
 const dates=read('src/utils/dateRange.ts');
 for(const key of ['Today','Yesterday','Last 7 days','This week','This month','Last month']){
  assert.ok(copy.includes(key),key);
  assert.ok(dates.includes("case '"+key+"'"),key);
 }
 for(const key of ['datePreset(preset, today)','onChange(next)','isoDay(','addDays(day, movement[event.key])']){
  assert.ok(calendar.includes(key),key);
 }
 assert.match(copy,/bn-BD-u-ca-gregory/);
 assert.match(copy,/return formatRange\(value\)/);
});

test('Calendar retains existing controls, keyboard navigation and commit rules',()=>{
 const calendar=read('src/components/AppDateRangePicker.tsx');
 for(const key of [
  "event.key === 'Escape'",
  "document.addEventListener('pointerdown', outside)",
  "window.addEventListener('resize', place)",
  "focusDay(addDays(day, movement[event.key]))",
  "onClick={() => commit(draft)}",
  "disabled={!draft.from || !draft.to}",
  "onClick={() => commit(empty)}",
  "setDraft(range)",
  "datePickerMonthLabel(language,first)",
  "datePickerDayLabel(language,day)",
  "datePickerRangeLabel(language,value)",
  "datePresetBn[preset]",
  "onChange={(range) => onChange(range.from)}",
  "value={{ from: value, to: value }}"
 ])assert.ok(calendar.includes(key),key);
});
