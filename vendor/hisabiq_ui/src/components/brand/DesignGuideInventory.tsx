import { useState } from 'react';
import inventory from '../../../docs/ui/design-system.json';
import { designIconComponents } from '../../data/designIconComponents';
import { Input } from '../Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../Table';

export function DesignGuideInventory() {
  const [query, setQuery] = useState('');
  const matches = (value: string) => value.toLowerCase().includes(query.trim().toLowerCase());
  const files = inventory.componentFiles.filter((item) => matches(item.file + ' ' + item.exports.join(' ')));
  const icons = Object.entries(inventory.icons).filter(([name]) => matches(name));
  const glyphs = new Map(designIconComponents.map((entry) => [entry.name, entry.Icon]));
  const colors = Object.entries(inventory.colors.light).filter(([name]) => matches(name));
  return <div id="source-inventory" className="mt-8 space-y-3">
    <h2 className="text-xl font-semibold text-ink">Complete source inventory</h2>
    <p className="text-sm leading-6 text-ink-500">Every authored TSX file, imported Lucide name, typed primitive, bundled export and light/dark color role. Generated from the GitHub source; this index does not imply every legacy component is approved for new use.</p>
    <label className="block text-[13px] font-medium text-ink" htmlFor="guide-inventory-search">Search components, exports, icons or color roles
      <Input id="guide-inventory-search" type="search" className="mt-1.5" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try AppDatePicker, Payment, Paperclip or primary…" />
    </label>
    <details className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ink">Authored UI files · {files.length}</summary>
      <div className="max-h-[32rem] overflow-auto border-t border-border p-4" role="region" aria-label="Authored UI source files" tabIndex={0}>
        <ul className="divide-y divide-border">{files.map((item) => <li key={item.file} className="py-3 first:pt-0"><p className="break-all text-[13px] font-medium text-ink">{item.file}</p><p className="mt-1 text-xs text-ink-500">{item.kind}</p>{item.exports.length > 0 && <p className="mt-1 break-words text-xs leading-5 text-ink-600">{item.exports.join(', ')}</p>}</li>)}</ul>
        {!files.length && <p className="text-sm text-ink-500">No matching source file.</p>}
      </div>
    </details>
    <details className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ink">Complete light and dark palette · {colors.length} roles</summary>
      <div className="max-h-[32rem] overflow-auto border-t border-border" role="region" aria-label="Complete theme palette" tabIndex={0}>
        <Table data-erp-table><TableHeader><TableRow><TableHead scope="col">Role</TableHead><TableHead scope="col">Light</TableHead><TableHead scope="col">Dark</TableHead></TableRow></TableHeader><TableBody>
          {colors.map(([name, light]) => { const dark = inventory.colors.dark[name as keyof typeof inventory.colors.dark]; return <TableRow key={name}><TableCell className="whitespace-normal [overflow-wrap:anywhere]">{name.replace('color-', '')}</TableCell><TableCell><span className="mr-2 inline-block size-4 rounded border border-input align-middle" style={{ backgroundColor: light.hex }} aria-hidden="true" />{light.hex}</TableCell><TableCell><span className="mr-2 inline-block size-4 rounded border border-input align-middle" style={{ backgroundColor: dark.hex }} aria-hidden="true" />{dark.hex}</TableCell></TableRow>; })}
          {!colors.length && <TableRow><TableCell colSpan={3}>No matching color role.</TableCell></TableRow>}
        </TableBody></Table>
      </div>
    </details>
    <details className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ink">Lucide source names · {icons.length}</summary>
      <div className="max-h-[32rem] overflow-auto border-t border-border p-4" role="region" aria-label="Imported Lucide icon names" tabIndex={0}><ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{icons.map(([name, usages]) => { const Icon = glyphs.get(name); return <li key={name} className="min-w-0 rounded-lg border border-border p-3">{Icon && <Icon className="mb-2 size-5 text-ink-700" strokeWidth={1.75} aria-hidden="true" />}<p className="break-words text-[13px] font-medium text-ink">{name}</p><p className="text-xs text-ink-500">{usages.length} source files</p></li>; })}</ul>{!icons.length && <p className="text-sm text-ink-500">No matching imported icon.</p>}</div>
    </details>
    <details className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-ink">Typed primitives and bundled availability</summary>
      <div className="space-y-3 border-t border-border p-4 text-sm leading-6 text-ink-600"><p><strong className="font-medium text-ink">Typed ERP exports ({inventory.sharedExports.names.length}): </strong>{inventory.sharedExports.names.join(', ')}</p><p><strong className="font-medium text-ink">Bundled runtime exports ({inventory.bundledRuntimeExports.names.length}): </strong>{inventory.bundledRuntimeExports.names.filter(matches).join(', ') || 'No matching export.'}</p><p className="text-xs text-ink-500">Bundled availability is not an approved ERP wrapper. Inspect types and apply the control, focus, language, responsive and workflow contracts before integrating an extra primitive.</p></div>
    </details>
  </div>;
}
