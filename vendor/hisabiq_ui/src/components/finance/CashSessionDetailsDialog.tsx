import React from 'react';
import { Printer, RefreshCw } from 'lucide-react';
import { Button } from '../Button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../Dialog';
import { StatusBadge } from '../StatusBadge';
import type { CashSessionRecord } from '../../data/financeAccounts';
import { taka } from '../../utils/currency';
import {useUiCopy} from '../../i18n/useUiCopy';
import {financeLabel} from '../../i18n/financeCopy';
import {printReport} from '../../utils/reportOutput';
import {toast} from 'sonner';

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  const {text}=useUiCopy();
  const bn:Record<string,string>={Date:'তারিখ',Opened:'খোলার সময়',Closed:'বন্ধের সময়','Opening cash':'শুরুর ক্যাশ','Expected cash':'থাকার কথা','Counted cash':'গুনে পাওয়া টাকা',Variance:'পার্থক্য',Note:'মন্তব্য'};
  return <div className="rounded-lg bg-ink-50 px-3 py-2.5"><p className="text-[10.5px] text-ink-400">{text(label,bn[label]??label)}</p><div className="mt-0.5 text-[12.5px] font-medium text-ink">{children}</div></div>;
}

export function CashSessionDetailsDialog({
  session,
  onClose,
  onReconcile
}: {
  session: CashSessionRecord | null;
  onClose: () => void;
  onReconcile: (session: CashSessionRecord) => void;
}) {
  const {text,language}=useUiCopy();
  if (!session) return null;
  const variance = session.variance ?? (session.countedCash === undefined ? undefined : session.countedCash - session.expectedCash);

  const printSession=()=>{
    const items:[string,string|number][]=[
      [text('Date','তারিখ'),session.date],[text('Opened','খোলার সময়'),session.openedAt],
      [text('Closed','বন্ধের সময়'),session.closedAt??text('Still open','এখনো চালু')],
      [text('Opening cash','শুরুর ক্যাশ'),taka(session.openingCash)],
      [text('Expected cash','থাকার কথা'),taka(session.expectedCash)],
      [text('Counted cash','গুনে পাওয়া টাকা'),session.countedCash===undefined?'—':taka(session.countedCash)],
      [text('Variance','পার্থক্য'),variance===undefined?'—':(variance>0?'+':variance<0?'−':'')+taka(Math.abs(variance))],
      [text('Note','মন্তব্য'),session.note??'—']
    ];
    if(!printReport({title:text('Cash session','ক্যাশ সেশন')+' '+session.id,language,subtitle:text('Session preview — verify actual counted cash.','ক্যাশের নমুনা হিসাব — গুনে পাওয়া টাকা যাচাই করুন।'),headers:[text('Field','বিবরণ'),text('Value','তথ্য')],rows:items}))toast.error(text('Allow the print popup and try again.','প্রিন্ট উইন্ডো খুলে আবার চেষ্টা করুন।'));
  };
  return (
    <Dialog open={!!session} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader><DialogTitle>{session.id} <StatusBadge tone={session.status === 'Open' ? 'success' : variance ? 'warning' : 'neutral'} dot>{financeLabel(language,session.status)}</StatusBadge></DialogTitle></DialogHeader>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Date">{session.date}</Detail>
          <Detail label="Opened">{session.openedAt}</Detail>
          <Detail label="Closed">{session.closedAt || text('Still open','এখনো চালু')}</Detail>
          <Detail label="Opening cash">{taka(session.openingCash)}</Detail>
          <Detail label="Expected cash">{taka(session.expectedCash)}</Detail>
          <Detail label="Counted cash">{session.countedCash === undefined ? '—' : taka(session.countedCash)}</Detail>
          <Detail label="Variance">{variance === undefined ? '—' : (variance > 0 ? '+' : variance < 0 ? '−' : '') + taka(Math.abs(variance))}</Detail>
          <div className="sm:col-span-2"><Detail label="Note">{session.note || '—'}</Detail></div>
        </div>
        {variance !== undefined && variance !== 0 && <div className="rounded-lg border border-warning/20 bg-warning/5 px-3 py-2.5"><p className="text-[12.5px] font-medium text-ink">{text('Cash variance needs review','ক্যাশের পার্থক্য মিলিয়ে দেখুন')}</p><p className="mt-1 font-bn text-[10.5px] text-ink-500">{text('Short/over will not create an automatic balancing entry. Review in reconciliation.','কম বা বেশি ক্যাশের জন্য নিজে থেকে হিসাবের লেনদেন তৈরি হবে না। মিলিয়ে দেখুন।')}</p></div>}
        <DialogFooter>
          <Button variant="outline" onClick={printSession}><Printer className="size-4" /> {text('Print','প্রিন্ট')}</Button>
          <Button variant="outline" onClick={() => onReconcile(session)}><RefreshCw className="size-4" /> {text('Reconcile','মিলিয়ে দেখুন')}</Button>
          <Button onClick={onClose}>{text('Close','বন্ধ করুন')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
