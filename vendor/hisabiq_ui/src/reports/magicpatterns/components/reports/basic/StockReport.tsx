import { useState } from 'react';
import { Download } from 'lucide-react';
import { Panel } from '../../Panel';
import { StatusBadge, type StatusTone } from '../../StatusBadge';
import { Tabs, Button, downloadCsv } from '../../../prototype/Ui';
import { taka } from '../../../utils/currency';
import { fmtQty } from '../../../utils/reports/planning';
import type { ReportsCore } from '../../../hooks/useReportsData';
import type { StockHealth } from '../../../utils/reports/metrics';
import { EmptyRow, Kpi, SectionNote, SourceLink, TableShell, Td, Th } from '../ReportBits';

type Filter = 'all' | 'low' | 'slow';

export const healthTone: Record<StockHealth, StatusTone> = {
  'Out of stock': 'danger',
  'Reorder now': 'danger',
  'Reorder soon': 'warning',
  Healthy: 'success',
  Overstock: 'info',
  'Dead stock': 'neutral',
};

export const healthLabel: Record<StockHealth, string> = {
  'Out of stock': 'Out of stock',
  'Reorder now': 'Low — order now',
  'Reorder soon': 'Getting low',
  Healthy: 'OK',
  Overstock: 'Too much stock',
  'Dead stock': 'Not selling',
};

export function StockReport({ core }: { core: ReportsCore }) {
  const [filter, setFilter] = useState<Filter>('all');
  const stats = core.stats30;
  const low = stats.filter((s) => ['Out of stock', 'Reorder now', 'Reorder soon'].includes(s.health));
  const slow = stats.filter((s) => s.health === 'Dead stock' || s.health === 'Overstock');
  const rows = (filter === 'low' ? low : filter === 'slow' ? slow : stats).slice().sort((a, b) => (a.cover ?? 0) - (b.cover ?? 0));
  const value = stats.reduce((s, r) => s + (r.stockValue ?? 0), 0);
  const slowValue = core.tied.reduce((s, t) => s + t.tied, 0);
  const missing = stats.filter((s) => s.stockValue === null);

  const exportCsv = () =>
    downloadCsv('hisabiq-stock-position.csv', [
      ['Product', 'Category', 'In stock', 'Unit', 'Sold per day', 'Days left', 'Cost value', 'Status'],
      ...rows.map((s) => [s.product.name, s.product.category, s.product.stock, s.product.unit, s.avgDaily.toFixed(2), s.cover === null ? '' : Math.floor(s.cover), s.stockValue === null ? 'Cost missing' : Math.round(s.stockValue), healthLabel[s.health]]),
    ]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Stock value" bn="স্টকের মূল্য" value={taka(value)} tone="teal" help="Valued from reconciled available stock lots only. Unknown costs remain unavailable." />
        <Kpi label="Low or out of stock" bn="কম স্টক" value={String(low.length)} tone={low.length ? 'danger' : 'success'} help="Products that may run out before the supplier can deliver." onClick={() => setFilter('low')} />
        <Kpi label="Slow-moving stock" bn="ধীরে বিক্রি" value={taka(slowValue)} tone={slowValue ? 'warning' : 'neutral'} help="Value of stock beyond what you need for about 45 days of sales." onClick={() => setFilter('slow')} />
        <Kpi label="Products tracked" bn="পণ্য" value={String(stats.length)} help="Active stock products in this report." />
      </div>
      <Panel
        title="Stock position"
        subtitle="Based on the last 30 days of sales"
        bodyClassName="p-0"
        actions={<Button kind="outline" onClick={exportCsv}><Download className="size-4" />CSV</Button>}
      >
        <Tabs
          label="Filter stock"
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          items={[
            { id: 'all', label: 'All products', count: stats.length },
            { id: 'low', label: 'Low stock', count: low.length },
            { id: 'slow', label: 'Slow-moving', count: slow.length },
          ]}
        />
        <TableShell minWidth={760}>
          <thead className="bg-ink-50/50">
            <tr>
              <Th>Product</Th>
              <Th numeric>In stock</Th>
              <Th numeric help="Average units sold per day over the last 30 days">Sold / day</Th>
              <Th numeric help="How many days current stock will last at the current selling speed">Days left</Th>
              <Th numeric help="Units × latest purchase cost">Cost value</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow cols={6} message="No products match this filter." />}
            {rows.map((s) => (
              <tr key={s.product.id} className="border-t border-border hover:bg-ink-50/60">
                <Td>
                  <SourceLink report="stock" label={s.product.name} field="productId" value={s.product.id}>{s.product.name}</SourceLink>
                  <span className="block text-[11px] text-ink-500">{s.product.category}</span>
                </Td>
                <Td numeric>{s.product.stock.toLocaleString('en-IN')} <span className="font-normal text-ink-500">{s.product.unit}</span></Td>
                <Td numeric>{fmtQty(s.avgDaily)}</Td>
                <Td numeric className={s.cover !== null && s.cover <= s.profile.leadDays + 1 ? 'text-danger' : ''}>
                  {s.product.stock <= 0 ? '0' : s.cover === null ? '—' : s.cover > 365 ? '365+' : Math.floor(s.cover)}
                </Td>
                <Td numeric className={s.stockValue === null ? 'text-warning' : ''}>{s.stockValue === null ? 'Cost missing' : taka(s.stockValue)}</Td>
                <Td><StatusBadge tone={healthTone[s.health]} className="h-6 px-2">{healthLabel[s.health]}</StatusBadge></Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>
      {missing.length > 0 && (
        <SectionNote tone="warning">
          {missing.map((m) => m.product.name).join(', ')} {missing.length === 1 ? 'has' : 'have'} no purchase cost, so {missing.length === 1 ? 'it is' : 'they are'} not counted in stock value.
        </SectionNote>
      )}
    </div>
  );
}
