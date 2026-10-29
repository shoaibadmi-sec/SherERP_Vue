import type { DashboardWidget } from '../types/erp';

export const defaultWidgets: DashboardWidget[] = [
{ id: 'today-sales', label: "Today's Sales", labelBn: 'আজকের বিক্রি', kind: 'metric', visible: true },
{ id: 'receivable', label: 'Receivable', labelBn: 'পাওনা', kind: 'metric', visible: true },
{ id: 'payable', label: 'Payable', labelBn: 'দেনা', kind: 'metric', visible: true },
{ id: 'cash', label: 'Cash in Hand', labelBn: 'হাতে নগদ', kind: 'metric', visible: true },
{ id: 'gross-profit', label: 'Gross Profit', labelBn: 'মোট লাভ', kind: 'metric', visible: true },
{ id: 'low-stock', label: 'Low Stock', labelBn: 'স্টক কম', kind: 'metric', visible: true },
{ id: 'sales-trend', label: 'Sales trend', labelBn: 'বিক্রির ধারা', kind: 'panel', visible: true },
{ id: 'cashflow', label: 'Cashflow', labelBn: 'নগদ প্রবাহ', kind: 'panel', visible: true },
{ id: 'recent-sales', label: 'Recent sales', labelBn: 'সাম্প্রতিক বিক্রি', kind: 'panel', visible: true },
{ id: 'dues', label: 'Dues to collect', labelBn: 'বকেয়া', kind: 'panel', visible: true }];


export const metrics = {
  todaySales: { value: 40460, change: 12.4, invoices: 4 },
  receivable: { value: 180300, parties: 6 },
  payable: { value: 249850, parties: 5 },
  cash: { value: 48250, bank: 312400 },
  grossProfit: { value: 6820, margin: 16.9 },
  lowStock: { value: 4 }
};

export const salesTrend = [
{ day: '18 Sep', sales: 28400, profit: 4600 },
{ day: '19 Sep', sales: 31200, profit: 5100 },
{ day: '20 Sep', sales: 22800, profit: 3700 },
{ day: '21 Sep', sales: 41500, profit: 7200 },
{ day: '22 Sep', sales: 38900, profit: 6400 },
{ day: '23 Sep', sales: 27600, profit: 4300 },
{ day: '24 Sep', sales: 33100, profit: 5600 },
{ day: '25 Sep', sales: 45800, profit: 7900 },
{ day: '26 Sep', sales: 18200, profit: 2900 },
{ day: '27 Sep', sales: 36400, profit: 6100 },
{ day: '28 Sep', sales: 42100, profit: 7000 },
{ day: '29 Sep', sales: 39700, profit: 6600 },
{ day: '30 Sep', sales: 47250, profit: 8100 },
{ day: '01 Oct', sales: 40460, profit: 6820 }];


export const cashflow = [
{ month: 'May', in: 820000, out: 710000 },
{ month: 'Jun', in: 905000, out: 842000 },
{ month: 'Jul', in: 760000, out: 798000 },
{ month: 'Aug', in: 948000, out: 812000 },
{ month: 'Sep', in: 1012000, out: 884000 },
{ month: 'Oct', in: 46300, out: 12400 }];


export const duesToCollect = [
{ partyId: 'c3', name: 'Mim Construction', amount: 96500, overdueDays: 26 },
{ partyId: 'c1', name: 'Rahman Hardware', amount: 48650, overdueDays: 21 },
{ partyId: 'b1', name: 'Rafiq Mia', amount: 15000, overdueDays: 11 },
{ partyId: 'c2', name: 'Hossain Electric', amount: 12300, overdueDays: 4 },
{ partyId: 'c4', name: 'Nur Enterprise', amount: 7850, overdueDays: 1 }];


export const notifications = [
{ id: 'n1', title: 'Gate Valve ¾" is low', body: '4 Pcs left · minimum 10', time: '12 min ago', tone: 'warning' as const },
{ id: 'n2', title: 'bKash payment received', body: 'Nur Enterprise paid ৳6,000 for INV-000239', time: '1 hr ago', tone: 'success' as const },
{ id: 'n3', title: 'Supplier bill due tomorrow', body: 'Karim Traders · PUR-000118 · ৳58,600', time: '3 hr ago', tone: 'danger' as const },
{ id: 'n4', title: 'Cash session opened', body: 'Opening float ৳5,000 by Anis', time: '9:02 AM', tone: 'info' as const }];