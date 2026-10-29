import React, { useMemo } from 'react';
import {toast} from 'sonner';
import {printReport} from '../../utils/reportOutput';
import {useUiCopy} from '../../i18n/useUiCopy';
import {documentLabel} from '../../i18n/documentCopy';
import { ExternalLink, Pencil, Printer, Trash2 } from 'lucide-react';
import { Button } from '../Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../Dialog';
import { StatusBadge } from '../StatusBadge';
import { accountingAccounts } from '../../data/accounting';
import type { AuditEvent, AuditSourceRecord } from '../../types/audit';
import type { Posting } from '../../types/accounting';
import { taka } from '../../utils/currency';
import { AuditTimeline } from './AuditTimeline';
import { auditActionAvailability, demoPermissions } from '../../utils/permissions';

function Detail({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  const {language,showHelper}=useUiCopy();
  const fieldBn:Record<string,string>={'Transaction Date':'লেনদেনের তারিখ','Created Date':'লেখার তারিখ','Posted by':'যিনি লিখেছেন','Posted at':'লেখার সময়','Party / Person':'পক্ষ / ব্যক্তি',Amount:'টাকা',Paid:'পরিশোধ',Due:'বাকি',Source:'উৎস',Reference:'নম্বর','Last changed by':'শেষ সংশোধনকারী','Last changed at':'শেষ সংশোধনের সময়',Quantity:'পরিমাণ','Already returned':'আগেই ফেরত এসেছে','From account':'যে হিসাব থেকে','To account':'যে হিসাবে'};
  const labelText=language==='Bangla'?(fieldBn[label]??label):label;
  return <div className="rounded-lg bg-ink-50 px-3 py-2.5"><p className="text-[10.5px] text-ink-400">{labelText}{helper&&showHelper ? <span className="font-bn"> · {helper}</span> : null}</p><div className="mt-0.5 text-[12.5px] font-medium text-ink">{children}</div></div>;
}

export function AuditDetailsDialog({
  source,
  posting,
  events,
  onClose,
  onEdit,
  onDelete,
  onGoToSource
}: {
  source: AuditSourceRecord | null;
  posting?: Posting;
  events: readonly AuditEvent[];
  onClose: () => void;
  onEdit: (source: AuditSourceRecord) => void;
  onDelete: (source: AuditSourceRecord) => void;
  onGoToSource: (source: AuditSourceRecord) => void;
}) {
  const {text,language,showHelper}=useUiCopy();
  const accountMap = useMemo(() => new Map(accountingAccounts.map((item) => [item.id, item.name])), []);
  if (!source) return null;
  const lastEvent = events[0];
  const availability = auditActionAvailability(source.source, demoPermissions);
  const hasReturnDependency = source.source === 'sale' && (source.returnedQuantity ?? 0) > 0;

  return (
    <Dialog open={!!source} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{source.reference} <StatusBadge tone={source.status === 'Posted' ? 'success' : 'neutral'} dot>{text(source.status,source.status==='Posted'?'লেখা হয়েছে':'মুছে ফেলা')}</StatusBadge></DialogTitle>
        </DialogHeader>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Transaction Date" helper="যে তারিখের লেনদেন">{source.transactionDate}</Detail>
          <Detail label="Created Date" helper="যেদিন এন্ট্রি হয়েছে">{source.createdAt.slice(0, 10)}</Detail>
          <Detail label="Posted by">{source.postedBy}</Detail>
          <Detail label="Posted at">{source.createdAt.replace('T', ' ').slice(0, 16)}</Detail>
          <Detail label="Party / Person">{source.party || '—'}</Detail>
          <Detail label="Amount">{taka(source.amount)}</Detail>
          <Detail label="Paid">{source.paid ? taka(source.paid) : '—'}</Detail>
          <Detail label="Due">{source.due ? taka(source.due) : '—'}</Detail>
          <Detail label="Source">{source.source.replaceAll('-', ' ')}</Detail>
          <Detail label="Reference">{source.reference}</Detail>
          <Detail label="Last changed by">{lastEvent?.user || '—'}</Detail>
          <Detail label="Last changed at">{lastEvent?.at?.replace('T', ' ').slice(0, 16) || '—'}</Detail>
          {source.quantity !== undefined && <Detail label="Quantity">{source.quantity}</Detail>}
          {source.returnedQuantity !== undefined && <Detail label="Already returned">{source.returnedQuantity}</Detail>}
          {source.fromAccount && <Detail label="From account">{source.fromAccount}</Detail>}
          {source.toAccount && <Detail label="To account">{source.toAccount}</Detail>}
        </div>

        {(source.description || source.note) && (
          <div className="grid gap-2 sm:grid-cols-2">
            {source.description && <div className="rounded-lg border border-border px-3 py-2.5"><p className="text-[10.5px] text-ink-400">{text('Description','বিবরণ')}</p><p className="mt-0.5 text-[12.5px] text-ink-700">{source.description}</p></div>}
            {source.note && <div className="rounded-lg border border-border px-3 py-2.5"><p className="text-[10.5px] text-ink-400">{text('Internal note','ভেতরের মন্তব্য')}</p><p className="mt-0.5 text-[12.5px] text-ink-700">{source.note}</p></div>}
          </div>
        )}

        {hasReturnDependency && (
          <div className="rounded-xl border border-warning/20 bg-warning/5 px-3 py-2.5">
            <p className="text-[12.5px] font-semibold text-ink">{text('Linked return blocks complete Delete','সংশ্লিষ্ট ফেরত থাকায় পুরো লেনদেন মোছা যাবে না')}</p>
            <p className="mt-1 font-bn text-[10.5px] text-ink-500">এই Sale থেকে {source.returnedQuantity}টি পণ্য Return হয়েছে। Sale মুছতে হলে আগে Return ঠিক বা মুছতে হবে। অন্য নিরাপদ correction করা যাবে।</p>
          </div>
        )}

        {!!source.paymentAccounts?.length && (
          <div className="rounded-xl border border-border">
            <div className="border-b border-border px-3 py-2.5"><p className="text-[12.5px] font-semibold text-ink">{text('Payment / Money Accounts','টাকার হিসাবগুলো')}</p><p className="font-bn text-[10.5px] text-ink-400">কোন অ্যাকাউন্টে কত টাকার প্রভাব</p></div>
            <div className="divide-y divide-border">
              {source.paymentAccounts.map((payment, index) => (
                <div key={index} className="flex items-center justify-between px-3 py-2 text-[12px]"><span className="text-ink-600">{payment.account}</span><span className="font-medium text-ink">{taka(payment.amount)}</span></div>
              ))}
            </div>
          </div>
        )}

        {posting && (
          <div className="rounded-xl border border-border">
            <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
              <div><p className="text-[12.5px] font-semibold text-ink">{text('Accounting posting','হিসাবের এন্ট্রি')}</p><p className="font-bn text-[10.5px] text-ink-400">এই লেনদেন থেকে তৈরি হিসাব — এক পাশ আলাদা করে পরিবর্তন করা যাবে না</p></div>
              <StatusBadge tone={posting.status === 'Posted' ? 'success' : 'neutral'}>{text(posting.status,posting.status==='Posted'?'লেখা হয়েছে':'মুছে ফেলা')}</StatusBadge>
            </div>
            <div className="divide-y divide-border">
              {posting.lines.map((line, index) => (
                <div key={index} className="grid grid-cols-[1fr_110px_110px] gap-2 px-3 py-2 text-[12px]">
                  <span className="text-ink-600">{accountMap.get(line.accountId) || line.accountId}</span>
                  <span className="text-right text-ink-500">{line.debit ? text('Debit','ডেবিট')+' '+taka(line.debit) : '—'}</span>
                  <span className="text-right text-ink-500">{line.credit ? text('Credit','ক্রেডিট')+' '+taka(line.credit) : '—'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-[12.5px] font-semibold text-ink">{text('Audit history','পরিবর্তনের ইতিহাস')} {showHelper&&<span className="font-bn text-[10.5px] font-normal text-ink-400">· কে কী পরিবর্তন করেছেন</span>}</p>
          <AuditTimeline events={events} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => {
            const rows=(posting?.lines??[]).map(line=>[accountMap.get(line.accountId)??line.accountId,line.debit,line.credit]);
            if(!printReport({title:source.reference,language,subtitle:`${source.transactionDate} · ${source.party??''} · ${documentLabel(language,'Amount')} ${taka(source.amount)} · ${documentLabel(language,'Paid')} ${taka(source.paid??0)} · ${documentLabel(language,'Due')} ${taka(source.due??0)} · ${documentLabel(language,source.status)}`,headers:['Account','Debit','Credit'].map(h=>documentLabel(language,h)),rows}))toast.error(text('Allow the print preview window, then try again.','প্রিন্টের উইন্ডো খুলে আবার চেষ্টা করুন।'));
          }}><Printer className="size-4" /> {text('Print','প্রিন্ট')}</Button>
          <Button variant="outline" onClick={() => onGoToSource(source)}><ExternalLink className="size-4" /> {text('Go to source','মূল লেনদেন খুলুন')}</Button>
          {source.status === 'Posted' && availability.correct && <Button variant="outline" onClick={() => onEdit(source)}><Pencil className="size-4" /> {text('Correct','সংশোধন')}</Button>}
          {source.status === 'Posted' && availability.delete && <Button variant="outline" onClick={() => onDelete(source)}><Trash2 className="size-4" /> {text('Delete','মুছুন')}</Button>}
          <Button onClick={onClose}>{text('Close','বন্ধ করুন')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

