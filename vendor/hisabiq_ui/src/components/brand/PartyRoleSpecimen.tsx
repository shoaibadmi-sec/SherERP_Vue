import { useRef, useState } from 'react';
import { BookOpen, FilePlus2, HandCoins, MapPin, MoreHorizontal, Phone, StickyNote, type LucideIcon } from 'lucide-react';
import { useUiCopy } from '../../i18n/useUiCopy';
import { partyRoleLabel } from '../../i18n/partyCopy';
import type { PartyRole } from '../../types/erp';
import { partyFinanceActions, partyTradingActionIcons } from '../parties/partyRoleActions';
import { PartyAvatar } from '../PartyAvatar';
import { RoleBadge } from '../parties/RoleBadge';
import { PartyBalanceCard } from '../parties/PartyBalanceCard';
import { PartyActionSheet } from '../parties/PartyActionSheet';
import { AppSelect } from '../AppSelect';
import { Button } from '../Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../Dialog';

const roles: PartyRole[] = ['Customer', 'Supplier', 'Owner', 'Lender', 'Borrower', 'Vendor', 'Payee'];
const identities: Record<PartyRole, { name: string; bn: string; color: string }> = {
  Customer: { name: 'Rahman Hardware', bn: 'রহমান হার্ডওয়্যার', color: '#0D7C74' },
  Supplier: { name: 'Karim Traders', bn: 'করিম ট্রেডার্স', color: '#22364F' },
  Owner: { name: 'Md. Anisur Rahman', bn: 'মোঃ আনিসুর রহমান', color: '#0B1A2C' },
  Lender: { name: 'Hasan Finance', bn: 'হাসান ফাইন্যান্স', color: '#22364F' },
  Borrower: { name: 'Mina Store', bn: 'মিনা স্টোর', color: '#22364F' },
  Vendor: { name: 'City Vendor', bn: 'সিটি ভেন্ডর', color: '#22364F' },
  Payee: { name: 'Office Rent Payee', bn: 'অফিস ভাড়ার প্রাপক', color: '#22364F' },
};

