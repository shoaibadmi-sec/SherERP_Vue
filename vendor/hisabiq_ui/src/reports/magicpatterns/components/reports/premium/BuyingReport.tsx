import { Download, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Panel } from '../../Panel';
import { StatusBadge, type StatusTone } from '../../StatusBadge';
import { Button, downloadCsv } from '../../../prototype/Ui';
import { taka } from '../../../utils/currency';
import { fmtQty, type BuyDecision } from '../../../utils/reports/planning';

import type { PremiumInsights, PremiumSettings } from '../../../hooks/usePremiumInsights';
import type { ReportsCore } from '../../../hooks/useReportsData';
import { EmptyRow, Kpi, SectionNote, SourceLink, TableShell, Td, Th } from '../ReportBits';
import { healthLabel, healthTone } from '../basic/StockReport';

const decisionTone: Record<BuyDecision, StatusTone> = { 'Buy now': 'teal', 'Buy part': 'info', 'Wait — over budget': 'warning', 'Add cost first': 'neutral' };
const budgets = [50000, 100000, 150000, 250000, 400000];

type Props = { core: ReportsCore; insights: PremiumInsights; settings: PremiumSettings; onSettings: (s: PremiumSettings) => void };

export function BuyingReport({ core, insights, settings, onSettings }: Props) {
  const { plan, wc } = insights;
  const tiedTotal = core.tied.reduce((s, t) => s + t.tied, 0);
  const supplierOf = (id: string) => core.ds.suppliers.find((s) => s.id === id)?.name ?? '—';

  const bySupplier = new Map<string, number>();
  plan.rows.filter((r) => r.decision === 'Buy now' || r.decision === 'Buy part').forEach((r) => {
    const n = supplierOf(r.stat.profile.supplierId);
    bySupplier.set(n, (bySupplier.get(n) ?? 0) + (r.amount ?? 0));
  });

  const exportList = () =>
    downloadCsv('hisabiq-buy-list.csv', [
      ['Product', 'Supplier', 'In stock', 'Days left', 'Order qty', 'Unit', 'Estimated cost', 'Decision', 'Reason'],
      ...plan.rows.map((r) => [r.stat.product.name, supplierOf(r.stat.profile.supplierId), r.stat.product.stock, r.stat.cover === null ? '' : Math.floor(r.stat.cover), r.qty, r.stat.product.unit, r.amount === null ? 'Cost missing' : Math.round(r.amount), r.decision, r.reason]),
    ]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Planned purchase" bn="কেনার পরিকল্পনা" value={taka(plan.spend)} tone="teal" help="Cost of everything marked Buy now / Buy part within your budget." />
        <Kpi label="Profit protected" bn="সুরক্ষিত লাভ" value={taka(plan.protectedProfit)} tone="success" help="Gross profit you would likely lose over the next 2 weeks if these items ran out." />
        <Kpi label="Cash stuck in slow stock" bn="আটকে থাকা টাকা" value={taka(tiedTotal)} tone="warning" help="Stock beyond ~45 days of sales. Selling it down frees cash for fast items." />
        <Kpi
          label="Stock turns in"
          bn="স্টক ঘোরে"
          value={wc.stockDays === null ? '—' : `${Math.round(wc.stockDays)} days`}
          help="On average, money spent on stock comes back as sales in this many days. Lower is better."
        />
      </div>

      <Panel
        title="Smart buy list"
        subtitle="What to order, how much, and why · কী কিনবেন"
        bodyClassName="p-0"
        actions={
          <>
            <label className="hidden items-center gap-2 text-xs text-ink-600 sm:flex">
              Budget
              <select
                className="ref-control rounded-lg border border-ink-200 bg-card px-2 text-[13px]"
                value={settings.budget}
                onChange={(e) => onSettings({ ...settings, budget: Number(e.target.value) })}
              >
                {budgets.map((b) => <option key={b} value={b}>{taka(b)}</option>)}
              </select>
            </label>
            <Button kind="outline" onClick={exportList}><Download className="size-4" />CSV</Button>
          </>
        }
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border bg-ink-50/50 px-4 py-2 text-xs text-ink-600">
          <label className="flex items-center gap-2 sm:hidden">
            Budget
            <select className="ref-control rounded-lg border border-ink-200 bg-card px-2 text-[13px]" value={settings.budget} onChange={(e) => onSettings({ ...settings, budget: Number(e.target.value) })}>
              {budgets.map((b) => <option key={b} value={b}>{taka(b)}</option>)}
            </select>
          </label>
          <span>Budget left: <b className="text-ink">{taka(plan.remaining)}</b></span>
          {[...bySupplier].map(([n, v]) => <span key={n}>{n}: <b className="text-ink">{taka(v)}</b></span>)}
          {plan.unprotectedProfit > 0 && <span className="text-warning">Over budget items risk {taka(plan.unprotectedProfit)} profit</span>}
        </div>
        <TableShell minWidth={940}>
          <thead className="bg-ink-50/50">
            <tr>
              <Th>Product</Th>
              <Th>Supplier</Th>
              <Th numeric>In stock</Th>
              <Th numeric help="At the last 30 days' selling speed">Days left</Th>
              <Th numeric help="Days the supplier needs to deliver">Lead time</Th>
              <Th numeric help="Enough for lead time + 7 days + 3 days safety, rounded to the supplier pack">Order</Th>
              <Th numeric>Est. cost</Th>
              <Th>Decision</Th>
              <Th>Why</Th>
            </tr>
          </thead>
          <tbody>
            {plan.rows.length === 0 && <EmptyRow cols={9} message="Nothing needs ordering right now." />}
            {plan.rows.map((r) => (
              <tr key={r.stat.product.id} className="border-t border-border hover:bg-ink-50/60">
                <Td>
                  <SourceLink report="reorder" label={r.stat.product.name} field="productId" value={r.stat.product.id}>{r.stat.product.name}</SourceLink>
                  <span className="mt-0.5 block"><StatusBadge tone={healthTone[r.stat.health]}>{healthLabel[r.stat.health]}</StatusBadge></span>
                </Td>
                <Td className="text-ink-600">{supplierOf(r.stat.profile.supplierId)}</Td>
                <Td numeric>{r.stat.product.stock.toLocaleString('en-IN')}</Td>
                <Td numeric className={r.stat.product.stock <= 0 || (r.stat.cover ?? 0) <= r.stat.profile.leadDays ? 'text-danger' : ''}>{r.stat.product.stock <= 0 ? '0' : Math.floor(r.stat.cover ?? 0)}</Td>
                <Td numeric className="text-ink-500">{r.stat.profile.leadDays} d</Td>
                <Td numeric className="font-semibold">{r.qty.toLocaleString('en-IN')} <span className="font-normal text-ink-500">{r.stat.product.unit}</span></Td>
                <Td numeric>{r.amount === null ? <span className="text-warning">Cost missing</span> : taka(r.amount)}</Td>
                <Td><StatusBadge tone={decisionTone[r.decision]} className="h-6 px-2">{r.decision}</StatusBadge></Td>
                <Td className="max-w-[260px] whitespace-normal text-xs text-ink-600">{r.reason}</Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3">
          <p className="text-xs text-ink-500">Selling speed: {fmtQty(core.stats30.reduce((s, x) => s + x.avgDaily, 0))} units/day across all items · last 30 days</p>
          <Button
            kind="primary"
            disabled={plan.spend === 0}
            onClick={() => toast.info('Preview only — no purchase orders were created.', { description: 'Download the buy list to review these quantities. PO creation and receiving are not connected yet.' })}
          >
            <ShoppingCart className="size-4" />Prepare purchase orders
          </Button>
        </div>
      </Panel>

      <Panel title="Money stuck in slow-moving stock" subtitle="Don’t re-order these yet · ধীরে বিক্রি হওয়া পণ্য" bodyClassName="p-0">
        <TableShell minWidth={760}>
          <thead className="bg-ink-50/50">
            <tr>
              <Th>Product</Th>
              <Th numeric>In stock</Th>
              <Th numeric>Sold in 30 days</Th>
              <Th numeric help="Age of the oldest unsold stock">Oldest stock</Th>
              <Th numeric help="Value of stock beyond 45 days of sales">Cash stuck</Th>
              <Th>What to do</Th>
            </tr>
          </thead>
          <tbody>
            {core.tied.length === 0 && <EmptyRow cols={6} message="No slow-moving stock. Your money is working well." />}
            {core.tied.map((t) => (
              <tr key={t.stat.product.id} className="border-t border-border hover:bg-ink-50/60">
                <Td><span className="font-medium text-ink">{t.stat.product.name}</span><span className="mt-0.5 block"><StatusBadge tone={healthTone[t.stat.health]}>{healthLabel[t.stat.health]}</StatusBadge></span></Td>
                <Td numeric>{t.stat.product.stock.toLocaleString('en-IN')} <span className="font-normal text-ink-500">{t.stat.product.unit}</span></Td>
                <Td numeric>{fmtQty(t.stat.avgDaily * 30)}</Td>
                <Td numeric>{t.stat.profile.stockAgeDays} days</Td>
                <Td numeric className="text-warning">{taka(t.tied)}</Td>
                <Td className="max-w-[320px] whitespace-normal text-xs text-ink-600">{t.action}</Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>
      <SectionNote>
        Order quantities are suggestions based on your recent selling speed and supplier lead times. Seasonal events (Eid, monsoon, construction season) can change demand — adjust before you order.
      </SectionNote>
    </div>
  );
}
