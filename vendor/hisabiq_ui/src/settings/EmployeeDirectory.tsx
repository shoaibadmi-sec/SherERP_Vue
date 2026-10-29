import { AppDateRangePicker } from "../components/AppDateRangePicker";
import { formatDay } from "../utils/dateRange";
import { useId, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Columns3, SlidersHorizontal, Eye, Pencil, ChevronLeft, ChevronRight } from "lucide-react";
import { WorkspaceToolbar } from "../components/WorkspaceToolbar";
import { ColumnVisibilityEditor } from "../components/ColumnVisibilityEditor";
import { AppSelect } from "../components/AppSelect";
import { StatusBadge } from "../components/StatusBadge";
import { matchesSearch } from "../utils/fuzzySearch";
import { Button, Input, SettingsDialog } from "./ui";
import type { BusinessEmployee, TeamSettings } from "./model";

export function EmployeeDirectory({ value, canEdit, onAccess, onEdit, actions, language }: {
  value: TeamSettings; canEdit: boolean; onAccess: (employee: BusinessEmployee) => void;
  onEdit: (employee: BusinessEmployee) => void; actions: React.ReactNode; language: string;
}) {
  const text = (en: string, bn: string) => language === "Bangla" ? bn : en;
  const [search, setSearch] = useState(""), [status, setStatus] = useState(""), [role, setRole] = useState("");
  const [range, setRange] = useState({ from: "", to: "" });
  const [expanded, setExpanded] = useState(false), [columnsOpen, setColumnsOpen] = useState(false);
  const [page, setPage] = useState(1), [size, setSize] = useState(10);
  const [params, setParams] = useSearchParams();
  const filterId = useId();
  const columns = [
    { id: "name", label: text("Employee", "কর্মী") }, { id: "email", label: text("Email", "ইমেইল") },
    { id: "roles", label: text("Roles", "ভূমিকা") }, { id: "status", label: text("Status", "অবস্থা") },
    { id: "joined", label: text("Joined", "যোগদান") },
    { id: "actions", label: text("Actions", "কাজ") },
  ];
  const selected = params.has("employeeColumns") ? (params.get("employeeColumns") ?? "").split(",") : columns.map(c => c.id);
  const visible = (id: string) => id === "name" || id === "actions" || selected.includes(id);
  const setColumns = (next: string[]) => setParams(previous => {
    const copy = new URLSearchParams(previous); copy.set("employeeColumns", next.join(",")); return copy;
  }, { replace: true });
  const rows = value.employees.filter(e => (!range.from || (!!e.joinedDate && e.joinedDate >= range.from)) && (!range.to || (!!e.joinedDate && e.joinedDate <= range.to)) && (!status || e.active === (status === "active")) && (!role || e.roleIds.includes(role)) &&
    matchesSearch(search, [e.name, e.email, ...e.roleIds.map(id => value.roles.find(r => r.id === id)?.name ?? id)]));
  const totalPages = Math.max(1, Math.ceil(rows.length / size)), current = Math.min(page, totalPages);
  const shown = rows.slice((current - 1) * size, current * size);
  const active = Number(!!role) + Number(!!status);
  return <div className="space-y-4">
    <WorkspaceToolbar variant="plain" search={<Input type="search" aria-label={text("Search employees", "কর্মী খুঁজুন")} placeholder={text("Search employees, email or role…", "নাম, ইমেইল বা ভূমিকা খুঁজুন…")}
      value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />}
      details={<>
        {expanded && <div id={filterId} className="grid gap-3 border-t border-border pt-3 sm:grid-cols-2">
          <label className="space-y-1 text-xs text-ink-600">{text("Status", "অবস্থা")}<AppSelect label={text("Employee status", "কর্মীর অবস্থা")} value={status}
            options={[{ value: "", label: text("All statuses", "সব অবস্থা") }, { value: "active", label: text("Active", "সক্রিয়") }, { value: "disabled", label: text("Disabled", "নিষ্ক্রিয়") }]}
            onChange={v => { setStatus(v); setPage(1); }} /></label>
          <label className="space-y-1 text-xs text-ink-600">{text("Role", "ভূমিকা")}<AppSelect label={text("Employee role", "কর্মীর ভূমিকা")} value={role}
            options={[{ value: "", label: text("All roles", "সব ভূমিকা") }, ...value.roles.map(r => ({ value: r.id, label: r.name }))]}
            onChange={v => { setRole(v); setPage(1); }} /></label>
        </div>}
        {(search || active > 0 || range.from || range.to) && <div className="flex flex-wrap items-center gap-2 text-xs text-helper">
          <span role="status">{rows.length} {text("matching employees", "জন কর্মী পাওয়া গেছে")}</span>
          {role && <span>{value.roles.find(r => r.id === role)?.name}</span>}
          {status && <span>{status === "active" ? text("Active", "সক্রিয়") : text("Disabled", "নিষ্ক্রিয়")}</span>}
          <Button variant="ghost" onClick={() => { setSearch(""); setRole(""); setStatus(""); setRange({ from: "", to: "" }); setPage(1); }}>{text("Clear employee filters", "কর্মীর ফিল্টার মুছুন")}</Button>
        </div>}
      </>}>
      <AppDateRangePicker label={text("Employee joined date range", "কর্মীর যোগদানের সময়কাল")} value={range} onChange={next => { setRange(next); setPage(1); }} className="max-w-full" />
      <Button variant="outline" aria-expanded={expanded} aria-controls={filterId} onClick={() => setExpanded(v => !v)}><SlidersHorizontal className="size-4" aria-hidden="true" />{text("Filters", "ফিল্টার")}{active > 0 && ` (${active})`}</Button>
      <Button variant="outline" onClick={() => setColumnsOpen(true)}><Columns3 className="size-4" aria-hidden="true" />{text("Columns", "কলাম")}</Button>
      {actions}
    </WorkspaceToolbar>
    <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
      <h3 className="sr-only">{text("Employees", "কর্মী")} ({rows.length})</h3>
      <div className="overflow-x-auto focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" role="region" aria-label={text("Employees table", "কর্মীদের তালিকা")} tabIndex={0}>
        <table data-erp-table className="w-full text-left"><thead className="bg-background text-ink-600"><tr>
          {columns.filter(c => visible(c.id)).map(c => <th key={c.id} className={`px-3 py-2 ${c.id === "actions" ? "text-right" : ""}`}>{c.label}</th>)}
        </tr></thead><tbody>
          {shown.map(e => <tr key={e.id} className="border-t border-border">
            <td className="px-3 py-2"><button type="button" className="text-left font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" onClick={() => onAccess(e)}>{e.name}</button></td>
            {visible("email") && <td className="px-3 py-2">{e.email || "—"}</td>}
            {visible("roles") && <td className="px-3 py-2">{e.roleIds.map(id => value.roles.find(r => r.id === id)?.name ?? id).join(" · ")}</td>}
            {visible("status") && <td className="px-3 py-2"><StatusBadge tone={e.active ? "success" : "neutral"}>{e.active ? text("Active", "সক্রিয়") : text("Disabled", "নিষ্ক্রিয়")}</StatusBadge></td>}
            {visible("joined") && <td className="whitespace-nowrap px-3 py-2">{e.joinedDate ? formatDay(e.joinedDate) : text("Not recorded", "তথ্য নেই")}</td>}
            <td className="px-3 py-2"><div className="flex justify-end gap-2">
              <Button variant="ghost" aria-label={`View access for ${e.name}`} onClick={() => onAccess(e)}><Eye className="size-4" aria-hidden="true" /></Button>
              {canEdit && <Button variant="ghost" aria-label={`Edit employee ${e.name}`} onClick={() => onEdit(e)}><Pencil className="size-4" aria-hidden="true" /></Button>}
            </div></td>
          </tr>)}
          {!shown.length && <tr><td colSpan={columns.filter(c => visible(c.id)).length} className="p-6 text-center text-helper">{text("No matching employees.", "মিলে এমন কর্মী নেই।")}</td></tr>}
        </tbody></table>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-3 text-xs text-helper">
        <span>{rows.length ? (current - 1) * size + 1 : 0}–{Math.min(current * size, rows.length)} {text("of", "/")} {rows.length}</span>
        <div className="flex items-center gap-2"><AppSelect label={text("Employee rows per page", "প্রতি পাতায় কর্মী")} value={String(size)} className="w-20" options={[10, 25, 50].map(n => ({ value: String(n), label: String(n) }))} onChange={v => { setSize(Number(v)); setPage(1); }} />
          <Button variant="outline" aria-label={text("Previous employee page", "আগের পাতা")} disabled={current <= 1} onClick={() => setPage(current - 1)}><ChevronLeft className="size-4" /></Button>
          <span>{current} / {totalPages}</span>
          <Button variant="outline" aria-label={text("Next employee page", "পরের পাতা")} disabled={current >= totalPages} onClick={() => setPage(current + 1)}><ChevronRight className="size-4" /></Button>
        </div>
      </footer>
    </section>
    <SettingsDialog title={text("Employee columns", "কর্মীদের কলাম")} description={text("Choose the columns shown in this view. Employee identity and actions stay visible.", "কোন কলাম দেখাবেন বাছুন। নাম ও কাজের কলাম সবসময় থাকবে।")} open={columnsOpen} onClose={() => setColumnsOpen(false)}>
      <ColumnVisibilityEditor label={text("Employee columns", "কর্মীদের কলাম")} columns={columns} value={columns.filter(c => visible(c.id)).map(c => c.id)} required={["name", "actions"]} onChange={setColumns} />
      <div className="mt-4 flex justify-end gap-2"><Button variant="outline" onClick={() => setColumns(columns.map(c => c.id))}>{text("Reset columns", "কলাম আগের মতো করুন")}</Button><Button onClick={() => setColumnsOpen(false)}>{text("Done", "শেষ")}</Button></div>
    </SettingsDialog>
  </div>;
}
