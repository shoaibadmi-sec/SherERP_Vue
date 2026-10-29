import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Banknote, HandCoins, PackageMinus, Percent, ShoppingCart, Wallet } from 'lucide-react';
import { metrics } from '../../data/dashboard';
import { taka } from '../../utils/currency';
import type { DashboardWidget } from '../../types/erp';

type MetricConfig = {
  icon: React.ElementType;
  value: string;
  foot: React.ReactNode;
  tone: 'teal' | 'ink' | 'warning' | 'danger';
  to?: string;
};

const iconTone = {
  teal: 'bg-teal-50 text-teal-700',
  ink: 'bg-ink-50 text-ink-700',
  warning: 'bg-warning-bg text-warning',
  danger: 'bg-danger-bg text-danger'
};

function config(id: DashboardWidget['id']): MetricConfig {
  switch (id) {
    case 'today-sales':
      return {
        icon: ShoppingCart,
        value: taka(metrics.todaySales.value),
        tone: 'teal',
        to: '/app/pos',
        foot:
        <>
            <span className="inline-flex items-center gap-0.5 font-medium text-success">
              <ArrowUpRight className="size-3" />
              {metrics.todaySales.change}%
            </span>{' '}
            vs yesterday · {metrics.todaySales.invoices} invoices
          </>

      };
    case 'receivable':
      return {
        icon: ArrowDownLeft,
        value: taka(metrics.receivable.value),
        tone: 'ink',
        to: '/app/parties',
        foot: <>From {metrics.receivable.parties} parties · <span className="font-bn">পাবো</span></>
      };
    case 'payable':
      return {
        icon: HandCoins,
        value: taka(metrics.payable.value),
        tone: 'warning',
        to: '/app/purchases',
        foot: <>To {metrics.payable.parties} parties · <span className="font-bn">দেবো</span></>
      };
    case 'cash':
      return {
        icon: Wallet,
        value: taka(metrics.cash.value),
        tone: 'ink',
        foot: <>Bank {taka(metrics.cash.bank)}</>
      };
    case 'gross-profit':
      return {
        icon: Percent,
        value: taka(metrics.grossProfit.value),
        tone: 'teal',
        to: '/app/reports',
        foot: <>{metrics.grossProfit.margin}% margin today</>
      };
    case 'low-stock':
      return {
        icon: PackageMinus,
        value: `${metrics.lowStock.value} items`,
        tone: 'danger',
        to: '/app/products',
        foot: <>Below minimum · reorder soon</>
      };
    default:
      return { icon: Banknote, value: '—', tone: 'ink', foot: null };
  }
}

export function MetricCard({ widget }: {widget: DashboardWidget;}) {
  const c = config(widget.id);
  const Icon = c.icon;
  const body =
  <div className="h-full rounded-xl border border-border bg-card p-3.5 shadow-card transition-colors hover:border-ink-200">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[12.5px] font-medium text-ink-600">{widget.label}</p>
          <p className="font-bn truncate text-[11px] text-ink-400">{widget.labelBn}</p>
        </div>
        <span className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${iconTone[c.tone]}`}>
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-[22px] font-semibold tabular-nums tracking-tight text-ink">{c.value}</p>
      <p className="mt-0.5 truncate text-[11.5px] text-ink-500">{c.foot}</p>
    </div>;

  return c.to ?
  <Link to={c.to} className="block h-full rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
      {body}
    </Link> :

  body;

}
