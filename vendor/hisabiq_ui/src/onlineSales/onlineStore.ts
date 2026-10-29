import {transactionLineTotal} from '../utils/transactionLines.ts';
import {requireCurrentBundleHandoffs,reviewBundleHandoffs} from '../bundles/bundleHandoff.ts';
import type {Product} from '../types/erp.ts';
import {productUnitFactor} from '../utils/unitChain.ts';
import {getQuoteSnapshot,type Quotation} from '../quotations/quotePreviewStore.ts';

/** Isolated UI preview; no actual stock, cash, courier or Party ledger posting. */
export type SalesChannel='Facebook'|'WhatsApp'|'Instagram'|'YouTube'|'TikTok'|'Website'|'Other';
export type PaymentMode='COD'|'Delivery charge advance'|'Partial advance'|'Fully paid';
export type OrderStage='Draft'|'Confirmed'|'Packed'|'Handed over'|'In transit'|'Delivered'|'Failed delivery'|'Returning'|'Returned'|'Cancelled';
export type CourierName='Steadfast'|'Pathao'|'RedX'|'Sundarban'|'Other'|'Own delivery';
export type OnlineOrderLine={id:string;productId:string;name:string;quantity:number;unit:string;price:number;secondaryQuantity?:number;unitFactor?:number;bundleRevision?:number;bundleRecipeSignature?:string};
export type OnlineOrderDraft={
 channel:SalesChannel;sourceReference:string;partyId?:string;sourceQuoteId?:string;customerName:string;
 phone:string;address:string;lines:OnlineOrderLine[];discount:number;deliveryCharge:number;
 prepaid:number;paymentMode:PaymentMode;note:string;courier?:CourierName;tracking?:string;
};
export type OnlineOrder=OnlineOrderDraft&{
 id:string;number:string;stage:OrderStage;createdAt:string;updatedAt:string;
 timeline:Array<{at:string;action:string;by:'Preview user'|'Courier (manual)';note:string}>;
 courierReportedCod:number;courierFee:number;courierRemitted:number;
};
export type LeadStage='New'|'Contacted'|'Interested'|'Won'|'Lost';
export type SalesLead={id:string;name:string;phone:string;channel:SalesChannel;
 stage:LeadStage;nextFollowUp:string;note:string;orderId?:string;createdAt:string};
export type OnlineSnapshot={orders:OnlineOrder[];leads:SalesLead[];revision:number};
const bdToday=()=>new Date(Date.now()+6*60*60*1000).toISOString().slice(0,10);
const now=()=>new Date().toISOString();
const validMoney=(n:number,label:string)=>{if(!Number.isFinite(n)||n<0||!Number.isSafeInteger(Math.round(n*100))||Math.abs(n*100-Math.round(n*100))>1e-5)
 throw new Error(label+' must be nonnegative BDT with at most two decimals.');return Math.round(n*100);};
