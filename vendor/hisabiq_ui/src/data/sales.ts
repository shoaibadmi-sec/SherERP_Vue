import type { CustomerCredit, PaymentSplit, Sale, SalePresetLine, SalesInvoice, SalesReturn, SaleTemplate } from '../types/erp';
import type {InstallmentScheduleRow} from '../installments/schedule';

export const salesInvoices: SalesInvoice[] = [
  {
    id: 's241',
    invoice: 'INV-000241',
    date: '01 Oct 2026',
    time: '11:42 AM',
    party: 'Rahman Hardware',
    partyId: 'c1',
    phone: '01711-482093',
    guardianName: 'Md. Habib',
    address: '142 Nawabpur Road, Dhaka',
    items: 2,
    subtotal: 25550,
    discount: 0,
    rounding: 0,
    total: 25550,
    paid: 0,
    due: 25550,
    method: 'Cash',
    status: 'Due',
    payments: [],
    salesperson: 'Anis',
    note: 'Payment promised before 10 Oct.',
    lines: [
      { id: 'sl241-1', productId: 'p3', name: 'MS Angle 1.5" × 1.5"', quantity: '220', unit: 'Kg', returnableQuantity: 220, soldBaseQuantity: 220, price: 112, total: 24640 },
      { id: 'sl241-2', productId: 'p9', name: 'Teflon Tape', quantity: '3 Box 6 Pcs', unit: 'Pcs', returnableQuantity: 42, soldBaseQuantity: 42, price: 25, total: 910 }
    ]
  },
  {
    id: 's240',
    invoice: 'INV-000240',
    date: '01 Oct 2026',
    time: '11:05 AM',
    party: 'Walk-in customer',
    items: 3,
    subtotal: 1845,
    discount: 5,
    rounding: 0,
    total: 1840,
    paid: 1840,
    due: 0,
    method: 'Cash',
    status: 'Paid',
    payments: [{ id: 'pay240-1', method: 'Cash', amount: 1840 }],
    salesperson: 'Anis',
    lines: [
      { id: 'sl240-1', productId: 'p7', name: 'Gate Valve ¾"', quantity: '2', unit: 'Pcs', returnableQuantity: 2, soldBaseQuantity: 2, price: 650, total: 1300 },
      { id: 'sl240-2', productId: 'p10', name: 'Paint Brush 2"', quantity: '4', unit: 'Pcs', returnableQuantity: 4, soldBaseQuantity: 4, price: 60, total: 240 },
      { id: 'sl240-3', productId: 'p9', name: 'Teflon Tape', quantity: '12', unit: 'Pcs', returnableQuantity: 12, soldBaseQuantity: 12, price: 25, total: 300 }
    ]
  },
  {
    id: 's239',
    invoice: 'INV-000239',
    date: '01 Oct 2026',
    time: '10:31 AM',
    party: 'Nur Enterprise',
    partyId: 'c4',
    phone: '01815-660372',
    address: 'Keraniganj',
    items: 5,
    subtotal: 9620,
    discount: 0,
    rounding: 0,
    total: 9620,
    paid: 6000,
    due: 3620,
    method: 'bKash',
    status: 'Partial',
    payments: [
      { id: 'pay239-1', method: 'bKash', amount: 4000, account: 'Merchant 01811-000111' },
      { id: 'pay239-2', method: 'Cash', amount: 2000 }
    ],
    salesperson: 'Rafiq',
    lines: [
      { id: 'sl239-1', productId: 'p2', name: 'LED Bulb 12W', quantity: '3 Box 2 Pcs', unit: 'Pcs', returnableQuantity: 32, soldBaseQuantity: 32, price: 165, total: 5280 },
      { id: 'sl239-2', productId: 'p4', name: 'Electric Wire 1.5 rm', quantity: '1', unit: 'Coil', returnableQuantity: 1, soldBaseQuantity: 1, price: 2850, total: 2850 },
      { id: 'sl239-3', productId: 'p10', name: 'Paint Brush 2"', quantity: '1 Dozen', unit: 'Pcs', returnableQuantity: 12, soldBaseQuantity: 12, price: 55, total: 660 },
      { id: 'sl239-4', productId: 'p9', name: 'Teflon Tape', quantity: '1 Box', unit: 'Pcs', returnableQuantity: 12, soldBaseQuantity: 12, price: 23, total: 276 },
      { id: 'sl239-5', productId: 'p11', name: 'Door Hinge 4" (Pair)', quantity: '6', unit: 'Pair', returnableQuantity: 6, soldBaseQuantity: 6, price: 92.33, total: 554 }
    ]
  },
  {
    id: 's238',
    invoice: 'INV-000238',
    date: '01 Oct 2026',
    time: '09:15 AM',
    party: 'Hossain Electric',
    partyId: 'c2',
    phone: '01912-774310',
    address: 'Stadium Market, Dhaka',
    items: 1,
    subtotal: 3450,
    discount: 0,
    rounding: 0,
    total: 3450,
    paid: 0,
    due: 3450,
    method: 'Cash',
    status: 'Part returned',
    payments: [],
    salesperson: 'Anis',
    lines: [
      { id: 'sl238-1', productId: 'p2', name: 'LED Bulb 12W', quantity: '2 Box', unit: 'Pcs', returnableQuantity: 20, soldBaseQuantity: 20, price: 172.5, total: 3450, serials: ['LB12-3001', 'LB12-3002'], warranty: { duration: 2, durationUnit: 'Years', type: 'Manufacturer', terms: 'Original invoice required. Physical damage is not covered.' } }
    ]
  },
  {
    id: 's237',
    invoice: 'INV-000237',
    date: '30 Sep 2026',
    time: '06:48 PM',
    party: 'Walk-in customer',
    items: 2,
    subtotal: 685,
    discount: 0,
    rounding: 0,
    total: 685,
    paid: 685,
    due: 0,
    method: 'Cash',
    status: 'Paid',
    payments: [{ id: 'pay237-1', method: 'Cash', amount: 685 }],
    salesperson: 'Rafiq',
    lines: [
      { id: 'sl237-1', productId: 'p10', name: 'Paint Brush 2"', quantity: '6', unit: 'Pcs', returnableQuantity: 6, soldBaseQuantity: 6, price: 60, total: 360 },
      { id: 'sl237-2', productId: 'p7', name: 'Gate Valve ¾"', quantity: '0.5', unit: 'Pcs', returnableQuantity: 0.5, soldBaseQuantity: 0.5, price: 650, total: 325 }
    ]
  },
  {
    id: 's236',
    invoice: 'INV-000236',
    date: '30 Sep 2026',
    time: '05:20 PM',
    party: 'Mim Construction',
    partyId: 'c3',
    phone: '01673-551920',
    address: 'Mirpur 10, Dhaka',
    items: 4,
    subtotal: 18200,
    discount: 0,
    rounding: 0,
    total: 18200,
    paid: 18200,
    due: 0,
    method: 'Bank',
    status: 'Paid',
    payments: [
      { id: 'pay236-1', method: 'Bank', amount: 15000, account: 'DBBL Current' },
      { id: 'pay236-2', method: 'Cash', amount: 3200 }
    ],
    salesperson: 'Anis',
    lines: [
      { id: 'sl236-1', productId: 'p8', name: 'Cement — Shah Special', quantity: '20', unit: 'Bag', returnableQuantity: 20, soldBaseQuantity: 20, price: 540, total: 10800 },
      { id: 'sl236-2', productId: 'p5', name: 'Wire Mesh Net 3 ft', quantity: '24 Gauge 8 Gira', unit: 'Gira', returnableQuantity: 392, soldBaseQuantity: 392, price: 12, total: 4704 },
      { id: 'sl236-3', productId: 'p7', name: 'Gate Valve ¾"', quantity: '3', unit: 'Pcs', returnableQuantity: 3, soldBaseQuantity: 3, price: 650, total: 1950 },
      { id: 'sl236-4', productId: 'p9', name: 'Teflon Tape', quantity: '3 Box', unit: 'Pcs', returnableQuantity: 36, soldBaseQuantity: 36, price: 20.72, total: 746 }
    ]
  },
  /** Illustrative historical invoice, not a real POS posting or stock movement. */
  {
    id:'sample-bundle-return',invoice:'INV-DEMO-BUNDLE',date:'17 Oct 2026',time:'10:00 AM',
    party:'Package Demo Customer',items:1,subtotal:7800,discount:200,rounding:0,total:7600,
    paid:7600,due:0,method:'Cash',status:'Paid',
    payments:[{id:'demo-bundle-cash',method:'Cash',amount:7600}],salesperson:'Preview',
    note:'SAMPLE DATA ONLY — a fictional posted bundle for return-preview testing. No inventory or financial posting occurred.',
    lines:[{
      id:'demo-bundle-line',productId:'demo-virtual-bundle',name:'Tubewell Package (DEMO)',quantity:'2 Set',
      unit:'Set',returnableQuantity:2,price:3900,total:7800,netSaleTotal:7600,
      bundleSnapshot:{bundleRevision:1,components:[
        {productId:'p1',name:'PVC Pipe 1" (20 ft)',sku:'PVC-DEMO',baseQtyPerSet:3,
         totalBaseQty:6,unit:'Pcs',unitFactorAtSale:1,
         lotAllocations:[{lotId:'lot-p1-opening',quantity:6}],unitCost:320},
        {productId:'p7',name:'Gate Valve ¾"',sku:'VALVE-DEMO',baseQtyPerSet:1,
         totalBaseQty:2,unit:'Pcs',unitFactorAtSale:1,
         serials:['GV34-1001','GV34-1002'],lotAllocations:[{lotId:'lot-p7-opening',quantity:2}],unitCost:510}
      ]}
    }]
  }
];

