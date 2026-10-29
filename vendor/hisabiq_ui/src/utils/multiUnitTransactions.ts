import type {Product} from '../types/erp.ts';
import {productUnitFactor, productUnits} from './unitChain.ts';

/** Snapshot-safe quantities: every entered unit is retained, never silently rewritten. */
export type UnitQuantityMap = Record<string,string>;
export type FrozenUnitProfile = {
  baseUnit: string;
  factors: Record<string,number>;
  purchasePrices: Record<string,number>;
  sellingPrices: Record<string,number>;
};

export function freezeUnitProfile(product: Product): FrozenUnitProfile {
  const units = productUnits(product);
  return {
    baseUnit: product.unit,
    factors: Object.fromEntries(units.map(unit=>[unit,productUnitFactor(product,unit)])),
    purchasePrices: Object.fromEntries(units.map(unit=>[unit,
      product.unitPurchasePrices?.[unit] ?? product.purchasePrice*productUnitFactor(product,unit)])),
    sellingPrices: Object.fromEntries(units.map(unit=>[unit,
      product.unitSellPrices?.[unit] ??
      (product.altUnit?.unit===unit&&product.altUnit.price!==undefined
        ? product.altUnit.price : product.sellPrice*productUnitFactor(product,unit))]))
  };
}

export function assertUnitQuantities(profile:FrozenUnitProfile, quantities:UnitQuantityMap):void {
  const keys=Object.keys(quantities);
  if(!keys.length)throw new Error('Add a quantity.');
  for(const [unit,raw] of Object.entries(quantities)){
    if(!Object.prototype.hasOwnProperty.call(profile.factors,unit))throw new Error('Unknown unit: '+unit);
    if(raw.trim() && !/^(?:\d+(?:\.\d{0,4})?|\.\d{1,4})$/.test(raw.trim()))
      throw new Error('Enter a valid '+unit+' quantity, up to four decimals.');
  }
}
export function unitQuantitiesBase(profile:FrozenUnitProfile,quantities:UnitQuantityMap):number {
  assertUnitQuantities(profile,quantities);
  const total=Object.entries(quantities).reduce((sum,[unit,q])=>sum+(Number(q)||0)*profile.factors[unit],0);
  if(!Number.isFinite(total)||total<0)throw new Error('Invalid unit quantity.');
  return Number(total.toPrecision(12));
}

/** Add the actual prices of all separately-entered units; unit discounts are not flattened away. */
export function unitQuantitiesSaleTotal(
  profile:FrozenUnitProfile,quantities:UnitQuantityMap,
  overrides:Readonly<Record<string,number>>={}
):number {
  assertUnitQuantities(profile,quantities);
  let totalPaisa=0;
  for(const [unit,q] of Object.entries(quantities)){
    const price=overrides[unit]??profile.sellingPrices[unit];
    if(!Number.isFinite(price)||price<0)throw new Error('Invalid selling price in '+unit);
    totalPaisa+=Math.round((Number(q)||0)*price*100);
  }
  if(!Number.isSafeInteger(totalPaisa))throw new Error('Sale amount is too large.');
  return totalPaisa/100;
}
export function describeUnitQuantities(
  profile:FrozenUnitProfile,quantities:UnitQuantityMap
):string {
  assertUnitQuantities(profile,quantities);
  const units=Object.keys(profile.factors).sort((a,b)=>profile.factors[b]-profile.factors[a]);
  return units.filter(u=>(Number(quantities[u])||0)>0)
    .map(u=>quantities[u]+' '+u).join(' ') || '0 '+profile.baseUnit;
}
export function unitMapFromLegacy(
  product:Product,unit:string,primary:string,secondary:string
):UnitQuantityMap {
  const result:UnitQuantityMap={[unit]:primary};
  if(unit!==product.unit && (Number(secondary)||0)>0)result[product.unit]=secondary;
  return result;
}
