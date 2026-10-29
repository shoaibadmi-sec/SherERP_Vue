import {transactionLineTotal} from '../utils/transactionLines.ts';
import {requireCurrentBundleHandoffs} from '../bundles/bundleHandoff.ts';
/** In-memory quotation preview; no invoice, payment, or stock posting. */
export type QuoteStatus='Draft'|'Sent'|'Accepted'|'Declined';
export type QuoteLine={id:string;productId:string;name:string;unit:string;quantity:number;price:number;secondaryQuantity?:number;unitFactor?:number;bundleRevision?:number;bundleRecipeSignature?:string};
export type Quotation={
 id:string;number:string;date:string;validUntil:string;
 partyId?:string;customerName:string;customerPhone?:string;
 lines:QuoteLine[];discount:number;note:string;status:QuoteStatus;
 updatedAt:string;
};
export type QuoteDraft=Omit<Quotation,'id'|'number'|'updatedAt'>;
export type QuoteSnapshot={revision:number;quotes:readonly Quotation[]};
const today=()=>new Date(Date.now()+6*60*60*1000).toISOString().slice(0,10);
const money=(n:number)=>Math.round((n+Number.EPSILON)*100)/100;
export const quoteLineTotal=(line:QuoteLine)=>transactionLineTotal(line);
export const quoteSubtotal=(quote:Pick<Quotation,'lines'>)=>money(quote.lines.reduce((sum,line)=>sum+quoteLineTotal(line),0));
export const quoteTotal=(quote:Pick<Quotation,'lines'|'discount'>)=>money(Math.max(0,quoteSubtotal(quote)-quote.discount));
export const quoteDisplayStatus=(quote:Quotation,asOf=today()):QuoteStatus|'Expired'=>
 quote.status==='Sent'&&quote.validUntil<asOf?'Expired':quote.status;