const bdt=(paisa:number)=>Number((paisa/100).toFixed(2));
export const lineTotal=(line:OnlineOrderLine)=>transactionLineTotal(line);
export const orderTotals=(order:Pick<OnlineOrderDraft,'lines'|'discount'|'deliveryCharge'|'prepaid'>)=>{
 const item=order.lines.reduce((sum,l)=>{
  const unitPricePaisa=validMoney(l.price,'Unit price');
  const factor=l.unitFactor??1,small=l.secondaryQuantity??0;
  if(!Number.isFinite(factor)||factor<1||!Number.isFinite(small)||small<0||
    (small>0&&(factor<=1||small>=factor)))throw new Error('Invalid compound-unit quantity.');
  const amount=Math.round(unitPricePaisa*(l.quantity+(factor>1?small/factor:0)));
  if(!Number.isSafeInteger(amount))throw new Error('Line total exceeds supported amount.');
  return sum+amount;
 },0);
 const discount=validMoney(order.discount,'Discount'),delivery=validMoney(order.deliveryCharge,'Delivery charge'),advance=validMoney(order.prepaid,'Advance received');
 if(!Number.isSafeInteger(item))throw new Error('Item total exceeds supported amount.');
 if(discount>item)throw new Error('Discount cannot exceed item subtotal.');
 const grand=item-discount+delivery;
 if(advance>grand)throw new Error('Advance cannot exceed order total.');
 return {items:bdt(item),discount:bdt(discount),delivery:bdt(delivery),grand:bdt(grand),advance:bdt(advance),cod:bdt(grand-advance)};
};
export const availableOnlineProducts=(products:readonly Product[])=>products.filter(p=>p.active);
const validPhone=(s:string)=>!s||/^(?:\+?880|0)1[3-9]\d{8}$/.test(s.replace(/[ -]/g,''));
export function validateOnlineOrder(input:OnlineOrderDraft):string[]{
 const errors:string[]=[];
 if(!input.customerName.trim())errors.push('Customer name is required.');
 if(!validPhone(input.phone)||!input.phone.trim())errors.push('Enter a valid Bangladesh mobile number.');
 if(!input.address.trim())errors.push('Delivery address is required.');
 if(!input.lines.length)errors.push('Add at least one product.');
 if(input.sourceReference.length>300||input.note.length>600||input.address.length>300)errors.push('Notes or address are too long.');
 const keys=new Set<string>();
 for(const line of input.lines){
  if(!line.productId||!line.unit||!line.name.trim())errors.push('Each item requires product and unit.');
  if(!Number.isFinite(line.quantity)||line.quantity<=0||!Number.isSafeInteger(line.quantity*1000))errors.push('Quantity must be positive (up to 3 decimals).');
  if(!Number.isFinite(line.secondaryQuantity??0)||(line.secondaryQuantity??0)<0||
   (line.secondaryQuantity??0)>0&&((line.unitFactor??1)<=1||(line.secondaryQuantity??0)>=(line.unitFactor??1)))
   errors.push('Small-unit quantity must be less than one large unit.');
  if(keys.has(line.id))errors.push('Repeated order line ID.');keys.add(line.id);
 }
 try{
  const values=orderTotals(input);
  if(input.paymentMode==='Fully paid'&&values.cod!==0)errors.push('Fully paid order must have no remaining COD.');
  if(input.paymentMode==='COD'&&values.advance!==0)errors.push('Pure COD order cannot include advance.');
  if(input.paymentMode==='Delivery charge advance'&&values.advance!==values.delivery)errors.push('Delivery-only advance must equal delivery charge.');
  if(input.paymentMode==='Partial advance'&&(values.advance<=0||values.cod<=0))errors.push('Partial advance needs payment and outstanding COD.');
 }catch(e){errors.push(e instanceof Error?e.message:'Invalid money amount.');}
 try{requireCurrentBundleHandoffs(input.lines);}catch(e){errors.push(e instanceof Error?e.message:'Package requires review.');}
 return errors;
}
const stamp=(action:string,by:'Preview user'|'Courier (manual)'='Preview user',note='')=>({at:now(),action,by,note});
const seed:OnlineOrder[]=[
 {id:'os-1',number:'ON-000101',channel:'Facebook',sourceReference:'Page inbox #1021',partyId:'c1',
  customerName:'Rahman Hardware',phone:'01711482093',address:'Nawabpur, Dhaka',lines:[
   {id:'os1-1',productId:'p2',name:'LED Bulb 12W',quantity:2,unit:'Box',price:1550}],discount:0,deliveryCharge:100,prepaid:100,
  paymentMode:'Delivery charge advance',note:'Call before delivering',courier:'Steadfast',tracking:'SF-DEMO-1240',
  stage:'In transit',createdAt:'2026-10-08',updatedAt:'2026-10-09',timeline:[{at:'2026-10-08',action:'Created',by:'Preview user',note:'Seed preview'},{at:'2026-10-09',action:'In transit',by:'Courier (manual)',note:'Seed example; not live tracking'}],courierReportedCod:0,courierFee:0,courierRemitted:0},
 {id:'os-2',number:'ON-000102',channel:'WhatsApp',sourceReference:'Chat order',customerName:'Nila Fashion',
  phone:'01811223344',address:'Chattogram, Agrabad',lines:[
  {id:'os2-1',productId:'p5',name:'Wire Mesh Net 3 ft',quantity:3,unit:'Gauge',price:180}],discount:0,deliveryCharge:120,prepaid:0,
  paymentMode:'COD',note:'',courier:'Pathao',tracking:'PT-DEMO-2201',stage:'Delivered',createdAt:'2026-10-05',updatedAt:'2026-10-08',
  timeline:[{at:'2026-10-05',action:'Created',by:'Preview user',note:'Seed preview'},{at:'2026-10-08',action:'Delivered',by:'Courier (manual)',note:'COD remittance not verified'}],courierReportedCod:660,courierFee:85,courierRemitted:0},
 {id:'os-3',number:'ON-000103',channel:'Instagram',sourceReference:'IG DM',customerName:'Samira',
  phone:'01722556677',address:'Dhanmondi, Dhaka',lines:[
  {id:'os3-1',productId:'p1',name:'PVC Pipe 1" (20 ft)',quantity:1,unit:'Pcs',price:420}],discount:0,deliveryCharge:80,prepaid:500,
  paymentMode:'Fully paid',note:'',courier:'Own delivery',tracking:'OWN-DEMO-3',stage:'Delivered',createdAt:'2026-10-04',updatedAt:'2026-10-05',
  timeline:[{at:'2026-10-04',action:'Created',by:'Preview user',note:'Full advance'},{at:'2026-10-05',action:'Delivered',by:'Courier (manual)',note:'Local delivery'}],courierReportedCod:0,courierFee:0,courierRemitted:0}
];
let state:OnlineSnapshot={orders:seed,leads:[
 {id:'lead-1',name:'Raihan',phone:'01912345678',channel:'Facebook',stage:'Interested',nextFollowUp:'2026-10-11',note:'Asked about bulk lighting price',createdAt:'2026-10-09'},
 {id:'lead-2',name:'Mou',phone:'01713556677',channel:'Instagram',stage:'New',nextFollowUp:'2026-10-12',note:'Interested in reels promotion',createdAt:'2026-10-09'}],revision:0};
