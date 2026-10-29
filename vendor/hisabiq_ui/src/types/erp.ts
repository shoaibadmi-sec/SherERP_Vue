export type ProductKind = 'Stock' | 'Service' | 'Bundle';
export type WarrantyDurationUnit = 'Days' | 'Months' | 'Years';
export type WarrantyType = 'Seller' | 'Manufacturer' | 'Service' | 'Replacement';
export type SerialTrackingMode = 'Off' | 'Optional' | 'Required';
export type StockAllocationMethod = 'FIFO' | 'FEFO';

export type ProductWarranty = {
  enabled: boolean;
  duration?: number;
  durationUnit?: WarrantyDurationUnit;
  type?: WarrantyType;
  terms?: string;
};

export type WarrantySnapshot = {
  duration: number;
  durationUnit: WarrantyDurationUnit;
  type: WarrantyType;
  terms?: string;
};

export type ProductExpirySettings = {
  enabled: boolean;
  dateRequired: boolean;
  warningDays: number;
  allocationMethod: StockAllocationMethod;
};

export type OfferDiscountType = 'Percentage' | 'Fixed';
export type ProductOfferStatus = 'Scheduled' | 'Active' | 'Expired' | 'Disabled';

export type ProductOffer = {
  id: string;
  productId: string;
  discountType: OfferDiscountType;
  value: number;
  priceUnit: string;
  startAt: string;
  endAt: string;
  enabled: boolean;
};

export type UnitConversion = {
  /** Larger unit name, e.g. "Box" or "Gauge" */
  unit: string;
  /** How many base units are in one larger unit */
  factor: number;
  /** Optional explicit selling price for the larger unit */
  price?: number;
};

/** One natural relationship, such as 1 Bag = 12 Box. Stored largest to smallest. */
export type UnitRelation = {
  leftUnit: string;
  rightUnit: string;
  quantity: number;
};

export type Product = {
  id: string;
  kind?: ProductKind;
  name: string;
  nameBn?: string;
  sku: string;
  category: string;
  brand?: string;
  image?: string;
  /** Editor gallery; image remains the cover used by carts and lists. */
  images?: string[];
  /** Base (smallest) unit, e.g. "Pcs", "Gira", "Kg" */
  unit: string;
  altUnit?: UnitConversion;
  /** Natural unit chain; all stock and FIFO quantities remain in the final unit. */
  unitRelations?: UnitRelation[];
  /** Custom prices per selected unit; other units use exact automatic conversions. */
  unitSellPrices?: Record<string,number>;
  unitPurchasePrices?: Record<string,number>;
  /** Stock in base units */
  stock: number;
  /** Preferred display/POS unit. Quantity remains in base units. */
  stockViewUnit?: string;
  minStock: number;
  sellPrice: number;
  purchasePrice: number;
  warranty?: ProductWarranty;
  serialTracking?: SerialTrackingMode;
  expiry?: ProductExpirySettings;
  active: boolean;
};

/** A single stock product required to sell one fixed virtual bundle Set. */
export type BundleComponent = {
  productId: string;
  primaryQty: string;
  secondaryQty: string;
  selectedUnit: string;
  baseQty: number;
  unitFactorAtSave: number;
  sortOrder: number;
};

/** Recipe revisions are immutable once saved or referenced by a sale. */
export type BundleVersion = {
  bundleProductId: string;
  revision: number;
  createdAt: string;
  components: readonly BundleComponent[];
};

export type BundleDraft = {
  product: Product & { kind: 'Bundle'; unit: 'Set' };
  components: readonly BundleComponent[];
};

export type StockLot = {
  id: string;
  productId: string;
  label: string;
  receivedAt: string;
  quantity: number;
  available: number;
  unitCost: number;
  /** Base-unit selling price override for this purchase lot, not the product default. */
  sellingPrice?: number;
  source: 'Opening' | 'Purchase' | 'Adjustment' | 'Return';
  reference?: string;
  batchNumber?: string;
  manufactureDate?: string;
  expiryDate?: string;
  serials?: string[];
};

export type StockMovementType = 'Opening' | 'Purchase' | 'Sale' | 'Return' | 'Adjustment';

export type StockMovement = {
  id: string;
  productId: string;
  date: string;
  type: StockMovementType;
  quantity: number;
  balance: number;
  reference?: string;
  note?: string;
};

export type PartyRole =
'Customer' |
'Supplier' |
'Vendor' |
'Lender' |
'Borrower' |
'Payee' |
'Owner';

export type Party = {
  id: string;
  name: string;
  nameBn?: string;
  roles: PartyRole[];
  phone: string;
  area: string;
  /** Positive = they owe us (receivable). Negative = we owe them (payable). */
  balance: number;
  lastActivity: string;
  avatarColor: string;
  image?: string;
  /** UI preview identity lifecycle; financial records remain separately audited. */
  status?: 'Active' | 'Inactive';
};

export type LedgerEntryType = 'invoice' | 'payment' | 'purchase' | 'return' | 'note' | 'opening';

