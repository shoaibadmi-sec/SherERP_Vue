import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../Dialog';
import { Button } from '../Button';
import { Input } from '../Input';
import { AppSelect } from '../AppSelect';
import { AppDatePicker } from '../AppDateRangePicker';
import { businessToday } from '../../utils/dateRange';
import {useUiCopy} from '../../i18n/useUiCopy';
import {partyRoleLabel,partyOpeningDirectionLabel} from '../../i18n/partyCopy';
import { openingDirectionLabels, defaultOpeningSide } from './PartyOpeningDialog';
import { partyRoles } from '../../data/parties';
import type { Party, PartyRole } from '../../types/erp';
import type { PartyDraft, PartyOpeningPayload, PartySourceRecord } from '../../types/partyLedger';

type Props = {
  open: boolean;
  party?: Party | null;
  onClose: () => void;
  existingOpenings?: PartySourceRecord[];
  onSave: (party: PartyDraft, openings:Omit<PartyOpeningPayload,'partyId'>[]) => void;
  defaultRole?: PartyRole;
  initialName?: string;
};

const fresh = (party?: Party | null, initialName='', defaultRole:PartyRole='Customer'):PartyDraft => ({
  id:party?.id, name:party?.name??initialName,nameBn:party?.nameBn??'',
  phone:party?.phone??'',area:party?.area??'',roles:[...(party?.roles??[defaultRole])],
  avatarColor:party?.avatarColor??'#0D7C74',
  image:party?.image
});

