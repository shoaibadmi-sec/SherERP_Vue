import { useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { Button } from "../components/Button";
import { MotionTabList, MotionTabIndicator } from "../motion/MotionTabList";
import { WorkspaceLibrary } from "../components/WorkspaceLibrary";
import { matchesSearch } from "../utils/fuzzySearch";

export type SettingsTab = { id: string; label: string; bn: string };

/** Party's desktop boundary; compact screens retain underline tabs. */
export function SettingsTabs({ items, value, onChange, label, id, panelId, secondary = false,
  language = "English + Bangla", libraryTitle, libraryGroup, libraryFooter, inline = false,
}: {
  items: readonly SettingsTab[]; value: string; onChange: (value: string) => void;
  label: string; id: string; panelId: string; secondary?: boolean; inline?: boolean; language?: string;
  libraryTitle?: string; libraryGroup?: string; libraryFooter?: string;
}) {
  const desktop = useMediaQuery("(min-width: 1024px)");
  const vertical = secondary && desktop && !inline;
  const [search, setSearch] = useState("");
  const text = (en: string, bn: string) => language === "Bangla" ? bn : en;
  const visible = vertical && search.trim() ? items.filter(item => matchesSearch(search, [item.label, item.bn])) : items;
  const focusId = visible.some(item => item.id === value) ? value : visible[0]?.id;
  const container = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  const [scroll, setScroll] = useState({ overflow: false, left: false, right: false });
  useLayoutEffect(() => {
    const viewport = list.current, wrapper = container.current;
    if (vertical || !viewport || !wrapper) return;
    const measure = () => {
      const next = {
        // Measure against the whole row, so controls disappear once all tabs fit.
        overflow: viewport.scrollWidth > wrapper.clientWidth + 1,
        left: viewport.scrollLeft > 1,
        right: viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 1,
      };
      setScroll(previous => previous.overflow === next.overflow && previous.left === next.left && previous.right === next.right ? previous : next);
    };
    const revealSelection = () => {
      const selected = viewport.querySelector<HTMLElement>('[aria-selected="true"]');
      if (selected) {
        const bounds = viewport.getBoundingClientRect(), tab = selected.getBoundingClientRect();
        if (tab.left < bounds.left) viewport.scrollLeft += tab.left - bounds.left;
        else if (tab.right > bounds.right) viewport.scrollLeft += tab.right - bounds.right;
      }
      measure();
    };
    revealSelection();
    const observer = new ResizeObserver(revealSelection);
    observer.observe(viewport);
    observer.observe(wrapper);
    if (viewport.firstElementChild) observer.observe(viewport.firstElementChild);
    viewport.addEventListener("scroll", measure, { passive: true });
    return () => { observer.disconnect(); viewport.removeEventListener("scroll", measure); };
  }, [value, vertical, language, items]);
  if (!items.length) return null;
  const tabs = <MotionTabList id={id} aria-label={label} aria-orientation={vertical ? "vertical" : "horizontal"}
    className={vertical ? "flex min-w-0 flex-col gap-0.5" : "flex min-w-max border-b border-border"}>
    {items.map(item => {
      const index = visible.findIndex(candidate => candidate.id === item.id);
      return <button key={item.id} type="button" role="tab" hidden={index < 0} id={`${id}-${item.id}`}
        aria-controls={panelId} aria-selected={value === item.id} tabIndex={focusId === item.id ? 0 : -1}
        data-settings-section={secondary ? undefined : item.id}
        onKeyDown={event => {
          const forward = vertical ? "ArrowDown" : "ArrowRight", back = vertical ? "ArrowUp" : "ArrowLeft";
          if (![forward, back, "Home", "End"].includes(event.key)) return;
          event.preventDefault();
          const next = event.key === "Home" ? 0 : event.key === "End" ? visible.length - 1
            : (index + (event.key === back ? -1 : 1) + visible.length) % visible.length;
          if (visible[next]) document.getElementById(`${id}-${visible[next].id}`)?.focus();
        }}
        onClick={() => { onChange(item.id); setSearch(""); }}
        className={vertical
          ? `h-9 w-full shrink-0 rounded-lg px-2 text-left text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${value === item.id ? "bg-teal-50 font-medium text-teal-700" : "text-ink-600 hover:bg-ink-50"}`
          : `relative shrink-0 whitespace-nowrap px-3 py-3 text-left text-[13px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring ${value === item.id ? "text-primary" : "text-ink-500 hover:text-ink"}`}>
        {text(item.label, item.bn)}
        {!vertical && language === "English + Bangla" && <span lang="bn" className={`ml-1 text-[11px] font-normal text-helper ${secondary ? "hidden" : "hidden md:inline"}`}>{item.bn}</span>}
        {!vertical && <MotionTabIndicator active={value === item.id} />}
      </button>;
    })}
  </MotionTabList>;
  const arrows = !vertical && scroll.overflow;
  return <div ref={container} className="flex min-w-0 items-center gap-1 self-start">
    {arrows && <Button type="button" variant="ghost" size="icon" className="shrink-0"
      aria-label={text(`Scroll ${label} left`, secondary ? "আগের উপ-সেটিং ট্যাব দেখুন" : "আগের সেটিং বিভাগ দেখুন")} aria-controls={id} disabled={!scroll.left}
      onClick={() => list.current?.scrollBy({ left: -Math.max(120, list.current.clientWidth * 0.75) })}>
      <ChevronLeft className="size-4" aria-hidden="true" />
    </Button>}
    <div ref={list} className="min-w-0 flex-1 overflow-x-auto scrollbar-thin" data-settings-navigation={secondary ? "subsections" : "sections"}>
    {vertical ? <WorkspaceLibrary title={libraryTitle ?? label} search={search} onSearch={setSearch}
      searchLabel={text("Find a setting", "সেটিং খুঁজুন")} placeholder={text("Find a setting…", "সেটিং খুঁজুন…")}
      footer={libraryFooter ?? text(`${items.length} settings · Changes stay in your draft until saved.`, `${items.length}টি সেটিং · সংরক্ষণের আগে পরিবর্তন খসড়ায় থাকে।`)}>
      {libraryGroup && !search && <p className="px-2 py-1 text-[11px] text-ink-500">{libraryGroup}</p>}
      {tabs}
      {!visible.length && <p role="status" className="p-2 text-xs text-ink-500">{text("No matching settings.", "মিলে এমন সেটিং নেই।")}</p>}
    </WorkspaceLibrary> : tabs}
    </div>
    {arrows && <Button type="button" variant="ghost" size="icon" className="shrink-0"
      aria-label={text(`Scroll ${label} right`, secondary ? "পরের উপ-সেটিং ট্যাব দেখুন" : "পরের সেটিং বিভাগ দেখুন")} aria-controls={id} disabled={!scroll.right}
      onClick={() => list.current?.scrollBy({ left: Math.max(120, list.current.clientWidth * 0.75) })}>
      <ChevronRight className="size-4" aria-hidden="true" />
    </Button>}
  </div>;
}
