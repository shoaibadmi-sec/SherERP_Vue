import {demoPermissions,sourcePermissionGroup} from '../utils/permissions.ts';
import {purchasePosition, returnedQuantity, sourceEditable, validatePurchaseSource, validatePurchaseSplits, purchaseReturnQuote, type PurchaseSourceEvent} from '../utils/purchaseSource.ts';
import {toPaisa,validateBusinessDate} from '../utils/partyPayment.ts';
import type { LedgerEntry, Party, Product, Purchase, StockLot, StockMovement, PaymentSplit } from '../types/erp';
import { purchases as seedPurchases, expenseCategories } from './purchases.ts';
import { ledgerEntries as seedLedgerEntries } from './parties.ts';
import { dispatchPartyPreview, getPartyPreviewSnapshot } from './partyPreviewStore.ts';
import { productCategories } from './products.ts';
import {getProductImportPreviewSnapshot,upsertProductPreview} from './productImportPreviewStore.ts';


/** Design-preview state only: no network posting or cross-tenant persistence. */
const createdProductCategories: string[] = [];
const createdProductBrands: string[] = [];
const createdProductUnits: ProductUnitOption[] = [];
const createdCategories: string[] = [];
const inactiveExpenseCategories = new Set<string>();
const renamedExpenseCategories = new Map<string, string>();
const createdPurchases: Purchase[] = [];
const purchaseEvents: PurchaseSourceEvent[] = [];
let purchasesRevision=0;
const purchaseListeners=new Set<()=>void>();
export const getPurchasesPreviewRevision=()=>purchasesRevision;
export function subscribePurchasesPreview(listener:()=>void) {purchaseListeners.add(listener);return ()=>{purchaseListeners.delete(listener);};}
function publishPurchases(){purchasesRevision++;for(const listener of purchaseListeners)listener();}
export const availablePurchaseEvents = () => structuredClone(purchaseEvents);
export const purchaseRevision = (purchase:Purchase) => purchase.sourceRevision ?? 0;
export function mutatePreviewPurchase(expected:Purchase, operation:{kind:'correction';next:Purchase;reason:string;date:string}|{kind:'payment';payments:PaymentSplit[];reason:string;date:string}|{kind:'return';lines:{index:number;quantity:number}[];settlement:'credit'|'cash';payments:PaymentSplit[];reason:string;date:string}) {
 if(!demoPermissions.has(sourcePermissionGroup('purchase')+'.edit'))throw new Error('Purchase editing permission is required.');
 const index=createdPurchases.findIndex(p=>p.id===expected.id);const current=createdPurchases[index];
 if(!current||!sourceEditable(current))throw new Error('This sample bill needs complete source data from integration.');
 if(purchaseRevision(current)!==purchaseRevision(expected))throw new Error('Purchase changed. Close and reopen this action.');
 validateBusinessDate(operation.date);
 if(operation.date<(current.businessDate??operation.date))throw new Error('Payment or return cannot predate the purchase.');
 if(!operation.reason.trim())throw new Error('Add a reason or payment reference.');
 let next=structuredClone(current);let amount=0;let refund=0;
 if(operation.kind==='correction'){
  if(purchaseEvents.some(e=>e.purchaseId===current.id&&e.kind!=='correction'))throw new Error('Payments or returns exist. Source allocation review is required before correction.');
  if(operation.next.id!==current.id||operation.next.ref!==current.ref||operation.next.supplierId!==current.supplierId)throw new Error('Original purchase identity and supplier must stay unchanged.');
  validatePurchaseSource(operation.next);next=structuredClone(operation.next);
 }else if(operation.kind==='payment'){
  amount=operation.payments.reduce((sum,row)=>sum+toPaisa(row.amount,'Payment'),0)/100;
  if(amount<=0||amount>purchasePosition(current,purchaseEvents).due)throw new Error('Payment must be positive and no more than supplier due.');
  validatePurchaseSplits(operation.payments,amount);next.paid=(toPaisa(current.paid,'Paid')+toPaisa(amount,'Payment'))/100;
  next.payments=[...(current.payments??[]),...operation.payments];
 }else{
  const quote=purchaseReturnQuote(current,operation.lines,purchaseEvents);amount=quote.amount;
  refund=operation.settlement==='cash'?quote.excess:0;
  validatePurchaseSplits(operation.payments,refund);
 }
 next.sourceRevision=purchaseRevision(current)+1;
 const event:PurchaseSourceEvent={id:'purchase-event-'+current.id+'-'+next.sourceRevision,purchaseId:current.id,kind:operation.kind,date:operation.date,reason:operation.reason.trim(),before:structuredClone(current),after:structuredClone(next),amount,refund,
  ...(operation.kind==='return'?{lines:operation.lines.filter(l=>l.quantity>0),settlement:operation.settlement}:{}),...(operation.kind!=='correction'?{payments:operation.payments}:{})};
 createdPurchases[index]=next;purchaseEvents.push(event);publishPurchases();return structuredClone(next);
}


