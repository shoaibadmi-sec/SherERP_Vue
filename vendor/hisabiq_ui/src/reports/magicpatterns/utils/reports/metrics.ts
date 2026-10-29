

import type { ReportProduct as Product } from '../../types/reports';
import type { InvoiceRec, ProductProfile, ReportDataset, SaleLineRec } from '../../types/reports';
import { addDays, diffDays, inRange, shortDate } from './period.ts';

// ---------- Summary ----------

export type Summary = {
  gross: number;
  discount: number;
  revenue: number;
  returns: number;
  netSales: number;
  costedRevenue: number;
  uncostedRevenue: number;
  cogs: number;
  grossProfit: number;
  margin: number | null;
  coverage: number;
  expenses: number;
  netProfit: number;
  collected: number;
  invoices: number;
  avgBill: number;
};

export function summarize(ds: ReportDataset, from: string, to: string): Summary {
  const lines = ds.lines.filter((l) => inRange(l.date, from, to));
  const gross = lines.reduce((s, l) => s + l.revenue + l.discount, 0);
  const discount = lines.reduce((s, l) => s + l.discount, 0);
  const revenue = gross - discount;
  const costed = lines.filter((l) => l.unitCost !== null);
  const costedRevenue = costed.reduce((s, l) => s + l.revenue, 0);
  const cogs = costed.reduce((s, l) => s + l.qty * (l.unitCost as number), 0);
  const returns = ds.returns.filter((r) => inRange(r.date, from, to)).reduce((s, r) => s + r.amount, 0);
  const expenses = ds.expenses.filter((e) => inRange(e.date, from, to)).reduce((s, e) => s + e.amount, 0);
  const collected = ds.invoices.reduce(
    (s, inv) => s + inv.payments.filter((p) => inRange(p.date, from, to)).reduce((n, p) => n + p.amount, 0),
    0,
  );
  const invoiceCount = new Set(lines.map((l) => l.invoice)).size;
  const grossProfit = costedRevenue - cogs;
  return {
    gross,
    discount,
    revenue,
    returns,
    netSales: revenue - returns,
    costedRevenue,
    uncostedRevenue: revenue - costedRevenue,
    cogs,
    grossProfit,
    margin: costedRevenue > 0 ? (grossProfit / costedRevenue) * 100 : null,
    coverage: revenue > 0 ? costedRevenue / revenue : 1,
    expenses,
    netProfit: grossProfit - expenses,
    collected,
    invoices: invoiceCount,
    avgBill: invoiceCount ? revenue / invoiceCount : 0,
  };
}

// ---------- Time series ----------

export type SeriesPoint = { key: string; label: string; sales: number; profit: number; expenses: number };

export function salesSeries(ds: ReportDataset, from: string, to: string): SeriesPoint[] {
  const days = diffDays(to, from) + 1;
  const bucket = days > 45 ? 7 : 1;
  const points: SeriesPoint[] = [];
  for (let start = from; start <= to; start = addDays(start, bucket)) {
    const end = bucket === 1 ? start : addDays(start, bucket - 1) > to ? to : addDays(start, bucket - 1);
    const lines = ds.lines.filter((l) => inRange(l.date, start, end));
    points.push({
      key: start,
      label: bucket === 1 ? shortDate(start) : `${shortDate(start)}`,
      sales: Math.round(lines.reduce((s, l) => s + l.revenue, 0)),
      profit: Math.round(lines.filter((l) => l.unitCost !== null).reduce((s, l) => s + l.revenue - l.qty * (l.unitCost as number), 0)),
      expenses: Math.round(ds.expenses.filter((e) => inRange(e.date, start, end)).reduce((s, e) => s + e.amount, 0)),
    });
  }
  return points;
}

// ---------- Products ----------

export type StockHealth = 'Out of stock' | 'Reorder now' | 'Reorder soon' | 'Healthy' | 'Overstock' | 'Dead stock';
export type Quadrant = 'Star' | 'Volume driver' | 'Hidden gem' | 'Review' | 'No cost';

