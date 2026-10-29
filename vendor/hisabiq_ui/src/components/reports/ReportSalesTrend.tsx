import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "../Button";
import { Panel } from "../Panel";
import { useUiCopy } from "../../i18n/useUiCopy";
import { taka, takaCompact } from "../../utils/currency";
import type { ReportRow } from "../../reports/types";

export function ReportSalesTrend({
  rows,
  onDetail,
  className,
}: {
  rows: ReportRow[];
  onDetail: (row: ReportRow) => void;
  className?: string;
}) {
  const { text } = useUiCopy();
  const days = new Map<string, ReportRow[]>();
  for (const row of rows) {
    const entries = days.get(row.date) ?? [];
    entries.push(row);
    days.set(row.date, entries);
  }
  const trend = [...days]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, children]) => ({
      date,
      amount:
        Math.round(
          children.reduce((sum, row) => sum + Number(row.values.amount), 0) *
            100,
        ) / 100,
      children,
    }));
  const evidence: ReportRow = {
    id: "sales-trend",
    label: text("Sales over time", "সময়ের সঙ্গে বিক্রয়"),
    date: "",
    status: "Demo data",
    values: { amount: trend.reduce((sum, row) => sum + row.amount, 0) },
    children: trend.map((day) => ({
      id: "day-" + day.date,
      label: day.date,
      date: day.date,
      status: "Demo data",
      values: { amount: day.amount },
      children: day.children,
    })),
  };
  return (
    <Panel
      className={className}
      title={text("Sales over time", "সময়ের সঙ্গে বিক্রয়")}
      subtitle={text(
        "Recorded sales · BDT · source dates in this selection",
        "লেখা বিক্রয় · টাকা · নির্বাচিত মূল তারিখ",
      )}
      actions={
        <Button
          variant="outline"
          disabled={!rows.length}
          onClick={() => onDetail(evidence)}
        >
          {text("Inspect trend records", "পরিবর্তনের মূল তথ্য")}
        </Button>
      }
    >
      {trend.length ? (
        <div
          role="img"
          aria-label={text(
            "Sales trend. Inspect trend records provides exact daily values and source invoices.",
            "বিক্রয়ের পরিবর্তন। মূল তথ্যে প্রতিদিনের সঠিক মান ও বিল আছে।",
          )}
          className="h-[250px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={trend}
              margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
              accessibilityLayer={false}
              onClick={(state) => {
                const point = state?.activePayload?.[0]?.payload;
                if (point)
                  onDetail({
                    id: "day-" + point.date,
                    label: point.date,
                    date: point.date,
                    status: "Demo data",
                    values: { amount: point.amount },
                    children: point.children,
                  });
              }}
            >
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => date.slice(5)}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "var(--helper)", fontSize: 11 }}
              />
              <YAxis
                tickFormatter={takaCompact}
                tickLine={false}
                axisLine={false}
                width={64}
                tick={{ fill: "var(--helper)", fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: number) => [
                  taka(value),
                  text("Recorded sales", "লেখা বিক্রয়"),
                ]}
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  color: "var(--foreground)",
                  fontSize: 12,
                }}
              />
              <Area
                dataKey="amount"
                type="linear"
                stroke="var(--primary)"
                fill="var(--primary)"
                fillOpacity={0.08}
                strokeWidth={2}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-[250px] items-center justify-center text-sm text-ink-500">
          {text("No sales in this period.", "এই সময়কালে বিক্রয় নেই।")}
        </div>
      )}
    </Panel>
  );
}