export type LedgerEntry = {
  id: string;
  partyId: string;
  date: string;
  type: LedgerEntryType;
  ref?: string;
  description: string;
  debit: number;
  credit: number;
  attachment?: {name: string;url?: string;};
};

export type PaymentMethod = 'Cash' | 'bKash' | 'Nagad' | 'Mobile Banking' | 'Card' | 'Bank' | 'Customer Credit';

export type TransactionAuditFields = {
  transactionDate?: string;
  createdAt?: string;
  postedBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  deletedAt?: string;
  deletedBy?: string;
  recordStatus?: 'Posted' | 'Draft' | 'Deleted';
};

export type PaymentSplit = {
  id: string;
  method: PaymentMethod;
  amount: number;
  account?: string;
  /** Stable Finance source, when the payment originates from an identified money account. */
  accountId?: string;
};

export type SaleStockSource =
  | { mode: 'Negative' }
  | { mode: 'Vendor'; vendorId: string; vendorName: string; /** Unknown until evening = null, not zero. Base-unit cost. */ unitCost: number | null };

export type Sale = TransactionAuditFields & {
  id: string;
  invoice: string;
  date: string;
  time: string;
  party: string;
  items: number;
  total: number;
  paid: number;
  method: PaymentMethod;
};

export type SalePayment = PaymentSplit;

/** Frozen sale-time recipe evidence; parent line alone carries revenue. */
export type BundleSaleSnapshot={
  bundleRevision:number;
  components:readonly {
    productId:string;
    name:string;
    sku:string;
    baseQtyPerSet:number;
    totalBaseQty:number;
    unit:string;
    unitFactorAtSale:number;
    /** Only populated by a real posted allocation; never invented in UI preview. */
    lotAllocations?:readonly {lotId:string;quantity:number}[];
    serials?:readonly string[];
    unitCost?:number|null;
    /** Historical source provenance, only if written by genuine posting. */
    stockSource?:SaleStockSource;
  }[];
};
export type SaleLine = {
  id: string;
  productId: string;
  name: string;
  /** Human-friendly sold quantity, e.g. "3 Box 2 Pcs". */
  quantity: string;
  /** Base unit used for return/refund calculations. */
  unit: string;
  /** Exact quantity available to return in the base unit. */
  returnableQuantity?: number;
  /** Immutable original base quantity; required for historical compound-unit refund allocation. */
  soldBaseQuantity?: number;
  /** Frozen unit names, factors and prices: never reconstruct posted quantities from edited product data. */
  unitSnapshot?: {baseUnit:string;factors:Record<string,number>;purchasePrices:Record<string,number>;sellingPrices:Record<string,number>};
  unitQuantities?: Record<string,string>;
  price: number;
  total: number;
  /** Historical cost per base unit at the time of sale. */
  unitCost?: number;
  serials?: string[];
  warranty?: WarrantySnapshot;
  lotAllocations?: Array<{ lotId: string; quantity: number }>;
  bundleSnapshot?:BundleSaleSnapshot;
  /** Frozen net revenue allocated to this parent after invoice discounts/rounding. */
  netSaleTotal?:number;
  /** How quantity beyond own sellable stock was fulfilled. Vendor unitCost is per base unit. */
  stockSource?: SaleStockSource;
};

export type SalesInvoiceStatus = 'Paid' | 'Partial' | 'Due' | 'Part returned' | 'Returned';

export type SalesInvoice = Sale & {
  documentSnapshot?: import("../components/brand/ReceiptPreview").ReceiptPreviewProps;
  documentHistory?: import("../components/brand/ReceiptPreview").ReceiptPreviewProps[];
  presentationAudit?: {actor:string;at:string;fields:string[]}[];
  partyId?: string;
  phone?: string;
  guardianName?: string;
  address?: string;
  lines: SaleLine[];
  subtotal: number;
  discount: number;
  rounding: number;
  due: number;
  status: SalesInvoiceStatus;
  payments: SalePayment[];
  salesperson: string;
  note?: string;
};

export type SalesReturn = TransactionAuditFields & {
  id: string;
  date: string;
  customer: string;
  customerId?: string;
  invoices: string[];
  items: string;
  amount: number;
  settlement: 'Adjust due' | 'Customer credit' | 'Cash refund';
  refundMethod?: Exclude<PaymentMethod, 'Customer Credit'>;
  refundAccount?: string;
  /** Source-linked ordinary return allocations in the UI preview; never stock postings. */
  lineReturns?: Array<{invoiceId:string;lineId:string;quantity:number;amount:number;serials:string[]}>;
  bundleReturns?:Array<{returnId:string;invoiceId:string;lineId:string;sets:number;serials?:Record<string,string[]>}>;
};

export type SalePresetLine = {
  productId: string;
  /** Pin package drafts to the recipe chosen when it was saved. */
  bundleRevision?:number;
  bundleRecipeSignature?:string;
  bundleSources?:Record<string,SaleStockSource>;
  bundleSerials?:Record<string,string[]>;
  qty: string;
  secondaryQty?: string;
  unitQuantities?: Record<string,string>;
  unitSnapshot?: {baseUnit:string;factors:Record<string,number>;purchasePrices:Record<string,number>;sellingPrices:Record<string,number>};
  unit: string;
  price: number;
  serials?: string[];
  stockSource?: SaleStockSource;
};

