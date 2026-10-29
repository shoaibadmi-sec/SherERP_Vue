import test from 'node:test';
import assert from 'node:assert/strict';
import type {Product} from '../src/types/erp.ts';
import {freezeUnitProfile,unitQuantitiesBase,unitQuantitiesSaleTotal,describeUnitQuantities} from '../src/utils/multiUnitTransactions.ts';
import {makePurchaseLine,baseQty,baseCost,lineAmount} from '../src/utils/purchaseCart.ts';
import {saleLineBaseQty,saleLineTotal,freezeSaleLineProfile} from '../src/utils/posMultiUnit.ts';
import type {CartLine} from '../src/hooks/usePosCart.ts';
import {validatePosCheckout,posUnitPrice,posMoney} from '../src/utils/posCheckoutValidation.ts';

const product:Product={
  id:'sku-1',name:'Pipe bundle',sku:'PIPE',category:'Hardware',
  unit:'Pcs',stock:1200,minStock:0,purchasePrice:10,sellPrice:15,active:true,
  altUnit:{unit:'Bag',factor:180},stockViewUnit:'Bag',
  unitRelations:[{leftUnit:'Bag',rightUnit:'Box',quantity:12},{leftUnit:'Box',rightUnit:'Pcs',quantity:15}],
  unitPurchasePrices:{Bag:1800,Box:180,Pcs:12},
  unitSellPrices:{Bag:2400,Box:225,Pcs:20}
};
const quantities={Bag:'1',Box:'3',Pcs:'5'};
test('mixed POS quantities compute true base stock and independent unit prices',()=>{
 const profile=freezeUnitProfile(product);
 assert.deepEqual(profile.factors,{Bag:180,Box:15,Pcs:1});
 assert.equal(unitQuantitiesBase(profile,quantities),230);
 assert.equal(describeUnitQuantities(profile,quantities),'1 Bag 3 Box 5 Pcs');
 assert.equal(unitQuantitiesSaleTotal(profile,quantities),3175);
 const line:CartLine={key:'a',product,unit:'Bag',qty:'1',secondaryQty:'',unitQuantities:quantities,
   price:'2400',serials:[]};
 assert.equal(saleLineBaseQty(line),230);
 assert.equal(saleLineTotal(line),3175);
 assert.equal(freezeSaleLineProfile(line).sellingPrices.Box,225);
 assert.equal(saleLineTotal({...line,price:'2500'}),3275);
});
test('mixed purchase quantities use individual purchase prices and blended stock lot cost',()=>{
 const line=makePurchaseLine(product);
 const mixed={...line,unitQuantities:quantities};
 assert.equal(baseQty(mixed),230);
 assert.equal(lineAmount(mixed),2400);
 assert.ok(Math.abs(baseCost(mixed)-2400/230)<1e-10);
 assert.equal(lineAmount({...mixed,cost:'1900'}),2500);
});
test('posted unit snapshot retains accounting despite later catalog price changes',()=>{
 const profile=freezeUnitProfile(product);
 const changed={...product,sellPrice:1,unitSellPrices:{Bag:1,Box:1,Pcs:1}};
 assert.equal(unitQuantitiesBase(profile,quantities),230);
 assert.equal(unitQuantitiesSaleTotal(profile,quantities),3175);
 assert.equal(unitQuantitiesSaleTotal(freezeUnitProfile(changed),quantities),9);
});
test('reject invalid quantities and non-configured units before checkout',()=>{
 const profile=freezeUnitProfile(product);
 assert.throws(()=>unitQuantitiesBase(profile,{Bag:'1',Unknown:'3'}),/Unknown unit/);
 assert.throws(()=>unitQuantitiesBase(profile,{Bag:'1.2.3'}),/valid/);
 assert.throws(()=>unitQuantitiesBase(profile,{Bag:'-1'}),/valid/);
 const base={lines:[{product,qty:'1',secondaryQty:'',unit:'Bag',price:'2400',unitQuantities:quantities}],
   discount:'0',discountMode:'amount' as const,payments:[],total:3175,availableCredit:0};
 assert.equal(validatePosCheckout(base),null);
 assert.equal(validatePosCheckout({...base,lines:[{...base.lines[0],unitQuantities:{Bag:'1',Box:'3',Pcs:'-5'}}]}),'quantity');
});

test('mobile decimal typing remains calculable while money payments stay in paisa',()=>{
 const profile=freezeUnitProfile(product);
 assert.equal(unitQuantitiesBase(profile,{Bag:'1.',Box:'.5',Pcs:''}),187.5);
 assert.throws(()=>unitQuantitiesBase(profile,{Pcs:'1.23456'}),/four decimals/);
 assert.equal(posUnitPrice('0.0001'),0.0001);
 assert.ok(Number.isNaN(posMoney('0.0001')),'payments remain limited to two decimals');
});

test('temporary invalid POS price cannot crash the live cart and is rejected at checkout',()=>{
 const line:CartLine={key:'typing',product,unit:'Bag',qty:'1',secondaryQty:'',unitQuantities:quantities,
   price:'-',serials:[]};
 assert.equal(saleLineTotal(line),775);
 const checkout={lines:[line],discount:'0',discountMode:'amount' as const,payments:[],total:775,availableCredit:0};
 assert.equal(validatePosCheckout(checkout),'price');
});
