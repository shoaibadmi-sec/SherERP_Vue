import { uiText, type UiLanguage } from './uiCopy.ts';

/** Display-only terminology: never use these translations as notification rule IDs or persisted values. */
const labels: Record<string, string> = {
  'All': 'সব',
  'Sales & customer': 'বিক্রি ও ক্রেতা',
  'Services & tailoring': 'সার্ভিস ও সেলাই',
  'Suppliers & purchases': 'সরবরাহকারী ও কেনাকাটা',
  'Loans & owner': 'ঋণ ও মালিক',
  'Warranty & stock': 'ওয়ারেন্টি ও স্টক',
  'Online & courier': 'অনলাইন ও কুরিয়ার',
  'Customer': 'ক্রেতা',
  'Service customer': 'সার্ভিসের ক্রেতা',
  'Supplier': 'সরবরাহকারী',
  'Borrower': 'ঋণগ্রহীতা',
  'Lender': 'ঋণদাতা',
  'Owner / staff': 'মালিক / কর্মী',
  'Related party': 'সংশ্লিষ্ট ব্যক্তি',
  'POS / Sales': 'পিওএস / বিক্রি',
  'POS / Party ledger': 'পিওএস / পার্টির হিসাব',
  'Party ledger': 'পার্টির হিসাব',
  'Sales': 'বিক্রি',
  'Quotations': 'কোটেশন',
  'Service orders': 'সার্ভিস অর্ডার',
  'Purchases': 'কেনাকাটা',
  'Supplier ledger': 'সরবরাহকারীর হিসাব',
  'Borrower ledger': 'ঋণগ্রহীতার হিসাব',
  'Lender ledger': 'ঋণদাতার হিসাব',
  'Owner ledger': 'মালিকের হিসাব',
  'Warranty': 'ওয়ারেন্টি',
  'Products': 'পণ্য',
  'Online Sales': 'অনলাইন বিক্রি',
  'Online Sales / Finance': 'অনলাইন বিক্রি / টাকা-পয়সা',
  'English': 'ইংরেজি',
  'Bangla': 'বাংলা',
  'Manual': 'নিজে চালু করুন',
  'On event': 'ঘটনা ঘটলে',
  'On': 'চালু',
  'Off': 'বন্ধ',
  'Event is disabled': 'এই বার্তা বন্ধ আছে',
  'Recipient has not consented': 'প্রাপক অনুমতি দেননি',
  'Invalid Bangladesh phone': 'বাংলাদেশের সঠিক ফোন নম্বর দিন',
  'SMS gateway is not connected': 'SMS গেটওয়ে যুক্ত নেই',
  'Quiet hours active': 'এখন বার্তা না পাঠানোর সময়',
  'Unknown ERP notification event.': 'এই নোটিফিকেশন পাওয়া যায়নি।',
  'Invalid SMS language.': 'SMS-এর ভাষা সঠিক নয়।',
  'Invalid notification trigger.': 'নোটিফিকেশন চালুর নিয়ম সঠিক নয়।',
  'Recipient category is required.': 'প্রাপকের ধরন বাছুন।',
  'Reminder days must be between 0 and 365.': 'মনে করানোর দিন ০ থেকে ৩৬৫ এর মধ্যে লিখুন।',
  'Template must be 1–320 characters and contain only supported placeholders.': 'বার্তায় ১–৩২০ অক্ষর লিখুন এবং অনুমোদিত ঘর ব্যবহার করুন।',
  'Recipient consent is required for SMS.': 'SMS পাঠাতে প্রাপকের অনুমতি লাগবে।',
  'Invalid rule': 'নিয়মটি সঠিক নয়',
  'Invalid SMS template.': 'বার্তার নমুনা সঠিক নয়।',
  'Could not update this notification rule.': 'নোটিফিকেশনের নিয়ম বদলানো যায়নি।'
};

export function notificationDisplayText(language: UiLanguage, value: string): string {
  return uiText(language, value, labels[value] ?? value);
}

export function notificationDisplayOptions(language: UiLanguage, values: readonly string[]) {
  return values.map(value => ({ value, label: notificationDisplayText(language, value) }));
}
