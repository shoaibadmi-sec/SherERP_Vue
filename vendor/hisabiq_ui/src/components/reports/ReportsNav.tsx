import { Fragment, useEffect, useRef } from "react";
import { ChevronRight, Sparkles } from "lucide-react";
import { MotionTabIndicator, MotionTabList } from "../../motion/MotionTabList";
import { useUiCopy } from "../../i18n/useUiCopy";
import { reportScreens } from "../../reports/screens";
import type { ReportScreen } from "../../reports/types";

export function ReportsNav({
  value,
  onChange,
}: {
  value: ReportScreen;
  onChange: (screen: ReportScreen) => void;
}) {
  const { text, showHelper } = useUiCopy(),
    rail = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const selected = rail.current?.querySelector<HTMLElement>(
      '[aria-selected="true"]',
    );
    if (selected && rail.current) {
      const left = selected.offsetLeft - rail.current.offsetLeft;
      const end = left + selected.offsetWidth;
      if (left < rail.current.scrollLeft) rail.current.scrollLeft = left;
      else if (end > rail.current.scrollLeft + rail.current.clientWidth - 24)
        rail.current.scrollLeft = end - rail.current.clientWidth + 24;
    }
  }, [value]);
  return (
    <div className="relative border-b border-border">
      <div ref={rail} className="overflow-x-auto scroll-px-4 pr-8">
        <MotionTabList
          aria-label={text("Report destinations", "রিপোর্টের বিভাগ")}
          className="flex w-max min-w-full gap-1"
        >
          {reportScreens.map((item, index) => (
            <Fragment key={item.id}>
             {index > 0 && reportScreens[index-1].premium && !item.premium && <span aria-hidden="true" className="mx-1 my-2.5 w-px shrink-0 bg-border" />}
            <button
              type="button"
              id={"reports-screen-" + item.id}
              role="tab"
              aria-selected={value === item.id}
              aria-controls="reports-screen-panel"
              tabIndex={value === item.id ? 0 : -1}
              onClick={() => onChange(item.id)}
              onKeyDown={(event) => {
                if (
                  ["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)
                ) {
                  event.preventDefault();
                  const next =
                    event.key === "Home"
                      ? 0
                      : event.key === "End"
                        ? reportScreens.length - 1
                        : (index +
                            (event.key === "ArrowRight" ? 1 : -1) +
                            reportScreens.length) %
                          reportScreens.length;
                  onChange(reportScreens[next].id);
                  document
                    .getElementById("reports-screen-" + reportScreens[next].id)
                    ?.focus();
                }
              }}
              className={
                "relative flex min-h-9 shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary " +
                (value === item.id
                  ? "text-primary"
                  : "text-ink-500 hover:text-ink")
              }
            >
              {item.premium && <Sparkles className="size-3 text-primary" aria-hidden="true" />}
              <span>{text(item.en, item.bn)}</span>
              {showHelper && <span className="hidden font-bn text-[11px] font-normal text-ink-500 xl:inline">{item.bn}</span>}
              <MotionTabIndicator active={value === item.id} />
            </button>
            </Fragment>
          ))}
        </MotionTabList>
      </div>
      <ChevronRight
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-2 size-5 bg-background text-helper"
      />
    </div>
  );
}
