import type {ReportKey,ReportRow} from './types';
export type ReportTone='success'|'info'|'warning'|'danger'|'neutral';
export const reportToneClass:Record<ReportTone,string>={success:'text-success',info:'text-info',warning:'text-warning',danger:'text-danger',neutral:'text-ink-500'};
export function reportStatusTone(status:string):ReportTone{
 if(['Paid','In stock','Resolved','Received from supplier','Ready for customer','Found'].includes(status))return 'success';
 if(['Expired','Out of stock','Rejected','Lost','Damage'].includes(status))return 'danger';
 if(['Due','Partial','Low stock','Expiring soon','Needs review','Checking','Waiting supplier'].includes(status))return 'warning';
 if(['Posted','Purchase','Opening','Received','Sent to supplier','Customer credit','Sale','Return','Adjustment'].includes(status))return 'info';
 return 'neutral';
}
export function reportValueTone(key:string,row:ReportRow,report:ReportKey):ReportTone{
 const value=row.values[key];if(value===null||value===undefined||Number(value)===0)return 'neutral';
 if(key==='profit'||key==='margin')return Number(value)<0?'danger':'success';
 if(key==='inflow'||key==='paid')return 'success';
 if(key==='outflow')return 'danger';
 if(key==='cost'||key==='unitCost')return 'info';
 if(key==='due')return report==='payables'||report==='supplier-purchases'||report==='purchases'?'danger':'warning';
 if(key==='stock'||key==='expired')return key==='expired'?'danger':reportStatusTone(row.status);
 if(key==='amount')return ['expenses','expense-categories'].includes(report)?'danger':['purchases','supplier-purchases','purchase-prices'].includes(report)?'info':report==='sales-returns'?'warning':'success';
 return 'neutral';
}
export type ReportGuide={en:string;bn:string};
export const reportGuides:Record<string,ReportGuide>={
 amount:{en:'The recorded amount for the selected source rows. Sales and money collected are different: an unpaid sale is still a sale.',bn:'নির্বাচিত মূল রেকর্ডের মোট টাকা। বিক্রয় আর টাকা আদায় আলাদা—বাকি বিক্রয়ও বিক্রয়।'},
 paid:{en:'The amount already paid against this source record. It is not another sale or expense.',bn:'এই মূল রেকর্ডের বিপরীতে যত টাকা পরিশোধ হয়েছে। এটি নতুন বিক্রয় বা খরচ নয়।'},
 due:{en:'The current unpaid amount. Invoice age is not the same as overdue days; a due date is needed to establish overdue status.',bn:'এখন যত টাকা বাকি। বিলের বয়স আর মেয়াদ পেরোনোর দিন এক নয়; মেয়াদ পেরিয়েছে জানতে পরিশোধের তারিখ দরকার।'},
 profit:{en:'Recorded net sales minus historical product cost, before return reversals and operating expenses. A dash means the historical cost is missing.',bn:'লেখা নিট বিক্রয় থেকে বিক্রয়ের সময়ের পণ্যের খরচ বাদ। ফেরতের বিপরীত হিসাব ও পরিচালন খরচের আগে। ড্যাশ মানে পুরোনো খরচের তথ্য নেই।'},
 cost:{en:'Cost comes from historical source evidence. The report never substitutes today’s purchase price for an old sale.',bn:'মূল রেকর্ডে থাকা ঐতিহাসিক খরচ। পুরোনো বিক্রয়ের জন্য আজকের ক্রয়মূল্য ব্যবহার করা হয় না।'},
 unitCost:{en:'Recorded cost per base unit. Compare the same product and unit, and check the source date before choosing a supplier.',bn:'মূল এককপ্রতি লেখা ক্রয়খরচ। সরবরাহকারী বাছার আগে একই পণ্য ও একক তুলনা করুন এবং মূল তারিখ দেখুন।'},
 margin:{en:'Gross profit divided by recorded net sales, shown as a percentage. This is not markup on purchase cost.',bn:'মোট লাভকে লেখা নিট বিক্রয় দিয়ে ভাগ করে শতকরা হার। এটি ক্রয়খরচের ওপর বাড়তি দামের হার নয়।'},
 stock:{en:'Usable stock in the current snapshot, excluding recorded expired stock. This is not a reconstructed balance for an earlier date.',bn:'বর্তমান অবস্থার ব্যবহারযোগ্য স্টক; লেখা মেয়াদোত্তীর্ণ স্টক বাদ। এটি আগের কোনো তারিখের পুনর্গঠিত জের নয়।'},
 minStock:{en:'The product’s configured minimum in its base unit. Stock at or below this level needs review.',bn:'পণ্যের মূল এককে ঠিক করা ন্যূনতম স্টক। এই পরিমাণ বা কম হলে দেখে নেওয়া দরকার।'},
 quantity:{en:'Quantity is shown in the recorded base unit. Different units are never added together as one quantity.',bn:'পরিমাণ সংরক্ষিত মূল এককে দেখানো হয়। ভিন্ন এককের পরিমাণ একসঙ্গে যোগ করা হয় না।'},
 cover:{en:'Current usable stock divided by average daily recorded sales in your observation window. It is an estimate, not a delivery guarantee.',bn:'নির্বাচিত সময়ে দৈনিক গড় লেখা বিক্রয় দিয়ে বর্তমান ব্যবহারযোগ্য স্টক ভাগ করা হয়। এটি অনুমান, নিশ্চয়তা নয়।'},
 suggested:{en:'Estimated demand during lead time and review interval, plus safety stock, minus usable stock; rounded to your purchase pack. Review before ordering.',bn:'ডেলিভারি ও পর্যালোচনার সময়ের চাহিদা, সঙ্গে সেফটি স্টক, তা থেকে ব্যবহারযোগ্য স্টক বাদ; ক্রয়ের প্যাক অনুযায়ী বাড়ানো হয়। অর্ডারের আগে যাচাই করুন।'},
 days:{en:'For customer and supplier dues this is invoice age. Stock ageing uses receipt age; expiry reports show days until expiry.',bn:'গ্রাহক ও সরবরাহকারীর বাকিতে এটি বিলের বয়স। স্টকের বয়সে গ্রহণের পরের দিন, মেয়াদের রিপোর্টে মেয়াদ শেষ হতে বাকি দিন।'},
 expiry:{en:'The recorded batch expiry date. Expired batches and batches expiring soon are labelled separately.',bn:'ব্যাচে লেখা মেয়াদ শেষের তারিখ। মেয়াদ শেষ ও শেষের কাছাকাছি ব্যাচ আলাদা দেখানো হয়।'},
 inflow:{en:'Recorded money received into the selected account. Capital and loan receipts are money in, but are not sales revenue.',bn:'নির্বাচিত অ্যাকাউন্টে লেখা টাকা জমা। মূলধন ও ঋণের টাকা জমা হলেও বিক্রয়ের আয় নয়।'},
 outflow:{en:'Recorded money paid out of the selected account. Not every payment is an operating expense.',bn:'নির্বাচিত অ্যাকাউন্ট থেকে লেখা টাকা খরচ। প্রতিটি পেমেন্ট পরিচালন খরচ নয়।'},
 status:{en:'A text badge explains the record’s state. Green is settled or healthy, amber needs review, red highlights a loss or stock risk, and blue provides information.',bn:'ব্যাজের লেখায় রেকর্ডের অবস্থা জানা যায়। সবুজে পরিশোধ বা ভালো অবস্থা, কমলায় নজর দেওয়া, লালে ক্ষতি বা স্টকের ঝুঁকি, নীলে তথ্য বোঝায়।'},
 compare:{en:'Compares the same filters against the immediately preceding period with the same number of calendar days. Missing records do not become an invented percentage.',bn:'একই ফিল্টারে সমান দিনের ঠিক আগের সময়ের সঙ্গে তুলনা। রেকর্ড না থাকলে শতাংশ বানিয়ে দেখানো হয় না।'},
 leadDays:{en:'The number of days you expect a new purchase to take to reach your shop.',bn:'নতুন অর্ডারের পণ্য দোকানে আসতে আনুমানিক যত দিন লাগে।'},
 reviewDays:{en:'How many days until you review stock and place the next purchase order.',bn:'কত দিন পরে আবার স্টক দেখে পরের অর্ডার করবেন।'},
 safety:{en:'Extra stock you want to keep for uncertain demand or delivery delays, in each product’s base unit.',bn:'চাহিদা বাড়া বা ডেলিভারি দেরির জন্য বাড়তি স্টক, প্রতিটি পণ্যের মূল এককে।'},
 pack:{en:'The quantity in one purchase pack, expressed in the product’s base unit. Suggestions round up to a whole pack.',bn:'একটি ক্রয়ের প্যাকে পণ্যের মূল একক কতটি। প্রস্তাব পুরো প্যাক পর্যন্ত বাড়ানো হয়।'},
 budget:{en:'Your spending limit for reviewing the suggested list. The report highlights an overrun; it does not place or automatically reduce orders.',bn:'প্রস্তাবিত তালিকার জন্য আপনার খরচের সীমা। বেশি হলে দেখায়; নিজে অর্ডার দেয় না বা পরিমাণ কমায় না।'}
};

