import {useState} from 'react';
import {Download,Printer} from 'lucide-react';
import {Button} from '../Button';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '../Dialog';
import {taka} from '../../utils/currency';
import {useUiCopy} from '../../i18n/useUiCopy';
import type {Party} from '../../types/erp';
import type {IsoRange} from '../../utils/dateRange';
import type {VendorPreviewState,VendorSide} from '../../vendor/vendorTypes';
import {projectVendorStatement,serializeVendorStatementCsv} from '../../vendor/vendorLedger';
type Props={open:boolean;onClose:()=>void;party:Party;state:VendorPreviewState;range:IsoRange};
export function VendorStatementDialog({open,onClose,party,state,range}:Props){
 const {text,showHelper}=useUiCopy();
 const [side,setSide]=useState<VendorSide>('payable');
 const statement=projectVendorStatement(state,party.id,side,range);
 const download=()=>{
  const csv=serializeVendorStatementCsv(statement,party.name);
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;
  a.download='vendor-ledger-'+party.id+'-'+side+'.csv';document.body.appendChild(a);a.click();a.remove();
  URL.revokeObjectURL(url);
 };
 return <Dialog open={open} onOpenChange={next=>!next&&onClose()}>
  <DialogContent role="dialog" aria-modal="true" aria-label={text("Vendor ledger statement","ভেন্ডরের হিসাবের বিবরণ")}
    className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
   <DialogHeader>
    <DialogTitle>{text("Vendor ledger statement","ভেন্ডরের হিসাবের বিবরণ")} {showHelper&&<span className="font-bn text-sm font-normal text-ink-500">· ভেন্ডর খাতা</span>}</DialogTitle>
    <DialogDescription>{text("Demo preview — not accounting records. Payable and receivable are always separate.","শুধু নমুনা — আসল হিসাব নয়। দেনা ও পাওনা আলাদা দেখানো হয়।")}</DialogDescription>
   </DialogHeader>
   <div className="flex flex-wrap gap-2" role="tablist" aria-label={text("Vendor statement side","ভেন্ডরের দেনা-পাওনা")}>
    {(['payable','receivable'] as const).map(value=><Button key={value}
      size="sm" variant={side===value?'default':'outline'}
      role="tab" aria-selected={side===value} onClick={()=>setSide(value)}>
      {value==='payable'?text('You owe Vendor','ভেন্ডরকে দিতে হবে'):text('Vendor owes you','ভেন্ডরের কাছে পাবেন')}</Button>)}
   </div>
   <div className="space-y-4 rounded-lg border border-border bg-card p-3 text-ink" id="vendor-statement-print">
    <div className="flex flex-wrap justify-between gap-3 border-b border-border pb-3">
     <div><strong>{party.name}</strong><p className="text-xs text-ink-500">{party.phone} · {party.area}</p></div>
     <div className="text-xs text-ink-500">{text("HisabIQ · Demo preview","HisabIQ · শুধু নমুনা")}
      <p>{range.from||text('All time','শুরু থেকে')} — {range.to||text('Today','আজ')}</p>
      <p>{text('Account:','হিসাব:')} {side==='payable'?text('Taken products payable','নেওয়া পণ্যের দেনা'):text('Given products receivable','দেওয়া পণ্যের পাওনা')}</p>
     </div>
    </div>
    <div className="text-sm">{text("Opening:","শুরুর জের:")} <strong>{taka(statement.openingPaisa/100)}</strong></div>
    <div className="overflow-x-auto"><table data-erp-table="" className="w-full text-xs">
      <thead><tr className="border-y border-border bg-ink-50">
       <th className="p-2 text-left">{text("Date","তারিখ")}</th><th className="p-2 text-left">{text("Source","উৎস")}</th>
       <th className="p-2 text-right">{text("Increase","বেড়েছে")}</th><th className="p-2 text-right">{text("Decrease","কমেছে")}</th>
       <th className="p-2 text-right">{text("Running","চলতি জের")}</th>
      </tr></thead>
      <tbody>{statement.rows.map(e=><tr key={e.id} className="border-b border-border/70">
       <td className="whitespace-nowrap p-2">{e.date}</td>
       <td className="p-2"><strong>{e.reference??e.sourceId??e.id}</strong>
        <p className="text-ink-500">{e.description}</p></td>
       <td className="p-2 text-right">{e.deltaPaisa>0?taka(e.deltaPaisa/100):'—'}</td>
       <td className="p-2 text-right">{e.deltaPaisa<0?taka(-e.deltaPaisa/100):'—'}</td>
       <td className="p-2 text-right">{taka(e.runningPaisa/100)}</td>
      </tr>)}</tbody>
    </table></div>
    {side==='payable'&&statement.unpricedSources.length>0&&<div className="rounded-lg border border-warning/20 bg-warning-bg/30 p-3 text-xs">
      <p className="font-semibold">{text("Price not set","দাম এখনো ঠিক হয়নি")}{showHelper&&" · দাম পরে নির্ধারণ"}</p>
      {statement.unpricedSources.map(source=><p key={source.id} className="mt-1">
       {source.reference??source.id} · {source.productId} · {source.baseQty} {text("base units","মূল একক")} · {text("Unpriced (not ৳0)","দাম অজানা (৳০ নয়)")}
      </p>)}
    </div>}
    <div className="ml-auto max-w-xs space-y-1 border-t border-border pt-2 text-xs">
      <p>{text("Period increase:","এই সময় বেড়েছে:")} <strong>{taka(statement.periodIncreasePaisa/100)}</strong></p>
      <p>{text("Period decrease:","এই সময় কমেছে:")} <strong>{taka(statement.periodDecreasePaisa/100)}</strong></p>
      <p className="text-sm font-semibold">{text("Closing:","শেষ জের:")} {taka(statement.closingPaisa/100)}</p>
    </div>
   </div>
   <div className="flex justify-end gap-2">
    <Button size="sm" variant="outline" onClick={onClose}>{text("Close","বন্ধ করুন")}</Button>
    <Button size="sm" variant="outline" onClick={download}><Download className="size-4"/> {text("Export CSV","CSV নামান")}</Button>
    <Button size="sm" onClick={()=>window.print()}><Printer className="size-4"/> {text("Print","প্রিন্ট করুন")}</Button>
   </div>
  </DialogContent>
 </Dialog>;
}
