import test from 'node:test';
import assert from 'node:assert/strict';
import { defaults } from '../src/settings/model.ts';
import { initialProductDraft } from '../src/utils/productFormInitial.ts';
import { buildProduct, convertPrice, convertQty, deriveDraft, errorSection, removeDraftLevel, validateDraft } from '../src/utils/productDraft.ts';
import { resolveUnitChain } from '../src/utils/unitChain.ts';
import { freezeUnitProfile, unitQuantitiesBase } from '../src/utils/multiUnitTransactions.ts';
import type { ProductDraft } from '../src/types/productForm.ts';
const config = defaults().sections.products;
const chainDraft = (): ProductDraft => ({
  ...initialProductDraft(config), name: 'Conduit', unit: 'Feet', buy: '180', buyUnit: 'Pcs', sell: '240', sellUnit: 'Pcs',
  multiUnit: true, unitLevels: [
    {id:'pcs',unit:'Pcs',factor:'120',price:''}, {id:'box',unit:'Box',factor:'20',price:'4500',purchasePrice:'3000'},
    {id:'carton',unit:'Carton',factor:'12',price:''}
  ], openingQty:'1',openingUnit:'Carton',minQty:'2',minUnit:'Box',stockViewUnit:'Carton'
});
test('new products use tenant defaults with optional multi-unit setup off',()=>{
 const d=initialProductDraft(config);
 assert.equal(d.multiUnit,false);assert.deepEqual(d.unitLevels,[]);assert.equal(d.unit,config.defaultUnit);
 assert.equal(d.serialTracking,config.serial);assert.equal(d.warrantyEnabled,config.warranty);
});
test('four-level form saves the existing cart model with normalized stock, prices and explicit overrides',()=>{
 const d=chainDraft(),x=deriveDraft(d,false,[]);
 assert.deepEqual(validateDraft(d,false,x),{});
 assert.deepEqual(x.units,['Feet','Pcs','Box','Carton']);
 assert.equal(x.openingBase,28800);assert.equal(x.minBase,4800);assert.equal(x.sellBase,2);assert.equal(x.buyBase,1.5);
 assert.equal(Number(convertPrice(d,'240','Pcs','Carton')),57600);
 assert.equal(Number(convertQty(d,'1','Carton','Box')),12);
 const {product}=buildProduct(d,x,false);
 assert.deepEqual(product.unitRelations,[{leftUnit:'Carton',rightUnit:'Box',quantity:12},{leftUnit:'Box',rightUnit:'Pcs',quantity:20},{leftUnit:'Pcs',rightUnit:'Feet',quantity:120}]);
 assert.equal(resolveUnitChain(product.unitRelations!).factors.Carton,28800);
 assert.equal(product.unitSellPrices?.Box,4500);assert.equal(product.unitPurchasePrices?.Box,3000);
 assert.equal(unitQuantitiesBase(freezeUnitProfile(product),{Carton:'1',Box:'2',Pcs:'3',Feet:'10'}),33970);
 assert.equal(product.altUnit?.factor,28800);
});
test('switching units and removing a selected middle level retains physical value',()=>{
 const d={...chainDraft(),openingQty:'2',openingUnit:'Box',sell:'4800',sellUnit:'Box'};
 for(const from of ['Feet','Pcs','Box','Carton']) for(const to of ['Feet','Pcs','Box','Carton']) {
  const value=convertQty(d,'12.25',from,to);
  assert.ok(Math.abs(Number(convertQty(d,value,to,from))-12.25)<1e-9);
 }
 const removed=removeDraftLevel(d,'box')!;
 assert.equal(removed.unitLevels[1].factor,'240');assert.equal(removed.openingQty,'4800');assert.equal(removed.sell,'2');
 assert.equal(deriveDraft(removed,false,[]).openingBase,4800);
});
test('invalid ratios, duplicates, custom prices and measurement serials reveal the correct section',()=>{
 for(const factor of ['','0','1','-2','1.2.3','Infinity']) {
  const d=chainDraft();d.unitLevels[1].factor=factor;
  assert.ok(validateDraft(d,false,deriveDraft(d,false,[]))['levelFactor-box']);
 }
 const d=chainDraft();d.unitLevels[2].unit='pcs';
 assert.ok(validateDraft(d,false,deriveDraft(d,false,[]))['levelUnit-carton']);
 d.unitLevels[2].unit='Carton';d.unitLevels[1].price='1..2';
 assert.ok(validateDraft(d,false,deriveDraft(d,false,[]))['levelPrice-box']);
 d.unitLevels[1].price='0';d.unitLevels[1].purchasePrice='0.0001';
 assert.deepEqual(validateDraft(d,false,deriveDraft(d,false,[])),{});
 d.serialTracking='Required';assert.ok(validateDraft(d,false,deriveDraft(d,false,[])).openingSerials);
 assert.equal(errorSection('levelFactor-box'),'advanced');assert.equal(errorSection('openingSerials'),'other');
});
test('edit/reopen preserves all legacy and chain prices, active state and stock; unit migration is blocked',()=>{
 const original=buildProduct(chainDraft(),deriveDraft(chainDraft(),false,[]),false).product;
 original.active=false;original.unitSellPrices={...original.unitSellPrices,Feet:0.5};original.unitPurchasePrices={...original.unitPurchasePrices,Feet:0.25};
 const d=initialProductDraft(config,original),x=deriveDraft(d,true,[]);
 const saved=buildProduct(d,x,true,original).product;
 assert.equal(saved.stock,original.stock);assert.equal(saved.active,false);assert.deepEqual(saved.unitRelations,original.unitRelations);
 assert.deepEqual(saved.unitSellPrices,original.unitSellPrices);assert.deepEqual(saved.unitPurchasePrices,original.unitPurchasePrices);
 assert.throws(()=>buildProduct({...d,unit:'Pcs'},x,true,original),/migration/);
 const legacy={...original,unitRelations:undefined,unit:'Pcs',altUnit:{unit:'Box',factor:12,price:600},unitSellPrices:undefined,unitPurchasePrices:undefined};
 const loaded=initialProductDraft(config,legacy);
 assert.equal(loaded.unitLevels[0].price,'600');
 assert.equal(buildProduct(loaded,deriveDraft(loaded,true,[]),true,legacy).product.altUnit?.price,600);
});
test('opening serial and expiry checks retain metadata; services never create stock',()=>{
 const d={...initialProductDraft(config),name:'Generator',unit:'Pcs',sell:'185000',sellUnit:'Pcs',buyUnit:'Pcs',openingQty:'2',openingUnit:'Pcs',serialTracking:'Required' as const,openingSerialText:'A\nA'};
 assert.ok(validateDraft(d,false,deriveDraft(d,false,[])).openingSerials);
 d.openingSerialText='A\nB';d.expiryEnabled=true;d.expiryDateRequired=true;
 assert.ok(validateDraft(d,false,deriveDraft(d,false,[])).expiryDate);
 d.expiryDate='2027-01-01';d.batchNumber='B-01';
 const x=deriveDraft(d,false,[]);assert.deepEqual(validateDraft(d,false,x),{});
 assert.deepEqual(buildProduct(d,x,false).opening,{serials:['A','B'],batchNumber:'B-01',manufactureDate:undefined,expiryDate:'2027-01-01'});
 const service={...d,kind:'Service' as const,unit:'Service',serialTracking:'Off' as const,openingUnit:'Service',sellUnit:'Service'};
 assert.equal(buildProduct(service,deriveDraft(service,false,[]),false).opening,undefined);
});

