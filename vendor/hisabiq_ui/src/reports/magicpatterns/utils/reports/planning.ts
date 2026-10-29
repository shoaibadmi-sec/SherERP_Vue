
import type { ReportDataset } from '../../types/reports';
import { addDays, diffDays, inRange, shortDate, weekday } from './period';
import { openInvoices, type ProductStat } from './metrics';

// ---------- Buy plan ----------

export type BuyDecision = 'Buy now' | 'Buy part' | 'Wait — over budget' | 'Add cost first';

export type BuyRow = {
  stat: ProductStat;
  qty: number;
  amount: number | null;
  decision: BuyDecision;
  /** Gross profit likely lost in the next 14 days if nothing is ordered */
  lostProfitRisk: number;
  reason: string;
};

const healthRank: Record<string, number> = { 'Out of stock': 0, 'Reorder now': 1, 'Reorder soon': 2, Healthy: 3, Overstock: 4, 'Dead stock': 5 };

export function buyPlan(stats: ProductStat[], budget: number) {
  const candidates = stats
    .filter((s) => s.product.active && s.suggested > 0 && s.health !== 'Dead stock' && s.health !== 'Overstock')
    .map((s) => {
      const cover = s.cover ?? 0;
      const stockoutDays = s.product.stock <= 0 ? 14 : Math.max(0, 14 - Math.max(0, cover - s.profile.leadDays) - s.profile.leadDays);
      const lostProfitRisk = s.unitProfit === null ? 0 : Math.round(Math.min(14, stockoutDays + (cover < s.profile.leadDays ? s.profile.leadDays - cover : 0)) * s.avgDaily * s.unitProfit);
      return { s, lostProfitRisk };
    })
    .sort((a, b) => healthRank[a.s.health] - healthRank[b.s.health] || b.lostProfitRisk - a.lostProfitRisk);

  let remaining = budget;
  const rows: BuyRow[] = candidates.map(({ s, lostProfitRisk }) => {
    const daysLeft = s.cover === null ? 0 : Math.floor(s.cover);
    const reason =
      s.product.stock <= 0
        ? `Out of stock. Sells about ${fmtQty(s.avgDaily)} ${s.product.unit}/day.`
        : `${daysLeft} days of stock left; supplier needs ${s.profile.leadDays} days.`;
    if (s.unitCost === null) return { stat: s, qty: s.suggested, amount: null, decision: 'Add cost first', lostProfitRisk, reason };
    const full = s.suggested * s.unitCost;
    if (full <= remaining) {
      remaining -= full;
      return { stat: s, qty: s.suggested, amount: full, decision: 'Buy now', lostProfitRisk, reason };
    }
    const packCost = s.profile.pack * s.unitCost;
    const packs = Math.floor(remaining / packCost);
    if (packs > 0) {
      const qty = packs * s.profile.pack;
      remaining -= qty * s.unitCost;
      return { stat: s, qty, amount: qty * s.unitCost, decision: 'Buy part', lostProfitRisk, reason: reason + ' Budget covers part of it.' };
    }
    return { stat: s, qty: s.suggested, amount: full, decision: 'Wait — over budget', lostProfitRisk, reason };
  });

  const planned = rows.filter((r) => r.decision === 'Buy now' || r.decision === 'Buy part');
  return {
    rows,
    spend: planned.reduce((s, r) => s + (r.amount ?? 0), 0),
    protectedProfit: planned.reduce((s, r) => s + r.lostProfitRisk, 0),
    unprotectedProfit: rows.filter((r) => !planned.includes(r)).reduce((s, r) => s + r.lostProfitRisk, 0),
    remaining,
  };
}

export const fmtQty = (n: number) => (n >= 10 ? Math.round(n).toLocaleString('en-IN') : n.toFixed(1).replace(/\.0$/, ''));

// ---------- Cash tied up in slow stock ----------

export type TiedRow = { stat: ProductStat; excessQty: number; tied: number; action: string };

export function tiedStock(stats: ProductStat[]): TiedRow[] {
  return stats
    .filter((s) => (s.health === 'Dead stock' || s.health === 'Overstock') && s.unitCost !== null)
    .map((s) => {
      const keep = Math.ceil(s.avgDaily * 45);
      const excessQty = Math.max(0, s.product.stock - keep);
      const tied = excessQty * (s.unitCost as number);
      const action =
        s.health === 'Dead stock'
          ? 'Stop buying. Clear with a small discount, bundle with a fast seller, or ask the supplier to take it back.'
          : `Pause buying until stock falls to about ${keep.toLocaleString('en-IN')} ${s.product.unit}.`;
      return { stat: s, excessQty, tied, action };
    })
    .filter((r) => r.tied > 0)
    .sort((a, b) => b.tied - a.tied);
}

// ---------- Working capital ----------

export function workingCapital(ds: ReportDataset, stats: ProductStat[]) {
  const asOf = ds.asOf;
  const from90 = addDays(asOf, -89);
  const stockValue = stats.reduce((s, r) => s + (r.stockValue ?? 0), 0);
  const cogs90 = ds.lines
    .filter((l) => inRange(l.date, from90, asOf) && l.unitCost !== null)
    .reduce((s, l) => s + l.qty * (l.unitCost as number), 0);
  const sales90 = ds.lines.filter((l) => inRange(l.date, from90, asOf)).reduce((s, l) => s + l.revenue, 0);
  const purchases90 = ds.purchases.filter((p) => inRange(p.date, from90, asOf)).reduce((s, p) => s + p.amount, 0);
  const receivable = openInvoices(ds).reduce((s, o) => s + o.due, 0);
  const payable =
    ds.purchases.reduce((s, p) => s + Math.max(0, p.amount - p.paid), 0) +
    ds.vendorBalances.reduce((s, v) => s + Math.max(0, v.amount), 0);
  const stockDays = cogs90 > 0 ? stockValue / (cogs90 / 90) : null;
  const receivableDays = sales90 > 0 ? receivable / (sales90 / 90) : null;
  const payableDays = purchases90 > 0 ? payable / (purchases90 / 90) : null;
  const cycle = stockDays !== null && receivableDays !== null && payableDays !== null ? stockDays + receivableDays - payableDays : null;
  return { stockValue, receivable, payable, stockDays, receivableDays, payableDays, cycle, net: stockValue + receivable - payable };
}

