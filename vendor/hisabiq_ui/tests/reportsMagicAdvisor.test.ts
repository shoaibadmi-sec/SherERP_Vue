import test from 'node:test';
import assert from 'node:assert/strict';
import { advisorEvidenceRequest } from '../src/reports/magicpatterns/advisorEvidence.ts';
import type { Recommendation } from '../src/reports/magicpatterns/utils/reports/advisor.ts';
const r=(id:string,area:Recommendation['area']='Stock')=>({id,title:'Recommendation',area,what:'Recorded evidence',why:'Relevant source',action:'Review',benefit:'Avoid guesses'} as Recommendation);
test('Advisor source actions target product contributor, customer account and forecast',()=>{
 const stock=advisorEvidenceRequest(r('stock-pipe-1'));assert.equal(stock.report,'stock');assert.equal(stock.field,'productId');assert.equal(stock.value,'pipe-1');assert.match(stock.context??'',/Recorded evidence/);
 const due=advisorEvidenceRequest(r('collect-Mariam','Dues'));assert.equal(due.report,'collections');assert.equal(due.field,'party');assert.equal(due.value,'Mariam');
 const customer=advisorEvidenceRequest(r('credit-p-client','Customers'));assert.equal(customer.report,'customer-sales');assert.equal(customer.field,'partyId');assert.equal(customer.value,'p-client');
 const cash=advisorEvidenceRequest(r('cash-dip','Cash'));assert.equal(cash.report,'cash-book');assert.equal(cash.forecast,true);
});
