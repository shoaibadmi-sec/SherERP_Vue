export type ReportProduct = {id:string;name:string;category:string;unit:string;stock:number;active:boolean;purchasePrice:number;sellPrice:number};

export type ReportsPlan = 'basic' | 'medium' | 'premium';

export type CostSource = 'Purchase lot' | 'Latest purchase' | 'Missing';

/** Analytics parameters layered on top of an existing product (data/products.ts) */
export type ProductProfile = {
  productId: string;
  supplierId: string;
  previousCost: number | null;
  costSource: CostSource;
  leadDays: number;
  pack: number;
  /** Average base units sold per day today */
  dailyDemand: number;
  /** Weekly demand growth, e.g. 0.05 = +5% per week */
  trend: number;
  discountPct: number;
  /** Age of the oldest unsold stock lot in days */
  stockAgeDays: number;
};

export type ReportCustomer = {
  id: string;
  name: string;
  phone: string;
  area: string;
  weight: number;
  /** Typical days a credit customer takes to pay */
  payDays: number;
  credit: boolean;
  /** Stopped buying this many days ago (churn signal) */
  inactiveDays?: number;
};

export type ReportSupplier = { id: string; name: string; phone: string; area: string };

export type RecurringExpense = { category: string; payee: string; amount: number; dayOfMonth: number };
export type VariableExpense = { category: string; payee: string; weekly: number };
export type CashAccount = { id: string; name: string; kind: 'Cash' | 'Bank' | 'Mobile banking'; balance: number };

export type SaleLineRec = {
  id: string;
  invoice: string;
  date: string;
  customerId: string;
  customer: string;
  productId: string | null;
  name: string;
  category: string;
  qty: number;
  unit: string;
  price: number;
  discount: number;
  revenue: number;
  unitCost: number | null;
  source: 'History' | 'Recorded';
};

export type PaymentRec = { date: string; amount: number; method: string };

export type InvoiceRec = {
  id: string;
  date: string;
  customerId: string;
  customer: string;
  phone: string;
  total: number;
  dueOverride?: number;
  payments: PaymentRec[];
  source: 'History' | 'Recorded';
};

export type PurchaseRec = {
  id: string;
  date: string;
  supplierId: string;
  supplier: string;
  productId: string;
  name: string;
  category: string;
  qty: number;
  unit: string;
  unitCost: number;
  amount: number;
  paid: number;
  dueDate: string;
};

export type ExpenseRec = {
  id: string;
  date: string;
  category: string;
  payee: string;
  description: string;
  amount: number;
  paid: number;
  method: string;
  hasReceipt: boolean;
  source: 'History' | 'Recorded';
};

export type ReturnRec = { id: string; date: string; invoice: string; customer: string; name: string; qty: number; amount: number; settlement: string };

export type VendorBalance = { name: string; amount: number };

export type ReportDataset = {
  asOf: string;
  products: ReportProduct[];
  profiles: ProductProfile[];
  customers: ReportCustomer[];
  suppliers: ReportSupplier[];
  recurringExpenses: RecurringExpense[];
  variableExpenses: VariableExpense[];
  lines: SaleLineRec[];
  invoices: InvoiceRec[];
  purchases: PurchaseRec[];
  expenses: ExpenseRec[];
  returns: ReturnRec[];
  vendorBalances: VendorBalance[];
  accounts: CashAccount[];
};

export type Period = {
  preset: PeriodPreset;
  from: string;
  to: string;
  days: number;
  prevFrom: string;
  prevTo: string;
  label: string;
};

export type PeriodPreset = 'today' | '7d' | 'month' | '30d' | '90d' | 'custom';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'teal';
