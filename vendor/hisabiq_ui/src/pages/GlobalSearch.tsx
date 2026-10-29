import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import {globalSearchRecords} from '../utils/globalSearchRecords';
import { useTenantSettings } from '../settings/TenantSettingsProvider';
import { searchResults } from '../utils/globalSearch';

export function GlobalSearch() {
  const [params]=useSearchParams();
  const query=params.get('q') ?? '';
  const {state,actorId,personal}=useTenantSettings();
  const records=globalSearchRecords(state,actorId,personal.language);
  const results=searchResults(records,query,personal.searchMode);
  return <>
    <PageHeader title="Search results" titleBn="খোঁজার ফলাফল" description={query.trim()?`Results for “${query.trim()}”`:'Search by name, phone, SKU or bill number. নাম, ফোন বা বিল নম্বর দিয়ে খুঁজুন।'} />
    <p className="mb-3 text-xs text-ink-500">Preview records and available modules. Backend search is not connected.</p>
    <section aria-label="Search results" className="overflow-hidden rounded-xl border border-border bg-card">
      {results.length ? <ul className="divide-y divide-border">{results.slice(0,50).map(result=><li key={result.kind+':'+result.id}>
        <Link to={result.path} className="flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-ink-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500">
          <span className="min-w-0 flex-1"><span className="block break-words text-sm font-medium text-ink">{result.label}</span><span className="block break-words text-xs text-ink-500">{result.helper}</span></span>
          <span className="shrink-0 text-xs text-ink-500">{result.kind}</span><ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-ink-400" />
        </Link>
      </li>)}</ul>:<div role="status" className="p-5 text-sm text-ink-500"><Search aria-hidden="true" className="mb-2 size-5" />No matching records. Try a shorter name or number. <span lang="bn">কম শব্দ দিয়ে আবার খুঁজুন।</span></div>}
    </section>
    {results.length>50&&<p role="status" className="mt-3 text-sm text-ink-500">Showing the first 50 results. Add more words to narrow your search.</p>}
  </>;
}
