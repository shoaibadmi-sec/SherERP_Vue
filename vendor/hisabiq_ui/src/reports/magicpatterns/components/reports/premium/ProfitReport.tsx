import { useState, useContext } from 'react';
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, Cell, ReferenceLine } from 'recharts';
import { Panel } from '../../Panel';
import { StatusBadge, type StatusTone } from '../../StatusBadge';
import { Tabs } from '../../../prototype/Ui';
import { taka, takaCompact } from '../../../utils/currency';
import { categoryStats, type ProductStat, type Quadrant } from '../../../utils/reports/metrics';
import type { ReportsCore } from '../../../hooks/useReportsData';
import type { Period } from '../../../types/reports';
import { EmptyRow, SectionNote, SourceEvidenceContext, SourceLink, TableShell, Td, Th } from '../ReportBits';

const quadrantInfo: Record<Quadrant, { tone: StatusTone; color: string; advice: string }> = {
  Star: { tone: 'success', color: '#15803D', advice: 'Never run out. Keep the price firm.' },
  'Volume driver': { tone: 'info', color: '#2563EB', advice: 'Brings customers. Avoid extra discounts; sell add-ons with it.' },
  'Hidden gem': { tone: 'teal', color: '#0D7C74', advice: 'Good margin, low sales. Display it and suggest it at the counter.' },
  Review: { tone: 'warning', color: '#B45309', advice: 'Low sales and low margin. Reprice or buy less.' },
  'No cost': { tone: 'neutral', color: '#8A9BB0', advice: 'Add a purchase cost to measure it.' },
};

type View = 'products' | 'categories' | 'costs';

