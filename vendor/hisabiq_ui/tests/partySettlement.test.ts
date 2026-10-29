import test from 'node:test';
import assert from 'node:assert/strict';
import {
 customerSettlementAsOf, supplierSettlementAsOf, validateCustomerPayment, validateCustomerRefund
} from '../src/utils/partySettlement.ts';
import type { PartySourceRecord } from '../src/types/partyLedger.ts';
import { computePartyBalanceSummary } from '../src/utils/partyLedger.ts';

const row=(id:string,date:string,kind:PartySourceRecord['kind'],debit:number,credit:number,over:Partial<PartySourceRecord>={}):PartySourceRecord=>({
 id,partyId:'c1',relationship:'Customer',kind,date,description:id,debit,credit,status:'Active',sequence:Number(id.replace(/\D/g,''))||1,...over
});
test('customer 100 invoice, cash receipt 130 creates 30 refundable verified advance',()=>{
 const sources=[row('sale-1','2026-09-01','sale',100,0),
  row('pay-2','2026-09-04','customer-payment',0,130,{provenance:'verified',method:'Cash'})];
 const sep3=customerSettlementAsOf(sources,'c1','2026-09-03');
 assert.equal(sep3.invoiceDue,100);
 const sep4=customerSettlementAsOf(sources,'c1','2026-09-04');
 assert.equal(sep4.invoiceDue,0);
 assert.equal(sep4.cashBackedAdvance,30);
 assert.equal(sep4.refundableCredit,30);
 assert.equal(sep4.refundedCredit,0);
});
test('future invoice automatically consumes prior valid credit oldest-first',()=>{
 const sources=[row('pay-1','2026-09-04','customer-payment',0,30,{provenance:'verified'}),
 row('sale-2','2026-09-05','sale',10,0)];
 const result=customerSettlementAsOf(sources,'c1','2026-09-06');
 assert.equal(result.invoiceDue,0);
 assert.equal(result.cashBackedAdvance,20);
 assert.equal(result.consumedCredit,10);
 assert.equal(result.refundableCredit,20);
});
test('return credit becomes eligible only when the return exists at requested date',()=>{
 const sources=[row('pay-1','2026-09-04','customer-payment',0,30,{provenance:'verified'}),
 row('return-2','2026-09-07','sale-return',0,25,{provenance:'verified'})];
 assert.throws(()=>validateCustomerRefund(customerSettlementAsOf(sources,'c1','2026-09-06'),{amount:40}),/available|exceeds/i);
 const sep7=customerSettlementAsOf(sources,'c1','2026-09-07');
 assert.equal(sep7.returnCredit,25);
 assert.equal(sep7.refundableCredit,55);
 assert.equal(validateCustomerRefund(sep7,{amount:40}).newCredit,15);
});
test('discount never turns into cash-backed advance and requires due',()=>{
 const sources=[row('sale-1','2026-09-01','sale',100,0),
 row('pay-2','2026-09-04','customer-payment',0,90,{discount:10,provenance:'verified'})];
 const result=customerSettlementAsOf(sources,'c1','2026-09-04');
 assert.equal(result.invoiceDue,0);
 assert.equal(result.cashBackedAdvance,0);
 assert.equal(result.refundableCredit,0);
 assert.throws(()=>validateCustomerPayment(result,{amount:0,discount:1}),/discount|due/i);
});
test('unproven legacy payment still settles due but cannot authorize refund',()=>{
 const sources=[row('legacy-payment','2026-09-04','customer-payment',0,70,{provenance:'legacy-unverified'})];
 const result=customerSettlementAsOf(sources,'c1','2026-09-05');
 assert.equal(result.netBalance,-70);
 assert.equal(result.refundableCredit,0);
 assert.equal(result.unverifiedCredit,70);
});
test('source ids are deduplicated and deterministic same-day sequence wins',()=>{
 const a=row('sale-1','2026-09-04','sale',50,0,{sequence:1});
 const b=row('pay-2','2026-09-04','customer-payment',0,60,{provenance:'verified',sequence:2});
 const s=customerSettlementAsOf([b,a,b],'c1','2026-09-04');
 assert.equal(s.invoiceDue,0);assert.equal(s.refundableCredit,10);
 assert.equal(s.netBalance,-10);
});
test('supplier liabilities have reversed signs; paid advance is refundable on supplier role only',()=>{
 const sources=[row('purchase-1','2026-09-01','purchase',0,100,{relationship:'Supplier',partyId:'s1'}),
 row('supplier-pay-2','2026-09-04','supplier-payment',130,0,{relationship:'Supplier',partyId:'s1',provenance:'verified'})];
 const result=supplierSettlementAsOf(sources,'s1','2026-09-04');
 assert.equal(result.purchaseDue,0);
 assert.equal(result.supplierAdvance,30);
 assert.equal(result.refundableCredit,30);
 assert.equal(customerSettlementAsOf(sources,'s1','2026-09-04').refundableCredit,0);
});
test('refunded credit cannot be refunded twice or move back in time',()=>{
 const sources=[row('pay-1','2026-09-01','customer-payment',0,50,{provenance:'verified'}),
 row('refund-2','2026-09-03','customer-credit-refund',30,0,{provenance:'verified'}),
 row('refund-2','2026-09-03','customer-credit-refund',30,0,{provenance:'verified'})];
 const result=customerSettlementAsOf(sources,'c1','2026-09-04');
 assert.equal(result.refundableCredit,20);
 assert.equal(result.refundedCredit,30);
 assert.throws(()=>validateCustomerRefund(result,{amount:21}),/exceeds|available/i);
});

test('Party summary uses real cash-backed credit, not negative Party.balance',()=>{
 const sources=[row('pay-1','2026-09-04','customer-payment',0,50,{provenance:'verified'}),
 row('pay-old','2026-09-05','customer-payment',0,125,{provenance:'legacy-unverified'})];
 const summary=computePartyBalanceSummary({parties:[],sources,audit:[],revision:0},'c1','Customer');
 assert.equal(summary.netBalance,-175);
 assert.equal(summary.refundableCredit,50);
 assert.equal(summary.availableCredit,50);
 assert.equal(summary.due,0);
});
