import {rankSearch} from '../../utils/fuzzySearch';
import {useMemo,useRef,useState,useSyncExternalStore,type Dispatch,type SetStateAction} from 'react';
import {CheckCircle2,Plus,Search,Trash2,AlertTriangle,ArrowRight} from 'lucide-react';
import {toast} from 'sonner';
import {Button} from '../Button';
import {Input} from '../Input';
import {AppSelect} from '../AppSelect';
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle} from '../Dialog';
import {PartyEditorDialog} from '../parties/PartyEditorDialog';
import {getPartyPreviewSnapshot,subscribePartyPreview,dispatchPartyPreview,quickAddPartyPreview,PartyQuickAddConflict} from '../../data/partyPreviewStore';
import {getExpensePreviewSnapshot,savePreviewExpense} from '../../data/expensePreviewStore';
import {customerSettlementAsOf,supplierSettlementAsOf} from '../../utils/partySettlement';
import {businessToday} from '../../utils/dateRange';
import {counterOpenInvoices,counterAllocateOldest} from '../../utils/counterAllocation';
import {counterExpensePayment} from '../../utils/counterExpensePayment';
import {AmountInWordsDisplay} from '../AmountInWordsDisplay';
import {taka} from '../../utils/currency';
import {useUiCopy} from '../../i18n/useUiCopy';
import {financeAccountOptionLabel, type FinanceAccount} from '../../data/financeAccounts';
import type {Expense,Party,PartyRole} from '../../types/erp';
import type {PartyDraft,PartyMoneySplit,PartyOpeningPayload,PartyPaymentPayload} from '../../types/partyLedger';

