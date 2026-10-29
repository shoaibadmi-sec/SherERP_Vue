import test from 'node:test';
import assert from 'node:assert/strict';
import {purchaseReturnQuote,purchasePosition,validatePurchaseSource,type PurchaseSourceEvent} from '../src/utils/purchaseSource.ts';
import {products} from '../src/data/products.ts';
import {baseQty,baseCost,makePurchaseLine} from '../src/utils/purchaseCart.ts';
import type {Purchase} from '../src/types/erp.ts';
const product={...products[0],altUnit:undefined};
const line={...makePurchaseLine(product),bigQty:'0',smallQty:'10',cost:'10',costUnit:product.unit};
const source:Purchase={id:'source',ref:'PUR-SOURCE',date:'10 Oct 2026',businessDate:'2026-10-10',supplierId:'supplier',supplier:'Supplier',items:'Product',total:95,paid:50,payments:[{id:'paid',method:'Cash',account:'Cash counter',amount:50}],subtotal:100,discount:5,rounding:0,roundingRule:'No rounding',cartSnapshot:[line],inventoryLines:[{productId:product.id,quantity:baseQty(line),unitCost:baseCost(line)}]};
function returned(quantity:number,amount:number,refund=0):PurchaseSourceEvent{return{id:'return',purchaseId:source.id,kind:'return',date:'2026-10-10',reason:'Damaged',before:source,after:source,amount,refund,lines:[{index:0,quantity}]};}
test('returns allocate original discount and reduce unpaid supplier due before credit/refund',()=>{
 validatePurchaseSource(source);
 assert.deepEqual(purchaseReturnQuote(source,[{index:0,quantity:5}],[]),{amount:47.5,dueReduction:45,excess:2.5});
 assert.deepEqual(purchasePosition(source,[returned(5,47.5)]),{total:47.5,paid:50,due:0,credit:2.5,returned:47.5});
 assert.deepEqual(purchasePosition(source,[returned(5,47.5,2.5)]),{total:47.5,paid:47.5,due:0,credit:0,returned:47.5});
});
test('remaining quantity, duplicate lines and invalid numeric input are guarded',()=>{
 for(const request of [[{index:0,quantity:11}],[{index:0,quantity:-1}],[{index:0,quantity:NaN}],[{index:0,quantity:1},{index:0,quantity:1}]])assert.throws(()=>purchaseReturnQuote(source,request,[]));
 assert.throws(()=>purchaseReturnQuote(source,[{index:0,quantity:6}],[returned(5,47.5)]),/remaining/);
 assert.equal(purchaseReturnQuote(source,[{index:0,quantity:5}],[returned(5,47.5)]).amount,47.5);
});
test('cumulative paisa allocation returns the exact original bill total across repeated partial returns',()=>{
 const p={...source,total:94.99,discount:5.01};const history:PurchaseSourceEvent[]=[];let total=0;
 for(let i=0;i<10;i++){const quote=purchaseReturnQuote(p,[{index:0,quantity:1}],history);total+=Math.round(quote.amount*100);history.push({...returned(1,quote.amount),id:String(i)});}
 assert.equal(total,9499);assert.throws(()=>purchaseReturnQuote(p,[{index:0,quantity:1}],history),/remaining/);
});
test('summary-only bills and tracked stock cannot fabricate return allocations',()=>{
 assert.throws(()=>purchaseReturnQuote({...source,cartSnapshot:undefined},[{index:0,quantity:1}],[]),/snapshots/);
 assert.throws(()=>purchaseReturnQuote({...source,inventoryLines:[{...source.inventoryLines![0],serials:['SERIAL']}]},[{index:0,quantity:1}],[]),/tracked/);
});

test('preview source mutations update stock, supplier balance, payment dates and history together; stale retries cannot post twice',async()=>{
 const {availableParties,availableProducts,availableLedgerEntries,availablePurchaseEvents,createPreviewPurchase,mutatePreviewPurchase}=await import('../src/data/erpDemoStore.ts');
 const supplier=availableParties().find(p=>p.roles.includes('Supplier'))!;
 const balance=supplier.balance;const stock=availableProducts().find(p=>p.id===product.id)!.stock;
 const created={...structuredClone(source),id:'workflow-source',ref:'PUR-WORKFLOW',supplierId:supplier.id,supplier:supplier.name};
 createPreviewPurchase(created);
 assert.equal(availableProducts().find(p=>p.id===product.id)!.stock,stock+10);
 const paid=mutatePreviewPurchase(created,{kind:'payment',payments:[{id:'later',method:'Cash',account:'Cash counter',amount:20}],reason:'Evening payment',date:'2026-10-11'});
 assert.throws(()=>mutatePreviewPurchase(created,{kind:'payment',payments:[{id:'again',method:'Cash',account:'Cash counter',amount:20}],reason:'Retry',date:'2026-10-11'}),/changed/);
 assert.throws(()=>mutatePreviewPurchase(paid,{kind:'payment',payments:[{id:'too-much',method:'Cash',account:'Cash counter',amount:26}],reason:'Excess',date:'2026-10-11'}),/due/);
 const returned=mutatePreviewPurchase(paid,{kind:'return',lines:[{index:0,quantity:5}],settlement:'cash',payments:[{id:'refund',method:'Cash',account:'Cash counter',amount:22.5}],reason:'Damaged',date:'2026-10-11'});
 assert.equal(purchasePosition(returned,availablePurchaseEvents()).due,0);
 assert.equal(purchasePosition(returned,availablePurchaseEvents()).credit,0);
 assert.equal(availableProducts().find(p=>p.id===product.id)!.stock,stock+5);
 assert.equal(availableParties().find(p=>p.id===supplier.id)!.balance,balance);
 const ledger=availableLedgerEntries().filter(e=>e.ref===created.ref);
 assert.equal(ledger.filter(e=>e.description.includes('Evening payment'))[0].date,'2026-10-11');
 assert.equal(ledger.reduce((sum,e)=>sum+e.debit-e.credit,0),0);
 assert.throws(()=>mutatePreviewPurchase(returned,{kind:'correction',next:returned,reason:'After return',date:'2026-10-11'}),/allocation review/);
});

test('largest-remainder line budgets never go negative and zero-money goods remain returnable',()=>{
 const p={...source,total:0.02,cartSnapshot:[line,line,line,line],inventoryLines:[...Array(4)].map(()=>source.inventoryLines![0])};
 const quotes=[0,1,2,3].map(index=>purchaseReturnQuote(p,[{index,quantity:10}],[]));
 assert.equal(quotes.reduce((sum,q)=>sum+q.amount,0),0.02);
 assert.ok(quotes.every(q=>q.amount>=0));
 assert.equal(quotes.filter(q=>q.amount===0).length,2);
});
