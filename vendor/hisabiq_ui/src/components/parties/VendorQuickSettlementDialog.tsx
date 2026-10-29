import {useState,useSyncExternalStore} from 'react';
import {Banknote, HandCoins} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '../Dialog';
import {AppSelect} from '../AppSelect';
import {VendorActionDialog} from './VendorActionDialog';
import {getVendorPreviewSnapshot,subscribeVendorPreview} from '../../vendor/vendorPreviewStore';
import {sourceOutstanding} from '../../vendor/vendorModel';
import {products} from '../../data/products';
import {taka} from '../../utils/currency';
import {useUiCopy} from '../../i18n/useUiCopy';
import type {VendorSource} from '../../vendor/vendorTypes';

export type VendorQuickSettlementMode='pay'|'receive-money';
type Props={
  open:boolean;
  partyId:string;
  partyName:string;
  mode:VendorQuickSettlementMode;
  onClose:()=>void;
};

/** Reuses the Vendor workspace's source-linked settlement form *inside* the Party module.
 * Memo selection happens in this same dialog; no cross-module redirect or second popup.
 * Payments are written by VendorActionDialog through the audited Vendor preview commands.
 */
export function VendorQuickSettlementDialog({open,partyId,partyName,mode,onClose}:Props){
  const {text}=useUiCopy();
  const state=useSyncExternalStore(subscribeVendorPreview,getVendorPreviewSnapshot);
  const [selectedId,setSelectedId]=useState('');
  const paying=mode==='pay';
  const dueSources=state.sources.filter(source=>
    source.vendorPartyId===partyId && source.status==='Active' &&
    source.sourceKind===(paying?'sourcing':'issue') &&
    source.unitCostBasePaisa!==null &&
    (sourceOutstanding(state,source.id).monetaryDuePaisa??0)>0
  ).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
  const source:VendorSource|null=dueSources.find(row=>row.id===selectedId)??dueSources[0]??null;
  const outstanding=source?sourceOutstanding(state,source.id).monetaryDuePaisa??0:0;
  const totalDue=dueSources.reduce((sum,row)=>sum+(sourceOutstanding(state,row.id).monetaryDuePaisa??0),0);
  const unpriced=paying?state.sources.filter(row=>row.vendorPartyId===partyId&&row.status==='Active'&&
    row.sourceKind==='sourcing'&&sourceOutstanding(state,row.id).unpricedBaseQty>0).length:0;
  const Icon=paying?Banknote:HandCoins;
  const title=paying?text('Pay Vendor','ভেন্ডরকে টাকা দিন'):text('Receive Money','টাকা নিন');
  return <Dialog open={open} onOpenChange={next=>{if(!next)onClose();}}>
    <DialogContent role="dialog" aria-label={title}
      className="w-[calc(100vw-1.25rem)] max-h-[92dvh] overflow-y-auto sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Icon className="size-5 text-teal-700" aria-hidden="true"/>{title}
        </DialogTitle>
        <DialogDescription>{partyName} · {text(
          'Settle a Vendor memo here without leaving Parties & Ledger. Preview only.',
          'পার্টি ও খাতা ছাড়াই ভেন্ডরের মেমোর টাকা মেটান। শুধু প্রিভিউ।'
        )}</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-xl bg-ink-50 px-3.5 py-3">
          <span className="text-sm text-ink-500">{paying
            ?text('Vendor payable','ভেন্ডরকে দেনা')
            :text('Vendor receivable','ভেন্ডরের কাছে পাওনা')}</span>
          <strong className="whitespace-nowrap text-lg text-ink">{taka(totalDue/100)}</strong>
        </div>
        {source?<>
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-ink">{text('Choose pending memo','বাকি মেমো বাছুন')}</p>
            <AppSelect label={text('Vendor settlement memo','ভেন্ডর মেমো')} value={source.id}
              options={dueSources.map(row=>({
                value:row.id,
                label:(row.reference??row.id)+' · '+(products.find(p=>p.id===row.productId)?.name??row.productId)+
                  ' · '+taka((sourceOutstanding(state,row.id).monetaryDuePaisa??0)/100)
              }))}
              onChange={setSelectedId}/>
          </div>
          <p className="flex items-center justify-between gap-2 text-xs text-ink-500">
            <span>{text('This memo is due','এই মেমোর বাকি')}</span>
            <strong className="text-sm text-ink">{taka(outstanding/100)}</strong>
          </p>
          <VendorActionDialog key={mode+':'+source.id} inline mode={mode} source={source}
            onClose={()=>{setSelectedId('');onClose();}}/>
        </>:<p role="status" className="rounded-lg border border-border bg-ink-50 px-4 py-6 text-center text-sm text-ink-500">
          {text('No priced outstanding Vendor memo for this action.','এই কাজের জন্য কোনো দাম নির্ধারিত বাকি মেমো নেই।')}
          {unpriced>0&&<span className="mt-2 block">{unpriced} {text(
            'taken memo(s) need a price in Vendor Work before payment.',
            'টি নেওয়া মেমোর দাম ভেন্ডর মডিউলে ঠিক করতে হবে।'
          )}</span>}
        </p>}
      </div>
    </DialogContent>
  </Dialog>;
}
