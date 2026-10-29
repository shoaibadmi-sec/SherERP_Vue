import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../Dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../Table';
import { StatusBadge } from '../StatusBadge';
import { daybook } from '../../data/finance';
import { formatNumber, taka } from '../../utils/currency';
import {useUiCopy} from '../../i18n/useUiCopy';

export function DaybookDialog({ open, onOpenChange }: {open: boolean;onOpenChange: (o: boolean) => void;}) {
  const {text,showHelper}=useUiCopy();
  const totalIn = daybook.reduce((s, d) => s + d.in, 0);
  const totalOut = daybook.reduce((s, d) => s + d.out, 0);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {text('Daybook','দৈনিক খাতা')} {showHelper&&<span className="font-bn text-sm font-normal text-ink-500">দৈনিক খাতা</span>}
          </DialogTitle>
          <DialogDescription>{text('Thursday, 1 October 2026 · every entry in order','বৃহস্পতিবার, ১ অক্টোবর ২০২৬ · সব লেনদেন ক্রমানুসারে')}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto rounded-lg border border-border scrollbar-thin">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-9 pl-3 text-xs">{text('Time','সময়')}</TableHead>
                <TableHead className="h-9 text-xs">{text('Type','ধরন')}</TableHead>
                <TableHead className="h-9 text-xs">{text('Particulars','বিবরণ')}</TableHead>
                <TableHead className="h-9 text-right text-xs">{text('Cash in','ক্যাশ জমা')}</TableHead>
                <TableHead className="h-9 pr-3 text-right text-xs">{text('Cash out','ক্যাশ খরচ')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daybook.map((d) =>
              <TableRow key={d.ref} className="text-[13px]">
                  <TableCell className="py-2 pl-3 text-ink-500">{d.time}</TableCell>
                  <TableCell className="py-2">
                    <StatusBadge tone={d.type === 'Sale' ? 'teal' : d.type === 'Expense' ? 'warning' : d.type === 'Receipt' ? 'success' : 'neutral'}>{text(d.type,d.type==='Sale'?'বিক্রি':d.type==='Expense'?'খরচ':d.type==='Receipt'?'টাকা পাওয়া':'ক্যাশ সেশন')}</StatusBadge>
                  </TableCell>
                  <TableCell className="py-2">
                    <span className="font-medium text-ink">{d.ref}</span>
                    <span data-table-helper="" className="block text-xs text-ink-500">{d.particulars}</span>
                  </TableCell>
                  <TableCell className="py-2 text-right ">{d.in ? formatNumber(d.in) : '—'}</TableCell>
                  <TableCell className="py-2 pr-3 text-right ">{d.out ? formatNumber(d.out) : '—'}</TableCell>
                </TableRow>
              )}
              <TableRow className="bg-ink-50 font-semibold hover:bg-ink-50">
                <TableCell colSpan={3} className="py-2 pl-3 text-[13px]">{text('Net cash movement','মোট ক্যাশ আসা-যাওয়া')} · {taka(totalIn - totalOut)}</TableCell>
                <TableCell className="py-2 text-right text-[13px] ">{taka(totalIn)}</TableCell>
                <TableCell className="py-2 pr-3 text-right text-[13px] ">{taka(totalOut)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>);

}