export type ProductStat = {
  product: Product;
  profile: ProductProfile;
  units: number;
  revenue: number;
  discount: number;
  cogs: number | null;
  profit: number | null;
  margin: number | null;
  profitShare: number;
  salesShare: number;
  /** Average base units sold per day over the last 28 days */
  avgDaily: number;
  trendPct: number | null;
  cover: number | null;
  lastSaleDays: number | null;
  unitCost: number | null;
  stockValue: number | null;
  reorderPoint: number;
  suggested: number;
  health: StockHealth;
  quadrant: Quadrant;
  unitProfit: number | null;
};

const REVIEW_DAYS = 7;

export function productStats(ds: ReportDataset, from: string, to: string): ProductStat[] {
  const asOf = ds.asOf;
  const period = ds.lines.filter((l) => inRange(l.date, from, to));
  const totalRevenue = period.reduce((s, l) => s + l.revenue, 0);
  const rows = ds.profiles
    .map((profile) => {
      const product = ds.products.find((p) => p.id === profile.productId);
      if (!product) return null;
      const mine = period.filter((l) => l.productId === product.id);
      const units = mine.reduce((s, l) => s + l.qty, 0);
      const revenue = mine.reduce((s, l) => s + l.revenue, 0);
      const discount = mine.reduce((s, l) => s + l.discount, 0);
      const hasMissing = mine.some((l) => l.unitCost === null);
      const cogs = hasMissing ? null : mine.reduce((s, l) => s + l.qty * (l.unitCost as number), 0);
      const profit = cogs === null ? null : revenue - cogs;
      const all = ds.lines.filter((l) => l.productId === product.id);
      const recent28 = all.filter((l) => inRange(l.date, addDays(asOf, -27), asOf)).reduce((s, l) => s + l.qty, 0);
      const last14 = all.filter((l) => inRange(l.date, addDays(asOf, -13), asOf)).reduce((s, l) => s + l.qty, 0);
      const prev14 = all.filter((l) => inRange(l.date, addDays(asOf, -27), addDays(asOf, -14))).reduce((s, l) => s + l.qty, 0);
      const avgDaily = recent28 / 28;
      const lastSale = all.length ? [...all].map(l => l.date).sort().at(-1)! : null;
      const lastSaleDays = lastSale ? diffDays(asOf, lastSale) : null;
      const unitCost = profile.costSource === 'Missing' ? null : product.purchasePrice;
      const cover = avgDaily > 0 ? product.stock / avgDaily : null;
      const safety = avgDaily * 3;
      const reorderPoint = Math.ceil(avgDaily * profile.leadDays + safety);
      const target = avgDaily * (profile.leadDays + REVIEW_DAYS) + safety;
      const suggested = product.active ? Math.ceil(Math.max(0, target - product.stock) / profile.pack) * profile.pack : 0;
      let health: StockHealth = 'Healthy';
      if (product.stock <= 0) health = 'Out of stock';
      else if ((lastSaleDays !== null && lastSaleDays > 45) || (cover !== null && cover > 180) || avgDaily < 0.2) health = 'Dead stock';
      else if (cover !== null && cover <= profile.leadDays + 1) health = 'Reorder now';
      else if (product.stock <= reorderPoint + avgDaily * 3) health = 'Reorder soon';
      else if (cover !== null && cover > 60) health = 'Overstock';
      return {
        product,
        profile,
        units,
        revenue,
        discount,
        cogs,
        profit,
        margin: profit !== null && revenue > 0 ? (profit / revenue) * 100 : null,
        profitShare: 0,
        salesShare: totalRevenue > 0 ? revenue / totalRevenue : 0,
        avgDaily,
        trendPct: prev14 > 0 ? ((last14 - prev14) / prev14) * 100 : null,
        cover,
        lastSaleDays,
        unitCost,
        stockValue: unitCost === null ? null : product.stock * unitCost,
        reorderPoint,
        suggested,
        health,
        quadrant: 'Review' as Quadrant,
        unitProfit: unitCost === null ? null : product.sellPrice - unitCost,
      };
    })
    .filter((r): r is ProductStat => r !== null);

  const totalProfit = rows.reduce((s, r) => s + Math.max(0, r.profit ?? 0), 0);
  const costed = rows.filter((r) => r.margin !== null && r.revenue > 0);
  const median = (xs: number[]) => {
    const s = [...xs].sort((a, b) => a - b);
    return s.length ? s[Math.floor(s.length / 2)] : 0;
  };
  const mMargin = median(costed.map((r) => r.margin as number));
  const mRevenue = median(costed.map((r) => r.revenue));
  for (const r of rows) {
    r.profitShare = totalProfit > 0 ? Math.max(0, r.profit ?? 0) / totalProfit : 0;
    if (r.margin === null) r.quadrant = 'No cost';
    else if (r.revenue >= mRevenue && r.margin >= mMargin) r.quadrant = 'Star';
    else if (r.revenue >= mRevenue) r.quadrant = 'Volume driver';
    else if (r.margin >= mMargin) r.quadrant = 'Hidden gem';
    else r.quadrant = 'Review';
  }
  return rows;
}

