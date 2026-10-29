import React, { useEffect, useRef, useState } from "react";
import { Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import * as buttons from "../components/Button";
import * as inputs from "../components/Input";
import * as tables from "../components/Table";
// The generated design bundle has no declarations; type its existing primitives at this boundary.
export const { Button } = buttons as unknown as {
  Button: React.ComponentType<
    React.ButtonHTMLAttributes<HTMLButtonElement> & {
      variant?: string;
      size?: string;
    }
  >;
};
export const { Input } = inputs as unknown as {
  Input: React.ComponentType<React.InputHTMLAttributes<HTMLInputElement>>;
};
const { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } =
  tables as unknown as {
    Table: React.ComponentType<React.HTMLAttributes<HTMLTableElement>>;
    TableBody: React.ComponentType<
      React.HTMLAttributes<HTMLTableSectionElement>
    >;
    TableCell: React.ComponentType<
      React.TdHTMLAttributes<HTMLTableCellElement>
    >;
    TableHead: React.ComponentType<
      React.ThHTMLAttributes<HTMLTableCellElement>
    >;
    TableHeader: React.ComponentType<
      React.HTMLAttributes<HTMLTableSectionElement>
    >;
    TableRow: React.ComponentType<React.HTMLAttributes<HTMLTableRowElement>>;
  };
export const money = (minor: number) =>
  new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 2,
  }).format(minor / 100);
export const when = (value: string) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        timeZone: "Asia/Dhaka",
        dateStyle: "medium",
        ...(value.includes("T") ? { timeStyle: "short" as const } : {}),
      })
    : "—";
export function Heading({
  title,
  bn,
  children,
}: {
  title: string;
  bn: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-ink">
          {title}
        </h1>
        <p className="mt-1 text-xs text-ink-500 font-bn">{bn}</p>
      </div>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
export function Card({
  title,
  children,
  aside,
}: {
  title?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card shadow-card">
      {title && (
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold">{title}</h2>
          {aside}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}
export function Badge({ children }: { children: React.ReactNode }) {
  const v = String(children);
  const color =
    /Active|Paid|Verified|Completed|Published|Delivered|Accepted|Resolved/.test(
      v,
    )
      ? "bg-success-bg text-success"
      : /Rejected|Suspended|Expired|Disabled|Failed|Voided|High/.test(v)
        ? "bg-danger-bg text-danger"
        : /Pending|Trial|Grace|Waiting|Scheduled/.test(v)
          ? "bg-warning-bg text-warning"
          : "bg-ink-100 text-ink-600";
  return (
    <span
      className={`inline-flex rounded-md px-2 py-1 text-[11px] font-medium ${color}`}
    >
      {children}
    </span>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  const fieldId=React.useId();
  return (
    <div className="block space-y-1.5 text-xs font-medium text-ink">
      <label htmlFor={fieldId}>{label}</label>
      {React.Children.map(children,(child,index)=>index===0&&React.isValidElement(child)?React.cloneElement(child as React.ReactElement<{id?:string}>,{id:fieldId}):child)}
      {hint && <span className="block font-normal text-ink-500">{hint}</span>}
    </div>
  );
}
export const control =
  "block w-full rounded-md border border-input bg-card px-3 py-2 text-[13px] text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";
export function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={control}>
      {children}
    </select>
  );
}
export function Area(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={control} rows={props.rows || 3} />;
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const dirty = useRef(false);
  const opener = useRef<HTMLElement | null>(null);
  useEffect(() => {
    opener.current = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      opener.current?.focus();
    };
  }, []);
  const close = () => {
    if (!dirty.current || window.confirm("Discard unsaved changes?")) onClose();
  };
  return (
    <dialog
      ref={ref}
      aria-labelledby="saas-dialog-title"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onChange={() => {
        dirty.current = true;
      }}
      className="saas-dialog m-auto w-[calc(100%_-_2rem)] max-w-2xl rounded-xl border border-border bg-card p-0 text-ink shadow-xl backdrop:bg-black/50"
    >
      <div className="flex items-center justify-between border-b border-border p-4">
        <h2 id="saas-dialog-title" className="text-base font-semibold">
          {title}
        </h2>
        <button
          aria-label="Close dialog"
          onClick={close}
          className="rounded p-1 hover:bg-ink-100"
        >
          <X size={18} />
        </button>
      </div>
      <div className="max-h-[75vh] overflow-y-auto p-4">{children}</div>
    </dialog>
  );
}
export function Actions({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
      {children}
    </div>
  );
}
export function Empty({ text = "No matching records." }: { text?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-ink-500">
      {text}
    </div>
  );
}
export function DataTable<T extends { id: string }>({
  rows,
  columns,
  search = true,
}: {
  rows: T[];
  columns: { label: string; render: (row: T) => React.ReactNode }[];
  search?: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const page = Number(params.get("page") || 1);
  const filtered = rows.filter((r) =>
    JSON.stringify(r).toLowerCase().includes(q.toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 8));
  const current = Math.max(1, Math.min(page, pages));
  const set = (key: string, value: string) => {
    const n = new URLSearchParams(params);
    n.set(key, value);
    if (key === "q") n.delete("page");
    setParams(n, { replace: true });
  };
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {search && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
          <div className="relative w-full sm:w-72">
            <Search
              className="pointer-events-none absolute left-3 top-2.5 z-10 text-ink-500"
              size={15}
            />
            <Input
              aria-label="Search records"
              value={q}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Search records…"
              className={`${control} pl-9`}
            />
          </div>
          <span className="text-xs text-ink-500">
            {filtered.length} records
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.label} className="whitespace-nowrap text-xs">
                  {c.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice((current - 1) * 8, current * 8).map((row) => (
              <TableRow key={row.id}>
                {columns.map((c) => (
                  <TableCell key={c.label} className="text-[13px]">
                    {c.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {!filtered.length && <Empty />}
      <div className="flex items-center justify-between p-3 text-xs text-ink-500">
        <span>
          Page {current} of {pages}
        </span>
        <div className="flex gap-2">
          <button
            aria-label="Previous page"
            disabled={current === 1}
            onClick={() => set("page", String(current - 1))}
            className="rounded border border-input p-1 disabled:opacity-50"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            aria-label="Next page"
            disabled={current === pages}
            onClick={() => set("page", String(current + 1))}
            className="rounded border border-input p-1 disabled:opacity-50"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
export function Tabs({
  tabs,
  value,
  onChange,
}: {
  tabs: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className="mb-4 flex overflow-x-auto border-b border-border"
      role="group"
      aria-label="Sections"
    >
      {tabs.map((t) => (
        <button
          key={t}
          aria-pressed={value === t}
          onClick={() => onChange(t)}
          className={`whitespace-nowrap border-b-2 px-4 py-3 text-xs font-medium ${value === t ? "border-primary text-primary" : "border-transparent text-ink-500"}`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
export function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: React.ReactNode;
  detail: string;
}) {
  return (
    <Card>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="my-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-[11px] text-ink-500">{detail}</p>
    </Card>
  );
}
export function useModal() {
  return useState<{ kind: string; id?: string } | null>(null);
}
