import assert from 'node:assert/strict';
import {test} from 'node:test';
import {taka,formatMoneyNumber,formatNumber} from '../src/utils/currency.ts';

test('default taka formatting preserves paisa in positive and negative amounts',()=>{
 assert.equal(taka(0.25),'৳0.25');
 assert.equal(taka(1250.75),'৳1,250.75');
 assert.equal(taka(-1250.75),'−৳1,250.75');
});
test('default taka formatting keeps whole taka compact with Bangladeshi grouping',()=>{
 assert.equal(taka(0),'৳0');
 assert.equal(taka(125400),'৳1,25,400');
});
test('explicit precision remains authoritative',()=>{
 assert.equal(taka(1250.75,0),'৳1,251');
 assert.equal(taka(1250,2),'৳1,250.00');
});

 test('bare money keeps paisa while generic counts retain their existing precision',()=>{
 assert.equal(formatMoneyNumber(0.25),'0.25');
 assert.equal(formatMoneyNumber(1250),'1,250');
 assert.equal(formatMoneyNumber(-1250.75),'-1,250.75');
 assert.equal(formatNumber(0.25),'0');
 });
