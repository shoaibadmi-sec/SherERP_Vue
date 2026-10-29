import type {Product} from '../types/erp.ts';
import {productUnitFactor} from './unitChain.ts';
import {unitQuantitiesBase,freezeUnitProfile,type FrozenUnitProfile} from './multiUnitTransactions.ts';

/** Parse the entire editable value. Invalid text never becomes a paid/discounted prefix. */
export function posMoney(value:string):number {
  if(!value.trim())return 0;
  if(!/^(?:\d+(?:\.\d{0,2})?|\.\d{1,2})$/.test(value.trim()))return NaN;
  const amount=Number(value);
  return Number.isFinite(amount)&&Number.isSafeInteger(Math.round(amount*100))?amount:NaN;
}
/** Unit prices may need four decimals; payment and invoice amounts remain in paisa. */
export function posUnitPrice(value:string):number {
  if(!/^(?:\d+(?:\.\d{0,4})?|\.\d{1,4})$/.test(value.trim()))return NaN;
  const amount=Number(value);
  return Number.isFinite(amount)&&amount>=0&&Number.isSafeInteger(Math.round(amount*10000))?amount:NaN;
}
type CheckoutDraft={
  lines:readonly {product:Product;qty:string;secondaryQty:string;unit:string;price:string;
    unitQuantities?:Record<string,string>;historicalUnitSnapshot?:FrozenUnitProfile}[];
  discount:string;discountMode:'amount'|'percent';
  payments:readonly {id:string;method:string;account:string;amount:string}[];
  total:number;customerId?:string;availableCredit:number;
};
export type PosCheckoutIssue='quantity'|'price'|'discount'|'payment'|'account'|'credit';
export function validatePosCheckout(draft:CheckoutDraft,accounts?:Record<string,readonly string[]>):PosCheckoutIssue|null {
  if(!draft.lines.length)return 'quantity';
  for(const line of draft.lines){
    const decimal=(raw:string)=>/^(?:\d+(?:\.\d{0,6})?|\.\d{1,6})$/.test(raw.trim()||'0')?Number(raw||0):NaN;
    const qty=decimal(line.qty),secondary=decimal(line.secondaryQty);
    if(line.unitQuantities) {
      try {
        if(unitQuantitiesBase(line.historicalUnitSnapshot??freezeUnitProfile(line.product),line.unitQuantities)<=0)return 'quantity';
      }catch{return 'quantity';}
    }else{
      const factor=productUnitFactor(line.product,line.unit);
      if(!Number.isFinite(qty)||!Number.isFinite(secondary)||!Number.isFinite(factor)||factor<=0||qty*factor+secondary<=0||
        (factor===1&&secondary!==0))return 'quantity';
    }
    if(!line.price.trim()||!Number.isFinite(posUnitPrice(line.price)))return 'price';
  }
  const discount=posMoney(draft.discount);
  if(!Number.isFinite(discount)||(draft.discountMode==='percent'&&discount>100))return 'discount';
  let credit=0,other=0;
  const ids=new Set<string>();
  for(const row of draft.payments){
    const amount=posMoney(row.amount);
    if(!Number.isFinite(amount)||ids.has(row.id))return 'payment';
    ids.add(row.id);
    if(amount<=0)continue;
    if(!row.account.trim()||(accounts&&!accounts[row.method]?.includes(row.account)))return 'account';
    if(row.method==='Customer Credit')credit+=amount;else other+=amount;
  }
  if(credit>0&&(!draft.customerId||!Number.isFinite(draft.availableCredit)||
    Math.round(credit*100)>Math.round(draft.availableCredit*100)||Math.round(credit*100)>Math.round(Math.max(0,draft.total-other)*100)))return 'credit';
  return null;
}
