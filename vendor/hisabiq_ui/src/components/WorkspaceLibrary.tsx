import type { ReactNode } from "react";
import { Input } from "./Input";

/** Report Library's sidebar shell, shared with Settings. */
export function WorkspaceLibrary({ title, search, onSearch, placeholder, searchLabel, children, footer }: {
  title: string; search: string; onSearch: (value: string) => void;
  placeholder: string; searchLabel: string; children: ReactNode; footer: ReactNode;
}) {
  return <aside data-workspace-library className="min-w-0 self-start rounded-xl border border-border bg-card p-2" aria-label={title}>
    <div className="px-1 pb-2">
      <h2 className="mb-2 text-xs font-semibold text-ink-600">{title}</h2>
      <Input type="search" aria-label={searchLabel} placeholder={placeholder} value={search} onChange={e => onSearch(e.target.value)} />
    </div>
    {children}
    <div className="mt-3 border-t border-border px-2 pt-3 text-[11px] text-ink-500">{footer}</div>
  </aside>;
}
