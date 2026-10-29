import { MotionTabList, MotionTabIndicator } from '../../motion/MotionTabList';
import {matchesSearch as fuzzyMatch} from '../../utils/fuzzySearch';
import {useEffect,useId,useMemo,useState} from 'react';
import {Ellipsis,Plus,Printer} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from '../Button';
import {Input} from '../Input';
import {Dialog,DialogContent,DialogTitle,DialogDescription} from '../Dialog';
import {AppSelect} from '../AppSelect';
import {PartyAvatar} from '../PartyAvatar';
import {Tooltip} from '../Tooltip';
import {useUiCopy} from '../../i18n/useUiCopy';
import {AppDateRangePicker} from '../AppDateRangePicker';
import {VendorCorrectionDialog} from '../parties/VendorCorrectionDialog';
import {VendorStatementDialog} from '../parties/VendorStatementDialog';
import {VendorGoodsEditor} from './VendorGoodsEditor';
import {VendorSourceWorkspace} from './VendorSourceWorkspace';
import {VendorPaymentsWorkspace} from './VendorPaymentsWorkspace';
import {PurchaseEditor} from '../../pages/PurchaseEditor';
import {projectVendorPartyProfile} from '../../vendor/vendorPartyProjection';
import {sourceOutstanding} from '../../vendor/vendorModel';
import {dispatchVendorPreview} from '../../vendor/vendorPreviewStore';
import {vendorWorkTabs,type VendorWorkTab} from '../../vendor/vendorRoute';
import {type IsoRange} from '../../utils/dateRange';
import {taka} from '../../utils/currency';
import type {Purchase,Party} from '../../types/erp';
import type {VendorLedgerEvent,VendorPreviewState,VendorSide} from '../../vendor/vendorTypes';

type Props={party:Party;snapshot:VendorPreviewState;purchases:Purchase[];
 tab:VendorWorkTab;onTabChange:(tab:VendorWorkTab,sourceId?:string)=>void;sourceId:string|null;onDirtyChange:(dirty:boolean)=>void;onEditVendor:()=>void};
