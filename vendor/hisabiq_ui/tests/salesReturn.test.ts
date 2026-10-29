import test from 'node:test';
import assert from 'node:assert/strict';
import {parties} from '../src/data/parties.ts';
import {salesInvoices,salesReturns} from '../src/data/sales.ts';
import {planOrdinaryReturn,salesReturnCustomerId} from '../src/utils/salesReturn.ts';
import type {SalesReturn} from '../src/types/erp.ts';
const invoice=salesInvoices[0],line=invoice.lines[0];
const prior=(quantity:number,amount:number):SalesReturn=>({id:'r',date:'01 Oct 2026',customer:invoice.party,invoices:[invoice.invoice],items:line.name,amount,settlement:'Customer credit',lineReturns:[{invoiceId:invoice.id,lineId:line.id,quantity,amount,serials:[]}]});
test('ordinary returns reduce remaining quantity and reject cumulative over-return',()=>{
 assert.equal(planOrdinaryReturn(invoice,line,'1',[],[]).remaining,220);
 const history=[prior(219,24528)];
 assert.equal(planOrdinaryReturn(invoice,line,'1',[],history).remaining,1);
 assert.equal(planOrdinaryReturn(invoice,line,'1',[],history).amount,112);
 assert.ok(planOrdinaryReturn(invoice,line,'2',[],history).issues.length);
 assert.ok(planOrdinaryReturn(invoice,line,'1',[],[prior(220,24640)]).issues.length);
});
test('refund uses historical net line amount, not editable or current product price',()=>{
 const tape=invoice.lines[1];
 assert.equal(planOrdinaryReturn(invoice,tape,'42',[],[]).amount,910);
 assert.equal(planOrdinaryReturn(invoice,{...tape,price:999999},'42',[],[]).amount,0,'mismatched source must fail closed');
 const netLine={...line,netSaleTotal:100,returnableQuantity:3,soldBaseQuantity:3,quantity:'3',total:120,price:40};
 const doc={...invoice,lines:[netLine],discount:20,subtotal:120,total:100};
 const first=planOrdinaryReturn(doc,netLine,'1',[],[]);
 const h:SalesReturn[]=[{...prior(1,first.amount),lineReturns:[{invoiceId:doc.id,lineId:netLine.id,quantity:1,amount:first.amount,serials:[]}]}];
 const second=planOrdinaryReturn(doc,netLine,'1',[],h);
 const third=planOrdinaryReturn(doc,netLine,'1',[],[...h,{...prior(1,second.amount),id:'r2',lineReturns:[{invoiceId:doc.id,lineId:netLine.id,quantity:1,amount:second.amount,serials:[]}]}]);
 assert.equal(first.amount+second.amount+third.amount,100);
});
test('reject malformed quantities and missing discounted source allocation',()=>{
 for(const quantity of ['1..2','NaN','Infinity','-1','0.0000001'])assert.ok(planOrdinaryReturn(invoice,line,quantity,[],[]).issues.length,quantity);
 const doc={...invoice,discount:5};
 assert.ok(planOrdinaryReturn(doc,doc.lines[0],'1',[],[]).issues.some(x=>x.includes('allocation')));
});
test('serials must be exact, unique and not previously returned',()=>{
 const serialLine={...line,quantity:'2',soldBaseQuantity:2,returnableQuantity:2,price:50,total:100,serials:['A','B']};
 const doc={...invoice,lines:[serialLine]};
 assert.ok(planOrdinaryReturn(doc,serialLine,'2',['A'],[]).issues.length);
 assert.ok(planOrdinaryReturn(doc,serialLine,'2',['A','A'],[]).issues.length);
 const h=[{...prior(1,50),lineReturns:[{invoiceId:doc.id,lineId:line.id,quantity:1,amount:50,serials:['A']}]}];
 assert.ok(planOrdinaryReturn(doc,serialLine,'1',['A'],h).issues.length);
 assert.equal(planOrdinaryReturn(doc,serialLine,'1',['B'],h).issues.length,0);
});
test('opening source balance is consumed, and missing historical allocations fail closed',()=>{
 const source={...line,returnableQuantity:2,soldBaseQuantity:220};const doc={...invoice,lines:[source]};
 assert.equal(planOrdinaryReturn(doc,source,'2',[],[]).amount,224);
 const history=[prior(1,112)];
 assert.equal(planOrdinaryReturn(doc,source,'1',[],history).remaining,1);
 assert.ok(planOrdinaryReturn(doc,source,'2',[],history).issues.length);
 assert.ok(planOrdinaryReturn(doc,source,'1',[],[{...prior(1,112),lineReturns:undefined}]).issues.length);
 const compound={...invoice.lines[1],soldBaseQuantity:undefined};
 assert.ok(planOrdinaryReturn({...invoice,lines:[compound]},compound,'1',[],[]).issues.some(x=>x.includes('quantity allocation')));
});

test('return ledger targets the original Customer identity and rejects ambiguous legacy names',()=>{
 assert.equal(salesReturnCustomerId(salesReturns[0],salesInvoices,parties),'c2');
 assert.equal(salesReturnCustomerId(salesReturns[1],salesInvoices,parties),'c1');
 assert.equal(salesReturnCustomerId({...salesReturns[1],customerId:'c3'},salesInvoices,parties),'c3');
 assert.equal(salesReturnCustomerId(salesReturns[1],salesInvoices,[...parties,{...parties[0],id:'other-customer'}]),undefined);
 assert.equal(salesReturnCustomerId(salesReturns[2],salesInvoices,parties),undefined);
});