export function categoryStats(stats: ProductStat[]) {
  const map = new Map<string, { category: string; revenue: number; profit: number; costed: boolean; stockValue: number }>();
  for (const s of stats) {
    const row = map.get(s.product.category) ?? { category: s.product.category, revenue: 0, profit: 0, costed: true, stockValue: 0 };
    row.revenue += s.revenue;
    row.profit += s.profit ?? 0;
    row.stockValue += s.stockValue ?? 0;
    if (s.profit === null && s.revenue > 0) row.costed = false;
    map.set(s.product.category, row);
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue);
}

// ---------- Customers & dues ----------

export const invoicePaid = (inv: InvoiceRec, asOf: string) =>
  inv.payments.filter((p) => p.date <= asOf).reduce((s, p) => s + p.amount, 0);

export const invoiceDue = (inv: InvoiceRec, asOf: string, returns = 0) =>
  Math.max(0, Math.round(((inv.dueOverride ?? (inv.total - returns - invoicePaid(inv, asOf)))) * 100) / 100);

export type OpenInvoice = { invoice: InvoiceRec; due: number; age: number; bucket: '0–15 days' | '16–30 days' | '31–60 days' | '60+ days' };

export function openInvoices(ds: ReportDataset): OpenInvoice[] {
  return ds.invoices
    .map((inv) => {
      const returned = ds.returns.filter((r) => r.invoice === inv.id).reduce((s, r) => s + r.amount, 0);
      const due = invoiceDue(inv, ds.asOf, returned);
      const age = diffDays(ds.asOf, inv.date);
      const bucket: OpenInvoice['bucket'] = age <= 15 ? '0–15 days' : age <= 30 ? '16–30 days' : age <= 60 ? '31–60 days' : '60+ days';
      return { invoice: inv, due, age, bucket };
    })
    .filter((o) => o.due >= 1)
    .sort((a, b) => b.age - a.age);
}

export type CustomerStatus = 'Loyal' | 'Regular' | 'New' | 'At risk' | 'Lost';
export type CreditRisk = 'Low' | 'Medium' | 'High';

export type CustomerStat = {
  id: string;
  name: string;
  phone: string;
  revenue: number;
  profit: number | null;
  orders: number;
  monthlyValue: number;
  lastBuyDays: number | null;
  usualGap: number | null;
  outstanding: number;
  oldestDueDays: number;
  avgPayDays: number | null;
  status: CustomerStatus;
  risk: CreditRisk;
};