/** Uses the same action-icon map and finance specs as both live Party layouts. */
export function PartyRoleSpecimen() {
  const { text, language, showHelper } = useUiCopy();
  const [role, setRole] = useState<PartyRole>('Customer');
  const [credit, setCredit] = useState(false);
  const [more, setMore] = useState(false);
  const moreTrigger = useRef<HTMLButtonElement>(null);
  const previewFromSheet = useRef(false);
  const [opened, setOpened] = useState<{ label: string; source: string } | null>(null);
  const identity = identities[role];
  const finance = partyFinanceActions(role);
  const show = (label: string, source: string) => setOpened({ label, source });
  const closePreview = () => { setOpened(null); if (previewFromSheet.current) requestAnimationFrame(() => moreTrigger.current?.focus()); };
  type Action = { id: string; label: string; Icon?: LucideIcon; source: string; financeType?: string; disabled?: boolean; reason?: string; variant?: 'default' | 'outline' | 'ghost' };
  const actions: Action[] = [];
  if (role === 'Customer' || role === 'Supplier') {
    actions.push({ id: role === 'Customer' ? 'receive-payment' : 'make-payment', label: text(role === 'Customer' ? 'Receive payment' : 'Make payment', role === 'Customer' ? 'টাকা নিন' : 'টাকা দিন'), Icon: partyTradingActionIcons[role], source: 'PartyPaymentDialog' });
    actions.push({ id: 'refund-credit', label: text('Refund credit', 'জমা টাকা ফেরত'), source: 'PartyCreditRefundDialog', variant: 'outline', disabled: !credit, reason: !credit ? text('No verified refundable credit yet', 'ফেরত দেওয়ার মতো নিশ্চিত জমা টাকা নেই') : undefined });
    if (role === 'Customer') actions.push({ id: 'new-invoice', label: text('New invoice', 'নতুন বিল'), Icon: FilePlus2, source: 'POS V2 with selected customer', variant: 'outline' });
  }
  finance?.forEach((action, index) => actions.push({ id: action.id, label: text(action.label, action.bangla), Icon: action.Icon, source: action.financeType, financeType: action.financeType, variant: index === 0 ? 'default' : 'outline' }));
  if (role === 'Vendor') actions.push({ id: 'pay-vendor', label: text('Pay Vendor', 'ভেন্ডরকে টাকা দিন'), Icon: partyTradingActionIcons.Vendor, source: 'VendorQuickSettlementDialog: pay' }, { id: 'receive-vendor-money', label: text('Receive Money', 'টাকা নিন'), Icon: HandCoins, source: 'VendorQuickSettlementDialog: receive-money', variant: 'outline' });
  if (role === 'Payee') actions.push({ id: 'opening-balance', label: text('Opening balance', 'শুরুর জের'), Icon: BookOpen, source: 'PartyOpeningDialog' });
  actions.push({ id: 'add-note', label: text('Add note', 'নোট যোগ করুন'), Icon: StickyNote, source: 'Party notes', variant: 'ghost' });
  const mobileSecondary = role === 'Customer' ? actions.find((action) => action.id === 'new-invoice') : finance || role === 'Vendor' ? actions[1] : undefined;
  const actionButton = (action: Action, mobile = false) => <Button key={action.id} data-role-action={action.id} data-finance-type={action.financeType} variant={action.variant} disabled={action.disabled} title={action.reason} className={mobile ? 'w-full justify-start' : undefined} onClick={() => { previewFromSheet.current = more; setMore(false); show(action.label, action.source); }}>{action.Icon && <action.Icon className="size-4" aria-hidden="true" />}{action.label}</Button>;
  return <div data-library-party-role={role} className="space-y-4">
    <div className="flex flex-wrap items-center gap-3"><div className="min-w-48 flex-1"><AppSelect label={text('Preview party relationship', 'পক্ষের সম্পর্ক বাছুন')} value={role} onChange={(value) => setRole(value as PartyRole)} options={roles.map((value) => ({ value, label: partyRoleLabel(value, language) }))} /></div>
      <label className="flex items-center gap-2 text-xs text-ink-600"><input type="checkbox" checked={credit} onChange={(event) => setCredit(event.target.checked)} className="size-4 accent-primary" />{text('Sample refundable credit', 'নমুনা ফেরতযোগ্য জমা')}</label></div>
    <div className="min-w-0 rounded-xl border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-start gap-4 p-4">
        <PartyAvatar name={identity.name} color={identity.color} size={52} />
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-baseline gap-2"><h3 className="text-lg font-semibold tracking-tight text-ink">{language === 'Bangla' ? identity.bn : identity.name}</h3>{showHelper && <span lang="bn" className="font-bn text-sm text-ink-500">{identity.bn}</span>}</div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-ink-500"><RoleBadge role={role} /><span className="flex items-center gap-1"><Phone className="size-3" aria-hidden="true" />01711-000245</span><span className="hidden items-center gap-1 sm:flex"><MapPin className="size-3" aria-hidden="true" />{text('Sample address', 'নমুনা ঠিকানা')}</span></div></div>
        <PartyBalanceCard compact amount={role === 'Customer' || role === 'Borrower' ? 12500 : -12500} relationship={role} />
      </div>
      <div className="hidden flex-wrap gap-2 border-t border-border p-3 md:flex" data-library-role-actions>{actions.map((action) => actionButton(action))}</div>
      <div className="grid grid-cols-2 gap-2 border-t border-border p-3 md:hidden">
        <div className="col-span-2">{actionButton(actions[0], true)}</div>
        {mobileSecondary && actionButton(mobileSecondary, true)}
        <Button ref={moreTrigger} variant="outline" className={mobileSecondary ? undefined : 'col-span-2'} data-library-party-more aria-haspopup="dialog" aria-expanded={more} onClick={() => setMore(true)}><MoreHorizontal className="size-4" aria-hidden="true" />{text('More', 'আরও')}</Button>
      </div>
    </div>
    <p className="text-xs leading-5 text-ink-500">{text('The active relationship chooses the action, icon and workflow. A balance changing sign does not turn a supplier payment into a customer receipt. Role badges and avatar colors are separate from action icons.', 'নির্বাচিত সম্পর্ক অনুযায়ী কাজ, আইকন ও ফর্ম বদলাবে। শুধু ব্যালেন্সের দিক দেখে কাজ বদলাবে না।')}</p>
    <PartyActionSheet open={more} onClose={() => setMore(false)} title={text('More actions', 'আরও কাজ')} titleBn="আরও কাজ"><div className="space-y-3 p-4">{actions.slice(1).filter((action) => action !== mobileSecondary).map((action) => <div key={action.id}>{actionButton(action, true)}{action.reason && <p className="mt-1 text-xs text-ink-500">{action.reason}</p>}</div>)}</div></PartyActionSheet>
    <Dialog open={Boolean(opened)} onOpenChange={(value) => { if (!value) closePreview(); }}><DialogContent><DialogHeader><DialogTitle>{opened?.label}</DialogTitle><DialogDescription>{text('Component-library preview only. No transaction is recorded.', 'শুধু উপাদানের নমুনা। কোনো লেনদেন জমা হয় না।')}</DialogDescription></DialogHeader><p className="text-sm text-ink">{partyRoleLabel(role, language)} · {opened?.source}</p><Button variant="outline" onClick={closePreview}>{text('Close preview', 'নমুনা বন্ধ করুন')}</Button></DialogContent></Dialog>
  </div>;
}
