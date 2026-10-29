import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  generateInstallmentSchedule, scheduleDifferencePaisa,
  rebalanceUneditedInstallments, validateScheduleRows
} from '../src/installments/schedule.ts';

test('single product six monthly installments start next month and sum precisely', () => {
  const rows=generateInstallmentSchedule({remainingPaisa:3000000,count:6,firstDueDate:'2026-11-17',frequency:'Monthly'});
  assert.deepEqual(rows.map(x=>x.amountPaisa),[500000,500000,500000,500000,500000,500000]);
  assert.deepEqual(rows.map(x=>x.dueDate),['2026-11-17','2026-12-17','2027-01-17','2027-02-17','2027-03-17','2027-04-17']);
  assert.equal(scheduleDifferencePaisa(rows,3000000),0);
  assert.deepEqual(validateScheduleRows(rows),[]);
});

test('paisa remainder is deterministic on final installment', () => {
  const rows=generateInstallmentSchedule({remainingPaisa:10000001,count:7,firstDueDate:'2026-11-17',frequency:'Monthly'});
  assert.deepEqual(rows.map(x=>x.amountPaisa),[1428571,1428571,1428571,1428571,1428571,1428571,1428575]);
  assert.equal(rows.reduce((sum,x)=>sum+x.amountPaisa,0),10000001);
});

test('monthly anchor clamped without permanent drift after February', () => {
  const rows=generateInstallmentSchedule({remainingPaisa:400,count:4,firstDueDate:'2027-01-31',frequency:'Monthly'});
  assert.deepEqual(rows.map(x=>x.dueDate),['2027-01-31','2027-02-28','2027-03-31','2027-04-30']);
  const leap=generateInstallmentSchedule({remainingPaisa:300,count:3,firstDueDate:'2028-01-31',frequency:'Monthly'});
  assert.deepEqual(leap.map(x=>x.dueDate),['2028-01-31','2028-02-29','2028-03-31']);
});

test('weekly recurrence uses calendar days without timezone midnight drift',()=>{
  const rows=generateInstallmentSchedule({remainingPaisa:300,count:3,firstDueDate:'2026-12-28',frequency:'Weekly'});
  assert.deepEqual(rows.map(x=>x.dueDate),['2026-12-28','2027-01-04','2027-01-11']);
});

test('manual amount/date edits preserved when other rows rebalanced',()=>{
  const rows=generateInstallmentSchedule({remainingPaisa:3000000,count:3,firstDueDate:'2026-11-17',frequency:'Monthly'});
  rows[1]={...rows[1],amountPaisa:400000,editedAmount:true,dueDate:'2026-12-20',editedDate:true};
  assert.equal(scheduleDifferencePaisa(rows,3000000),-600000);
  const updated=rebalanceUneditedInstallments(rows,3000000);
  assert.equal(updated[1].amountPaisa,400000);
  assert.equal(updated[1].dueDate,'2026-12-20');
  assert.deepEqual(updated.map(x=>x.amountPaisa),[1300000,400000,1300000]);
  assert.equal(scheduleDifferencePaisa(updated,3000000),0);
  assert.deepEqual(validateScheduleRows(updated),[]);
});

test('edited amounts exceeding target or fully locked imbalance cause clear error',()=>{
  const rows=generateInstallmentSchedule({remainingPaisa:200,count:2,firstDueDate:'2026-11-17',frequency:'Monthly'});
  rows[0]={...rows[0],amountPaisa:300,editedAmount:true};
  assert.throws(()=>rebalanceUneditedInstallments(rows,200),/edited|remaining|exceed/i);
  rows[0]={...rows[0],amountPaisa:100};
  rows[1]={...rows[1],amountPaisa:100,editedAmount:true};
  assert.throws(()=>rebalanceUneditedInstallments(rows,400),/manual|editable|locked|rebalance/i);
});

test('reject zero count, duplicate/invalid dates and nonpositive payment amounts',()=>{
  assert.throws(()=>generateInstallmentSchedule({remainingPaisa:100,count:0,firstDueDate:'2026-11-17',frequency:'Monthly'}),/count/i);
  assert.throws(()=>generateInstallmentSchedule({remainingPaisa:100,count:2,firstDueDate:'2026-02-30',frequency:'Monthly'}),/date/i);
  const rows=generateInstallmentSchedule({remainingPaisa:200,count:2,firstDueDate:'2026-11-17',frequency:'Monthly'});
  assert.match(validateScheduleRows([{...rows[0],amountPaisa:-1},rows[1]]).join(' '),/amount/i);
  assert.match(validateScheduleRows([rows[0],{...rows[1],dueDate:rows[0].dueDate}]).join(' '),/due date|sequence/i);
  assert.match(validateScheduleRows([rows[0],{...rows[1],dueDate:'2026-02-30'}]).join(' '),/date/i);
});
