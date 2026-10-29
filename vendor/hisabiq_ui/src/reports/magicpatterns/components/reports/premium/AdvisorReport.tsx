import { useMemo, useState, useContext } from 'react';
import { ArrowRight, Check, CheckCircle2, RotateCcw, X } from 'lucide-react';
import { toast } from 'sonner';
import { Panel } from '../../Panel';
import { StatusBadge, type StatusTone } from '../../StatusBadge';
import { Tabs, Button } from '../../../prototype/Ui';
import { taka } from '../../../utils/currency';
import type { AdvisorArea, Recommendation, ReportsTab } from '../../../utils/reports/advisor';
import type { PremiumInsights } from '../../../hooks/usePremiumInsights';
import type { ReportsCore } from '../../../hooks/useReportsData';
import { InfoTip, SectionNote, SourceEvidenceContext } from '../ReportBits';
import { advisorEvidenceRequest } from '../../../advisorEvidence';

type Props = { core: ReportsCore; insights: PremiumInsights; onOpen: (tab: ReportsTab) => void; scopeKey:string };

const statusTone: Record<'Good' | 'Watch' | 'Act', StatusTone> = { Good: 'success', Watch: 'warning', Act: 'danger' };
const statusBn: Record<'Good' | 'Watch' | 'Act', string> = { Good: 'ভালো', Watch: 'নজর রাখুন', Act: 'ব্যবস্থা নিন' };
const priorityTone: Record<Recommendation['priority'], StatusTone> = { High: 'danger', Medium: 'warning', Low: 'neutral' };
const areas: ('All' | AdvisorArea)[] = ['All', 'Stock', 'Profit', 'Cash', 'Dues', 'Customers', 'Expenses', 'Data'];
const STORE_KEY = 'hisabiq-reports-advisor-v1';

type Saved = Record<string, 'done' | 'dismissed'>;
const readSaved = (storageKey:string): Saved => {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '{}') as Saved;
  } catch {
    return {};
  }
};