type OpeningDraft={amount:string;side:'debit'|'credit';date:string};
export function PartyEditorDialog({open,party,existingOpenings=[],onClose,onSave,defaultRole='Customer',initialName=''}:Props) {
  const {text,language,showHelper}=useUiCopy();
  const roleLabel=(role:PartyRole)=>partyRoleLabel(role,language);
  const directionLabel=(label:string)=>partyOpeningDirectionLabel(label,language);
  const [draft,setDraft]=useState<PartyDraft>(()=>fresh(party,initialName,defaultRole));
  const [error,setError]=useState('');
  const [openings,setOpenings]=useState<Partial<Record<PartyRole,OpeningDraft>>>({});
  const existing=(role:PartyRole)=>existingOpenings.find(row=>row.relationship===role);
  const initial=(role:PartyRole):OpeningDraft=>{
    const row=existing(role);
    return {amount:row?String(row.debit||row.credit):'',
      side:row?.credit?'credit':row?.debit?'debit':defaultOpeningSide(role),
      date:row?.date??businessToday()};
  };
  const opening=(role:PartyRole)=>openings[role]??initial(role);
  const changeOpening=(role:PartyRole,patch:Partial<OpeningDraft>)=>setOpenings(prev=>({
    ...prev,[role]:{...opening(role),...patch}
  }));
  useEffect(()=>{if(open){setDraft({...fresh(party,initialName,defaultRole),roles:party?.roles??[defaultRole]});setOpenings({});setError('');}},[open,party,defaultRole,initialName]);
  const update=(patch:Partial<PartyDraft>)=>setDraft(current=>({...current,...patch}));
  const toggleRole=(role:PartyRole,checked:boolean)=>update({
    roles:checked
      ? partyRoles.filter(item=>item===role || draft.roles.includes(item))
      : draft.roles.filter(item=>item!==role)
  });
  const submit=(event:React.FormEvent)=>{
    event.preventDefault();
    try {
      const changes:Omit<PartyOpeningPayload,'partyId'>[]=[];
      for(const role of draft.roles){
        const entry=opening(role);
        const original=existing(role);
        if(!entry.amount.trim())continue;
        const amount=Number(entry.amount);
        if(!Number.isFinite(amount))throw new Error(text('Enter a valid opening amount for ','শুরুর জেরের সঠিক টাকার পরিমাণ লিখুন: ')+roleLabel(role));
        const unchanged=!!original&&amount===(original.debit||original.credit)
          &&entry.side===(original.credit?'credit':'debit')&&entry.date===original.date;
        if(!unchanged&&(amount>0||original))changes.push({
          relationship:role,amount,side:entry.side,date:entry.date
        });
      }
      onSave(draft,changes);setError('');onClose();
    }
    catch(err){setError(err instanceof Error?err.message:text('Cannot save party.','পার্টির তথ্য রাখা যায়নি।'));}
  };
  return <Dialog open={open} onOpenChange={value=>!value&&onClose()}>
    <DialogContent role="dialog" aria-modal="true" aria-label={party?text("Edit party","পার্টির তথ্য বদলান"):text("Add party","নতুন পার্টি যোগ করুন")} className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{party?text('Edit party','পার্টির তথ্য বদলান'):text('Add party','নতুন পার্টি যোগ করুন')} {showHelper&&<span className="font-bn text-sm font-normal text-ink-500">পার্টি তথ্য</span>}</DialogTitle>
        <DialogDescription>{text('One person can be a customer, supplier or hold multiple roles. This is a preview; no backend record is written.','একই ব্যক্তি ক্রেতা ও সরবরাহকারী দুটোই হতে পারেন। এটি শুধু প্রিভিউ; সার্ভারে কোনো তথ্য রাখা হচ্ছে না।')}</DialogDescription>
      </DialogHeader>
      <form onSubmit={submit} className="space-y-4" aria-label={text("Party profile form","পার্টির তথ্য ফরম")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs font-medium text-ink-700">{text('Party name','পার্টির নাম')} *
            <Input aria-label={text('Party name','পার্টির নাম')} value={draft.name} required onChange={event=>update({name:event.target.value})}/>
          </label>
          <label className="space-y-1 text-xs font-medium text-ink-700">{text('Bangla name','বাংলা নাম')}
            <Input aria-label={text('Bangla name','বাংলা নাম')} value={draft.nameBn??''} onChange={event=>update({nameBn:event.target.value})}/>
          </label>
          <label className="space-y-1 text-xs font-medium text-ink-700">{text('Phone','ফোন')}
            <Input aria-label={text('Phone','ফোন')} type="tel" value={draft.phone} onChange={event=>update({phone:event.target.value})}/>
          </label>
          <label className="space-y-1 text-xs font-medium text-ink-700">{text('Area / address','এলাকা / ঠিকানা')}
            <Input aria-label={text('Area','এলাকা')} value={draft.area} onChange={event=>update({area:event.target.value})}/>
          </label>
        </div>
        <fieldset className="rounded-lg border border-border p-3">
          <legend className="px-1 text-xs font-semibold text-ink">{text('Relationships','সম্পর্কের ধরন')} {showHelper&&<span className="font-bn font-normal text-ink-500">সম্পর্ক নির্বাচন</span>}</legend>
          <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {partyRoles.map(role=><label key={role} className="flex items-center gap-2 rounded-md border border-border px-2 py-2 text-xs hover:bg-ink-50">
              <input type="checkbox" checked={draft.roles.includes(role)} onChange={event=>toggleRole(role,event.target.checked)} className="size-4 accent-teal-600"/>
              {roleLabel(role)}
            </label>)}
          </div>
        </fieldset>
        <details className="rounded-lg border border-border p-3" data-testid="party-opening-section">
          <summary className="cursor-pointer text-xs font-semibold text-ink">{text('Opening balances (optional)','শুরুর জের (ঐচ্ছিক)')} {showHelper&&<span className="font-bn font-normal text-ink-500">প্রারম্ভিক জের</span>}</summary>
          <p className="mt-2 text-[11px] text-ink-500">{text('Each relationship has its own opening balance. This is not cash received or paid. Enter 0 to clear an existing balance.','প্রতিটি সম্পর্কের শুরুর জের আলাদা। এখানে কোনো টাকা নেওয়া বা দেওয়া হচ্ছে না। আগের জের মুছতে ০ লিখুন।')}</p>
          <div className="mt-3 space-y-3">
            {draft.roles.map(role=><div key={role} className="space-y-2 rounded-md bg-ink-50/60 p-3">
              <p className="text-xs font-semibold text-ink">{roleLabel(role)}</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="space-y-1 text-xs text-ink-700">{text('Opening amount (৳)','শুরুর জের (৳)')}
                  <Input aria-label={`${text('Opening amount','শুরুর জের')} ${roleLabel(role)}`} inputMode="decimal" placeholder={text('No opening balance','শুরুর জের নেই')}
                    value={opening(role).amount} onChange={e=>changeOpening(role,{amount:e.target.value})}/>
                </label>
                <label className="space-y-1 text-xs text-ink-700">{text('Direction','কোন দিকে জের')}
                  <AppSelect label={`${text('Opening direction','জেরের ধরন')} ${roleLabel(role)}`} value={opening(role).side}
                    onChange={v=>changeOpening(role,{side:v as 'debit'|'credit'})}
                    options={Object.entries(openingDirectionLabels(role)).map(([value,label])=>({value,label:directionLabel(label)}))}/>
                </label>
                <div className="space-y-1 text-xs text-ink-700"><span>{text('Opening date','শুরুর তারিখ')}</span>
                  <AppDatePicker label={`${text('Opening date','শুরুর তারিখ')} ${roleLabel(role)}`} value={opening(role).date}
                    onChange={v=>changeOpening(role,{date:v})}/>
                </div>
              </div>
            </div>)}
          </div>
        </details>
        {!!error&&<p role="alert" className="rounded-md bg-danger-bg px-3 py-2 text-xs text-danger">{error}</p>}
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={onClose}>{text('Cancel','বাতিল')}</Button>
          <Button type="submit">{text('Save party','পার্টির তথ্য রাখুন')}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}
