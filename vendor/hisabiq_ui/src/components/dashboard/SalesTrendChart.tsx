import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { salesTrend } from '../../data/dashboard';
import { taka, takaCompact } from '../../utils/currency';

type TipProps = {active?: boolean;payload?: {value: number;dataKey: string;}[];label?: string;};

function ChartTip({ active, payload, label }: TipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-pop">
      <p className="mb-1 font-medium text-ink">{label}</p>
      {payload.map((p) =>
      <p key={p.dataKey} className="flex items-center justify-between gap-4 text-ink-500">
          <span className="flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${p.dataKey === 'sales' ? 'bg-teal-600' : 'bg-inverse'}`} />
            {p.dataKey === 'sales' ? 'Sales' : 'Gross profit'}
          </span>
          <span className="font-medium tabular-nums text-ink">{taka(p.value)}</span>
        </p>
      )}
    </div>);

}

export function SalesTrendChart({ height = 220 }: {height?: number;}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={salesTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--helper)' }} interval={1} />
        <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--helper)' }} tickFormatter={takaCompact} width={52} />
        <Tooltip content={<ChartTip />} cursor={{ stroke: 'var(--chart-2)', strokeDasharray: '3 3' }} />
        <Area type="monotone" dataKey="sales" stroke="var(--chart-1)" strokeWidth={2} fill="var(--chart-1)" fillOpacity={0.08} />
        <Line type="monotone" dataKey="profit" stroke="var(--chart-2)" strokeWidth={1.5} dot={false} />
      </AreaChart>
    </ResponsiveContainer>);

}
