import {uiText,type UiLanguage} from './uiCopy.ts';

/** Purchase presentation only. Stored supplier, settlement, payment, source and CSV values stay untouched. */
const bangla:Record<string,string> = {
  "Purchases": "কেনাকাটা",
  "Purchase list & management": "ক্রয়ের তালিকা ও কাজ",
  "Reset filters": "ফিল্টার মুছুন",
  "Search purchases": "কেনাকাটা খুঁজুন",
  "Purchase supplier filter": "সরবরাহকারী বাছুন",
  "Purchase status filter": "ক্রয়ের অবস্থা বাছুন",
  "View receipt": "রসিদ দেখুন",
  "Actions for": "কাজ:",
  "Complete original snapshots and no later allocations required": "আগের বিলের পুরো তথ্য থাকতে হবে এবং পরে কোনো টাকা সমন্বয় হওয়া চলবে না",
  "Payment needs a complete source bill with supplier due": "সরবরাহকারীর বাকি আছে এমন পূর্ণ তথ্যের বিল লাগবে",
  "Enter the purchase reference or supplier name.": "ক্রয় নম্বর বা সরবরাহকারীর নাম লিখুন।",
  "No purchase found. Check the reference.": "ক্রয় পাওয়া যায়নি। নম্বর মিলিয়ে দেখুন।",
  "Several purchases match. Enter the exact purchase reference.": "একাধিক ক্রয় মিলেছে। সঠিক ক্রয় নম্বর লিখুন।",
  "PUR-000117 or supplier name": "PUR-000117 অথবা সরবরাহকারীর নাম",
  "Find purchase": "ক্রয় খুঁজুন",
  "Purchase return source": "ফেরতের মূল ক্রয়",
  "Enter a purchase reference to review its source. Never calculate a refund from a bill summary.": "আগের ক্রয় নম্বর লিখুন। শুধু বিলের সারাংশ দেখে ফেরত টাকা হিসাব করবেন না।",
  "Source review": "মূল তথ্য যাচাই",
  "Bill total": "বিলের মোট",
  "Paid": "পরিশোধ",
  "Due": "দেনা",
  "Purchase source item snapshots": "আগের ক্রয়ের পণ্যের তথ্য",
  "Original item snapshots": "আগের পণ্যের তথ্য",
  "base units": "মূল একক",
  "Cost": "কেনা দাম",
  "not available": "পাওয়া যায়নি",
  "per base unit": "প্রতি মূল একক",
  "Choose return quantities": "ফেরতের পরিমাণ বাছুন",
  "Return quantities unavailable · ফেরতযোগ্য পরিমাণ নেই": "ফেরত দেওয়ার পরিমাণ জানা নেই",
  "Check the original bill and previous returns first. Summary-only bills and tracked-stock returns need verified original units, serials/batches and allocation data from integration.": "আগের বিল ও আগের ফেরত মিলিয়ে দেখুন। আসল একক, সিরিয়াল, ব্যাচ ও হিসাব নিশ্চিত না হলে ফেরত করা যাবে না।",
  "No return, refund or supplier credit has been recorded.": "এখনও পণ্য ফেরত, টাকা ফেরত বা সরবরাহকারীর জমা রেকর্ড হয়নি।",
  "Choose another purchase": "অন্য ক্রয় বাছুন",
  "View original bill": "আগের বিল দেখুন",
  "Purchase return history": "ক্রয় ফেরতের ইতিহাস",
  "Preview and sample history · refunds and source purchases. Not live accounting records.": "ফেরতের নমুনা ও আগের ক্রয়ের তথ্য। এগুলো আসল হিসাবের রেকর্ড নয়।",
  "Export": "ডাউনলোড",
  "Return": "ফেরত",
  "Returned items": "ফেরত পণ্য",
  "Refund method": "ফেরতের মাধ্যম",
  "Amount": "টাকা",
  "Supplier credit": "সরবরাহকারীর জমা",
  "Cash refund": "ক্যাশে ফেরত",
  "Refund": "ফেরত টাকা",
  "Purchase source history": "ক্রয়ের পরিবর্তনের ইতিহাস",
  "Source history": "পরিবর্তনের ইতিহাস",
  "UI preview source changes; backend posting is not connected.": "এটি শুধু প্রিভিউ। সার্ভারের আসল হিসাবে পরিবর্তন হয়নি।",
  "Returns": "ফেরত",
  "No changes recorded in this preview.": "এই প্রিভিউতে কোনো পরিবর্তন নেই।",
  "Close history": "ইতিহাস বন্ধ করুন",
  "correction": "সংশোধন",
  "payment": "পেমেন্ট",
  "return": "ফেরত",
  "cash": "ক্যাশ",
  "supplier-credit": "সরবরাহকারীর জমা",
  "All suppliers": "সব সরবরাহকারী",
  "All status": "সব অবস্থা",
  "Paid status": "পরিশোধ",
  "Partial": "আংশিক",
  "Due status": "বাকি"
};

export function purchaseLabel(language:UiLanguage,english:string):string {
  return uiText(language,english,bangla[english]??english);
}
/** Return-history memos may contain a source-computed refund amount: retain amount and raw method. */
export function purchaseReturnMethod(language:UiLanguage,method:string):string {
  if (method.startsWith('Refund ')) return purchaseLabel(language,'Refund')+' '+method.slice('Refund '.length);
  return purchaseLabel(language,method);
}
