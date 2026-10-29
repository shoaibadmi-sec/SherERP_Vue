import { useMemo, useState } from 'react';
import { Download, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Panel } from '../../Panel';
import { StatusBadge } from '../../StatusBadge';
import { Tabs, Button, downloadCsv } from '../../../prototype/Ui';
import { taka } from '../../../utils/currency';
import { longDate } from '../../../utils/reports/period';
import type { ReportsCore } from '../../../hooks/useReportsData';
import type { OpenInvoice } from '../../../utils/reports/metrics';
import { EmptyRow, Kpi, ShareBar, SourceLink, TableShell, Td, Th } from '../ReportBits';

type View = 'customers' | 'suppliers';
const buckets: OpenInvoice['bucket'][] = ['0–15 days', '16–30 days', '31–60 days', '60+ days'];

export function DuesReport({ core }: { core: ReportsCore }) {
  const [view, setView] = useState<View>('customers');
  const { open, payables, customers } = core;
  const receivable = open.reduce((s, o) => s + o.due, 0);
  const payable = payables.reduce((s, p) => s + p.amount, 0);
  const overdueSupplier = payables.reduce((s, p) => s + p.overdue, 0);

  const bucketTotals = buckets.map((b) => ({ b, amount: open.filter((o) => o.bucket === b).reduce((s, o) => s + o.due, 0) }));

  const byCustomer = useMemo(() => {
    const map = new Map<string, { id: string; name: string; phone: string; due: number; bills: number; oldest: number }>();
    for (const o of open) {
      const r = map.get(o.invoice.customerId) ?? { id: o.invoice.customerId, name: o.invoice.customer, phone: o.invoice.phone, due: 0, bills: 0, oldest: 0 };
      r.due += o.due;
      r.bills += 1;
      r.oldest = Math.max(r.oldest, o.age);
      map.set(o.invoice.customerId, r);
    }
    return [...map.values()].sort((a, b) => b.due - a.due);
  }, [open]);

  const exportCsv = () =>
    view === 'customers'
      ? downloadCsv('hisabiq-customer-dues.csv', [['Customer', 'Phone', 'Open bills', 'Oldest (days)', 'Due'], ...byCustomer.map((c) => [c.name, c.phone, c.bills, c.oldest, Math.round(c.due)])])
      : downloadCsv('hisabiq-supplier-dues.csv', [['Supplier', 'Source', 'Oldest due date', 'Overdue', 'Due'], ...payables.map((p) => [p.supplier, p.source, p.oldestDue ?? '', Math.round(p.overdue), Math.round(p.amount)])]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Customers owe you" bn="গ্রাহকের পাওনা" value={taka(receivable)} tone="warning" onClick={() => setView('customers')} />
        <Kpi label="Older than 30 days" bn="৩০ দিনের বেশি" value={taka(bucketTotals[2].amount + bucketTotals[3].amount)} tone="danger" help="These are harder to collect. Call these customers first." />
        <Kpi label="You owe suppliers" bn="সরবরাহকারীর দেনা" value={taka(payable)} tone="danger" onClick={() => setView('suppliers')} />
        <Kpi label="Supplier bills to review" bn="মেয়াদোত্তীর্ণ" value={taka(overdueSupplier)} tone={overdueSupplier ? 'warning' : 'neutral'} help="Bill dates reflect the recorded source; contractual due dates are not reliably available." />
      </div>

      <Panel title="How old are customer dues?" subtitle="Days since the bill date">
        <div className="grid gap-3 sm:grid-cols-4">
          {bucketTotals.map(({ b, amount }, i) => (
            <div key={b} className="min-w-0">
              <div className="flex items-baseline justify-between gap-2 text-[12px]">
                <span className="text-ink-600">{b}</span>
                <span className={`font-semibold ${i >= 2 ? 'text-danger' : 'text-ink'}`}>{taka(amount)}</span>
              </div>
              <div className="mt-1.5"><ShareBar value={receivable ? amount / receivable : 0} tone={i >= 3 ? 'danger' : i === 2 ? 'warning' : 'teal'} /></div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Dues by party" bodyClassName="p-0" actions={<Button kind="outline" onClick={exportCsv}><Download className="size-4" />CSV</Button>}>
        <Tabs
          label="Dues type"
          value={view}
          onChange={(v) => setView(v as View)}
          items={[
            { id: 'customers', label: 'Customers owe you', count: byCustomer.length },
            { id: 'suppliers', label: 'You owe suppliers', count: payables.length },
          ]}
        />
        {view === 'customers' ? (
          <TableShell minWidth={680}>
            <thead className="bg-ink-50/50">
              <tr>
                <Th>Customer</Th>
                <Th numeric>Open bills</Th>
                <Th numeric help="Age of the oldest unpaid bill">Oldest</Th>
                <Th>Usually pays in</Th>
                <Th numeric>Due</Th>
                <Th>{''}</Th>
              </tr>
            </thead>
            <tbody>
              {byCustomer.length === 0 && <EmptyRow cols={6} message="No customer dues. Well done!" />}
              {byCustomer.map((c) => {
                const stat = customers.find((x) => x.id === c.id);
                return (
                  <tr key={c.id} className="border-t border-border hover:bg-ink-50/60">
                    <Td>
                      <SourceLink report="receivables" label={c.name} field="party" value={c.name}>{c.name}</SourceLink>
                      <span className="block text-[11px] text-ink-500">{c.phone}</span>
                    </Td>
                    <Td numeric>{c.bills}</Td>
                    <Td numeric>
                      <StatusBadge tone={c.oldest > 60 ? 'danger' : c.oldest > 30 ? 'warning' : 'neutral'} className="h-6 px-2">{c.oldest} days</StatusBadge>
                    </Td>
                    <Td className="text-ink-600">{stat?.avgPayDays == null ? '—' : `${Math.round(stat.avgPayDays)} days`}</Td>
                    <Td numeric className="text-warning">{taka(c.due)}</Td>
                    <Td>
                      {c.phone?<a href={`tel:${c.phone}`} className="ref-action ref-button-outline inline-flex items-center gap-1.5 px-3 text-[12px]">
                        <Phone className="size-3.5" />Call
                      </a>:<span className="text-[11px] text-ink-500">No phone</span>}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        ) : (
          <TableShell minWidth={640}>
            <thead className="bg-ink-50/50">
              <tr>
                <Th>Supplier</Th>
                <Th>Source</Th>
                <Th>Oldest due date</Th>
                <Th numeric>Overdue</Th>
                <Th numeric>Due</Th>
              </tr>
            </thead>
            <tbody>
              {payables.length === 0 && <EmptyRow cols={5} message="You owe nothing to suppliers." />}
              {payables.map((p) => (
                <tr key={p.supplier} className="border-t border-border hover:bg-ink-50/60">
                  <Td><SourceLink report="payables" label={p.supplier} field="party" value={p.supplier}>{p.supplier}</SourceLink></Td>
                  <Td className="text-ink-600">{p.source === 'Vendor ledger' ? <Link className="text-teal-700 hover:underline" to="/app/vendors">Vendor ledger</Link> : p.source}</Td>
                  <Td className="text-ink-600">{p.oldestDue ? longDate(p.oldestDue) : '—'}</Td>
                  <Td numeric className={p.overdue ? 'text-danger' : 'text-ink-400'}>{p.overdue ? taka(p.overdue) : '—'}</Td>
                  <Td numeric className="text-danger">{taka(p.amount)}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
      </Panel>
    </div>
  );
}
