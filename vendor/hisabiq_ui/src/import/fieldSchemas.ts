import type {ImportFieldSchema,ImportTarget} from './importTypes.ts';
const field=(key:string,label:string,labelBn:string,example:string,aliases:string[]=[],required=false):ImportFieldSchema=>
 ({key,label,labelBn,example,required,aliases:[key,label,...aliases]});
const product:ImportFieldSchema[]=[
 field('name','Product Name','পণ্যের নাম','LED Bulb 12W',['productname','itemname','পণ্যেরনাম','নাম'],true),
 field('nameBn','Bangla Name','বাংলা নাম','এলইডি বাল্ব',['namebangla','banglaname','বাংলানাম']),
 field('sku','SKU / Barcode','বারকোড','LED-0120',['barcode','productcode','itemcode','code']),
 field('kind','Product Type','ধরন','Stock',['type']),
 field('category','Category','ক্যাটাগরি','Electrical',['categoryname','ক্যাটাগরি']),
 field('brand','Brand','ব্র্যান্ড','Vision',['brandname','ব্র্যান্ড']),
 field('baseUnit','Base Unit','মূল একক','Pcs',['unit','smallunit','মূলএকক']),
 field('largeUnit','Larger Unit','বড় একক','Box',['altunit','bigunit','packunit','বড়একক']),
 field('conversionFactor','Unit Conversion','একক রূপান্তর','10',['factor','conversion','qtyperbox']),
 field('stockViewUnit','Stock Display Unit','স্টক দেখানোর একক','Box',['displayunit']),
 field('purchasePrice','Purchase Price','ক্রয়মূল্য','1200',['buyprice','costprice','ক্রয়মূল্য']),
 field('purchasePriceUnit','Purchase Price Unit','ক্রয়মূল্যের একক','Box',['costunit']),
 field('sellingPrice','Selling Price','বিক্রয়মূল্য','165',['sellprice','salesprice','বিক্রয়মূল্য'],true),
 field('sellingPriceUnit','Selling Price Unit','বিক্রয়মূল্যের একক','Pcs',['saleunit']),
 field('largeUnitSellingPrice','Large Unit Sell Price','বড় এককের দাম','1550',['altprice']),
 field('minimumStock','Minimum Stock','সর্বনিম্ন স্টক','10',['minstock']),
 field('minimumStockUnit','Minimum Stock Unit','সর্বনিম্ন স্টক একক','Pcs',['minstockunit']),
 field('openingStock','Opening Stock','প্রারম্ভিক স্টক','2',['openingqty','initialstock','প্রারম্ভিকস্টক']),
 field('openingStockUnit','Opening Stock Unit','স্টকের একক','Box',['openingunit']),
 field('openingDate','Opening Date','প্রারম্ভিক তারিখ','2026-10-01',['stockdate']),
 field('openingUnitCost','Opening Unit Cost','প্রারম্ভিক ক্রয়মূল্য','1200',['openingcost']),
 field('openingCostUnit','Opening Cost Unit','প্রারম্ভিক ক্রয় একক','Box',['openingpriceunit']),
 field('batchNumber','Batch Number','ব্যাচ নম্বর','B-100',['batch']),
 field('manufactureDate','Manufacture Date','উৎপাদনের তারিখ','2026-01-01',['mfgdate']),
 field('expiryDate','Expiry Date','মেয়াদের তারিখ','2027-01-01',['expdate']),
 field('serialTracking','Serial Tracking','সিরিয়াল','Off',['serialmode']),
 field('serialNumbers','Serial Numbers','সিরিয়াল নম্বর','','serials'.split('|')),
 field('warrantyDuration','Warranty Duration','ওয়ারেন্টি সময়','12',['warranty']),
 field('warrantyDurationUnit','Warranty Unit','ওয়ারেন্টি একক','Months',['warrantyunit']),
 field('warrantyType','Warranty Type','ওয়ারেন্টির ধরন','Seller',[]),
];
const party:ImportFieldSchema[]=[
 field('name','Name','নাম','Rahim Hardware',['customername','suppliername','partyname','গ্রাহকেরনাম','সরবরাহকারীরনাম'],true),
 field('nameBn','Bangla Name','বাংলা নাম','রহিম হার্ডওয়্যার',['namebangla','banglaname']),
 field('phone','Phone','মোবাইল','01712345678',['mobile','mobilenumber','phonenumber','ফোন','মোবাইলনম্বর']),
 field('area','Area / Address','ঠিকানা','Dhaka',['address','location','ঠিকানা','এলাকা']),
 field('partyId','Party ID','পার্টি আইডি','',['id','existingpartyid']),
 field('openingAmount','Opening Amount','প্রারম্ভিক জের','5000',['openingbalance','balance']),
 field('openingDirection','Opening Direction','দেনা / পাওনা','Dr',['balancekind','drcr','direction']),
 field('openingDate','Opening Date','শুরুর তারিখ','2026-10-01',['balancedate']),
 field('openingNote','Opening Note','বিবরণ','From old account book',['note','remarks'])
];
export function fieldsFor(target:ImportTarget):readonly ImportFieldSchema[]{return target==='product'?product:party;}
