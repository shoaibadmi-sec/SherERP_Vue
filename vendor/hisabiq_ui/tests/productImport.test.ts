import test from 'node:test';
import assert from 'node:assert/strict';
import {planProductImport,resolveProductDecisions} from '../src/import/productImport.ts';
import type {StagedImportRow} from '../src/import/importTypes.ts';
import type {Product,StockLot} from '../src/types/erp.ts';

const today='2026-10-09';
const row=(mapped:Record<string,unknown>,sourceRow=2,decision:StagedImportRow['decision']='create'):StagedImportRow=>({
 sourceSheet:'CSV',sourceRow,original:{},mapped:{name:'Test Light',sku:'TEST-NEW',baseUnit:'Pcs',sellingPrice:'150',...mapped},
 issues:[],decision
});
const existing:Product={id:'e1',name:'Existing',sku:'SAME-1',category:'Electrical',unit:'Pcs',
 altUnit:{unit:'Box',factor:10},stock:30,minStock:10,sellPrice:120,purchasePrice:80,active:true};
const options={sessionId:'abc123',today,baseRevision:0};
const plan=(rows:StagedImportRow[],products:Product[]=[existing],lots:StockLot[]=[])=>planProductImport(rows,products,lots,options);

test('two Box opening stock becomes 20 Pcs and creates one matching dated lot/movement',()=>{
 const result=plan([row({sku:'BOX-20',largeUnit:'Box',conversionFactor:'10',stockViewUnit:'Box',
  openingStock:2,openingStockUnit:'Box',openingDate:'2026-10-01',purchasePrice:1200,purchasePriceUnit:'Box',
  sellingPrice:1500,sellingPriceUnit:'Box',openingUnitCost:1100,openingCostUnit:'Box'})]);
 assert.deepEqual(result.issues,[]);
 const item=result.creates[0];
 assert.equal(item.product.stock,20);assert.equal(item.product.sellPrice,150);
 assert.equal(item.product.purchasePrice,120);assert.equal(item.openingLot?.unitCost,110);
 assert.equal(item.openingLot?.receivedAt,'2026-10-01');assert.equal(item.openingLot?.quantity,20);
 assert.equal(item.openingMovement?.balance,20);
 assert.equal(item.openingLot?.reference,item.openingMovement?.reference);
});
test('Gauge/Gira conversion retains explicit Gauge price and required serial tracking',()=>{
 const serials=Array.from({length:16},(_,i)=>'GG-'+i).join(',');
 const result=plan([row({sku:'GA-1',baseUnit:'Gira',largeUnit:'Gauge',conversionFactor:16,
   largeUnitSellingPrice:900,openingStock:1,openingStockUnit:'Gauge',
   openingDate:'2026-10-01',serialTracking:'Required',serialNumbers:serials})]);
 assert.equal(result.issues.length,0);assert.equal(result.creates[0].product.stock,16);
 assert.equal(result.creates[0].product.altUnit?.price,900);
 assert.equal(result.creates[0].openingLot?.serials?.length,16);
});
test('bad conversion, invalid date, missing serials and service stock are rejected',()=>{
 for(const change of [
  {sku:'A',largeUnit:'Box',conversionFactor:0},
  {sku:'B',openingStock:2,openingDate:'2026-02-30'},
  {sku:'C',openingStock:2,openingDate:'2026-10-01',serialTracking:'Required'},
  {sku:'D',kind:'Service',openingStock:1}
 ]) {
  const result=plan([row(change)]);
  assert.equal(result.creates.length,0);assert.equal(result.issues[0]?.severity,'error');
 }
});
test('existing and intra-file duplicate SKUs default to skip; explicit update does not add stock',()=>{
 const detected=resolveProductDecisions([
  row({sku:'SAME-1'},2),row({sku:'SAME-1'},3),row({sku:'NEW-123'},4),row({sku:'NEW-123'},5)
 ],[existing]);
 assert.deepEqual(detected.map(r=>r.decision),['skip','skip','create','skip']);
 const chosen={...detected[0],decision:'update-master' as const,
  mapped:{...detected[0].mapped,baseUnit:'Pcs',sellingPrice:130,openingStock:0}};
 const result=plan([chosen]);assert.equal(result.creates.length,0);
 assert.equal(result.updates.length,1);assert.equal(result.updates[0].patch.sellPrice,130);
 assert.equal('stock' in result.updates[0].patch,false);
 assert.equal('unit' in result.updates[0].patch,false);
 const blocked=plan([{...chosen,mapped:{...chosen.mapped,openingStock:5}}]);
 assert.equal(blocked.updates.length,0);assert.match(blocked.issues[0].message,/opening stock/i);
});
test('bad second row produces errors and cannot make the batch ready',()=>{
 const result=plan([row({sku:'A-VALID'}),row({sku:'BAD',largeUnit:'Box',conversionFactor:-1},3)]);
 assert.equal(result.creates.length,1);assert.equal(result.issues.length,1);
});