export type SaleTemplate = {
  id: string;
  name: string;
  customer?: string;
  customerId?: string;
  items: number;
  total: number;
  lastUsed: string;
  lines: SalePresetLine[];
};

export type CustomerCredit = {
  id: string;
  customerId?: string;
  customer: string;
  balance: number;
  source: string;
  updatedAt: string;
};

export type PurchaseInventoryLine = {
  productId: string;
  quantity: number;
  unitCost?: number;
  /** Base-unit lot selling price snapshot; does not overwrite master product selling price. */
  lotSellingPrice?: number;
  serials?: string[];
  batchNumber?: string;
  manufactureDate?: string;
  expiryDate?: string;
};

export type Purchase = TransactionAuditFields & {
  id: string;
  ref: string;
  date: string;
  supplierId: string;
  supplier: string;
  items: string;
  subtotal?: number;
  discount?: number;
  rounding?: number;
  total: number;
  paid: number;
  payments?: PaymentSplit[];
  receipt?: string;
  inventoryLines?: PurchaseInventoryLine[];
  /** Entered units/prices retained for source editing; never reconstruct from current master data. */
  cartSnapshot?: {id:string;product:Product;bigQty:string;smallQty:string;unitQuantities?:Record<string,string>;cost:string;costUnit:string;lotSellPrice:string;lotSellUnit:string;detailsOpen:boolean;serialText:string;batchNumber:string;manufactureDate:string;expiryDate:string}[];
  businessDate?: string;
  roundingRule?: "Nearest ৳5" | "Nearest ৳1" | "No rounding";
  sourceRevision?: number;
  memoNo?: string;
  notes?: string;
  backdateReason?: string;
};

export type Expense = TransactionAuditFields & {
  id: string;
  ref: string;
  date: string;
  category: string;
  payee: string;
  payeeId?: string;
  note: string;
  amount: number;
  paid: number;
  method: PaymentMethod;
  payments?: PaymentSplit[];
  receipt?: string;
  backdateReason?: string;
};

export type DashboardWidgetId =
'today-sales' |
'receivable' |
'payable' |
'cash' |
'gross-profit' |
'low-stock' |
'sales-trend' |
'cashflow' |
'recent-sales' |
'dues';

export type DashboardWidget = {
  id: DashboardWidgetId;
  label: string;
  labelBn: string;
  kind: 'metric' | 'panel';
  visible: boolean;
};

export type WarrantyStatus =
  | 'Received'
  | 'Checking'
  | 'Sent to supplier'
  | 'Waiting supplier'
  | 'Received from supplier'
  | 'Ready for customer'
  | 'Resolved'
  | 'Rejected';

export type WarrantyRoute = 'In-house' | 'Supplier' | 'Manufacturer';

export type WarrantyEvent = {
  id: string;
  date: string;
  title: string;
  note?: string;
};

export type WarrantyReplacement = {
  product: string;
  serial?: string;
  givenAt: string;
  returnedAt?: string;
};

export type WarrantyCase = {
  id: string;
  receivedAt: string;
  customer: string;
  customerId?: string;
  phone?: string;
  invoice: string;
  productId: string;
  product: string;
  serial?: string;
  issue: string;
  status: WarrantyStatus;
  route: WarrantyRoute;
  supplier?: string;
  supplierRef?: string;
  expectedDate?: string;
  resolution?: 'Repair' | 'Replace' | 'Refund' | 'Rejected';
  finalReplacement?: {
    product: string;
    serial?: string;
  };
  replacement?: WarrantyReplacement;
  note?: string;
  events: WarrantyEvent[];
};


export type ReconciliationAccount = {
  id: string;
  name: string;
  type: 'Bank' | 'Mobile Banking' | 'Cash';
  balance: number;
  detail?: string;
};

export type ReconciliationStatus = 'Matched' | 'Review' | 'Unmatched' | 'Ignored';

export type StatementTransaction = {
  id: string;
  accountId: string;
  date: string;
  description: string;
  reference?: string;
  amount: number;
  direction: 'in' | 'out';
  status: ReconciliationStatus;
  suggestedErpId?: string;
  matchedErpId?: string;
  confidence?: number;
};

export type ErpReconciliationTransaction = {
  id: string;
  accountId: string;
  date: string;
  type: 'Sale payment' | 'Purchase payment' | 'Expense' | 'Transfer' | 'Customer payment' | 'Other';
  party: string;
  partyId?: string;
  reference: string;
  amount: number;
  direction: 'in' | 'out';
};

export type ReconciliationHistory = {
  id: string;
  accountId: string;
  accountName: string;
  period: string;
  statementFile: string;
  statementClosing: number;
  erpClosing: number;
  matched: number;
  review: number;
  status: 'Completed' | 'In progress';
};