export const availableProducts = () => getProductImportPreviewSnapshot().products.map((product) => ({
  ...product,
  stock: product.stock + createdPurchases.reduce((sum, purchase) =>
    sum + (purchase.inventoryLines ?? []).reduce((qty, line, index) => qty + (line.productId === product.id ? line.quantity-returnedQuantity(purchase.id,index,purchaseEvents) : 0), 0), 0)
}));
export type ProductUnitOption = { name: string; symbol: string };
const initialProductUnits: ProductUnitOption[] = [
  { name: 'Piece', symbol: 'Pcs' }, { name: 'Gira', symbol: 'Gira' },
  { name: 'Kilogram', symbol: 'Kg' }, { name: 'Feet', symbol: 'Feet' },
  { name: 'Bag', symbol: 'Bag' }, { name: 'Coil', symbol: 'Coil' },
  { name: 'Pair', symbol: 'Pair' }, { name: 'Litre', symbol: 'Litre' },
  { name: 'Box', symbol: 'Box' }, { name: 'Gauge', symbol: 'Gauge' }
];
const seedBrands = ['Generic / No brand', 'RFL', 'Vision', 'Shah Cement'];
const isSame = (left: string, right: string) => left.toLocaleLowerCase() === right.toLocaleLowerCase();
export const availableProductCategories = () => [...new Set([...productCategories, ...createdProductCategories, ...getProductImportPreviewSnapshot().products.map(p=>p.category)])];
export const availableProductBrands = () => [...new Set([...seedBrands, ...createdProductBrands, ...getProductImportPreviewSnapshot().products.map(p=>p.brand).filter((brand):brand is string=>Boolean(brand))])];
export const availableProductUnits = (): ProductUnitOption[] => {
  const units = [...initialProductUnits, ...createdProductUnits];
  for (const product of getProductImportPreviewSnapshot().products) {
    for (const symbol of [product.unit, product.altUnit?.unit, ...(product.unitRelations?.flatMap(row => [row.leftUnit,row.rightUnit]) ?? [])]) {
      if (symbol && !units.some((item) => isSame(item.symbol, symbol)))
        units.push({ name: symbol, symbol });
    }
  }
  return units;
};
export function createPreviewProductBrand(name: string) {
  const trimmed = name.trim();
  if (trimmed && !availableProductBrands().some((item) => isSame(item, trimmed)))
    createdProductBrands.push(trimmed);
}
export function createPreviewProductUnit(name: string, symbol: string) {
  const cleanedName = name.trim(), cleanedSymbol = (symbol.trim() || cleanedName);
  if (cleanedName && cleanedSymbol && !availableProductUnits().some((item) =>
    isSame(item.name, cleanedName) || isSame(item.symbol, cleanedSymbol)))
    createdProductUnits.push({ name: cleanedName, symbol: cleanedSymbol });
}
export const availableParties = () => getPartyPreviewSnapshot().parties.map((party) => ({
  ...party,
  balance: party.balance - createdPurchases.filter((purchase) => purchase.supplierId === party.id)
    .reduce((sum, purchase) => { const position=purchasePosition(purchase,purchaseEvents); return sum+position.due-position.credit; }, 0)
}));
export const availableLedgerEntries = (): LedgerEntry[] => [
  ...seedLedgerEntries,
  ...purchaseEvents.filter(e=>e.kind==='payment').map(e=>({id:e.id,partyId:e.before.supplierId,date:e.date,type:'payment' as const,ref:e.before.ref,description:'Purchase payment · '+e.reason,debit:e.amount,credit:0})),
  ...purchaseEvents.filter(e=>e.kind==='return').flatMap(e=>[
   {id:e.id,partyId:e.before.supplierId,date:e.date,type:'return' as const,ref:e.before.ref,description:'Purchase return · '+e.reason,debit:e.amount,credit:0},
   ...(e.refund>0?[{id:e.id+'-refund',partyId:e.before.supplierId,date:e.date,type:'payment' as const,ref:e.before.ref,description:'Supplier cash refund',debit:0,credit:e.refund}]:[])
  ]),
  ...createdPurchases.flatMap((purchase) => [
    { id: purchase.id + '-bill', partyId: purchase.supplierId, date: purchase.date, type: 'purchase' as const,
      ref: purchase.ref, description: purchase.items, debit: 0, credit: purchase.total },
    ...((purchase.paid-purchaseEvents.filter(e=>e.purchaseId===purchase.id&&e.kind==='payment').reduce((sum,e)=>sum+e.amount,0)) > 0 ? [{ id: purchase.id + '-payment', partyId: purchase.supplierId, date: purchase.date,
      type: 'payment' as const, ref: purchase.ref, description: 'Purchase payment', debit: purchase.paid-purchaseEvents.filter(e=>e.purchaseId===purchase.id&&e.kind==='payment').reduce((sum,e)=>sum+e.amount,0), credit: 0 }] : [])
  ])
];
export const expenseCategoryRecords = () => [...expenseCategories, ...createdCategories].map(original => {
  const name = renamedExpenseCategories.get(original) ?? original;
  return { name, active: !inactiveExpenseCategories.has(name) };
});
export const availableExpenseCategories = () => expenseCategoryRecords().filter(category => category.active).map(category => category.name);
export const availablePurchases = () => [...createdPurchases, ...seedPurchases];