export const recentSales: Sale[] = salesInvoices.map(({ id, invoice, date, time, party, items, total, paid, method }) => ({
  id,
  invoice,
  date: date.replace(' 2026', ''),
  time,
  party,
  items,
  total,
  paid,
  method
}));

export type SalesDraft = {
  id: string;
  label: string;
  customer?: string;
  customerId?: string;
  discount?: string;
  discountMode?: 'amount'|'percent';
  customerDetails?: {
    name: string;
    phone: string;
    guardianName: string;
    address: string;
  };
  payments?: PaymentSplit[];
  items: number;
  total: number;
  savedAt: string;
  lines: SalePresetLine[];
  /** Saved preview terms only; no financial posting. */
  installment?: {count:number;firstDueDate:string;schedule:InstallmentScheduleRow[]};
};

export const salesDrafts: SalesDraft[] = [
  {
    id: 'd1', label: 'Draft #14', customer: 'Mim Construction', items: 6, total: 38405, savedAt: 'Today, 10:12 AM',
    lines: [
      { productId: 'p8', qty: '50', unit: 'Bag', price: 540 },
      { productId: 'p3', qty: '45', unit: 'Kg', price: 112 },
      { productId: 'p5', qty: '20', unit: 'Gauge', price: 180 },
      { productId: 'p7', qty: '3', unit: 'Pcs', price: 650 },
      { productId: 'p11', qty: '3', unit: 'Pair', price: 85 },
      { productId: 'p9', qty: '2', unit: 'Box', price: 280 }
    ]
  },
  {
    id: 'd2', label: 'Draft #15', items: 2, total: 1220, savedAt: 'Today, 11:20 AM',
    lines: [
      { productId: 'p10', qty: '1', unit: 'Dozen', price: 660 },
      { productId: 'p9', qty: '2', unit: 'Box', price: 280 }
    ]
  },
  {
    id: 'd3', label: 'Draft #16', customer: 'Rahman Hardware', items: 4, total: 12240, savedAt: 'Yesterday, 5:42 PM',
    lines: [
      { productId: 'p1', qty: '10', unit: 'Pcs', price: 420 },
      { productId: 'p7', qty: '4', unit: 'Pcs', price: 650 },
      { productId: 'p9', qty: '10', unit: 'Box', price: 280 },
      { productId: 'p10', qty: '4', unit: 'Dozen', price: 660 }
    ]
  }
];

