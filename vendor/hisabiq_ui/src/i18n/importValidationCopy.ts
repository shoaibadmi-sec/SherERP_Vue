/** Display-only validation translations. The stored issues and exported error CSV remain English. */
const sourcePhrases:readonly (readonly [string,string])[]=[
 ['Product Name is required.','পণ্যের নাম লিখুন।'],
 ['Name is required.','নাম লিখুন।'],
 ['name is required.','নাম লিখুন।'],
 ['Required column is missing: Product Name','আবশ্যক পণ্যের নামের কলাম পাওয়া যায়নি'],
 ['CSV exceeds the 1 MB preview limit.','CSV ফাইল ১ MB-এর বেশি হতে পারবে না।'],
 ['XLSX exceeds the 5 MB preview limit.','Excel ফাইল ৫ MB-এর বেশি হতে পারবে না।'],
 ['Unexpected text after a quoted CSV field.','CSV-তে উদ্ধৃত ঘরের পরে অতিরিক্ত লেখা আছে।'],
 ['Unterminated quoted CSV field.','CSV-তে উদ্ধৃতির চিহ্ন বন্ধ হয়নি।'],
 ['The CSV has no nonempty rows.','CSV ফাইলে কোনো তথ্য নেই।'],
 ['Import accepts at most 5,000 data rows.','সর্বোচ্চ ৫,০০০টি তথ্যের সারি আনা যাবে।'],
 ['Import accepts at most 5,000 data rows per worksheet.','প্রতি শিটে সর্বোচ্চ ৫,০০০টি তথ্যের সারি আনা যাবে।'],
 ['Only .xlsx and .csv are supported; .xls and .xlsm are not supported.','শুধু .xlsx ও .csv ফাইল নেওয়া যাবে; .xls বা .xlsm নয়।'],
 ['The Excel workbook contains no sheets.','Excel ফাইলে কোনো শিট নেই।'],
 ['The same source column cannot be mapped more than once.','একই ফাইলের কলাম দুইটি ঘরে মেলানো যাবে না।'],
 ['Invalid source column.','ফাইলের কলাম ঠিক নেই।'],
 ['Spreadsheet formula-like text is not allowed.','ফর্মুলার মতো লেখা ব্যবহার করা যাবে না।'],
 ['Duplicate SKU in this file. Row skipped.','এই ফাইলে একই বারকোড দুইবার আছে। সারিটি বাদ দেওয়া হয়েছে।'],
 ['Duplicate SKU inside file.','এই ফাইলে একই বারকোড একাধিকবার আছে।'],
 ['Update requires a matching existing SKU.','তথ্য বদলাতে আগে থেকে থাকা একই বারকোড দরকার।'],
 ['Cannot change existing base unit through import.','ফাইল থেকে পুরোনো মূল একক বদলানো যাবে না।'],
 ['Cannot change existing large unit through import.','ফাইল থেকে পুরোনো বড় একক বদলানো যাবে না।'],
 ['Cannot change existing unit conversion through import.','ফাইল থেকে পুরোনো একক রূপান্তর বদলানো যাবে না।'],
 ['Updating a master cannot import opening stock.','পুরোনো পণ্যের তথ্য বদলানোর সঙ্গে শুরুর স্টক আনা যাবে না।'],
 ['Unsupported import decision.','তথ্য আনার এই সিদ্ধান্ত গ্রহণযোগ্য নয়।'],
 ['SKU already exists; choose Skip or Update master data.','এই বারকোড আগেই আছে। বাদ দিন অথবা শুধু পণ্যের তথ্য বদলান।'],
 ['Invalid Product Type.','পণ্যের ধরন ঠিক নয়।'],
 ['baseUnit is required for stock items.','স্টক পণ্যের মূল একক দিতে হবে।'],
 ['Larger and base unit cannot be identical.','বড় একক ও মূল একক একই হতে পারে না।'],
 ['Larger unit and conversion factor must both be provided.','বড় একক ও তার রূপান্তরের পরিমাণ—দুটিই দিন।'],
 ['Conversion factor must be positive.','একক রূপান্তরের সংখ্যা শূন্যের বেশি হতে হবে।'],
 ['Service cannot carry inventory/serial/lot fields.','সেবা পণ্যে স্টক, সিরিয়াল বা লট দেওয়া যাবে না।'],
 ['Unknown stock display unit.','স্টক দেখানোর একক চেনা যায়নি।'],
 ['Selling price must be greater than zero.','বিক্রয়মূল্য শূন্যের বেশি হতে হবে।'],
 ['Service cannot have opening or minimum stock.','সেবা পণ্যের শুরুর বা সর্বনিম্ন স্টক থাকতে পারে না।'],
 ['Invalid serial tracking mode.','সিরিয়াল রাখার নিয়ম ঠিক নয়।'],
 ['Serials provided but tracking is Off.','সিরিয়াল দেওয়া হয়েছে কিন্তু সিরিয়াল রাখা বন্ধ আছে।'],
 ['Service cannot track serials.','সেবা পণ্যের সিরিয়াল রাখা যাবে না।'],
 ['Required serial tracking must list exactly one serial per opening base unit.','শুরুর স্টকের প্রতিটি মূল এককের জন্য একটি করে সিরিয়াল দিন।'],
 ['Expiry must follow manufacture date.','মেয়াদ শেষের তারিখ উৎপাদনের তারিখের পরে হতে হবে।'],
 ['Opening date is required for nonzero stock.','স্টক থাকলে শুরুর তারিখ দিতে হবে।'],
 ['Opening date cannot be in the future.','শুরুর তারিখ ভবিষ্যতের হতে পারবে না।'],
 ['Service cannot have opening lot details.','সেবা পণ্যে শুরুর লটের তথ্য দেওয়া যাবে না।'],
 ['Invalid warranty unit.','ওয়ারেন্টির সময়ের একক ঠিক নয়।'],
 ['Invalid warranty type.','ওয়ারেন্টির ধরন ঠিক নয়।'],
 ['Warranty must be positive.','ওয়ারেন্টির মেয়াদ শূন্যের বেশি হতে হবে।'],
 ['Invalid product import row.','পণ্যটির তথ্য ঠিক নয়।'],
 ['Party ID was not found. Correct the ID or clear it.','এই পার্টি আইডি নেই। আইডি ঠিক করুন অথবা মুছুন।'],
 ['Repeated Party ID/phone in this file; skipped to prevent duplicate identities.','এই ফাইলে একই পার্টি আইডি বা ফোন একাধিকবার আছে; পুনরাবৃত্তি এড়াতে সারি বাদ দেওয়া হয়েছে।'],
 ['Phone matches multiple Parties. Enter the exact Party ID or correct the phone.','ফোনটি একাধিক পার্টির সঙ্গে মিলে গেছে। সঠিক পার্টি আইডি দিন অথবা ফোন ঠিক করুন।'],
 ['Enter a real YYYY-MM-DD opening date.','YYYY-MM-DD আকারে সঠিক শুরুর তারিখ দিন।'],
 ['Excel numeric phone may have lost a leading zero. Enter the complete number as text, e.g. 017...','Excel-এ নম্বর হিসেবে রাখলে ফোনের শুরুর ০ হারাতে পারে। ফোনটি 017... আকারে লেখা হিসেবে দিন।'],
 ['Bangladesh mobile appears to be missing its leading 0. Enter 01... as literal text.','মোবাইল নম্বরের শুরুতে ০ নেই। 01... দিয়ে লেখা হিসেবে দিন।'],
 ['Duplicate identity in the same import file.','একই ফাইলে একই ব্যক্তির তথ্য একাধিকবার আছে।'],
 ['Invalid phone format; preserve the original leading zero.','ফোন নম্বর ঠিক নয়। শুরুর ০ রেখে নম্বর দিন।'],
 ['Party ID not found.','পার্টি আইডি পাওয়া যায়নি।'],
 ['Phone matches several Parties; specify Party ID.','একাধিক পার্টির সঙ্গে ফোন মিলে গেছে। পার্টি আইডি দিন।'],
 ['Add Role requires an explicitly selected matching Party.','সম্পর্ক যোগ করতে কোন পার্টির সঙ্গে মেলাবেন তা বাছুন।'],
 ['Cannot create separately using an existing Party ID.','আগের পার্টি আইডি দিয়ে নতুন আলাদা পার্টি যোগ করা যাবে না।'],
 ['Creating a separate Party with a matched phone requires explicit confirmation.','একই ফোনে আলাদা পার্টি খুলতে স্পষ্টভাবে নিশ্চিত করতে হবে।'],
 ['Unsupported Party import decision.','পার্টি আনার এই সিদ্ধান্ত গ্রহণযোগ্য নয়।'],
 ['Opening amount must be nonnegative with at most two decimals.','শুরুর জের ঋণাত্মক হতে পারবে না; দশমিকের পরে সর্বোচ্চ দুই অঙ্ক দিন।'],
 ['Invalid opening amount.','শুরুর জেরের পরিমাণ ঠিক নয়।'],
 ['Choose Dr or Cr for a nonzero opening.','শুরুর জের থাকলে Dr বা Cr বাছুন।'],
 ['Opening direction/date/note requires a positive opening amount.','জেরের ধরন, তারিখ বা নোট দিতে হলে শুরুর জের শূন্যের বেশি হতে হবে।'],
 ['Invalid Party row.','পার্টির সারির তথ্য ঠিক নয়।']
];

