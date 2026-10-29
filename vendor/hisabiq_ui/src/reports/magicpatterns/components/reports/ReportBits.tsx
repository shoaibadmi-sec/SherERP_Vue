import React, { createContext, useContext, useId, useState } from 'react';
export type EvidenceRequest = {report:string;label:string;field?:string;value?:string;date?:string;toDate?:string;forecast?:boolean;context?:string};
export const SourceEvidenceContext = createContext<((request:EvidenceRequest)=>void)|null>(null);
export const KpiEvidenceContext = createContext<((label:string)=>void)|null>(null);
export function SourceLink({report,label,field,value,date,toDate,children}:{report:string;label:string;field?:string;value?:string;date?:string;toDate?:string;children:React.ReactNode}){
 const open=useContext(SourceEvidenceContext);
 return <button type="button" className="text-left font-medium text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary" onClick={()=>open?.({report,label,field,value,date,toDate})}>{children}</button>;
}
import { ArrowDownRight, ArrowUpRight, Info } from 'lucide-react';
import type { Tone } from '../../types/reports';

const toneText: Record<Tone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  neutral: 'text-ink',
  teal: 'text-teal-700',
};

/** Small accessible tooltip: hover, focus or tap to show plain-language help */
export function InfoTip({ text, label = 'More information' }: { text: React.ReactNode; label?: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex align-middle" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button
        type="button"
        aria-label={label}
        aria-describedby={open ? id : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-5 items-center justify-center rounded text-ink-400 hover:text-ink-600"
      >
        <Info className="size-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute left-1/2 top-full z-50 mt-1 w-64 -translate-x-1/2 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-xs font-normal leading-relaxed text-ink-600 shadow-pop"
        >
          {text}
        </span>
      )}
    </span>
  );
}

export function Delta({ value, goodWhenUp = true, suffix = 'vs previous' }: { value: number | null; goodWhenUp?: boolean; suffix?: string }) {
  if (value === null || !Number.isFinite(value)) return <span className="text-[11px] text-ink-400">No earlier data</span>;
  const up = value >= 0;
  const good = up === goodWhenUp;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${Math.abs(value) < 0.5 ? 'text-ink-500' : good ? 'text-success' : 'text-danger'}`}>
      <Icon className="size-3" aria-hidden="true" />
      {Math.abs(value).toFixed(1)}% <span className="font-normal text-ink-500">{suffix}</span>
    </span>
  );
}

type KpiProps = {
  label: string;
  bn?: string;
  value: string;
  tone?: Tone;
  help?: React.ReactNode;
  footer?: React.ReactNode;
  onClick?: () => void;
};

export function Kpi({ label, bn, value, tone = 'neutral', help, footer, onClick }: KpiProps) {
  const evidence=useContext(KpiEvidenceContext);
  const click=evidence ? () => { onClick?.(); evidence(label); } : onClick;
  return (
    <div className={`min-w-0 rounded-xl border border-border bg-card p-3 text-left shadow-card sm:p-4 ${click ? 'transition-colors hover:border-teal-200' : ''}`}>
      <span className="flex items-center gap-1 text-xs text-ink-600">
        {click
          ? <button type="button" onClick={click} className="min-w-0 text-left focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary">{label}</button>
          : label}
        {help && <InfoTip text={help} label={`About ${label}`} />}
      </span>
      {bn && <span className="block font-bn text-[11px] leading-4 text-ink-400">{bn}</span>}
      {click
        ? <button type="button" onClick={click} aria-label={`View evidence for ${label}: ${value}`} className={`mt-1 block w-full truncate text-left text-xl font-semibold tracking-tight focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${toneText[tone]}`}>{value}</button>
        : <span className={`mt-1 block truncate text-xl font-semibold tracking-tight ${toneText[tone]}`}>{value}</span>}
      {footer && <span className="mt-1 block">{footer}</span>}
    </div>
  );
}

/** Thin horizontal share bar used inside tables and lists */
export function ShareBar({ value, tone = 'teal' }: { value: number; tone?: 'teal' | 'warning' | 'danger' | 'ink' }) {
  const color = tone === 'teal' ? 'bg-teal-600' : tone === 'warning' ? 'bg-warning' : tone === 'danger' ? 'bg-danger' : 'bg-ink-300';
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-ink-50" aria-hidden="true">
      <span className={`block h-full rounded-full ${color}`} style={{ width: `${Math.max(2, Math.min(100, value * 100))}%` }} />
    </span>
  );
}

export function SectionNote({ children, tone = 'neutral' }: { children: React.ReactNode; tone?: 'neutral' | 'warning' | 'teal' }) {
  const cls =
    tone === 'warning'
      ? 'border-warning/20 bg-warning-bg text-warning'
      : tone === 'teal'
        ? 'border-teal-200 bg-teal-50 text-teal-800'
        : 'border-border bg-ink-50 text-ink-600';
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs leading-relaxed ${cls}`}>
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <div>{children}</div>
    </div>
  );
}

/** Table header cell with optional help */
export function Th({ children, help, numeric = false, className = '' }: { children: React.ReactNode; help?: string; numeric?: boolean; className?: string }) {
  return (
    <th scope="col" className={`whitespace-nowrap px-3 py-2 text-xs font-medium text-ink-600 ${numeric ? 'text-right' : 'text-left'} ${className}`}>
      <span className={`inline-flex items-center gap-0.5 ${numeric ? 'flex-row-reverse' : ''}`}>
        {children}
        {help && <InfoTip text={help} />}
      </span>
    </th>
  );
}

export function Td({ children, numeric = false, className = '' }: { children: React.ReactNode; numeric?: boolean; className?: string }) {
  return (
    <td data-numeric={numeric ? 'true' : undefined} className={`whitespace-nowrap px-3 py-2 ${numeric ? 'text-right font-medium' : ''} ${className}`}>
      {children}
    </td>
  );
}

export function TableShell({ children, minWidth = 640 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <div className="ref-table-scroll overflow-x-auto">
      <table data-erp-table className="w-full text-[13px] text-ink" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function EmptyRow({ cols, message }: { cols: number; message: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-3 py-8 text-center text-sm text-ink-500">
        {message}
      </td>
    </tr>
  );
}
