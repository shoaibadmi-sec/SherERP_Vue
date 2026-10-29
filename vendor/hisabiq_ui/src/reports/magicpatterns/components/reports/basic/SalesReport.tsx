import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Panel } from '../../Panel';
import { Tabs, Button, downloadCsv } from '../../../prototype/Ui';
import { taka } from '../../../utils/currency';
import { inRange } from '../../../utils/reports/period';
import type { ReportsCore } from '../../../hooks/useReportsData';
import type { Period } from '../../../types/reports';
import { EmptyRow, SectionNote, ShareBar, SourceLink, TableShell, Td, Th } from '../ReportBits';

type View = 'product' | 'category' | 'customer' | 'day';
type Row = { key: string; label: string; sub?: string; qty?: string; revenue: number; discount: number; profit: number | null; bills: number };

export function SalesReport({ core, period }: { core: ReportsCore; period: Period }) {
  const [view, setView] = useState<View>('product');
  const { ds } = core;

  const rows = useMemo<Row[]>(() => {
    const lines = ds.lines.filter((l) => inRange(l.date, period.from, period.to));
    const keyOf = (l: (typeof lines)[number]) =>
      view === 'product' ? l.productId ?? l.name : view === 'category' ? l.category : view === 'customer' ? l.customerId : l.date;
    const map = new Map<string, { label: string; sub?: string; qty: number; unit: string; units: Set<string>; revenue: number; discount: number; profit: number; missing: boolean; bills: Set<string> }>();
    for (const l of lines) {
      const k = keyOf(l);
      const label = view === 'product' ? l.name : view === 'category' ? l.category : view === 'customer' ? l.customer : l.date;
      const r = map.get(k) ?? { label, sub: view === 'product' ? l.category : undefined, qty: 0, unit: l.unit, units: new Set<string>(), revenue: 0, discount: 0, profit: 0, missing: false, bills: new Set<string>() };
      r.qty += l.qty;
      r.units.add(l.unit);
      r.revenue += l.revenue;
      r.discount += l.discount;
      if (l.unitCost === null) r.missing = true;
      else r.profit += l.revenue - l.qty * l.unitCost;
      r.bills.add(l.invoice);
      map.set(k, r);
    }
    return [...map]
      .map(([key, r]) => ({
        key,
        label: r.label,
        sub: r.sub,
        qty: view === 'product' && r.units.size === 1 ? `${r.qty.toLocaleString('en-IN')} ${r.unit}` : undefined,
        revenue: r.revenue,
        discount: r.discount,
        profit: r.missing ? null : r.profit,
        bills: r.bills.size,
      }))
      .sort((a, b) => (view === 'day' ? b.key.localeCompare(a.key) : b.revenue - a.revenue));
  }, [ds, period.from, period.to, view]);

  const total = rows.reduce((s, r) => s + r.revenue, 0);
  const totalDiscount = rows.reduce((s, r) => s + r.discount, 0);
  const profitKnown = rows.filter((r) => r.profit !== null).reduce((s, r) => s + (r.profit as number), 0);
  const anyMissing = rows.some((r) => r.profit === null);
  const firstCol = view === 'product' ? 'Product' : view === 'category' ? 'Category' : view === 'customer' ? 'Customer' : 'Date';

  const exportCsv = () =>
    downloadCsv(`hisabiq-sales-by-${view}.csv`, [
      [firstCol, 'Bills', 'Quantity', 'Sales', 'Discount', 'Gross profit', 'Margin %'],
      ...rows.map((r) => [r.label, r.bills, r.qty ?? '', Math.round(r.revenue), Math.round(r.discount), r.profit === null ? 'Cost missing' : Math.round(r.profit), r.profit === null || r.revenue === 0 ? '' : ((r.profit / r.revenue) * 100).toFixed(1)]),
    ]);

  return (
    <div className="space-y-4">
      <Panel
        title="Sales & profit"
        subtitle={`${period.label} · what sold, to whom, and what you earned`}
        bodyClassName="p-0"
        actions={<Button kind="outline" onClick={exportCsv}><Download className="size-4" />CSV</Button>}
      >
        <Tabs
          label="Group sales by"
          value={view}
          onChange={(v) => setView(v as View)}
          items={[
            { id: 'product', label: 'By product' },
            { id: 'category', label: 'By category' },
            { id: 'customer', label: 'By customer' },
            { id: 'day', label: 'By day' },
          ]}
        />
        <TableShell minWidth={720}>
          <thead className="bg-ink-50/50">
            <tr>
              <Th>{firstCol}</Th>
              <Th numeric help="Number of bills that included this">Bills</Th>
              {view === 'product' && <Th numeric>Qty sold</Th>}
              <Th numeric help="After discount">Sales</Th>
              <Th>Share</Th>
              <Th numeric>Discount</Th>
              <Th numeric help="Sales minus purchase cost of the items sold">Gross profit</Th>
              <Th numeric help="Gross profit as % of sales — how much you keep from each ৳100">Margin</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow cols={8} message="No sales in this period." />}
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-border hover:bg-ink-50/60">
                <Td>
                  <SourceLink report={view==='product'?'product-sales':view==='category'?'category-sales':view==='customer'?'customer-sales':'sales-register'} label={r.label} field={view==='product'?'productId':view==='category'?'category':view==='customer'?'party':undefined} value={view==='customer'?r.label:r.key} date={view==='day'?r.key:undefined}>{r.label}</SourceLink>
                  {r.sub && <span className="block text-[11px] text-ink-500">{r.sub}</span>}
                </Td>
                <Td numeric>{r.bills}</Td>
                {view === 'product' && <Td numeric>{r.qty ?? '—'}</Td>}
                <Td numeric>{taka(r.revenue)}</Td>
                <Td className="w-32"><ShareBar value={total ? r.revenue / total : 0} /></Td>
                <Td numeric className="text-ink-500">{r.discount ? taka(r.discount) : '—'}</Td>
                <Td numeric className={r.profit === null ? 'text-warning' : r.profit >= 0 ? 'text-success' : 'text-danger'}>
                  {r.profit === null ? 'Cost missing' : taka(r.profit)}
                </Td>
                <Td numeric>{r.profit === null || r.revenue === 0 ? '—' : `${((r.profit / r.revenue) * 100).toFixed(1)}%`}</Td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-border bg-ink-50 font-semibold">
                <Td>Total</Td>
                <Td numeric>{core.current.invoices}</Td>
                {view === 'product' && <Td numeric>—</Td>}
                <Td numeric>{taka(total)}</Td>
                <Td>{''}</Td>
                <Td numeric>{taka(totalDiscount)}</Td>
                <Td numeric className="text-success">{taka(profitKnown)}{anyMissing ? '*' : ''}</Td>
                <Td numeric>{core.current.margin === null ? '—' : `${core.current.margin.toFixed(1)}%`}</Td>
              </tr>
            </tfoot>
          )}
        </TableShell>
      </Panel>
      {anyMissing && (
        <SectionNote tone="warning">
          * Some sales have no purchase cost (for example items typed directly in a sale or stock entered without cost). Their profit is shown as “Cost missing” and left out
          of the total, so the real gross profit may be higher.
        </SectionNote>
      )}
    </div>
  );
}