/** Preserve dynamic names, IDs, source row numbers, units and financial directions. */
export function translateKnownImportValidation(message:string):string {
 let value=message;
 for(const [original,bangla] of sourcePhrases)value=value.replaceAll(original,bangla);
 value=value.replace(/Invalid quoted CSV field at line (\d+)\./g,(_,line:string)=>'CSV-র '+line+' নম্বর লাইনে উদ্ধৃত ঘর ঠিক নেই।');
 value=value.replace(/Required column is missing: ([^.\n]+)(?=\.|$)/g,(_,field:string)=>'আবশ্যক কলাম পাওয়া যায়নি: '+field);
 value=value.replace(/SKU belongs to (.*?)\. Choose Update master data or Skip\./g,(_,name:string)=>'এই বারকোড '+name+'-এর। শুধু তথ্য বদলান অথবা বাদ দিন।');
 value=value.replace(/Duplicate serial: ([^\n•]+)/g,(_,serial:string)=>'একই সিরিয়াল দুইবার আছে: '+serial);
 value=value.replace(/An active opening balance already exists for ([A-Za-z]+)\./g,(_,role:string)=>role+' সম্পর্কের শুরুর জের আগেই আছে।');
 value=value.replace(/([A-Za-z]+) role is already assigned\./g,(_,role:string)=>role+' সম্পর্ক আগেই দেওয়া হয়েছে।');
 value=value.replace(/\bRow (\d+):/g,(_,row:string)=>'সারি '+row+':');
 return value;
}
