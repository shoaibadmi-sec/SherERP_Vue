import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHistoricalInstallmentLines,returnEligibility} from '../src/installments/historicalLines.ts';
import {generateInstallmentSchedule} from '../src/installments/schedule.ts';
import type {CartLine} from '../src/hooks/usePosCart.ts';
import type {BundleSaleSnapshot,Product} from '../src/types/erp.ts';
import type {PreviewInstallmentAgreement} from '../src/data/installmentPreviewStore.ts';

const product=(id:string,unit='Pcs',kind:'Stock'|'Service'|'Bundle'='Stock'):Product=>({
 id,kind,name:id,sku:id,category:'Tools',unit,stock:100,minStock:0,
 sellPrice:100,purchasePrice:50,active:true
});
const line=(p:Product,qty:string,secondaryQty='',unit=p.unit):CartLine=>({
 key:'line-'+p.id,product:p,qty,secondaryQty,unit,price:'100',serials:[]
});
const agreement=(historicalLines?:PreviewInstallmentAgreement['historicalLines']):PreviewInstallmentAgreement=>({
 id:'agreement-1',invoiceReference:'INV-0200',customerId:'customer-1',customerName:'Shop',
 createdAt:'2026-10-17T11:00:00Z',operationId:'sale-1',totalPaisa:3300000,
 downPaymentPaisa:300000,
 schedule:generateInstallmentSchedule({remainingPaisa:3000000,count:6,firstDueDate:'2026-11-17',frequency:'Monthly'}),
 lineSnapshot:[{key:'line-stock',productId:'stock',amountPaisa:3300000}],
 paymentSnapshot:[],historicalLines
});

test('sold base quantities for whole Pcs, compound Box+Pcs and service are frozen',()=>{
 const p=product('stock');
 const boxes=product('boxes'); boxes.altUnit={unit:'Box',factor:12};
 const svc=product('service','Hour','Service');
 const rows=createHistoricalInstallmentLines([
  line(p,'3'),line(boxes,'2','5','Box'),line(svc,'1')
 ],[
  {key:'line-stock',amountPaisa:301},{key:'line-boxes',amountPaisa:2500},
  {key:'line-service',amountPaisa:999}
 ]);
 assert.deepEqual(rows.map(r=>r.originalBaseQuantity),[3,29,1]);
 assert.deepEqual(rows.map(r=>r.originalNetPaisa),[301,2500,999]);
 assert.deepEqual(rows.map(r=>r.unitFactorAtSale),[1,12,1]);
 assert.equal(rows[1].selectedUnit,'Box');
 assert.equal(rows[2].kind,'Service');
 assert.equal(Object.isFrozen(rows[0]),true);
});

test('whole Set parent stores immutable sale-time component recipe not current product recipe',()=>{
 const p=product('bundle','Set','Bundle');
 const components=[
  {productId:'pA',name:'Wire',sku:'A',baseQtyPerSet:2,totalBaseQty:4,unit:'Pcs',unitFactorAtSale:1},
  {productId:'pB',name:'Fuse',sku:'B',baseQtyPerSet:1,totalBaseQty:2,unit:'Pcs',unitFactorAtSale:1}
 ];
 const original:BundleSaleSnapshot={bundleRevision:3,components};
 const rows=createHistoricalInstallmentLines([{
  ...line(p,'2'),bundleRevision:3
 }],[{key:'line-bundle',amountPaisa:75000}],{
  bundleSnapshot:()=>original
 });
 assert.equal(rows[0].kind,'Bundle');
 assert.equal(rows[0].originalBaseQuantity,2);
 assert.deepEqual(rows[0].bundleSnapshot,original);
 components[0].name='changed later';
 assert.equal(rows[0].bundleSnapshot?.components[0].name,'Wire');
});
test('old agreements with no historical evidence block returns, never consult product master',()=>{
 const old=agreement();
 assert.equal(returnEligibility(old).eligible,false);
 assert.match(returnEligibility(old).reason,/historical|evidence|source/i);
 const rows=createHistoricalInstallmentLines([line(product('stock'),'3')],[{key:'line-stock',amountPaisa:3300000}]);
 const fresh=agreement(rows);
 assert.equal(returnEligibility(fresh).eligible,true);
 assert.equal(fresh.historicalLines?.[0].originalNetPaisa,3300000);
});
test('reject missing bundle recipe, impossible positive quantities and mismatched source identity',()=>{
 assert.throws(()=>createHistoricalInstallmentLines([line(product('b','Set','Bundle'),'2')],[{key:'line-b',amountPaisa:200}]),/bundle|recipe/i);
 assert.throws(()=>createHistoricalInstallmentLines([line(product('p'),'0')],[{key:'line-p',amountPaisa:200}]),/quantity/i);
 assert.throws(()=>createHistoricalInstallmentLines([line(product('p'),'1')],[{key:'other',amountPaisa:200}]),/line|source/i);
});
