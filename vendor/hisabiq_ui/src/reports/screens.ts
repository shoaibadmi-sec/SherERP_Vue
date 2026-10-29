import { reportDefinition } from "./catalog.ts";
import { salesExperimentReportKey } from "./salesExperiment.ts";
import type { ReportFilters, ReportKey, ReportScreen } from "./types";
export const reportScreens: {
  id: ReportScreen;
  en: string;
  bn: string;
  report: ReportKey;
  premium?: boolean;
}[] = [
  {
    id: "advisor",
    en: "Advisor",
    bn: "পরামর্শ",
    report: "collections",
    premium: true,
  },
  {
    id: "profit",
    en: "Profit insights",
    bn: "লাভ বিশ্লেষণ",
    report: "product-profit",
    premium: true,
  },
  {
    id: "buying",
    en: "Smart buying",
    bn: "কেনাকাটা",
    report: "reorder",
    premium: true,
  },
  {
    id: "cashflow",
    en: "Cash forecast",
    bn: "ক্যাশ পূর্বাভাস",
    report: "cash-book",
    premium: true,
  },
  {
    id: "customers",
    en: "Customers",
    bn: "গ্রাহক",
    report: "customer-sales",
    premium: true,
  },
  { id: "overview", en: "Overview", bn: "সারাংশ", report: "overview" },
  {
    id: "sales",
    en: "Sales & profit",
    bn: "বিক্রি ও লাভ",
    report: "sales-register",
  },
  { id: "sales-lab", en: "Sales experiment", bn: "বিক্রির পরীক্ষামূলক ভিউ", report: "sales-register" },
  { id: "stock", en: "Stock", bn: "স্টক", report: "stock" },
  { id: "dues", en: "Dues", bn: "পাওনা-দেনা", report: "receivables" },
  { id: "money", en: "Cash & expenses", bn: "টাকা ও খরচ", report: "cash-book" },
  { id: "library", en: "Report library", bn: "সব রিপোর্ট", report: "overview" },
];

export const reportScreenQuestions: Partial<
  Record<ReportScreen, { en: string; bn: string }>
> = {
  sales: {
    en: "What sold, what earned, and where did discounts or returns matter?",
    bn: "কী বিক্রি হয়েছে, কত লাভ ও ছাড় বা ফেরতের প্রভাব কত?",
  },
  stock: {
    en: "What is available, low, slow or near expiry?",
    bn: "কোন স্টক আছে, কম, ধীরগতির বা মেয়াদের কাছে?",
  },
  dues: {
    en: "Who owes you, and which supplier bills need attention?",
    bn: "কার কাছে পাবেন, কোন সরবরাহকারীর বিল দিতে হবে?",
  },
  money: {
    en: "Where did recorded money come from and go?",
    bn: "লেখা টাকা কোথা থেকে এসেছে, কোথায় গেছে?",
  },
  advisor: {
    en: "What deserves attention next, and what evidence supports it?",
    bn: "পরের কোন কাজে নজর দেবেন, তার মূল তথ্য কী?",
  },
  profit: {
    en: "Which products earn a known margin, and which costs are missing?",
    bn: "কোন পণ্যের লাভ জানা আছে, কোন খরচ অনুপস্থিত?",
  },
  buying: {
    en: "What should you buy, from whom, and within which budget?",
    bn: "কী কিনবেন, কার কাছ থেকে ও কোন বাজেটে?",
  },
  cashflow: {
    en: "How could your assumptions affect cash over the next 30 days?",
    bn: "আপনার অনুমানে পরের ৩০ দিনে টাকা কেমন থাকবে?",
  },
  customers: {
    en: "Who contributes to sales and needs a follow-up?",
    bn: "কার অবদান বেশি, কার খোঁজ নিতে হবে?",
  },
};

export function reportKeyForScreen(
  screen: ReportScreen,
  requested?: string | null,
): ReportKey {
  return screen === "sales-lab" ? salesExperimentReportKey(requested)
    : screen === "library"
    ? reportDefinition(requested ?? "overview").id
    : (reportScreens.find((item) => item.id === screen) ?? reportScreens[0])
        .report;
}
export function filtersForAnalysisReport(
  key: ReportKey,
  filters: ReportFilters,
  screen?: ReportScreen,
): ReportFilters {
  const definition = reportDefinition(key),
    next = { ...filters };
  for (const dimension of [
    "category",
    "brand",
    "product",
    "party",
    "user",
    "account",
    "status",
  ] as const)
    if (!definition.dimensions.includes(dimension)) next[dimension] = "";
  // Product categories and expense categories are different taxonomies.
  if (
    screen &&
    ["overview", "sales", "stock", "profit", "buying"].includes(screen) &&
    ["expenses", "expense-categories"].includes(key)
  )
    next.category = "";
  return next;
}
