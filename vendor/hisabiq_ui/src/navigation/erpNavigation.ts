import type {LucideIcon} from 'lucide-react';
import {LayoutDashboard,ShoppingCart,HandCoins,FileText,ReceiptText,Store,Package,Users,Wallet,Landmark,ShieldCheck,PieChart,Settings} from 'lucide-react';

export type ErpNavChild={id:string;label:string;bn?:string;path:string;feature?:string;permission?:string};
export type ErpNavGroup={id:string;label:string;bn?:string;icon:LucideIcon;landingPath:string;children?:readonly ErpNavChild[];permission?:string};

/** Current App.tsx paths, not replacements. Child query values select existing in-module views. */
export const erpNavigation:readonly ErpNavGroup[]=[
 {id:'dashboard',label:'Dashboard',bn:'ড্যাশবোর্ড',icon:LayoutDashboard,landingPath:'/app/dashboard'},
 {id:'pos',label:'POS / New Sale',bn:'নতুন বিক্রি',icon:ShoppingCart,landingPath:'/app/pos'},
 {id:'counter',label:'Counter',bn:'কাউন্টার',icon:HandCoins,landingPath:'/app/counter'},
 {id:'sales',label:'Sales',bn:'বিক্রয়',icon:FileText,landingPath:'/app/sales',children:[
  {id:'sales-history',label:'Sales History',bn:'বিক্রয় তালিকা',path:'/app/sales'},
  {id:'quotations',label:'Quotations & Estimates',bn:'মূল্য প্রস্তাব',path:'/app/quotations',feature:'quotations'},
  {id:'online-sales',label:'Online Sales & Orders',bn:'অনলাইন অর্ডার',path:'/app/online-sales',feature:'online-sales'},
  {id:'sales-return',label:'Sales Returns',bn:'বিক্রয় ফেরত',path:'/app/sales?tab=return'},
  {id:'sales-drafts',label:'Sale Drafts',bn:'ড্রাফট বিক্রি',path:'/app/sales?tab=drafts'}
 ]},
 {id:'purchases',label:'Purchases',bn:'ক্রয়',icon:ReceiptText,landingPath:'/app/purchases',children:[
  {id:'purchase-bills',label:'Purchase Bills',bn:'ক্রয় বিল',path:'/app/purchases'},
  {id:'purchase-returns',label:'Purchase Returns',bn:'ক্রয় ফেরত',path:'/app/purchases?tab=return'}
 ]},
 {id:'vendor',label:'Vendor',bn:'ভেন্ডর লেনদেন',icon:Store,landingPath:'/app/vendors'},
 {id:'products',label:'Products & Stock',bn:'পণ্য ও মজুত',icon:Package,landingPath:'/app/products',children:[
  {id:'product-list',label:'Product List',bn:'পণ্যের তালিকা',path:'/app/products'},
  {id:'stock',label:'Stock, Lots & Adjustments',bn:'মজুত ও লট',path:'/app/products?view=lots'},
  {id:'product-settings',label:'Product Settings',bn:'পণ্যের সেটিংস',path:'/app/products?view=settings'}
 ]},
 {id:'parties',label:'Parties & Ledger',bn:'পার্টি ও খাতা',icon:Users,landingPath:'/app/parties',children:[
  {id:'all-parties',label:'All Parties',bn:'সকল পার্টি',path:'/app/parties'},
  {id:'customers',label:'Customers',bn:'ক্রেতা',path:'/app/parties?role=Customer'},
  {id:'suppliers',label:'Suppliers',bn:'সরবরাহকারী',path:'/app/parties?role=Supplier'},
  {id:'vendors',label:'Vendors',bn:'ভেন্ডর',path:'/app/parties?role=Vendor'},
  {id:'loans',label:'Lenders & Borrowers',bn:'ঋণদাতা ও ঋণগ্রহীতা',path:'/app/parties?group=loans'},
  {id:'owners',label:'Owners & Payees',bn:'মালিক ও প্রাপক',path:'/app/parties?group=owners'}
 ]},
 {id:'expenses',label:'Expenses',bn:'খরচ',icon:Wallet,landingPath:'/app/expenses'},
 {id:'finance',label:'Finance & Accounts',bn:'হিসাব ও অর্থ',icon:Landmark,landingPath:'/app/finance',children:[
  {id:'cash',label:'Cash, Bank & MFS',bn:'নগদ, ব্যাংক, মোবাইল',path:'/app/finance'},
  {id:'accounts',label:'Accounts & Vouchers',bn:'হিসাব ও ভাউচার',path:'/app/accounts'},
  {id:'daybook',label:'Daybook',bn:'দৈনিক লেনদেন',path:'/app/daybook'},
  {id:'reconciliation',label:'Reconciliation',bn:'হিসাব মিলানো',path:'/app/reconciliation'},
  {id:'audit',label:'Audit Ledger',bn:'অডিট খাতা',path:'/app/audit-ledger',permission:'money'}
 ]},
 {id:'warranty',label:'Warranty',bn:'ওয়ারেন্টি',icon:ShieldCheck,landingPath:'/app/warranty'},
 {id:'reports',label:'Reports',bn:'রিপোর্ট',icon:PieChart,landingPath:'/app/reports'},
 {id:'settings',label:'Settings',bn:'সেটিংস',icon:Settings,landingPath:'/app/settings/business',children:[
  {id:'general',label:'Business & General',bn:'ব্যবসার তথ্য',path:'/app/settings/business'},
  {id:'users',label:'Users & Roles',bn:'ব্যবহারকারী ও ভূমিকা',path:'/app/settings/team',permission:'team'},
  {id:'notifications',label:'Notifications & SMS',bn:'এসএমএস ও বার্তা',path:'/app/notifications',feature:'notifications',permission:'notifications'},
  {id:'data',label:'Data Import / Export',bn:'ডেটা আমদানি/রপ্তানি',path:'/app/settings/data',permission:'export'},
  {id:'subscription',label:'Subscription & Billing',bn:'সাবস্ক্রিপশন',path:'/app/subscription',permission:'owner'},
  {id:'appearance',label:'Appearance & Defaults',bn:'থিম ও পছন্দ',path:'/app/settings/personal'},
  {id:'security',label:'Account & Security',bn:'অ্যাকাউন্ট ও নিরাপত্তা',path:'/app/settings/security'}
 ]}
];
/** Verified in App.tsx of the source branch. Query-driven children share these same route paths. */
export const erpRoutePaths=new Set([
 '/app/dashboard','/app/pos','/app/counter','/app/sales','/app/quotations','/app/online-sales',
 '/app/purchases','/app/purchases/new','/app/vendors','/app/products','/app/parties','/app/expenses',
 '/app/finance','/app/accounts','/app/daybook','/app/reconciliation','/app/audit-ledger',
 '/app/warranty','/app/reports','/app/settings/business','/app/settings/team',
 '/app/settings/data','/app/settings/personal','/app/settings/security','/app/notifications','/app/subscription',
 '/app/support'
]);
export const erpFeatureIds=new Set(['quotations','online-sales','notifications']);