/** Purchase lots in the design preview; in the backend each lot will be posted atomically with its purchase. */
export const availableStockLots = (): StockLot[] => [
  ...createdPurchases.flatMap((purchase) => (purchase.inventoryLines ?? []).map((line, index) => ({
    id: purchase.id + '-lot-' + index,
    productId: line.productId,
    label: 'Purchase lot',
    receivedAt: purchase.date,
    quantity: line.quantity,
    available: line.quantity-returnedQuantity(purchase.id,index,purchaseEvents),
    unitCost: line.unitCost ?? 0,
    sellingPrice: line.lotSellingPrice,
    source: 'Purchase' as const,
    reference: purchase.ref,
    serials: line.serials,
    batchNumber: line.batchNumber,
    manufactureDate: line.manufactureDate,
    expiryDate: line.expiryDate
  }))),
  ...getProductImportPreviewSnapshot().lots
];
export function availableStockMovements():StockMovement[] {
 const movements:StockMovement[]=[];
 for(const purchase of createdPurchases){
  const history=purchaseEvents.filter(event=>event.purchaseId===purchase.id);
  const original=history[0]?.before??purchase;
  for(const [index,line] of (original.inventoryLines??[]).entries())movements.push({id:purchase.id+'-movement-'+index,productId:line.productId,date:original.businessDate??original.date,type:'Purchase',quantity:line.quantity,balance:0,reference:purchase.ref});
  for(const event of history){
   if(event.kind==='return')for(const line of event.lines??[]){
    if(line.quantity>0)movements.push({id:event.id+'-'+line.index,productId:event.before.inventoryLines![line.index].productId,date:event.date,type:'Return',quantity:-line.quantity,balance:0,reference:purchase.ref,note:event.reason});
   }
   if(event.kind==='correction')for(const productId of new Set([...(event.before.inventoryLines??[]),...(event.after.inventoryLines??[])].map(line=>line.productId))){
    const quantity=(event.after.inventoryLines??[]).filter(line=>line.productId===productId).reduce((sum,line)=>sum+line.quantity,0)-(event.before.inventoryLines??[]).filter(line=>line.productId===productId).reduce((sum,line)=>sum+line.quantity,0);
    if(quantity)movements.push({id:event.id+'-'+productId,productId,date:event.date,type:'Adjustment',quantity,balance:0,reference:purchase.ref,note:event.reason});
   }
  }
 }
 const balances=new Map(getProductImportPreviewSnapshot().products.map(product=>[product.id,product.stock]));
 movements.sort((a,b)=>a.date.localeCompare(b.date));
 for(const movement of movements){const balance=(balances.get(movement.productId)??0)+movement.quantity;balances.set(movement.productId,balance);movement.balance=balance;}
 return [...getProductImportPreviewSnapshot().movements,...movements];
}


