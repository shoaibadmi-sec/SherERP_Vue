import type {CartLine} from '../hooks/usePosCart.ts';
import {compoundBaseQuantity,compoundLineTotal,formatCompoundQuantity} from './posQuantity.ts';
import {productUnitFactor} from './unitChain.ts';
import {freezeUnitProfile,unitMapFromLegacy,unitQuantitiesBase,unitQuantitiesSaleTotal,describeUnitQuantities,type FrozenUnitProfile} from './multiUnitTransactions.ts';
import {activeOfferFor,effectivePriceForUnit} from './productFeatures.ts';
import {productOffers} from '../data/productOffers.ts';

/** Draft typing may temporarily be invalid; checkout has strict unit-price validation. */
const previewPrice = (text:string):number => {
  const number=Number(text);
  return Number.isFinite(number) && number>=0 ? number : 0;
};
export function saleLineQuantities(line:CartLine): Record<string,string> {
  return line.unitQuantities ?? unitMapFromLegacy(line.product,line.unit,line.qty,line.secondaryQty);
}
export function saleLineBaseQty(line:CartLine):number {
  if(line.unitQuantities) return unitQuantitiesBase(line.historicalUnitSnapshot??freezeUnitProfile(line.product),line.unitQuantities);
  return compoundBaseQuantity(line.qty,line.secondaryQty,productUnitFactor(line.product,line.unit)||1);
}
export function freezeSaleLineProfile(line:CartLine):FrozenUnitProfile {
  if(line.historicalUnitSnapshot)return structuredClone(line.historicalUnitSnapshot);
  const profile=freezeUnitProfile(line.product);
  const offer=activeOfferFor(line.product.id,productOffers);
  for(const unit of Object.keys(profile.sellingPrices)) {
    profile.sellingPrices[unit]=unit===line.unit?previewPrice(line.price):effectivePriceForUnit(line.product,offer,unit);
  }
  return profile;
}
export function saleLineTotal(line:CartLine):number {
  if(!line.unitQuantities) return compoundLineTotal(line.qty,line.secondaryQty,productUnitFactor(line.product,line.unit)||1,line.price);
  const profile=line.historicalUnitSnapshot??freezeUnitProfile(line.product);
  const offer=activeOfferFor(line.product.id,productOffers);
  const current=Object.fromEntries(Object.keys(line.unitQuantities).map(unit=>[
    unit,unit===line.unit?previewPrice(line.price):
      line.historicalUnitSnapshot?profile.sellingPrices[unit]:effectivePriceForUnit(line.product,offer,unit)
  ]));
  return unitQuantitiesSaleTotal(profile,line.unitQuantities,current);
}
export function saleLineDescription(line:CartLine):string {
  if(line.unitQuantities) return describeUnitQuantities(line.historicalUnitSnapshot??freezeUnitProfile(line.product),line.unitQuantities);
  return formatCompoundQuantity(line.qty,line.unit,line.secondaryQty,line.product.unit);
}
