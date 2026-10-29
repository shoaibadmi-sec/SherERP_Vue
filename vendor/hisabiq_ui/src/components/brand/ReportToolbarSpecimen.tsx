import { useState } from 'react';
import { useUiCopy } from '../../i18n/useUiCopy';
import { reportDefinition } from '../../reports/catalog';
import { defaultReportFilters } from '../../reports/model';
import type { ReportFilters } from '../../reports/types';
import { ReportToolbar } from '../reports/ReportToolbar';
import { ReportHelp, ReportLabel } from '../reports/ReportGuidance';
import { ColumnVisibilityEditor } from '../ColumnVisibilityEditor';
import { Button } from '../Button';
import { Input } from '../Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../Dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../Table';
import { StatusBadge } from '../StatusBadge';
import { taka } from '../../utils/currency';

const initial: ReportFilters = { ...defaultReportFilters, from: '2026-09-27', to: '2026-10-26' };
const columns = [{ id: 'label', en: 'Reference', bn: 'নম্বর' }, { id: 'party', en: 'Customer', bn: 'ক্রেতা' }, { id: 'amount', en: 'Amount', bn: 'টাকা' }, { id: 'status', en: 'Status', bn: 'অবস্থা' }];
const options = {
  category: [{ value: 'hardware', label: 'Hardware' }], brand: [], product: [], user: [], account: [],
  party: [{ value: 'rahman', label: 'Rahman Hardware' }, { value: 'karim', label: 'Karim Store' }],
  status: [{ value: 'Paid', label: 'Paid' }, { value: 'Partial', label: 'Partial' }],
};

