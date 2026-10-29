import { SalesWideToolbar } from '../components/sales/SalesWideToolbar';
import { SalesMobileSummary, SalesMobileToolbar, SalesMobileMore, SalesMobileRecord } from '../components/sales/SalesMobileLayout';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { MotionTabList, MotionTabIndicator } from '../motion/MotionTabList';
import {matchesSearch as fuzzyMatch} from '../utils/fuzzySearch';
import '../notifications/erpNotificationRules'; // Keep existing module initialization.
import {useEffect,useMemo,useState,useSyncExternalStore} from 'react';
import {Link,useNavigate,useSearchParams} from 'react-router-dom';
import {toast} from 'sonner';
import {ErpNotificationsWorkbench} from './ErpNotifications';
import {Check,ChevronRight,FileText,Plus} from 'lucide-react';
import {PageHeader} from '../components/PageHeader';
import {Button} from '../components/Button';
import {Input} from '../components/Input';
import {AppSelect} from '../components/AppSelect';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription,DialogFooter} from '../components/Dialog';
import {StatusBadge} from '../components/StatusBadge';
import {availableProducts,availableParties,createPreviewProduct} from '../data/erpDemoStore';
import {TransactionCartEditor} from '../components/transactions/TransactionCartEditor';
import {AddProductDialog} from '../components/products/AddProductDialog';
import type {Product} from '../types/erp';
import {taka} from '../utils/currency';
import {getQuoteSnapshot} from '../quotations/quotePreviewStore';
import {useUiCopy} from '../i18n/useUiCopy';
import {onlineLabel,onlineOptions} from '../i18n/onlineSalesCopy';
import {availableProducts as previewPosProducts} from '../data/erpDemoStore';
import {captureBundleHandoff,inspectBundleHandoffs,reviewBundleHandoffs} from '../bundles/bundleHandoff';
import {FulfillmentDocumentPreview,fulfillmentPrintCss,printFulfillment,documentTitles,type FulfillmentDocument} from '../components/online/FulfillmentDocumentPreview';
import {fulfillmentLabel} from '../i18n/fulfillmentCopy';
import {orderTotals,createOnlineOrder,reviseOnlineDraft,updateOrderStage,setOrderCourier,recordCourierCod,recordCourierPayout,courierClearing,draftFromAcceptedQuote,existingOrderForQuote,preparePosHandoff,
 getOnlineSnapshot,subscribeOnline,upsertSalesLead,acknowledgeOrderBundleChanges,type SalesChannel,type PaymentMode,type OnlineOrderDraft,type OnlineOrder,type OrderStage,type CourierName,type SalesLead,type LeadStage
} from '../onlineSales/onlineStore';

const channels:SalesChannel[]=['Facebook','WhatsApp','Instagram','YouTube','TikTok','Website','Other'];
const courierNames:CourierName[]=['Steadfast','Pathao','RedX','Sundarban','Other','Own delivery'];
const money=(n:number)=>Number(n.toFixed(2));
const dateNow=()=>new Date(Date.now()+6*3600000).toISOString().slice(0,10);
type View='Orders'|'Courier & COD'|'CRM Leads'|'SMS Rules';
const stages:OrderStage[]=['Draft','Confirmed','Packed','Handed over','In transit','Delivered','Failed delivery','Returning','Returned','Cancelled'];
const paymentModes:PaymentMode[]=['COD','Delivery charge advance','Partial advance','Fully paid'];
const stageTone=(s:OrderStage)=>s==='Delivered'?'success':s==='Cancelled'||s==='Failed delivery'||s==='Returned'?'danger':s==='Draft'?'neutral':s==='Confirmed'||s==='Packed'?'info':'warning';
const draftNew=():OnlineOrderDraft=>({channel:'Facebook',sourceReference:'',customerName:'',phone:'',address:'',
 lines:[],discount:0,deliveryCharge:100,prepaid:0,paymentMode:'COD',note:''});
