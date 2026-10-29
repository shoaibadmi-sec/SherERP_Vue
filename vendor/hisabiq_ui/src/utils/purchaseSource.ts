import {purchasePaymentAccounts} from './purchasePaymentMethods.ts';
import {baseQty,baseCost,lineAmount} from './purchaseCart.ts';
import {calculatePurchaseCheckout} from './purchaseCheckout.ts';
import type { PaymentSplit, Purchase } from '../types/erp';
import { toPaisa, validateBusinessDate } from './partyPayment.ts';
import { freezeUnitProfile, assertUnitQuantities } from './multiUnitTransactions.ts';
import {resolveUnitChain} from './unitChain.ts';
import type { PurchaseCartLine } from './purchaseCart.ts';

export type PurchaseSourceEvent = {
 id:string; purchaseId:string; kind:'payment'|'return'|'correction'; date:string; reason:string;
 before:Purchase; after:Purchase; lines?:{index:number;quantity:number}[];
 amount:number; refund:number; settlement?:'credit'|'cash'; payments?:PaymentSplit[];
};
export function purchasePosition(purchase:Purchase,events:readonly PurchaseSourceEvent[]) {
 const history=events.filter(e=>e.purchaseId===purchase.id&&e.kind==='return');
 const returned=history.reduce((sum,e)=>sum+toPaisa(e.amount,'Return'),0);
 const refunded=history.reduce((sum,e)=>sum+toPaisa(e.refund,'Refund'),0);
 const net=toPaisa(purchase.total,'Purchase')-returned;
 const paid=toPaisa(purchase.paid,'Paid')-refunded;
 return {total:net/100,paid:paid/100,due:Math.max(0,net-paid)/100,credit:Math.max(0,paid-net)/100,returned:returned/100};
}
export function sourceEditable(purchase:Purchase) {
 return Boolean(purchase.cartSnapshot?.length&&purchase.inventoryLines?.length===purchase.cartSnapshot.length);
}
export function sourceReturnable(purchase:Purchase) {
 return sourceEditable(purchase)&&purchase.inventoryLines!.every(line=>!line.serials?.length&&!line.batchNumber&&!line.expiryDate);
}
export function returnedQuantity(purchaseId:string,index:number,events:readonly PurchaseSourceEvent[]) {
 return events.filter(e=>e.purchaseId===purchaseId&&e.kind==='return').reduce((sum,e)=>sum+(e.lines?.find(l=>l.index===index)?.quantity??0),0);
}
export function purchaseReturnQuote(purchase:Purchase,requested:readonly {index:number;quantity:number}[],events:readonly PurchaseSourceEvent[]) {
 if(!sourceReturnable(purchase))throw new Error('Original unit snapshots or tracked-stock allocation are unavailable.');
 const lines=purchase.inventoryLines!;
 const gross=lines.map(line=>line.quantity*(line.unitCost??0));const grossTotal=gross.reduce((a,b)=>a+b,0);
 if(!Number.isFinite(grossTotal)||grossTotal<=0)throw new Error('Original cost is missing.');
 const raw=gross.map(amount=>toPaisa(purchase.total,'Total')*amount/grossTotal);
 const budgets=raw.map(Math.floor);
 const remainder=toPaisa(purchase.total,'Total')-budgets.reduce((a,b)=>a+b,0);
 const order=raw.map((value,index)=>({index,fraction:value-budgets[index]})).sort((a,b)=>b.fraction-a.fraction||a.index-b.index);
 for(let index=0;index<remainder;index++)budgets[order[index].index]++;
 const seen=new Set<number>();let amount=0;
 for(const row of requested){
  if(seen.has(row.index)||!Number.isInteger(row.index)||!lines[row.index])throw new Error('Return source line is invalid or duplicated.');
  seen.add(row.index);const original=lines[row.index];const previous=returnedQuantity(purchase.id,row.index,events);
  if(!Number.isFinite(row.quantity)||row.quantity<0||row.quantity>original.quantity-previous+1e-8)throw new Error('Return quantity exceeds the remaining purchased quantity.');
  if(row.quantity>0)amount+=Math.round(budgets[row.index]*(previous+row.quantity)/original.quantity)-Math.round(budgets[row.index]*previous/original.quantity);
 }
 if(!requested.some(row=>row.quantity>0)||amount<0)throw new Error('Choose a positive return quantity.');
 const position=purchasePosition(purchase,events);const reduction=Math.min(amount,toPaisa(position.due,'Due'));
 return {amount:amount/100,dueReduction:reduction/100,excess:(amount-reduction)/100};
}
export function validatePurchaseSplits(rows:readonly PaymentSplit[],amount:number) {
 const seen=new Set<string>();let sum=0;
 for(const row of rows){
  if(seen.has(row.id)||!row.id)throw new Error('Payment row is duplicated.');seen.add(row.id);
  if(!['Cash','Bank','Card','bKash','Nagad'].includes(row.method)||!row.account?.trim())throw new Error('Choose a valid payment method and account.');
  if(row.method==='Customer Credit'||!purchasePaymentAccounts[row.method]?.includes(row.account??''))throw new Error('Payment account does not match the selected method.');
  const value=toPaisa(row.amount,'Payment');if(!value)throw new Error('Enter a positive payment amount.');sum+=value;
 }
 if(sum!==toPaisa(amount,'Amount'))throw new Error('Payment sources do not match the amount.');
}
export function validatePurchaseSource(purchase:Purchase) {
 validateBusinessDate(purchase.businessDate??'');
 const total=toPaisa(purchase.total,'Purchase total'),paid=toPaisa(purchase.paid,'Paid');
 if(!total||paid>total)throw new Error('Purchase total or payment is invalid.');
 validatePurchaseSplits(purchase.payments??[],purchase.paid);
 if(!sourceEditable(purchase))throw new Error('Save original cart and unit snapshots first.');
 const cart=purchase.cartSnapshot!;
 for(const snapshot of cart)validatePurchaseUnitSnapshot(snapshot);
 const subtotal=cart.reduce((sum,line)=>sum+lineAmount(line),0);
 const totals=calculatePurchaseCheckout(subtotal,String(purchase.discount??0),'amount',purchase.roundingRule??'No rounding',[]);
 if(toPaisa(totals.total,'Calculated total')!==total)throw new Error('Total does not match the original cart calculation.');
 for(const [index,line] of purchase.inventoryLines!.entries()){
  const snapshot=cart[index];
  if(line.productId!==snapshot.product.id||Math.abs(line.quantity-baseQty(snapshot))>1e-8||Math.abs((line.unitCost??0)-baseCost(snapshot))>1e-8)throw new Error('Stock quantities or costs do not match the cart snapshot.');
  if(!Number.isFinite(line.quantity)||line.quantity<=0||!Number.isFinite(line.unitCost)||line.unitCost!<=0)throw new Error('Purchase quantity or cost is invalid.');
 }
}
export function validatePurchaseUnitSnapshot(snapshot:PurchaseCartLine):void {
 if(snapshot.product.unitRelations?.length&&resolveUnitChain(snapshot.product.unitRelations).stockUnit!==snapshot.product.unit)throw new Error('The frozen stock unit must be the smallest terminal unit in its chain.');
 const profile=freezeUnitProfile(snapshot.product);
 if(profile.factors[snapshot.product.unit]!==1)throw new Error('Invalid frozen base stock unit.');
 if(!Object.prototype.hasOwnProperty.call(profile.factors,snapshot.costUnit)||Object.values(profile.factors).some(f=>!Number.isFinite(f)||f<=0))throw new Error('Invalid original quantity or unit.');
 if(snapshot.unitQuantities)assertUnitQuantities(profile,snapshot.unitQuantities);
 else if([snapshot.bigQty,snapshot.smallQty].some(value=>!Number.isFinite(Number(value))||Number(value)<0))throw new Error('Invalid original quantity or unit.');
}
