import type {Product,SaleStockSource,StockLot} from '../types/erp.ts';
import {saleAvailableStock} from '../utils/posStock.ts';

/** Own is an explicit UI-only clamp; it is never stored as a SaleStockSource. */
export type PosStockRequest={
 key:string;product:Product;requestedBaseQty:number;
 choice?:SaleStockSource|'Own';
};
export type PosStockAllocation={
 key:string;productId:string;requestedBaseQty:number;
 ownBaseQty:number;vendorBaseQty:number;negativeBaseQty:number;
 needsSourceBaseQty:number;effectiveBaseQty:number;availableBeforeBaseQty:number;
};

/**
 * Deterministic cart-wide reservation (stable input order) using net-stock
 * authority. Separate positive lots must never hide prior OVERSOLD debt.
 */
export function allocatePosStock(
 lines:readonly PosStockRequest[],lots:readonly StockLot[],now=new Date()
):PosStockAllocation[]{
 const remaining=new Map<string,number>();
 const result:PosStockAllocation[]=[];
 const usedKeys=new Set<string>();
 for(const line of lines){
  const p=line.product;
  if(!line.key||usedKeys.has(line.key))throw new Error('Duplicate or missing cart key.');
  usedKeys.add(line.key);
  if(!Number.isFinite(line.requestedBaseQty)||line.requestedBaseQty<0)
   throw new Error('Cart quantity must be a nonnegative finite base quantity.');
  if(!p.id)throw new Error('Cart product is required.');
  if(p.kind==='Service'){
   result.push({key:line.key,productId:p.id,requestedBaseQty:line.requestedBaseQty,
    ownBaseQty:line.requestedBaseQty,vendorBaseQty:0,negativeBaseQty:0,
    needsSourceBaseQty:0,effectiveBaseQty:line.requestedBaseQty,
    availableBeforeBaseQty:line.requestedBaseQty});
   continue;
  }
  if(!remaining.has(p.id)){
   const physical=Math.max(0,saleAvailableStock(p,[...lots],now));
   const net=Math.max(0,p.stock);
   remaining.set(p.id,Math.min(net,physical));
  }
  const before=remaining.get(p.id)!;
  const own=Math.min(before,line.requestedBaseQty);
  remaining.set(p.id,Math.max(0,before-own));
  const shortage=Math.max(0,line.requestedBaseQty-own);
  const choice=line.choice;
  const vendor=typeof choice==='object'&&choice?.mode==='Vendor'?shortage:0;
  const negative=typeof choice==='object'&&choice?.mode==='Negative'?shortage:0;
  const unresolved=!choice?shortage:0;
  const effective=own+vendor+negative;
  result.push({key:line.key,productId:p.id,requestedBaseQty:line.requestedBaseQty,
   ownBaseQty:own,vendorBaseQty:vendor,negativeBaseQty:negative,
   needsSourceBaseQty:unresolved,effectiveBaseQty:effective,
   availableBeforeBaseQty:before});
 }
 return result;
}
