import test from 'node:test';import assert from 'node:assert/strict';
import {wholeNumberStep} from '../src/utils/numericStep.ts';
test('whole-unit steps preserve decimal precision without floating point drift',()=>{
 for(const value of ['12.50','0.01','17.123456789','999.99']){const up=wholeNumberStep(value,1)!;assert.equal(wholeNumberStep(up,-1),value);}
 assert.equal(wholeNumberStep('12.50',1),'13.50');assert.equal(wholeNumberStep('12.50',-1),'11.50');assert.equal(wholeNumberStep('-0.25',1,-100),'0.75');
});
test('empty inputs, boundaries and invalid numbers remain safe',()=>{
 assert.equal(wholeNumberStep('',1),'1');assert.equal(wholeNumberStep('0.25',-1),'0');assert.equal(wholeNumberStep('99.75',1,0,100),'100');
 for(const value of ['abc','1.2.3','Infinity','NaN'])assert.equal(wholeNumberStep(value,1),null);
 assert.equal(wholeNumberStep('2.',1),'3.');
});
test('only complete zero values clear on focus; wheel gestures use one whole step',async()=>{
 const {isZeroNumberText,wheelStepDirection}=await import('../src/utils/numericStep.ts');
 for(const raw of ['0','0.00','-0','+0.000',' 0 '])assert.equal(isZeroNumberText(raw),true,raw);
 for(const raw of ['', '0.01','10','0..0','0x0','abc'])assert.equal(isZeroNumberText(raw),false,raw);
 assert.equal(wheelStepDirection({deltaY:-120,deltaX:0}),1);
 assert.equal(wheelStepDirection({deltaY:1,deltaX:0}),-1);
 assert.equal(wheelStepDirection({deltaY:0,deltaX:0}),null);
 assert.equal(wheelStepDirection({deltaY:1,deltaX:10}),null);
 assert.equal(wheelStepDirection({deltaY:-10,deltaX:0,ctrlKey:true}),null);
});
