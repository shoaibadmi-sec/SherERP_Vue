import { MotionTabList, MotionTabIndicator } from '../../motion/MotionTabList';
import { FloatingPanel } from '../layout/FloatingPanel';
import {matchesSearch as fuzzyMatch} from '../../utils/fuzzySearch';
import { useState } from 'react';
import { FilePlus2, FileText, HandCoins, Banknote, MoreHorizontal, MapPin, MessageSquare, Paperclip, Phone, Receipt, Send, StickyNote, Pencil, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../Button';
import { Input } from '../Input';
import { FormSelect } from '../FormSelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../Dialog';
import { PartyAvatar } from '../PartyAvatar';
import { PartyBalanceCard } from './PartyBalanceCard';
import {VendorQuickSettlementDialog, type VendorQuickSettlementMode} from './VendorQuickSettlementDialog';
import { partyFinanceActions, partyTradingActionIcons } from './partyRoleActions';
import type { FinanceTransactionType } from '../../data/financeAccounts';
import { PartySourceQuickPreview } from './PartySourceQuickPreview';
import { PartyAttachmentQuickPreview } from './PartyAttachmentQuickPreview';
import { RoleBadge } from './RoleBadge';
import { LedgerTable } from './LedgerTable';
import { PartyLedgerToolbar } from './PartyLedgerToolbar';
import { PartyStatementDialog } from './PartyStatementDialog';
import {useUiCopy} from '../../i18n/useUiCopy';
import { PartyPaymentDialog } from './PartyPaymentDialog';
import { PartyCreditRefundDialog } from './PartyCreditRefundDialog';
import { PartyTransactionDialog } from './PartyTransactionDialog';
import { PartyFinanceDialog } from './PartyFinanceDialog';
import { PartyOpeningDialog } from './PartyOpeningDialog';
import { activePartyOpening } from '../../utils/partyOpening';
import type { FinanceRole } from '../../utils/partyFinance';
import type { LedgerEntry, Party, PartyRole } from '../../types/erp';
import type { LedgerStatement, PartyLedgerRow, PartyAction, PartyBalanceSummary, PartySourceRecord, PartyPaymentPayload, PartyRefundPayload, PartyFinancePayload, PartyOpeningPayload } from '../../types/partyLedger';
import type { IsoRange } from '../../utils/dateRange';
import { taka } from '../../utils/currency';
import {projectVendorPartyLedger,type VendorPartyProfile} from '../../vendor/vendorPartyProjection';
import type {VendorSide} from '../../vendor/vendorTypes';
import type {VendorWorkTab} from '../../vendor/vendorRoute';

type Tab = 'ledger' | 'invoices' | 'payments' | 'notes' | 'attachments';

type PartyDetailProps = {
  party: Party;
  entries: LedgerEntry[];
  vendorProfile?:VendorPartyProfile;
  onOpenVendorWork?:(tab?:VendorWorkTab,sourceId?:string)=>void;
  onAddNote: (text: string) => void;
  onEditNote: (id: string, text: string) => void;
  onDeleteNote: (id: string) => void;
  relationship: PartyRole;
  onRoleChange: (role: PartyRole) => void;
  onEditParty: () => void;
  onNewInvoice: () => void;
  statement: LedgerStatement;
  balanceSummary: PartyBalanceSummary;
  visibleRows: LedgerStatement['rows'];
  range: IsoRange; onRange: (range: IsoRange) => void;
  kind: string; onKind: (kind: string) => void;
  ledgerQuery: string; onLedgerQuery: (query: string) => void;
  pageSize: number; onPageSize: (n: number) => void;
  onResetLedger: () => void; onStatement: () => void;
  page: number; pages: number; onPage: (n: number) => void;
  actionsForRow: (row: PartyLedgerRow) => Array<{action:PartyAction;enabled:boolean;reason?:string}>;
  onLedgerAction: (action:PartyAction,row:PartyLedgerRow) => void;
  statementOpen: boolean; onCloseStatement: () => void;
  sources: readonly PartySourceRecord[];
  onRecordPayment: (payload:PartyPaymentPayload) => void;
  onRefundCredit: (payload:PartyRefundPayload) => void;
  onEditSourcePayment: (sourceId:string,payload:PartyPaymentPayload,reason:string) => void;
  onReverseSource: (sourceId:string,reason:string) => void;
  onRecordFinance: (payload:PartyFinancePayload) => void;
  onSetOpening: (payload:PartyOpeningPayload) => void;
};

export function PartyDetail({
  party, entries, relationship, onRoleChange, onEditParty, onNewInvoice, onAddNote, onEditNote, onDeleteNote,
  statement, balanceSummary, visibleRows, range, onRange, kind, onKind, ledgerQuery, onLedgerQuery,
  pageSize, onPageSize, onResetLedger, onStatement, page, pages, onPage, actionsForRow,
  onLedgerAction, statementOpen, onCloseStatement, sources, onRecordPayment, onRefundCredit,
  onEditSourcePayment, onReverseSource, onRecordFinance, onSetOpening,
  vendorProfile,onOpenVendorWork
}: PartyDetailProps) {
  const {text}=useUiCopy();
  const [tab, setTab] = useState<Tab>('ledger');
  const [vendorSide,setVendorSide]=useState<VendorSide>('payable');
  const [note, setNote] = useState('');
  const [editingNote, setEditingNote] = useState<LedgerEntry | null>(null);
  const [editText, setEditText] = useState('');
  const [deleteNote, setDeleteNote] = useState<LedgerEntry | null>(null);
  const [attachment, setAttachment] = useState<LedgerEntry | null>(null);
  const [viewedRow,setViewedRow] = useState<PartyLedgerRow|null>(null);
  const [paymentOpen,setPaymentOpen] = useState(false);
  const [vendorSettlementMode,setVendorSettlementMode]=useState<VendorQuickSettlementMode|null>(null);
  const [refundOpen,setRefundOpen] = useState(false);
  const [financeOpen,setFinanceOpen]=useState(false);
  const [financeStartType,setFinanceStartType]=useState<FinanceTransactionType|undefined>();
  const [openingOpen,setOpeningOpen]=useState(false);
  const existingOpening=activePartyOpening(sources,party.id,relationship);
  const [editorRow,setEditorRow]=useState<PartyLedgerRow|null>(null);
  const [editorMode,setEditorMode]=useState<'edit'|'reverse'>('edit');
  const doRowAction=(action:PartyAction,row:PartyLedgerRow)=>{
    if(vendorProfile&&action!=='view'){
     onOpenVendorWork?.(vendorSide==='payable'?'taken':'given',row.sourceId);return;
    }
    if(action==='view'){setViewedRow(row);return;}
    if((action==='edit'||action==='delete'||action==='reverse')&&
       /^party-(payment|refund|finance):/.test(row.sourceId??'')){
      setEditorMode(action==='edit'?'edit':'reverse');setEditorRow(row);return;
    }
    onLedgerAction(action,row);
  };

  const openLedgerAttachment = (row: PartyLedgerRow) => {
    const match = entries.find(entry => entry.attachment &&
      (entry.id === row.sourceId || (row.reference && entry.ref === row.reference)));
    if (match) { setAttachment(match); return; }
    if (row.attachment) setAttachment({
      id: row.id, partyId: row.partyId, date: row.date,
      type: row.source === 'purchase' ? 'purchase' : row.source === 'sale' ? 'invoice' : 'payment',
      ref: row.reference, description: row.description, debit: row.debit, credit: row.credit,
      attachment: row.attachment
    });
  };

  const invoices = entries.filter((e) => e.type === 'invoice' || e.type === 'purchase');
  const payments = entries.filter((e) => e.type === 'payment' || e.type === 'return');
  const notes = entries.filter((e) => e.type === 'note');
  const attachments = entries.filter((e) => e.attachment);
  const shownStatement=vendorProfile?projectVendorPartyLedger(vendorProfile,vendorSide):statement;
  const shownFiltered=vendorProfile?shownStatement.rows.filter(r=>
    fuzzyMatch(ledgerQuery,[r.reference,r.description])):[];
  const shownRows=vendorProfile?shownFiltered.slice(Math.max(0,(page-1)*pageSize),page*pageSize):visibleRows;
  const shownPages=vendorProfile?Math.max(1,Math.ceil(shownFiltered.length/pageSize)):pages;
  const shownActions=(r:PartyLedgerRow)=>vendorProfile?
   [{action:'view' as const,enabled:true},{action:'source' as const,enabled:true}]:actionsForRow(r);

  const tabs: {id: Tab;label: string;count?: number;}[] = [
  { id: 'ledger', label: text('Ledger','খাতা'), count: shownStatement.rows.length },
  { id: 'invoices', label:vendorProfile?text('Bills & Memos','বিল ও মেমো'):text('Invoices','বিল'), count:vendorProfile?vendorProfile.documents.length:invoices.length },
  { id: 'payments', label: text('Payments','পেমেন্ট'), count:vendorProfile?vendorProfile.payments.length:payments.length },
  { id: 'notes', label: text('Notes','মন্তব্য'), count: notes.length },
  { id: 'attachments', label: text('Attachments','ফাইল'), count: attachments.length }];


  const openRoleFinance=(type?:FinanceTransactionType)=>{setFinanceStartType(type);setFinanceOpen(true);};
  const financeActions=partyFinanceActions(relationship);
  const currentBalance=balanceSummary.netBalance;
  const payable = ['Supplier','Lender','Owner','Payee','Vendor'].includes(relationship);

  return (
    <div className="min-w-0 rounded-xl border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-start gap-4 border-b border-border p-4">
        <PartyAvatar name={party.name} color={party.avatarColor} image={party.image} size={52} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-ink">{party.name}</h2>
            {party.nameBn && <span className="font-bn text-sm text-ink-500">{party.nameBn}</span>}
          </div>
          {party.roles.length>1 && <div className="mt-1 flex flex-wrap items-center gap-2">
            <div className="min-w-32"><FormSelect title={text("Relationship","সম্পর্কের ধরন")} value={relationship} options={party.roles} onChange={event=>onRoleChange(event.target.value as PartyRole)}/></div>
          </div>}
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-500">
            <span className="flex gap-1">{party.roles.map((r) => <RoleBadge key={r} role={r} />)}</span>
            <span className="flex items-center gap-1"><Phone className="size-3" /> {party.phone}</span>
            <span className="flex items-center gap-1"><MapPin className="size-3" /> {party.area}</span>
            <span>{text('Last activity','শেষ লেনদেন')} {party.lastActivity}</span>
          </div>
        </div>
        {vendorProfile ?
          <div className="flex flex-wrap gap-2">
            <PartyBalanceCard compact amount={vendorProfile.summary.takenDuePaisa/100}
              copy={{title:['Vendor payable','ভেন্ডরকে দেনা'],
                hint:['You owe vendor','ভেন্ডরকে দেনা'],tone:'payable'}} />
            <PartyBalanceCard compact amount={vendorProfile.summary.givenDuePaisa/100}
              copy={{title:['Vendor receivable','ভেন্ডরের কাছে পাওনা'],
                hint:['Vendor owes you','ভেন্ডরের কাছে পাওনা'],tone:'receivable'}}
              extra={vendorProfile.summary.priceNotSetBaseQty>0 ?
                <p className="mt-1 text-[11px] text-warning">
                  {vendorProfile.summary.priceNotSetBaseQty} {text('units · Price not set','একক · দাম ঠিক হয়নি')}
                </p> : undefined}/>
          </div>
          : <PartyBalanceCard compact relationship={relationship} amount={currentBalance}/>}
      </div>

      {vendorProfile?<div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        <Button size="sm" onClick={()=>setVendorSettlementMode('pay')}><Banknote className="size-4"/>{text('Pay Vendor','ভেন্ডরকে টাকা দিন')}</Button>
        <Button size="sm" variant="outline" onClick={()=>setVendorSettlementMode('receive-money')}><HandCoins className="size-4"/>{text('Receive Money','টাকা নিন')}</Button>
        <Button size="sm" variant="outline" onClick={()=>onOpenVendorWork?.('taken')}>{text('Open Vendor Work','ভেন্ডরের কাজ খুলুন')}</Button>
        <Button size="sm" variant="ghost" onClick={()=>setTab('notes')}><StickyNote className="size-4"/> {text('Add note','নোট যোগ করুন')}</Button>
        <FloatingPanel width={260} align="right" label={text('More actions','আরও কাজ')}
          trigger={({toggle,open})=><Button size="sm" variant="outline" aria-haspopup="menu" aria-expanded={open} onClick={toggle}>
            <MoreHorizontal className="size-4"/>{text('More','আরও')}
          </Button>}>
          {close=><div role="menu" aria-label={text('More actions','আরও কাজ')} className="p-1">
            <button type="button" role="menuitem" onClick={()=>{close();onEditParty();}}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-ink-50">
              <Pencil className="size-4"/>{text('Edit party','পার্টির তথ্য বদলান')}
            </button>
            <button type="button" role="menuitem" onClick={()=>{close();onOpenVendorWork?.('ledger');}}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-ink-50">
              <BookOpen className="size-4"/>{text('Opening balance','শুরুর জের')}
            </button>
          </div>}
        </FloatingPanel>
       </div>:<>
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2.5">
        {(relationship==='Customer'||relationship==='Supplier')&&
          <Button size="sm" title={text('Record payment in browser preview','প্রিভিউতে টাকা নেওয়া-দেওয়ার হিসাব রাখুন')}
            onClick={()=>setPaymentOpen(true)}>
            {(() => {const Icon=partyTradingActionIcons[relationship];return <Icon className="size-4"/>;})()}
            {payable ? text('Make payment','টাকা দিন') : text('Receive payment','টাকা নিন')}
          </Button>}
        {(relationship==='Customer'||relationship==='Supplier')&&
          <Button size="sm" variant="outline" disabled={balanceSummary.refundableCredit<=0}
            title={balanceSummary.refundableCredit>0?text('Refund verified credit as of the selected date','নির্বাচিত তারিখ পর্যন্ত নিশ্চিত জমা টাকা ফেরত দিন'):text('No verified refundable credit yet','ফেরত দেওয়ার মতো নিশ্চিত জমা টাকা নেই')}
            onClick={()=>setRefundOpen(true)}>
            {text('Refund credit','জমা টাকা ফেরত')}
          </Button>}
        {relationship==='Customer'&&
          <Button size="sm" variant="outline" disabled={party.status==='Inactive'} onClick={onNewInvoice}>
            <FilePlus2 className="size-4" />{text('New invoice','নতুন বিল')}
          </Button>}
        {financeActions&&financeActions.map((action,i)=>{const Icon=action.Icon;return <Button size="sm"
          key={action.id} variant={i===0?'default':'outline'}
          onClick={()=>openRoleFinance(action.financeType)}>
            <Icon className="size-4"/>{text(action.label,action.bangla)}
          </Button>;})}
        <Button size="sm" variant="ghost" onClick={() => setTab('notes')}>
          <StickyNote className="size-4" /> {text('Add note','নোট যোগ করুন')}
        </Button>
        <FloatingPanel width={260} align="right" label={text('More actions','আরও কাজ')}
          trigger={({toggle,open})=><Button size="sm" variant="outline" aria-haspopup="menu" aria-expanded={open} onClick={toggle}>
            <MoreHorizontal className="size-4"/>{text('More','আরও')}
          </Button>}>
          {close=><div role="menu" aria-label={text('More actions','আরও কাজ')} className="p-1">
            <button type="button" role="menuitem" onClick={()=>{close();onEditParty();}}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-ink-50">
              <Pencil className="size-4"/>{text('Edit party','পার্টির তথ্য বদলান')}
            </button>
            <button type="button" role="menuitem" onClick={()=>{close();setOpeningOpen(true);}}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-ink-50">
              <BookOpen className="size-4"/>{existingOpening?text('Edit opening balance','শুরুর জের বদলান'):text('Opening balance','শুরুর জের')}
            </button>
            <button type="button" role="menuitem" disabled
              title={text('SMS service is not connected to the UI preview','এই প্রিভিউতে SMS চালু নেই')}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink-400 opacity-60">
              <Send className="size-4"/>{text('Send statement','হিসাব পাঠান')}
            </button>
          </div>}
        </FloatingPanel>
      </div>
       </>}

      <MotionTabList className="flex gap-1 overflow-x-auto border-b border-border px-3 scrollbar-thin" role="tablist">
        {tabs.map((t) =>
        <button
          key={t.id}
          role="tab"
          aria-selected={tab === t.id}
          onClick={() => setTab(t.id)}
          className={`flex shrink-0 items-center gap-1.5 px-2.5 py-2.5 text-[13px] font-medium transition-colors ${
          tab === t.id ? 'text-ink' : 'text-ink-500 hover:text-ink'}`
          }>
          
            {t.label}
            {t.count !== undefined &&
          <span data-testid="party-tab-count" className={`rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold transition-colors ${tab===t.id ? 'bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-200' : 'bg-ink-50 text-ink-500'}`}>{t.count}</span>
          }
          <MotionTabIndicator active={tab === t.id} /></button>
        )}
      </MotionTabList>

      {(vendorProfile?(!vendorProfile.documents.length&&!vendorProfile.payments.length&&!notes.length):entries.length===0) && tab !== 'notes' && tab !== 'ledger' ?
      <div className="px-4 py-14 text-center">
          <Receipt className="mx-auto size-8 text-helper" />
          <p className="mt-2 font-medium text-ink">{text('No transactions in this period','এই সময়ে কোনো লেনদেন নেই')}</p>
          <p className="mt-1 text-sm text-ink-500">{text('Invoices, payments and notes for','বিল, পেমেন্ট ও মন্তব্য দেখাবে:')} {party.name}</p>
        </div> :

      <div>
          {tab === 'ledger' && <>
            {vendorProfile&&<div className="flex flex-wrap items-center gap-2 border-b border-border bg-ink-50 px-3 py-2 text-xs">
              <span>{text('Account · কোন হিসাব?','কোন হিসাব?')}</span>
              <Button size="sm" variant={vendorSide==='payable'?'default':'outline'}
               onClick={()=>{setVendorSide('payable');onPage(1);}}>{text('Taken · You owe','নিয়েছেন · দেনা')}</Button>
              <Button size="sm" variant={vendorSide==='receivable'?'default':'outline'}
               onClick={()=>{setVendorSide('receivable');onPage(1);}}>{text('Given · Vendor owes','দিয়েছেন · পাওনা')}</Button>
              <span className="ml-auto text-ink-500">{text('Separate running balances','আলাদা চলতি জের')}</span>
             </div>}
            <PartyLedgerToolbar range={range} onRange={onRange} kind={kind} onKind={onKind}
              query={ledgerQuery} onQuery={onLedgerQuery} pageSize={pageSize} onPageSize={onPageSize}
              onStatement={onStatement} onReset={onResetLedger}/>
            <LedgerTable statement={shownStatement} visibleRows={shownRows} actionsForRow={shownActions}
              onAction={doRowAction} onOpenAttachment={openLedgerAttachment}/>
            <div className="flex items-center justify-between gap-2 px-4 py-2 text-xs text-ink-500">
              <span>{text('Page','পাতা')} {page} {text('of','মোট')} {shownPages} · {shownFiltered.length||shownStatement.rows.length} {text('dated transactions','টি তারিখসহ লেনদেন')}</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page<=1} onClick={()=>onPage(page-1)}>{text('Previous','আগের')}</Button>
                <Button size="sm" variant="outline" disabled={page>=shownPages} onClick={()=>onPage(page+1)}>{text('Next','পরের')}</Button>
              </div>
            </div>
            {vendorProfile&&vendorSide==='payable'&&vendorProfile.takenStatement.unpricedSources.length>0&&
             <p className="px-4 py-2 text-xs text-ink-500">{text('Price not set · দাম ঠিক হয়নি','দাম ঠিক হয়নি')} — {vendorProfile.takenStatement.unpricedSources.length} {text('taken record(s). No money amount assigned.','টি নেওয়া পণ্য। এখনো কোনো টাকা ধরা হয়নি।')}</p>}
          </>}
          {(tab === 'invoices' || tab === 'payments') && vendorProfile&&
           <ul className="divide-y divide-border">
            {(tab==='invoices'?vendorProfile.documents:vendorProfile.payments).map(item=>
             <li key={item.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-xs">
              <span className="min-w-0 flex-1"><strong className="text-ink">{item.reference}</strong>
               <span className="ml-2 text-ink-400">{item.date}</span>
               <p className="mt-1 text-ink-500">{item.description}</p></span>
              <strong className="text-ink">{item.moneyPaisa===null?text('Price not set','দাম ঠিক হয়নি'):taka(Math.abs(item.moneyPaisa)/100)}</strong>
              <Button size="sm" variant="ghost" onClick={()=>onOpenVendorWork?.(
                item.bucket==='vendor-receivable'?'given':item.bucket==='supplier-purchase'?'purchases':'taken',
                item.sourceEventId)}>{text('View','দেখুন')}</Button>
             </li>)}
            {!(tab==='invoices'?vendorProfile.documents:vendorProfile.payments).length&&
             <li className="p-8 text-center text-xs text-ink-500">{text('No records yet.','এখনো কোনো রেকর্ড নেই।')}</li>}
           </ul>}
          {(tab === 'invoices' || tab === 'payments') && !vendorProfile &&
        <ul className="divide-y divide-border">
              {(tab === 'invoices' ? invoices : payments).map((e) =>
          <li key={e.id} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-ink-50 text-ink-500">
                    {tab === 'invoices' ? <FileText className="size-4" /> : <HandCoins className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{e.ref ?? text('Entry','এন্ট্রি')} <span className="font-normal text-ink-400">· {e.date}</span></p>
                    <p className="truncate text-xs text-ink-500">{e.description}</p>
                  </div>
                  <span className="font-semibold tabular-nums text-ink">{taka(e.debit || e.credit)}</span>
                </li>
          )}
              {(tab === 'invoices' ? invoices : payments).length === 0 &&
          <li className="px-4 py-10 text-center text-sm text-ink-500">{text('Nothing here yet.','এখনো কিছু নেই।')}</li>
          }
            </ul>
        }
          {tab === 'attachments' &&
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-4">
              {attachments.map((e) =>
          <button key={e.id} onClick={() => setAttachment(e)} className="overflow-hidden rounded-lg border border-border text-left hover:border-teal-300">
                  <div className="flex aspect-[4/3] items-center justify-center bg-ink-50">
                    {e.attachment?.url ?
              <img src={e.attachment.url} alt="" className="h-full w-full object-cover" /> :

              <Paperclip className="size-6 text-helper" />
              }
                  </div>
                  <div className="px-2.5 py-1.5">
                    <p className="truncate text-xs font-medium text-ink">{e.attachment?.name}</p>
                    <p className="text-[11px] text-ink-500">{e.ref} · {e.date}</p>
                  </div>
                </button>
          )}
              {attachments.length === 0 && <p className="col-span-full py-8 text-center text-sm text-ink-500">{text('No attachments.','কোনো ফাইল নেই।')}</p>}
            </div>
        }
        </div>
      }

      {tab === 'notes' &&
      <div className="space-y-3 p-4">
          <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!note.trim()) return;
            onAddNote(note.trim());
            setNote('');
            toast.success(text('Note added','নোট যোগ হয়েছে'));
          }}>
          
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={text("Write a note… e.g. Promised payment on Sunday","নোট লিখুন… যেমন রবিবার টাকা দেবেন")} aria-label={text("New note","নতুন নোট")} />
            <Button type="submit" size="sm" className="h-9">
              <MessageSquare className="size-4" /> {text('Add note','নোট যোগ করুন')}
            </Button>
          </form>
          <ul className="space-y-2">
            {notes.map((n) =>
          <li key={n.id} className="rounded-lg border border-warning/20 bg-warning-bg/50 px-3 py-2 text-[13px] text-ink-700">
                <div className="flex items-start justify-between gap-2">
                  <span className="break-words">{n.description}</span>
                  <span className="flex shrink-0 gap-1">
                    <button type="button" aria-label={`${text('Edit note','নোট বদলান')} ${n.description}`} className="rounded p-1 text-ink-500 hover:bg-ink-100" onClick={()=>{setEditingNote(n);setEditText(n.description);}}><Pencil className="size-3.5"/></button>
                    <button type="button" aria-label={`${text('Delete note','নোট মুছুন')} ${n.description}`} className="rounded p-1 text-danger hover:bg-danger-bg" onClick={()=>setDeleteNote(n)}><Trash2 className="size-3.5"/></button>
                  </span>
                </div>
                <span className="mt-0.5 block text-[11px] text-ink-400">{n.date} · {text('Preview','প্রিভিউ')}</span>
              </li>
          )}
            {notes.length === 0 && <li className="py-6 text-center text-sm text-ink-500">{text('No notes yet.','এখনো কোনো নোট নেই।')}</li>}
          </ul>
        </div>
      }

      <PartyOpeningDialog open={openingOpen} onClose={()=>setOpeningOpen(false)}
        party={party} relationship={relationship} existing={existingOpening} onSubmit={onSetOpening}/>
      {vendorProfile && vendorSettlementMode && <VendorQuickSettlementDialog
        open partyId={party.id} partyName={party.name} mode={vendorSettlementMode}
        onClose={()=>setVendorSettlementMode(null)}/>}
      <PartyStatementDialog open={statementOpen} onClose={onCloseStatement} party={party} statement={shownStatement}/>
      {(relationship==='Customer'||relationship==='Supplier')&&<>
        <PartyPaymentDialog open={paymentOpen} party={party} relationship={relationship} sources={sources}
          onClose={()=>setPaymentOpen(false)} onSubmit={onRecordPayment}/>
        <PartyCreditRefundDialog open={refundOpen} party={party} relationship={relationship} sources={sources}
          onClose={()=>setRefundOpen(false)} onSubmit={onRefundCredit}/>
      </>}
      {(['Owner','Lender','Borrower'] as PartyRole[]).includes(relationship)&&
        <PartyFinanceDialog open={financeOpen} party={party} relationship={relationship as FinanceRole} initialType={financeStartType}
          onClose={()=>setFinanceOpen(false)} onSubmit={onRecordFinance}/>}
      <PartyTransactionDialog row={editorRow} mode={editorMode}
        source={sources.find(item=>item.id===editorRow?.sourceId)??null}
        onClose={()=>setEditorRow(null)} onEdit={onEditSourcePayment} onReverse={onReverseSource}/>
      <PartySourceQuickPreview row={viewedRow}
        source={sources.find(item => item.id === viewedRow?.sourceId) ?? null}
        onClose={() => setViewedRow(null)}
        onOpenSource={row => onLedgerAction('source', row)} />
      <Dialog open={!!editingNote} onOpenChange={(open)=>!open&&setEditingNote(null)}>
        <DialogContent role="dialog" aria-modal="true" aria-label={text("Edit party note","পার্টির নোট বদলান")} className="sm:max-w-md">
          <DialogHeader><DialogTitle>{text('Edit note','নোট বদলান')}</DialogTitle><DialogDescription>{text("Updates this party's preview note only.",'এখানে শুধু প্রিভিউর নোট বদলাবে।')}</DialogDescription></DialogHeader>
          <Input aria-label={text("Edit note","নোট বদলান")} value={editText} onChange={event=>setEditText(event.target.value)}/>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setEditingNote(null)} >{text('Cancel','বাতিল')}</Button><Button onClick={()=>{if(editingNote&&editText.trim()){onEditNote(editingNote.id,editText.trim());setEditingNote(null);toast.success(text('Note updated','নোট বদলানো হয়েছে'));}}} >{text('Save note','নোট রাখুন')}</Button></div>
        </DialogContent>
      </Dialog>
      <Dialog open={!!deleteNote} onOpenChange={(open)=>!open&&setDeleteNote(null)}>
        <DialogContent role="dialog" aria-modal="true" aria-label={text("Delete party note","পার্টির নোট মুছুন")} className="sm:max-w-md">
          <DialogHeader><DialogTitle>{text('Delete note?','নোট মুছবেন?')}</DialogTitle><DialogDescription>{text('This removes the note from the active preview and preserves an audit entry.','প্রিভিউতে নোটটি মুছে যাবে, তবে পরিবর্তনের ইতিহাস রাখা হবে।')}</DialogDescription></DialogHeader>
          <div className="flex justify-end gap-2"><Button variant="outline" onClick={()=>setDeleteNote(null)} >{text('Keep note','নোট রাখুন')}</Button><Button onClick={()=>{if(deleteNote){onDeleteNote(deleteNote.id);setDeleteNote(null);toast.success(text('Note deleted','নোট মুছে গেছে'));}}} >{text('Confirm delete','নিশ্চিত মুছুন')}</Button></div>
        </DialogContent>
      </Dialog>
      <PartyAttachmentQuickPreview attachment={attachment?.attachment ? {
        name: attachment.attachment.name, url: attachment.attachment.url,
        reference: attachment.ref, date: attachment.date
      } : null} onClose={() => setAttachment(null)} />
    </div>);

}
