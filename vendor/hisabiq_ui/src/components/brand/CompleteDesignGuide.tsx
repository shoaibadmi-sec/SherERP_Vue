import { useMemo, useState } from 'react';
import { BookOpen, Check, ChevronDown, Copy, Download, Search } from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../Table';
import guide from '../../data/designGuide.json';
import { guideBlocks, guideMarkdown } from '../../utils/designGuide';
import { DesignGuideInventory } from './DesignGuideInventory';

const markdown = guideMarkdown(guide.introduction, guide.sections);
const chapters = guide.sections.map((section) => ({ ...section, blocks: guideBlocks(section.body) }));

export function CompleteDesignGuide() {
  const [query, setQuery] = useState('');
  const [opened, setOpened] = useState<Set<string>>(() => new Set(['guide-01']));
  const [feedback, setFeedback] = useState('');
  const filtered = useMemo(() => {
    const text = query.trim().toLocaleLowerCase();
    return text ? chapters.filter((section) => (section.title + ' ' + section.body).toLocaleLowerCase().includes(text)) : chapters;
  }, [query]);
  const copy = async () => {
    try { await navigator.clipboard.writeText(markdown); setFeedback('Complete guide copied.'); }
    catch { setFeedback('Copy is unavailable in this browser. Use Download guide.'); }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([markdown], { type: 'text/markdown;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url; link.download = 'HisabIQ-Complete-Design-Guide-v2.md'; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setFeedback('Guide download started.');
  };
  const show = (id: string) => {
    setOpened((current) => new Set([...current, id]));
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'instant' }));
  };
  return <section id="complete-guide" aria-labelledby="complete-guide-title" style={{ fontFeatureSettings: 'normal', fontVariantNumeric: 'normal' }} className="hisabiq-design-preview mx-auto max-w-[1280px] scroll-mt-20 px-4 py-10 sm:px-6">
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-t border-border pt-6">
      <div className="max-w-2xl">
        <p className="mb-2 flex items-center gap-2 text-xs font-medium text-teal-700"><BookOpen className="size-4" aria-hidden="true" /> Design system v{guide.version} · {guide.date}</p>
        <h2 id="complete-guide-title" className="text-2xl font-semibold tracking-tight text-ink">One guide for every HisabIQ screen</h2>
        <p className="mt-2 text-sm leading-6 text-ink-500">Exact rules, actual component sources and states. Read this before generating UI, then compose the existing system.</p>
        <p lang="bn" className="font-bn mt-1 text-sm text-ink-500">একই উপাদান, একই নিয়ম — সহজ হিসাব, স্মার্ট ব্যবসা।</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={copy}><Copy className="size-4" aria-hidden="true" /> Copy complete guide</Button>
        <Button onClick={download}><Download className="size-4" aria-hidden="true" /> Download guide</Button>
      </div>
    </div>
    <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {[
        ['Chapters', guide.sections.length], ['Authored UI files', guide.inventory.componentFiles],
        ['Imported Lucide icons', guide.inventory.iconNames], ['Color roles per theme', guide.inventory.colorRoles],
      ].map(([label, value]) => <div key={label} className="rounded-xl border border-border bg-card px-4 py-3">
        <p className="text-xs text-ink-500">{label}</p><p className="mt-1 text-xl font-semibold text-ink">{value}</p>
      </div>)}
    </div>
    <p className="mb-5 text-xs leading-5 text-ink-500">Inventory describes available source files. EXISTING rules have source evidence; STANDARD rules settle unspecified defaults; GAP identifies work still needed. This is not a claim that every legacy screen conforms.</p>
    <div className="mb-5 flex flex-wrap items-end gap-3">
      <label className="min-w-0 flex-1 basis-full text-[13px] font-medium text-ink sm:basis-0" htmlFor="guide-search">Search the guide
        <span className="relative mt-1.5 block"><Search className="pointer-events-none absolute left-3 top-1/2 z-10 size-4 -translate-y-1/2 text-ink-400" aria-hidden="true" />
          <Input id="guide-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try modal, Bangla, table, 36px…" className="pl-9" />
        </span>
      </label>
      <Button variant="outline" onClick={() => setOpened(new Set(filtered.map((chapter) => chapter.id)))}>Expand all</Button>
      <Button variant="outline" onClick={() => { setQuery(''); setOpened(new Set()); }}>Collapse all</Button>
    </div>
    <p role="status" aria-live="polite" className="mb-4 min-h-5 text-xs text-ink-500">{feedback || `${filtered.length} of ${chapters.length} chapters`}</p>
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
      <nav aria-label="Complete design guide chapters" className="max-h-72 overflow-y-auto rounded-xl border border-border bg-card p-2 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-112px)]">
        {filtered.map((chapter) => <button key={chapter.id} type="button" onClick={() => show(chapter.id)} className="block w-full rounded-lg px-3 py-2 text-left text-xs leading-5 text-ink-600 hover:bg-accent hover:text-accent-foreground">{chapter.title}</button>)}
      </nav>
      <div className="min-w-0 space-y-3">
        {!filtered.length && <div className="rounded-xl border border-border bg-card p-6"><p className="text-sm font-medium text-ink">No matching design rule</p><p className="mt-1 text-sm text-ink-500">Try another term or clear the search to view every chapter.</p><Button variant="outline" className="mt-3" onClick={() => setQuery('')}>Clear search</Button></div>}
        {filtered.map((chapter) => <details key={chapter.id} id={chapter.id} open={Boolean(query.trim()) || opened.has(chapter.id)} onToggle={(event) => {
          if (query.trim()) return;
          const isOpen = event.currentTarget.open;
          setOpened((current) => { if (current.has(chapter.id) === isOpen) return current; const next = new Set(current); if (isOpen) next.add(chapter.id); else next.delete(chapter.id); return next; });
        }} className="group min-w-0 scroll-mt-20 overflow-hidden rounded-xl border border-border bg-card [&:not([open])>div]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-4 py-4 text-sm font-semibold text-ink [&::-webkit-details-marker]:hidden"><h2 className="text-sm">{chapter.title}</h2><ChevronDown className="size-4 shrink-0 text-ink-400 group-open:rotate-180" aria-hidden="true" /></summary>
          <div className="space-y-4 border-t border-border px-4 py-5 text-sm leading-6 text-ink-600">
            {chapter.blocks.map((block, index) => block.type === 'table'
              ? <div key={index} className="w-full min-w-0 max-w-full overflow-x-auto rounded-lg border border-border" role="region" aria-label={chapter.title + ' reference table'} tabIndex={0}>
                <Table data-erp-table><TableHeader><TableRow>{block.headings.map((heading, cell) => <TableHead key={cell} scope="col" className="min-w-24 bg-ink-50 px-3 py-2 text-left whitespace-normal">{heading}</TableHead>)}</TableRow></TableHeader>
                  <TableBody>{block.rows.map((row, line) => <TableRow key={line}>{row.map((cell, column) => <TableCell key={column} className="px-3 py-2 align-top whitespace-normal [overflow-wrap:anywhere]">{cell}</TableCell>)}</TableRow>)}</TableBody>
                </Table>
              </div>
              : block.type === 'list' ? <ul key={index} className="list-disc space-y-2 pl-5">{block.items.map((item, n) => <li key={n} className="[overflow-wrap:anywhere]">{item}</li>)}</ul>
                : <p key={index} className="whitespace-pre-line [overflow-wrap:anywhere]">{block.text}</p>)}
          </div>
        </details>)}
      </div>
    </div>
    <DesignGuideInventory />
    <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-ink-500"><Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden="true" /> The visual chapters and copy/download come from one generated version of the canonical Markdown. Update the source guide and run the sync script to keep AI instructions and this page aligned.</p>
  </section>;
}