export function ProfitReport({ core, period }: { core: ReportsCore; period: Period }) {
  const sourceEvidence=useContext(SourceEvidenceContext);
  const [view, setView] = useState<View>('products');
  const c = core.current;
  const stats = core.stats.filter((s) => s.revenue > 0);
  const totalProfit = Math.max(1, stats.reduce((s, r) => s + Math.max(0, r.profit ?? 0), 0));
  const ranked = [...stats].sort((a, b) => (b.profit ?? -Infinity) - (a.profit ?? -Infinity));
  const top3Share = ranked.slice(0, 3).reduce((s, r) => s + Math.max(0, r.profit ?? 0), 0) / totalProfit;
  const cats = categoryStats(core.stats);
  const costChanges = core.stats30.filter((s) => s.profile.previousCost !== null && s.unitCost !== null && s.unitCost !== s.profile.previousCost);

  const bridge = [
    { label: 'Sales before discount', value: c.gross, kind: 'base' },
    { label: 'Discounts given', value: -c.discount, kind: 'minus' },
    { label: 'Returns', value: -c.returns, kind: 'minus' },
    { label: 'Sales without known cost', value: -(c.uncostedRevenue), kind: 'skip' },
    { label: 'Cost of goods sold', value: -c.cogs, kind: 'minus' },
    { label: 'Gross profit', value: c.grossProfit, kind: 'sub' },
    { label: 'Expenses', value: -c.expenses, kind: 'minus' },
    { label: c.uncostedRevenue>0?'Net profit · cost missing':'Net profit (estimate)', value: c.uncostedRevenue>0?0:c.netProfit, kind: 'total' },
  ].filter((b) => b.kind !== 'skip' || b.value !== 0);
  const maxBar = Math.max(...bridge.map((b) => Math.abs(b.value)), 1);

  const scatter = stats.filter((s) => s.margin !== null).map((s) => ({ name: s.product.name, revenue: Math.round(s.revenue), margin: Number((s.margin as number).toFixed(1)), profit: Math.max(1, Math.round(s.profit ?? 0)), quadrant: s.quadrant }));

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Where your sales money goes" subtitle={`${period.label} · from sales to what you keep`}>
          <ul className="space-y-2">
            {bridge.map((b) => (
              <li key={b.label} className={`grid grid-cols-[minmax(0,150px)_minmax(0,1fr)_96px] items-center gap-3 text-[13px] ${b.kind === 'sub' || b.kind === 'total' ? 'border-t border-border pt-2 font-semibold' : ''}`}>
                <span className={b.kind === 'skip' ? 'text-ink-500' : 'text-ink-700'}>{b.label}</span>
                <span className="h-2.5 overflow-hidden rounded-full bg-ink-50">
                  <span
                    className={`block h-full rounded-full ${b.kind === 'base' ? 'bg-ink-300' : b.kind === 'minus' ? 'bg-danger/70' : b.kind === 'skip' ? 'bg-ink-200' : b.value >= 0 ? 'bg-success' : 'bg-danger'}`}
                    style={{ width: `${(Math.abs(b.value) / maxBar) * 100}%` }}
                  />
                </span>
                <span className={`text-right ${b.kind === 'total' || b.kind === 'sub' ? (b.value >= 0 ? 'text-success' : 'text-danger') : b.value < 0 ? 'text-ink-600' : 'text-ink'}`} >{b.kind==='total'&&c.uncostedRevenue>0?'—':taka(b.value)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] text-ink-500">
            {c.uncostedRevenue>0 ? 'Net profit per ৳100 cannot be calculated until all recorded sale-time costs are known.' : <>You keep about <b className="text-ink">৳{c.netSales > 0 ? Math.max(0, (c.netProfit / c.netSales) * 100).toFixed(1) : '0'}</b> from every ৳100 sold.</>}
          </p>
        </Panel>

        <Panel title="Which products earn your profit?" subtitle="Bubble size = gross profit">
          <div className="relative h-[230px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="#E3E8EE" />
                <XAxis type="number" dataKey="revenue" name="Sales" tickFormatter={takaCompact} tick={{ fontSize: 11, fill: '#5A6B80' }} tickLine={false} axisLine={false} />
                <YAxis type="number" dataKey="margin" name="Margin" unit="%" tick={{ fontSize: 11, fill: '#5A6B80' }} tickLine={false} axisLine={false} width={40} />
                <ZAxis type="number" dataKey="profit" range={[40, 600]} />
                <ReferenceLine y={c.margin ?? 0} stroke="#B7C2CF" strokeDasharray="4 4" />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  content={({ payload }) => {
                    const d = payload?.[0]?.payload as (typeof scatter)[number] | undefined;
                    if (!d) return null;
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-pop">
                        <p className="font-semibold text-ink">{d.name}</p>
                        <p className="text-ink-600">Sales {taka(d.revenue)} · Margin {d.margin}%</p>
                        <p className="text-ink-500">{d.quadrant}</p>
                      </div>
                    );
                  }}
                />
                <Scatter data={scatter} onClick={point=>{const d=point as {payload?:{name?:string};name?:string};const match=stats.find(s=>s.product.name===(d.payload?.name??d.name));if(match)sourceEvidence?.({report:'product-profit',label:match.product.name,field:'productId',value:match.product.id});}}>
                  {scatter.map((d) => <Cell key={d.name} fill={quadrantInfo[d.quadrant].color} fillOpacity={0.75} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
            {scatter.length===0&&<p role="status" className="pointer-events-none absolute inset-0 flex items-center justify-center px-5 text-center text-xs text-ink-500">No products with known historical issue costs to plot. Recorded revenue is still shown in the source table below.</p>}
          </div>
          <p className="mt-1 text-[11px] text-ink-500">
            Your top 3 products bring <b className="text-ink">{Math.round(top3Share * 100)}%</b> of gross profit. Dashed line = your average margin.
          </p>
        </Panel>
      </div>

      <Panel title="Profit details" bodyClassName="p-0">
        <Tabs
          label="Profit view"
          value={view}
          onChange={(v) => setView(v as View)}
          items={[
            { id: 'products', label: 'Products', count: stats.length },
            { id: 'categories', label: 'Categories', count: cats.length },
            { id: 'costs', label: 'Cost changes', count: costChanges.length },
          ]}
        />
        {view === 'products' && (
          <TableShell minWidth={860}>
            <thead className="bg-ink-50/50">
              <tr>
                <Th>Product</Th>
                <Th numeric>Sales</Th>
                <Th numeric>Gross profit</Th>
                <Th numeric>Margin</Th>
                <Th numeric help="Share of all gross profit">Profit share</Th>
                <Th numeric help="Discounts given on this product in the period">Discount</Th>
                <Th>Role</Th>
                <Th>Suggested approach</Th>
              </tr>
            </thead>
            <tbody>
              {ranked.length === 0 && <EmptyRow cols={8} message="No sales in this period." />}
              {ranked.map((s: ProductStat) => (
                <tr key={s.product.id} className="border-t border-border hover:bg-ink-50/60">
                  <Td><SourceLink report="product-profit" label={s.product.name} field="productId" value={s.product.id}>{s.product.name}</SourceLink><span className="block text-[11px] text-ink-500">{s.product.category}</span></Td>
                  <Td numeric>{taka(s.revenue)}</Td>
                  <Td numeric className={s.profit === null ? 'text-warning' : 'text-success'}>{s.profit === null ? 'Cost missing' : taka(s.profit)}</Td>
                  <Td numeric>{s.margin === null ? '—' : `${s.margin.toFixed(1)}%`}</Td>
                  <Td numeric>{s.profit === null ? '—' : `${Math.round(s.profitShare * 100)}%`}</Td>
                  <Td numeric className="text-ink-500">{s.discount ? taka(s.discount) : '—'}</Td>
                  <Td><StatusBadge tone={quadrantInfo[s.quadrant].tone} className="h-6 px-2">{s.quadrant}</StatusBadge></Td>
                  <Td className="whitespace-normal text-xs text-ink-600">{quadrantInfo[s.quadrant].advice}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
        {view === 'categories' && (
          <TableShell minWidth={600}>
            <thead className="bg-ink-50/50">
              <tr><Th>Category</Th><Th numeric>Sales</Th><Th numeric>Gross profit</Th><Th numeric>Margin</Th><Th numeric help="Money currently held in this category's stock">Stock value</Th><Th numeric help="Gross profit earned per ৳100 held in stock — higher means stock money works harder">Return on stock</Th></tr>
            </thead>
            <tbody>
              {cats.map((r) => (
                <tr key={r.category} className="border-t border-border hover:bg-ink-50/60">
                  <Td><SourceLink report="category-sales" label={r.category} field="category" value={r.category}>{r.category}</SourceLink></Td>
                  <Td numeric>{taka(r.revenue)}</Td>
                  <Td numeric className="text-success">{taka(r.profit)}{!r.costed && <span className="text-warning">*</span>}</Td>
                  <Td numeric>{r.revenue ? `${((r.profit / r.revenue) * 100).toFixed(1)}%` : '—'}</Td>
                  <Td numeric>{taka(r.stockValue)}</Td>
                  <Td numeric className="font-semibold">{r.stockValue ? `৳${Math.round((r.profit / r.stockValue) * 100 * (30 / period.days))}` : '—'}<span className="font-normal text-ink-500"> /mo</span></Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        )}
        {view === 'costs' && (
          <TableShell minWidth={760}>
            <thead className="bg-ink-50/50">
              <tr><Th>Product</Th><Th numeric>Old cost</Th><Th numeric>New cost</Th><Th numeric>Selling price</Th><Th numeric>Margin now</Th><Th numeric help="Extra cost per month at the current sales pace">Monthly effect</Th></tr>
            </thead>
            <tbody>
              {costChanges.length === 0 && <EmptyRow cols={6} message="No purchase cost changes found." />}
              {costChanges.map((s) => {
                const prev = s.profile.previousCost as number;
                const effect = (s.unitCost as number - prev) * s.avgDaily * 30;
                return (
                  <tr key={s.product.id} className="border-t border-border hover:bg-ink-50/60">
                    <Td><span className="font-medium text-ink">{s.product.name}</span><span className="block text-[11px] text-ink-500">per {s.product.unit}</span></Td>
                    <Td numeric className="text-ink-500">{taka(prev, prev < 10 ? 2 : 0)}</Td>
                    <Td numeric className={s.unitCost! > prev ? 'text-danger' : 'text-success'}>{taka(s.unitCost as number, prev < 10 ? 2 : 0)}</Td>
                    <Td numeric>{taka(s.product.sellPrice, s.product.sellPrice < 10 ? 2 : 0)}</Td>
                    <Td numeric>{(((s.product.sellPrice - (s.unitCost as number)) / s.product.sellPrice) * 100).toFixed(1)}%</Td>
                    <Td numeric className={effect > 0 ? 'text-danger' : 'text-success'}>{effect > 0 ? '−' : '+'}{taka(Math.abs(effect))}</Td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}
      </Panel>
      <SectionNote>Gross profit uses the cost recorded on each purchase lot. Roles compare each product with your own median sales and margin, not an industry benchmark.</SectionNote>
    </div>
  );
}
