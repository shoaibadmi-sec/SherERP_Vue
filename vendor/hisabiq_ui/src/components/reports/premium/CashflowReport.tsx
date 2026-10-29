import { useState } from "react";
import { Button } from "../../Button";
import { Panel } from "../../Panel";
import { StatusBadge } from "../../StatusBadge";
import { useUiCopy } from "../../../i18n/useUiCopy";
import { formatNumber } from "../../../utils/currency";
import type { ReportAnalysisProps as Props } from "../ReportAnalysis";
import { Check } from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Input } from "../../Input";
import { runReport } from "../../../reports/model";
import {
  runCashScenario,
  type CashScenarioInput,
} from "../../../reports/analysis";
import { taka, takaCompact } from "../../../utils/currency";
import { ReportEvidencePanel } from "../ReportEvidencePanel";
const chartStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--foreground)",
  fontSize: 12,
};
const initialScenario: CashScenarioInput = {
  opening: 25000,
  dailyIn: 5000,
  dailyOut: 4200,
  buffer: 10000,
  collection: 12000,
  collectionDay: 7,
  purchase: 45000,
  purchaseDay: 14,
};
export function CashflowReport({ data, filters, onDetail, scopeKey }: Props) {
  const { text } = useUiCopy();
  const [input, setInput] = useState<CashScenarioInput>(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(scopeKey + ":scenario") ?? "null",
      );
      if (
        saved &&
        Object.keys(initialScenario).every((k) => typeof saved[k] === "number")
      ) {
        runCashScenario(saved);
        return saved;
      }
    } catch {
      /* Invalid saved assumptions fall back to editable defaults. */
    }
    return initialScenario;
  });
  const [saved, setSaved] = useState(false),
    [warning, setWarning] = useState("");
  const [forecast, setForecast] = useState(() => runCashScenario(input));
  const [invalidField, setInvalidField] = useState<
    keyof CashScenarioInput | null
  >(null);
  const change = (
    next: CashScenarioInput,
    field: keyof CashScenarioInput | null,
  ) => {
    setInput(next);
    setSaved(false);
    try {
      const computed = runCashScenario(next);
      setForecast(computed);
      setInvalidField(null);
    } catch {
      setInvalidField(field ?? "opening");
    }
  };
  const low = forecast.find((row) => row.balance < row.buffer),
    recorded = runReport("cash-book", data, filters);
  const fields: { key: keyof CashScenarioInput; en: string; bn: string }[] = [
    {
      key: "opening",
      en: "Assumed opening cash (BDT)",
      bn: "অনুমিত শুরুর টাকা",
    },
    {
      key: "dailyIn",
      en: "Expected daily money in (BDT)",
      bn: "প্রতিদিন আসবে",
    },
    {
      key: "dailyOut",
      en: "Expected daily money out (BDT)",
      bn: "প্রতিদিন যাবে",
    },
    { key: "buffer", en: "Minimum buffer (BDT)", bn: "সর্বনিম্ন সঞ্চিত টাকা" },
    {
      key: "collection",
      en: "Planned collection (BDT)",
      bn: "পরিকল্পিত আদায়",
    },
    {
      key: "collectionDay",
      en: "Collection day (1–30)",
      bn: "আদায়ের দিন (১–৩০)",
    },
    { key: "purchase", en: "Planned purchase (BDT)", bn: "পরিকল্পিত ক্রয়" },
    { key: "purchaseDay", en: "Purchase day (1–30)", bn: "ক্রয়ের দিন (১–৩০)" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge tone="info">
          {text("Illustrative · 30-day what-if", "উদাহরণ · ৩০ দিনের অনুমান")}
        </StatusBadge>
        <p className="text-xs text-ink-500">
          {text(
            "Editable illustrative assumptions. No payment, purchase or ledger entry is created.",
            "সম্পাদনাযোগ্য উদাহরণ অনুমান। কোনো পেমেন্ট, ক্রয় বা হিসাব তৈরি হয় না।",
          )}
        </p>
      </div>
      <Panel
        title={text("Cash assumptions", "টাকার অনুমান")}
        subtitle={text(
          "Opening cash is an explicit assumption, not a reconstructed account balance.",
          "শুরুর টাকা আপনার অনুমান, পুনর্গঠিত অ্যাকাউন্টের জের নয়।",
        )}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {fields.map((field) => (
            <div key={field.key} className="space-y-1 text-xs text-ink-600">
              <label htmlFor={"report-scenario-" + field.key} className="block">
                {text(field.en, field.bn)}
              </label>
              <Input
                id={"report-scenario-" + field.key}
                aria-label={text(field.en, field.bn)}
                aria-invalid={invalidField === field.key}
                aria-describedby={
                  invalidField === field.key ? "scenario-error" : undefined
                }
                type="number"
                min={
                  field.key === "opening"
                    ? -Number.MAX_SAFE_INTEGER / 100
                    : field.key.endsWith("Day")
                      ? 1
                      : 0
                }
                max={field.key.endsWith("Day") ? 30 : undefined}
                value={input[field.key]}
                onChange={(event) => {
                  const value = Number(event.target.value);
                  if (Number.isFinite(value)) {
                    change(
                      {
                        ...input,
                        [field.key]: field.key.endsWith("Day")
                          ? Math.max(1, Math.min(30, Math.round(value)))
                          : field.key === "opening"
                            ? value
                            : Math.max(0, value),
                      },
                      field.key,
                    );
                  }
                }}
              />
            </div>
          ))}
        </div>
        {invalidField && (
          <p
            data-scenario-error=""
            id="scenario-error"
            role="alert"
            className="mt-3 text-xs text-danger"
          >
            {text(
              "The amounts are too large to calculate safely. Reduce them; the chart retains your last valid scenario.",
              "এত বড় পরিমাণ নির্ভুলভাবে হিসাব করা যাচ্ছে না। কমিয়ে লিখুন; চার্টে আগের সঠিক অনুমান আছে।",
            )}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button
            disabled={invalidField !== null}
            onClick={() => {
              try {
                localStorage.setItem(
                  scopeKey + ":scenario",
                  JSON.stringify(input),
                );
                setWarning("");
                setSaved(true);
              } catch {
                setWarning(
                  text(
                    "Storage unavailable. Your scenario remains in this session.",
                    "সংরক্ষণ করা যাচ্ছে না। অনুমান এই সেশনে থাকবে।",
                  ),
                );
              }
            }}
          >
            {saved ? <Check className="size-4" aria-hidden="true" /> : null}
            {saved
              ? text("Scenario saved", "অনুমান সংরক্ষিত")
              : text("Save scenario", "অনুমান সংরক্ষণ")}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              change(initialScenario, null);
            }}
          >
            {text("Reset assumptions", "অনুমান রিসেট")}
          </Button>
          {warning && (
            <p role="status" className="text-xs text-warning">
              {warning}
            </p>
          )}
        </div>
      </Panel>
      <Panel
        title={text("Modeled cash position", "অনুমিত টাকার অবস্থা")}
        subtitle={text(
          "BDT · days after the as-of date · illustrative, not a prediction",
          "টাকা · বর্তমান তারিখের পরের দিন · উদাহরণ, ভবিষ্যদ্বাণী নয়",
        )}
      >
        <ul
          aria-label={text("Cash chart legend", "টাকার চার্টের পরিচয়")}
          className="mb-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-600"
        >
          <li className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 w-2 bg-success" />
            {text("Money in · bars", "জমা · বার")}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span aria-hidden="true" className="h-3 w-2 bg-danger" />
            {text("Money out · bars", "খরচ · বার")}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="w-4 border-t-2 border-primary"
            />
            {text("Modeled balance · line", "অনুমিত জের · রেখা")}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="w-4 border-t-2 border-dashed border-warning"
            />
            {text("Minimum buffer · dashed", "সর্বনিম্ন সঞ্চিত · দাগরেখা")}{" "}
            {taka(forecast[0].buffer)}
          </li>
        </ul>
        <div
          className="h-[260px]"
          role="img"
          aria-label={text(
            "Illustrative cash balance with inflow and outflow bars. Weekly exact values follow.",
            "উদাহরণ টাকার জের, আসা ও যাওয়ার বার। নিচে সাপ্তাহিক সঠিক মান আছে।",
          )}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={forecast}
              margin={{ left: 0, right: 8, top: 10, bottom: 0 }}
            >
              <CartesianGrid
                stroke="var(--border)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "var(--helper)", fontSize: 11 }}
              />
              <YAxis
                tickFormatter={takaCompact}
                tick={{ fill: "var(--helper)", fontSize: 11 }}
                width={64}
              />
              <Tooltip
                formatter={(value: number) => taka(value)}
                contentStyle={chartStyle}
              />
              <Bar
                dataKey="inflow"
                name={text("Money in", "টাকা এসেছে")}
                fill="var(--success)"
                isAnimationActive={false}
              />
              <Bar
                dataKey="outflow"
                name={text("Money out", "টাকা গেছে")}
                fill="var(--danger)"
                isAnimationActive={false}
              />
              <Line
                type="linear"
                dataKey="balance"
                name={text("Modeled balance", "অনুমিত জের")}
                stroke="var(--primary)"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />
              <ReferenceLine
                y={forecast[0].buffer}
                stroke="var(--warning)"
                strokeDasharray="5 4"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p
          className={"mt-2 text-xs " + (low ? "text-warning" : "text-ink-500")}
        >
          {low
            ? text(
                "Below your buffer on modeled day ",
                "অনুমিত দিনে সঞ্চিত টাকার নিচে ",
              ) + formatNumber(low.day)
            : text(
                "The modeled balance stays above the chosen buffer.",
                "অনুমিত জের নির্বাচিত সঞ্চিত টাকার উপরে থাকে।",
              )}
        </p>
      </Panel>
      <ReportEvidencePanel
        title="Weekly scenario checkpoints"
        titleBn="সাপ্তাহিক অনুমানের অবস্থা"
        note={text(
          "Flows are cumulative through each day; closing balance includes the assumed opening cash.",
          "প্রতিদিন পর্যন্ত মোট জমা ও খরচ; শেষ জেরে অনুমিত শুরুর টাকা অন্তর্ভুক্ত।",
        )}
        rows={[7, 14, 21, 28, 30].map((day) => ({
          id: "scenario-" + day,
          label: text("Day ", "দিন ") + formatNumber(day),
          date: data.asOf,
          status: "Illustrative",
          values: {
            scenarioInflow: forecast
              .slice(0, day)
              .reduce((s, r) => s + r.inflow, 0),
            scenarioOutflow: forecast
              .slice(0, day)
              .reduce((s, r) => s + r.outflow, 0),
            scenarioBalance: forecast[day - 1].balance,
          },
          note: text(
            "Modeled from your explicit assumptions; no source posting.",
            "আপনার অনুমান থেকে হিসাব; কোনো মূল লেনদেন হয়নি।",
          ),
        }))}
        columns={["scenarioInflow", "scenarioOutflow", "scenarioBalance"]}
        onDetail={onDetail}
      />
      <ReportEvidencePanel
        title="Recorded payment evidence"
        titleBn="সংরক্ষিত পেমেন্টের মূল তথ্য"
        rows={recorded.rows}
        columns={["inflow", "outflow"]}
        onDetail={onDetail}
      />
    </div>
  );
}
