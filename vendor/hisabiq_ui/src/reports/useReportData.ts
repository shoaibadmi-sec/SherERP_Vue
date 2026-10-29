import { useMemo, useSyncExternalStore } from 'react';
import { getSalesPreviewSnapshot, subscribeSalesPreview } from '../data/salesPreviewStore';
import { getProductImportPreviewSnapshot, subscribeProductImportPreview } from '../data/productImportPreviewStore';
import { getExpensePreviewSnapshot, subscribeExpensePreview } from '../data/expensePreviewStore';
import { getFinancePreviewSnapshot, subscribeFinancePreview } from '../data/financePreviewStore';
import { availableProducts, availablePurchases, availablePurchaseEvents, availableStockLots, availableStockMovements, getPurchasesPreviewRevision, subscribePurchasesPreview } from '../data/erpDemoStore';
import { daybookTransactions } from '../data/daybook';
import { warrantyCases } from '../data/warranty';
import { businessToday, expenseDateIso } from '../utils/dateRange';
import { buildReportData } from './model';
import type { UnifiedTransaction } from '../types/transactions';

export function useReportData(refresh:number) {
 const sales=useSyncExternalStore(subscribeSalesPreview,getSalesPreviewSnapshot);
 const products=useSyncExternalStore(subscribeProductImportPreview,getProductImportPreviewSnapshot);
 const expenses=useSyncExternalStore(subscribeExpensePreview,getExpensePreviewSnapshot);
 const finance=useSyncExternalStore(subscribeFinancePreview,getFinancePreviewSnapshot);
 const purchasesRevision=useSyncExternalStore(subscribePurchasesPreview,getPurchasesPreviewRevision);
 return useMemo(()=>{
  const purchases=availablePurchases();
  const lots=availableStockLots().map(lot=>{
   const purchase=purchases.find(p=>p.ref===lot.reference);
   const line=purchase?.inventoryLines?.find(l=>l.productId===lot.productId);
   return line&&line.unitCost===undefined?{...lot,unitCost:Number.NaN}:lot;
  });
  const financial:UnifiedTransaction[]=finance.transactions.map(t=>({
   id:t.id,source:'finance',sourceId:t.id,reference:t.reference||t.id,type:t.type,transactionDate:expenseDateIso(t.date),
   createdAt:t.date+'T12:00:00+06:00',postedBy:t.createdBy,party:t.party,partyId:t.partyId,
   amount:t.amount,moneyIn:t.direction==='in'?t.amount:0,moneyOut:t.direction==='out'?t.amount:0,
   accounts:t.paymentAccounts?.map(p=>p.account)??(t.account?[t.account]:[]),
   paymentBreakdown:t.paymentAccounts?.map(p=>({label:p.account,amount:p.amount})),
   status:t.status==='Reversed'?'Reversed':'Posted',countsTowardCashflow:t.type!=='Transfer',
   details:t.note,sourceRoute:'/app/finance'
  }));
  return buildReportData({asOf:businessToday(),invoices:sales.invoices,returns:sales.returns,purchases,purchaseEvents:availablePurchaseEvents(),expenses:expenses.expenses,
   products:availableProducts(),lots,movements:availableStockMovements(),warranty:warrantyCases,
   transactions:[...financial,...daybookTransactions.filter(t=>['customer-payment','supplier-payment','cheque','transfer'].includes(t.source))]});
 },[sales,products,expenses,finance,purchasesRevision,refresh]);
}