export const saleTemplates: SaleTemplate[] = [
  {
    id: 't1', name: 'Monthly site supply', customer: 'Mim Construction', items: 7, total: 41505, lastUsed: '28 Sep 2026',
    lines: [
      { productId: 'p8', qty: '50', unit: 'Bag', price: 540 },
      { productId: 'p3', qty: '45', unit: 'Kg', price: 112 },
      { productId: 'p5', qty: '20', unit: 'Gauge', price: 180 },
      { productId: 'p7', qty: '3', unit: 'Pcs', price: 650 },
      { productId: 'p11', qty: '3', unit: 'Pair', price: 85 },
      { productId: 'p9', qty: '2', unit: 'Box', price: 280 },
      { productId: 'p2', qty: '2', unit: 'Box', price: 1550 }
    ]
  },
  {
    id: 't2', name: 'Electric shop restock', customer: 'Nur Enterprise', items: 5, total: 10030, lastUsed: '26 Sep 2026',
    lines: [
      { productId: 'p2', qty: '3', unit: 'Box', price: 1550 },
      { productId: 'p4', qty: '1', unit: 'Coil', price: 2850 },
      { productId: 'p10', qty: '2', unit: 'Dozen', price: 660 },
      { productId: 'p9', qty: '2', unit: 'Box', price: 280 },
      { productId: 'p7', qty: '1', unit: 'Pcs', price: 650 }
    ]
  },
  {
    id: 't3', name: 'Counter fast sale', items: 3, total: 1840, lastUsed: '01 Oct 2026',
    lines: [
      { productId: 'p7', qty: '2', unit: 'Pcs', price: 650 },
      { productId: 'p10', qty: '4', unit: 'Pcs', price: 60 },
      { productId: 'p9', qty: '12', unit: 'Pcs', price: 25 }
    ]
  }
];

