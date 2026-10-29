import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cashflow } from '../../data/dashboard';
import { taka, takaCompact } from '../../utils/currency';

type TipProps = {active?: boolean;payload?: {value: number;dataKey: string;}[];label?: string;};

function ChartTip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  const inflow = payload.find((p) => p.dataKey === 'in')?.value ?? 0;
  const outflow = payload.find((p) => p.dataKey === 'out')?.value ?? 0;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-medium text-ink">{label}</p>
      <p className="flex justify-between gap-4 text-ink-500">Cash in <span className="tabular-nums text-ink">{taka(inflow)}</span></p>
      <p className="flex justify-between gap-4 text-ink-500">Cash out <span className="tabular-nums text-ink">{taka(outflow)}</span></p>
      <p className="mt-1 flex justify-between gap-4 border-t border-border pt-1 font-medium">
        Net <span className={`tabular-nums ${inflow - outflow >= 0 ? 'text-success' : 'text-danger'}`}>{taka(inflow - outflow)}</span>
      </p>
    </div>);

}

export function CashflowChart({ height = 220 }: {height?: number;}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={cashflow} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barGap={3}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--helper)' }} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--helper)' }} tickFormatter={takaCompact} width={52} />
        <Tooltip content={<ChartTip />} cursor={{ fill: 'var(--muted)' }} />
        <Bar dataKey="in" fill="var(--chart-1)" radius={[4, 4, 0, 0]} maxBarSize={16} />
        <Bar dataKey="out" fill="var(--chart-2)" radius={[4, 4, 0, 0]} maxBarSize={16} />
      </BarChart>
    </ResponsiveContainer>);

}
