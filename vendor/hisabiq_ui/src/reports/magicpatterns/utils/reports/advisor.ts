import type { ReportDataset } from '../../types/reports';
import { taka } from '../currency';
import { addDays, inRange, longDate, pctChange } from './period';
import { fmtQty, type Forecast, type TiedRow } from './planning';
import type { CustomerStat, OpenInvoice, ProductStat, Summary } from './metrics';

export type AdvisorArea = 'Stock' | 'Profit' | 'Cash' | 'Dues' | 'Customers' | 'Expenses' | 'Data';
export type ReportsTab = 'overview' | 'sales' | 'stock' | 'dues' | 'money' | 'advisor' | 'profit' | 'buying' | 'cashflow' | 'customers';

export type Recommendation = {
  id: string;
  area: AdvisorArea;
  priority: 'High' | 'Medium' | 'Low';
  title: string;
  /** What happened */
  what: string;
  /** Why it matters */
  why: string;
  /** What to do next */
  action: string;
  /** How it helps */
  benefit: string;
  impact: number;
  impactKind: 'profit' | 'cash' | 'risk' | 'data';
  confidence: 'High' | 'Medium' | 'Low';
  tab: ReportsTab;
};

type AdvisorInput = {
  ds: ReportDataset;
  stats: ProductStat[];
  customers: CustomerStat[];
  open: OpenInvoice[];
  tied: TiedRow[];
  forecast: Forecast;
  buffer: number;
  last30: Summary;
  prev30: Summary;
};

const priorityRank = { High: 0, Medium: 1, Low: 2 };

