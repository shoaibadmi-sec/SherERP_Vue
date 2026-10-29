import { useState } from 'react';
import { BookOpen, Building2, ShoppingCart, Package, Truck, Wallet, Printer, Users, Bell, SlidersHorizontal, UserRound, ShieldCheck, Database, Search } from 'lucide-react';
import { Input } from '../components/Input';
import { matchesSearch } from '../utils/fuzzySearch';
import type { SettingsSection } from './model';
import type { SettingsTab } from './SettingsTabs';

const icons: Record<SettingsSection, typeof BookOpen> = {
  financialTerminology: BookOpen,
  business: Building2,
  sales: ShoppingCart,
  products: Package,
  purchases: Truck,
  money: Wallet,
  invoices: Printer,
  team: Users,
  notifications: Bell,
  interface: SlidersHorizontal,
  personal: UserRound,
  security: ShieldCheck,
  data: Database
};

/** In-page Settings directory modelled on Party Ledger's selected-row directory.
 * The normal ERP sidebar and header remain mounted; this is not a second app shell.
 */
export function SettingsDirectory({ items, selected, onSelect, id, panelId, language }: {
  items: readonly SettingsTab[];
  selected: string;
  onSelect: (next: string) => void;
  id: string;
  panelId: string;
  language: string;
}) {
  const [query, setQuery] = useState('');
  const shown = items.filter(item => matchesSearch(query, [item.label, item.bn]));
  const text = (english: string, bangla: string) => language === 'Bangla' ? bangla : english;
  return <aside data-settings-directory aria-label={text('Settings directory','সেটিংস তালিকা')}
    className="hidden min-w-0 self-start overflow-hidden rounded-xl border border-border bg-card shadow-card lg:block">
    <div className="space-y-2 border-b border-border p-3">
      <h2 className="text-[13px] font-semibold text-ink">{text('Settings','সেটিংস')}</h2>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-ink-400" aria-hidden="true"/>
        <Input
          type="search" aria-label={text('Find settings section','সেটিংস বিভাগ খুঁজুন')}
          value={query} onChange={event=>setQuery(event.target.value)}
          placeholder={text('Find a section…','বিভাগ খুঁজুন…')}
          className="h-9 w-full rounded-md border border-border pl-8 pr-3 text-[13px]"
        />
      </div>
    </div>
    <div className="flex items-center justify-between px-3 py-2 text-[11px] font-medium text-ink-400">
      <span>{text('SECTIONS','বিভাগ')}</span>
      <span>{shown.length}</span>
    </div>
    <nav role="tablist" aria-orientation="vertical" aria-label="Settings categories"
      className="max-h-[calc(100vh-285px)] min-h-[280px] overflow-y-auto pb-2 scrollbar-thin">
      {shown.map((item,index)=>{
        const Icon = icons[item.id as SettingsSection];
        const active = selected === item.id;
        return <button
          key={item.id} type="button" role="tab"
          id={`${id}-${item.id}`} data-settings-section={item.id}
          aria-controls={panelId} aria-selected={active}
          tabIndex={active || (!shown.some(x=>x.id===selected) && index===0) ? 0 : -1}
          onClick={()=>{ onSelect(item.id); setQuery(''); }}
          onKeyDown={event=>{
            if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
            event.preventDefault();
            const next = event.key==='Home'?0:event.key==='End'?shown.length-1:
              (index+(event.key==='ArrowUp'?-1:1)+shown.length)%shown.length;
            document.getElementById(`${id}-${shown[next]?.id}`)?.focus();
          }}
          className={'flex min-h-10 w-full min-w-0 items-center gap-3 border-l-2 px-3 py-2.5 text-left text-[13px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ' +
            (active?'border-teal-600 bg-teal-50/60 font-medium text-ink dark:bg-teal-900/20':'border-transparent text-ink-700 hover:bg-ink-50')}
        >
          {Icon && <Icon className="size-[17px] shrink-0" aria-hidden="true"/>}
          <span className="min-w-0 flex-1 truncate">{text(item.label,item.bn)}</span>
        </button>;
      })}
      {!shown.length && <p role="status" className="px-3 py-6 text-center text-xs text-helper">{text('No matching sections.','কোনো বিভাগ পাওয়া যায়নি।')}</p>}
    </nav>
  </aside>;
}
