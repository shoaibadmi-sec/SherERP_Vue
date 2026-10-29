import { ArrowRight, CheckCircle2 } from 'lucide-react';
import type { AuditImpact } from '../../types/audit';
import { taka } from '../../utils/currency';

function displayValue(value: unknown) {
  if (typeof value === 'number') return taka(value);
  if (Array.isArray(value)) return value.map((item) => typeof item === 'object' && item && 'account' in item ? String((item as { account: string }).account) : String(item)).join(' + ');
  if (value === undefined || value === null || value === '') return '—';
  return String(value);
}

function fieldLabel(field: string) {
  const labels: Record<string, string> = {
    transactionDate: 'Transaction Date',
    party: 'Party / Person',
    amount: 'Amount',
    paid: 'Paid',
    paymentAccounts: 'Payment account',
    description: 'Description',
    quantity: 'Quantity',
    reference: 'Reference',
    note: 'Internal note',
    expenseAccountId: 'Expense category',
    fromAccount: 'From account',
    toAccount: 'To account'
  };
  return labels[field] ?? field;
}

export function ImpactPreview({ preview }: { preview: AuditImpact }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border">
        <div className="border-b border-border px-3 py-2.5">
          <p className="text-[13px] font-semibold text-ink">Review changes</p>
          <p className="font-bn text-[10.5px] text-ink-400">সেভ করার আগে কী বদলাচ্ছে দেখে নিন</p>
        </div>
        <div className="divide-y divide-border">
          {preview.changes.map((change) => (
            <div key={change.field} className="grid gap-1 px-3 py-2.5 text-[12px] sm:grid-cols-[150px_1fr]">
              <span className="font-medium text-ink-500">{fieldLabel(change.field)}</span>
              <span className="flex min-w-0 items-center gap-2 text-ink">
                <span className="truncate text-ink-400 line-through">{displayValue(change.before)}</span>
                <ArrowRight className="size-3.5 shrink-0 text-helper" />
                <span className="truncate font-medium">{displayValue(change.after)}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-teal-100 bg-teal-50/50 p-3">
        <p className="text-[12px] font-semibold text-teal-800">This will update</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {preview.impacts.map((impact) => (
            <span key={impact} className="inline-flex items-center gap-1 rounded-md border border-teal-100 bg-card px-2 py-1 text-[11px] text-teal-800">
              <CheckCircle2 className="size-3" /> {impact}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

