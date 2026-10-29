import {uiText, type UiLanguage} from './uiCopy.ts';

/** Presentation-only document terminology. Never translate record or CSV field values. */
const terms: Record<string, string> = {
  Customer: 'ক্রেতা',
  Invoice:'চালান', Quantity:'পরিমাণ', Rate:'দর',Item:'পণ্য', Revenue:'আয়',Expense:'ব্যয়',Profit:'লাভ',Stock:'মজুত', 'Stock statement':'মজুতের বিবরণ',
  'Walk-in': 'সাধারণ ক্রেতা',
  Phone: 'ফোন',
  Guardian: 'অভিভাবক',
  Address: 'ঠিকানা',
  Serial: 'সিরিয়াল',
  Warranty: 'ওয়ারেন্টি',
  Days:'দিন', Months:'মাস', Years:'বছর', Seller:'বিক্রেতা', Manufacturer:'প্রস্তুতকারক', Service:'সার্ভিস', Replacement:'পরিবর্তন',
  Subtotal: 'পণ্যের মোট',
  Discount: 'ছাড়',
  Rounding: 'রাউন্ডিং',
  Total: 'মোট',
  Paid: 'পরিশোধ',
  Received: 'জমা',
  Due: 'বাকি',
  Multiple: 'একাধিক',
  'Cash refund': 'ক্যাশ ফেরত',
  'Customer credit': 'ক্রেতার অগ্রিম জমা',
  'Supplier credit': 'সরবরাহকারীর কাছে জমা',
  'Adjust due': 'বাকি কমান',
  'Active': 'চালু',
  'Cancelled': 'বাতিল',
  'Posted': 'লেখা হয়েছে',
  'Draft': 'খসড়া',
  'Deleted': 'মুছে ফেলা',
  'Reversed': 'উল্টো হিসাব',
  'Partial': 'আংশিক',
  'Returned': 'ফেরত',
  'Part returned': 'আংশিক ফেরত',
  Cash: 'ক্যাশ',
  'Customer Credit': 'ক্রেতার অগ্রিম জমা',
  Bank: 'ব্যাংক',
  'Mobile Banking': 'মোবাইল ব্যাংকিং',
  Card: 'কার্ড',
  'Money in': 'টাকা এসেছে',
  'Money out': 'টাকা গেছে',
  'Account ledger':'হিসাবের খাতা',
  Date: 'তারিখ',
  Type: 'ধরন',
  Reference: 'রেফারেন্স',
  Party: 'পক্ষ',
  Details: 'বিবরণ',
  Account: 'হিসাব',
  'Posted by': 'যিনি লিখেছেন',
  Status: 'অবস্থা',
  Field: 'বিবরণ',
  Value: 'মান',
  Supplier: 'সরবরাহকারী',
  Items: 'পণ্য',
  'Original invoices': 'মূল বিলগুলো',
  'Return amount': 'ফেরত পণ্যের দাম',
  Settlement: 'সমন্বয়',
  'Refund method': 'ফেরত টাকার মাধ্যম',
  'Refund account': 'ফেরত টাকার হিসাব',
  'Sales return source preview': 'বিক্রি ফেরতের প্রিভিউ',
  'Purchase bill preview': 'ক্রয় বিলের প্রিভিউ',
  'Expense source preview': 'খরচের প্রিভিউ',
  'Cancelled expense preview': 'বাতিল খরচের প্রিভিউ',
  'Bill preview': 'বিলের প্রিভিউ',
  'Created date': 'লেখার তারিখ',
  'Transaction date': 'লেনদেনের তারিখ',
  'All dates': 'সব তারিখ',
  'Day Book': 'দৈনিক লেনদেন',
  'Audit Ledger': 'হিসাব যাচাই',
  'Last changed by': 'শেষ সংশোধনকারী',
  'Source': 'উৎস',
  'Amount': 'টাকার পরিমাণ',
  'Debit': 'ডেবিট',
  'Credit': 'ক্রেডিট',
  'Code': 'কোড',
  'Group': 'শ্রেণি',
  'Balance': 'জের',
  'Transaction': 'লেনদেন',
  'Accounting posting': 'হিসাবের এন্ট্রি',
  'No entries in this selection.': 'এই সময়ে কোনো হিসাব নেই।',
  'Loan': 'ঋণ',
  'Payable': 'দেনা',
  'Receivable': 'পাওনা',
  'No transactions in this selection.': 'বাছা সময়ে কোনো লেনদেন নেই।',
  'HisabIQ UI preview · verify source records before sharing.': 'HisabIQ শুধু প্রিভিউ · শেয়ার করার আগে আসল হিসাব মিলিয়ে নিন।',
  'HisabIQ UI preview': 'HisabIQ · শুধু প্রিভিউ',
};

export function documentLabel(language: UiLanguage, english: string): string {
  return uiText(language, english, terms[english] ?? english);
}
export function printDocumentLanguage(language: UiLanguage): 'bn' | 'en' {
  return language === 'Bangla' ? 'bn' : 'en';
}
export function documentMethod(language: UiLanguage, method: string): string {
  return documentLabel(language, method);
}

export function documentHeading(language:UiLanguage,heading:string):string{
 const canonical=Object.keys(terms).find(key=>heading===key||heading===terms[key]||heading===`${key} · ${terms[key]}`)??heading;
 return documentLabel(language,canonical);
}
