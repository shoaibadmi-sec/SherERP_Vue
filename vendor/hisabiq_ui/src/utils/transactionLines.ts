/** Shared pure math for non-posting product-line editors with compound units. */
export type TransactionLineAmount={
 quantity:number;price:number;unit:string;secondaryQuantity?:number;unitFactor?:number;
};
export function transactionLineTotal(line:TransactionLineAmount):number{
 const base=Number(line.quantity)||0,secondary=Number(line.secondaryQuantity)||0,price=Number(line.price)||0;
 const factor=Number(line.unitFactor)||1;
 if(!Number.isFinite(base)||!Number.isFinite(secondary)||!Number.isFinite(price)||!Number.isFinite(factor)
  ||base<0||secondary<0||price<0||factor<=0)return NaN;
 const raw=base*price+(factor>1?secondary*price/factor:0);
 return Math.round((raw+Number.EPSILON)*100)/100;
}
