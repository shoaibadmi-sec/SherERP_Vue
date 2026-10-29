import test from 'node:test';
import assert from 'node:assert/strict';
import type { BundleVersion, Product, StockLot } from '../src/types/erp.ts';
import { getBundleProjection, bundleInventoryValue } from '../src/bundles/bundleProjection.ts';

const stock = (id: string, available: number, cost: number): Product =>
 ({ id, kind: 'Stock', name: id, sku: id, category: 'Plumbing',
    unit:'Pcs', stock:available, minStock:0, sellPrice:cost*2,
    purchasePrice:cost, active:true });
const pipe=stock('pipes',30,80),socket=stock('sockets',36,10),pump=stock('pumps',8,500);
const recipe:BundleVersion={bundleProductId:'pkg',revision:1,createdAt:'2026-10-17T00:00:00Z',
 components:[
  {productId:'pipes',selectedUnit:'Pcs',primaryQty:'3',secondaryQty:'',baseQty:3,unitFactorAtSave:1,sortOrder:0},
  {productId:'sockets',selectedUnit:'Pcs',primaryQty:'4',secondaryQty:'',baseQty:4,unitFactorAtSave:1,sortOrder:1},
  {productId:'pumps',selectedUnit:'Pcs',primaryQty:'1',secondaryQty:'',baseQty:1,unitFactorAtSave:1,sortOrder:2}
 ]};
test('availability is constrained by the scarcest stock component, not by package stock',()=>{
 const p=getBundleProjection(recipe,[pipe,socket,pump],[]);
 assert.equal(p.availableSets,8);
 assert.deepEqual(p.limitingProductIds,['pumps']);
 assert.equal(p.estimatedCostPerSet,3*80+4*10+500);
 assert.deepEqual(p.issues,[]);
 const virtual=stock('pkg',1000,0);
 virtual.kind='Bundle';
 assert.equal(bundleInventoryValue(virtual),0);
 assert.equal(bundleInventoryValue(pipe),2400);
});
test('expired FEFO lots are not sellable and missing components block bundle',()=>{
 const exp:{enabled:true;dateRequired:false;warningDays:0;allocationMethod:'FEFO'} =
 {enabled:true,dateRequired:false,warningDays:0,allocationMethod:'FEFO'};
 const tracked={...pipe,expiry:exp,stock:30};
 const lots:StockLot[]=[
 {id:'bad',productId:'pipes',label:'expired',receivedAt:'2025-01-01',expiryDate:'2026-01-01',quantity:30,available:30,unitCost:80,source:'Purchase'},
 {id:'good',productId:'pipes',label:'good',receivedAt:'2026-09-01',expiryDate:'2027-01-01',quantity:6,available:6,unitCost:80,source:'Purchase'}
 ];
 const projection=getBundleProjection(recipe,[tracked,socket,pump],lots,new Date('2026-10-17'));
 assert.equal(projection.availableSets,2);
 assert.ok(projection.limitingProductIds.includes('pipes'));
 assert.equal(getBundleProjection(recipe,[tracked,socket],lots).availableSets,0);
 assert.ok(getBundleProjection(recipe,[tracked,socket],lots).issues.length>0);
});
test('serial-required component limits sellable sets to actual unsold available serials',()=>{
 const serial={...pump,serialTracking:'Required' as const,stock:8};
 const lots:StockLot[]=[{id:'s1',productId:'pumps',label:'Serial',receivedAt:'2026-10-10',
   available:8,quantity:8,unitCost:500,source:'Opening',serials:['P1','P2','P3']}];
 const projection=getBundleProjection(recipe,[pipe,socket,serial],lots);
 assert.equal(projection.availableSets,3);
});
test('inactive stock or invalid recipe is blocking rather than silently omitted',()=>{
 assert.equal(getBundleProjection(recipe,[pipe,socket,{...pump,active:false}],[]).availableSets,0);
 assert.ok(getBundleProjection(recipe,[pipe,socket,{...pump,active:false}],[]).issues.length>0);
 assert.equal(getBundleProjection({...recipe,components:recipe.components.map((c,i)=>i===0?{...c,baseQty:0}:c)},[pipe,socket,pump],[]).availableSets,0);
});
