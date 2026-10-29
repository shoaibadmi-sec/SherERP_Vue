import type { Expense, Product, Purchase, SalesInvoice, SalesReturn, StockLot, StockMovement, WarrantyCase } from '../types/erp';
import type { UnifiedTransaction } from '../types/transactions';
import type { PurchaseSourceEvent } from '../utils/purchaseSource';

export type ReportGroup = 'overview' | 'sales' | 'purchasing' | 'stock' | 'people' | 'money' | 'controls';
export type ReportScreen = 'overview' | 'sales' | 'sales-lab' | 'stock' | 'dues' | 'money' | 'advisor' | 'profit' | 'buying' | 'cashflow' | 'customers' | 'library';
export type ReportKey = 'overview' | 'sales-register' | 'product-sales' | 'category-sales' | 'customer-sales' | 'sales-returns' | 'product-profit' | 'discounts' | 'purchases' | 'supplier-purchases' | 'purchase-prices' | 'stock' | 'low-stock' | 'stock-velocity' | 'stock-ageing' | 'expiry' | 'stock-movements' | 'reorder' | 'receivables' | 'payables' | 'collections' | 'cash-book' | 'expenses' | 'expense-categories' | 'finance-movements' | 'warranty' | 'data-quality' | 'profit-loss' | 'balance-sheet' | 'installments' | 'supplier-performance' | 'seasonal' | 'bundle-profit' | 'reconciliation';
export type CellValue = string | number | null;
export type ReportRow = {
 id:string; label:string; labelBn?:string; date:string; category?:string; brand?:string;
 productId?:string; partyId?:string; party?:string; user?:string; account?:string; method?:string; status:string;
 values:Record<string,CellValue>; note?:string; route?:string; children?:ReportRow[];
};
export type ReportFilters = {
 from:string; to:string; search:string; category:string; brand:string; product:string; party:string;
 user:string; account:string; status:string; compare:'none'|'previous'; sort:string; direction:'asc'|'desc';
};
export type PurchaseAssumptions = { leadDays:number; reviewDays:number; safety:number; pack:number; budget:number };
export type ReportInput = {
 asOf:string; invoices:readonly SalesInvoice[]; returns:readonly SalesReturn[]; purchases:readonly Purchase[];
 expenses:readonly Expense[]; products:readonly Product[]; lots:readonly StockLot[]; movements:readonly StockMovement[];
 transactions:readonly UnifiedTransaction[]; warranty:readonly WarrantyCase[]; purchaseEvents?:readonly PurchaseSourceEvent[];
};
export type ReportData = {
 asOf:string; sales:ReportRow[]; saleLines:ReportRow[]; returns:ReportRow[]; purchases:ReportRow[];
 purchaseLines:ReportRow[]; expenses:ReportRow[]; stock:ReportRow[]; lots:ReportRow[]; movements:ReportRow[];
 cash:ReportRow[]; finance:ReportRow[]; warranty:ReportRow[]; quality:ReportRow[];
};
export type ReportColumn = { key:string; en:string; bn:string; kind?:'money'|'number'|'quantity'|'date'|'percent'; cost?:boolean };
export type ReportDefinition = {
 id:ReportKey; group:ReportGroup; en:string; bn:string; question:string; questionBn:string;
 columns:string[]; dimensions:('category'|'brand'|'product'|'party'|'user'|'account'|'status')[];
 snapshot?:boolean; unavailable?:{en:string;bn:string};
};
export type ReportResult = {rows:ReportRow[];totals:Record<string,number|null>;basis:string;basisBn:string};