const listeners=new Set<()=>void>();let seq=104;
export const getOnlineSnapshot=()=>state;
export const subscribeOnline=(f:()=>void)=>{listeners.add(f);return()=>listeners.delete(f)};
export function resetOnlinePreviewForTest(){state={orders:seed,leads:[],revision:0};seq=104;listeners.forEach(f=>f());}
function replaceOrder(old:OnlineOrder,newOrder:OnlineOrder){state={...state,revision:state.revision+1,orders:state.orders.map(o=>o.id===old.id?newOrder:o)};listeners.forEach(f=>f());return newOrder;}
function publishOrder(o:OnlineOrder){state={...state,revision:state.revision+1,orders:[o,...state.orders]};listeners.forEach(f=>f());return o;}
function orderById(id:string){const found=state.orders.find(o=>o.id===id);if(!found)throw new Error('Online order not found.');return found;}
/** A quote is commercial context; customer delivery details and received advance require review. */
export function draftFromAcceptedQuote(quote:Quotation):OnlineOrderDraft{
 if(quote.status!=='Accepted')throw new Error('Only accepted quotations can be converted to online orders.');
 requireCurrentBundleHandoffs(quote.lines);
 return {channel:'Other',sourceReference:'Quotation '+quote.number,sourceQuoteId:quote.id,
  partyId:quote.partyId,customerName:quote.customerName,phone:quote.customerPhone??'',
  address:'',note:quote.note,discount:quote.discount,deliveryCharge:0,prepaid:0,paymentMode:'COD',
  lines:quote.lines.map((line,i)=>({id:'quote-line-'+i,productId:line.productId,name:line.name,
    quantity:line.quantity,unit:line.unit,price:line.price,secondaryQuantity:line.secondaryQuantity,unitFactor:line.unitFactor,
    bundleRevision:line.bundleRevision,bundleRecipeSignature:line.bundleRecipeSignature}))};
}
function requireQuoteSnapshot(draft:OnlineOrderDraft){
 if(!draft.sourceQuoteId)return;
 const quote=getQuoteSnapshot().quotes.find(q=>q.id===draft.sourceQuoteId);
 if(!quote||quote.status!=='Accepted')throw new Error('Linked quotation must still be accepted.');
 const source=draftFromAcceptedQuote(quote);
 if(JSON.stringify(source.lines)!==JSON.stringify(draft.lines)||source.discount!==draft.discount)
  throw new Error('Linked quotation prices, units and discount are locked. Create an independent order to renegotiate.');
}
export function existingOrderForQuote(quoteId:string):OnlineOrder|undefined{
 return state.orders.find(order=>order.sourceQuoteId===quoteId);
}
/** Prepares a handoff only; no invoice ID, stock, ledger or payment posting. */
export function preparePosHandoff(orderId:string,products:readonly Product[]){
 const order=orderById(orderId);
 if(!['Confirmed','Packed'].includes(order.stage))throw new Error('Confirm the online order before opening POS. Handed-over orders need an explicit correction workflow.');
 const lines=order.lines.map((line,index)=>{
  const product=products.find(p=>p.id===line.productId&&p.active);
  if(!product)throw new Error('Product unavailable in POS: '+line.name);
  if(productUnitFactor(product,line.unit)<=0)
   throw new Error('Product unit no longer matches POS: '+line.name);
  if(!Number.isFinite(line.quantity)||line.quantity<=0||!Number.isSafeInteger(line.quantity*1000))
   throw new Error('Unsupported order quantity for POS.');
  requireCurrentBundleHandoffs([line],products);
  return {key:'online-'+order.id+'-'+index,productId:product.id,qty:String(line.quantity),
   secondaryQty:line.secondaryQuantity?String(line.secondaryQuantity):'',unit:line.unit,price:String(line.price),
   bundleRevision:line.bundleRevision,bundleRecipeSignature:line.bundleRecipeSignature};
 });
 return {orderId:order.id,number:order.number,customerName:order.customerName,phone:order.phone,
  address:order.address,partyId:order.partyId,lines,discount:order.discount,
  advancePreview:order.prepaid,deliveryCharge:order.deliveryCharge};
}
export function createOnlineOrder(input:OnlineOrderDraft):OnlineOrder{
 if(input.sourceQuoteId){
  const previous=existingOrderForQuote(input.sourceQuoteId);
  if(previous)return previous; // idempotent, no new row or implicit mutation
 }
 requireQuoteSnapshot(input);
 const errors=validateOnlineOrder(input);if(errors.length)throw new Error(errors.join(' '));
 const number='ON-'+String(seq++).padStart(6,'0');
 const created:OnlineOrder={...input,lines:input.lines.map(l=>({...l})),id:'online-'+number,number,stage:'Draft',
 createdAt:now(),updatedAt:now(),timeline:[stamp('Created')],courierReportedCod:0,courierFee:0,courierRemitted:0};
 return publishOrder(created);
}
export function reviseOnlineDraft(id:string,input:OnlineOrderDraft){
 const original=orderById(id);
 if(original.stage!=='Draft')throw new Error('Confirmed online orders cannot be silently edited; use a correction workflow.');
 requireQuoteSnapshot(input);
 if(original.sourceQuoteId!==input.sourceQuoteId)throw new Error('Cannot change linked quotation identity.');
 const errors=validateOnlineOrder(input);if(errors.length)throw new Error(errors.join(' '));
 return replaceOrder(original,{...original,...input,lines:input.lines.map(l=>({...l})),updatedAt:now(),
 timeline:[...original.timeline,stamp('Draft revised')]});
}
const moves:Record<OrderStage,OrderStage[]>={
 Draft:['Confirmed','Cancelled'],Confirmed:['Packed','Cancelled'],Packed:['Handed over','Cancelled'],
 'Handed over':['In transit','Delivered','Failed delivery'], 'In transit':['Delivered','Failed delivery'],
 Delivered:[], 'Failed delivery':['In transit','Returning'],Returning:['Returned','In transit'],
 Returned:[],Cancelled:[]
};
export function updateOrderStage(id:string,next:OrderStage,note=''){
 const original=orderById(id);
 if(!moves[original.stage].includes(next))throw new Error(original.stage+' → '+next+' is not a valid delivery transition.');
 if(next==='Confirmed'||next==='Packed')requireCurrentBundleHandoffs(original.lines);
 if(next==='Handed over'&&(!original.courier||!original.tracking?.trim()))
  throw new Error('Choose courier and provide tracking number before handover.');
 return replaceOrder(original,{...original,stage:next,updatedAt:now(),timeline:[...original.timeline,stamp(next,'Preview user',note)]});
}
export function setOrderCourier(id:string,courier:CourierName,tracking:string){
 const original=orderById(id);
 if(!['Draft','Confirmed','Packed'].includes(original.stage))throw new Error('Courier cannot be changed after handover.');
 if(!tracking.trim())throw new Error('Tracking/reference number required.');
 return replaceOrder(original,{...original,courier,tracking:tracking.trim(),updatedAt:now(),
 timeline:[...original.timeline,stamp('Courier assigned','Preview user',courier+' / '+tracking.trim())]});
}
export function recordCourierCod(id:string,amount:number,fee:number){
 const original=orderById(id);
 if(original.stage!=='Delivered')throw new Error('Courier collected COD only after delivery is confirmed.');
 if(original.courier==='Own delivery')throw new Error('Own delivery cash must be recorded through payment workflow.');
 const expected=orderTotals(original).cod;
 const reported=bdt(validMoney(amount,'Courier COD report'));
 const deduction=bdt(validMoney(fee,'Courier fee'));
 if(reported>expected)throw new Error('Courier collection cannot exceed expected COD.');
 if(deduction>reported)throw new Error('Courier deduction exceeds collected COD.');
 if(original.courierRemitted>reported-deduction)throw new Error('Cannot reduce reported COD below previous remittance.');
 return replaceOrder(original,{...original,courierReportedCod:reported,courierFee:deduction,updatedAt:now(),
 timeline:[...original.timeline,stamp('Courier collection reported','Preview user','Manually entered, not a bank receipt')]});
}
export function recordCourierPayout(id:string,amount:number,reference:string){
 const original=orderById(id);
 if(original.stage!=='Delivered'||original.courierReportedCod<=0)throw new Error('Courier COD report must be recorded before payout.');
 if(!reference.trim())throw new Error('Payout reference is required.');
 const payout=bdt(validMoney(amount,'Payout'));
 if(payout<=0||payout>Math.round((original.courierReportedCod-original.courierFee-original.courierRemitted)*100)/100)
  throw new Error('Payout exceeds unsettled courier clearing.');
 return replaceOrder(original,{...original,courierRemitted:bdt(Math.round(original.courierRemitted*100)+Math.round(payout*100)),updatedAt:now(),
 timeline:[...original.timeline,stamp('Courier payout reported','Preview user',reference.trim()+' · Preview; no bank posting')]});
}
export const courierClearing=(order:OnlineOrder)=>({
 expected:orderTotals(order).cod,reported:order.courierReportedCod,fee:order.courierFee,
 remitted:order.courierRemitted,pending:bdt(Math.max(0,Math.round((order.courierReportedCod-order.courierFee-order.courierRemitted)*100))),
 gap:bdt(Math.max(0,Math.round((orderTotals(order).cod-order.courierReportedCod)*100)))
});
export function upsertSalesLead(input:Omit<SalesLead,'id'|'createdAt'>,id?:string):SalesLead{
 if(!input.name.trim()||!validPhone(input.phone)||!input.phone.trim())throw new Error('Lead requires name and a valid Bangladesh mobile number.');
 if(input.nextFollowUp&&!/^\d{4}-\d{2}-\d{2}$/.test(input.nextFollowUp))throw new Error('Invalid follow-up date.');
 const current=id?state.leads.find(l=>l.id===id):undefined;
 if(id&&!current)throw new Error('Lead not found.');
 const record:SalesLead={...input,id:current?.id??'online-lead-'+seq++,createdAt:current?.createdAt??bdToday()};
 state={...state,revision:state.revision+1,leads:current?state.leads.map(l=>l.id===id?record:l):[record,...state.leads]};
 listeners.forEach(f=>f());return record;
}

/** Explicit user-confirmed correction for a non-posted standalone order.
 * Linked quotations must instead be revised/reapproved to preserve commercial approval.
 */
export function acknowledgeOrderBundleChanges(id:string):OnlineOrder{
 const original=orderById(id);
 if(!['Draft','Confirmed','Packed'].includes(original.stage))
  throw new Error('Delivered or handed-over orders need a separate correction workflow.');
 if(original.sourceQuoteId)throw new Error('Revise and reaccept the linked quotation before changing package components.');
 const updatedLines=reviewBundleHandoffs(original.lines);
 const issues=updatedLines.some((row,i)=>row.productId!==original.lines[i].productId||
  row.price!==original.lines[i].price||row.quantity!==original.lines[i].quantity);
 if(issues)throw new Error('Bundle review cannot change quantity, price or product identity.');
 return replaceOrder(original,{...original,lines:updatedLines,updatedAt:now(),
  timeline:[...original.timeline,stamp('Package recipe reviewed','Preview user',
   'Current package components explicitly accepted for POS preview; order price and quantity unchanged.')]});
}
