import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import {
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Button } from "../Button";
import { Panel } from "../Panel";
import { useUiCopy } from "../../i18n/useUiCopy";
import { filtersForAnalysisReport } from "../../reports/screens";
import { runReport } from "../../reports/model";
import { taka, takaCompact, formatNumber } from "../../utils/currency";
import { ReportSalesTrend } from "./ReportSalesTrend";
import { ReportEvidencePanel } from "./ReportEvidencePanel";
import { AdvisorReport } from "./premium/AdvisorReport";
import { CashflowReport } from "./premium/CashflowReport";
import type {
  ReportData,
  ReportFilters,
  ReportKey,
  ReportRow,
  ReportScreen,
} from "../../reports/types";
const chartStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--foreground)",
  fontSize: 12,
};
export type ReportAnalysisProps = {
  screen: ReportScreen;
  data: ReportData;
  filters: ReportFilters;
  onReport: (key: ReportKey, filters?: ReportFilters) => void;
  onScreen: (screen: ReportScreen) => void;
  onDetail: (row: ReportRow) => void;
  scopeKey: string;
};
export function ReportAnalysis(props: ReportAnalysisProps) {
  const { screen, data, filters, onReport, onScreen, onDetail, scopeKey } =
      props,
    { text } = useUiCopy();
  const results = useMemo(
    () =>
      Object.fromEntries(
        (
          [
            "sales-register",
            "product-profit",
            "category-sales",
            "product-sales",
            "sales-returns",
            "discounts",
            "stock",
            "low-stock",
            "stock-velocity",
            "expiry",
            "receivables",
            "payables",
            "collections",
            "cash-book",
            "expenses",
            "expense-categories",
            "customer-sales",
            "purchase-prices",
            "supplier-purchases",
          ] as ReportKey[]
        ).map((key) => [
          key,
          runReport(key, data, filtersForAnalysisReport(key, filters, screen)),
        ]),
      ),
    [data, filters, screen],
  );
  const scopeNote = (key: ReportKey) => {
    const effective = filtersForAnalysisReport(key, filters, screen);
    const labels = {
      category: ["all categories", "সব খাত"],
      brand: ["all brands", "সব ব্র্যান্ড"],
      product: ["all products", "সব পণ্য"],
      party: ["all parties", "সব পক্ষ"],
      user: ["all recorders", "সব এন্ট্রিকারী"],
      account: ["all accounts", "সব অ্যাকাউন্ট"],
      status: ["all statuses", "সব অবস্থা"],
    };
    return Object.entries(labels)
      .filter(
        ([dimension]) =>
          filters[dimension as keyof ReportFilters] !==
          effective[dimension as keyof ReportFilters],
      )
      .map(([, label]) => text(label[0], label[1]))
      .join(" · ");
  };
  const evidence = (
    title: string,
    titleBn: string,
    key: ReportKey,
    columns = ["amount"],
  ) => (
    <ReportEvidencePanel
      title={title}
      titleBn={titleBn}
      note={[
        scopeNote(key),
        key === "expiry"
          ? text(
              "Negative days mean expired; positive days mean time remaining.",
              "ঋণাত্মক দিন মানে মেয়াদ পেরিয়েছে; ধনাত্মক দিন মানে মেয়াদ বাকি।",
            )
          : "",
      ]
        .filter(Boolean)
        .join(" · ")}
      rows={
        results[key]?.rows ??
        runReport(key, data, filtersForAnalysisReport(key, filters, screen))
          .rows
      }
      columns={columns}
      onDetail={onDetail}
      onOpen={() =>
        onReport(key, filtersForAnalysisReport(key, filters, screen))
      }
    />
  );
  const metrics = (
    items: {
      en: string;
      bn: string;
      value: number | null;
      key: ReportKey;
      field?: string;
      tone?: string;
      money?: boolean;
    }[],
  ) => (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {items.map((item) => (
        <button
          type="button"
          data-analysis-metric={item.key}
          key={item.en}
          className="min-w-0 rounded-xl border border-border bg-card p-4 text-left hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={() =>
            onDetail({
              id: "metric-" + item.key,
              label: [text(item.en, item.bn), scopeNote(item.key)]
                .filter(Boolean)
                .join(" · "),
              note: scopeNote(item.key) || undefined,
              date: data.asOf,
              status: "Demo data",
              values: {
                [item.field ?? (item.money === false ? "count" : "amount")]:
                  item.value,
              },
              children:
                results[item.key]?.rows ??
                runReport(
                  item.key,
                  data,
                  filtersForAnalysisReport(item.key, filters, screen),
                ).rows,
            })
          }
        >
          <span className="block text-xs text-ink-500">
            {text(item.en, item.bn)}
          </span>
          {scopeNote(item.key) && (
            <span className="mt-1 block text-[11px] text-helper">
              {scopeNote(item.key)}
            </span>
          )}
          <span
            className={
              "mt-1 block break-words text-[22px] font-semibold " +
              (item.tone ?? "text-ink")
            }
          >
            {item.value === null
              ? "—"
              : item.money === false
                ? formatNumber(item.value)
                : taka(item.value)}
          </span>
          <span className="mt-1 flex items-center gap-1 text-[11px] text-ink-500">
            {text("View supporting records", "মূল রেকর্ড দেখুন")}
            <ArrowRight className="size-3" aria-hidden="true" />
          </span>
        </button>
      ))}
    </div>
  );
  if (screen === "advisor") return <AdvisorReport {...props} />;
  if (screen === "cashflow")
    return <CashflowReport {...props} key={scopeKey} />;
  if (screen === "sales")
    return (
      <div className="space-y-4">
        {metrics([
          {
            en: "Recorded sales",
            bn: "লেখা বিক্রয়",
            value: results["sales-register"].totals.amount,
            key: "sales-register",
          },
          {
            en: "Gross profit",
            bn: "মোট লাভ",
            value: results["product-profit"].rows.length
              ? results["product-profit"].totals.profit
              : null,
            key: "product-profit",
            field: "profit",
            tone: "text-success",
          },
          {
            en: "Recorded returns",
            bn: "লেখা ফেরত",
            value: results["sales-returns"].totals.amount,
            key: "sales-returns",
            tone: "text-danger",
          },
          {
            en: "Discounts given",
            bn: "দেওয়া ছাড়",
            value: results.discounts.totals.discount,
            key: "discounts",
            field: "discount",
          },
        ])}
        <ReportSalesTrend
          rows={results["sales-register"].rows}
          onDetail={onDetail}
        />
        <div className="grid gap-4 xl:grid-cols-2">
          {evidence("Product contribution", "পণ্যের অবদান", "product-sales", [
            "amount",
            "quantity",
          ])}
          {evidence("Category contribution", "খাতের অবদান", "category-sales")}
        </div>
        <p className="text-xs text-ink-500">
          {text(
            "Gross profit uses sale-time costs before returns and operating expenses. Missing costs remain unknown.",
            "মোট লাভ বিক্রয়ের সময়ের খরচে, ফেরত ও পরিচালন খরচের আগে। অনুপস্থিত খরচ অজানাই থাকে।",
          )}
        </p>
      </div>
    );
  if (screen === "stock")
    return (
      <div className="space-y-4">
        {metrics([
          {
            en: "Stock value",
            bn: "স্টকের মূল্য",
            value: results.stock.totals.cost,
            key: "stock",
            field: "cost",
          },
          {
            en: "Low stock products",
            bn: "কম স্টকের পণ্য",
            value: results["low-stock"].rows.length,
            key: "low-stock",
            money: false,
            tone: "text-warning",
          },
          {
            en: "Expiry batches",
            bn: "মেয়াদযুক্ত ব্যাচ",
            value: results.expiry.rows.length,
            key: "expiry",
            money: false,
          },
          {
            en: "Products with no sales",
            bn: "বিক্রয়হীন পণ্য",
            value: results["stock-velocity"].rows.filter(
              (r) => r.values.quantity === 0,
            ).length,
            key: "stock-velocity",
            money: false,
          },
        ])}
        <div className="grid gap-4 xl:grid-cols-2">
          {evidence(
            "Stock needing attention",
            "নজর দেওয়ার স্টক",
            "low-stock",
            ["stock", "minStock"],
          )}
          {evidence(
            "Batch expiry evidence",
            "ব্যাচের মেয়াদের তথ্য",
            "expiry",
            ["quantity", "expiryDays"],
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => onScreen("buying")}>
            {text("Review buying suggestions", "ক্রয়ের পরামর্শ দেখুন")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="outline" onClick={() => onReport("stock-movements")}>
            {text("Stock movements", "স্টকের চলাচল")}
          </Button>
          <Button variant="outline" onClick={() => onReport("stock-ageing")}>
            {text("Stock ageing", "স্টকের বয়স")}
          </Button>
        </div>
      </div>
    );
  if (screen === "dues")
    return (
      <div className="space-y-4">
        {metrics([
          {
            en: "Customer receivable",
            bn: "গ্রাহকের কাছে পাবো",
            value: results.receivables.totals.due,
            key: "receivables",
            field: "due",
            tone: "text-success",
          },
          {
            en: "Supplier payable",
            bn: "সরবরাহকারীকে দেবো",
            value: results.payables.totals.due,
            key: "payables",
            field: "due",
            tone: "text-danger",
          },
          {
            en: "Unpaid sales invoices",
            bn: "বাকি বিক্রয় বিল",
            value: results.receivables.rows.length,
            key: "receivables",
            money: false,
          },
          {
            en: "Unpaid supplier bills",
            bn: "বাকি ক্রয় বিল",
            value: results.payables.rows.length,
            key: "payables",
            money: false,
          },
        ])}
        <div className="grid gap-4 xl:grid-cols-2">
          {evidence(
            "Collection priority",
            "আদায়ের অগ্রাধিকার",
            "collections",
            ["due", "days"],
          )}
          {evidence(
            "Supplier bills to review",
            "সরবরাহকারীর বাকি বিল",
            "payables",
            ["due", "days"],
          )}
        </div>
        <p className="text-xs text-ink-500">
          {text(
            "Current outstanding balances. Days means invoice age, not contractual overdue days. Open a source to inspect its ledger.",
            "বর্তমান বাকি। দিন মানে বিলের বয়স, চুক্তির মেয়াদ পেরোনো দিন নয়। খাতা দেখতে মূল রেকর্ড খুলুন।",
          )}
        </p>
      </div>
    );
  if (screen === "money")
    return (
      <div className="space-y-4">
        {metrics([
          {
            en: "Recorded money in",
            bn: "লেখা টাকা এসেছে",
            value: results["cash-book"].totals.inflow,
            key: "cash-book",
            field: "inflow",
            tone: "text-success",
          },
          {
            en: "Recorded money out",
            bn: "লেখা টাকা গেছে",
            value: results["cash-book"].totals.outflow,
            key: "cash-book",
            field: "outflow",
            tone: "text-danger",
          },
          {
            en: "Recorded expenses",
            bn: "লেখা খরচ",
            value: results.expenses.totals.amount,
            key: "expenses",
          },
          {
            en: "Unpaid expenses",
            bn: "বাকি খরচ",
            value: results.expenses.totals.due,
            key: "expenses",
            field: "due",
          },
        ])}
        <div className="grid gap-4 xl:grid-cols-2">
          {evidence("Expense categories", "খরচের খাত", "expense-categories")}
          {evidence("Recent expense sources", "সাম্প্রতিক খরচ", "expenses", [
            "amount",
            "paid",
          ])}
        </div>
        <p className="text-xs text-ink-500">
          {text(
            "Recorded payments are movements, not reconciled account balances. Transfers are shown separately in Finance movements.",
            "লেখা পেমেন্ট টাকার চলাচল, মিলিয়ে নেওয়া অ্যাকাউন্টের জের নয়। স্থানান্তর আর্থিক লেনদেনে আলাদা দেখুন।",
          )}
        </p>
      </div>
    );
  if (screen === "profit") {
    const rows = results["product-profit"].rows,
      known = rows.filter((r) => typeof r.values.profit === "number"),
      points = known
        .filter((row) => typeof row.values.margin === "number")
        .map((row) => ({
          revenue: Number(row.values.amount),
          margin: Number(row.values.margin ?? 0),
          row,
        }));
    return (
      <div className="space-y-4">
        {metrics([
          {
            en: "Revenue with known cost",
            bn: "খরচ জানা বিক্রয়",
            value: known.reduce((s, r) => s + Number(r.values.amount), 0),
            key: "product-profit",
          },
          {
            en: "Gross profit",
            bn: "মোট লাভ",
            value: rows.length ? results["product-profit"].totals.profit : null,
            key: "product-profit",
            field: "profit",
            tone: "text-success",
          },
          {
            en: "Cost coverage (%)",
            bn: "খরচের তথ্য আছে (%)",
            value: rows.length
              ? Math.round((known.length / rows.length) * 100)
              : null,
            key: "product-profit",
            money: false,
          },
          {
            en: "Operating expenses",
            bn: "পরিচালন খরচ",
            value: results.expenses.totals.amount,
            key: "expenses",
            tone: "text-danger",
          },
        ])}
        <Panel
          title={text("Revenue and margin", "বিক্রয় ও লাভের হার")}
          subtitle={text(
            "Known historical costs only · horizontal: sales (BDT), vertical: gross margin (%)",
            "শুধু ঐতিহাসিক খরচ জানা পণ্য · অনুভূমিক: বিক্রয়, উল্লম্ব: লাভের হার",
          )}
          actions={
            <Button
              variant="outline"
              onClick={() => onReport("product-profit")}
            >
              {text("View source table", "মূল টেবিল দেখুন")}
            </Button>
          }
        >
          {points.length ? (
            <div
              className="h-[230px]"
              role="img"
              aria-label={text(
                "Product revenue and gross margin scatter; exact values and sources are in the table below.",
                "পণ্যের বিক্রয় ও লাভের হার; নিচের টেবিলে সঠিক মান ও মূল তথ্য আছে।",
              )}
            >
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart
                  margin={{ left: 0, right: 16, bottom: 8, top: 8 }}
                >
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="revenue"
                    name={text("Sales", "বিক্রয়")}
                    tickFormatter={takaCompact}
                    tick={{ fill: "var(--helper)", fontSize: 11 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="margin"
                    name={text("Gross margin", "মোট লাভের হার")}
                    unit="%"
                    tick={{ fill: "var(--helper)", fontSize: 11 }}
                  />
                  <ZAxis range={[50, 50]} />
                  <Tooltip
                    contentStyle={chartStyle}
                    formatter={(value: number, name: string) => [
                      name === text("Sales", "বিক্রয়")
                        ? taka(value)
                        : formatNumber(value) + "%",
                      name,
                    ]}
                  />
                  <ReferenceLine y={0} stroke="var(--helper)" />
                  <Scatter
                    data={points}
                    fill="var(--primary)"
                    isAnimationActive={false}
                    onClick={(point) => point.row && onDetail(point.row)}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="py-12 text-center text-sm text-ink-500">
              {text(
                "Known historical costs are needed to plot margin.",
                "লাভের হার দেখাতে ঐতিহাসিক খরচ দরকার।",
              )}
            </p>
          )}
        </Panel>
        <p className="text-xs text-ink-500">
          {text(
            "This is product gross profit, before returns and expenses; it is not a complete Profit & Loss statement. “—” means unknown cost.",
            "এটি ফেরত ও খরচের আগের পণ্যের মোট লাভ; পূর্ণ লাভ-ক্ষতির বিবরণী নয়। “—” মানে খরচ অজানা।",
          )}
        </p>
      </div>
    );
  }
  if (screen === "buying")
    return (
      <div className="space-y-4">
        <div className="grid gap-4 xl:grid-cols-2">
          {evidence(
            "Compare recorded supplier prices",
            "সংরক্ষিত সরবরাহকারীর দাম",
            "purchase-prices",
            ["unitCost", "amount"],
          )}
          {evidence(
            "Supplier purchase history",
            "সরবরাহকারীর ক্রয়ের ইতিহাস",
            "supplier-purchases",
            ["amount", "due"],
          )}
        </div>
        <p className="rounded-lg bg-info-bg p-3 text-xs leading-5 text-info">
          {text(
            "Review the buying assumptions below, inspect each suggested quantity, then download the purchase list. Saved plans, supplier orders and receiving will arrive in the connected purchasing slice. No order is created by downloading a list.",
            "নিচে ক্রয়ের অনুমান ও প্রতিটি পরিমাণ দেখুন, তারপর তালিকা নামান। সংরক্ষিত পরিকল্পনা, সরবরাহকারীর অর্ডার ও পণ্য গ্রহণ পরের সংযুক্ত ক্রয় ধাপে আসবে। তালিকা নামালে অর্ডার তৈরি হয় না।",
          )}
        </p>
      </div>
    );
  if (screen === "customers")
    return (
      <div className="space-y-4">
        {metrics([
          {
            en: "Customers in selection",
            bn: "নির্বাচিত সময়ের গ্রাহক",
            value: results["customer-sales"].rows.length,
            key: "customer-sales",
            money: false,
          },
          {
            en: "Customer sales",
            bn: "গ্রাহকের বিক্রয়",
            value: results["customer-sales"].totals.amount,
            key: "customer-sales",
          },
          {
            en: "Current receivable",
            bn: "বর্তমান পাওনা",
            value: results.receivables.totals.due,
            key: "receivables",
            field: "due",
            tone: "text-success",
          },
          {
            en: "Unpaid invoices",
            bn: "বাকি বিল",
            value: results.receivables.rows.length,
            key: "receivables",
            money: false,
          },
        ])}
        <div className="grid gap-4 xl:grid-cols-2">
          {evidence(
            "Customer contribution",
            "গ্রাহকের অবদান",
            "customer-sales",
            ["amount", "count"],
          )}
          {evidence(
            "Follow-up evidence",
            "খোঁজ নেওয়ার মূল তথ্য",
            "collections",
            ["due", "days"],
          )}
        </div>
        <p className="text-xs text-ink-500">
          {text(
            "Cadence and inactivity need comparable customer history. No inactivity date or credit score is inferred from missing records.",
            "কেনার নিয়ম ও নিষ্ক্রিয়তা বুঝতে তুলনাযোগ্য ইতিহাস দরকার। অনুপস্থিত তথ্য থেকে নিষ্ক্রিয়তার তারিখ বা ক্রেডিট স্কোর বানানো হয় না।",
          )}
        </p>
      </div>
    );
  return null;
}
