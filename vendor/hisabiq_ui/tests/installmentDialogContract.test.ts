import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/components/pos/InstallmentBreakdownDialog.tsx',import.meta.url),'utf8');
test('installment breakdown reuses HisabIQ dialog, calendar, numeric inputs',()=>{
 for(const name of ['DialogContent','AppDateRangePicker','NumericInput','DialogFooter','useUiCopy'])assert.match(source,new RegExp(name));
});
test('draft breakdown edits are local and balanced on apply',()=>{
 for(const symbol of ['onApply','onClose','scheduleDifferencePaisa','validateScheduleRows','rebalanceUneditedInstallments','takaInputToPaisa'])assert.match(source,new RegExp(symbol));
 assert.match(source,/disabled=\{[^}]*!canSave/);
 assert.doesNotMatch(source,/Upcoming|Receive Payment|FinanceAccount/);
});