test('contextual creation retains opening-lot serial/expiry evidence and does not duplicate it on retry',async()=>{
 const {createPreviewProduct,availableStockLots,availableStockMovements}=await import('../src/data/erpDemoStore.ts');
 const d=chainDraft();d.expiryEnabled=true;d.expiryDate='2027-02-01';d.batchNumber='CTX-01';
 const result=buildProduct(d,deriveDraft(d,false,[]),false);result.product.id='context-opening-qa';
 createPreviewProduct(result.product,result.opening);
 const lot=availableStockLots().find(l=>l.productId==='context-opening-qa');
 assert.equal(lot?.quantity,28800);assert.equal(lot?.batchNumber,'CTX-01');assert.equal(lot?.expiryDate,'2027-02-01');
 createPreviewProduct(result.product,result.opening);
 assert.equal(availableStockLots().filter(l=>l.productId==='context-opening-qa').length,1);
 assert.equal(availableStockMovements().filter(l=>l.productId==='context-opening-qa').length,1);
});

test('save and reopen keeps the whole photo gallery and supports legacy cover-only products',()=>{
 const d={...chainDraft(),photos:['blob:cover','blob:detail']};
 const product=buildProduct(d,deriveDraft(d,false,[]),false).product;
 assert.equal(product.image,'blob:cover');assert.deepEqual(product.images,d.photos);
 assert.deepEqual(initialProductDraft(config,product).photos,d.photos);
 assert.deepEqual(initialProductDraft(config,{...product,images:undefined}).photos,['blob:cover']);
});
