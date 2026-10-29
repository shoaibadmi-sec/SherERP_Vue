import test from 'node:test';
import assert from 'node:assert/strict';
import {applyVendorCommand,vendorBalances,sourceOutstanding} from '../src/vendor/vendorModel.ts';
import type {VendorPreviewState,VendorSettlementAllocation} from '../src/vendor/vendorTypes.ts';
const fresh=():VendorPreviewState=>({parties:[{id:'v1',roles:['Vendor'],status:'Active'},{id:'v2',roles:['Vendor'],status:'Active'}],
 sources:[],settlements:[],events:[],openings:[],sales:[],operations:[],revision:0,inventory:{p1:6,p2:1}});
const source=(state:VendorPreviewState,id:string,cost:number|null=11000,kind:'record-sourcing'|'issue-goods'='record-sourcing')=>
 applyVendorCommand(state,{type:kind,operationId:'source-'+id,vendorPartyId:'v1',source:{
 id,productId:'p1',baseQty:3,date:'2026-10-09',unitCostBasePaisa:cost,reference:'INV-'+id}});
const pay=(id:string,sourceId:string,amountPaisa:number)=>( {type:'settle-source' as const,operationId:id,
 vendorPartyId:'v1',side:'payable' as const,kind:'pay' as const,date:'2026-10-10',amountPaisa,
 allocations:[{sourceId,amountPaisa}],paymentSplits:[{id:'cash-'+id,method:'Cash' as const,accountId:'acc-cash',amountPaisa}]} );
const giveBack=(id:string,sourceId:string,baseQty:number,amountPaisa:number|null)=>({
 type:'settle-source' as const,operationId:id,vendorPartyId:'v1',side:'payable' as const,
 kind:'return-to-vendor' as const,date:'2026-10-10',amountPaisa,
 allocations:[{sourceId,baseQty,amountPaisa}],reason:'Matching stock replacement'
});
test('pay 200 then return one at 110 leaves known payable 20, inventory -1',()=>{
 let s=source(fresh(),'priced');
 s=applyVendorCommand(s,pay('pay200','priced',20000));
 s=applyVendorCommand(s,giveBack('give1','priced',1,11000));
 assert.equal(vendorBalances(s,'v1').knownPayablePaisa,2000);
 assert.equal(sourceOutstanding(s,'priced').monetaryDuePaisa,2000);
 assert.equal(s.inventory?.p1,5);
 assert.equal(applyVendorCommand(s,giveBack('give1','priced',1,11000)),s);
});
test('unpriced goods can be returned then remaining priced and paid without double counting',()=>{
 let s=source(fresh(),'late',null);
 s=applyVendorCommand(s,giveBack('return1','late',1,null));
 assert.equal(vendorBalances(s,'v1').unpricedSourceBaseQty,2);
 assert.equal(vendorBalances(s,'v1').knownPayablePaisa,0);
 s=applyVendorCommand(s,{type:'set-source-price',operationId:'quote',vendorPartyId:'v1',
  sourceId:'late',date:'2026-10-10',unitCostBasePaisa:11000});
 assert.equal(vendorBalances(s,'v1').knownPayablePaisa,22000);
 s=applyVendorCommand(s,pay('payrest','late',22000));
 assert.equal(vendorBalances(s,'v1').knownPayablePaisa,0);
 assert.equal(sourceOutstanding(s,'late').returnedBaseQty,1);
 assert.equal(sourceOutstanding(s,'late').monetaryDuePaisa,0);
});
test('receivable issued 3 then receive money and return one source piece',()=>{
 let s=source(fresh(),'issued',7000,'issue-goods');
 assert.equal(vendorBalances(s,'v1').knownReceivablePaisa,21000);
 s=applyVendorCommand(s,{type:'settle-source',operationId:'recv-money',vendorPartyId:'v1',side:'receivable',
 kind:'receive-money',date:'2026-10-10',amountPaisa:14000,allocations:[{sourceId:'issued',amountPaisa:14000}],
 paymentSplits:[{id:'bank',method:'Bank',accountId:'acc-dbl',amountPaisa:14000}]});
 assert.equal(vendorBalances(s,'v1').knownReceivablePaisa,7000);
 const stock=s.inventory!.p1;
 s=applyVendorCommand(s,{type:'settle-source',operationId:'recv-one',vendorPartyId:'v1',side:'receivable',
 kind:'receive-goods',date:'2026-10-10',amountPaisa:7000,allocations:[{sourceId:'issued',baseQty:1,amountPaisa:7000}]});
 assert.equal(vendorBalances(s,'v1').knownReceivablePaisa,0);
 assert.equal(s.inventory?.p1,stock+1);
});
test('bad links, too little stock, overpayment, split mismatch, future date fail atomically',()=>{
 const s=source(fresh(),'safe'),before=JSON.stringify(s);
 assert.throws(()=>applyVendorCommand(s,pay('over','safe',33001)),/exceed/i);
 assert.throws(()=>applyVendorCommand(s,{...pay('wrong','safe',100),vendorPartyId:'v2'}),/different Vendor|source/i);
 assert.throws(()=>applyVendorCommand(s,{...pay('no-split','safe',100),paymentSplits:[]}),/payment (source|account)/i);
 assert.throws(()=>applyVendorCommand(s,{...pay('bad-split','safe',100),paymentSplits:[{id:'cash',method:'Cash',accountId:'acc-cash',amountPaisa:99}]}),/split/i);
 assert.throws(()=>applyVendorCommand(s,giveBack('over-stock','safe',7,77000)),/stock|source|return/i);
 assert.equal(JSON.stringify(s),before);
});
test('multi-source split is atomic and duplicate source allocation rejected',()=>{
 let s=source(fresh(),'a',10000);s=source(s,'b',10000);
 const split=(allocations:VendorSettlementAllocation[])=>({type:'settle-source' as const,operationId:'multi',
 vendorPartyId:'v1',side:'payable' as const,kind:'pay' as const,date:'2026-10-10',
 amountPaisa:30000,allocations,paymentSplits:[{id:'cash',method:'Cash' as const,accountId:'acc-cash',amountPaisa:30000}]});
 s=applyVendorCommand(s,split([{sourceId:'a',amountPaisa:20000},{sourceId:'b',amountPaisa:10000}]));
 assert.equal(vendorBalances(s,'v1').knownPayablePaisa,30000);
 assert.equal(sourceOutstanding(s,'a').monetaryDuePaisa,10000);
 assert.equal(sourceOutstanding(s,'b').monetaryDuePaisa,20000);
 assert.throws(()=>applyVendorCommand(s,{...split([{sourceId:'a',amountPaisa:5000},{sourceId:'a',amountPaisa:5000}]),operationId:'duplicated'}),/duplicate/i);
});
