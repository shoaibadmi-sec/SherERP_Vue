import type {UiLanguage} from './uiCopy';
import {uiText} from './uiCopy';

/** UI-only translations of known source-validation messages. No financial rules change. */
const validationCopy:Record<string,string>={
  'Enter a refund reason.':'ফেরতের কারণ লিখুন।',
  'Select active money accounts and match the refund total.':'চালু টাকার হিসাব বাছুন এবং সব টাকার যোগফল মিলিয়ে নিন।',
  'Enter a valid payment amount and discount.':'পেমেন্টের টাকা ও ছাড়ের সঠিক পরিমাণ লিখুন।',
  'Payment sources must add up to the amount.':'সব মাধ্যমের টাকার যোগফল মূল টাকার সমান হতে হবে।',
  'Finance amount must be greater than zero.':'টাকার পরিমাণ শূন্যের বেশি হতে হবে।',
  'Finance amount must be a nonnegative amount with two decimal places at most.':'শূন্য বা তার বেশি টাকা লিখুন। দশমিকের পরে সর্বোচ্চ দুই ঘর হবে।',
  'Invalid finance relationship and type.':'সম্পর্কের ধরন ও লেনদেনের ধরন মিলছে না।',
  'Cannot record finance transaction.':'এই লেনদেন রাখা যায়নি।',
  'Choose a valid business date not in the future.':'সঠিক লেনদেনের তারিখ বাছুন। ভবিষ্যতের তারিখ দেওয়া যাবে না।',
  'Choose a payment source.':'টাকার মাধ্যম বাছুন।',
  'No payment source is needed for zero cash.':'টাকা না থাকলে মাধ্যম যোগ করার দরকার নেই।',
  'Duplicate payment split.':'একই পেমেন্ট মাধ্যমের সারি দুইবার আছে।',
  'Payment split must be positive.':'প্রতিটি মাধ্যমে টাকার পরিমাণ শূন্যের বেশি হতে হবে।',
  'Payment account not found or inactive.':'টাকার হিসাবটি পাওয়া যায়নি বা চালু নেই।',
  'Payment method does not match the selected account.':'টাকার মাধ্যম ও বাছা হিসাব মিলছে না।',
  'Payment split total does not match entered amount.':'সব মাধ্যমের টাকার যোগফল মূল টাকার সমান নয়।',
  'Valid business date required.':'সঠিক লেনদেনের তারিখ দিন।',
  'Refund exceeds available verified credit.':'যাচাই করা ফেরতযোগ্য জমার চেয়ে বেশি টাকা ফেরত দেওয়া যাবে না।',
  'Refund requires a reason.':'ফেরতের কারণ লিখুন।',
  'Discount requires a reason.':'ছাড় দেওয়ার কারণ লিখুন।',
  'Discount exceeds available invoice due.':'বিলের বাকি টাকার বেশি ছাড় দেওয়া যাবে না।',
  'Discount exceeds open invoice due.':'বিলের বাকি টাকার বেশি ছাড় দেওয়া যাবে না।',
  'Refund must be positive.':'ফেরতের টাকা শূন্যের বেশি হতে হবে।',
  'Refund amount must be positive.':'ফেরতের টাকা শূন্যের বেশি হতে হবে।'
};
const impactCopy:Record<string,string>={
  'Opening balance':'শুরুর জের',
  'Finance entry':'টাকার হিসাব',
  'Money in':'টাকা জমা',
  'Money out':'টাকা খরচ',
  'Customer due increased':'ক্রেতার বাকি বেড়েছে',
  'Supplier payable increased':'সরবরাহকারীর দেনা বেড়েছে',
  'Non-cash adjustment':'টাকা ছাড়া সমন্বয়',
  'Note · No money movement':'নোট · টাকা সরেনি',
  'Account entry':'খাতার এন্ট্রি'
};
export function partyFinancialErrorText(language:UiLanguage,message:string):string {
  if(language!=='Bangla')return message;
  return validationCopy[message]??message;
}
export function partyLedgerImpactText(language:UiLanguage,label:string):string {
  return uiText(language,label,impactCopy[label]??label);
}