// ---------- 30-day cash forecast ----------

export type ForecastOptions = { days: number; buffer: number; includePurchases: boolean; lateDays: number };

export type ForecastDay = {
  date: string;
  label: string;
  collections: number;
  cashSales: number;
  supplier: number;
  expenses: number;
  purchases: number;
  inflow: number;
  outflow: number;
  balance: number;
};

export function cashForecast(ds: ReportDataset, _stats: ProductStat[], plannedSpend: number, opts: ForecastOptions) {
  const asOf = ds.asOf;
  const start = ds.accounts.reduce((s, a) => s + a.balance, 0);
  const horizonEnd = addDays(asOf, opts.days);

  // Same-day payments in the last 28 days = typical cash sales
  const from28 = addDays(asOf, -27);
  const sameDay = ds.invoices.reduce(
    (s, inv) => s + (inRange(inv.date, from28, asOf) ? inv.payments.filter((p) => p.date === inv.date).reduce((n, p) => n + p.amount, 0) : 0),
    0,
  );
  const dailyCashSales = sameDay / 28;
  const dailyCogs =
    ds.lines.filter((l) => inRange(l.date, from28, asOf) && l.unitCost !== null).reduce((s, l) => s + l.qty * (l.unitCost as number), 0) / 28;

  const days: ForecastDay[] = [];
  for (let i = 1; i <= opts.days; i++) {
    const date = addDays(asOf, i);
    days.push({ date, label: shortDate(date), collections: 0, cashSales: 0, supplier: 0, expenses: 0, purchases: 0, inflow: 0, outflow: 0, balance: 0 });
  }
  const at = (date: string) => days.find((d) => d.date === date);

  for (const d of days) {
    const wd = weekday(d.date);
    d.cashSales = Math.round(dailyCashSales * (wd === 5 ? 0.35 : wd === 6 ? 0.9 : 1.05));
    const dom = Number(d.date.slice(8, 10));
    for (const r of ds.recurringExpenses) if (dom === r.dayOfMonth) d.expenses += r.amount;
    if (wd === 6) for (const v of ds.variableExpenses) d.expenses += v.weekly;
    if (opts.includePurchases && diffDays(d.date, asOf) > 7) d.purchases += Math.round(dailyCogs);
  }

  // Customer collections
  openInvoices(ds).forEach((o, index) => {
    const customer = ds.customers.find((c) => c.id === o.invoice.customerId);
    const usual = customer?.payDays ?? 20;
    let expected = addDays(o.invoice.date, usual + opts.lateDays);
    let factor = 0.95;
    if (expected <= asOf) {
      expected = addDays(asOf, 3 + (index % 8) + opts.lateDays);
      factor = o.age > 60 ? 0.5 : 0.85;
    }
    if (expected <= horizonEnd) {
      const day = at(expected);
      if (day) day.collections += Math.round(o.due * factor);
    }
  });

  // Supplier bills
  for (const p of ds.purchases) {
    const due = p.amount - p.paid;
    if (due < 1) continue;
    const date = p.dueDate <= asOf ? addDays(asOf, 2) : p.dueDate;
    const day = at(date);
    if (day) day.supplier += Math.round(due);
  }
  for (const v of ds.vendorBalances) {
    if (v.amount <= 0) continue;
    const day = at(addDays(asOf, 7));
    if (day) day.supplier += Math.round(v.amount);
  }

  // Urgent buy list paid on delivery
  if (opts.includePurchases && plannedSpend > 0) {
    const day = at(addDays(asOf, 3));
    if (day) day.purchases += Math.round(plannedSpend);
  }

  let balance = start;
  let lowest = start;
  let lowestDate = asOf;
  let breach: string | null = null;
  for (const d of days) {
    d.inflow = d.collections + d.cashSales;
    d.outflow = d.supplier + d.expenses + d.purchases;
    balance += d.inflow - d.outflow;
    d.balance = Math.round(balance);
    if (d.balance < lowest) {
      lowest = d.balance;
      lowestDate = d.date;
    }
    if (!breach && d.balance < opts.buffer) breach = d.date;
  }

  const weeks: { label: string; inflow: number; outflow: number; closing: number }[] = [];
  for (let w = 0; w < days.length; w += 7) {
    const chunk = days.slice(w, w + 7);
    weeks.push({
      label: `${chunk[0].label} – ${chunk[chunk.length - 1].label}`,
      inflow: chunk.reduce((s, d) => s + d.inflow, 0),
      outflow: chunk.reduce((s, d) => s + d.outflow, 0),
      closing: chunk[chunk.length - 1].balance,
    });
  }

  return {
    start,
    days,
    weeks,
    totalIn: days.reduce((s, d) => s + d.inflow, 0),
    totalOut: days.reduce((s, d) => s + d.outflow, 0),
    end: days.length ? days[days.length - 1].balance : start,
    lowest,
    lowestDate,
    breach,
    dailyCashSales,
    dailyCogs,
  };
}

export type Forecast = ReturnType<typeof cashForecast>;