export function customerStats(ds: ReportDataset, from: string, to: string): CustomerStat[] {
  const asOf = ds.asOf;
  const open = openInvoices(ds);
  const ids = Array.from(new Set(ds.invoices.map((i) => i.customerId)));
  return ids
    .map((id) => {
      const invs = ds.invoices.filter((i) => i.customerId === id);
      const first = invs[0];
      const lines = ds.lines.filter((l) => l.customerId === id && inRange(l.date, from, to));
      const revenue = lines.reduce((s, l) => s + l.revenue, 0);
      const anyMissing = lines.some((l) => l.unitCost === null);
      const profit = anyMissing ? null : lines.reduce((s, l) => s + l.revenue - l.qty * (l.unitCost as number), 0);
      const orders = new Set(lines.map((l) => l.invoice)).size;
      const last90 = ds.lines.filter((l) => l.customerId === id && l.date > addDays(asOf, -90)).reduce((s, l) => s + l.revenue, 0);
      const dates = Array.from(new Set(invs.map((i) => i.date)));
      const lastBuy = dates[dates.length - 1];
      const lastBuyDays = lastBuy ? diffDays(asOf, lastBuy) : null;
      const usualGap = dates.length > 1 ? diffDays(dates[dates.length - 1], dates[0]) / (dates.length - 1) : null;
      const mine = open.filter((o) => o.invoice.customerId === id);
      const outstanding = mine.reduce((s, o) => s + o.due, 0);
      const oldestDueDays = mine.reduce((m, o) => Math.max(m, o.age), 0);
      const settled = invs.filter((i) => i.payments.length && invoiceDue(i, asOf) < 1);
      const delays = settled.map((i) => diffDays(i.payments[i.payments.length - 1].date, i.date));
      const avgPayDays = delays.length ? delays.reduce((a, b) => a + b, 0) / delays.length : null;
      const firstDays = diffDays(asOf, dates[0]);
      let status: CustomerStatus = 'Regular';
      if (lastBuyDays !== null && lastBuyDays > 90) status = 'Lost';
      else if (lastBuyDays !== null && usualGap !== null && lastBuyDays > Math.max(21, usualGap * 3)) status = 'At risk';
      else if (firstDays < 30) status = 'New';
      else if (usualGap !== null && usualGap <= 4) status = 'Loyal';
      let risk: CreditRisk = 'Low';
      if (oldestDueDays > 45 || (avgPayDays ?? 0) > 40) risk = 'High';
      else if (oldestDueDays > 20 || (avgPayDays ?? 0) > 20) risk = 'Medium';
      const known = ds.customers.find((c) => c.id === id);
      return {
        id,
        name: first.customer,
        phone: known?.phone ?? first.phone,
        revenue,
        profit,
        orders,
        monthlyValue: last90 / 3,
        lastBuyDays,
        usualGap,
        outstanding,
        oldestDueDays,
        avgPayDays,
        status,
        risk,
      };
    })
    .sort((a, b) => b.monthlyValue - a.monthlyValue);
}

// ---------- Payables ----------

export type Payable = { supplier: string; amount: number; oldestDue: string | null; overdue: number; source: string };

export function payables(ds: ReportDataset): Payable[] {
  const map = new Map<string, Payable>();
  for (const p of ds.purchases) {
    const due = p.amount - p.paid;
    if (due < 1) continue;
    const row = map.get(p.supplier) ?? { supplier: p.supplier, amount: 0, oldestDue: null, overdue: 0, source: 'Purchase bills' };
    row.amount += due;
    if (p.dueDate && (!row.oldestDue || p.dueDate < row.oldestDue)) row.oldestDue = p.dueDate;
    if (p.dueDate && p.dueDate < ds.asOf) row.overdue += due;
    map.set(p.supplier, row);
  }
  for (const v of ds.vendorBalances) {
    if (v.amount <= 0) continue;
    const row = map.get(v.name) ?? { supplier: v.name, amount: 0, oldestDue: null, overdue: 0, source: 'Vendor ledger' };
    row.amount += v.amount;
    row.source = row.source === 'Vendor ledger' ? row.source : 'Bills + vendor ledger';
    map.set(v.name, row);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

export const lineProfit = (l: SaleLineRec) => (l.unitCost === null ? null : l.revenue - l.qty * l.unitCost);