const initial:Quotation[]=[
 {id:'quote-preview-1',number:'QT-000041',date:'2026-10-05',validUntil:'2026-10-20',
  partyId:'c1',customerName:'Rahman Hardware',customerPhone:'01711-482093',
  lines:[{id:'line-1',productId:'p2',name:'LED Bulb 12W',unit:'Box',quantity:2,price:1550},
   {id:'line-2',productId:'p1',name:'PVC Pipe 1" (20 ft)',unit:'Pcs',quantity:5,price:420}],
  discount:100,note:'Price valid until date shown. Delivery charges extra.',status:'Sent',updatedAt:'2026-10-05'},
 {id:'quote-preview-2',number:'QT-000042',date:'2026-10-08',validUntil:'2026-10-15',
  partyId:'c2',customerName:'Hossain Electric',customerPhone:'01912-774310',
  lines:[{id:'line-1',productId:'p4',name:'Electric Wire 1.5 rm',unit:'Coil',quantity:3,price:2850}],
  discount:0,note:'',status:'Draft',updatedAt:'2026-10-08'}
];
let snapshot:QuoteSnapshot={revision:0,quotes:initial};
const watchers=new Set<()=>void>();
let counter=43;
export const getQuoteSnapshot=()=>snapshot;
export const subscribeQuotes=(listener:()=>void)=>{watchers.add(listener);return()=>{watchers.delete(listener);};};
function publish(quotes:Quotation[]){snapshot={quotes,revision:snapshot.revision+1};watchers.forEach(fn=>fn());}
function validDate(date:string){
 return /^\d{4}-\d{2}-\d{2}$/.test(date)&&!Number.isNaN(Date.parse(date+'T12:00:00Z'))&&
  new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date;
}
export function validateQuoteDraft(input:QuoteDraft):string[]{
 const errors:string[]=[];
 if(!input.customerName.trim())errors.push('Customer name is required.');
 if(!validDate(input.date)||!validDate(input.validUntil)||input.validUntil<input.date)
  errors.push('Choose a valid issue date and later expiry date.');
 if(!input.lines.length)errors.push('Add at least one product.');
 const ids=new Set<string>();
 for(const line of input.lines){
  if(!line.name.trim()||!line.productId||!line.unit)errors.push('Each line needs a product and unit.');
  if(ids.has(line.id))errors.push('Duplicate line ID.');ids.add(line.id);
  if(!Number.isFinite(line.quantity)||line.quantity<=0||!Number.isFinite(line.price)||line.price<0)
   errors.push('Quantity must be positive and price cannot be negative.');
  if(!Number.isFinite(line.secondaryQuantity??0)||(line.secondaryQuantity??0)<0||
   !Number.isFinite(line.unitFactor??1)||(line.unitFactor??1)<1||
   (line.secondaryQuantity??0)>0&&((line.unitFactor??1)<=1||(line.secondaryQuantity??0)>=(line.unitFactor??1)))
   errors.push('Small-unit quantity must be less than one large unit.');
  if(!Number.isFinite(quoteLineTotal(line))||quoteLineTotal(line)>1e11)errors.push('Line amount is too large.');
 }
 const subtotal=quoteSubtotal(input);
 if(!Number.isFinite(input.discount)||input.discount<0||input.discount>subtotal)
  errors.push('Discount must be between zero and subtotal.');
 if(input.note.length>600)errors.push('Note cannot exceed 600 characters.');
 try{requireCurrentBundleHandoffs(input.lines);}catch(e){errors.push(e instanceof Error?e.message:'Package requires review.');}
 return errors;
}
function safeDraft(input:QuoteDraft):QuoteDraft{
 const errors=validateQuoteDraft(input);
 if(errors.length)throw new Error(errors.join(' '));
 return {...input,customerName:input.customerName.trim(),customerPhone:input.customerPhone?.trim(),
  note:input.note.trim(),lines:input.lines.map(l=>({...l,name:l.name.trim(),price:money(l.price)})),
  discount:money(input.discount)};
}
export function saveQuote(input:QuoteDraft,existingId?:string):Quotation{
 const draft=safeDraft(input);
 if(existingId){
  const original=snapshot.quotes.find(q=>q.id===existingId);
  if(!original)throw new Error('Quotation not found.');
  if(original.status==='Declined')throw new Error('Declined quotation cannot be edited. Duplicate it instead.');
  const updated:Quotation={...draft,id:original.id,number:original.number,status:'Draft',updatedAt:today()};
  publish(snapshot.quotes.map(q=>q.id===existingId?updated:q));return updated;
 }
 const number='QT-'+String(counter++).padStart(6,'0');
 const next:Quotation={...draft,id:'quote-preview-'+number,number,updatedAt:today(),status:'Draft'};
 publish([next,...snapshot.quotes]);return next;
}
export function duplicateQuote(id:string):Quotation{
 const source=snapshot.quotes.find(q=>q.id===id);if(!source)throw new Error('Quotation not found.');
 return saveQuote({...source,date:today(),validUntil:today(),status:'Draft',lines:source.lines.map((l,index)=>({...l,id:'copy-'+index})),discount:source.discount});
}
export function changeQuoteStatus(id:string,status:QuoteStatus):Quotation{
 const original=snapshot.quotes.find(q=>q.id===id);if(!original)throw new Error('Quotation not found.');
 const transitions:Record<QuoteStatus,QuoteStatus[]>={Draft:['Sent'],Sent:['Accepted','Declined','Draft'],Accepted:['Draft'],Declined:[]};
 if(!transitions[original.status].includes(status))throw new Error('This quotation status change is not allowed.');
 if(status==='Sent'||status==='Accepted')requireCurrentBundleHandoffs(original.lines);
 if(status==='Accepted'&&quoteDisplayStatus(original)==='Expired')throw new Error('Expired quotation cannot be accepted; revise it first.');
 const next:Quotation={...original,status,updatedAt:today()};
 publish(snapshot.quotes.map(q=>q.id===id?next:q));return next;
}
export function deleteDraftQuote(id:string):void{
 const original=snapshot.quotes.find(q=>q.id===id);if(!original)throw new Error('Quotation not found.');
 if(original.status!=='Draft')throw new Error('Only draft quotations may be deleted.');
 publish(snapshot.quotes.filter(q=>q.id!==id));
}
