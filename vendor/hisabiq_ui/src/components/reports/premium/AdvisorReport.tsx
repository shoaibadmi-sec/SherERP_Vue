import { useMemo, useState } from "react";
import { Button } from "../../Button";
import { Panel } from "../../Panel";
import { StatusBadge } from "../../StatusBadge";
import { useUiCopy } from "../../../i18n/useUiCopy";
import { formatNumber } from "../../../utils/currency";
import type { ReportAnalysisProps as Props } from "../ReportAnalysis";
import { ArrowRight, ChevronDown, RotateCcw } from "lucide-react";
import { deriveReportInsights } from "../../../reports/analysis";
export function AdvisorReport({
  data,
  filters,
  onDetail,
  onReport,
  onScreen,
  scopeKey,
}: Props) {
  const { text } = useUiCopy(),
    insights = useMemo(
      () => deriveReportInsights(data, filters),
      [data, filters],
    );
  const [all, setAll] = useState(false),
    [reviewed, setReviewed] = useState<string[]>([]);
  const [hidden, setHidden] = useState<string[]>(() => {
      try {
        const parsed = JSON.parse(
          localStorage.getItem(scopeKey + ":advisor") ?? "[]",
        );
        return Array.isArray(parsed)
          ? parsed.filter((i: unknown): i is string => typeof i === "string")
          : [];
      } catch {
        return [];
      }
    }),
    [warning, setWarning] = useState("");
  const save = (next: string[]) => {
    setHidden(next);
    try {
      localStorage.setItem(scopeKey + ":advisor", JSON.stringify(next));
    } catch {
      setWarning(
        text(
          "Preferences are kept for this session only.",
          "পছন্দ শুধু এই সেশনে থাকবে।",
        ),
      );
    }
  };
  const active = insights.filter(
      (i) => !hidden.includes(i.id + ":" + i.sourceVersion),
    ),
    shown = all ? active : active.slice(0, 3);
  return (
    <div className="space-y-4">
      <section className="rounded-xl bg-inverse p-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">
              {text(
                "A clearer next step for your business",
                "ব্যবসার পরের পদক্ষেপ বুঝুন",
              )}
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
              {text(
                "Review source evidence before buying, collecting or changing a price. These suggestions describe the current demo records.",
                "কেনাকাটা, আদায় বা দাম বদলানোর আগে মূল তথ্য দেখুন। এই পরামর্শ বর্তমান ডেমো রেকর্ডের ভিত্তিতে।",
              )}
            </p>
          </div>
          <span className="rounded-md bg-mint px-2 py-1 text-xs font-medium text-[#0B1A2C]">
            {text("Demo analysis", "ডেমো বিশ্লেষণ")}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-2xl font-semibold text-mint">
            {formatNumber(active.length)}
          </span>
          <span className="text-sm text-white/90">
            {text("areas to review", "বিষয় পর্যালোচনা করুন")}
          </span>
          <Button
            variant="outline"
            className="ml-auto"
            onClick={() => onReport("data-quality")}
          >
            {text("Check source completeness", "তথ্যের পূর্ণতা দেখুন")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </section>
      {warning && (
        <p role="status" className="text-xs text-warning">
          {warning}
        </p>
      )}
      {shown.map((insight) => (
        <Panel
          key={insight.id}
          title={text(insight.title, insight.titleBn)}
          actions={
            <StatusBadge
              tone={
                reviewed.includes(insight.id + ":" + insight.sourceVersion)
                  ? "info"
                  : "warning"
              }
            >
              {reviewed.includes(insight.id + ":" + insight.sourceVersion)
                ? text("Reviewed", "দেখা হয়েছে")
                : text("To review", "দেখতে হবে")}
            </StatusBadge>
          }
        >
          <dl className="grid gap-4 md:grid-cols-2">
            {[
              {
                en: "What happened",
                bn: "কী হয়েছে",
                value: insight.what,
                valueBn: insight.whatBn,
              },
              {
                en: "Why it matters",
                bn: "কেন দরকার",
                value: insight.why,
                valueBn: insight.whyBn,
              },
              {
                en: "What to do",
                bn: "কী করবেন",
                value: insight.action,
                valueBn: insight.actionBn,
              },
              {
                en: "How it helps",
                bn: "কী উপকার",
                value: insight.benefit,
                valueBn: insight.benefitBn,
              },
            ].map((item) => (
              <div key={item.en}>
                <dt className="text-xs font-medium text-ink-500">
                  {text(item.en, item.bn)}
                </dt>
                <dd className="mt-1 text-[13px] leading-5 text-ink">
                  {text(item.value, item.valueBn)}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              onClick={() =>
                insight.kind === "stock"
                  ? onScreen("buying")
                  : onReport(insight.report)
              }
            >
              {text(insight.action, insight.actionBn)}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setReviewed((current) => [
                  ...current,
                  insight.id + ":" + insight.sourceVersion,
                ]);
                onDetail({
                  id: "insight-" + insight.id,
                  label: text(insight.title, insight.titleBn),
                  date: data.asOf,
                  status: "Demo analysis",
                  values: { count: insight.sources.length },
                  note: text(insight.why, insight.whyBn),
                  children: insight.sources,
                });
              }}
            >
              {text("Sources & calculation", "মূল তথ্য ও হিসাব")}
              <span>({formatNumber(insight.sources.length)})</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                save([...hidden, insight.id + ":" + insight.sourceVersion])
              }
            >
              {text("Dismiss suggestion", "পরামর্শ সরান")}
            </Button>
          </div>
        </Panel>
      ))}
      {!shown.length && (
        <Panel>
          <p className="text-sm text-ink-500">
            {text(
              "No additional source-backed suggestions in this selection. Review the library for full details.",
              "এই ফিল্টারে আর তথ্যভিত্তিক পরামর্শ নেই। বিস্তারিত সব রিপোর্টে দেখুন।",
            )}
          </p>
        </Panel>
      )}
      <div className="flex flex-wrap gap-2">
        {active.length > 3 && (
          <Button
            variant="outline"
            aria-expanded={all}
            onClick={() => setAll((v) => !v)}
          >
            {all
              ? text("Show priority only", "শুধু অগ্রাধিকার")
              : text("Show all suggestions", "সব পরামর্শ দেখুন")}
            <ChevronDown className="size-4" aria-hidden="true" />
          </Button>
        )}
        {hidden.length > 0 && (
          <Button variant="outline" onClick={() => save([])}>
            <RotateCcw className="size-4" aria-hidden="true" />
            {text("Restore dismissed", "সরানো পরামর্শ ফেরান")}
          </Button>
        )}
      </div>
    </div>
  );
}
