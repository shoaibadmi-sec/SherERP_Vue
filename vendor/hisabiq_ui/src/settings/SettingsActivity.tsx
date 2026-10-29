import { useId, useState } from "react";
import { Columns3, SlidersHorizontal } from "lucide-react";
import { WorkspaceToolbar } from "../components/WorkspaceToolbar";
import { AppDateRangePicker } from "../components/AppDateRangePicker";
import { AppSelect } from "../components/AppSelect";
import { ColumnVisibilityEditor } from "../components/ColumnVisibilityEditor";
import { useUiCopy } from "../i18n/useUiCopy";
import { Button, Input, SettingsDialog } from "./ui";
import { sectionNames } from "./fields";
import type { SettingsEvent, SettingsSection } from "./model";

export function SettingsActivity({ events }: { events: SettingsEvent[] }) {
  const { text } = useUiCopy();
  const [search, setSearch] = useState(""), [section, setSection] = useState("");
  const [range, setRange] = useState({ from: "", to: "" });
  const [expanded, setExpanded] = useState(false), [columnsOpen, setColumnsOpen] = useState(false);
  const [visible, setVisible] = useState(["at", "actor", "section", "changes"]);
  const id = useId();
  const columns = [{ id: "at", label: text("When", "সময়") }, { id: "actor", label: text("Employee", "কর্মী") }, { id: "section", label: text("Section", "বিভাগ") }, { id: "changes", label: text("Changed fields", "পরিবর্তিত তথ্য") }];
  const sectionLabel = (key: string) => {
    const name = sectionNames[key as SettingsSection]; return name ? text(name.label, name.bn) : key;
  };
  const rows = events.filter(event => {
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(event.at));
    return (!range.from || day >= range.from) && (!range.to || day <= range.to) && (!section || section === event.section) &&
      [event.actor, sectionLabel(event.section), event.changes.join(" ")].join(" ").toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
  });
  const filtered = search || section || range.from || range.to;
  return <section role="region" aria-label={text("Settings activity", "সেটিংসের কার্যক্রম")} className="min-w-0 space-y-4">
    <WorkspaceToolbar search={<Input type="search" aria-label={text("Search settings activity", "সেটিংসের কার্যক্রম খুঁজুন")} placeholder={text("Search employee, section or changed field…", "কর্মী, বিভাগ বা পরিবর্তিত তথ্য খুঁজুন…")} value={search} onChange={e => setSearch(e.target.value)} />}
      details={<>
        {expanded && <div id={id} className="border-t border-border pt-3"><AppSelect label={text("Activity section", "কার্যক্রমের বিভাগ")} value={section} onChange={setSection} options={[{ value: "", label: text("All sections", "সব বিভাগ") }, ...[...new Set(events.map(e => e.section))].map(value => ({ value, label: sectionLabel(value) }))]} /></div>}
        {filtered && <div className="flex flex-wrap items-center gap-2 text-xs text-helper"><span role="status">{rows.length} {text("matching changes", "টি পরিবর্তন পাওয়া গেছে")}</span><Button variant="ghost" onClick={() => { setSearch(""); setSection(""); setRange({ from: "", to: "" }); }}>{text("Clear activity filters", "কার্যক্রমের ফিল্টার মুছুন")}</Button></div>}
      </>}>
      <AppDateRangePicker label={text("Settings activity date range", "সেটিংসের কার্যক্রমের সময়কাল")} value={range} onChange={setRange} className="max-w-full" />
      <Button variant="outline" aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(v => !v)}><SlidersHorizontal className="size-4" aria-hidden="true" />{text("Filters", "ফিল্টার")}{section && " (1)"}</Button>
      <Button variant="outline" onClick={() => setColumnsOpen(true)}><Columns3 className="size-4" aria-hidden="true" />{text("Columns", "কলাম")}</Button>
    </WorkspaceToolbar>
    <div className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3"><h3 className="text-sm font-medium">{text("Settings activity", "সেটিংসের কার্যক্রম")} ({rows.length})</h3><p className="text-xs text-helper">{text("Business settings changes · Asia/Dhaka", "ব্যবসার সেটিংসের পরিবর্তন · ঢাকা সময়")}</p></header>
      <div className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" tabIndex={0} role="region" aria-label={text("Settings activity table", "সেটিংসের কার্যক্রমের তালিকা")}>
        <table data-erp-table className="w-full text-left"><thead className="bg-background text-ink-600"><tr>{columns.filter(c => visible.includes(c.id)).map(c => <th key={c.id} className="px-3 py-2">{c.label}</th>)}</tr></thead>
          <tbody>{rows.map(event => <tr key={event.id} className="border-t border-border">
            <td className="whitespace-nowrap px-3 py-3">{new Date(event.at).toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" })}</td>
            {visible.includes("actor") && <td className="px-3 py-3">{event.actor}</td>}
            {visible.includes("section") && <td className="px-3 py-3">{sectionLabel(event.section)}</td>}
            {visible.includes("changes") && <td className="px-3 py-3 text-ink-500">{event.changes.join(", ")}</td>}
          </tr>)}{!rows.length && <tr><td colSpan={visible.length} className="p-6 text-center text-helper">{events.length ? text("No matching activity.", "মিলে এমন কার্যক্রম নেই।") : text("No settings changes yet. Your first saved change will appear here.", "এখনো কোনো পরিবর্তন নেই। প্রথম সংরক্ষিত পরিবর্তন এখানে দেখা যাবে।")}</td></tr>}</tbody>
        </table>
      </div>
    </div>
    <SettingsDialog title={text("Activity columns", "কার্যক্রমের কলাম")} description={text("Choose what appears in the activity table.", "কার্যক্রমের তালিকায় কোন কলাম থাকবে বাছুন।")} open={columnsOpen} onClose={() => setColumnsOpen(false)}>
      <ColumnVisibilityEditor label={text("Activity columns", "কার্যক্রমের কলাম")} columns={columns} value={visible} required={["at"]} onChange={setVisible} />
      <div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setVisible(columns.map(c => c.id))}>{text("Reset columns", "কলাম আগের মতো করুন")}</Button><Button onClick={() => setColumnsOpen(false)}>{text("Done", "শেষ")}</Button></div>
    </SettingsDialog>
  </section>;
}
