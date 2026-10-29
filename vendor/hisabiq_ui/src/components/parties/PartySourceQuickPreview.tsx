import { ExternalLink, FileText, ReceiptText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../Dialog';
import { Button } from '../Button';
import { PartyLedgerSourceBadge } from './PartyLedgerIndicators';
import { useUiCopy } from '../../i18n/useUiCopy';
import { partyLedgerSourceLabel } from '../../i18n/partyLedgerCopy';
import { taka } from '../../utils/currency';
import { getSalesPreviewSnapshot } from '../../data/salesPreviewStore';
import { availablePurchases } from '../../data/erpDemoStore';
import { partySourceRoute } from '../../utils/partyActions';
import type { PartyLedgerRow, PartySourceRecord } from '../../types/partyLedger';

type Props = {
  row: PartyLedgerRow | null;
  source: PartySourceRecord | null;
  onClose: () => void;
  onOpenSource?: (row: PartyLedgerRow) => void;
};

export function PartySourceQuickPreview({ row, source, onClose, onOpenSource }: Props) {
  const { text, language } = useUiCopy();
  const sale = row?.source === 'sale'
    ? getSalesPreviewSnapshot().invoices.find(item => item.invoice === row.reference ||
        item.id === row.sourceId || item.id === source?.invoiceId) : undefined;
  const purchase = row?.source === 'purchase'
    ? availablePurchases().find(item => item.ref === row.reference ||
        item.id === row.sourceId || item.id === source?.id) : undefined;
  const title = row?.source === 'sale' ? text('Sales invoice preview','বিক্রির বিল প্রিভিউ')
    : row?.source === 'purchase' ? text('Purchase invoice preview','ক্রয়ের বিল প্রিভিউ')
    : row?.source?.includes('payment') ? text('Payment preview','পেমেন্ট প্রিভিউ')
    : row?.source?.includes('return') || row?.source?.includes('refund') ? text('Return / refund preview','ফেরত লেনদেন প্রিভিউ')
    : row?.source === 'finance' ? text('Finance transaction preview','আর্থিক লেনদেন প্রিভিউ')
    : row?.source === 'opening' ? text('Opening balance preview','শুরুর জের প্রিভিউ')
    : row?.source === 'note' ? text('Note preview','নোট প্রিভিউ')
    : text('Transaction preview','লেনদেন প্রিভিউ');
  const verifiedLink = row ? partySourceRoute(row) : null;
  const openFull = () => { if (row && verifiedLink && onOpenSource) { onClose();onOpenSource(row); } };
  return <Dialog open={Boolean(row)} onOpenChange={open=>{if(!open)onClose();}}>
    <DialogContent aria-label={text('Party transaction details','পার্টির লেনদেনের তথ্য')}
      className="max-h-[88dvh] overflow-y-auto sm:max-w-xl">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><ReceiptText className="size-4 text-teal-700"/>{title}</DialogTitle>
        <DialogDescription>{text('Read-only details from the available source record.','সংরক্ষিত মূল রেকর্ড থেকে পড়ার উপযোগী তথ্য।')}</DialogDescription>
      </DialogHeader>
      {row && <div data-testid="party-source-quick-preview" data-source={row.source} className="space-y-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <PartyLedgerSourceBadge source={row.source} label={partyLedgerSourceLabel(language,row.source)} />
          <strong className="break-all font-semibold text-ink">{row.reference || row.id}</strong>
        </div>
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-ink-50/40 p-3 text-xs sm:grid-cols-3">
          <div><p className="text-ink-500">{text('Date','তারিখ')}</p><strong>{row.date}</strong></div>
          <div><p className="text-ink-500">{text('Debit','ডেবিট')}</p><strong>{taka(row.debit)}</strong></div>
          <div><p className="text-ink-500">{text('Credit','ক্রেডিট')}</p><strong>{taka(row.credit)}</strong></div>
        </div>
        {sale ? <>
          <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3 text-xs">
            <div><p className="text-ink-500">{text('Customer','ক্রেতা')}</p><strong>{sale.party}</strong></div>
            <div><p className="text-ink-500">{text('Status','অবস্থা')}</p><strong>{sale.status}</strong></div>
            <div><p className="text-ink-500">{text('Paid','পরিশোধ')}</p><strong>{taka(sale.paid)}</strong></div>
            <div><p className="text-ink-500">{text('Due','বাকি')}</p><strong>{taka(sale.due)}</strong></div>
          </div>
          <div className="overflow-x-auto rounded-md border border-border">
            <table data-erp-table="" className="w-full text-xs"><thead className="bg-ink-50"><tr>
              <th className="p-2 text-left">{text('Product','পণ্য')}</th><th className="p-2 text-left">{text('Quantity','পরিমাণ')}</th><th className="p-2 text-right">{text('Amount','টাকা')}</th>
            </tr></thead><tbody>{sale.lines.map(line=><tr key={line.id} className="border-t border-border">
              <td className="p-2">{line.name}</td><td className="p-2">{line.quantity}</td><td className="p-2 text-right">{taka(line.total)}</td>
            </tr>)}</tbody></table>
          </div>
          <p className="text-right font-semibold">{text('Invoice total','বিলের মোট')} {taka(sale.total)}</p>
        </> : purchase ? <>
          <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3 text-xs">
            <div><p className="text-ink-500">{text('Supplier','সরবরাহকারী')}</p><strong>{purchase.supplier}</strong></div>
            <div><p className="text-ink-500">{text('Total','মোট')}</p><strong>{taka(purchase.total)}</strong></div>
            <div><p className="text-ink-500">{text('Paid','পরিশোধ')}</p><strong>{taka(purchase.paid)}</strong></div>
            <div><p className="text-ink-500">{text('Due','বাকি')}</p><strong>{taka(Math.max(0,purchase.total-purchase.paid))}</strong></div>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="font-semibold">{text('Purchased items','ক্রয়কৃত পণ্য')}</p>
            {purchase.cartSnapshot?.length ?
              <ul className="mt-1 divide-y divide-border text-xs">{purchase.cartSnapshot.map(item=>
                <li key={item.id} className="flex justify-between gap-3 py-2"><span>{item.product.name} · {item.bigQty} {item.costUnit}</span><span>{item.cost}</span></li>)}</ul>
              : <p className="mt-1 text-xs text-ink-600">{purchase.items}</p>}
          </div>
        </> : <>
          <div className="rounded-md border border-border p-3">
            <p className="mb-1 text-xs font-semibold text-ink-500">{text('Description','বিবরণ')}</p>
            <p className="break-words">{row.description || text('No further details in source','মূল রেকর্ডে বিস্তারিত নেই')}</p>
          </div>
          {source && <div className="grid grid-cols-2 gap-3 rounded-md bg-ink-50 p-3 text-xs">
            {source.method&&<p><span className="text-ink-500">{text('Method','মাধ্যম')}: </span>{source.method}</p>}
            {source.amountPaid!==undefined&&<p><span className="text-ink-500">{text('Paid','পরিশোধ')}: </span>{taka(source.amountPaid)}</p>}
            {source.discount!==undefined&&<p><span className="text-ink-500">{text('Discount','ছাড়')}: </span>{taka(source.discount)}</p>}
            {source.financeType&&<p><span className="text-ink-500">{text('Finance type','অর্থের ধরন')}: </span>{source.financeType}</p>}
          </div>}
        </>}
        {(row.source==='sale'&&!sale || row.source==='purchase'&&!purchase)&&
          <p className="rounded-md bg-ink-50 p-2 text-xs text-ink-500">
            {text('Item-level source data is unavailable in this preview; showing the verified ledger entry only.',
              'এই প্রিভিউতে পণ্যের মূল তালিকা পাওয়া যায়নি; শুধু খাতার তথ্য দেখানো হচ্ছে।')}
          </p>}
        <div className="flex flex-wrap justify-end gap-2 pt-1">
          <Button variant="outline" onClick={onClose}>{text('Close','বন্ধ করুন')}</Button>
          {verifiedLink && onOpenSource && <Button onClick={openFull}><FileText className="size-4"/>
            {text('Open full invoice','সম্পূর্ণ বিল খুলুন')} <ExternalLink className="size-3.5"/>
          </Button>}
        </div>
      </div>}
    </DialogContent>
  </Dialog>;
}
