import { useState, useSyncExternalStore } from 'react';
import { ChevronDown, UserRound, X } from 'lucide-react';
import { FloatingPanel } from '../layout/FloatingPanel';
import { Input } from '../Input';
import { PartyAvatar } from '../PartyAvatar';
import {getPartyPreviewSnapshot,subscribePartyPreview} from '../../data/partyPreviewStore';
import { taka } from '../../utils/currency';
import {rankSearch} from '../../utils/fuzzySearch';
import type { Party } from '../../types/erp';
import { useUiCopy } from '../../i18n/useUiCopy';

type CustomerPickerProps = {
  value: Party | null;
  onChange: (p: Party | null) => void;
  /** Customer-only ledger balance before this unposted sale, not the current invoice due. */
  previousBalance?: number | null;
};

export function CustomerPicker({ value, onChange, previousBalance }: CustomerPickerProps) {
  const [q, setQ] = useState('');
  const { word,text } = useUiCopy();
  const partyState=useSyncExternalStore(subscribePartyPreview,getPartyPreviewSnapshot);
  // Only active Customer relationships are valid at checkout; Borrower is a separate ledger role.
  const customers = rankSearch(partyState.parties.filter(p=>p.roles.includes('Customer')&&p.status!=='Inactive'),
    q,p=>[p.name,p.nameBn,p.phone,p.area]);

  return (
    <FloatingPanel
      className="block w-full"
      label={word("chooseCustomer")}
      align="left"
      width={320}
      trigger={({ toggle, open }) =>
        <div className="flex h-9 w-full min-w-0 items-center rounded-lg border border-border bg-card focus-within:border-teal-500 hover:border-ink-200">
          <button
            type="button"
            data-testid="pos-customer-picker-trigger"
            onClick={toggle}
            aria-expanded={open}
            className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-l-lg px-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500">
            {value ?
              <PartyAvatar name={value.name} color={value.avatarColor} size={26} /> :
              <span className="flex size-[26px] shrink-0 items-center justify-center rounded-full bg-ink-50 text-ink-400">
                <UserRound className="size-3.5" />
              </span>}
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13px] font-medium text-ink">{value ? value.name : word('walkIn')}</span>
              {value ? (
                <span className="flex min-w-0 items-center gap-1 text-[10.5px] text-ink-500">
                  <span className="min-w-0 truncate" title={value.phone}>{value.phone}</span>
                  {previousBalance != null && (
                    <span data-pos-previous-balance-inline
                      data-balance-type={previousBalance > 0 ? 'due' : previousBalance < 0 ? 'advance' : 'clear'}
                      title={previousBalance < 0
                        ? text('Customer advance', 'ক্রেতার অগ্রিম জমা')
                        : word('prevDue')}
                      className={'shrink-0 whitespace-nowrap text-[10px] '+
                        (previousBalance > 0 ? 'text-danger' : previousBalance < 0 ? 'text-success' : 'text-ink-500')}>
                      · {previousBalance < 0 ? text('Adv.', 'জমা') : word('prevDue')} {taka(Math.abs(previousBalance))}
                    </span>
                  )}
                </span>
              ) : <span className="block truncate text-[11px] text-ink-500">{word('cashCustomerOptional')}</span>}
            </span>
            {!value && <ChevronDown className="size-4 shrink-0 text-ink-400" />}
          </button>
          {value && (
            <button
              type="button"
              data-testid="pos-customer-clear-inline"
              onClick={() => onChange(null)}
              aria-label={word("clearCustomer")}
              title={word("clearCustomer")}
              className="flex h-full w-8 shrink-0 items-center justify-center rounded-r-lg text-ink-500 hover:bg-ink-50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500">
              <X className="size-4" />
            </button>
          )}
        </div>
      }>
      
      {(close) =>
      <div>
          <div className="border-b border-border p-2">
            <Input
            data-testid="pos-customer-picker-search"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&q.trim()&&customers[0]){e.preventDefault();onChange(customers[0]);close();}}}
            aria-label={word("searchCustomer")}
            placeholder={word("searchCustomer")}
            className="h-9 w-full rounded-md border border-border px-2.5 text-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
          
          </div>
          <ul className="max-h-64 overflow-auto p-1">
            <li>
              <button
              onClick={() => {
                onChange(null);
                close();
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-ink-50">
              
                <span className="flex size-7 items-center justify-center rounded-full bg-ink-50 text-ink-400">
                  <UserRound className="size-3.5" />
                </span>
                <span className="text-[13px] text-ink">{word("walkIn")}</span>
              </button>
            </li>
            {customers.map((c) =>
          <li key={c.id}>
                <button
              onClick={() => {
                onChange(c);
                close();
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-ink-50">
              
                  <PartyAvatar name={c.name} color={c.avatarColor} size={28} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium text-ink">{c.name}</span>
                    <span className="block text-[11px] text-ink-500">{c.phone}</span>
                  </span>
                  {c.balance > 0 && <span className="text-xs text-danger">{taka(c.balance)}</span>}
                </button>
              </li>
          )}
            {q.trim()&&customers.length===0&&<li className="px-3 py-4 text-sm text-ink-500" role="status">{text('No matching customers','কোনো ক্রেতা পাওয়া যায়নি')}</li>}
          </ul>
        </div>
      }
    </FloatingPanel>);

}
