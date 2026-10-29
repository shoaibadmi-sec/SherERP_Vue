import type { UiLanguage } from '../../i18n/uiCopy.ts';
import type { ReportRow } from '../types.ts';
import type { ReviewMetric } from './types.ts';
import type { AuditBook, AuditRank } from './auditBook.ts';

const escape=(v:unknown)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c));
const numeric=(n:number)=>new Intl.NumberFormat('en-BD',{maximumFractionDigits:2}).format(n);
const money=(n:number|null|undefined)=>typeof n==='number'&&Number.isFinite(n)?'৳'+numeric(n):'—';
const copy=(lang:UiLanguage,en:string,bn:string)=>lang==='Bangla'?bn:lang==='English'?en:en+' / '+bn;
const dateLine=(b:AuditBook)=>b.review.request.from+' – '+b.review.effectiveTo;
const asOf=(b:AuditBook)=>b.review.request.asOf;
const values=(m:ReviewMetric)=>money(m.value);
const tone=(metric:ReviewMetric)=>metric.readiness==='needs-review'?'Needs review':metric.readiness==='unavailable'?'Unavailable':metric.readiness==='incomplete'?'Incomplete':'Ready';
const chartColors=['#087F76','#1B6589','#4FAF99','#D7A247','#6F88A4','#9E7957'];
const svgLabel=(label:string,max=22)=>escape(label.length>max?label.slice(0,max-1)+'…':label);