const labels:Record<VendorWorkTab,{english:string;bn:string}>={
 ledger:{english:'Ledger',bn:'হিসাব'},
 taken:{english:'Taken',bn:'নেওয়া পণ্য'},
 given:{english:'Given',bn:'দেওয়া পণ্য'},
 purchases:{english:'Purchases',bn:'ক্রয়'},
 payments:{english:'Payments',bn:'পেমেন্ট'}
};
const tabHints:Record<VendorWorkTab,{english:string;bn:string}>={
 ledger:{english:'View goods-related money in and out separately.',bn:'পণ্যের দেওয়া ও নেওয়ার হিসাব আলাদা দেখুন।'},
 taken:{english:'Goods received from this vendor, including price and return details.',bn:'ভেন্ডরের কাছ থেকে নেওয়া পণ্য, দাম ও ফেরতের হিসাব।'},
 given:{english:'Goods handed to the vendor and money still to receive.',bn:'ভেন্ডরকে দেওয়া পণ্য ও পাওনার হিসাব।'},
 purchases:{english:'Regular purchase invoices from this vendor.',bn:'এই ভেন্ডরের সাধারণ ক্রয়ের বিল।'},
 payments:{english:'Money paid to or received from this vendor for goods memos.',bn:'পণ্যের মেমোর টাকা দেওয়া ও নেওয়ার হিসাব।'}
};
const money=(v:number)=>taka(v/100);
export function VendorTabs({party,snapshot,purchases,tab,onTabChange,sourceId,onDirtyChange,onEditVendor}:Props){
 const base=useId().replace(/:/g,'');
 const {text,showHelper}=useUiCopy();
 const [range,setRange]=useState<IsoRange>({from:'',to:''});
 const [query,setQuery]=useState('');
 const [side,setSide]=useState<VendorSide>('payable');
 const [editingTaken,setEditingTaken]=useState(false);
 const [hasUnsavedGoods,setHasUnsavedGoods]=useState(false);
 const updateDirty=(value:boolean)=>{setHasUnsavedGoods(value);onDirtyChange(value);};
 const [editingGiven,setEditingGiven]=useState(false);
 const [purchaseOpened,setPurchaseOpened]=useState(tab==='purchases');

 const [purchaseRevision,setPurchaseRevision]=useState(0);
 useEffect(()=>{if(tab==='purchases')setPurchaseOpened(true);},[tab]);
 const [statementOpen,setStatementOpen]=useState(false);
 const [mobileMoreOpen,setMobileMoreOpen]=useState(false);

 const [correctSource,setCorrectSource]=useState<string|null>(null);
 const [correctEvent,setCorrectEvent]=useState<string|null>(null);
 const checkedRange=Boolean(range.from)===Boolean(range.to)?range:{from:'',to:''};
 const profile=useMemo(()=>projectVendorPartyProfile(snapshot,purchases,party.id,checkedRange),
  [snapshot,purchases,party.id,range.from,range.to,purchaseRevision]);
 const activeSources=snapshot.sources.filter(s=>s.vendorPartyId===party.id&&s.status==='Active');
 const taken=activeSources.filter(s=>s.sourceKind==='sourcing');
 const given=activeSources.filter(s=>s.sourceKind==='issue');
 const unpricedMemos=profile.summary.priceNotSetCount;
 const payable=profile.summary.takenDuePaisa;
 const receivable=profile.summary.givenDuePaisa;
 useEffect(()=>{if(payable===0&&receivable>0)setSide('receivable');},[party.id,payable,receivable]);
 const unpricedSource=taken.find(s=>sourceOutstanding(snapshot,s.id).unpricedBaseQty>0);
 const payableSource=taken.find(s=>(sourceOutstanding(snapshot,s.id).monetaryDuePaisa??0)>0);
 const receivableSource=given.find(s=>(sourceOutstanding(snapshot,s.id).monetaryDuePaisa??0)>0);
 const statement=side==='payable'?profile.takenStatement:profile.givenStatement;
 const ledgerRows=statement.rows.filter(e=>fuzzyMatch(query,[e.reference,e.description]));

 const selectTab=(next:VendorWorkTab,selectedSourceId?:string)=>{
  if(next!==tab&&hasUnsavedGoods&&!window.confirm('Unsaved products will be lost. Switch tabs?'))return;
  if(next!==tab&&hasUnsavedGoods){updateDirty(false);setEditingTaken(false);setEditingGiven(false);}
  onTabChange(next,selectedSourceId);
 };
 const review=(event:VendorLedgerEvent)=>{
  setCorrectEvent(event.id);
  const id=event.sourceId??snapshot.settlements.find(s=>s.operationId===event.operationId)?.allocations[0]?.sourceId??null;
  setCorrectSource(id);
 };
 const savePurchase=(p:Purchase)=>{
  if(p.supplierId!==party.id){toast.error('Choose the same Vendor before saving.');return;}
  try{
   dispatchVendorPreview({type:'record-purchase-inventory',operationId:'vendor-normal-purchase:'+p.id,
    vendorPartyId:party.id,purchaseId:p.id,lines:(p.inventoryLines??[]).map(l=>({productId:l.productId,baseQty:l.quantity}))});
  }catch(e){toast.error('Purchase created in preview. Stock projection needs review: '+String(e));}
  setPurchaseRevision(n=>n+1);onDirtyChange(false);
 };
 const openGoods=(mode:'taken'|'given')=>{
  if(mode!==tab&&hasUnsavedGoods&&!window.confirm('Unsaved products will be lost. Switch tabs?'))return;
  if(mode!==tab&&hasUnsavedGoods)updateDirty(false);
  setEditingTaken(mode==='taken');
  setEditingGiven(mode==='given');
  onTabChange(mode);
 };
 // One set of desktop action labels and handlers for both layouts.
 const actions=[
  {key:'taken',label:'Take Products',visible:true,run:()=>openGoods('taken'),hint:text('Record products received from this vendor','এই ভেন্ডর থেকে নেওয়া পণ্য লিখুন')},
  {key:'given',label:'Give Products',visible:true,run:()=>openGoods('given'),hint:text('Record products you gave to this vendor','ভেন্ডরকে দেওয়া পণ্য লিখুন')},
  {key:'price',label:'Set price · দাম ঠিক করুন',visible:unpricedMemos>0,run:()=>selectTab('taken',unpricedSource?.id),hint:text('Set the agreed price for previously unpriced goods','আগে নেওয়া পণ্যের দাম লিখুন')},
  {key:'pay',label:'Pay / return',visible:payable>0,run:()=>selectTab(payableSource?'taken':'ledger',payableSource?.id),hint:text('Pay for taken goods or return products to settle','নেওয়া পণ্যের টাকা দিন বা পণ্য ফেরত দিন')},
  {key:'receive',label:'Receive settlement',visible:receivable>0,run:()=>selectTab(receivableSource?'given':'ledger',receivableSource?.id),hint:text('Receive money for goods handed to this vendor','ভেন্ডরকে দেওয়া পণ্যের টাকা নিন')},
  {key:'purchase',label:'New purchase',visible:true,run:()=>selectTab('purchases'),hint:text('Open a regular purchase invoice, separate from goods memos','নেওয়া পণ্যের মেমো থেকে আলাদা সাধারণ ক্রয়ের বিল')},
  {key:'print',label:'Print Ledger',visible:true,run:()=>setStatementOpen(true),hint:text('Print the selected Vendor statement','ভেন্ডরের হিসাব প্রিন্ট করুন')},
  {key:'edit',label:'Edit Vendor · তথ্য বদলান',visible:true,run:onEditVendor,hint:text('Edit Vendor details','ভেন্ডরের তথ্য বদলান')}
 ] as const;
 const mobileSecondary=receivable>0?'receive':payable>0?'pay':'given';
 return <div className="min-w-0 rounded-xl border border-border bg-card shadow-card" role="region" aria-label="Selected Vendor work">
  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border p-3 sm:p-4">
   <div className="hidden min-w-0 flex-1 items-start gap-3 sm:flex">
    <PartyAvatar name={party.name} color={party.avatarColor} image={party.image} size={52}/>
    <div className="min-w-0">
     <h2 className="truncate text-lg font-semibold text-ink">{party.name}
      {party.nameBn&&<span className="ml-2 font-bn text-sm font-normal text-ink-500">{party.nameBn}</span>}</h2>
     <p className="mt-0.5 text-xs text-ink-500">{party.phone} · {party.area}</p>
     <span className="mt-1 inline-flex rounded-md bg-teal-50 px-1.5 py-0.5 text-[11px] font-medium text-teal-700 dark:bg-teal-900/20 dark:text-teal-200">Vendor · ভেন্ডর</span>
    </div>
   </div>
   <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:shrink-0" aria-label="Vendor balances, kept separate">
    <div className="min-w-[122px] rounded-lg bg-ink-50/70 px-3 py-2">
     <p className="flex items-center gap-1 text-[11px] text-ink-500">{text('You owe','দিতে হবে')}{showHelper&&<span className="hidden sm:inline"> · দেনা</span>}
      <Tooltip label="Explain Vendor payable" align="start" triggerClassName="size-7"
       content={<span className="block text-sm leading-5">Goods taken from this vendor that still need payment. Regular purchase bills are separate.<span className="mt-1 block font-bn">ভেন্ডর থেকে নেওয়া পণ্যের বাকি টাকা। সাধারণ ক্রয়ের বিল আলাদা।</span></span>}/>
     </p>
     <p className={'whitespace-nowrap text-lg font-semibold '+(payable>0?'text-danger':'text-ink')}>{money(payable)}</p>
    </div>
    <div className="min-w-[122px] rounded-lg bg-ink-50/70 px-3 py-2">
     <p className="flex items-center gap-1 text-[11px] text-ink-500">{text('Vendor owes','পাওনা')}{showHelper&&<span className="hidden sm:inline"> · পাওনা</span>}
      <Tooltip label="Explain Vendor receivable" align="end" triggerClassName="size-7"
       content={<span className="block text-sm leading-5">Money the vendor still owes for goods you gave them.<span className="mt-1 block font-bn">ভেন্ডরকে দেওয়া পণ্যের জন্য যে টাকা এখনো পাবেন।</span></span>}/>
     </p>
     <p className={'whitespace-nowrap text-lg font-semibold '+(receivable>0?'text-teal-700 dark:text-teal-300':'text-ink')}>{money(receivable)}</p>
    </div>
   </div>
  </div>
  <div className="hidden flex-wrap items-center gap-2 border-b border-border px-4 py-2.5 sm:flex" role="group" aria-label="Vendor quick actions">
   {actions.filter(action=>action.visible).map(action=><Button type="button" key={action.key} size="sm"
    variant={action.key==='taken'?'default':'outline'} title={action.hint} onClick={action.run}>
    {action.key==='taken'&&<Plus className="size-4"/>}{action.key==='print'&&<Printer className="size-4"/>}{action.label}
   </Button>)}
  </div>
  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-stretch gap-2 border-b border-border p-3 sm:hidden" role="group" aria-label="Vendor quick actions">
   {actions.filter(action=>action.visible&&(action.key==='taken'||action.key===mobileSecondary)).map(action=>
    <Button type="button" key={action.key} size="sm" variant={action.key==='taken'?'default':'outline'}
     className="h-9 min-w-0 px-2 text-xs" title={action.hint} onClick={action.run}>
     {action.key==='taken'&&<Plus className="size-4"/>}{action.label}
    </Button>)}
   <Button type="button" size="sm" variant="outline" className="h-9 px-2" aria-label="More Vendor actions"
    onClick={()=>setMobileMoreOpen(true)}><Ellipsis className="size-5"/> More</Button>
  </div>
  <Dialog open={mobileMoreOpen} onOpenChange={setMobileMoreOpen}>
   <DialogContent aria-label="More Vendor actions" className="w-[calc(100vw-1rem)] max-w-md max-h-[85vh] overflow-y-auto p-4">
    <DialogTitle>More Vendor actions</DialogTitle>
    <DialogDescription>Choose a Vendor task · ভেন্ডরের কাজ বাছুন</DialogDescription>
    <div className="grid gap-2 pt-3">
     {actions.filter(action=>action.visible&&action.key!=='taken'&&action.key!==mobileSecondary).map(action=>
      <Button key={action.key} type="button" size="sm" variant="outline" className="h-9 justify-start"
       title={action.hint} onClick={()=>{setMobileMoreOpen(false);action.run();}}>
       {action.key==='print'&&<Printer className="size-4"/>}{action.label}
      </Button>)}
    </div>
   </DialogContent>
  </Dialog>
  <div className="hidden flex-wrap items-center justify-between gap-2 border-b border-border bg-ink-50/30 px-3 py-2 text-xs sm:flex">
   {unpricedMemos>0
    ?<p className="flex flex-wrap items-center gap-1 text-warning"><strong>Price not set ({unpricedMemos})</strong> · Unpriced goods are not counted as money due.
      <Tooltip label="Explain unpriced Vendor memos" triggerClassName="size-7"
       content={<span className="block text-sm leading-5">Set the price in Taken to include these goods in the amount due.<span className="mt-1 block font-bn">দাম না লেখা পণ্য বাকি টাকার মধ্যে ধরা হয়নি। নেওয়া পণ্যে গিয়ে দাম লিখুন।</span></span>}/>
     </p>
    :<p className="text-ink-500">{payable>0?'Pay or return taken products to settle.':'No unpriced goods.'}</p>}
   <div className="flex items-center gap-1">
    <button type="button" onClick={()=>selectTab('purchases')}
     className="text-left text-ink-600 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500">
     Purchase due · ক্রয়ের বাকি <strong className="text-ink">{money(profile.summary.purchaseDuePaisa)}</strong> · View Purchases
    </button>
    <Tooltip label="Explain purchase due" align="end" triggerClassName="size-7"
     content={<span className="block text-sm leading-5">Unpaid regular purchase invoices. These are not included in the goods-taken balance above.<span className="mt-1 block font-bn">সাধারণ ক্রয়ের বাকি বিল। উপরের নেওয়া পণ্যের দেনার সঙ্গে এটি যোগ করা হয়নি।</span></span>}/>
   </div>
  </div>
  <MotionTabList className="flex gap-1 overflow-x-auto border-b border-border px-3 scrollbar-thin" role="tablist" aria-label="Vendor work tabs">
   {vendorWorkTabs.map((key,index)=><button type="button" key={key}
    id={base+'-'+key} role="tab" aria-selected={tab===key} aria-controls={base+'-panel'} tabIndex={tab===key?0:-1}
    title={text(tabHints[key].english,tabHints[key].bn)}
    className={'flex shrink-0 items-center gap-1.5 px-2.5 py-2.5 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-teal-500 '+(tab===key?'text-ink':'text-ink-500 hover:text-ink')}
    onClick={()=>selectTab(key)} onKeyDown={e=>{
     if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
     e.preventDefault();
     const next=e.key==='Home'?0:e.key==='End'?vendorWorkTabs.length-1:
      (index+(e.key==='ArrowRight'?1:-1)+vendorWorkTabs.length)%vendorWorkTabs.length;
     selectTab(vendorWorkTabs[next]);
     e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
    }}>{text(labels[key].english,labels[key].bn)}
     {showHelper&&<span className="font-bn text-[11px] text-ink-500">{labels[key].bn}</span>}
    <MotionTabIndicator active={tab===key} /></button>)}
  </MotionTabList>
  <section id={base+'-panel'} role="tabpanel" aria-labelledby={base+'-'+tab} className="min-w-0">
    <div className="p-3 sm:p-4">
    {tab==='ledger'&&<>
     <div className="mb-3 flex flex-wrap items-center gap-2">
      <div className="min-w-[170px] flex-1 sm:min-w-[195px] sm:flex-none"><AppSelect label="Vendor balance side" value={side}
        onChange={value=>setSide(value as VendorSide)}
        options={[{value:'payable',label:'Taken · You owe'},{value:'receivable',label:'Given · Vendor owes'}]}/></div>
      <AppDateRangePicker value={range} onChange={setRange} label="Vendor ledger date range"/>
      {Boolean(range.from)!==Boolean(range.to)&&<span className="text-xs text-warning">Choose both dates to filter</span>}
      <div className="w-full min-w-0 sm:w-auto sm:min-w-[150px] sm:flex-1">
       <Input className="w-full" value={query} onChange={e=>setQuery(e.target.value)}
        aria-label="Search Vendor ledger" placeholder="Search reference or note"/>
      </div>
     </div>
     <div className="mb-3 space-y-2 sm:hidden">
      {unpricedMemos>0&&<div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-warning-bg p-3">
       <div className="min-w-0 flex-1"><strong className="block text-sm text-warning">Price not set ({unpricedMemos})</strong>
        <p className="mt-0.5 text-xs text-warning">Unpriced goods are not counted as money due.</p></div>
       <Button type="button" size="sm" variant="outline" className="h-9" onClick={()=>selectTab('taken',unpricedSource?.id)}>Set price · দাম ঠিক করুন</Button>
      </div>}
      <button type="button" onClick={()=>selectTab('purchases')}
       className="flex h-9 w-full items-center justify-between gap-2 rounded-lg bg-ink-50 px-3 text-left text-sm text-ink-600 focus-visible:outline-2 focus-visible:outline-teal-500">
       <span>Purchase due · ক্রয়ের বাকি</span><strong className="text-ink">{money(profile.summary.purchaseDuePaisa)}</strong>
      </button>
     </div>
     {(statement.rows.length>0||statement.openingPaisa!==0)&&<div className="mb-2 flex flex-wrap justify-between gap-2 bg-ink-50 px-3 py-2 text-xs text-ink-600">
      <span>Opening: {money(statement.openingPaisa)}</span>
      <span>Increased: {money(statement.periodIncreasePaisa)}</span>
      <span>Decreased: {money(statement.periodDecreasePaisa)}</span>
     </div>}
     <div className="space-y-2 sm:hidden" data-testid="vendor-mobile-ledger">
      {ledgerRows.map(e=><button type="button" key={e.id} onClick={()=>review(e)}
       className="flex min-h-16 w-full min-w-0 items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500">
        <span className="w-20 shrink-0 text-xs text-ink-500">{e.date}</span>
        <span className="min-w-0 flex-1">
         <strong className="block truncate text-sm text-ink">{e.reference??e.kind}</strong>
         <span className="block truncate text-xs text-ink-500">{e.description}</span>
         <span className="mt-1 block text-xs text-ink-500">Running · জের {money(e.runningPaisa)}</span>
        </span>
        <span className={'shrink-0 text-right text-sm font-semibold '+(e.deltaPaisa<0?'text-danger':'text-teal-700 dark:text-teal-300')}>
         {e.deltaPaisa<0?'−':'+'}{money(Math.abs(e.deltaPaisa))}
         <span className="block text-xs font-normal text-ink-500">Review</span>
        </span>
       </button>)}
      {ledgerRows.length===0&&<div className="rounded-lg border border-border px-4 py-8 text-center text-sm text-ink-500">
       No transactions in this view · এই হিসাবে লেনদেন নেই
      </div>}
     </div>
     <div className="hidden overflow-x-auto sm:block"><table data-erp-table="" className="w-full min-w-[560px] text-xs">
      <thead><tr className="border-b border-border bg-ink-50">
       {['Date','Details','Increase','Decrease','Running','Actions'].map(x=><th key={x} className="p-2 text-left">{x}</th>)}
      </tr></thead><tbody>
      {ledgerRows.map(e=>
       <tr key={e.id} className="border-b border-border/70"><td className="p-2 text-ink-500">{e.date}</td>
        <td className="p-2 font-medium text-ink">{e.reference??e.kind}<p className="font-normal text-ink-500">{e.description}</p></td>
        <td className="p-2 text-right">{e.deltaPaisa>0?money(e.deltaPaisa):'—'}</td>
        <td className="p-2 text-right">{e.deltaPaisa<0?money(-e.deltaPaisa):'—'}</td>
        <td className="p-2 text-right font-semibold">{money(e.runningPaisa)}</td>
        <td className="p-2 text-right"><Button size="sm" variant="ghost" onClick={()=>review(e)}>Review</Button></td>
       </tr>)}
       {ledgerRows.length===0&&<tr><td colSpan={6} className="p-6 text-center text-ink-500">No transactions in this view.</td></tr>}
      </tbody></table></div>
     {side==='payable'&&profile.takenStatement.unpricedSources.length>0&&
      <div className="mt-3 hidden flex-wrap items-center justify-between gap-2 rounded-lg bg-warning-bg p-3 text-xs text-warning sm:flex">
       <span>{profile.takenStatement.unpricedSources.length} source(s) with <strong>Price not set</strong>. No money due is added until pricing.</span>
       <Button type="button" size="sm" variant="outline" onClick={()=>selectTab('taken')}>Open Taken · নেওয়া পণ্য</Button>
      </div>}
     {profile.activity.filter(item=>item.bucket===(side==='payable'?'vendor-payable':'vendor-receivable')
       &&item.moneyPaisa===null
       &&fuzzyMatch(query,[item.reference,item.description])).length>0&&
      <div className="mt-3 rounded-lg border border-border">
       <h4 className="border-b border-border bg-ink-50 px-3 py-2 text-xs font-semibold text-ink">
        Records without a money amount · দাম ঠিক হয়নি / সংশোধন
       </h4>
       {profile.activity.filter(item=>item.bucket===(side==='payable'?'vendor-payable':'vendor-receivable')
         &&item.moneyPaisa===null
         &&fuzzyMatch(query,[item.reference,item.description])).map(item=>
        <div key={item.id} className="flex flex-wrap items-center gap-3 border-b border-border/60 px-3 py-2 text-xs">
         <span className="text-ink-500">{item.date}</span>
         <div className="min-w-0 flex-1"><strong className="text-ink">{item.reference}</strong>
          <p className="text-ink-500">{item.description}</p></div>
         <span className="text-ink-500">No money amount</span>
         {item.sourceEventId&&item.kind!=='reversal'&&
          <Button type="button" size="sm" variant="ghost" onClick={()=>{
           const entry=snapshot.events.find(e=>e.id===item.sourceEventId);if(entry)review(entry);
          }}>Review</Button>}
        </div>)}
      </div>}
    </>}
    {(tab==='taken'||tab==='given')&&<>
      {(tab==='taken'?editingTaken:editingGiven)&&<div className="mb-4">
       <VendorGoodsEditor partyId={party.id} mode={tab} onDirtyChange={updateDirty}
        onCancel={()=>{tab==='taken'?setEditingTaken(false):setEditingGiven(false);updateDirty(false);}}
        onSaved={()=>{tab==='taken'?setEditingTaken(false):setEditingGiven(false);toast.success('Products saved · Preview only');}}/>
      </div>}
      <VendorSourceWorkspace key={tab+'-'+(sourceId??'')} mode={tab} sources={tab==='taken'?taken:given}
        snapshot={snapshot} sourceId={sourceId} onCorrect={setCorrectSource}/>
     </>}
     {(tab==='purchases'||purchaseOpened)&&<div className={tab==='purchases'?'space-y-4':'hidden'} aria-hidden={tab!=='purchases'}>
      <div onChangeCapture={()=>onDirtyChange(true)}>
        <PurchaseEditor key={purchaseRevision} embedded active={tab==='purchases'}
          initialSupplierId={party.id} lockedSupplierId={party.id} onCompleted={savePurchase}
          onCancel={()=>{setPurchaseRevision(n=>n+1);onDirtyChange(false);}}/>
      </div>
      <details className="overflow-hidden rounded-lg border border-border">
       <summary className="cursor-pointer bg-ink-50/40 px-3 py-2 text-sm font-semibold text-ink">
        Previous Purchases · আগের ক্রয় ({purchases.length})
       </summary>
        <div className="border-b border-border bg-ink-50/40 px-3 py-2 text-sm font-semibold text-ink">Previous purchases · আগের ক্রয়</div>
        <div className="divide-y divide-border">
          {purchases.map(p=><div key={p.id} className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 p-3 text-xs">
            <div className="min-w-0"><strong className="text-ink">{p.ref}</strong><p className="truncate text-ink-500">{p.date} · {p.items}</p></div>
            <strong className="text-ink">{taka(p.total)}</strong>
            <span className="text-ink-500">{p.total>p.paid?'Due '+taka(p.total-p.paid):'Paid'}</span>
          </div>)}
          {!purchases.length&&<p className="p-6 text-center text-sm text-ink-500">No purchases from this Vendor yet.</p>}
        </div>
      </details>
     </div>}
     {tab==='payments'&&<>
      <VendorPaymentsWorkspace state={snapshot} sources={activeSources} sourceId={sourceId}/>
      {profile.summary.purchaseDuePaisa>0&&<p className="mt-3 rounded-md bg-ink-50 p-3 text-xs text-ink-500">
       Ordinary Purchase due {money(profile.summary.purchaseDuePaisa)} stays linked to its Purchase invoice.
      </p>}
     </>}
   </div>
  </section>

  <VendorCorrectionDialog source={snapshot.sources.find(s=>s.id===correctSource)??null}
   event={snapshot.events.find(e=>e.id===correctEvent)??null} state={snapshot}
   onClose={()=>{setCorrectEvent(null);setCorrectSource(null);}}
   onReviewEvent={review} onBackToSource={()=>setCorrectEvent(null)}/>
  <VendorStatementDialog open={statementOpen} onClose={()=>setStatementOpen(false)}
   party={party} state={snapshot} range={checkedRange}/>
   </div>;
}