export const salesReturns: SalesReturn[] = [
  {
    id: 'RTN-000014',
    date: '01 Oct 2026',
    customer: 'Hossain Electric',
    invoices: ['INV-000238'],
    items: 'LED Bulb 12W · 2 Pcs',
    amount: 345,
    settlement: 'Adjust due'
  },
  {
    id: 'RTN-000013',
    date: '29 Sep 2026',
    customer: 'Rahman Hardware',
    invoices: ['INV-000221', 'INV-000198'],
    items: 'Gate Valve ¾" · 2 Pcs, Teflon Tape · 1 Box',
    amount: 1580,
    settlement: 'Customer credit'
  },
  {
    id: 'RTN-000012',
    date: '24 Sep 2026',
    customer: 'Walk-in customer',
    invoices: ['INV-000210'],
    items: 'Paint Brush 2" · 1 Pcs',
    amount: 60,
    settlement: 'Cash refund'
  }
];


export const customerCredits: CustomerCredit[] = [
  { id: 'CR-000031', customerId: 'c1', customer: 'Rahman Hardware', balance: 1580, source: 'RTN-000013', updatedAt: '29 Sep 2026' },
  { id: 'CR-000030', customerId: 'c4', customer: 'Nur Enterprise', balance: 850, source: 'Advance payment', updatedAt: '27 Sep 2026' },
  { id: 'CR-000029', customerId: 'c3', customer: 'Mim Construction', balance: 2400, source: 'Overpayment', updatedAt: '24 Sep 2026' }
];
