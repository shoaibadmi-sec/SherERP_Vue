import { useState } from 'react';
import { Phone } from 'lucide-react';
import { Panel } from '../../Panel';
import { StatusBadge, type StatusTone } from '../../StatusBadge';
import { Tabs } from '../../../prototype/Ui';
import { taka } from '../../../utils/currency';
import type { CreditRisk, CustomerStatus } from '../../../utils/reports/metrics';
import type { ReportsCore } from '../../../hooks/useReportsData';
import type { Period } from '../../../types/reports';
import { EmptyRow, Kpi, SectionNote, SourceLink, TableShell, Td, Th } from '../ReportBits';

const statusTone: Record<CustomerStatus, StatusTone> = { Loyal: 'success', Regular: 'teal', New: 'info', 'At risk': 'warning', Lost: 'danger' };
const riskTone: Record<CreditRisk, StatusTone> = { Low: 'success', Medium: 'warning', High: 'danger' };
const nextStep: Record<CustomerStatus, string> = {
  Loyal: 'Thank them; offer priority delivery.',
  Regular: 'Share new arrivals and bulk prices.',
  New: 'Follow up after the first order.',
  'At risk': 'Call — ask why they stopped buying.',
  Lost: 'Try one win-back offer.',
};

type Filter = 'all' | 'risk' | 'credit';

export function CustomersReport({ core, period }: { core: ReportsCore; period: Period }) {
  const [filter, setFilter] = useState<Filter>('all');
  const all = core.customers.filter((c) => c.id !== 'c-walk');
  const walkIn = core.customers.find((c) => c.id === 'c-walk');
  const atRisk = all.filter((c) => c.status === 'At risk' || c.status === 'Lost');
  const highRisk = all.filter((c) => c.risk !== 'Low' && c.outstanding > 0);
  const rows = filter === 'risk' ? atRisk : filter === 'credit' ? highRisk : all;
  const totalRev = core.customers.reduce((s, c) => s + c.revenue, 0) || 1;
  const top3 = [...all].sort((a, b) => b.revenue - a.revenue).slice(0, 3).reduce((s, c) => s + c.revenue, 0) / totalRev;
  const atRiskValue = atRisk.reduce((s, c) => s + c.monthlyValue, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Top 3 customers" bn="শীর্ষ ৩ গ্রাহক" value={`${Math.round(top3 * 100)}%`} tone={top3 > 0.5 ? 'warning' : 'neutral'} help="Share of your sales from your three biggest account customers. Above 50% means you depend heavily on a few buyers." />
        <Kpi label="Walk-in sales" bn="নগদ ক্রেতা" value={taka(walkIn?.revenue ?? 0)} help="Counter sales without a customer account in this period." />
        <Kpi label="Sales at risk / month" bn="ঝুঁকিতে বিক্রি" value={taka(atRiskValue)} tone={atRiskValue ? 'warning' : 'neutral'} help="Monthly sales from customers who stopped buying." onClick={() => setFilter('risk')} />
        <Kpi label="Risky credit" bn="ঝুঁকির বাকি" value={taka(highRisk.reduce((s, c) => s + c.outstanding, 0))} tone="danger" help="Dues from customers who pay slowly or have very old bills." onClick={() => setFilter('credit')} />
      </div>

      <Panel title="Customer insights" subtitle={`${period.label} · who to keep close, who to call, who to limit`} bodyClassName="p-0">
        <Tabs
          label="Customer filter"
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          items={[
            { id: 'all', label: 'All customers', count: all.length },
            { id: 'risk', label: 'Stopped buying', count: atRisk.length },
            { id: 'credit', label: 'Credit risk', count: highRisk.length },
          ]}
        />
        <TableShell minWidth={980}>
          <thead className="bg-ink-50/50">
            <tr>
              <Th>Customer</Th>
              <Th numeric>Sales</Th>
              <Th numeric>Gross profit</Th>
              <Th numeric help="Average sales per month over the last 90 days">Monthly value</Th>
              <Th numeric help="Days since last purchase · usual gap between purchases">Last bought</Th>
              <Th>Status</Th>
              <Th numeric>Owes</Th>
              <Th numeric help="Average days taken to fully pay a bill">Pays in</Th>
              <Th>Credit risk</Th>
              <Th>Next step</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <EmptyRow cols={10} message="No customers in this group." />}
            {rows.map((c) => (
              <tr key={c.id} className="border-t border-border hover:bg-ink-50/60">
                <Td>
                  <SourceLink report="customer-sales" label={c.name} field="party" value={c.name}>{c.name}</SourceLink>
                  {c.phone?<a href={`tel:${c.phone}`} className="flex items-center gap-1 text-[11px] text-teal-700 hover:underline"><Phone className="size-3" />{c.phone}</a>:<span className="block text-[11px] text-ink-500">Phone not recorded</span>}
                </Td>
                <Td numeric>{taka(c.revenue)}</Td>
                <Td numeric className={c.profit === null ? 'text-warning' : 'text-success'}>{c.profit === null ? 'Cost missing' : taka(c.profit)}</Td>
                <Td numeric>{taka(c.monthlyValue)}</Td>
                <Td numeric>
                  {c.lastBuyDays ?? '—'} d
                  <span className="block text-[11px] font-normal text-ink-500">usually every {c.usualGap === null ? '—' : Math.max(1, Math.round(c.usualGap))} d</span>
                </Td>
                <Td><StatusBadge tone={statusTone[c.status]} className="h-6 px-2">{c.status}</StatusBadge></Td>
                <Td numeric className={c.outstanding ? 'text-warning' : 'text-ink-400'}>{c.outstanding ? taka(c.outstanding) : '—'}</Td>
                <Td numeric>{c.avgPayDays === null ? '—' : `${Math.round(c.avgPayDays)} d`}</Td>
                <Td><StatusBadge tone={riskTone[c.risk]} className="h-6 px-2">{c.risk}</StatusBadge></Td>
                <Td className="max-w-[220px] whitespace-normal text-xs text-ink-600">{c.risk === 'High' && c.outstanding > 0 ? 'Take part payment before the next credit sale.' : nextStep[c.status]}</Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      </Panel>
      <SectionNote>Status and credit risk are calculated from each customer’s own buying and payment history. They are prompts to talk to the customer, not judgements.</SectionNote>
    </div>
  );
}
