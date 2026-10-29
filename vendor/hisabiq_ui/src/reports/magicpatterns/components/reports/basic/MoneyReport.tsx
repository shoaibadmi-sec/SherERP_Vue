import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Download } from 'lucide-react';
import { Panel } from '../../Panel';
import { Button, downloadCsv } from '../../../prototype/Ui';
import { taka } from '../../../utils/currency';
import { inRange, longDate, pctChange } from '../../../utils/reports/period';
import type { ReportsCore } from '../../../hooks/useReportsData';
import type { Period } from '../../../types/reports';
import { Delta, EmptyRow, Kpi, SectionNote, ShareBar, SourceLink, TableShell, Td, Th } from '../ReportBits';

export function MoneyReport({ core, period }: { core: ReportsCore; period: Period }) {
  const { ds, current: c, previous: p } = core;
  const totalCash = ds.accounts.reduce((s, a) => s + a.balance, 0);

  const categories = useMemo(() => {
    const map = new Map<string, { now: number; before: number; count: number }>();
    ds.expenses.forEach((e) => {
      const r = map.get(e.category) ?? { now: 0, before: 0, count: 0 };
      if (inRange(e.date, period.from, period.to)) {
        r.now += e.amount;
        r.count += 1;
      } else if (inRange(e.date, period.prevFrom, period.prevTo)) r.before += e.amount;
      map.set(e.category, r);
    });
    return [...map].map(([category, r]) => ({ category, ...r })).filter((r) => r.now || r.before).sort((a, b) => b.now - a.now);
  }, [ds, period]);

  const recent = ds.expenses.filter((e) => inRange(e.date, period.from, period.to)).slice(-8).reverse();
  const paidOut = ds.purchases.filter((x) => inRange(x.date, period.from, period.to)).reduce((s, x) => s + x.paid, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Money in" bn="টাকা এসেছে" value={taka(c.collected)} tone="success" help="Customer payments received in this period." />
        <Kpi label="Expenses" bn="খরচ" value={taka(c.expenses)} tone="danger" footer={<Delta value={pctChange(c.expenses, p.expenses)} goodWhenUp={false} />} />
        <Kpi label="Paid to suppliers" bn="সরবরাহকারীকে" value={taka(paidOut)} help="Payments made against purchase bills dated in this period." />
        <Kpi label="Balance today" bn="বর্তমান ব্যালেন্স" value={taka(totalCash)} tone="teal" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel
          title="Expenses by category"
          subtitle={`${period.label} compared with the previous ${period.days} days`}
          bodyClassName="p-0"
          actions={<Button kind="outline" onClick={() => downloadCsv('hisabiq-expenses.csv', [['Category', 'Entries', 'This period', 'Previous period'], ...categories.map((r) => [r.category, r.count, r.now, r.before])])}><Download className="size-4" />CSV</Button>}
        >
          <TableShell minWidth={560}>
            <thead className="bg-ink-50/50">
              <tr>
                <Th>Category</Th>
                <Th>Share</Th>
                <Th numeric>Previous</Th>
                <Th numeric>This period</Th>
                <Th numeric>Change</Th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && <EmptyRow cols={5} message="No expenses recorded." />}
              {categories.map((r) => (
                <tr key={r.category} className="border-t border-border hover:bg-ink-50/60">
                  <Td><SourceLink report="expense-categories" label={r.category} field="category" value={r.category}>{r.category}</SourceLink><span className="block text-[11px] text-ink-500">{r.count} entries</span></Td>
                  <Td className="w-32"><ShareBar value={c.expenses ? r.now / c.expenses : 0} tone="ink" /></Td>
                  <Td numeric className="text-ink-500">{taka(r.before)}</Td>
                  <Td numeric>{taka(r.now)}</Td>
                  <Td numeric><Delta value={pctChange(r.now, r.before)} goodWhenUp={false} suffix="" /></Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </Panel>

        <Panel title="Accounts" subtitle="Cash, bank & mobile banking">
          <ul className="divide-y divide-ink-100">
            {ds.accounts.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-[13px]">
                <span><span className="font-medium text-ink">{a.name}</span><span className="block text-[11px] text-ink-500">{a.kind}</span></span>
                <span className="font-semibold tabular-nums">{taka(a.balance)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 grid gap-2">
            <Link to="/app/daybook" className="ref-action ref-button-outline inline-flex items-center justify-between px-3 text-[13px]">Open Daybook <ArrowUpRight className="size-4" /></Link>
            <Link to="/app/reconciliation" className="ref-action ref-button-outline inline-flex items-center justify-between px-3 text-[13px]">Bank reconciliation <ArrowUpRight className="size-4" /></Link>
          </div>
        </Panel>
      </div>

      <Panel title="Latest expenses" subtitle="Newest first" bodyClassName="p-0">
        <TableShell minWidth={620}>
          <thead className="bg-ink-50/50">
            <tr><Th>Date</Th><Th>Category</Th><Th>Paid to</Th><Th>Receipt</Th><Th numeric>Amount</Th></tr>
          </thead>
          <tbody>
            {recent.length === 0 && <EmptyRow cols={5} message="No expenses in this period." />}
            {recent.map((e) => (
              <tr key={e.id} className="border-t border-border">
                <Td className="text-xs text-ink-500">{longDate(e.date)}</Td>
                <Td><SourceLink report="expenses" label={e.category+" · "+e.id} field="id" value={e.id}>{e.category}</SourceLink></Td>
                <Td className="text-ink-600">{e.payee}</Td>
                <Td className={e.hasReceipt ? 'text-ink-500' : 'text-warning'}>{e.hasReceipt ? 'Attached' : 'Missing'}</Td>
                <Td numeric>{taka(e.amount)}</Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>
      <SectionNote>Product purchases are stock, not expenses — they become cost only when the items are sold. Account balances are not reconstructed by this preview.</SectionNote>
    </div>
  );
}