/** SVG remains a real graph in the isolated print window without capturing raster canvas. */
function barChart(label:string,rows:{label:string;amount:number}[],lang:UiLanguage):string{
 const valid=rows.filter(r=>Number.isFinite(r.amount)&&r.amount>=0);
 const W=660,H=142,left=44,top=19,right=10,bottom=42,inner=W-left-right;
 const highest=Math.max(1,...valid.map(r=>r.amount));
 const spacing=inner/Math.max(1,valid.length),width=Math.min(38,spacing*0.64);
 const bars=valid.map((r,i)=>{
  const height=Math.max(r.amount>0?2:0,(H-top-bottom-8)*r.amount/highest);
  const x=left+i*spacing+(spacing-width)/2,y=H-bottom-height;
  return '<rect x="'+x.toFixed(1)+'" y="'+y.toFixed(1)+'" width="'+width.toFixed(1)+'" height="'+height.toFixed(1)+'" rx="3" fill="'+chartColors[i%chartColors.length]+'"/>'+
  '<text x="'+(x+width/2).toFixed(1)+'" y="'+(H-bottom+14)+'" text-anchor="middle" font-size="9" fill="#475569">'+svgLabel(r.label,12)+'</text>'+
  '<text x="'+(x+width/2).toFixed(1)+'" y="'+Math.max(10,y-5).toFixed(1)+'" text-anchor="middle" font-size="8.5" fill="#0B2933">'+escape(numeric(r.amount))+'</text>';
 }).join('');
 const message=valid.length?'':'<text x="330" y="75" text-anchor="middle" font-size="13" fill="#607481">'+escape(copy(lang,'No recorded chart data','গ্রাফের তথ্য নেই'))+'</text>';
 return '<section class="chart-wrap"><h4>'+escape(label)+'</h4><svg class="audit-chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="'+escape(label)+'" xmlns="http://www.w3.org/2000/svg">'+
 '<line x1="'+left+'" y1="'+(H-bottom)+'" x2="'+(W-right)+'" y2="'+(H-bottom)+'" stroke="#D6E0E4" stroke-width="1"/>'+bars+message+'</svg></section>';
}
function pieChart(label:string,rows:{label:string;amount:number}[],lang:UiLanguage):string{
 const valid=rows.filter(r=>Number.isFinite(r.amount)&&r.amount>0).slice(0,5);
 const sum=valid.reduce((n,r)=>n+r.amount,0),C=2*Math.PI*42;
 let acc=0;
 const segments=valid.map((r,i)=>{
  const share=r.amount/sum,dash=(share*C).toFixed(2);
  const segment='<circle cx="92" cy="79" r="42" fill="none" stroke="'+chartColors[i%chartColors.length]+'" stroke-width="25" stroke-dasharray="'+dash+' '+C.toFixed(2)+'" stroke-dashoffset="'+(-acc*C).toFixed(2)+'" transform="rotate(-90 92 79)"/>';
  acc+=share;return segment;
 }).join('');
 const legend=valid.map((r,i)=>'<div class="legend-row"><span class="swatch" style="background:'+chartColors[i%chartColors.length]+'"></span><span>'+escape(r.label)+'</span><b>'+escape(numeric(Math.round((r.amount/sum)*100)))+'%</b></div>').join('');
 return '<section class="chart-wrap"><h4>'+escape(label)+'</h4><div class="pie-layout"><svg class="audit-chart pie-svg" viewBox="0 0 185 158" role="img" aria-label="'+escape(label)+'" xmlns="http://www.w3.org/2000/svg">'+(segments||'<circle cx="92" cy="79" r="42" fill="none" stroke="#DCE5E8" stroke-width="25"/>')+'</svg>'+
 '<div class="pie-legend">'+(legend||'<span class="empty">'+escape(copy(lang,'No recorded chart data','গ্রাফের তথ্য নেই'))+'</span>')+'</div></div></section>';
}
function ranked(title:string,rows:AuditRank[],lang:UiLanguage,qty=false):string{
 const body=rows.length?rows.map((r,i)=>'<tr><td class="rank">'+(i+1)+'</td><td><strong>'+escape(r.label)+'</strong>'+
 '<span class="ref">'+escape(r.source.slice(0,2).map(s=>s.label).join(' · '))+'</span></td>'+
 (qty?'<td class="num">'+(r.quantity===null?'—':escape(numeric(r.quantity)+' '+r.unit))+'</td>':'')+
 '<td class="num">'+money(r.amount)+'</td></tr>').join(''):
 '<tr><td colspan="'+(qty?4:3)+'" class="empty">'+escape(copy(lang,'No recorded data for this ranking','এই তালিকার রেকর্ড নেই'))+'</td></tr>';
 return '<section class="list"><h3>'+escape(title)+'</h3><table><thead><tr><th>#</th><th>'+escape(copy(lang,'Name / sources','নাম / মূল রেকর্ড'))+'</th>'+
 (qty?'<th class="num">'+escape(copy(lang,'Units','পরিমাণ'))+'</th>':'')+'<th class="num">'+escape(copy(lang,'BDT','টাকা'))+'</th></tr></thead><tbody>'+body+'</tbody></table></section>';
}
function transactions(title:string,rows:ReportRow[],lang:UiLanguage,field='amount'):string{
 const body=rows.length?rows.map(r=>'<tr><td>'+escape(r.label)+'</td><td>'+escape(r.party||r.category||r.account||r.status)+'</td>'+
 '<td>'+escape(r.date)+'</td><td class="num">'+money(typeof r.values[field]==='number'?Number(r.values[field]):null)+'</td></tr>').join(''):
 '<tr><td colspan="4" class="empty">'+escape(copy(lang,'No recorded entries for this section','এই অংশে কোনো রেকর্ড নেই'))+'</td></tr>';
 return '<section class="list"><h3>'+escape(title)+'</h3><table><thead><tr><th>'+escape(copy(lang,'Reference','নম্বর'))+'</th><th>'+escape(copy(lang,'Name / category','নাম / খাত'))+'</th>'+
 '<th>'+escape(copy(lang,'Date','তারিখ'))+'</th><th class="num">'+escape(copy(lang,'BDT','টাকা'))+'</th></tr></thead><tbody>'+body+'</tbody></table></section>';
}
function metric(title:string,m:ReviewMetric):string{
 return '<div class="metric"><small>'+escape(title)+'</small><b>'+values(m)+'</b><i>'+escape(tone(m))+'</i></div>';
}
function note(text:string):string{return '<p class="note">'+escape(text)+'</p>';}
function page(b:AuditBook,index:number,title:string,content:string,lang:UiLanguage):string{
 return '<section class="audit-page" aria-label="'+escape(title)+'">'+
 '<div class="header"><div><div class="brand">HISAB<span>IQ</span></div><div class="sub-brand">'+escape(copy(lang,'Business performance / internal management review','ব্যবসার পারফরম্যান্স / অভ্যন্তরীণ পর্যালোচনা'))+'</div></div>'+
 '<div class="header-meta"><strong>'+escape(dateLine(b))+'</strong><span>'+escape(copy(lang,'Source cutoff','তথ্যের শেষ তারিখ'))+': '+escape(asOf(b))+'</span></div></div>'+
 '<div class="page-title"><div class="page-number">'+String(index).padStart(2,'0')+'</div><h2>'+escape(title)+'</h2></div>'+
 '<div class="page-content">'+content+'</div>'+
 '<footer><span>'+escape(copy(lang,'Draft • recorded sources only • not an independently certified audit','খসড়া • সংরক্ষিত তথ্য • স্বতন্ত্র প্রত্যয়িত অডিট নয়'))+'</span>'+
 '<span class="page-index">'+index+' / 5</span></footer></section>';
}
const formatRank=(r:AuditRank[])=>r.map(x=>({label:x.label,amount:x.amount}));
export function auditBookHtml(book:AuditBook,language:UiLanguage='English + Bangla'):string{
 const m=book.review.metrics,t=(en:string,bn:string)=>copy(language,en,bn);
 const dueNote=book.duesAsOf?'Current recorded balances as of '+book.duesAsOf+'; invoice age is not evidence of overdue status.':'Historical closing receivables/payables are unavailable without complete dated settlement reconstruction.';
 const grossCaveat=book.review.metrics.grossProfit.value===null?'Historical margin/return-cost completeness is unavailable.':
  'Per-product amounts are known recorded sale-line contributions, before historical return-cost allocation and other expenses.';
 const p1='<div class="metrics four">'+metric(t('Net sales','নিট বিক্রি'),m.netSales)+metric(t('Purchases','ক্রয়'),m.purchases)+metric(t('Recorded expenses','লিখিত খরচ'),m.expenses)+metric(t('Net profit (unverified)','নিট লাভ (অযাচাইকৃত)'),m.netProfit)+'</div>'+
 barChart(t('Recorded sales trend (BDT)','সংরক্ষিত বিক্রয়ের ধারা (টাকা)'),book.salesTrend,language)+
 '<div class="metrics three">'+metric(t('Cash movement in','টাকা জমা'),m.cashIn)+metric(t('Cash movement out','টাকা খরচ'),m.cashOut)+metric(t('Recorded stock valuation','মজুদের সংরক্ষিত মূল্য'),m.stockValue)+'</div>'+
 note(book.review.disclaimer)+note('Purchases are NOT the cost of goods sold; cash movement is not net profit. Missing months and costs have not been filled with zeros.');
 const p2='<div class="split">'+ranked(t('Top selling products','সর্বাধিক বিক্রিত পণ্য'),book.topSelling,language,true)+ranked(t('Top buying customers','সর্বাধিক ক্রয়কারী গ্রাহক'),book.topCustomers,language)+'</div>'+
 barChart(t('Product sales value (BDT)','পণ্যভিত্তিক বিক্রয় (টাকা)'),formatRank(book.topSelling),language)+
 '<div class="split">'+ranked(t('Highest known product contribution','পরিচিত খরচভিত্তিক লাভের পণ্য'),book.topPerformers,language)+
 pieChart(t('Top customers share','সেরা গ্রাহকের অংশ'),formatRank(book.topCustomers),language)+'</div>'+note(grossCaveat);
 const p3='<div class="metrics two">'+metric(t('Purchases in period','নির্বাচিত সময়ে ক্রয়'),m.purchases)+metric(t('Stock value at cutoff','শেষ তারিখে মজুদের মূল্য'),m.stockValue)+'</div>'+
 '<div class="split">'+ranked(t('Top suppliers','শীর্ষ সরবরাহকারী'),book.topSuppliers,language)+
 pieChart(t('Supplier purchasing share','সরবরাহকারীভিত্তিক ক্রয়ের অংশ'),formatRank(book.topSuppliers),language)+'</div>'+
 ranked(t('Top ordered / purchased products','সর্বাধিক অর্ডারকৃত / ক্রয়কৃত পণ্য'),book.topOrdered,language,true)+
 barChart(t('Top recorded purchase-line values','ক্রয় পণ্যের মূল্য তুলনা'),formatRank(book.topOrdered),language)+
 note('Purchased goods, incoming orders and current inventory are different quantities. Historic owned-stock values require supported as-of snapshots.');
 const p4='<p class="section-alert">'+escape(dueNote)+'</p>'+
 '<div class="split">'+transactions(t('Customer dues — current invoice list','গ্রাহক পাওনা — বর্তমান বিল'),book.customerDues,language,'due')+
 transactions(t('Supplier payments to review','সরবরাহকারীর দেনা'),book.supplierDues,language,'due')+'</div>'+
 '<div class="split">'+pieChart(t('Expense categories by recorded amount','খাতভিত্তিক ব্যয়ের অংশ'),formatRank(book.expenseCategories),language)+
 transactions(t('Largest recorded expenses','বড় ব্যয়ের তালিকা'),book.expenses,language)+'</div>'+
 barChart(t('Recorded expense-category amounts','ব্যয় খাতের পরিমাণ'),formatRank(book.expenseCategories),language);
 const cashBars=[{label:t('Money in','জমা'),amount:m.cashIn.value},{label:t('Money out','খরচ'),amount:m.cashOut.value}]
  .filter((r):r is {label:string;amount:number}=>r.amount!==null);
 const advice=book.priorities.length?book.priorities.map((p,i)=>'<li><b>'+escape((i+1)+'. '+t(p.title,p.titleBn))+'</b><p>'+escape(t(p.description,p.descriptionBn))+'</p>'+
 '<small>'+escape(p.source.map(s=>s.label).slice(0,4).join(' · '))+'</small></li>').join(''):
 '<li>'+escape(t('No supported recommendation is available from these records.','এই রেকর্ড থেকে নিশ্চিত পরামর্শ নেই।'))+'</li>';
 const p5='<div class="metrics three">'+metric(t('Money in','জমা'),m.cashIn)+metric(t('Money out','খরচ'),m.cashOut)+metric(t('Reconciled bank/cash balance','যাচাইকৃত ব্যাংক/নগদ জের'),m.cashBalance)+'</div>'+
 barChart(t('Recorded cash movement (not reconciled balances)','লিখিত টাকার চলাচল (মিলানো জের নয়)'),cashBars,language)+
 transactions(t('Finance transactions (including transfers as separate entries)','আর্থিক লেনদেন (স্থানান্তর আলাদাভাবে)'),book.financeTransactions,language)+
 '<section class="advice"><h3>'+escape(t('Business advice — based on source evidence','মূল তথ্যভিত্তিক ব্যবসার পরামর্শ'))+'</h3><ol>'+advice+'</ol></section>'+
 note('Bank balances, owner capital, loans, tax and independent audit assurance require verified source ledgers. This document does not certify financial statements.');
 const pages=[
  page(book,1,t('Business overview','ব্যবসার সারাংশ'),p1,language),
  page(book,2,t('Sales, customers & product performance','বিক্রয়, গ্রাহক ও পণ্যের অবস্থা'),p2,language),
  page(book,3,t('Purchases, suppliers & stock','ক্রয়, সরবরাহকারী ও মজুদ'),p3,language),
  page(book,4,t('Dues, payables & expenses','পাওনা, দেনা ও ব্যয়'),p4,language),
  page(book,5,t('Finance movements & advice','অর্থ লেনদেন ও পরামর্শ'),p5,language),
 ];
 const styles=`@page{size:A4 portrait;margin:0}
 *{box-sizing:border-box}html,body{margin:0;padding:0;background:#F0F4F6;color:#102938;font-family:Geist,"Hind Siliguri","Noto Sans Bengali",Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
 .audit-page{position:relative;width:210mm;height:297mm;margin:0 auto 8mm;padding:11mm 12mm 16mm;background:#fff;break-after:page;page-break-after:always;overflow:hidden}
 .audit-page:last-child{break-after:auto;page-break-after:auto}
 .header{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #DCE8E9;padding-bottom:8px}
 .brand{font-size:18px;font-weight:800;letter-spacing:-0.6px}.brand span{color:#087F76}
 .sub-brand{font-size:9px;color:#617687;margin-top:3px}.header-meta{text-align:right;font-size:9px;color:#617687;max-width:47%}
 .header-meta strong,.header-meta span{display:block}.header-meta strong{color:#102938;margin-bottom:3px}
 .page-title{display:flex;align-items:center;gap:10px;margin:16px 0 12px}
 .page-number{color:#087F76;font-size:24px;font-weight:800}.page-title h2{font-size:17px;font-weight:650;line-height:1.3;margin:0}
 .page-content{display:flex;flex-direction:column;gap:10px}.metrics{display:grid;gap:7px}.metrics.four{grid-template-columns:repeat(4,minmax(0,1fr))}
 .metrics.three{grid-template-columns:repeat(3,minmax(0,1fr))}.metrics.two{grid-template-columns:repeat(2,minmax(0,1fr))}
 .metric{border:1px solid #DBE7E9;border-radius:8px;padding:8px;min-width:0;background:#F8FBFB}
 .metric small{display:block;color:#607481;font-size:9px;min-height:23px}
 .metric b{font-size:15px;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .metric i{font-size:8px;color:#9A661B;font-style:normal}.split{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;align-items:start}
 .list{min-width:0}.list h3,.advice h3{margin:0 0 6px;font-size:11px;color:#16384B}
 table{table-layout:fixed;width:100%;border-collapse:collapse;font-size:9px}thead{background:#F2F6F7}
 th{color:#5F7381;text-align:left;font-weight:600;font-size:8px}td,th{border-bottom:1px solid #E0E9EB;padding:5px 4px;overflow-wrap:anywhere;vertical-align:top}
 .num{text-align:right;font-variant-numeric:proportional-nums}.rank{width:18px;color:#647783}
 td strong{font-weight:600}.ref{display:block;font-size:7px;color:#697E88;margin-top:2px;overflow-wrap:anywhere;max-height:17px;overflow:hidden}
 .empty{color:#647783;font-style:italic}.chart-wrap{border:1px solid #DCE6E9;border-radius:8px;padding:7px;background:white}
 .chart-wrap h4{margin:0 0 2px;font-size:10px;font-weight:600;color:#16384B}
 .audit-chart{display:block;width:100%;height:120px;overflow:visible}.pie-layout{display:flex;align-items:center;gap:8px}
 .pie-svg{width:42%;max-width:152px;height:116px;flex:none}.pie-legend{flex:1;min-width:0}
 .legend-row{display:flex;gap:5px;align-items:center;font-size:8px;margin:5px 0;min-width:0}
 .legend-row span:nth-child(2){min-width:0;flex:1;overflow-wrap:anywhere}.legend-row b{margin-left:auto}
 .swatch{width:7px;height:7px;border-radius:2px;flex:none}
 .note{margin:1px 0;padding:6px 8px;font-size:9px;color:#617687;background:#F5F8F9;border-left:3px solid #70B9AC}
 .section-alert{font-size:9px;color:#6B5327;margin:0;background:#FFF9E7;padding:6px 8px}
 .advice{border:1px solid #DCE6E9;border-radius:7px;padding:9px}
 .advice ol{margin:4px 0;padding-left:18px}.advice li{font-size:10px;margin:6px 0}
 .advice p{font-size:9px;margin:2px 0}.advice small{color:#607481;font-size:8px}
 footer{position:absolute;left:12mm;right:12mm;bottom:8mm;display:flex;justify-content:space-between;gap:8px;border-top:1px solid #DBE6E9;padding-top:6px;font-size:8px;color:#607481}
 .page-index{font-weight:700;color:#087F76;font-size:9px}
 @media screen{.audit-page{box-shadow:0 6px 28px #899BAA35}}
 @media print{html,body{background:white}.audit-page{margin:0;box-shadow:none}}`;
 return '<!doctype html><html lang="'+(language==='Bangla'?'bn':'en')+'"><head><meta charset="utf-8"><title>'+escape(t('HisabIQ business audit review','হিসাবআইকিউ ব্যবসা অডিট প্রতিবেদন'))+'</title><style>'+styles+'</style></head><body>'+pages.join('')+'</body></html>';
}
/** Uses a separate print window; no saved output or external bank submission is claimed. */
export function printAuditBook(book:AuditBook,language:UiLanguage):boolean{
 const win=window.open('','_blank');
 if(!win)return false;
 win.opener=null;
 win.document.write(auditBookHtml(book,language));
 win.document.close();
 setTimeout(()=>{win.focus();win.print();},100);
 return true;
}