export function AdvisorReport({ core, insights, onOpen, scopeKey }: Props) {
  const storageKey=STORE_KEY+':'+scopeKey;
  const sourceVersion=(r:Recommendation)=>r.id+':'+r.title+':'+r.what+':'+r.impact;
  const { recommendations, health } = insights;
  const sourceEvidence=useContext(SourceEvidenceContext);
  const [area, setArea] = useState<'All' | AdvisorArea>('All');
  const [saved, setSaved] = useState<Saved>(()=>readSaved(storageKey));
  const [showHandled, setShowHandled] = useState(false);

  const persist = (next: Saved) => {
    setSaved(next);
    try {
      localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  };

  const active = recommendations.filter((r) => !saved[sourceVersion(r)]);
  const handled = recommendations.filter((r) => saved[sourceVersion(r)]);
  const list = (showHandled ? handled : active).filter((r) => area === 'All' || r.area === area);
  const profitGain = active.filter((r) => r.impactKind === 'profit').reduce((s, r) => s + r.impact, 0);
  const cashGain = active.filter((r) => r.impactKind === 'cash').reduce((s, r) => s + r.impact, 0);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    active.forEach((r) => m.set(r.area, (m.get(r.area) ?? 0) + 1));
    return m;
  }, [active]);

  const mark = (r: Recommendation, kind: 'done' | 'dismissed') => {
    persist({ ...saved, [sourceVersion(r)]: kind });
    toast.success(kind === 'done' ? 'Marked as reviewed' : 'Hidden from your list', { description: r.title+' · No transaction is posted.' });
  };

  return (
    <div className="space-y-4">
      <section className="grid gap-3 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,2fr)]">
        <div className="rounded-xl border border-border bg-ink p-4 text-white shadow-card sm:p-5">
          <p className="text-xs text-ink-300">Last 30 days, in one line <span className="font-bn">· এক নজরে</span></p>
          <p className="mt-2 text-[15px] leading-relaxed">
            You sold <b>{taka(core.last30.netSales)}</b>. {core.last30.uncostedRevenue>0 ? <span>Net profit is unavailable because historical costs are missing.</span> : <span>Estimated profit after expenses: <b className="text-mint">{taka(core.last30.netProfit)}</b>.</span>}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
            <div>
              <p className="text-[11px] text-ink-300">Possible extra profit / month</p>
              <p className="text-xl font-semibold text-mint">{taka(profitGain)}</p>
            </div>
            <div>
              <p className="text-[11px] text-ink-300">Cash you could free up</p>
              <p className="text-xl font-semibold tabular-nums">{taka(cashGain)}</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-ink-300">If you act on the {active.length} suggestions below. Estimates use your last 30 days of sales.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {health.map((h) => (
            <button
              key={h.id}
              type="button"
              onClick={() => onOpen(h.tab)}
              className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-3 text-left shadow-card transition-colors hover:border-teal-200 sm:p-4"
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-xs text-ink-600">{h.label} <span className="font-bn text-[11px] text-ink-400">{h.labelBn}</span></span>
                <StatusBadge tone={statusTone[h.status]} dot>{h.status}</StatusBadge>
              </span>
              <span className="mt-2 text-[13px] leading-snug text-ink">{h.verdict}</span>
              <span className="mt-auto pt-2 font-bn text-[11px] text-ink-400">{statusBn[h.status]}</span>
            </button>
          ))}
        </div>
      </section>

      <Panel
        title={showHandled ? 'Handled suggestions' : 'What to do next'}
        subtitle={showHandled ? 'Done or hidden — restore any time' : 'Sorted by urgency and money impact · পরবর্তী করণীয়'}
        bodyClassName="p-0"
        actions={
          <Button kind="ghost" onClick={() => setShowHandled((s) => !s)}>
            {showHandled ? 'Back to open' : `Handled (${handled.length})`}
          </Button>
        }
      >
        <Tabs
          label="Filter suggestions by area"
          value={area}
          onChange={(v) => setArea(v as 'All' | AdvisorArea)}
          items={areas.map((a) => ({ id: a, label: a, count: a === 'All' ? active.length : counts.get(a) ?? 0 }))}
        />
        {list.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <CheckCircle2 className="size-7 text-success" />
            <p className="text-sm font-medium text-ink">{showHandled ? 'Nothing handled yet' : 'No open suggestions here'}</p>
            <p className="text-xs text-ink-500">We re-check your numbers every time data changes.</p>
          </div>
        ) : (
          <ul className="divide-y divide-ink-100">
            {list.map((r) => (
              <li key={r.id} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge tone={priorityTone[r.priority]}>{r.priority} priority</StatusBadge>
                      <StatusBadge tone="neutral">{r.area}</StatusBadge>
                      <span className="inline-flex items-center text-[11px] text-ink-500">
                        Confidence: {r.confidence}
                        <InfoTip text={r.confidence === 'High' ? 'Based on recorded transactions with complete data.' : r.confidence === 'Medium' ? 'Based on recent averages — real results can vary.' : 'An early signal from buying patterns. Check before acting.'} />
                      </span>
                    </div>
                    <h3 className="mt-1.5 text-[15px] font-semibold text-ink">{r.title}</h3>
                  </div>
                  {r.impact > 0 && (
                    <div className="text-right">
                      <p className={`text-base font-semibold ${r.impactKind === 'profit' ? 'text-success' : r.impactKind === 'cash' ? 'text-teal-700' : 'text-warning'}`}>{taka(r.impact)}</p>
                      <p className="text-[11px] text-ink-500">{r.impactKind === 'profit' ? 'profit impact' : r.impactKind === 'cash' ? 'cash impact' : 'at risk'}</p>
                    </div>
                  )}
                </div>
                <dl className="mt-3 grid gap-x-4 gap-y-2 text-[13px] sm:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['What happened', 'কী হয়েছে', r.what],
                    ['Why it matters', 'কেন জরুরি', r.why],
                    ['What to do', 'কী করবেন', r.action],
                    ['How it helps', 'লাভ কী', r.benefit],
                  ].map(([k, bn, v], i) => (
                    <div key={k} className={`rounded-lg p-2.5 ${i === 2 ? 'bg-teal-50' : 'bg-ink-50'}`}>
                      <dt className={`text-[11px] font-medium ${i === 2 ? 'text-teal-800' : 'text-ink-500'}`}>{k} <span className="font-bn font-normal">· {bn}</span></dt>
                      <dd className={`mt-0.5 leading-snug ${i === 2 ? 'font-medium text-teal-900' : 'text-ink-700'}`}>{v}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  {saved[r.id] ? (
                    <Button kind="outline" onClick={() => { const n = { ...saved }; delete n[sourceVersion(r)]; persist(n); }}><RotateCcw className="size-4" />Restore</Button>
                  ) : (
                    <>
                      <Button kind="outline" onClick={() => sourceEvidence?.(advisorEvidenceRequest(r))}>See details <ArrowRight className="size-4" /></Button>
                      <Button kind="outline" onClick={() => mark(r, 'done')}><Check className="size-4" />Mark done</Button>
                      <Button kind="ghost" onClick={() => mark(r, 'dismissed')}><X className="size-4" />Not now</Button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <SectionNote>
        Suggestions are calculated from your recorded sales, purchases, expenses and dues. They are decision support, not guarantees — always use your own judgement about
        customers and suppliers.
      </SectionNote>
    </div>
  );
}
