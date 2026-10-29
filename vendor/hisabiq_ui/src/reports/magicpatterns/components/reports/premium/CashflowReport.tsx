import { Area, ComposedChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar } from 'recharts';
import { useContext } from 'react';
import { Panel } from '../../Panel';
import { taka, takaCompact } from '../../../utils/currency';
import { longDate } from '../../../utils/reports/period';
import type { PremiumInsights, PremiumSettings } from '../../../hooks/usePremiumInsights';
import type { ReportsCore } from '../../../hooks/useReportsData';
import { InfoTip, Kpi, SectionNote, SourceEvidenceContext, SourceLink, TableShell, Td, Th } from '../ReportBits';

type Props = { core: ReportsCore; insights: PremiumInsights; settings: PremiumSettings; onSettings: (s: PremiumSettings) => void };

const buffers = [25000, 50000, 75000, 100000];
const lateOptions = [0, 7, 15, 30];

export function CashflowReport({ core, insights, settings, onSettings }: Props) {
  const sourceEvidence=useContext(SourceEvidenceContext);
  const { forecast: f, wc } = insights;
  const chart = f.days.map((d) => ({ label: d.label, date:d.date, balance: d.balance, in: d.inflow, out: -d.outflow }));
  const collectSoon = core.open.filter((o) => o.age > 30).slice(0, 6);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Opening cash (assumed)" bn="শুরুর টাকা (অনুমান)" value={core.ds.accounts.length ? taka(f.start) : "—"} tone="teal" />
        <Kpi label="Expected in 30 days" bn="৩০ দিনে আসবে" value={taka(f.totalIn)} tone="success" help="Cash sales at the recent daily average plus customer dues expected by their usual payment habits." />
        <Kpi label="Expected out" bn="৩০ দিনে যাবে" value={taka(f.totalOut)} tone="danger" help="Supplier bills, rent, salary, bills and regular expenses, plus planned stock purchases." />
        <Kpi
          label="Lowest point"
          bn="সর্বনিম্ন"
          value={taka(f.lowest)}
          tone={f.lowest < 0 ? 'danger' : f.lowest < settings.buffer ? 'warning' : 'success'}
          footer={<span className="text-[11px] text-ink-500">{f.lowest === f.start ? 'Today' : `on ${longDate(f.lowestDate)}`}</span>}
        />
      </div>

      <Panel
        title="Cash forecast — next 30 days"
        subtitle="ক্যাশ পূর্বাভাস · try the scenarios to see what could change"
      >
        <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-ink-600">
          <label className="flex items-center gap-2">
            Keep at least
            <select className="ref-control rounded-lg border border-ink-200 bg-card px-2 text-[13px]" value={settings.buffer} onChange={(e) => onSettings({ ...settings, buffer: Number(e.target.value) })}>
              {buffers.map((b) => <option key={b} value={b}>{taka(b)}</option>)}
            </select>
            <InfoTip text="Your safety level. The forecast warns you when cash may fall below it." />
          </label>
          <label className="flex items-center gap-2">
            If customers pay
            <select className="ref-control rounded-lg border border-ink-200 bg-card px-2 text-[13px]" value={settings.lateDays} onChange={(e) => onSettings({ ...settings, lateDays: Number(e.target.value) })}>
              {lateOptions.map((d) => <option key={d} value={d}>{d === 0 ? 'on their usual time' : `${d} days late`}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" className="size-4 accent-teal-600" checked={settings.includePurchases} onChange={(e) => onSettings({ ...settings, includePurchases: e.target.checked })} />
            Include stock purchases
          </label>
        </div>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} stackOffset="sign" onClick={state=>{const d=(state?.activePayload?.[0]?.payload as {date?:string}|undefined)?.date;if(d)sourceEvidence?.({report:"cash-book",label:"Projected cash · "+d,date:d});}}>
              <CartesianGrid stroke="#E3E8EE" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5A6B80' }} tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis tick={{ fontSize: 11, fill: '#5A6B80' }} tickLine={false} axisLine={false} tickFormatter={takaCompact} width={56} />
              <Tooltip
                formatter={(v: number, n: string) => [taka(Math.abs(v)), n === 'balance' ? 'Balance' : n === 'in' ? 'Money in' : 'Money out']}
                contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: '#E3E8EE' }}
              />
              <Bar dataKey="in" fill="#15803D" fillOpacity={0.35} barSize={6} />
              <Bar dataKey="out" fill="#C0362C" fillOpacity={0.35} barSize={6} />
              <ReferenceLine y={settings.buffer} stroke="#B45309" strokeDasharray="4 4" label={{ value: 'Safe level', fontSize: 10, fill: '#B45309', position: 'insideTopRight' }} />
              <ReferenceLine y={0} stroke="#8A9BB0" />
              <Area type="monotone" dataKey="balance" stroke="#0D7C74" strokeWidth={2} fill="#0D7C74" fillOpacity={0.08} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className={`mt-3 rounded-lg px-3 py-2 text-[13px] ${f.breach ? 'bg-warning-bg text-warning' : 'bg-success-bg text-success'}`}>
          {f.breach
            ? `Cash may fall below your safe level on ${longDate(f.breach)}. Collect overdue dues before then, or move non-urgent purchases later.`
            : `Cash stays above your safe level for the next 30 days. Closing estimate: ${taka(f.end)}.`}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel title="Week by week" bodyClassName="p-0">
          <TableShell minWidth={480}>
            <thead className="bg-ink-50/50">
              <tr><Th>Week</Th><Th numeric>Money in</Th><Th numeric>Money out</Th><Th numeric>Closing</Th></tr>
            </thead>
            <tbody>
              {f.weeks.map((w) => (
                <tr key={w.label} className="border-t border-border">
                  <Td className="text-ink-600">{w.label}</Td>
                  <Td numeric className="text-success">{taka(w.inflow)}</Td>
                  <Td numeric className="text-danger">{taka(w.outflow)}</Td>
                  <Td numeric className={w.closing < settings.buffer ? 'text-warning' : ''}>{taka(w.closing)}</Td>
                </tr>
              ))}
            </tbody>
          </TableShell>
        </Panel>

        <Panel title="Working capital" subtitle="How long your money is out of your hands">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ['Stock days', wc.stockDays, 'Money waits in stock', 'স্টকে'],
              ['Customer days', wc.receivableDays, 'Waiting for customers', 'পাওনায়'],
              ['Supplier days', wc.payableDays, 'Suppliers let you wait', 'দেনায়'],
            ].map(([label, v, help, bn]) => (
              <div key={label as string} className="rounded-lg bg-ink-50 p-3">
                <p className="text-[11px] text-ink-500">{label as string} <span className="font-bn">· {bn as string}</span></p>
                <p className="text-lg font-semibold text-ink">{v === null ? '—' : Math.round(v as number)}</p>
                <p className="text-[11px] text-ink-500">{help as string}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-ink-700">
            Money spent on stock comes back as cash in about <b>{wc.cycle === null ? '—' : `${Math.round(wc.cycle)} days`}</b>
            <InfoTip text="Cash cycle = stock days + customer days − supplier days. Shorter means you need less money to run the business." />
          </p>
          <p className="mt-1 text-xs text-ink-500">
            Stock {taka(wc.stockValue)} + customer dues {taka(wc.receivable)} − supplier dues {taka(wc.payable)} = <b className="text-ink">{taka(wc.net)}</b> of your money is working in the business.
          </p>
          {collectSoon.length > 0 && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="text-xs font-medium text-ink-600">Fastest way to improve cash: collect these overdue bills</p>
              <ul className="mt-1.5 space-y-1 text-[13px]">
                {collectSoon.map((o) => (
                  <li key={o.invoice.id} className="flex justify-between gap-3">
                    <span className="truncate"><SourceLink report="receivables" label={o.invoice.customer} field="id" value={o.invoice.id}>{o.invoice.customer}</SourceLink> <span className="text-[11px] text-ink-500">· {o.invoice.id} · {o.age} days</span></span>
                    <span className="shrink-0 font-medium text-warning">{taka(o.due)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
      </div>
      <SectionNote>
        Illustrative 30-day forecast — no ledger entry is posted. Reconciled starting account balances and recurring-expense schedules are unavailable here, so opening balance is assumed to be zero for the chart only. Recorded recent sales and unpaid bills inform the other estimates; customer payment timing is an illustrative assumption. Large one-off
        payments not yet recorded are not included.
      </SectionNote>
    </div>
  );
}