export function ReportToolbarSpecimen() {
  const { text } = useUiCopy();
  const [filters, setFilters] = useState<ReportFilters>(initial);
  const [visible, setVisible] = useState(columns.map((column) => column.id));
  const [dialog, setDialog] = useState<'columns' | 'views' | null>(null);
  const [viewName, setViewName] = useState('');
  const [views, setViews] = useState<{ name: string; filters: ReportFilters; columns: string[] }[]>([]);
  const [detail, setDetail] = useState<string | null>(null);
  const rows = [
    { id: 'SAMPLE-1001', party: 'Rahman Hardware', key: 'rahman', amount: 1840, status: 'Paid', date: '2026-10-01' },
    { id: 'SAMPLE-1002', party: 'Karim Store', key: 'karim', amount: 4000, status: 'Partial', date: '2026-10-20' },
  ].filter((row) => (!filters.search || (row.id + row.party).toLowerCase().includes(filters.search.toLowerCase())) && (!filters.status || row.status === filters.status) && (!filters.party || row.key === filters.party) && (!filters.from || row.date >= filters.from) && (!filters.to || row.date <= filters.to));
  return <div data-library-report-toolbar className="space-y-4">
    <ReportToolbar definition={{ ...reportDefinition('sales-register'), dimensions: ['party', 'status'] }} filters={filters} options={options} onChange={setFilters} onColumns={() => setDialog('columns')} onSaved={() => setDialog('views')} asOf="2026-10-26" />
    <div className="overflow-hidden rounded-lg border border-border"><Table scrollRegionLabel={text('Sample report results', 'নমুনা রিপোর্ট')}><TableHeader><TableRow>{columns.filter((column) => visible.includes(column.id)).map((column) => <TableHead key={column.id} scope="col" className={column.id === 'amount' ? 'text-right' : ''}><span className="inline-flex items-center gap-1"><ReportLabel en={column.en} bn={column.bn} />{column.id === 'status' && <ReportHelp guide="status" label={text('Status', 'অবস্থা')} />}</span></TableHead>)}</TableRow></TableHeader>
      <TableBody>{rows.map((row) => <TableRow key={row.id}>{visible.includes('label') && <TableCell><button type="button" className="font-medium text-primary hover:underline" onClick={() => setDetail(row.id)}>{row.id}</button></TableCell>}{visible.includes('party') && <TableCell><button type="button" className="text-primary hover:underline" onClick={() => setDetail(row.party)}>{row.party}</button></TableCell>}{visible.includes('amount') && <TableCell className="text-right">{taka(row.amount)}</TableCell>}{visible.includes('status') && <TableCell><StatusBadge dot tone={row.status === 'Paid' ? 'success' : 'warning'}>{text(row.status, row.status === 'Paid' ? 'পরিশোধিত' : 'আংশিক')}</StatusBadge></TableCell>}</TableRow>)}{!rows.length && <TableRow><TableCell colSpan={visible.length} className="py-6 text-center">{text('No matching sample records. Clear filters or change the date range.', 'মিলে এমন নমুনা নেই। ফিল্টার বা তারিখ বদলান।')}</TableCell></TableRow>}</TableBody></Table></div>
    <p role="status" className="text-xs text-ink-500">{rows.length} {text('sample records', 'নমুনা রেকর্ড')} · {filters.compare === 'previous' ? text('Previous period selected', 'আগের সময়কাল বাছা হয়েছে') : text('No comparison', 'তুলনা ছাড়া')}</p>
    <Dialog open={dialog !== null} onOpenChange={(open) => { if (!open) setDialog(null); }}><DialogContent className="sm:max-w-lg"><DialogHeader><DialogTitle>{dialog === 'columns' ? text('Visible columns', 'দেখানো কলাম') : text('Sample saved views', 'নমুনা সংরক্ষিত ভিউ')}</DialogTitle><DialogDescription>{text('Changes apply to this library example only.', 'পরিবর্তন শুধু এই নমুনায় প্রযোজ্য।')}</DialogDescription></DialogHeader>
      {dialog === 'columns' ? <ColumnVisibilityEditor label={text('Sample report columns', 'নমুনা রিপোর্টের কলাম')} columns={columns.map((column) => ({ id: column.id, label: text(column.en, column.bn) }))} value={visible} required={['label']} onChange={setVisible} /> : <div className="space-y-3"><label className="block text-sm text-ink">{text('View name', 'ভিউয়ের নাম')}<Input className="mt-1.5" value={viewName} maxLength={80} onChange={(event) => setViewName(event.target.value)} /></label><Button disabled={!viewName.trim()} onClick={() => { setViews((current) => [...current, { name: viewName.trim(), filters: { ...filters }, columns: [...visible] }]); setViewName(''); }}>{text('Save sample view', 'নমুনা ভিউ সংরক্ষণ')}</Button>{views.map((view, index) => <div key={index} className="flex gap-2 rounded-lg border border-border p-2"><button type="button" className="min-w-0 flex-1 break-words text-left text-sm font-medium text-primary hover:underline" onClick={() => { setFilters({ ...view.filters }); setVisible([...view.columns]); setDialog(null); }}>{view.name}</button><Button variant="ghost" className="ml-auto" onClick={() => setViews((current) => current.filter((_, position) => position !== index))}>{text('Delete', 'মুছুন')}</Button></div>)}{!views.length && <p className="text-sm text-ink-500">{text('No saved sample views yet.', 'এখনো কোনো নমুনা ভিউ নেই।')}</p>}</div>}
      <DialogFooter><Button variant="outline" onClick={() => setDialog(null)}>{text('Done', 'সম্পন্ন')}</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={detail !== null} onOpenChange={(open) => { if (!open) setDetail(null); }}><DialogContent><DialogHeader><DialogTitle>{detail}</DialogTitle><DialogDescription>{text('Source-detail composition. Closing returns to the same filters and selected columns.', 'উৎসের বিস্তারিত দেখার নমুনা। বন্ধ করলে আগের ফিল্টার ও কলাম থাকবে।')}</DialogDescription></DialogHeader><p className="text-sm text-ink-600">{text('In a business screen this opens the source invoice, party, product, expense or purchase detail through the existing domain editor.', 'ব্যবসার পর্দায় একইভাবে আসল বিল, পক্ষ, পণ্য, খরচ বা কেনাকাটার বিস্তারিত খুলবে।')}</p><Button onClick={() => setDetail(null)}>{text('Back to sample report', 'নমুনা রিপোর্টে ফিরুন')}</Button></DialogContent></Dialog>
  </div>;
}