export function buildRecommendations(input: AdvisorInput): Recommendation[] {
  const { ds, stats, customers, open, tied, forecast, buffer, last30, prev30 } = input;
  const recs: Recommendation[] = [];
  const asOf = ds.asOf;
  const from30 = addDays(asOf, -29);

  // 1. Stock-outs that cost profit
  stats
    .filter((s) => (s.health === 'Out of stock' || s.health === 'Reorder now') && s.avgDaily > 0 && s.unitProfit !== null)
    .forEach((s) => {
      const out = s.product.stock <= 0;
      const lost = Math.round(Math.min(14, out ? 14 : s.profile.leadDays + 7 - (s.cover ?? 0)) * s.avgDaily * (s.unitProfit as number));
      if (lost < 300) return;
      recs.push({
        id: `stock-${s.product.id}`,
        area: 'Stock',
        priority: out ? 'High' : 'High',
        title: out ? `Restock ${s.product.name} — it’s out of stock` : `Reorder ${s.product.name} today`,
        what: out
          ? `It sold about ${fmtQty(s.avgDaily)} ${s.product.unit} a day and now has none.`
          : `Only ${fmtQty(s.product.stock)} ${s.product.unit} left — about ${Math.floor(s.cover ?? 0)} days of sales.`,
        why: `${s.profile.leadDays} days to get stock from the supplier, so customers may leave empty-handed.`,
        action: `Order ${s.suggested.toLocaleString('en-IN')} ${s.product.unit} (about ${taka(s.suggested * (s.unitCost ?? 0))}).`,
        benefit: `Protects about ${taka(lost)} of gross profit over the next 2 weeks.`,
        impact: lost,
        impactKind: 'profit',
        confidence: 'High',
        tab: 'buying',
      });
    });

  // 2. Supplier cost went up but selling price did not
  stats.forEach((s) => {
    const prev = s.profile.previousCost;
    if (prev === null || s.unitCost === null || s.unitCost <= prev) return;
    const monthly = Math.round((s.unitCost - prev) * s.avgDaily * 30);
    if (monthly < 1000) return;
    const oldMargin = (s.product.sellPrice - prev) / s.product.sellPrice;
    const newPrice = Math.ceil(s.unitCost / (1 - oldMargin) / (s.product.sellPrice > 100 ? 5 : 1)) * (s.product.sellPrice > 100 ? 5 : 1);
    recs.push({
      id: `price-${s.product.id}`,
      area: 'Profit',
      priority: monthly > 5000 ? 'High' : 'Medium',
      title: `Update the selling price of ${s.product.name}`,
      what: `Purchase cost rose from ${taka(prev)} to ${taka(s.unitCost)} per ${s.product.unit}, but you still sell at ${taka(s.product.sellPrice)}.`,
      why: `Margin fell from ${(oldMargin * 100).toFixed(1)}% to ${(((s.product.sellPrice - s.unitCost) / s.product.sellPrice) * 100).toFixed(1)}%.`,
      action: `Raise the price to about ${taka(newPrice)} per ${s.product.unit}, or ask the supplier for the old rate.`,
      benefit: `Recovers about ${taka(monthly)} profit a month at today’s sales pace.`,
      impact: monthly,
      impactKind: 'profit',
      confidence: 'High',
      tab: 'profit',
    });
  });

  // 3. Money stuck in slow stock
  tied.slice(0, 3).forEach((t) => {
    if (t.tied < 3000) return;
    recs.push({
      id: `tied-${t.stat.product.id}`,
      area: 'Stock',
      priority: t.stat.health === 'Dead stock' ? 'Medium' : 'Low',
      title: `${taka(t.tied)} is stuck in ${t.stat.product.name}`,
      what:
        t.stat.health === 'Dead stock'
          ? `Almost nothing sold recently (${fmtQty(t.stat.avgDaily * 30)} ${t.stat.product.unit} in 30 days). Oldest stock is ${t.stat.profile.stockAgeDays} days old.`
          : `You hold ${Math.round(t.stat.cover ?? 0)} days of stock; 45 days is enough.`,
      why: 'This cash could buy fast-selling items instead.',
      action: t.action,
      benefit: `Frees up to ${taka(t.tied)} of cash.`,
      impact: t.tied,
      impactKind: 'cash',
      confidence: 'Medium',
      tab: 'buying',
    });
  });

  // 4. Discounts
  const lines30 = ds.lines.filter((l) => inRange(l.date, from30, asOf));
  const disc30 = lines30.reduce((s, l) => s + l.discount, 0);
  if (disc30 > 2000) {
    const byProduct = new Map<string, number>();
    lines30.forEach((l) => byProduct.set(l.name, (byProduct.get(l.name) ?? 0) + l.discount));
    const top = [...byProduct].sort((a, b) => b[1] - a[1]).slice(0, 3);
    recs.push({
      id: 'discounts',
      area: 'Profit',
      priority: 'Medium',
      title: `Discounts cost ${taka(disc30)} in the last 30 days`,
      what: `Most went on ${top.map(([n, v]) => `${n} (${taka(v)})`).join(', ')}.`,
      why: 'Every taka of discount comes straight out of profit.',
      action: 'Set a maximum counter discount and give it only on bulk or cash orders.',
      benefit: `Cutting discounts by half adds about ${taka(Math.round(disc30 / 2))} profit a month.`,
      impact: Math.round(disc30 / 2),
      impactKind: 'profit',
      confidence: 'Medium',
      tab: 'profit',
    });
  }

  // 5. Low-margin bestseller
  stats
    .filter((s) => s.quadrant === 'Volume driver' && (s.margin ?? 100) < 9 && s.salesShare > 0.12)
    .forEach((s) => {
      recs.push({
        id: `mix-${s.product.id}`,
        area: 'Profit',
        priority: 'Low',
        title: `${s.product.name} sells a lot but earns little`,
        what: `${Math.round(s.salesShare * 100)}% of sales, but only ${s.margin?.toFixed(1)}% margin.`,
        why: 'High sales with a thin margin keep you busy without adding much profit.',
        action: 'Avoid extra discounts on it, and offer better-margin items (fittings, tools) with every order.',
        benefit: `Each 1% better margin adds about ${taka(Math.round((s.revenue / Math.max(1, last30.revenue)) * last30.revenue * 0.01))} profit.`,
        impact: Math.round(s.revenue * 0.01),
        impactKind: 'profit',
        confidence: 'Medium',
        tab: 'profit',
      });
    });

  // 6. Collections
  const overdueByCustomer = new Map<string, { name: string; due: number; oldest: number; phone: string }>();
  open
    .filter((o) => o.age > 30)
    .forEach((o) => {
      const row = overdueByCustomer.get(o.invoice.customerId) ?? { name: o.invoice.customer, due: 0, oldest: 0, phone: o.invoice.phone };
      row.due += o.due;
      row.oldest = Math.max(row.oldest, o.age);
      overdueByCustomer.set(o.invoice.customerId, row);
    });
  [...overdueByCustomer.values()]
    .sort((a, b) => b.due - a.due)
    .slice(0, 2)
    .forEach((c) => {
      recs.push({
        id: `collect-${c.name}`,
        area: 'Dues',
        priority: c.oldest > 45 ? 'High' : 'Medium',
        title: `Collect ${taka(c.due)} from ${c.name}`,
        what: `Unpaid for more than 30 days; the oldest bill is ${c.oldest} days old.`,
        why: 'The longer a due stays open, the harder it is to collect.',
        action: `Call ${c.phone} today and agree on a payment date. Send the statement by SMS.`,
        benefit: `Brings ${taka(c.due)} back into the business.`,
        impact: Math.round(c.due),
        impactKind: 'cash',
        confidence: 'High',
        tab: 'cashflow',
      });
    });

  // 7. Credit risk
  customers
    .filter((c) => c.risk === 'High' && c.outstanding > 10000)
    .forEach((c) => {
      recs.push({
        id: `credit-${c.id}`,
        area: 'Customers',
        priority: 'Medium',
        title: `Limit new credit for ${c.name}`,
        what: `Owes ${taka(c.outstanding)}; usually takes ${Math.round(c.avgPayDays ?? c.oldestDueDays)} days to pay.`,
        why: 'Selling more on credit here increases the risk of a bad debt.',
        action: 'Ask for part payment before the next order, or sell on cash until dues come down.',
        benefit: `Keeps ${taka(c.outstanding)} from growing further.`,
        impact: Math.round(c.outstanding),
        impactKind: 'risk',
        confidence: 'Medium',
        tab: 'customers',
      });
    });

  // 8. Customers who stopped buying
  const marginRate = last30.margin !== null ? last30.margin / 100 : 0.12;
  customers
    .filter((c) => c.status === 'At risk' && c.monthlyValue > 3000)
    .forEach((c) => {
      const monthlyProfit = Math.round(c.monthlyValue * marginRate);
      recs.push({
        id: `winback-${c.id}`,
        area: 'Customers',
        priority: 'Medium',
        title: `${c.name} has stopped buying`,
        what: `Last purchase ${c.lastBuyDays} days ago; they used to buy every ${Math.max(1, Math.round(c.usualGap ?? 0))} days.`,
        why: `They were worth about ${taka(Math.round(c.monthlyValue))} in sales a month.`,
        action: `Call ${c.phone} — ask if anything went wrong, and share current prices.`,
        benefit: `Winning them back adds about ${taka(monthlyProfit)} profit a month.`,
        impact: monthlyProfit,
        impactKind: 'profit',
        confidence: 'Low',
        tab: 'customers',
      });
    });

  // 9. Expense categories growing
  const cats = new Map<string, { now: number; before: number }>();
  ds.expenses.forEach((e) => {
    const key = e.category;
    const row = cats.get(key) ?? { now: 0, before: 0 };
    if (inRange(e.date, from30, asOf)) row.now += e.amount;
    else if (inRange(e.date, addDays(from30, -30), addDays(from30, -1))) row.before += e.amount;
    cats.set(key, row);
  });
  [...cats]
    .filter(([, v]) => v.before > 0 && v.now - v.before > 1500 && (pctChange(v.now, v.before) ?? 0) > 20)
    .forEach(([category, v]) => {
      recs.push({
        id: `expense-${category}`,
        area: 'Expenses',
        priority: 'Low',
        title: `${category} costs went up ${Math.round(pctChange(v.now, v.before) ?? 0)}%`,
        what: `${taka(v.now)} in the last 30 days vs ${taka(v.before)} the month before.`,
        why: 'Unplanned increases quietly reduce monthly profit.',
        action: `Check the ${category.toLowerCase()} entries for one-off or duplicate costs.`,
        benefit: `Bringing it back to normal saves about ${taka(v.now - v.before)} a month.`,
        impact: Math.round(v.now - v.before),
        impactKind: 'profit',
        confidence: 'Medium',
        tab: 'money',
      });
    });

  // 10. Cash forecast
  if (forecast.breach) {
    recs.push({
      id: 'cash-dip',
      area: 'Cash',
      priority: forecast.lowest < 0 ? 'High' : 'Medium',
      title: `Cash may drop to ${taka(forecast.lowest)} on ${longDate(forecast.lowestDate)}`,
      what: `That is below your safe level of ${taka(buffer)}.`,
      why: 'Rent, salaries and supplier bills fall close together.',
      action: 'Collect overdue dues first and schedule non-urgent purchases after this date.',
      benefit: 'Avoids borrowing or paying suppliers late.',
      impact: Math.round(buffer - forecast.lowest),
      impactKind: 'risk',
      confidence: 'Medium',
      tab: 'cashflow',
    });
  }

  // 11. Missing cost data
  stats
    .filter((s) => s.profile.costSource === 'Missing' && s.revenue > 0)
    .forEach((s) => {
      recs.push({
        id: `cost-${s.product.id}`,
        area: 'Data',
        priority: 'Low',
        title: `Add purchase cost for ${s.product.name}`,
        what: 'Its stock was entered without a purchase cost.',
        why: 'Profit for this product cannot be measured, so it is left out of profit reports.',
        action: 'Record the next purchase with its cost, or add an opening-stock cost.',
        benefit: 'Makes every profit figure complete.',
        impact: 0,
        impactKind: 'data',
        confidence: 'High',
        tab: 'profit',
      });
    });

  const unreceipted = ds.expenses.filter((e) => inRange(e.date, from30, asOf) && !e.hasReceipt);
  if (unreceipted.length >= 3) {
    recs.push({
      id: 'receipts',
      area: 'Data',
      priority: 'Low',
      title: `${unreceipted.length} expenses have no receipt`,
      what: `${taka(unreceipted.reduce((s, e) => s + e.amount, 0))} spent in the last 30 days without a photo or memo.`,
      why: 'Without receipts it is hard to check for mistakes or misuse.',
      action: 'Attach receipts in Expenses, or ask staff to photograph every memo.',
      benefit: 'Cleaner books and fewer surprises.',
      impact: 0,
      impactKind: 'data',
      confidence: 'High',
      tab: 'money',
    });
  }

  void prev30;
  return recs.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || b.impact - a.impact);
}