export function createPreviewProductCategory(category: string) {
  if (!availableProductCategories().some((item) => item.toLowerCase() === category.toLowerCase())) createdProductCategories.push(category);
}
/** Contextual product creation carries the same opening lot evidence as the Products page. */
export function createPreviewProduct(product: Product, opening?: Pick<StockLot, 'serials' | 'batchNumber' | 'manufactureDate' | 'expiryDate'>) {
  if (availableProducts().some((item) => item.id === product.id)) return;
  if (product.kind !== 'Service' && product.stock > 0) {
    const date = new Date().toISOString().slice(0, 10);
    upsertProductPreview(product, {
      id: `lot-${product.id}-opening`, productId: product.id, label: 'Opening Stock', receivedAt: date,
      quantity: product.stock, available: product.stock, unitCost: product.purchasePrice, source: 'Opening',
      serials: opening?.serials?.length ? opening.serials : undefined,
      batchNumber: opening?.batchNumber, manufactureDate: opening?.manufactureDate, expiryDate: opening?.expiryDate
    }, {
      id: `mov-${product.id}-opening`, productId: product.id, date, type: 'Opening', quantity: product.stock,
      balance: product.stock, reference: 'Opening Stock', note: 'Opening balance'
    });
  } else upsertProductPreview(product);
}

export function createPreviewParty(party: Party) {
  if (!getPartyPreviewSnapshot().parties.some((item) => item.id === party.id)) {
    dispatchPartyPreview({type:'create-party',party});
  }
}
export function createPreviewExpenseCategory(category: string) {
  const name = category.trim();
  if (!name) throw new Error('Category name is required.');
  if (expenseCategoryRecords().some(item => isSame(item.name, name))) throw new Error('This category already exists.');
  createdCategories.push(name);
}
export function setPreviewExpenseCategoryActive(name: string, active: boolean) {
  if (!expenseCategoryRecords().some(item => item.name === name)) throw new Error('Category not found.');
  if (active) inactiveExpenseCategories.delete(name); else inactiveExpenseCategories.add(name);
}
export function renamePreviewExpenseCategory(previous: string, next: string) {
  const name = next.trim();
  if (!name) throw new Error('Category name is required.');
  if (expenseCategoryRecords().some(item => item.name !== previous && isSame(item.name, name))) throw new Error('This category already exists.');
  const original = [...expenseCategories, ...createdCategories].find(item => (renamedExpenseCategories.get(item) ?? item) === previous);
  if (!original) throw new Error('Category not found.');
  renamedExpenseCategories.set(original, name);
  if (inactiveExpenseCategories.delete(previous)) inactiveExpenseCategories.add(name);
}
export function createPreviewPurchase(purchase: Purchase) {
  if (!availablePurchases().some((item) => item.id === purchase.id)) { if(purchase.cartSnapshot)validatePurchaseSource(purchase); createdPurchases.unshift(structuredClone(purchase)); publishPurchases(); }
}
