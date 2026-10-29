const copy:Record<string,string>={
 'Paid':'পরিশোধিত','Partial':'আংশিক','Due':'বাকি','Posted':'পোস্ট করা','In stock':'স্টক আছে','Low stock':'স্টক কম','Out of stock':'স্টক শেষ',
 'Expired':'মেয়াদ শেষ','Expiring soon':'মেয়াদ শেষের কাছাকাছি','Needs review':'পর্যালোচনা দরকার','Opening':'শুরুর স্টক','Purchase':'ক্রয়','Sale':'বিক্রয়','Return':'ফেরত','Adjustment':'সমন্বয়',
 'Customer credit':'গ্রাহকের জমা','Cash refund':'টাকা ফেরত','Adjust due':'বাকির সমন্বয়','Received':'গ্রহণ করা','Checking':'যাচাই চলছে','Sent to supplier':'সরবরাহকারীকে পাঠানো','Waiting supplier':'সরবরাহকারীর অপেক্ষায়','Received from supplier':'সরবরাহকারী থেকে এসেছে','Ready for customer':'গ্রাহকের জন্য প্রস্তুত','Resolved':'সমাধান হয়েছে','Rejected':'বাতিল',
 'Plumbing':'প্লাম্বিং','Electrical':'ইলেকট্রিক্যাল','Steel':'স্টিল','Building':'নির্মাণ','Hardware':'হার্ডওয়্যার','Service':'সেবা','Salary':'বেতন','Rent':'ভাড়া','Transport':'পরিবহন','Utilities':'বিদ্যুৎ-পানি','Maintenance':'মেরামত','Tea & Snacks':'চা-নাস্তা',
 'Current snapshot':'বর্তমান অবস্থা','Historical issue cost is missing. Current product prices are not used to calculate profit.':'বিক্রয়ের সময়ের খরচ নেই। বর্তমান পণ্যের দাম দিয়ে লাভ হিসাব করা হয়নি।',
 'Frozen base quantity is missing; compound quantity has not been guessed.':'সংরক্ষিত মূল এককের পরিমাণ নেই; যৌগিক পরিমাণ অনুমান করা হয়নি।',
 'Product-level purchase source lines are missing; supplier unit-price comparisons exclude this bill.':'ক্রয়ের মূল পণ্যতালিকা নেই; একক মূল্যের তুলনায় এই বিল নেই।',
 'Lot quantities or valuation costs do not fully reconcile to the current stock snapshot.':'লটের পরিমাণ বা খরচ বর্তমান স্টকের সঙ্গে পুরোপুরি মিলছে না।',
 'Return cost reversal and return-price adjustment postings are not a complete ledger in this preview.':'এই প্রিভিউতে ফেরতের খরচ ও মূল্যের সমন্বয়ের পূর্ণ হিসাব নেই।',
 'A paid total exists without a payment-source breakdown. It is not added to the account book.':'পরিশোধের মোট আছে, কিন্তু কোন অ্যাকাউন্টে কত তা নেই। অ্যাকাউন্ট খাতায় এটি যোগ হয়নি।',
 'Payment allocation is missing; the expense is not assigned to an account.':'পেমেন্টের বরাদ্দ নেই; খরচ কোনো অ্যাকাউন্টে দেওয়া হয়নি।',
 'Source payment breakdown. Individual settlement dates are unavailable; the date shown is the source record date.':'মূল পেমেন্টের ভাগ। প্রতিটি পরিশোধের তারিখ নেই; দেখানো তারিখ মূল রেকর্ডের।',
 'Choose a dated demand window with recorded base quantities.':'বিক্রয়ের মূল এককের পরিমাণসহ একটি সময়কাল বাছুন।',
 'Limited sales history; review this suggestion.':'বিক্রয়ের তথ্য অল্প; প্রস্তাবটি যাচাই করুন।',
 'Owner-entered lead time; no confirmed incoming or reservation source.':'ডেলিভারির সময় আপনার দেওয়া; আসন্ন পণ্য বা সংরক্ষণের তথ্য নেই।',
 'Recorded sales in the observation window; no lost-sales estimate.':'নির্বাচিত সময়ের লেখা বিক্রয়; হারানো বিক্রয় অনুমান করা হয়নি।',
 'No recorded sales in this window; demand has not been invented.':'এই সময়ে বিক্রয়ের রেকর্ড নেই; চাহিদা অনুমান করা হয়নি।'
};
export const reportPhrase=(value:string,language:string)=>language==='Bangla'?(copy[value]??value):value;

