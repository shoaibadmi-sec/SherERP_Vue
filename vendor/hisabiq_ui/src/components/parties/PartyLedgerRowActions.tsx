import React from 'react';
import { Eye, MoreHorizontal, Pencil, Printer, RotateCcw, Trash2, ExternalLink, CornerUpLeft } from 'lucide-react';
import { FloatingPanel } from '../layout/FloatingPanel';
import type { PartyAction, PartyLedgerRow } from '../../types/partyLedger';
import {useUiCopy} from '../../i18n/useUiCopy';
import {partyLedgerActionLabel} from '../../i18n/partyLedgerCopy';

type Availability={action:PartyAction;enabled:boolean;reason?:string};
type Props={row:PartyLedgerRow;actions:Availability[];onAction:(action:PartyAction,row:PartyLedgerRow)=>void};
const icons:Record<PartyAction,React.ComponentType<{className?:string}>>={
  view:Eye,edit:Pencil,delete:Trash2,reverse:RotateCcw,print:Printer,return:CornerUpLeft,source:ExternalLink
};
export function PartyLedgerRowActions({row,actions,onAction}:Props){
  const {text,language}=useUiCopy();
  return <FloatingPanel label={text('Transaction actions for','লেনদেনের কাজ')+' '+(row.reference??row.id)} width={220}
    trigger={({toggle,open})=><button type="button" aria-label={text('Actions for','কাজ')+' '+(row.reference??row.id)}
      aria-expanded={open} onClick={toggle}
      className="rounded-md p-1.5 text-ink-500 hover:bg-ink-50 focus-visible:ring-2 focus-visible:ring-teal-500">
      <MoreHorizontal className="size-4"/>
    </button>}
    >{close=><div className="py-1" role="group" aria-label={text('Transaction row actions','লেনদেনের সারির কাজ')}>
      {actions.map(({action,enabled,reason})=>{
        const Icon=icons[action];
        return <button key={action} type="button" disabled={!enabled} title={reason??partyLedgerActionLabel(language,action)}
          onClick={()=>{close();onAction(action,row);}}
          className={'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs focus-visible:bg-ink-50 hover:bg-ink-50 disabled:cursor-not-allowed disabled:opacity-40 '+(action==='delete'||action==='reverse'?'text-danger':'text-ink')}>
          <Icon className="size-3.5"/>{partyLedgerActionLabel(language,action)}{!enabled&&<span className="sr-only">{reason}</span>}
        </button>;
      })}
    </div>}</FloatingPanel>;
}
