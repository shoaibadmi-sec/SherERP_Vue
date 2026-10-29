import { SectionHeader } from './SectionHeader';

const scale = [
{ name: 'Display', spec: '36 / 44 · 600 · −2%', sample: 'Simple accounts.', cls: 'text-[36px] leading-[44px] font-semibold tracking-tight' },
{ name: 'Page title', spec: '20 / 28 · 600', sample: 'Parties & Ledger', cls: 'text-xl font-semibold tracking-tight' },
{ name: 'Heading 2', spec: '18 / 26 · 600', sample: 'Dues to collect', cls: 'text-lg font-semibold' },
{ name: 'Body', spec: '14 / 20 · 400', sample: 'Rahman Hardware paid ৳10,000 by bKash on 27 Sep.', cls: 'text-sm' },
{ name: 'Small / label', spec: '12 / 16 · 500', sample: 'Last activity · Today, 11:42 AM', cls: 'text-xs font-medium text-ink-500' },
{ name: 'Table data', spec: '13 / 20 · 400–600', sample: 'PVC Pipe · ৳1,680', cls: 'text-[13px] leading-5' },
{ name: 'Table heading', spec: '12 / 16 · 500', sample: 'Product · Quantity · Total', cls: 'text-xs font-medium' },
{ name: 'Table helper / badge', spec: '11 / 16 · 400–500', sample: 'পাইপ · Paid', cls: 'text-[11px] leading-4 text-ink-500' },
{ name: 'Figure', spec: '28 / 34 · 600 · proportional', sample: '৳1,80,300', cls: 'text-[28px] font-semibold tracking-tight' }];


export function TypographySection() {
  return (
    <section id="type" className="mx-auto max-w-[1280px] scroll-mt-20 px-6 py-16">
      <SectionHeader
        index="04"
        title="Typography"
        bn="টাইপোগ্রাফি"
        description="Geist for Latin and all UI. Hind Siliguri for Bangla — open counters, matching x-height and stroke weight, so mixed lines like “Paid · পরিশোধ” sit evenly." />
      

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-white p-8">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-400">Latin & UI</p>
            <p className="text-xs text-ink-500">400 · 500 · 600 · 700</p>
          </div>
          <p className="mt-4 text-[96px] font-semibold leading-none tracking-tight text-ink">Aa</p>
          <p className="mt-2 text-2xl font-semibold text-ink">Geist</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-500">ABCDEFGHIJKLMNOPQRSTUVWXYZ<br />abcdefghijklmnopqrstuvwxyz<br />0123456789 ৳ , . − % / ×</p>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-8">
          <div className="flex items-baseline justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-400">Bangla</p>
            <p className="text-xs text-ink-500">400 · 500 · 600 · 700</p>
          </div>
          <p className="font-bn mt-4 text-[96px] font-semibold leading-none text-ink">অআ</p>
          <p className="mt-2 text-2xl font-semibold text-ink">Hind Siliguri</p>
          <p className="font-bn mt-3 text-[15px] leading-relaxed text-ink-500">
            সহজ হিসাব, স্মার্ট ব্যবসা<br />আজকের বিক্রি · পাবো · দেবো · বাকি · খাতা<br />০১২৩৪৫৬৭৮৯
          </p>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-ink-100 bg-white">
        {scale.map((s) =>
        <div key={s.name} className="grid items-baseline gap-2 border-b border-ink-100 px-6 py-4 last:border-0 md:grid-cols-[160px_200px_1fr]">
            <p className="text-[13px] font-medium text-ink">{s.name}</p>
            <p className="text-xs text-ink-500">{s.spec}</p>
            <p className={`truncate text-ink ${s.cls}`}>{s.sample}</p>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        {[
        { t: 'Proportional UI figures', d: 'Use Geist for numbers, with right alignment. Table roles use proportional digits; never apply monospace or to data tables.' },
        { t: 'Numbers right-aligned', d: 'Every numeric column — qty, price, total, balance — aligns right so place values stack.' },
        { t: 'Lakh grouping, ৳ prefix', d: 'Write ৳1,25,400 — Taka sign before the figure, no space, Bangladeshi grouping.' }].
        map((r) =>
        <div key={r.t} className="rounded-xl border border-ink-100 bg-white p-4">
            <p className="text-sm font-medium text-ink">{r.t}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-500">{r.d}</p>
          </div>
        )}
      </div>
    </section>);

}
