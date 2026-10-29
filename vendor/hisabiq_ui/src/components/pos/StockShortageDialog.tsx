import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { AlertTriangle, PackageCheck, TrendingDown, Truck } from 'lucide-react';
import { Button } from '../Button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../Dialog';
import { AppSelect } from '../AppSelect';
import { Input } from '../Input';
import { getPartyPreviewSnapshot, subscribePartyPreview, dispatchPartyPreview } from '../../data/partyPreviewStore';
import type { CartLine } from '../../hooks/usePosCart';
import type { SaleStockSource } from '../../types/erp';
import { taka } from '../../utils/currency';
import { formatStock } from '../../utils/units';

type Choice = 'Own' | 'Negative' | 'Vendor';

type StockShortageDialogProps = {
  line: CartLine | null;
  availableBaseQty: number;
  shortageBaseQty: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseOwnStock: () => void;
  /** Bundle parent quantity is clamped in whole Sets, never its internal component count. */
  ownActionHint?:string;
  componentContext?:string;
  onResolve: (source: SaleStockSource) => void;
};

export function StockShortageDialog({ line, availableBaseQty, shortageBaseQty, open, onOpenChange, onUseOwnStock, ownActionHint, componentContext, onResolve }: StockShortageDialogProps) {
  const [choice, setChoice] = useState<Choice>('Own');
  const partiesState=useSyncExternalStore(subscribePartyPreview,getPartyPreviewSnapshot);
  const vendors=partiesState.parties.filter(p=>p.roles.includes('Vendor')&&p.status!=='Inactive');
  const [vendorId, setVendorId] = useState('');
  const [newVendorOpen,setNewVendorOpen]=useState(false);
  const [newVendorName,setNewVendorName]=useState('');
  const [newVendorPhone,setNewVendorPhone]=useState('');
  const [newVendorArea,setNewVendorArea]=useState('');
  const [newVendorError,setNewVendorError]=useState('');
  const [vendorCost, setVendorCost] = useState('');

  const factor = line?.product.altUnit && line.unit === line.product.altUnit.unit ? line.product.altUnit.factor : 1;
  const displayUnit = line?.unit ?? '';
  const vendor = vendors.find((item) => item.id === vendorId) ?? null;

  // Bundle componentLine is recreated as an object on parent renders. Never reset
  // the selected Vendor radio when quick-add updates Party preview subscribers.
  const sourceMode=line?.stockSource?.mode;
  const sourceVendorId=line?.stockSource?.mode==='Vendor'?line.stockSource.vendorId:'';
  const sourceUnitCost=line?.stockSource?.mode==='Vendor'?line.stockSource.unitCost:null;
  useEffect(() => {
    if (!open || !line) return;
    setChoice(sourceMode === 'Vendor' ? 'Vendor' : sourceMode === 'Negative' ? 'Negative' : 'Own');
    setVendorId(sourceVendorId);
    setVendorCost(sourceUnitCost!==null && sourceUnitCost!==undefined ? String(sourceUnitCost*factor) : '');
  }, [factor, line?.key, line?.product.id, open, sourceMode, sourceVendorId, sourceUnitCost]);

  const ownStockLabel = useMemo(() => line ? formatStock({ ...line.product, stock: availableBaseQty }) : '', [availableBaseQty, line]);
  if (!line) return null;

  const requestedBaseQty = availableBaseQty + shortageBaseQty;
  const requestedLabel = formatStock({ ...line.product, stock: requestedBaseQty });
  const shortageLabel = formatStock({ ...line.product, stock: shortageBaseQty });
  const pricePending=!vendorCost.trim();
  const costNumber=pricePending?null:Number(vendorCost);
  const validCost=pricePending || (costNumber!==null&&Number.isFinite(costNumber)&&costNumber>0);
  const createVendor=()=>{
    try{
      const known=new Set(partiesState.parties.map(p=>p.id));
      const next=dispatchPartyPreview({type:'create-party',party:{name:newVendorName.trim(),phone:newVendorPhone.trim(),area:newVendorArea.trim(),roles:['Vendor']}});
      const created=next.parties.find(p=>!known.has(p.id));
      if(!created)throw new Error('Could not create Vendor.');
      setVendorId(created.id);setNewVendorOpen(false);setNewVendorName('');setNewVendorPhone('');setNewVendorArea('');setNewVendorError('');
    }catch(e){setNewVendorError(e instanceof Error?e.message:'Cannot add Vendor');}
  };

  const methods:Choice[]=['Own','Negative','Vendor'];
  const onChoiceKey=(event:React.KeyboardEvent<HTMLButtonElement>,current:Choice)=>{
    if(!['ArrowDown','ArrowUp','ArrowRight','ArrowLeft','Home','End'].includes(event.key))return;
    event.preventDefault();
    const i=methods.indexOf(current);
    const next=event.key==='Home'?0:event.key==='End'?methods.length-1:
      (i+(event.key==='ArrowDown'||event.key==='ArrowRight'?1:-1)+methods.length)%methods.length;
    setChoice(methods[next]);
    event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]')[next]?.focus();
  };
  const save = () => {
    if (choice === 'Own') return onUseOwnStock();
    if (choice === 'Negative') return onResolve({ mode: 'Negative' });
    if (!vendor || !validCost) return;
    onResolve({ mode: 'Vendor', vendorId: vendor.id, vendorName: vendor.name,
      unitCost: costNumber===null?null:costNumber / factor });
  };

  return (
    <React.Fragment>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent role="dialog" aria-modal="true" aria-label="Stock shortage" className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Stock shortage <span className="font-bn text-sm font-normal text-ink-500">· স্টক কম</span></DialogTitle>
          <DialogDescription>
            {componentContext&&<span className="block font-medium">{componentContext}</span>}
            {line.product.name}: requested {requestedLabel}, own sellable stock {ownStockLabel}. Choose how to handle {shortageLabel} shortage.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2" role="radiogroup" aria-label="Stock shortage method">
          <button type="button" role="radio" aria-checked={choice==='Own'} tabIndex={choice==='Own'?0:-1} onKeyDown={e=>onChoiceKey(e,'Own')} onClick={() => setChoice('Own')} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left ${choice === 'Own' ? 'border-teal-400 bg-teal-50/60' : 'border-border hover:bg-ink-50'}`}>
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-teal-700 ring-1 ring-border"><PackageCheck className="size-4" /></span>
            <span>
              <span className="block text-sm font-medium text-ink">Own Stock <span className="font-bn text-xs font-normal text-ink-400">· নিজের স্টক</span></span>
              <span className="block text-xs text-ink-500">{ownActionHint ?? (availableBaseQty > 0 ? `Reduce this line to ${ownStockLabel}.` : 'No own stock is available; this removes the line.')}</span>
            </span>
          </button>

          <button type="button" role="radio" aria-checked={choice==='Negative'} tabIndex={choice==='Negative'?0:-1} onKeyDown={e=>onChoiceKey(e,'Negative')} onClick={() => setChoice('Negative')} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left ${choice === 'Negative' ? 'border-warning bg-warning-bg/70' : 'border-border hover:bg-ink-50'}`}>
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-warning ring-1 ring-border"><TrendingDown className="size-4" /></span>
            <span>
              <span className="block text-sm font-medium text-ink">Negative Sale <span className="font-bn text-xs font-normal text-ink-400">· নেগেটিভ বিক্রি</span></span>
              <span className="block text-xs text-ink-500">Complete the sale now; the shortage remains negative until future stock is received.</span>
            </span>
          </button>

          <button type="button" role="radio" aria-checked={choice==='Vendor'} tabIndex={choice==='Vendor'?0:-1} onKeyDown={e=>onChoiceKey(e,'Vendor')} onClick={() => setChoice('Vendor')} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left ${choice === 'Vendor' ? 'border-teal-400 bg-teal-50/60' : 'border-border hover:bg-ink-50'}`}>
            <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-card text-teal-700 ring-1 ring-border"><Truck className="size-4" /></span>
            <span>
              <span className="block text-sm font-medium text-ink">Vendor <span className="font-bn text-xs font-normal text-ink-400">· ভেন্ডর থেকে</span></span>
              <span className="block text-xs text-ink-500">Source only the shortage from a nearby Vendor. You can agree the cost later · দাম পরে।</span>
            </span>
          </button>
        </div>

        {choice === 'Vendor' && (
          <div className="space-y-3 rounded-xl border border-border bg-ink-50/30 p-3">
            <div className="block">
              <span className="mb-1 block text-xs font-medium text-ink-600">Vendor · কাছের দোকান</span>
              <div className="flex gap-1">
                <AppSelect label="Vendor" value={vendorId} onChange={setVendorId}
                  options={vendors.map(item=>({value:item.id,label:item.name}))} placeholder="Choose Vendor"/>
                <Button size="sm" variant="outline" aria-label="Quick add vendor" onClick={()=>setNewVendorOpen(true)}>+ New</Button>
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs font-medium text-ink-600">Vendor cost per {displayUnit} (optional)</p>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">৳</span>
                <Input value={vendorCost} onChange={(event) => setVendorCost(event.target.value.replace(/[^\d.]/g, ''))} inputMode="decimal" placeholder="Leave blank — price pending" className="pl-7 text-right" />
              </div>
              {pricePending?<p className="mt-1 text-[11px] font-medium text-warning">Price pending · দাম পরে নির্ধারণ — record quantity now, settle with Vendor later.</p>
                :validCost&&costNumber!==null&&factor>1?<p className="mt-1 text-[11px] text-ink-500">{taka(costNumber)} / {displayUnit} = {taka(costNumber / factor)} / {line.product.unit}</p>:null}
              {!validCost&&<p role="alert" className="mt-1 text-xs text-danger">Enter a positive cost or leave blank for pending price.</p>}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg bg-ink-50 p-2.5 text-xs text-ink-500">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
          {componentContext ? 'This choice applies only to this package component. Changing the Set quantity will clear its selection.' : 'This choice applies only to this cart line. Changing quantity or unit asks you to review the shortage again.'}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={choice === 'Vendor' && (!vendor || !validCost)}>
            {choice === 'Own' ? 'Use own stock' : choice === 'Negative' ? 'Allow negative sale' : 'Use vendor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
      <Dialog open={newVendorOpen} onOpenChange={v=>{setNewVendorOpen(v);if(!v)setNewVendorError('');}}>
        <DialogContent role="dialog" aria-label="Quick add Vendor" className="sm:max-w-md">
          <DialogHeader><DialogTitle>Add Vendor <span className="font-bn text-sm font-normal">· নতুন ভেন্ডর</span></DialogTitle>
           <DialogDescription>Create the nearby shop here. Your cart and payments stay unchanged.</DialogDescription></DialogHeader>
          <form onSubmit={e=>{e.preventDefault();createVendor();}} className="space-y-3">
            <label className="block text-xs font-medium text-ink">Vendor name *
              <Input aria-label="New Vendor name" value={newVendorName} onChange={e=>setNewVendorName(e.target.value)} required/></label>
            <label className="block text-xs font-medium text-ink">Phone
              <Input aria-label="New Vendor phone" value={newVendorPhone} onChange={e=>setNewVendorPhone(e.target.value)}/></label>
            <label className="block text-xs font-medium text-ink">Area
              <Input aria-label="New Vendor area" value={newVendorArea} onChange={e=>setNewVendorArea(e.target.value)}/></label>
            {newVendorError&&<p role="alert" className="text-xs text-danger">{newVendorError}</p>}
            <DialogFooter><Button type="button" variant="outline" onClick={()=>setNewVendorOpen(false)}>Cancel</Button>
              <Button type="submit">Add & select Vendor</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
}
