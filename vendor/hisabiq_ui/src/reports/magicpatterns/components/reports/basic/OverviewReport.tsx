import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Panel } from '../../Panel';
import { taka, takaCompact } from '../../../utils/currency';
import { pctChange } from '../../../utils/reports/period';
import { salesSeries } from '../../../utils/reports/metrics';
import type { ReportsCore } from '../../../hooks/useReportsData';
import type { Period } from '../../../types/reports';
import { Delta, Kpi, SectionNote, ShareBar, SourceLink, SourceEvidenceContext } from '../ReportBits';
import { useContext } from 'react';
import { addDays } from '../../../utils/reports/period';

type Props = { core: ReportsCore; period: Period; onOpen: (tab: string) => void };

export function OverviewReport({ core, period, onOpen }: Props) {
  const sourceEvidence = useContext(SourceEvidenceContext);
  const { ds, current: c, previous: p, stats, open, payables, tied } = core;
  const series = salesSeries(ds, period.from, period.to);
  const receivable = open.reduce((s, o) => s + o.due, 0);
  const payable = payables.reduce((s, x) => s + x.amount, 0);
  const cash = ds.accounts.reduce((s, a) => s + a.balance, 0);
  const lowStock = stats.filter((s) => s.health === 'Out of stock' || s.health === 'Reorder now' || s.health === 'Reorder soon');
  const overdue = open.filter((o) => o.age > 30);
  const missingCost = stats.filter((s) => s.profile.costSource === 'Missing');
  const topProducts = [...stats].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const expenseCats = new Map<string, number>();
  ds.expenses.filter((e) => e.date >= period.from && e.date <= period.to).forEach((e) => expenseCats.set(e.category, (expenseCats.get(e.category) ?? 0) + e.amount));
  const expenseList = [...expenseCats].sort((a, b) => b[1] - a[1]).slice(0, 5);

  const attention = [
    lowStock.length > 0 && { tone: 'danger', text: `${lowStock.length} products are low or out of stock`, tab: 'stock' },
    overdue.length > 0 && { tone: 'warning', text: `${taka(overdue.reduce((s, o) => s + o.due, 0))} customer dues are older than 30 days`, tab: 'dues' },
    tied.length > 0 && { tone: 'warning', text: `${tied.length} products are selling slowly`, tab: 'stock' },
    missingCost.length > 0 && { tone: 'neutral', text: `${missingCost.length} product has no purchase cost — its profit is not counted`, tab: 'sales' },
  ].filter(Boolean) as { tone: string; text: string; tab: string }[];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Sales"
          bn="বিক্রি"
          value={taka(c.netSales)}
          help="Invoice totals after discounts, minus sales returns in this period."
          footer={<Delta value={pctChange(c.netSales, p.netSales)} />}
          onClick={() => onOpen('sales')}
        />
        <Kpi
          label="Gross profit"
          bn="মোট লাভ"
          value={taka(c.grossProfit)}
          tone={c.grossProfit >= 0 ? 'success' : 'danger'}
          help={
            <>
              Sales minus the purchase cost of the items sold. Only sales with a known purchase cost are counted
              ({Math.round(c.coverage * 100)}% of sales this period).
            </>
          }
          footer={
            c.coverage < 0.999 ? (
              <span className="text-[11px] text-warning">{taka(c.uncostedRevenue)} of sales has no cost</span>
            ) : (
              <span className="text-[11px] text-ink-500">Margin {c.margin?.toFixed(1)}%</span>
            )
          }
        />
        <Kpi
          label="Expenses"
          bn="খরচ"
          value={taka(c.expenses)}
          help="Rent, salary, bills, transport and other operating costs. Product purchases are not expenses."
          footer={<Delta value={pctChange(c.expenses, p.expenses)} goodWhenUp={false} />}
          onClick={() => onOpen('money')}
        />
        <Kpi
          label="Net profit (estimate)"
          bn="নিট লাভ"
          value={c.uncostedRevenue>0?'—':taka(c.netProfit)}
          tone={c.netProfit >= 0 ? 'success' : 'danger'}
          help="Only shown when all historical issue costs are known; otherwise net profit remains unavailable. This is not an audited Profit & Loss statement."
          footer={c.uncostedRevenue>0?<span className="text-[11px] text-warning">Missing historical cost</span>:<Delta value={p.uncostedRevenue>0?null:pctChange(c.netProfit,p.netProfit)} />}
        />
        <Kpi label="Money received" bn="আদায়" value={taka(c.collected)} help="All customer payments received in this period, including old dues." />
        <Kpi label="Customers owe you" bn="পাওনা" value={taka(receivable)} tone="warning" help="Unpaid customer invoices today." onClick={() => onOpen('dues')} />
        <Kpi label="You owe suppliers" bn="দেনা" value={taka(payable)} tone="danger" help="Unpaid purchase bills and vendor balances today." onClick={() => onOpen('dues')} />
        <Kpi label="Cash, bank & bKash" bn="হাতে টাকা" value={taka(cash)} tone="teal" help="Current balance across cash in hand, bank and mobile banking accounts." onClick={() => onOpen('money')} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="Sales and gross profit" subtitle={`${period.label} · ${series.length > 45 ? 'weekly' : 'daily'} totals`}>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} onClick={state=>{const day=(state?.activePayload?.[0]?.payload as {key?:string}|undefined)?.key;if(day)sourceEvidence?.({report:"sales-register",label:"Sales & gross profit · "+day,date:day,toDate:period.days>45?(addDays(day,6)>period.to?period.to:addDays(day,6)):day});}}>
                <CartesianGrid stroke="#E3E8EE" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5A6B80' }} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tick={{ fontSize: 11, fill: '#5A6B80' }} tickLine={false} axisLine={false} tickFormatter={takaCompact} width={52} />
                <Tooltip formatter={(v: number, n: string) => [taka(v), n === 'sales' ? 'Sales' : 'Gross profit']} contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#E3E8EE' }} />
                <Area type="monotone" dataKey="sales" stroke="#0D7C74" fill="#0D7C74" fillOpacity={0.08} strokeWidth={2} />
                <Area type="monotone" dataKey="profit" stroke="#15803D" fill="#15803D" fillOpacity={0.05} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-ink-500">
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-teal-600" />Sales</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-success" />Gross profit</span>
            <span>{c.invoices} bills · average bill {taka(c.avgBill)}</span>
          </div>
        </Panel>

        <Panel title="Needs your attention" subtitle="দৃষ্টি দিন">
          {attention.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-success"><CheckCircle2 className="size-4" />Everything looks fine today.</p>
          ) : (
            <ul className="space-y-1">
              {attention.map((a) => (
                <li key={a.text}>
                  <button type="button" onClick={() => onOpen(a.tab)} className="flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left text-[13px] text-ink-700 hover:bg-ink-50">
                    <AlertTriangle className={`mt-0.5 size-4 shrink-0 ${a.tone === 'danger' ? 'text-danger' : a.tone === 'warning' ? 'text-warning' : 'text-ink-400'}`} />
                    <span className="flex-1">{a.text}</span>
                    <ArrowRight className="mt-0.5 size-3.5 text-ink-400" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Best-selling products" subtitle="By sales value in this period">
          <ul className="space-y-3">
            {topProducts.map((s) => (
              <li key={s.product.id} className="text-[13px]">
                <div className="flex items-baseline justify-between gap-3">
                  <SourceLink report="product-sales" label={s.product.name} field="productId" value={s.product.id}>{s.product.name}</SourceLink>
                  <span className="shrink-0 font-medium tabular-nums">{taka(s.revenue)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <ShareBar value={s.salesShare} />
                  <span className="w-24 shrink-0 text-right text-[11px] text-ink-500">
                    {s.margin === null ? 'Cost missing' : `${s.margin.toFixed(1)}% margin`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Where the money went" subtitle="Expenses by category">
          {expenseList.length === 0 ? (
            <p className="text-sm text-ink-500">No expenses in this period.</p>
          ) : (
            <ul className="space-y-3">
              {expenseList.map(([cat, amount]) => (
                <li key={cat} className="text-[13px]">
                  <div className="flex items-baseline justify-between gap-3">
                    <SourceLink report="expense-categories" label={cat} field="category" value={cat}>{cat}</SourceLink>
                    <span className="font-medium tabular-nums">{taka(amount)}</span>
                  </div>
                  <div className="mt-1"><ShareBar value={amount / Math.max(1, c.expenses)} tone="ink" /></div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <SectionNote>
        Profit uses the purchase cost recorded at the time of each sale. When a cost is missing we leave that sale out of profit instead of guessing.
        Net profit is a management estimate — for tax or audit, use a full Profit &amp; Loss statement from your accountant.
      </SectionNote>
    </div>
  );
}
