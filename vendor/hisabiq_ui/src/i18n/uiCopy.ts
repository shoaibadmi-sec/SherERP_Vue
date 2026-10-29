import type { PersonalSettings } from '../settings/model';

/** Labels only: never translate persisted values, payment methods or posting identifiers. */
export type UiLanguage = PersonalSettings['language'];
export const uiGlossary = {
  product: ['Product', 'পণ্য'],
  products: ['Products', 'পণ্য'],
  quantity: ['Quantity', 'পরিমাণ'],
  qty: ['Qty', 'পরিমাণ'],
  priceIn: ['Price in', 'দামের একক'],
  price: ['Price', 'দাম'],
  total: ['Total', 'মোট'],
  unit: ['Unit', 'একক'],
  remove: ['Remove', 'সরান'],
  cost: ['Cost', 'কেনা দাম'],
  stock: ['Stock', 'স্টক'],
  sellable: ['Sellable', 'বিক্রিযোগ্য'],
  service: ['Service', 'সেবা'],
  serials: ['Serials', 'সিরিয়াল'],
  short: ['Short', 'ঘাটতি'],
  chooseSource: ['choose source', 'পণ্যের উৎস বাছুন'],
  negativeSale: ['Negative sale', 'ঋণাত্মক স্টক বিক্রি'],
  pricePending: ['Price pending', 'দাম ঠিক করা বাকি'],
  cartEmpty: ['Cart is empty. Search above or tap a quick item below.', 'কার্ট খালি। উপরে খুঁজে বা নিচের পণ্য বেছে যোগ করুন।'],
  clear: ['Clear', 'খালি করুন'],
  discount: ['Discount', 'ছাড়'],
  discountApplied: ['Discount applied', 'ছাড় দেওয়া হয়েছে'],
  rounding: ['Rounding (to ৳5)', 'রাউন্ডিং (৳৫ অনুযায়ী)'],
  totalPayable: ['Total payable', 'মোট দিতে হবে'],
  payments: ['Payments', 'পেমেন্ট'],
  paymentHint: ['Use one or multiple sources.', 'এক বা একাধিক মাধ্যমে টাকা নিতে পারবেন।'],
  add: ['Add', 'যোগ করুন'],
  remaining: ['Remaining', 'বাকি টাকা'],
  exact: ['Exact', 'পুরো টাকা'],
  paid: ['Paid', 'জমা'],
  due: ['Due', 'বাকি'],
  changeToReturn: ['Change to return', 'ফেরত টাকা'],
  completeSale: ['Complete sale', 'বিক্রি সম্পন্ন করুন'],
  invoiceCustomer: ['Invoice customer details', 'বিলের ক্রেতার তথ্য'],
  customerName: ['Customer name', 'ক্রেতার নাম'],
  phone: ['Phone', 'ফোন'],
  customerPhone: ['Customer phone', 'ক্রেতার ফোন'],
  guardianName: ['Guardian name', 'পিতা/অভিভাবকের নাম'],
  address: ['Address', 'ঠিকানা'],
  customerAddress: ['Customer address', 'ক্রেতার ঠিকানা'],
  customerOptional: ['Fully paid walk-in sales can keep these as invoice-only details; no customer account is required.', 'সম্পূর্ণ টাকা পেলে ক্রেতার নামে আলাদা হিসাব না খুলেও বিল করতে পারবেন।'],
  walkIn: ['Walk-in customer', 'সাধারণ ক্রেতা'],
  prevDue: ['Prev. due', 'আগের বাকি'],
  cashCustomerOptional: ['Cash sale · customer optional', 'ক্যাশ বিক্রি · ক্রেতার নাম ঐচ্ছিক'],
  chooseCustomer: ['Choose customer', 'ক্রেতা বাছুন'],
  clearCustomer: ['Clear customer', 'ক্রেতা সরান'],
  searchCustomer: ['Search customer or phone…', 'ক্রেতার নাম বা ফোন খুঁজুন…'],
  customerReceive: ['Customer Receive', 'ক্রেতার টাকা নিন'],
  supplierPay: ['Supplier Pay', 'সরবরাহকারীকে টাকা দিন'],
  expense: ['Expense', 'খরচ'],
  bankTransfer: ['Bank Transfer', 'টাকা স্থানান্তর'],
  customerMoney: ['Customer money', 'ক্রেতার টাকা'],
  supplierPayment: ['Supplier payment', 'সরবরাহকারীর পাওনা'],
  quickExpense: ['Quick expense', 'দ্রুত খরচ'],
  betweenAccounts: ['Between accounts', 'হিসাবের মধ্যে'],
  findCustomer: ['Find customer', 'ক্রেতা খুঁজুন'],
  findSupplier: ['Find supplier', 'সরবরাহকারী খুঁজুন'],
  currentBalance: ['Current balance', 'বর্তমান জের'],
  outstandingDue: ['Outstanding due', 'মোট বাকি'],
  availableCredit: ['Available credit', 'অগ্রিম জমা'],
} as const;
export type UiCopyKey = keyof typeof uiGlossary;

/** Bilingual mode retains existing English primary labels and Bangla helper slots. */
export function uiText(language: UiLanguage, english: string, bangla: string): string {
  return language === 'Bangla' ? bangla : english;
}
export function uiWord(language: UiLanguage, key: UiCopyKey): string {
  const entry = uiGlossary[key];
  return uiText(language, entry[0], entry[1]);
}
export function showBanglaHelper(language: UiLanguage): boolean {
  return language === 'English + Bangla';
}
