import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateCalculatorExpression as calc,
  formatCalculatorNumber,
  sanitizeCalculatorLines,
  summarizeCalculatorLines,
  MAX_CALCULATOR_LINES
} from '../src/utils/calculatorScratchpad.ts';

test('Mohim expression precedence, grouping and unary operators', () => {
  for (const [expr, expected] of [
    ['5+3*2', 11], ['(5+3)*2',16], ['-(10+2) / 3',-4],
    ['1,25,000 + 500', 125500], ['5 × 5',25], ['20 ÷ 4',5],
    ['.5+0.25',0.75], ['১০০ + ২৫',125], ['5x5',25]
  ] as const) assert.deepEqual(calc(expr), { value: expected, error: false }, expr);
});

test('smart percent supports markup, discount and literal multiplication', () => {
  for (const [expr, expected] of [
    ['500 + 10%',550], ['500 - 10%',450],
    ['500 × 10%',50], ['500 ÷ 10%',5000],
    ['10%',0.1], ['100+(10%)',100.1],
    ['200+10%+5%',231], ['100 + (10+5)%',115],
    ['200*10%+5',25]
  ] as const) assert.equal(calc(expr).value, expected, expr);
});

test('invalid, unfinished or dangerous expressions never produce numeric totals', () => {
  for (const bad of ['1/0','1..2','2+','(',')','alert(1)','2**3',
    '1+foo','2..0', '10%%', '1e900', '()', '.',
    '1'.repeat(260)]) {
    assert.equal(calc(bad).error, true, bad);
  }
  assert.deepEqual(calc(''), {value:0,error:false});
});

test('scratchpad adds only valid line results and formats Bangladesh grouping', () => {
  const summary = summarizeCalculatorLines(['500+10%','', '100/0', '20*2','-10']);
  assert.equal(summary.total, 580);
  assert.equal(summary.errors,1);
  assert.deepEqual(summary.results.map(r => r.error),[false,false,true,false,false]);
  assert.equal(formatCalculatorNumber(125000), '1,25,000');
  assert.equal(formatCalculatorNumber(0.1+0.2),'0.3');
  assert.equal(formatCalculatorNumber(-0), '0');
});

test('stored line data tolerates corruption and enforces bounded inputs', () => {
  assert.deepEqual(sanitizeCalculatorLines(null), ['']);
  assert.deepEqual(sanitizeCalculatorLines({lines:['1']}), ['']);
  assert.deepEqual(sanitizeCalculatorLines(['1',null,2]),['1','','']);
  assert.equal(sanitizeCalculatorLines(Array(1000).fill('1')).length,MAX_CALCULATOR_LINES);
  assert.equal(sanitizeCalculatorLines(['7'.repeat(1000)])[0].length,256);
});
