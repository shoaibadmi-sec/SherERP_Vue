import test from 'node:test';
import assert from 'node:assert/strict';
import {validatePosCheckout,posMoney} from '../src/utils/posCheckoutValidation.ts';
import {products} from '../src/data/products.ts';
const product=products[0];
const lines=[{product,qty:'1',secondaryQty:'',unit:product.unit,price:'100'}];
const cash={id:'cash',method:'Cash' as const,account:'Cash counter',amount:'100'};
const request={lines,discount:'',discountMode:'amount' as const,payments:[cash],total:100,customerId:undefined as string|undefined,availableCredit:0};
test('money rejects malformed prefixes and preserves valid paisa',()=>{
 for(const value of ['1..2','100..50','-1','Infinity','1e3','9'.repeat(400),'12.345'])assert.ok(Number.isNaN(posMoney(value)),value);
 assert.equal(posMoney('100.50'),100.5);assert.equal(posMoney(''),0);
});
test('checkout rejects invalid price, discount, payment and zero-quantity lines',()=>{
 assert.equal(validatePosCheckout(request),null);
 assert.equal(validatePosCheckout({...request,lines:[{...lines[0],price:'100..50'}]}),'price');
 assert.equal(validatePosCheckout({...request,discount:'10..50'}),'discount');
 assert.equal(validatePosCheckout({...request,payments:[{...cash,amount:'1..2'}]}),'payment');
 assert.equal(validatePosCheckout({...request,lines:[{...lines[0],qty:'0'}]}),'quantity');
});
test('customer credit needs an active Customer identity, available credit and remaining invoice value',()=>{
 const credit={...cash,id:'credit',method:'Customer Credit' as const,account:'Customer credit'};
 assert.equal(validatePosCheckout({...request,payments:[credit]}),'credit');
 assert.equal(validatePosCheckout({...request,payments:[credit],customerId:'c1',availableCredit:99}),'credit');
 assert.equal(validatePosCheckout({...request,payments:[credit],customerId:'c1',availableCredit:100}),null);
 assert.equal(validatePosCheckout({...request,payments:[credit,cash],customerId:'c1',availableCredit:100}),'credit');
});
