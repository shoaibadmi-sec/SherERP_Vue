import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { SectionHeader } from './SectionHeader';
import { coreColors, inkScale, semanticColors, tealScale } from '../../data/brand';

function copy(hex: string) {
  navigator.clipboard?.writeText(hex);
  toast.success(`${hex} copied`);
}

function Scale({ title, steps }: {title: string;steps: {step: string;hex: string;}[];}) {
  return (
    <div className="min-w-0">
      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-400">{title}</p>
      <div className="flex overflow-x-auto rounded-xl border border-ink-100" role="region" aria-label={title + ' swatches'} tabIndex={0}>
        {steps.map((s, i) => {
          const dark = i < steps.length / 2;
          return (
            <button
              key={s.step}
              onClick={() => copy(s.hex)}
              className="group flex h-20 flex-1 flex-col justify-end p-2 text-left"
              style={{ background: s.hex, color: dark ? '#FFFFFF' : '#0B1A2C' }}
              aria-label={`Copy ${title} ${s.step} ${s.hex}`}>
              
              <span className="text-[11px] font-semibold">{s.step}</span>
              <span className="text-[10px] opacity-80">{s.hex}</span>
            </button>);

        })}
      </div>
    </div>);

}

export function ColorSection() {
  return (
    <section id="color" className="mx-auto max-w-[1280px] scroll-mt-20 px-6 py-16">
      <SectionHeader
        index="03"
        title="Color"
        bn="রং"
        description="A deep ink neutral carries trust and legibility. Hisab Teal — slightly green, slightly deep — is our single accent: ownable, calm and distinct from the bright blue-greens of fintech. Signal Mint is used sparingly, like a highlighter." />
      

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {coreColors.map((c, i) =>
        <button
          key={c.hex}
          onClick={() => copy(c.hex)}
          className={`group overflow-hidden rounded-2xl border border-ink-100 bg-white text-left transition-shadow hover:shadow-pop ${i < 2 ? 'lg:col-span-1' : ''}`}>
          
            <div className="flex h-32 items-start justify-end p-3" style={{ background: c.hex }}>
              <Copy className={`size-4 opacity-0 transition-opacity group-hover:opacity-100 ${c.dark ? 'text-white' : 'text-ink'}`} />
            </div>
            <div className="space-y-1 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">{c.name}</p>
                <p className="text-xs text-ink-500">{c.hex}</p>
              </div>
              <p className="text-xs leading-relaxed text-ink-500">{c.role}</p>
              {c.contrast &&
            <p className="flex items-center gap-1 text-[11px] font-medium text-success">
                  <Check className="size-3" /> {c.contrast}
                </p>
            }
            </div>
          </button>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Scale title="Ink scale" steps={inkScale} />
        <Scale title="Teal scale" steps={tealScale} />
      </div>

      <div className="mt-6">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-ink-400">Current light-theme semantic status</p>
        <p className="mb-3 text-xs leading-5 text-ink-500">Identity swatches above preserve the master palette. Build UI with src/theme.css tokens; chapter 04 and the generated inventory include the complete light and dark values.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {semanticColors.map((s) =>
          <div key={s.name} className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3">
              <div className="flex shrink-0 overflow-hidden rounded-lg">
                <span className="size-10" style={{ background: s.hex }} />
                <span className="size-10" style={{ background: s.bg }} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold" style={{ color: s.hex }}>
                  {s.name} <span className="font-normal text-ink-400">{s.hex}</span>
                </p>
                <p className="truncate text-xs text-ink-500">{s.use}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-3 rounded-2xl border border-ink-100 bg-white p-5 text-sm md:grid-cols-3">
        <div>
          <p className="font-medium text-ink">Proportion</p>
          <div className="mt-2 flex h-3 overflow-hidden rounded-full">
            <span className="bg-white ring-1 ring-inset ring-ink-100" style={{ width: '58%' }} />
            <span className="bg-ink-50" style={{ width: '20%' }} />
            <span className="bg-ink" style={{ width: '14%' }} />
            <span className="bg-teal-600" style={{ width: '7%' }} />
            <span className="bg-mint" style={{ width: '1%' }} />
          </div>
          <p className="mt-1.5 text-xs text-ink-500">Paper 58 · Canvas 20 · Ink 14 · Teal 7 · Mint 1</p>
        </div>
        <div>
          <p className="font-medium text-ink">Accessibility</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">All text pairs meet WCAG AA (4.5:1). Never set Signal Mint or Teal 400 text on white. Status is never color-only — always pair with a label or dot.</p>
        </div>
        <div>
          <p className="font-medium text-ink">No gradients</p>
          <p className="mt-1 text-xs leading-relaxed text-ink-500">Flat, solid fills only. Depth comes from 1px borders and restrained shadows — like paper on a desk.</p>
        </div>
      </div>
    </section>);

}
