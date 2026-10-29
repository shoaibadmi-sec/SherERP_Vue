import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Check, LayoutGrid, SlidersHorizontal } from 'lucide-react';
import { Button } from '../components/Button';
import { PageHeader } from '../components/PageHeader';
import { Panel } from '../components/Panel';
import { MetricCard } from '../components/dashboard/MetricCard';
import { WidgetFrame } from '../components/dashboard/WidgetFrame';
import { SalesTrendChart } from '../components/dashboard/SalesTrendChart';
import { CashflowChart } from '../components/dashboard/CashflowChart';
import { RecentSalesTable } from '../components/dashboard/RecentSalesTable';
import { DuesList } from '../components/dashboard/DuesList';
import { CustomizeDialog } from '../components/dashboard/CustomizeDialog';
import { useDashboardLayout } from '../hooks/useDashboardLayout';
import {useTenantSettings} from '../settings/TenantSettingsProvider';
import {useUiCopy} from '../i18n/useUiCopy';
import type { DashboardWidget } from '../types/erp';

const panelSpan: Record<string, string> = {
  'sales-trend': 'xl:col-span-2',
  cashflow: '',
  'recent-sales': 'xl:col-span-2',
  dues: ''
};

function Legend({ items }: {items: {label: string;className: string;}[];}) {
  return (
    <div className="flex items-center gap-3 text-[11px] text-ink-500">
      {items.map((i) =>
      <span key={i.label} className="flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${i.className}`} /> {i.label}
        </span>
      )}
    </div>);

}

function PanelContent({ widget }: {widget: DashboardWidget;}) {
  switch (widget.id) {
    case 'sales-trend':
      return (
        <Panel
          title="Sales trend"
          subtitle="Last 14 days · বিক্রির ধারা"
          actions={<Legend items={[{ label: 'Sales', className: 'bg-teal-600' }, { label: 'Gross profit', className: 'bg-inverse' }]} />}
          className="h-full">
          
          <SalesTrendChart />
        </Panel>);

    case 'cashflow':
      return (
        <Panel
          title="Cashflow"
          subtitle="Cash in vs out · নগদ প্রবাহ"
          actions={<Legend items={[{ label: 'In', className: 'bg-teal-600' }, { label: 'Out', className: 'bg-ink-300' }]} />}
          className="h-full">
          
          <CashflowChart />
        </Panel>);

    case 'recent-sales':
      return (
        <Panel
          title="Recent sales"
          subtitle="Today and yesterday"
          actions={<div className="flex items-center gap-3"><Link to="/app/sales" className="text-xs font-medium text-teal-700 hover:underline">Manage sales</Link><Link to="/app/pos" className="text-xs font-medium text-ink-500 hover:underline">New sale</Link></div>}
          className="h-full"
          bodyClassName="">
          
          <RecentSalesTable />
        </Panel>);

    case 'dues':
      return (
        <Panel
          title="Dues to collect"
          subtitle="Oldest first · বকেয়া আদায়"
          actions={<Link to="/app/parties" className="text-xs font-medium text-teal-700 hover:underline">All parties</Link>}
          className="h-full"
          bodyClassName="py-1">
          
          <DuesList />
        </Panel>);

    default:
      return null;
  }
}

export function Dashboard() {
  const {state,actorId}=useTenantSettings();
  const {text}=useUiCopy();
  const actor=state.sections.team.employees.find(employee=>employee.id===actorId&&employee.active);
  const business=state.sections.business.name.trim()||text('Your business','আপনার ব্যবসা');
  const now=new Date();
  const englishDate=new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now);
  const banglaDate=new Intl.DateTimeFormat('bn-BD',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(now);
  const { metrics, panels, setGroup, toggle, move, reset } = useDashboardLayout();
  const [editing, setEditing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const visibleMetrics = metrics.filter((m) => m.visible);
  const visiblePanels = panels.filter((p) => p.visible);

  return (
    <div className="mx-auto max-w-[1440px] space-y-4">
      <PageHeader
        title={actor? `Welcome, ${actor.name}` : 'Dashboard'}
        titleBn={actor? `স্বাগতম, ${actor.name}` : 'ড্যাশবোর্ড'}
        description={englishDate+' · '+business+' · '+text('Sample figures','নমুনার হিসাব')}
        descriptionBn={banglaDate+' · '+business+' · নমুনার হিসাব'}
        actions={
        editing ?
        <>
              <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
                <LayoutGrid className="size-4" /> All widgets
              </Button>
              <Button size="sm" onClick={() => setEditing(false)}>
                <Check className="size-4" /> Done
              </Button>
            </> :

        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <SlidersHorizontal className="size-4" /> Customize
            </Button>

        } />
      

      {editing &&
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-[13px] text-teal-800">
          <span>Use the arrows to rearrange cards, or hide what you don’t need. Changes save automatically.</span>
          {metrics.length + panels.length - visibleMetrics.length - visiblePanels.length > 0 &&
        <button onClick={() => setDialogOpen(true)} className="font-medium underline-offset-2 hover:underline">
              Show hidden ({metrics.length + panels.length - visibleMetrics.length - visiblePanels.length})
            </button>
        }
        </div>
      }

      {visibleMetrics.length > 0 &&
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <AnimatePresence initial={false}>
            {visibleMetrics.map((w) =>
          <WidgetFrame key={w.id} editing={editing} label={w.label} onHide={() => toggle(w.id)} onMove={(d) => move(w.id, d)}>
                <MetricCard widget={w} />
              </WidgetFrame>
          )}
          </AnimatePresence>
        </div>
      }

      {visiblePanels.length > 0 &&
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {visiblePanels.map((w) =>
        <WidgetFrame
          key={w.id}
          editing={editing}
          label={w.label}
          onHide={() => toggle(w.id)}
          onMove={(d) => move(w.id, d)}
          className={panelSpan[w.id]}>
          
              <PanelContent widget={w} />
            </WidgetFrame>
        )}
        </div>
      }

      {visibleMetrics.length === 0 && visiblePanels.length === 0 &&
      <div className="rounded-xl border border-dashed border-ink-200 bg-card p-10 text-center">
          <p className="font-medium text-ink">Your dashboard is empty</p>
          <p className="mt-1 text-sm text-ink-500">Turn widgets back on to see your numbers.</p>
          <Button className="mt-4" size="sm" onClick={() => setDialogOpen(true)}>Choose widgets</Button>
        </div>
      }

      <CustomizeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        metrics={metrics}
        panels={panels}
        onReorder={setGroup}
        onToggle={toggle}
        onReset={reset} />
      
    </div>);

}
