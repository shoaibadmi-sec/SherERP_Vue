import {uiText, type UiLanguage} from './uiCopy.ts';

/** Finance terminology for presentation only; never use these labels as IDs. */
const financeWords:Record<string,string>={
  'Owner Credit':'মালিকের টাকা জমা','Owner Debit':'মালিককে টাকা দেওয়া',
  'Lender Credit':'ঋণদাতার কাছ থেকে টাকা নেওয়া','Lender Debit':'ঋণদাতাকে টাকা ফেরত',
  'Borrower Debit':'ঋণগ্রহীতাকে টাকা দেওয়া','Borrower Credit':'ঋণগ্রহীতার টাকা ফেরত',
  'Opening Owner Capital':'মালিকের শুরুর মূলধন','Opening Loan':'শুরুর ঋণ',
  'Opening Borrower Loan':'ঋণগ্রহীতার শুরুর ঋণ',
  'Manual Bank Entry':'ব্যাংকে টাকা যোগ','Transfer':'হিসাবে টাকা সরানো',
  'Cash':'ক্যাশ','Petty Cash':'ছোট ক্যাশ','Bank':'ব্যাংক','Mobile Banking':'মোবাইল ব্যাংকিং',
  'Owner':'মালিক','Lender':'ঋণদাতা','Borrower':'ঋণগ্রহীতা',
  'Matched':'মিলেছে','Review':'যাচাই বাকি','Unmatched':'মেলেনি','Ignored':'বাদ দেওয়া',
  'Completed':'সম্পন্ন','Active':'চালু','Inactive':'বন্ধ','Reversed':'উল্টো হিসাব',
  'All status':'সব অবস্থা','Statement':'ব্যাংক স্টেটমেন্ট','ERP':'ERP',
  'Available money':'ব্যবহারের টাকা','Cheques pending':'অপেক্ষমাণ চেক',
  'Lender payable':'ঋণদাতাকে দেনা','Borrower receivable':'ঋণগ্রহীতার কাছে পাওনা',
  'Received':'পাওয়া হয়েছে','Issued':'দেওয়া হয়েছে','Deposited':'ব্যাংকে জমা','Presented':'ব্যাংকে উপস্থাপিত',
  'Cleared':'ক্লিয়ার হয়েছে','Bounced':'চেক ফেরত এসেছে','Returned':'ফেরত','Cancelled':'বাতিল','Stopped':'পেমেন্ট বন্ধ',
  'Mark deposited':'জমা হয়েছে', 'Return cheque':'চেক ফেরত', 'Cancel cheque':'চেক বাতিল',
  'Mark cleared':'ক্লিয়ার হয়েছে', 'Mark bounced':'চেক বাউন্স হয়েছে', 'Mark presented':'উপস্থাপিত হয়েছে',
  'Stop payment':'পেমেন্ট বন্ধ করুন', 'Mark returned':'চেক ফেরত দেখান',
  'Open':'চালু','Closed':'বন্ধ',
};
export function financeLabel(language:UiLanguage, value:string):string{
  return uiText(language,value,financeWords[value]??value);
}