function OrderEditor({original,initialDraft,onClose}:{original:OnlineOrder|null;initialDraft?:OnlineOrderDraft|null;onClose:()=>void}){
  const {language,showHelper}=useUiCopy();
  const ol=(value:string)=>onlineLabel(language,value);
 const [draft,setDraft]=useState<OnlineOrderDraft>(original?{
  channel:original.channel,sourceReference:original.sourceReference,partyId:original.partyId,sourceQuoteId:original.sourceQuoteId,customerName:original.customerName,
  phone:original.phone,address:original.address,lines:original.lines.map(x=>({...x})),discount:original.discount,deliveryCharge:original.deliveryCharge,
  prepaid:original.prepaid,paymentMode:original.paymentMode,note:original.note,courier:original.courier,tracking:original.tracking
 }:initialDraft??draftNew);
 const [error,setError]=useState('');
 const [creatingProduct,setCreatingProduct]=useState(false);
 const products=availableProducts().filter(p=>p.active);
 const bundleIssues=inspectBundleHandoffs(draft.lines,products);
 const customers=availableParties().filter(p=>p.roles.includes('Customer'));
 const patch=(next:Partial<OnlineOrderDraft>)=>setDraft(prev=>({...prev,...next}));
 const totals=useMemo(()=>{try{return orderTotals(draft);}catch{return null;}},[draft]);
 const paymentSwitch=(value:string)=>{
  const mode=value as PaymentMode;
  const total=money(draft.lines.reduce((s,l)=>s+l.quantity*l.price+(l.secondaryQuantity??0)*l.price/(l.unitFactor??1),0)-draft.discount+draft.deliveryCharge);
  patch({paymentMode:mode,prepaid:mode==='COD'?0:mode==='Delivery charge advance'?draft.deliveryCharge:
    mode==='Fully paid'?Math.max(0,total):Math.min(Math.max(1,draft.deliveryCharge),Math.max(1,total/2))});
 };
 const addProduct=(p:Product)=>{
  const unit=p.altUnit&&p.stockViewUnit===p.altUnit.unit?p.altUnit.unit:p.unit;
  patch({lines:[...draft.lines,{id:'on-line-'+(globalThis.crypto?.randomUUID?.()??Date.now().toString()),
   productId:p.id,name:p.name,unit,quantity:1,price:unit===p.altUnit?.unit?(p.altUnit.price??p.sellPrice*p.altUnit.factor):p.sellPrice,
   unitFactor:p.altUnit&&unit===p.altUnit.unit?p.altUnit.factor:1,secondaryQuantity:0,...captureBundleHandoff(p)}]});
 };
 const updateLine=(id:string,next:Partial<OnlineOrderDraft['lines'][number]>)=>
  patch({lines:draft.lines.map(l=>l.id===id?{...l,...next}:l)});
 const submit=()=>{
  setError('');
  try{const saved=original?reviseOnlineDraft(original.id,draft):createOnlineOrder(draft);
   toast.success(saved.number+' · '+ol('saved as preview draft'),{description:ol('No stock, invoice, money or courier API was posted.')});
   onClose();
  }catch(e){setError(e instanceof Error?e.message:ol('Invalid online order.'));}
 };
 return <Dialog open={true} onOpenChange={value=>!value&&onClose()}>
 <DialogContent className="sales-mobile-dialog max-h-[94vh] w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-4xl" role="dialog" aria-label={ol(original?'Edit online order':'New online order')}>
  <DialogHeader><DialogTitle>{ol(original?'Edit order draft':'New online order')} {showHelper&&<span className="font-bn text-xs font-normal text-ink-500">· অনলাইন অর্ডার</span>}</DialogTitle>
   <DialogDescription>{ol('Manual order entry for Facebook, WhatsApp, Instagram or other channels. Draft only — no accounting posting.')}</DialogDescription></DialogHeader>
  <div className="grid gap-3 sm:grid-cols-2">
   <label className="space-y-1 text-xs font-medium text-ink">{ol('Selling channel')}{showHelper&&<> · <span className="font-bn text-ink-400">বিক্রির উৎস</span></>}
    <AppSelect label={ol("Sales channel")} value={draft.channel} options={onlineOptions(language,channels)} onChange={v=>patch({channel:v as SalesChannel})}/>
   </label>
   <label className="space-y-1 text-xs font-medium text-ink">{ol("Inbox / live / campaign reference")}
    <Input aria-label={ol("Source reference")} value={draft.sourceReference} onChange={e=>patch({sourceReference:e.target.value})} placeholder={ol("Page inbox, DM or live order ID")}/>
   </label>
   <label className="space-y-1 text-xs font-medium text-ink">{ol('Existing customer (optional)')}
    <AppSelect label={ol("Choose existing customer")} value={draft.partyId??''}
      options={[{value:'',label:ol('Walk-in / new contact')},...customers.map(p=>({value:p.id,label:p.name+' · '+p.phone}))]}
      onChange={id=>{const c=customers.find(p=>p.id===id);patch({partyId:c?.id,customerName:c?.name??'',phone:c?.phone?.replace(/[ -]/g,'')??''});}}/>
   </label>
   <label className="space-y-1 text-xs font-medium text-ink">{ol("Customer name")}
    <Input aria-label={ol("Online customer name")} value={draft.customerName} onChange={e=>patch({customerName:e.target.value,partyId:undefined})} placeholder={ol("Buyer name")}/>
   </label>
   <label className="space-y-1 text-xs font-medium text-ink">{ol('Mobile')}{showHelper&&<> · <span className="font-bn text-ink-400">মোবাইল</span></>}
    <Input aria-label={ol("Customer mobile")} value={draft.phone} onChange={e=>patch({phone:e.target.value})} placeholder="017XXXXXXXX"/>
   </label>
   <label className="space-y-1 text-xs font-medium text-ink">{ol('Delivery address')}{showHelper&&<> · <span className="font-bn text-ink-400">ঠিকানা</span></>}
    <Input aria-label={ol("Delivery address")} value={draft.address} onChange={e=>patch({address:e.target.value})} placeholder={ol("Area, city, house/road")}/>
   </label>
  </div>
  {draft.sourceQuoteId&&<p className="rounded-lg border border-teal-300 bg-teal-50/40 p-2 text-xs text-teal-800 dark:text-teal-300">
    {ol("Linked accepted quotation: product lines, unit prices and discount are locked. Confirm customer phone/address before creating this order.")}
   </p>}
  <div className="space-y-2 border-t border-border pt-3">
   <div className="flex items-center justify-between">
    <strong className="text-sm text-ink">{ol('Products')}{showHelper&&<> · <span className="font-bn font-normal">পণ্য</span></>}</strong>
    <span className="text-xs text-ink-500">{draft.lines.length} {ol('lines · POS-style entry')}</span>
   </div>
   <TransactionCartEditor mode="online" products={products} lines={draft.lines}
    locked={Boolean(draft.sourceQuoteId)} onAdd={addProduct} onUpdate={updateLine}
    onRemove={id=>patch({lines:draft.lines.filter(x=>x.id!==id)})}
    onMove={(id,delta)=>{
     const index=draft.lines.findIndex(line=>line.id===id),next=index+delta;
     if(index<0||next<0||next>=draft.lines.length)return;
     const reordered=[...draft.lines];[reordered[index],reordered[next]]=[reordered[next],reordered[index]];
     patch({lines:reordered});
    }} onCreate={()=>setCreatingProduct(true)}/>
  </div>
  <div className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
   <div className="space-y-2">
    <label className="block space-y-1 text-xs font-medium text-ink">{ol('Payment type')}{showHelper&&<> · <span className="font-bn text-ink-400">পেমেন্ট পদ্ধতি</span></>}
     <AppSelect label={ol("Order payment mode")} value={draft.paymentMode} options={onlineOptions(language,paymentModes)} onChange={paymentSwitch}/></label>
    <label className="block space-y-1 text-xs font-medium text-ink">{ol('Advance actually received (preview)')}
     <Input aria-label={ol("Prepaid amount")} type="number" min="0" step="any" value={draft.prepaid}
      disabled={draft.paymentMode==='COD'||draft.paymentMode==='Delivery charge advance'||draft.paymentMode==='Fully paid'}
      onChange={e=>patch({prepaid:Number(e.target.value)})}/></label>
    <label className="block space-y-1 text-xs font-medium text-ink">{ol("Order note")}
     <Input aria-label={ol("Online order note")} value={draft.note} onChange={e=>patch({note:e.target.value})} placeholder={ol("Special instructions")}/></label>
   </div>
   <div className="space-y-2 rounded-lg bg-ink-50 p-3 text-xs text-ink">
    <div className="flex justify-between"><span>{ol("Products")}</span><strong>{totals?taka(totals.items):'—'}</strong></div>
    <label className="flex items-center justify-between gap-2">{ol("Discount")}
     <Input aria-label={ol("Online discount")} disabled={Boolean(draft.sourceQuoteId)} type="number" min="0" step="any" value={draft.discount} className="w-28 text-right"
      onChange={e=>patch({discount:Number(e.target.value)})}/></label>
    <label className="flex items-center justify-between gap-2">{ol("Customer delivery charge")}
     <Input aria-label={ol("Delivery charge")} type="number" min="0" step="any" value={draft.deliveryCharge} className="w-28 text-right"
      onChange={e=>patch({deliveryCharge:Number(e.target.value),prepaid:draft.paymentMode==='Delivery charge advance'?Number(e.target.value):draft.prepaid})}/></label>
    <div className="flex justify-between border-t border-border pt-2"><strong>{ol("Grand total")}</strong><strong>{totals?taka(totals.grand):'Invalid'}</strong></div>
    <div className="flex justify-between"><span>{ol("Received advance")}</span><strong>{totals?taka(totals.advance):'—'}</strong></div>
    <div className="flex justify-between text-sm font-semibold text-teal-700 dark:text-teal-400"><span>{ol("Courier COD to collect")}</span><span>{totals?taka(totals.cod):'—'}</span></div>
    <p className="text-[11px] text-ink-500">{ol('Advance is a preview value; no Cash/Bank/MFS account is posted.')}</p>
   </div>
  </div>
  {bundleIssues.length>0&&<div role="alert" className="space-y-2 rounded-lg border border-warning bg-warning-bg/30 p-3 text-xs text-ink">
    <strong>Package contents changed · প্যাকেজের পণ্য বদলেছে</strong>
    {bundleIssues.map(issue=><div key={issue.productId}><p className="font-medium">{issue.name}: {issue.reason}</p><p>Saved: {issue.before}</p><p>Current: {issue.after}</p></div>)}
    {!draft.sourceQuoteId&&<Button size="sm" variant="outline" onClick={()=>{try{patch({lines:reviewBundleHandoffs(draft.lines,products)});}catch(e){setError(e instanceof Error?e.message:'Cannot review package.');}}}>Use current package recipe · নতুন প্যাকেজ ব্যবহার করুন</Button>}
    {draft.sourceQuoteId&&<p>Revise and reaccept the linked quotation first. Confirmed prices and lines cannot silently change.</p>}
   </div>}
  {error&&<p role="alert" className="rounded-lg bg-danger-bg p-2 text-xs text-danger">{error}</p>}
  <DialogFooter><Button variant="outline" onClick={onClose}>{ol("Cancel")}</Button><Button onClick={submit}><Check className="size-4"/> {ol("Save order draft")}</Button></DialogFooter>
 <AddProductDialog open={creatingProduct} onOpenChange={setCreatingProduct} onSave={(product,opening)=>{
   createPreviewProduct(product,opening);addProduct(product);setCreatingProduct(false);
  }}/>
 </DialogContent></Dialog>;
}
type OrderAction='courier'|'cod'|'payout';
function OrderActionDialog({order,action,onClose}:{order:OnlineOrder;action:OrderAction;onClose:()=>void}){
  const {language}=useUiCopy();
  const ol=(value:string)=>onlineLabel(language,value);
 const [courier,setCourier]=useState<CourierName>(order.courier??'Steadfast');
 const [tracking,setTracking]=useState(order.tracking??'');
 const [collected,setCollected]=useState(String(orderTotals(order).cod));
 const [fee,setFee]=useState('0');
 const [payout,setPayout]=useState('');
 const [reference,setReference]=useState('');
 const [error,setError]=useState('');
 const submit=()=>{try{
  if(action==='courier')setOrderCourier(order.id,courier,tracking);
  else if(action==='cod')recordCourierCod(order.id,Number(collected),Number(fee));
  else recordCourierPayout(order.id,Number(payout),reference);
  toast.success(ol('Manual preview updated — no courier or bank API called.'));onClose();
 }catch(e){setError(e instanceof Error?e.message:ol('Cannot update.'));}};
 return <Dialog open onOpenChange={v=>!v&&onClose()}><DialogContent role="dialog" aria-label={ol('Courier action')} className="sales-mobile-dialog sm:max-w-lg">
  <DialogHeader><DialogTitle>{ol(action==='courier'?'Assign courier':action==='cod'?'Record courier COD report':'Record courier payout')}</DialogTitle>
   <DialogDescription>{ol("Manual entry only. This does not contact the courier or post to Finance.")}</DialogDescription></DialogHeader>
  <div className="space-y-3 text-sm">
   {action==='courier'?<>
    <label className="block space-y-1">{ol("Courier provider")}
     <AppSelect label={ol("Courier provider")} value={courier} options={onlineOptions(language,courierNames)} onChange={v=>setCourier(v as CourierName)}/></label>
    <label className="block space-y-1">{ol("Tracking / reference number")}
     <Input aria-label={ol("Tracking number")} value={tracking} onChange={e=>setTracking(e.target.value)}/></label>
   </>:action==='cod'?<>
    <p>{ol('Expected COD:')} <strong>{taka(orderTotals(order).cod)}</strong>. {ol('Delivery is not a bank receipt.')}</p>
    <label className="block space-y-1">{ol("Courier-reported collected amount")}
     <Input aria-label={ol("Courier reported COD")} type="number" min="0" value={collected} onChange={e=>setCollected(e.target.value)}/></label>
    <label className="block space-y-1">{ol("Courier fee / deductions")}
     <Input aria-label={ol("Courier fee")} type="number" min="0" value={fee} onChange={e=>setFee(e.target.value)}/></label>
   </>:<>
    <p>{ol("Courier clearing pending:")} <strong>{taka(courierClearing(order).pending)}</strong></p>
    <label className="block space-y-1">{ol("Amount received from courier")}
     <Input aria-label={ol("Courier payout amount")} type="number" min="0" value={payout} onChange={e=>setPayout(e.target.value)}/></label>
    <label className="block space-y-1">{ol("Transfer / settlement reference")}
     <Input aria-label={ol("Courier payout reference")} value={reference} onChange={e=>setReference(e.target.value)}/></label>
   </>}
   {error&&<p className="text-danger" role="alert">{error}</p>}
  </div><DialogFooter><Button variant="outline" onClick={onClose}>{ol("Cancel")}</Button><Button onClick={submit}>{ol("Save manual preview")}</Button></DialogFooter>
 </DialogContent></Dialog>;
}
function OrderDetail({order,onClose,onEdit,onPos}:{order:OnlineOrder;onClose:()=>void;onEdit:()=>void;onPos:()=>void}){
  const {language}=useUiCopy();
  const ol=(value:string)=>onlineLabel(language,value);
 const [action,setAction]=useState<OrderAction|null>(null);
 const [documentKind,setDocumentKind]=useState<FulfillmentDocument|null>(null);
 const [note,setNote]=useState('');
 const totals=orderTotals(order),clearing=courierClearing(order);
 const allowed:Partial<Record<OrderStage,OrderStage[]>>={
  Draft:['Confirmed','Cancelled'],Confirmed:['Packed','Cancelled'],Packed:['Handed over','Cancelled'],
  'Handed over':['In transit','Delivered','Failed delivery'],'In transit':['Delivered','Failed delivery'],
  'Failed delivery':['In transit','Returning'],Returning:['Returned','In transit']
 };
 const nextStage=(s:OrderStage)=>{try{updateOrderStage(order.id,s,note);toast.success(ol('Order stage updated in preview'));setNote('');}
  catch(e){toast.error(e instanceof Error?e.message:String(e));}};
 return <>
 <Dialog open onOpenChange={v=>!v&&onClose()}><DialogContent role="dialog" aria-label={ol('Online order')+' '+order.number}
  className="sales-mobile-dialog max-h-[94vh] w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-3xl">
  <DialogHeader><DialogTitle>{order.number} <StatusBadge tone={stageTone(order.stage)}>{ol(order.stage)}</StatusBadge></DialogTitle>
  <DialogDescription>{order.channel} · {order.customerName} · {ol('manual UI preview')}</DialogDescription></DialogHeader>
  <div className="grid gap-3 text-xs sm:grid-cols-2">
   <div className="rounded-lg border border-border p-3"><strong>{ol('Customer & delivery')}</strong><p className="mt-1">{order.customerName} · {order.phone}</p><p>{order.address}</p><p className="text-ink-500">{order.sourceReference}</p></div>
   <div className="rounded-lg border border-border p-3"><strong>{ol("Courier")}</strong><p className="mt-1">{order.courier??ol('Not assigned')}</p><p>{order.tracking??ol('No tracking number')}</p>
    <p className="text-ink-500">{ol("Tracking is manual, not live.")}</p></div>
  </div>
  <div className="space-y-1">{order.lines.map((l,i)=><div key={l.id} className="flex justify-between gap-2 border-b border-border py-2 text-xs">
   <span>{i+1}. {l.name} · {l.quantity} {l.unit}</span><strong>{taka(l.quantity*l.price)}</strong>
  </div>)}</div>
  <div className="grid gap-2 rounded-lg bg-ink-50 p-3 text-xs sm:grid-cols-2">
   <p>{ol("Goods:")} <strong>{taka(totals.items)}</strong></p><p>{ol("Delivery charge:")} <strong>{taka(totals.delivery)}</strong></p>
   <p>{ol("Discount:")} <strong>{taka(totals.discount)}</strong></p><p>{ol("Grand total:")} <strong>{taka(totals.grand)}</strong></p>
   <p>{ol("Advance recorded:")} <strong>{taka(totals.advance)}</strong></p><p>{ol("COD expected:")} <strong>{taka(totals.cod)}</strong></p>
   <p>{ol("Courier reported COD:")} <strong>{taka(clearing.reported)}</strong></p><p>{ol("Courier fee:")} <strong>{taka(clearing.fee)}</strong></p>
   <p>{ol("Remitted:")} <strong>{taka(clearing.remitted)}</strong></p><p>{ol("Pending clearing:")} <strong>{taka(clearing.pending)}</strong></p>
   {clearing.gap>0&&order.stage==='Delivered'&&<p className="sm:col-span-2 text-warning">{ol('Difference between expected and reported COD:')} {taka(clearing.gap)}</p>}
  </div>
  <div className="flex flex-wrap gap-2">
   {order.stage==='Draft'&&<Button size="sm" variant="outline" onClick={onEdit}>{ol("Edit draft")}</Button>}
   {['Confirmed','Packed'].includes(order.stage)&&<Button size="sm" variant="outline" onClick={onPos}>{ol('Open in POS V2 (preview)')}</Button>}
   {documentTitles.map(kind=><Button key={kind} size="sm" variant="outline" onClick={()=>setDocumentKind(kind)}>{fulfillmentLabel(language,kind)}</Button>)}
   {['Draft','Confirmed','Packed'].includes(order.stage)&&<Button size="sm" variant="outline" onClick={()=>setAction('courier')}>{ol("Assign courier")}</Button>}
   {(allowed[order.stage]??[]).map(stage=><Button key={stage} size="sm" variant={stage==='Cancelled'?'outline':'default'} onClick={()=>nextStage(stage)}>{ol(stage)}</Button>)}
   {order.stage==='Delivered'&&orderTotals(order).cod>0&&<>
    <Button size="sm" variant="outline" onClick={()=>setAction('cod')}>{ol("Courier COD report")}</Button>
    {clearing.pending>0&&<Button size="sm" variant="outline" onClick={()=>setAction('payout')}>{ol("Record payout")}</Button>}
   </>}
  </div>
  <label className="space-y-1 text-xs text-ink-500">{ol('Stage note (optional)')}
   <Input aria-label={ol("Order stage note")} placeholder={ol("Handover person, delivery exception...")} value={note} onChange={e=>setNote(e.target.value)}/></label>
  <div className="space-y-2 border-t border-border pt-3"><strong className="text-sm text-ink">{ol('Activity timeline')}</strong>
   <div className="max-h-40 space-y-2 overflow-auto">
    {[...order.timeline].reverse().map((h,i)=><div key={i} className="border-l-2 border-teal-500 pl-3 text-xs">
     <strong>{ol(h.action)}</strong><p className="text-ink-500">{h.at.slice(0,19)} · {h.by}{h.note?' · '+h.note:''}</p></div>)}
   </div>
  </div>
 </DialogContent></Dialog>
 {action&&<OrderActionDialog order={order} action={action} onClose={()=>setAction(null)}/>}
 {documentKind&&<Dialog open={true} onOpenChange={v=>!v&&setDocumentKind(null)}><DialogContent role="dialog" aria-label={'Print '+documentKind} className="sales-mobile-dialog max-h-[95vh] w-[calc(100vw-1rem)] overflow-y-auto sm:max-w-3xl">
   <style>{fulfillmentPrintCss}</style><DialogHeader><DialogTitle>{ol(documentKind)}</DialogTitle><DialogDescription>{ol('Print preview — no shipment, invoice, stock, or financial posting.')}</DialogDescription></DialogHeader>
   <FulfillmentDocumentPreview order={order} kind={documentKind}/><DialogFooter><Button variant="outline" onClick={()=>setDocumentKind(null)}>{ol("Close")}</Button><Button onClick={()=>printFulfillment(documentKind)}>{ol("Print document")}</Button></DialogFooter>
  </DialogContent></Dialog>}
 </>;
}
function LeadsTab(){
  const {language,showHelper}=useUiCopy();
  const ol=(value:string)=>onlineLabel(language,value);
 const {leads}=useSyncExternalStore(subscribeOnline,getOnlineSnapshot);
 const [add,setAdd]=useState(false);
 const [name,setName]=useState(''),[phone,setPhone]=useState(''),[channel,setChannel]=useState<SalesChannel>('Facebook');
 const [followUp,setFollowUp]=useState(dateNow()),[note,setNote]=useState('');
 const create=()=>{try{upsertSalesLead({name,phone,channel,stage:'New',nextFollowUp:followUp,note});
  toast.success(ol('CRM lead created in preview'));setAdd(false);setName('');setPhone('');setNote('');
 }catch(e){toast.error(e instanceof Error?e.message:String(e));}};
 const move=(lead:SalesLead,stage:LeadStage)=>{try{upsertSalesLead({...lead,stage},lead.id);toast.success(ol('Lead updated'));}
  catch(e){toast.error(String(e));}};
 return <div className="space-y-3">
  <div className="flex items-center justify-between"><p className="text-sm text-ink-500">{ol("Simple inquiry tracking: manual sources, follow-ups and contact stages. No inbox integration.")}</p>
   <Button size="sm" onClick={()=>setAdd(true)}><Plus className="size-4"/> {ol("Add lead")}</Button></div>
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{leads.map(lead=><div key={lead.id} className="space-y-2 rounded-xl border border-border bg-card p-4">
   <div className="flex justify-between gap-2"><strong className="text-sm text-ink">{lead.name}</strong><span className="text-xs text-teal-700 dark:text-teal-400">{lead.channel}</span></div>
   <p className="text-xs text-ink-500">{lead.phone} · {ol('Follow up:')} {lead.nextFollowUp||ol('Not scheduled')}</p>
   <p className="min-h-7 text-xs">{lead.note||ol('No notes yet')}</p>
   <AppSelect label={ol('CRM stage')+' '+lead.name} value={lead.stage} options={onlineOptions(language,['New','Contacted','Interested','Won','Lost'])}
    onChange={value=>move(lead,value as LeadStage)}/>
  </div>)}</div>
  <Dialog open={add} onOpenChange={v=>setAdd(v)}><DialogContent role="dialog" aria-label={ol("New CRM lead")} className="sales-mobile-dialog sm:max-w-lg">
   <DialogHeader><DialogTitle>{ol('New CRM lead')}{showHelper&&' · নতুন অনুসন্ধান'}</DialogTitle><DialogDescription>{ol('Record inquiry and next follow-up; no messages are sent.')}</DialogDescription></DialogHeader>
   <div className="space-y-3 text-xs"><label className="block space-y-1">{ol("Name")}<Input aria-label={ol("Lead name")} value={name} onChange={e=>setName(e.target.value)}/></label>
    <label className="block space-y-1">{ol("Phone")}<Input aria-label={ol("Lead phone")} value={phone} onChange={e=>setPhone(e.target.value)}/></label>
    <label className="block space-y-1">{ol("Source")}<AppSelect label={ol("Lead channel")} value={channel} options={onlineOptions(language,channels)} onChange={v=>setChannel(v as SalesChannel)}/></label>
    <label className="block space-y-1">{ol("Next follow-up date")}<Input aria-label={ol("Lead followup")} type="date" value={followUp} onChange={e=>setFollowUp(e.target.value)}/></label>
    <label className="block space-y-1">{ol("Notes")}<Input aria-label={ol("Lead notes")} value={note} onChange={e=>setNote(e.target.value)}/></label>
   </div><DialogFooter><Button variant="outline" onClick={()=>setAdd(false)}>{ol("Cancel")}</Button><Button onClick={create}>{ol("Save lead")}</Button></DialogFooter>
  </DialogContent></Dialog>
 </div>;
}
function NotificationsTab(){return <ErpNotificationsWorkbench embedded/>;}
export function OnlineSales(){
 const isMobile=useMediaQuery('(max-width: 767px)');
  const {language,showHelper}=useUiCopy();
  const ol=(value:string)=>onlineLabel(language,value);
 const {orders}=useSyncExternalStore(subscribeOnline,getOnlineSnapshot);
 const navigate=useNavigate();
 const [searchParams,setSearchParams]=useSearchParams();
 const quoteId=searchParams.get('quote');
 const [quoteDraft,setQuoteDraft]=useState<OnlineOrderDraft|null>(null);

 const [tab,setTab]=useState<View>('Orders'),[query,setQuery]=useState(''),[filter,setFilter]=useState('All channels');
 const [stage,setStage]=useState('All statuses'),[editing,setEditing]=useState<OnlineOrder|null>(null);
 const [editorOpen,setEditorOpen]=useState(false),[selectedId,setSelectedId]=useState<string|null>(null);
 const [handoffReviewId,setHandoffReviewId]=useState<string|null>(null);
 const selected=orders.find(o=>o.id===selectedId)??null;
 useEffect(()=>{
  if(!quoteId)return;
  const existing=existingOrderForQuote(quoteId);
  if(existing){setSelectedId(existing.id);toast.info(ol('This quotation already has an online order.'));}
  else {
   const quote=getQuoteSnapshot().quotes.find(q=>q.id===quoteId);
   if(!quote){toast.error(ol('Quotation not found.'));}
   else try{
    const draft=draftFromAcceptedQuote(quote);
    const related=availableParties().find(p=>p.id===draft.partyId);
    setQuoteDraft({...draft,phone:draft.phone||related?.phone?.replace(/[ -]/g,'')||'',address:related?.area||''});
    setEditorOpen(true);
   }catch(e){toast.error(e instanceof Error?e.message:String(e));}
  }
  setSearchParams({}, {replace:true});
 },[quoteId,setSearchParams]);
 const openPos=(order:OnlineOrder)=>{
  try{preparePosHandoff(order.id,previewPosProducts());setSelectedId(null);
   navigate('/app/pos',{state:{hisabiqSource:'online-order',orderId:order.id}});}
  catch(e){if(!order.sourceQuoteId&&inspectBundleHandoffs(order.lines).length)setHandoffReviewId(order.id);
    else toast.error(e instanceof Error?e.message:String(e));}
 };
 const filtered=useMemo(()=>orders.filter(o=>(filter==='All channels'||o.channel===filter)&&
  (stage==='All statuses'||o.stage===stage)&&
  fuzzyMatch(query,[o.number,o.channel,o.customerName,o.phone,o.courier,o.tracking])),
 [orders,filter,stage,query]);
 const expected=orders.reduce((sum,o)=>sum+orderTotals(o).cod,0);
 const pending=orders.reduce((sum,o)=>sum+courierClearing(o).pending,0);
 const tabs:Array<[View,string]>= [['Orders','অর্ডার'],['Courier & COD','কুরিয়ার ও COD'],['CRM Leads','ক্রেতা যোগাযোগ'],['SMS Rules','এসএমএস নিয়ম']];
 const onlineSummary=[['Online orders',String(orders.length),'All channels'],['Awaiting shipment',String(orders.filter(o=>['Confirmed','Packed'].includes(o.stage)).length),'Confirmed + packed'],
    ['COD to collect',taka(expected),'Expected gross, not received'],['Courier clearing',taka(pending),'Reported less fee and remittance']];
 return <div className="sales-mobile-page mx-auto max-w-[1440px] space-y-4">
  <div className="sales-mobile-header"><PageHeader title="Online Sales" titleBn="অনলাইন বিক্রি" description="Social commerce orders, courier COD and follow-ups · manual UI preview only."
   descriptionBn="ফেসবুকসহ অনলাইন অর্ডার, কুরিয়ারের টাকা ও ক্রেতার খোঁজখবর দেখুন · শুধু নমুনা।"
   actions={<>{isMobile ? <SalesMobileMore label={ol('Online sales actions')}>{close=><Button size="sm" variant="outline" onClick={()=>{close();navigate('/app/quotations');}}><FileText className="size-4"/>{ol('Quotations')}</Button>}</SalesMobileMore> : (<Link to="/app/quotations"><Button size="sm" variant="outline"><FileText className="size-4"/> {ol("Quotations")}</Button></Link>)}
    <Button size="sm" onClick={()=>{setEditing(null);setQuoteDraft(null);setEditorOpen(true);}}><Plus className="size-4"/> {ol("New online order")}</Button></>}/></div>
  {isMobile ? <SalesMobileSummary items={onlineSummary.map(([label,value,helper])=>({label:ol(label),value,helper:ol(helper)}))} /> : (<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
   {onlineSummary
   .map(([label,value,sub])=><div key={label} className="rounded-xl border border-border bg-card p-3 shadow-card">
    <p className="text-xs text-ink-500">{ol(label)}</p><strong className="mt-1 block text-lg text-ink">{value}</strong><p className="text-[11px] text-ink-400">{ol(sub)}</p>
   </div>)}
  </div>)}
  <div className="rounded-xl border border-border bg-card shadow-card">
   <MotionTabList role="tablist" aria-label={ol("Online selling sections")} className="flex flex-wrap gap-1 border-b border-border p-2">
    {tabs.map(([key,bn])=><button type="button" role="tab" aria-selected={tab===key} key={key} onClick={()=>setTab(key)}
     className={'rounded-md px-3 py-2 text-xs font-medium '+(tab===key?'text-ink':'text-ink-600 hover:text-ink')}>
      {ol(key)}{showHelper&&<span className="font-bn ml-1 text-[10px] opacity-75">{bn}</span>}<MotionTabIndicator active={tab===key} /></button>)}
   </MotionTabList>
   <div className="sales-mobile-online-body space-y-3 p-3">
    {tab==='Orders'||tab==='Courier & COD'?<>
     {isMobile ? <SalesMobileToolbar
       search={<Input aria-label={ol('Search online orders')} placeholder={ol('Search order, customer, courier, phone...')} value={query} onChange={event=>setQuery(event.target.value)}/>}
       filters={<><AppSelect label={ol('Filter sales channel')} value={filter} options={onlineOptions(language,['All channels',...channels])} onChange={setFilter}/><AppSelect label={ol('Filter order status')} value={stage} options={onlineOptions(language,['All statuses',...stages])} onChange={setStage}/></>}
       activeCount={Number(filter!=='All channels')+Number(stage!=='All statuses')} onClear={()=>{setQuery('');setFilter('All channels');setStage('All statuses');}}
       result={<>{filtered.length} / {orders.length} {ol('Orders')}</>} /> : (<SalesWideToolbar className="" search={<div className="min-w-[180px] flex-1"><Input aria-label={ol("Search online orders")} placeholder={ol("Search order, customer, courier, phone...")} value={query} onChange={e=>setQuery(e.target.value)}/></div>} filters={<> <AppSelect label={ol("Filter sales channel")} value={filter} className="w-40" options={onlineOptions(language,['All channels',...channels])} onChange={setFilter}/>
      <AppSelect label={ol("Filter order status")} value={stage} className="w-44" options={onlineOptions(language,['All statuses',...stages])} onChange={setStage}/></>} activeCount={Number(filter!=='All channels')+Number(stage!=='All statuses')} />)}
     <div className="sales-mobile-online-records grid gap-2">
      {filtered.map(o=>{const totals=orderTotals(o),clearing=courierClearing(o);return isMobile ? <SalesMobileRecord key={o.id} reference={o.number} name={o.customerName}
       status={<StatusBadge tone={stageTone(o.stage)}>{ol(o.stage)}</StatusBadge>}
       meta={<>{o.channel} · {o.phone}{tab==='Courier & COD'&&<><br/>{o.courier??ol('Not assigned')} · {o.tracking??ol('No tracking')} · {ol('Clearing')} {taka(clearing.pending)}</>}</>}
       amount={<>{ol('Grand total')} <strong className="text-ink">{taka(totals.grand)}</strong></>} balance={<>{ol('COD')} <strong className="text-teal-700">{taka(totals.cod)}</strong></>}
       onOpen={()=>setSelectedId(o.id)} actions={<SalesMobileMore label={ol('Order actions')+' '+o.number}>{close=><Button variant="outline" size="sm" onClick={()=>{close();setSelectedId(o.id);}}>{ol('Open')}<ChevronRight className="size-3.5"/></Button>}</SalesMobileMore>} /> : <div key={o.id} className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3">
       <div className="min-w-[135px] flex-1"><button onClick={()=>setSelectedId(o.id)} className="text-left text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400">{o.number}</button><p className="text-[11px] text-ink-500">{o.channel} · {o.customerName}</p></div>
       <div className="w-[110px] text-xs"><p className="font-semibold text-ink">{taka(totals.grand)}</p><p className="text-ink-500">{ol('COD')} {taka(totals.cod)}</p></div>
       {tab==='Courier & COD'&&<div className="w-36 text-xs"><p>{o.courier??ol('Not assigned')}</p><p className="truncate text-ink-500">{o.tracking??ol('No tracking')}</p><p className="text-teal-700 dark:text-teal-400">{ol('Clearing')} {taka(clearing.pending)}</p></div>}
       <StatusBadge tone={stageTone(o.stage)}>{ol(o.stage)}</StatusBadge>
       <Button variant="outline" size="sm" onClick={()=>setSelectedId(o.id)}>{ol("Open")} <ChevronRight className="size-3.5"/></Button>
      </div>})}
      {!filtered.length&&<p className="p-7 text-center text-sm text-ink-500">{ol("No orders match your filters.")}</p>}
     </div>
     {tab==='Courier & COD'&&<p className="text-xs text-ink-500">{ol('Courier reported COD and actual bank remittance are separate. Manual tracking ≠ live courier API.')}</p>}
    </>:tab==='CRM Leads'?<LeadsTab/>:<NotificationsTab/>}
   </div>
  </div>
  {editorOpen&&<OrderEditor key={editing?.id??quoteDraft?.sourceQuoteId??'new'} original={editing} initialDraft={quoteDraft} onClose={()=>{setEditorOpen(false);setEditing(null);setQuoteDraft(null);}}/>}
  {selected&&<OrderDetail order={selected} onClose={()=>setSelectedId(null)} onPos={()=>openPos(selected)} onEdit={()=>{setQuoteDraft(null);setEditing(selected);setEditorOpen(true);setSelectedId(null);}}/>}
  {handoffReviewId&&(()=>{const order=orders.find(x=>x.id===handoffReviewId);if(!order)return null;
   const issues=inspectBundleHandoffs(order.lines);return <Dialog open onOpenChange={open=>!open&&setHandoffReviewId(null)}>
    <DialogContent role="dialog" aria-label="Review changed package" className="sales-mobile-dialog max-h-[92vh] overflow-y-auto sm:max-w-lg">
     <DialogHeader><DialogTitle>Package recipe changed · প্যাকেজ বদলেছে</DialogTitle>
      <DialogDescription>Check the package contents before opening POS. This review does not change the agreed parent price, Set quantity or discount.</DialogDescription></DialogHeader>
     <div className="space-y-2 text-sm">{issues.map(issue=><div key={issue.productId} className="rounded-lg border border-border p-3">
      <strong>{issue.name}</strong><p className="text-xs">Saved: {issue.before}</p><p className="text-xs">Current: {issue.after}</p></div>)}</div>
     <DialogFooter><Button variant="outline" onClick={()=>setHandoffReviewId(null)}>Cancel</Button>
      <Button onClick={()=>{try{acknowledgeOrderBundleChanges(order.id);setHandoffReviewId(null);setSelectedId(null);
       navigate('/app/pos',{state:{hisabiqSource:'online-order',orderId:order.id}});}catch(e){toast.error(e instanceof Error?e.message:String(e));}}}>
       Use current package recipe
      </Button></DialogFooter>
    </DialogContent>
   </Dialog>})()}
 </div>;
}
