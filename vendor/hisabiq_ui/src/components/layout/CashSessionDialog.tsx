import { useMemo, useState } from 'react';
import { Lock, Unlock, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../Dialog';
import { Button } from '../Button';
import { Input } from '../Input';
import { useCashSession } from '../../contexts/CashSessionContext';
import { denominations } from '../../data/finance';
import { formatNumber, taka } from '../../utils/currency';
import { useUiCopy } from '../../i18n/useUiCopy';

export function CashSessionDialog() {
  const { text, showHelper } = useUiCopy();
  const { open, setOpen, sessionOpen, startSession, saveCount, openingCash, expectedCash:expected, sampleMovements, lastCount } = useCashSession();
  const [counts, setCounts] = useState<Record<number, string>>({});
  const [countMode,setCountMode]=useState<'total'|'notes'>('total');
  const [total,setTotal]=useState('');
  const [note, setNote] = useState('');
  const [float, setFloat] = useState('5000');

  const notesTotal = useMemo(
    () => denominations.reduce((sum, d) => sum + d * (parseInt(counts[d] || '0', 10) || 0), 0),
    [counts]
  );
  const counted=countMode==='notes'?notesTotal:Number(total);
  const diff = counted - expected;
  const hasCount=(countMode==='total'?total.trim()!=='':Object.values(counts).some(value=>value!==''))&&Number.isFinite(counted)&&Number.isSafeInteger(Math.round(counted*100))&&counted>=0;
  const summary=[{label:text('Opening cash','শুরুর ক্যাশ'),value:openingCash},...(sampleMovements?[
    {label:text('Cash sales','ক্যাশ বিক্রি'),value:38610},
    {label:text('Customer payments','ক্রেতার টাকা'),value:7820},
    {label:text('Cash expenses','ক্যাশ খরচ'),value:-3180}
  ]:[])];

  const close = () => {
    if(!hasCount||(diff!==0&&!note.trim()))return;
    saveCount(counted,note,true);
    setOpen(false);
    toast.success(text('Cash session closed in preview','নমুনা ক্যাশ সেশন বন্ধ হয়েছে'), {
      description: `${text('Counted','গুনে পাওয়া')} ${taka(counted)} · ${diff === 0 ? text('Balanced','মিলেছে') : diff > 0 ? `${text('Extra','বেশি')} ${taka(diff)}` : `${text('Short','কম')} ${taka(-diff)}`}`
    });
  };

  if (!sessionOpen) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent role="dialog" aria-modal="true" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{text('Open cash session','ক্যাশ সেশন খুলুন')}</DialogTitle>
            <DialogDescription>
              {text('Preview only; resets on reload. Count the drawer before the first sale.','শুধু নমুনা; রিলোড করলে তথ্য মুছে যাবে। প্রথম বিক্রির আগে ক্যাশ গুনুন।')}{showHelper && <span className="font-bn"> ক্যাশ গুনে সেশন শুরু করুন।</span>}
            </DialogDescription>
          </DialogHeader>
          <label className="block text-sm font-medium text-ink">
            {text('Opening cash','শুরুর টাকা')}{showHelper && <span className="font-bn font-normal text-ink-500"> · শুরুর টাকা</span>}
            <div className="relative mt-1.5">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400">৳</span>
              <Input aria-label={text('Opening cash','শুরুর টাকা')} value={float} onChange={(e) => setFloat(e.target.value.replace(/\D/g, ''))} className="pl-7 text-right" inputMode="numeric" />
            </div>
          </label>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>{text('Cancel','বাতিল')}</Button>
            <Button disabled={!float.trim()||!Number.isSafeInteger(Number(float))}
              onClick={() => {
                startSession(Number(float));setCounts({});setTotal('');setNote('');
                setOpen(false);
                toast.success(text('Cash session opened in preview','নমুনা ক্যাশ সেশন চালু হয়েছে'), { description: `${text('Opening cash','শুরুর ক্যাশ')} ${taka(parseInt(float || '0', 10))}` });
              }}>
              
              <Unlock className="size-4" /> {text('Open session','সেশন খুলুন')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>);

  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent role="dialog" aria-modal="true" className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <Wallet className="size-4 text-teal-600" /> {text('Cash reconciliation','ক্যাশ মিলানো')}
            {showHelper && <span className="font-bn text-sm font-normal text-ink-500">ক্যাশ মিলানো</span>}
          </DialogTitle>
          <DialogDescription>{text('UI preview only · counts stay until reload; sales and payments are not connected.','শুধু নমুনা · রিলোড করলে গণনার তথ্য মুছে যাবে; বিক্রি ও পেমেন্টের সাথে যুক্ত নয়।')}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2" role="group" aria-label={text('How to count cash','ক্যাশ গোনার পদ্ধতি')} >
          <Button variant={countMode==='total'?'default':'outline'} aria-pressed={countMode==='total'} onClick={()=>setCountMode('total')}>{text('Enter total','মোট টাকা লিখুন')}{showHelper && <span className="font-bn"> · মোট টাকা</span>}</Button>
          <Button variant={countMode==='notes'?'default':'outline'} aria-pressed={countMode==='notes'} onClick={()=>setCountMode('notes')}>{text('Count notes','নোট গুনুন')}{showHelper && <span className="font-bn"> · নোট গুনুন</span>}</Button>
        </div>
        <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
          <div>
            {countMode==='total'?<label className="block text-sm font-medium text-ink">{text('Cash counted','হাতে গোনা টাকা')}{showHelper && <span className="font-bn font-normal text-ink-500"> · হাতে গোনা টাকা</span>}
             <Input aria-label={text("Cash counted","হাতে গোনা টাকা")} className="mt-2 h-9 text-right text-lg" inputMode="decimal" value={total} onChange={event=>setTotal(event.target.value)} placeholder="৳0.00"/>
             <span className="mt-2 block text-xs font-normal text-ink-500">{text('Count the cash in your drawer, then enter the total.','ড্রয়ারের টাকা গুনে মোট অঙ্কটি লিখুন।')}</span>
            </label>:<><p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-400">{text('Count drawer','ড্রয়ারের ক্যাশ গুনুন')}</p>
            <div className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              {denominations.map((d) => {
                const n = parseInt(counts[d] || '0', 10) || 0;
                return (
                  <div key={d} className="flex items-center gap-2 text-sm">
                    <span className="w-12 text-right font-medium text-ink">৳{d}</span>
                    <span className="text-ink-400">×</span>
                    <Input
                      aria-label={`${text("Number of notes","নোটের সংখ্যা")} ৳${d}`}
                      value={counts[d] ?? ''}
                      onChange={(e) => setCounts({ ...counts, [d]: e.target.value.replace(/\D/g, '') })}
                      className="h-9 w-20 text-right"
                      inputMode="numeric"
                      placeholder="0" />
                    
                    <span className="flex-1 text-right text-ink-600">{formatNumber(d * n)}</span>
                  </div>);

              })}
            </div></>}
          </div>

          <div className="space-y-3 rounded-lg bg-ink-50 p-3 text-sm">
            {summary.map((s) =>
            <div key={s.label} className="flex justify-between gap-2">
                <span className="text-ink-500">{s.label}</span>
                <span className="tabular-nums text-ink">{taka(s.value)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-ink-200 pt-2 font-medium">
              <span>{text('Expected','থাকার কথা')}{showHelper && ' · থাকার কথা'}</span>
              <span >{taka(expected)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>{text('Counted','গোনা টাকা')}{showHelper && ' · গোনা টাকা'}</span>
              <span>{hasCount ? taka(counted) : '—'}</span>
            </div>
            <div
              className={`flex justify-between rounded-md px-2 py-1.5 font-semibold ${
              !hasCount ? 'bg-ink-50 text-ink-500' : diff === 0 ? 'bg-success-bg text-success' : diff > 0 ? 'bg-info-bg text-info' : 'bg-danger-bg text-danger'}`
              }>
              
              <span>{!hasCount ? text('Enter count','টাকা গুনে লিখুন') : diff === 0 ? text('Balanced','মিলেছে') : diff > 0 ? text('Extra','বেশি') : text('Short','কম')}</span>
              <span>{hasCount ? taka(Math.abs(diff)) : '—'}</span>
            </div>
          </div>
        </div>

        <label className="block text-sm font-medium text-ink">
          {text('Note','মন্তব্য')} <span className="font-normal text-ink-400">{hasCount && diff!==0 ? text('(required to close with a difference)','(পার্থক্য থাকলে বন্ধ করতে কারণ লিখুন)') : text('(optional)','(ঐচ্ছিক)')}</span>
          <Input value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5" placeholder={text("e.g. ৳50 given as change from personal cash","যেমন: নিজের টাকা থেকে ৳৫০ খুচরা দিয়েছি")} />
        </label>

        {lastCount&&<p role="status" className="text-xs text-ink-500">{text('Last saved count:','শেষ গণনা:')} {taka(lastCount.counted)} · {lastCount.note||text('No note','মন্তব্য নেই')}</p>}
        <DialogFooter>
          <Button disabled={!hasCount}
            variant="outline"
            onClick={() => {
              setOpen(false);
              saveCount(counted,note,false);
              toast.success(text('Count saved in preview','নমুনা গণনা সংরক্ষিত'), { description: `${text('Counted','গুনে পাওয়া')} ${taka(counted)}` });
            }}>
            
            {text('Save count','গণনা সংরক্ষণ করুন')}
          </Button>
          <Button disabled={!hasCount||(diff!==0&&!note.trim())} onClick={close}>
            <Lock className="size-4" /> {text('Close session','সেশন বন্ধ করুন')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);

}