type Action='Customer Receive'|'Supplier Pay'|'Expense'|'Bank Transfer';
type Row={id:string;method:'Cash'|'Bank'|'Mobile Banking';accountId:string;amount:string};
const kinds:Action[]=['Customer Receive','Supplier Pay','Expense','Bank Transfer'];
const money=(n:number)=>Math.round(n*100)/100;
const validMoney=(s:string)=>/^\d+(?:\.\d{1,2})?$/.test(s.trim())&&Number(s)>0;
const names:Record<Action,string>={'Customer Receive':'Receive payment','Supplier Pay':'Pay supplier',Expense:'Record expense','Bank Transfer':'Transfer money'};
const banglaActions:Record<Action,string>={'Customer Receive':'ক্রেতার টাকা নিন','Supplier Pay':'সরবরাহকারীকে টাকা দিন',Expense:'খরচ লিখুন','Bank Transfer':'টাকা স্থানান্তর করুন'};
export function CounterWorkspace({accounts,setAccounts,onTransfer,onNewFinanceTransaction}:{
 accounts:FinanceAccount[];setAccounts:Dispatch<SetStateAction<FinanceAccount[]>>;
 onTransfer:(transfer:{fromAccountId:string;toAccountId:string;amount:number;date:string;reference?:string})=>void;
 onNewFinanceTransaction:()=>void;
}){
 const {text,word}=useUiCopy();
 const state=useSyncExternalStore(subscribePartyPreview,getPartyPreviewSnapshot);
 const [type,setType]=useState<Action>('Customer Receive');
 const [partyId,setPartyId]=useState('');
 const [search,setSearch]=useState('');
 const [searching,setSearching]=useState(false);
 const [quickAddOpen,setQuickAddOpen]=useState(false);
 const partySearchRef=useRef<HTMLInputElement>(null);
 const [allocation,setAllocation]=useState('');
 const [discountInput,setDiscountInput]=useState('');
 const [discountReason,setDiscountReason]=useState('');
 const [rows,setRows]=useState<Row[]>([]);
 const [amount,setAmount]=useState('');
 const [expenseCategory,setExpenseCategory]=useState('');
 const [from,setFrom]=useState('');
 const [to,setTo]=useState('');
 const [note,setNote]=useState('');
 const [review,setReview]=useState(false);
 const [error,setError]=useState('');
 const [submitted,setSubmitted]=useState(false);
 const busy=useRef(false);
 const [reviewRevision,setReviewRevision]=useState(0);
 const cashAccount=accounts.find(a=>a.status==='Active'&&(a.type==='Cash'||a.type==='Petty Cash'));
 const effectiveRows=rows.length?rows:[{id:'default',method:'Cash' as const,accountId:cashAccount?.id??'',amount:''}];
 const payerRole:PartyRole=type==='Customer Receive'?'Customer':'Supplier';
 const parties=state.parties.filter(p=>p.roles.includes(payerRole)&&p.status!=='Inactive');
 const selected=parties.find(p=>p.id===partyId);
 const filtered=rankSearch(parties,search,p=>[p.name,p.nameBn,p.phone,p.area,p.id]).slice(0,7);
 const date=businessToday();
 const settlement=selected&&(type==='Customer Receive'||type==='Supplier Pay')
  ?type==='Customer Receive'?customerSettlementAsOf(state.sources,selected.id,date)
   :supplierSettlementAsOf(state.sources,selected.id,date):null;
 const openInvoices=useMemo(()=>selected&&(type==='Customer Receive'||type==='Supplier Pay')
  ?counterOpenInvoices(state.sources,selected.id,date,payerRole==='Customer'?'Customer':'Supplier'):[],[state,selected?.id,type,date,payerRole]);
 const chosen=openInvoices.find(i=>i.id===allocation);
 const maxDue=allocation?(chosen?Math.min(chosen.due,settlement?.invoiceDue??0):0):settlement?.invoiceDue??0;
 const total=type==='Bank Transfer'?Number(amount)||0:money(effectiveRows.reduce((n,r)=>n+(Number(r.amount)||0),0));
 const discount=Number(discountInput)||0;
 const dueReduction=money(total+discount);
 // In a customer receipt the balance moves down; in a supplier payment it moves up.
 // The discount changes the ledger only, never an account's cash balance.
 const predicted=settlement?money(settlement.netBalance+(type==='Customer Receive'?-dueReduction:dueReduction)):0;
 const methods:Row['method'][]=['Cash','Bank','Mobile Banking'];
 const accountOptions=(method:Row['method'])=>accounts.filter(a=>a.status==='Active'&&(
  method==='Cash'?(a.type==='Cash'||a.type==='Petty Cash'):a.type===method));
 const transferAccountLabel=(accountId:string)=>{
  const account=accounts.find(item=>item.id===accountId);
  if(!account)return '';
  return financeAccountOptionLabel(account,accounts);
 };
 const splits:PartyMoneySplit[]=effectiveRows.filter(r=>r.amount.trim()!==''&&Number(r.amount)>0)
  .map(r=>({id:r.id,method:r.method,accountId:r.accountId,amount:Number(r.amount)}));
 const olderAllocation=counterAllocateOldest(openInvoices,dueReduction);
 const selectedAllocation=chosen?Math.min(chosen.due,dueReduction):0;
 const previewAllocation=chosen?(selectedAllocation>0?[{invoice:chosen.reference,amount:selectedAllocation}]:[]):olderAllocation;
 const reset=()=>{
  setPartyId('');setSearch('');setSearching(false);setAllocation('');
  setRows([]);setAmount('');setDiscountInput('');setDiscountReason('');
  setNote('');setError('');setReview(false);setSubmitted(false);
 };
 const changeType=(next:Action)=>{setType(next);reset();};
 const clearParty=()=>{setPartyId('');setSearch('');setAllocation('');setRows([]);
  setDiscountInput('');setDiscountReason('');setError('');setReview(false);setSubmitted(false);setSearching(true);};
 const selectParty=(p:Party,preserveDraft=false)=>{if(p.id!==partyId&&!preserveDraft){setRows([]);setDiscountInput('');setDiscountReason('');}
  setPartyId(p.id);setSearch(p.name);setSearching(false);setAllocation('');setError('');setReview(false);setSubmitted(false);};
 const addParty=(draft:PartyDraft,openings:Omit<PartyOpeningPayload,'partyId'>[])=>{
  if(!draft.roles.includes(payerRole))throw new Error(text(`Select the ${payerRole.toLowerCase()} relationship to continue.`,payerRole==='Customer'?'চালিয়ে যেতে ক্রেতা সম্পর্কটি নির্বাচন করুন।':'চালিয়ে যেতে সরবরাহকারী সম্পর্কটি নির্বাচন করুন।'));
  try{
   const {party,reused}=quickAddPartyPreview(draft,openings);
   setQuickAddOpen(false);selectParty(party,true);
   requestAnimationFrame(()=>{partySearchRef.current?.focus();setSearching(false);});
   toast.success(reused
    ?text('Existing party selected; relationships added','আগের পার্টি বাছা হয়েছে; সম্পর্ক যোগ হয়েছে')
    :text(payerRole+' added in Counter preview',payerRole==='Customer'?'ক্রেতা কাউন্টারের প্রিভিউতে যোগ হয়েছে':'সরবরাহকারী কাউন্টারের প্রিভিউতে যোগ হয়েছে'));
  }catch(error){
   if(error instanceof PartyQuickAddConflict){
    if(error.reason==='inactive')throw new Error(text('This matching party is inactive. Reactivate them in Parties before recording a Counter payment.','মিলে যাওয়া পার্টিটি নিষ্ক্রিয়। কাউন্টারে টাকা নেওয়া বা দেওয়ার আগে পার্টিতে সক্রিয় করুন।'));
    if(error.reason==='ambiguous')throw new Error(text('Multiple parties have this name and phone. Select the correct identity in Parties first.','একই নাম ও ফোনে একাধিক পার্টি আছে। আগে পার্টিতে সঠিক ব্যক্তিকে বাছুন।'));
    throw new Error(text('Edit an existing relationship opening balance in Parties. Quick Add only adds new relationships.','আগের সম্পর্কের শুরুর জের পার্টিতে গিয়ে বদলান। এখান থেকে শুধু নতুন সম্পর্ক যোগ করা যায়।'));
   }
   throw error;
  }
 };
 const editRows=(next:Row[])=>{setRows(next);setReview(false);setError('');setSubmitted(false);};
 const addRow=()=>{
  const next:Row={id:'counter-'+Date.now()+'-'+effectiveRows.length,method:'Cash',accountId:cashAccount?.id??'',amount:''};
  editRows([...effectiveRows,next]);
 };
 const fillDue=()=>{const next=Math.max(0,money(maxDue-discount));
  editRows(effectiveRows.map((r,i)=>({...r,amount:i===0&&next>0?String(next):''})));
 };
 const validate=()=>{
  if(!Number.isFinite(total)||total<0||!Number.isSafeInteger(Math.round(total*100))||Math.abs(total-money(total))>0.000001)
   return text('Enter a valid amount with up to two decimal places.','সঠিক টাকার পরিমাণ দিন। দশমিকের পরে সর্বোচ্চ দুই ঘর লিখুন।');
  const isParty=type==='Customer Receive'||type==='Supplier Pay';
  if(discountInput.trim()&&!/^\d+(?:\.\d{1,2})?$/.test(discountInput.trim()))
   return text('Discount / settlement must be a nonnegative amount with up to two decimals.','ছাড় বা সমন্বয় ঋণাত্মক হতে পারবে না। দশমিকের পরে সর্বোচ্চ দুই ঘর দিন।');
  if(isParty&&discount>0&&!discountReason.trim())return text('Enter a reason for the discount / settlement.','ছাড় বা সমন্বয়ের কারণ লিখুন।');
  if(!isParty&&total<=0)return text('Enter a positive transaction amount.','শূন্যের বেশি টাকার পরিমাণ দিন।');
  if(isParty&&dueReduction<=0)return text('Enter money received/paid or a discount / settlement amount.','টাকা বা ছাড়ের পরিমাণ দিন।');
  if(type==='Bank Transfer'){
   if(!from||!to||from===to)return text('Choose two different active money accounts.','টাকা পাঠানো ও নেওয়ার জন্য আলাদা দুটি চালু হিসাব বাছুন।');
   if(!accounts.find(a=>a.id===from&&a.status==='Active')||!accounts.find(a=>a.id===to&&a.status==='Active'))return text('Account is no longer active.','এই হিসাবটি এখন চালু নেই।');
   return '';
  }
  if(type==='Expense'&&!expenseCategory.trim())return text('Select an expense category.','খরচের ধরন বাছুন।');
  if(isParty&&allocation&&!chosen)return text('The selected bill is no longer open. Choose a bill and review again.','বাছা বিলের আর বাকি নেই। বিল বেছে আবার যাচাই করুন।');
  if(type!=='Expense'&&!selected)return text('Select a customer or supplier.','ক্রেতা বা সরবরাহকারী বাছুন।');
  if(effectiveRows.some(row=>row.amount.trim()!==''&&!validMoney(row.amount)))
   return text('Each entered payment amount must be positive with up to two decimals.','প্রতিটি পেমেন্টের টাকা শূন্যের বেশি হতে হবে, সর্বোচ্চ দুই দশমিক ঘরসহ।');
  if(total>0&&!splits.length)return text('Add a payment account for the cash amount.','টাকা নেওয়া বা দেওয়ার হিসাব বাছুন।');
  if(new Set(splits.map(s=>s.id)).size!==splits.length)return text('Duplicate payment source row.','একই পেমেন্টের সারি দুবার যোগ হয়েছে।');
  if(splits.some(s=>!accountOptions(s.method).some(a=>a.id===s.accountId)))return text('Choose a valid active account for every payment.','প্রতিটি পেমেন্টের জন্য চালু হিসাব বাছুন।');
  if(isParty&&dueReduction>money(maxDue)+0.001)
   return chosen?text('Cash plus settlement exceeds the selected invoice due.','টাকা ও ছাড় মিলে বাছা বিলের বাকির চেয়ে বেশি।'):text('Cash plus settlement exceeds outstanding due. Record an advance separately.','টাকা ও ছাড় মিলে মোট বাকির চেয়ে বেশি। অগ্রিম টাকা আলাদা করে লিখুন।');
  return '';
 };
 const beginReview=()=>{const message=validate();if(message){setError(message);return;}setError('');setReviewRevision(state.revision);setReview(true);};
 const confirm=()=>{
  if(busy.current)return;
  if(reviewRevision!==getPartyPreviewSnapshot().revision){setReview(false);setError(text('Party ledger changed. Please review the latest balance.','ক্রেতা বা সরবরাহকারীর হিসাব বদলেছে। নতুন জের দেখে আবার যাচাই করুন।'));return;}
  const message=validate();if(message){setReview(false);setError(message);return;}
  busy.current=true;
  try{
   if(type==='Expense'){
    const existing=getExpensePreviewSnapshot().expenses;
    const nextRef=Math.max(61,...existing.map(expense=>Number(expense.ref.replace('EXP-',''))||0))+1;
    const payments=splits.map(split=>counterExpensePayment(split,accounts));
    const expense:Expense={id:'counter-expense-'+Date.now(),ref:'EXP-'+String(nextRef).padStart(6,'0'),date:new Date(date+'T12:00:00.000Z').toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric',timeZone:'UTC'}),category:expenseCategory.trim(),payee:text('Counter','কাউন্টার'),note:note.trim(),amount:total,paid:total,method:payments[0]?.method??'Cash',payments};
    savePreviewExpense(expense);
   }
   if((type==='Customer Receive'||type==='Supplier Pay')&&selected){
    const payload:PartyPaymentPayload={partyId:selected.id,relationship:type==='Customer Receive'?'Customer':'Supplier',
     date,amount:total,discount,invoiceId:chosen?.id,
     reason:discount>0?[discountReason.trim(),note.trim()].filter(Boolean).join(' · '):note.trim(),
     splits,operationId:'counter-'+Date.now()};
    dispatchPartyPreview({type:'record-payment',payload},accounts);
   }
   if(type==='Bank Transfer')onTransfer({fromAccountId:from,toAccountId:to,amount:total,date,reference:note.trim()||undefined});
   setAccounts(current=>current.map(account=>{
    const adjustment=type==='Bank Transfer'
     ?(account.id===from?-total:account.id===to?total:0)
     :splits.filter(s=>s.accountId===account.id).reduce((v,s)=>v+(type==='Customer Receive'?s.amount:-s.amount),0);
    return adjustment?{...account,balance:money(account.balance+adjustment),lastActivity:'Just now'}:account;
   }));
   setReview(false);setSubmitted(true);setError('');
   toast.success(text(names[type]+' recorded in preview',banglaActions[type]+' · প্রিভিউতে লেখা হয়েছে'),{description:taka(total)+(selected?' · '+selected.name:'')});
   setRows([]);setAmount('');setDiscountInput('');setDiscountReason('');
   setNote('');setAllocation('');
  }catch(e){setError(e instanceof Error?e.message:text('Could not record this transaction.','এই লেনদেন লেখা যায়নি।'));setReview(false);}
  finally{busy.current=false;}
 };
 const highlight=(value:number)=>value===0?'text-ink':payerRole==='Supplier'?(value<0?'text-danger':'text-success'):(value>0?'text-danger':'text-success');
 return <section className="space-y-4 p-3 sm:p-4">
  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" role="group" aria-label="Counter actions">
   {kinds.map(item=><button type="button" key={item} aria-pressed={type===item} onClick={()=>changeType(item)}
    className={'min-h-14 rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring '+
     (type===item?'border-sidebar-primary bg-sidebar-accent text-sidebar-accent-foreground':'border-border bg-card text-ink hover:bg-ink-50')}>
    <span className="block text-[13px] font-semibold">{text(item,banglaActions[item])}</span>
    <span className="text-[11px] text-ink-500">{item==='Customer Receive'?word('customerMoney'):item==='Supplier Pay'?word('supplierPayment'):item==='Expense'?word('quickExpense'):word('betweenAccounts')}</span>
   </button>)}
   <button type="button" aria-haspopup="dialog" onClick={onNewFinanceTransaction}
    className="col-span-2 min-h-14 rounded-xl border border-border bg-card px-3 py-2 text-left text-ink transition-colors hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring sm:col-span-1">
    <span className="block text-[13px] font-semibold">{text('Finance transaction','মালিক ও ঋণের টাকা')}</span>
    <span className="text-[11px] text-ink-500">{text('Owner · Lender · Borrower','মালিক · ঋণদাতা · ঋণগ্রহীতা')}</span>
   </button>
  </div>
  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
   <div className="min-w-0 space-y-4">
    {(type==='Customer Receive'||type==='Supplier Pay')&&<div className="rounded-xl border border-border bg-card p-4"
     onBlur={event=>{if(!event.currentTarget.contains(event.relatedTarget))setSearching(false);}}
     onKeyDown={event=>{if(event.key==='Escape'&&searching){event.preventDefault();event.stopPropagation();event.currentTarget.querySelector('input')?.focus();setSearching(false);}}}>
     <label className="mb-1.5 block text-sm font-semibold text-ink">{type==='Customer Receive'?word('findCustomer'):word('findSupplier')}</label>
     <div className="relative">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-2.5 z-10 size-4 text-ink-400"/>
      <Input ref={partySearchRef} className="pl-9" aria-label={type==='Customer Receive'?text('Search customer','ক্রেতা খুঁজুন'):text('Search supplier','সরবরাহকারী খুঁজুন')} value={search}
       placeholder={text("Search name, phone or area","নাম, ফোন বা এলাকা খুঁজুন")} onFocus={()=>setSearching(true)} onClick={()=>setSearching(true)}
       onClear={clearParty}
       onChange={e=>{if(partyId){setRows([]);setDiscountInput('');setDiscountReason('');}
        setSearch(e.target.value);setPartyId('');setAllocation('');setSearching(true);setReview(false);}}
       onKeyDown={e=>{if(e.key==='Escape')setSearching(false);if(e.key==='Enter'&&searching&&filtered[0]){e.preventDefault();selectParty(filtered[0]);}}}/>
     </div>
     {searching&&<div role="listbox" aria-label={text("Matching parties","মিলে যাওয়া নাম")} className="mt-1 max-h-52 overflow-auto rounded-lg border border-border bg-popover p-1 shadow-card">
      {filtered.length?filtered.map(p=><button type="button" key={p.id} role="option" aria-selected={p.id===partyId}
       onMouseDown={e=>e.preventDefault()} onClick={()=>selectParty(p)}
       className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left hover:bg-sidebar-accent focus-visible:bg-sidebar-accent">
       <span className="min-w-0"><span className="block truncate text-sm font-medium">{p.name}</span><span className="block text-xs text-ink-500">{p.phone} · {p.area}</span></span>
       <ArrowRight className="size-4 shrink-0 text-ink-400"/>
      </button>):<p className="p-3 text-xs text-ink-500">{text("No matching parties","কোনো নাম মেলেনি")}</p>}
     </div>}
     {searching&&search.trim()&&filtered.length===0&&<Button type="button" variant="outline" size="sm" className="mt-2 w-full justify-start"
      onMouseDown={event=>event.preventDefault()} onClick={()=>setQuickAddOpen(true)}>
      <Plus className="size-4"/>{text(`Add “${search.trim()}” as ${payerRole.toLowerCase()}`,payerRole==='Customer'?`ক্রেতা হিসেবে “${search.trim()}” যোগ করুন`:`সরবরাহকারী হিসেবে “${search.trim()}” যোগ করুন`)}
     </Button>}
     {selected&&settlement&&<div className="mt-3 rounded-lg border border-border bg-ink-50/60 p-3" aria-live="polite">
      <div className="flex flex-wrap items-start justify-between gap-3">
       <div><p className="text-[11px] text-ink-500">{text('Selected '+payerRole.toLowerCase(),payerRole==='Customer'?'বাছা ক্রেতা':'বাছা সরবরাহকারী')}</p><p className="font-semibold">{selected.name}</p>
        <p className="text-xs text-ink-500">{selected.phone}</p></div>
       <div className="text-right"><p className="text-xs text-ink-500">{word("currentBalance")}</p>
        <p className={'text-xl font-semibold '+highlight(settlement.netBalance)}>{taka(Math.abs(settlement.netBalance))}</p>
        <p className="text-xs text-ink-500">{settlement.netBalance>0?(payerRole==='Customer'?text('Customer owes us','ক্রেতার কাছে পাওনা'):text('Advance with supplier','সরবরাহকারীর কাছে অগ্রিম')):settlement.netBalance<0?(payerRole==='Customer'?text('Customer has credit','ক্রেতার অগ্রিম জমা'):text('We owe supplier','সরবরাহকারীকে দেনা')):text('Settled','হিসাব মেটানো হয়েছে')}</p>
       </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-3 border-t border-border pt-2 text-xs">
       <span>{word("outstandingDue")} <strong>{taka(settlement.invoiceDue)}</strong></span>
       {settlement.availableCredit>0&&<span>{word("availableCredit")} <strong className="text-success">{taka(settlement.availableCredit)}</strong></span>}
      </div>
     </div>}
    </div>}
    {(type==='Customer Receive'||type==='Supplier Pay')&&selected&&settlement&&<div className="rounded-xl border border-border bg-card p-4">
     <label className="mb-2 block text-sm font-semibold">{text("Apply payment to","কোন বিলে টাকা জমা হবে")}</label>
     <AppSelect label={text("Invoice allocation","বিল বাছুন")} value={allocation} onChange={v=>{setAllocation(v);setReview(false);setError('');}}
      options={[{value:'',label:text('Oldest outstanding due first','আগের বাকি আগে মেটান')},...openInvoices.filter(r=>!r.opening).map(r=>({value:r.id,label:r.reference+' · '+taka(r.due)}))]}/>
     <p className="mt-2 text-xs text-ink-500">{chosen
      ?text('Only '+chosen.reference+' will be paid. Available invoice due '+taka(chosen.due)+'.','শুধু '+chosen.reference+' বিলের টাকা জমা হবে। বাকি '+taka(chosen.due)+'।')
      :text('Oldest unpaid invoices and opening balance are settled first.','আগের বকেয়া বিল ও শুরুর বাকি আগে মেটানো হবে।')}</p>
     {!!previewAllocation.length&&<div className="mt-3 space-y-1 border-t border-border pt-2 text-xs">
      <p className="font-semibold text-ink">{text("Payment allocation preview","কোন বিলে কত টাকা যাবে")}</p>
      {previewAllocation.map((row,i)=><div key={row.invoice+i} className="flex justify-between gap-3"><span>{row.invoice}</span><strong>{taka(row.amount)}</strong></div>)}
     </div>}
    </div>}
    {type==='Expense'&&<label className="block rounded-xl border border-border bg-card p-4 text-sm font-semibold">{text('Expense category','খরচের ধরন')}
      <Input className="mt-2" value={expenseCategory} onChange={e=>setExpenseCategory(e.target.value)} placeholder={text("e.g. Transport","যেমন: পরিবহন")}/>
    </label>}
    {type==='Bank Transfer'&&<div className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
     <label className="text-sm font-semibold">{text('From account','যে হিসাব থেকে যাবে')}
      <AppSelect className="mt-2" label={text("From account","যে হিসাব থেকে যাবে")} value={from} onChange={v=>{setFrom(v);setReview(false);}}
       options={accounts.filter(a=>a.status==='Active').map(a=>({value:a.id,label:transferAccountLabel(a.id)+' · '+taka(a.balance)}))}/>
     </label>
     <label className="text-sm font-semibold">{text('To account','যে হিসাবে যাবে')}
      <AppSelect className="mt-2" label={text("To account","যে হিসাবে যাবে")} value={to} onChange={v=>{setTo(v);setReview(false);}}
       options={accounts.filter(a=>a.status==='Active').map(a=>({value:a.id,label:transferAccountLabel(a.id)}))}/>
     </label>
     <label className="text-sm font-semibold sm:col-span-2">{text('Transfer amount','কত টাকা পাঠাবেন')}
      <Input className="mt-2 text-right" aria-label={text("Transfer amount","পাঠানোর টাকা")} inputMode="decimal" value={amount} onChange={e=>{setAmount(e.target.value);setReview(false);}} placeholder="0.00"/>
     </label>
    </div>}
    {type!=='Bank Transfer'&&<div className="rounded-xl border border-border bg-card">
     <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
      <div><h3 className="text-sm font-semibold">{text("Payment sources","টাকার মাধ্যম")}</h3><p className="text-xs text-ink-500">{text("Add cash, bank and mobile banking payments. Total updates automatically.","ক্যাশ, ব্যাংক বা মোবাইল ব্যাংকিংয়ে টাকা নিন বা দিন। মোট টাকা নিজে হিসাব হবে।")}</p></div>
      <div className="flex gap-2">
       {(type==='Customer Receive'||type==='Supplier Pay')&&maxDue>0&&<Button variant="outline" size="sm" onClick={fillDue}>{text("Full due","পুরো বাকি")}</Button>}
       <Button variant="outline" size="sm" onClick={addRow}><Plus className="size-4"/> {text("Add payment","আরও মাধ্যম")}</Button>
      </div>
     </div>
     <div className="space-y-2 p-3 sm:p-4">
      {effectiveRows.map(row=>{
       const available=accountOptions(row.method);
       return <div key={row.id} className="grid grid-cols-[1fr_1fr_34px] gap-2 sm:grid-cols-[130px_1fr_140px_34px]">
        <AppSelect label={text("Payment method","টাকার মাধ্যম")} value={row.method} onChange={method=>editRows(effectiveRows.map(x=>x.id===row.id?{...x,method:method as Row['method'],accountId:accountOptions(method as Row['method'])[0]?.id??''}:x))} options={methods.map(method=>({value:method,label:text(method,method==='Cash'?'ক্যাশ':method==='Bank'?'ব্যাংক':'মোবাইল ব্যাংকিং')}))}/>
        <AppSelect label={text("Payment account","টাকার হিসাব")} value={row.accountId} onChange={accountId=>editRows(effectiveRows.map(x=>x.id===row.id?{...x,accountId}:x))}
         options={available.map(x=>({value:x.id,label:financeAccountOptionLabel(x,available)}))}/>
        <Input className="col-span-2 text-right sm:col-span-1" aria-label={text("Payment source amount","পেমেন্টের টাকা")} inputMode="decimal"
         value={row.amount} onChange={e=>editRows(effectiveRows.map(x=>x.id===row.id?{...x,amount:e.target.value}:x))} placeholder="0.00"/>
        <button type="button" aria-label={text("Remove payment","পেমেন্টের মাধ্যম সরান")} disabled={effectiveRows.length===1} onClick={()=>editRows(effectiveRows.filter(x=>x.id!==row.id))}
         className="row-start-1 col-start-3 flex size-9 items-center justify-center text-ink-500 hover:text-danger disabled:opacity-30 sm:row-auto sm:col-auto"><Trash2 className="size-4"/></button>
       </div>;
      })}
      {(type==='Customer Receive'||type==='Supplier Pay')&&selected&&
      <section className="rounded-lg border border-border bg-ink-50/50 p-3" aria-label={text("Discount and settlement","ছাড় ও সমন্বয়")}>
       <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-xs font-semibold text-ink">{text("Discount / settlement","ছাড় / সমন্বয়")}</h3>
        <span className="text-[11px] text-ink-500">{text("Reduces due · no cash movement","বাকি কমবে, ক্যাশ বদলাবে না")}</span>
       </div>
       <div className="mt-2 grid gap-2 sm:grid-cols-[180px_minmax(0,1fr)]">
        <label className="text-xs font-medium text-ink-600">{text("Settlement amount","সমন্বয়ের টাকা")}
         <Input className="mt-1 text-right" inputMode="decimal" aria-label={text("Settlement discount amount","ছাড় বা সমন্বয়ের টাকা")} placeholder="0.00"
          value={discountInput} onChange={ev=>{setDiscountInput(ev.target.value);setReview(false);setError('');}}/>
        </label>
        {discount>0&&<label className="text-xs font-medium text-ink-600">{text("Reason","কারণ")} <span className="text-danger">*</span>
         <Input className="mt-1" aria-label={text("Settlement reason","সমন্বয়ের কারণ")} placeholder={text("Why is the balance reduced?","কেন বাকি কমানো হচ্ছে?")} value={discountReason}
          onChange={ev=>{setDiscountReason(ev.target.value);setReview(false);}}/>
        </label>}
       </div>
       {discount>0&&<p className="mt-2 text-xs text-ink-500">{text('Cash','ক্যাশ')} {taka(total)} + {text('settlement','সমন্বয়')} {taka(discount)} = {text('total due reduction','মোট বাকি কমবে')} {taka(dueReduction)}</p>}
      </section>}
      <div className="space-y-1 border-t border-border pt-3">
       <div className="flex items-center justify-between gap-3"><span className="text-sm text-ink-500">{text('Automatically calculated cash total','হিসাব করা মোট টাকা')}</span>
        <strong className="text-xl text-ink" aria-live="polite">{taka(total)}</strong></div>
       {discount>0&&<div className="flex justify-between gap-3 text-xs text-ink-500"><span>{text('Including settlement, due reduces by','সমন্বয়সহ বাকি কমবে')}</span><strong>{taka(dueReduction)}</strong></div>}
      </div>
     </div>
    </div>}
    <label className="block rounded-xl border border-border bg-card p-4 text-sm font-semibold">{text('Reference / note (optional)','রেফারেন্স / মন্তব্য (ঐচ্ছিক)')}
     <Input className="mt-2" value={note} onChange={e=>{setNote(e.target.value);setReview(false);}} placeholder={text("Transaction details","লেনদেনের বিবরণ")}/>
    </label>
   </div>
   <aside className="h-fit rounded-xl border border-border bg-card p-4 xl:sticky xl:top-4">
    <h3 className="mb-3 text-sm font-semibold">{text("Transaction summary","লেনদেনের সারাংশ")}</h3>
    <p className="text-xs text-ink-500">{type==='Customer Receive'?text('Money received','টাকা পাওয়া'):type==='Supplier Pay'?text('Money paid','টাকা দেওয়া'):text('Total amount','মোট টাকা')}</p>
    <p className="text-2xl font-semibold text-ink" aria-live="polite">{taka(total)}</p>
    <AmountInWordsDisplay amount={total} />
    {settlement&&<div className="mt-4 space-y-2 border-t border-border pt-3 text-sm">
     <div className="flex justify-between gap-2"><span>{text('Before payment','টাকা দেওয়া/নেওয়ার আগে')}</span><strong>{taka(settlement.netBalance)}</strong></div>
     <div className="flex justify-between gap-2"><span>{type==='Customer Receive'?text('Receive cash','ক্যাশ নিন'):text('Pay cash','ক্যাশ দিন')}</span><strong>{taka(total)}</strong></div>
     {discount>0&&<div className="flex justify-between gap-2"><span>Discount / settlement</span><strong>{taka(discount)}</strong></div>}
     <div className="flex justify-between gap-2 border-t border-border pt-2"><span>{text('Balance after','পরে জের')}</span><strong className={highlight(predicted)}>{taka(predicted)}</strong></div>
    </div>}
    {submitted&&<div role="status" className="mt-3 rounded-lg border border-success/20 bg-success/5 p-3 text-xs text-success"><CheckCircle2 className="mb-1 size-4"/> {text('Recorded in preview. Ledger balance is updated.','প্রিভিউতে লেখা হয়েছে। হিসাবের জের বদলেছে।')}</div>}
    {error&&<p role="alert" className="mt-3 rounded-lg border border-danger/30 bg-danger-bg p-3 text-xs text-danger">{error}</p>}
    <Button className="mt-4 w-full" onClick={beginReview} disabled={type==='Bank Transfer'||type==='Expense'?total<=0:dueReduction<=0}>{text('Review '+names[type].toLowerCase(), 'যাচাই করুন: '+banglaActions[type])}</Button>
   </aside>
  </div>
  <Dialog open={review} onOpenChange={setReview}>
   <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
    <DialogHeader><DialogTitle>{text('Confirm '+names[type].toLowerCase(),'নিশ্চিত করুন: '+banglaActions[type])}</DialogTitle>
     <DialogDescription>{text('Check the party, amount, payment accounts and updated balance before recording.','লেখার আগে নাম, টাকা, হিসাব ও নতুন জের মিলিয়ে নিন।')}</DialogDescription></DialogHeader>
    <div className="space-y-3 text-sm">
     <div className="rounded-xl border border-border bg-ink-50 p-4">
      <p className="text-xs text-ink-500">{text('Cash amount','ক্যাশের টাকা')}</p>
      <p className="text-2xl font-semibold">{taka(total)}</p>
      <AmountInWordsDisplay amount={total} />
     </div>
     {selected&&<p><strong>{text(payerRole,payerRole==='Customer'?'ক্রেতা':'সরবরাহকারী')}: </strong>{selected.name} · {selected.phone}</p>}
     {discount>0&&<div className="rounded-lg border border-border p-3">
      <div className="flex justify-between gap-2"><span>Discount / settlement</span><strong>{taka(discount)}</strong></div>
      <AmountInWordsDisplay amount={discount} />
      <p className="mt-2"><strong>{text('Reason','কারণ')}:</strong> {discountReason.trim()}</p>
      <p className="mt-1 border-t border-border pt-2 font-semibold">{text('Total due reduction','মোট বাকি কমবে')}: {taka(dueReduction)}</p>
     </div>}
     {chosen&&<p><strong>{text('Invoice','বিল')}:</strong> {chosen.reference} · {text('outstanding','বাকি')} {taka(chosen.due)}</p>}
     {!chosen&&(type==='Customer Receive'||type==='Supplier Pay')&&<p><strong>{text('Allocation','টাকা জমার নিয়ম')}:</strong> {text('Oldest outstanding first','আগের বাকি আগে')}</p>}
     {(type==='Customer Receive'||type==='Supplier Pay')&&previewAllocation.length>0&&<div aria-label={text('Payment allocation preview','কোন বিলে কত টাকা যাবে')} className="rounded-lg border border-border p-3">
      {previewAllocation.map((row,index)=><p key={row.invoice+index} className="flex justify-between gap-3"><span>{row.invoice}</span><strong>{taka(row.amount)}</strong></p>)}
     </div>}
     {type==='Bank Transfer'?<p>{transferAccountLabel(from)} → {transferAccountLabel(to)}</p>
      :<div className="space-y-1">{splits.map((s,i)=>{const account=accounts.find(a=>a.id===s.accountId);return <p key={s.id}>{i+1}. {s.method} · {account?financeAccountOptionLabel(account,accounts):''} <strong>{taka(s.amount)}</strong></p>;})}</div>}
     {settlement&&<div className="rounded-lg border border-border p-3">
      <div className="flex justify-between"><span>{word('currentBalance')}</span><strong>{taka(settlement.netBalance)}</strong></div>
      <div className="mt-2 flex justify-between border-t border-border pt-2"><span>{text('After payment','টাকা দেওয়া/নেওয়ার পরে')}</span><strong className={highlight(predicted)}>{taka(predicted)}</strong></div>
     </div>}
     {note&&<p className="text-xs text-ink-500">{text('Note','মন্তব্য')}: {note}</p>}
     <p className="flex items-start gap-2 text-xs text-ink-500"><AlertTriangle className="size-4 shrink-0 text-warning"/> {text('This records an in-browser ERP preview, not a bank transfer or backend posting.','এটি শুধু ব্রাউজারের প্রিভিউ। আসল ব্যাংক বা সার্ভারের হিসাবে লেনদেন হবে না।')}</p>
     <div className="flex justify-end gap-2 pt-2"><Button variant="outline" onClick={()=>setReview(false)}>{text('Edit details','সংশোধন করুন')}</Button>
      <Button onClick={confirm} disabled={busy.current}><CheckCircle2 className="size-4"/> {text('Confirm & record','নিশ্চিত করে লিখুন')}</Button></div>
    </div>
   </DialogContent>
  </Dialog>
  <PartyEditorDialog key={`${payerRole}:${search.trim()}`} open={quickAddOpen} defaultRole={payerRole} initialName={search.trim()} onClose={()=>setQuickAddOpen(false)} onSave={addParty}/>
 </section>;
}
