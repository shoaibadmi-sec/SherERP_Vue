import { useEffect, useRef, type KeyboardEvent } from 'react';
import { Search } from 'lucide-react';
import { PartyAvatar } from '../PartyAvatar';
import { Input } from '../Input';
import { RoleBadge } from './RoleBadge';
import { partyRoles } from '../../data/parties';
import type { Party, PartyRole } from '../../types/erp';
import { taka } from '../../utils/currency';
import {useUiCopy} from '../../i18n/useUiCopy';
import {partyRoleLabel} from '../../i18n/partyCopy';

type PartyDirectoryProps = {
  parties: Party[];
  selectedId: string;
  onSelect: (id: string) => void;
  role: PartyRole | 'All';
  onRole: (r: PartyRole | 'All') => void;
  query: string;
  onQuery: (q: string) => void;
  picker?: boolean;
};

export function PartyDirectoryResponsive({ parties, selectedId, onSelect, role, onRole, query, onQuery, picker=false }: PartyDirectoryProps) {
  const {text,language}=useUiCopy();
  const listRef=useRef<HTMLUListElement>(null);
  useEffect(()=>{
    if(picker)listRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView({block:'nearest'});
  },[picker]);
  const options=()=>Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>('[role="option"]')??[]);
  const onSearchKeyDown=(e:KeyboardEvent<HTMLInputElement>)=>{
    if(e.key==='ArrowDown'){e.preventDefault();options()[0]?.focus();}
  };
  const onListKeyDown=(e:KeyboardEvent<HTMLUListElement>)=>{
    const list=options();
    const index=list.indexOf(document.activeElement as HTMLButtonElement);
    let next=index;
    if(e.key==='ArrowDown')next=Math.min(list.length-1,index+1);
    else if(e.key==='ArrowUp')next=Math.max(0,index-1);
    else if(e.key==='Home')next=0;
    else if(e.key==='End')next=list.length-1;
    else return;
    e.preventDefault();list[next]?.focus();
  };
  return (
    <div className={`flex min-h-0 min-w-0 flex-col bg-card ${picker ? 'flex-1 overflow-hidden' : 'rounded-xl border border-border shadow-card'}`}>
      <div className="space-y-2 border-b border-border p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <Input
            value={query}
            autoFocus={picker}
            onKeyDown={onSearchKeyDown}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={text('Search name or phone…','নাম বা ফোন দিয়ে খুঁজুন…')}
            aria-label={text('Search parties','পার্টি খুঁজুন')}
            className={`${picker ? 'h-11' : 'h-10'} w-full rounded-md border border-border pl-8 pr-3 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20`} />
          
        </div>
        <div className={`flex gap-1 ${picker ? 'overflow-x-auto pb-1' : 'flex-wrap'}`} role="tablist" aria-label={text('Filter by role','সম্পর্ক অনুযায়ী বাছুন')}>
          {(['All', ...partyRoles] as (PartyRole | 'All')[]).map((r) =>
          <button
            key={r}
            role="tab"
            aria-selected={role === r}
            onClick={() => onRole(r)}
            className={`${picker ? 'h-9 shrink-0' : 'h-7 shrink-0'} rounded-lg px-2.5 text-[13px] font-medium transition-colors ${
            role === r ? 'bg-inverse text-white' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'}`
            }>
            
              {r==='All'?text('All','সব'):partyRoleLabel(r,language)}
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-400">
        <span>{parties.length} {text('parties','পার্টি')}</span>
        <span>{text('Balance','জের')}</span>
      </div>

      <ul ref={listRef} onKeyDown={onListKeyDown} data-party-directory-list className={`${picker ? 'min-h-0 max-h-[min(52dvh,480px)]' : 'max-h-[calc(100vh-290px)] min-h-[320px]'} flex-1 overflow-auto scrollbar-thin`} role="listbox" aria-label={text('Parties','পার্টি তালিকা')}>
        {parties.map((p) => {
          const active = p.id === selectedId;
          return (
            <li key={p.id} role="presentation">
              <button role="option" aria-selected={active}
                onClick={() => onSelect(p.id)}
                className={`flex w-full min-w-0 items-center gap-3 border-l-2 px-3 text-left transition-colors ${picker ? 'min-h-16 py-3' : 'py-2.5'} ${
                active ? 'border-teal-600 bg-teal-50' : 'border-transparent hover:bg-ink-50'}`
                }>
                
                <PartyAvatar name={p.name} color={p.avatarColor} image={p.image} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium text-ink">{p.name}</p>
                  <div className="mt-0.5 flex items-center gap-1">
                    {p.roles.map((r) =>
                    <RoleBadge key={r} role={r} />
                    )}
                    <span className="truncate text-[12px] text-ink-400">· {p.lastActivity}</span>
                  </div>
                </div>
                <div className="min-w-0 shrink-0 text-right">
                  {role==='All'&&p.roles.length>1?
                    <><p className="text-[12px] font-semibold text-ink-600">{text('Multiple ledgers','একাধিক খাতা')}</p>
                      <p className="text-[10.5px] text-ink-400">{text('Select relationship','কোন সম্পর্কের হিসাব দেখবেন?')}</p></>:
                    <><p className={`text-[14px] font-semibold ${p.balance > 0 ? 'text-teal-700' : p.balance < 0 ? 'text-danger' : 'text-ink-400'}`}>
                      {p.balance === 0 ? '৳0' : taka(Math.abs(p.balance))}
                    </p>
                    <p className="text-[10.5px] text-ink-400">{p.balance > 0 ? text('Receivable','পাওনা') : p.balance < 0 ? text('Payable','দেনা') : text('Settled','হিসাব মিটেছে')}</p></>}
                </div>
              </button>
            </li>);

        })}
        {parties.length === 0 && <li className="px-3 py-10 text-center text-sm text-ink-500">{text('No parties found.','কোনো পার্টি পাওয়া যায়নি।')}</li>}
      </ul>
    </div>);

}