export type HealthPillar = { id: string; label: string; labelBn: string; status: 'Good' | 'Watch' | 'Act'; verdict: string; tab: ReportsTab };

export function businessHealth(input: { last30: Summary; forecast: Forecast; buffer: number; stats: ProductStat[]; tied: TiedRow[]; open: OpenInvoice[] }): HealthPillar[] {
  const { last30, forecast, buffer, stats, tied, open } = input;
  const netMargin = last30.netSales > 0 ? (last30.netProfit / last30.netSales) * 100 : 0;
  const stockouts = stats.filter((s) => s.health === 'Out of stock' || s.health === 'Reorder now').length;
  const stockValue = stats.reduce((s, r) => s + (r.stockValue ?? 0), 0);
  const tiedValue = tied.reduce((s, t) => s + t.tied, 0);
  const tiedShare = stockValue > 0 ? tiedValue / stockValue : 0;
  const due = open.reduce((s, o) => s + o.due, 0);
  const old = open.filter((o) => o.age > 30).reduce((s, o) => s + o.due, 0);
  const oldShare = due > 0 ? old / due : 0;
  return [
    {
      id: 'profit',
      label: 'Profit',
      labelBn: 'লাভ',
      status: netMargin >= 5 ? 'Good' : netMargin >= 0 ? 'Watch' : 'Act',
      verdict: `${netMargin >= 0 ? 'Keeping' : 'Losing'} about ৳${Math.abs(Math.round(netMargin * 10) / 10)} of every ৳100 sold, after expenses.`,
      tab: 'profit',
    },
    {
      id: 'cash',
      label: 'Cash',
      labelBn: 'নগদ',
      status: forecast.lowest >= buffer ? 'Good' : forecast.lowest >= 0 ? 'Watch' : 'Act',
      verdict: forecast.lowest >= buffer ? 'Enough cash for the next 30 days.' : `Lowest point ${taka(forecast.lowest)} on ${longDate(forecast.lowestDate)}.`,
      tab: 'cashflow',
    },
    {
      id: 'stock',
      label: 'Stock',
      labelBn: 'স্টক',
      status: stockouts === 0 && tiedShare < 0.1 ? 'Good' : stockouts >= 3 || tiedShare > 0.25 ? 'Act' : 'Watch',
      verdict: `${stockouts} item${stockouts === 1 ? '' : 's'} running out · ${Math.round(tiedShare * 100)}% of stock value is slow-moving.`,
      tab: 'buying',
    },
    {
      id: 'dues',
      label: 'Dues',
      labelBn: 'পাওনা',
      status: oldShare < 0.2 ? 'Good' : oldShare < 0.4 ? 'Watch' : 'Act',
      verdict: `${Math.round(oldShare * 100)}% of customer dues are older than 30 days.`,
      tab: 'cashflow',
    },
  ];
}
