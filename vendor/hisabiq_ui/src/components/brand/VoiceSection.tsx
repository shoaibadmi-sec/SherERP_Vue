import { Check, X, Sparkles, TrendingUp } from 'lucide-react';
import { LogoLockup, LogoMark } from './Logo';
import { SectionHeader } from './SectionHeader';
import { misuseRules, voiceExamples, voicePrinciples } from '../../data/brand';

function MisuseTile({ id }: {id: string;}) {
  switch (id) {
    case 'stretch':
      return <div style={{ transform: 'scaleX(1.5) scaleY(0.8)' }}><LogoLockup size={30} /></div>;
    case 'rotate':
      return <div style={{ transform: 'rotate(-14deg)' }}><LogoLockup size={30} /></div>;
    case 'recolor':
      return (
        <span className="inline-flex items-center gap-2">
          <span className="flex size-[30px] items-center justify-center rounded-[8px] bg-[#7C3AED] text-sm font-bold text-[#FACC15]">H</span>
          <span className="text-[22px] font-semibold tracking-tight text-[#DB2777]">Hisab<span className="text-[#F59E0B]">IQ</span></span>
        </span>);

    case 'gradient':
      return (
        <span className="rounded-lg px-3 py-1.5 text-[22px] font-semibold tracking-tight text-white" style={{ background: 'linear-gradient(90deg,#06b6d4,#a855f7)', boxShadow: '0 0 24px #a855f7' }}>
          HisabIQ
        </span>);

    case 'split':
      return <span className="text-[22px] font-semibold tracking-tight text-ink">Hisab <span className="font-normal text-teal-600">Iq</span></span>;
    case 'busy':
      return (
        <div className="flex h-full w-full items-center justify-center" style={{ background: 'repeating-conic-gradient(#0D7C74 0 25%, #3DD6B5 0 50%) 0 0/18px 18px' }}>
          <LogoLockup size={30} />
        </div>);

    case 'sparkle':
      return (
        <span className="relative inline-flex items-center gap-1">
          <LogoLockup size={30} />
          <Sparkles className="size-5 text-warning" />
          <TrendingUp className="size-5 text-success" />
        </span>);

    case 'outline':
      return (
        <span className="text-[26px] font-bold tracking-tight" style={{ color: 'transparent', WebkitTextStroke: '1px #0B1A2C' }}>
          HisabIQ
        </span>);

    default:
      return null;
  }
}

export function VoiceSection() {
  return (
    <>
      <section id="voice" className="mx-auto max-w-[1280px] scroll-mt-20 px-6 py-16">
        <SectionHeader
          index="06"
          title="Tone of voice"
          bn="কথার ধরন"
          description="We sound like a trusted munshi who knows computers: precise with numbers, plain with words, respectful of how shops already work." />
        
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {voicePrinciples.map((p, i) =>
          <div key={p.title} className="rounded-2xl border border-ink-100 bg-white p-5">
              <p className="text-xs tabular-nums text-teal-700">0{i + 1}</p>
              <p className="mt-3 font-semibold text-ink">{p.title}</p>
              <p className="font-bn text-sm text-ink-400">{p.bn}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{p.body}</p>
            </div>
          )}
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-ink-100 bg-white">
          {voiceExamples.map((e) =>
          <div key={e.context} className="grid gap-3 border-b border-ink-100 px-6 py-4 last:border-0 md:grid-cols-[160px_1fr_1fr]">
              <p className="text-[13px] font-medium text-ink">{e.context}</p>
              <p className="flex items-start gap-2 text-sm text-ink-700">
                <Check className="mt-0.5 size-4 shrink-0 text-success" /> {e.do}
              </p>
              <p className="flex items-start gap-2 text-sm text-ink-400 line-through decoration-danger/40">
                <X className="mt-0.5 size-4 shrink-0 text-danger" /> {e.dont}
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="misuse" className="mx-auto max-w-[1280px] scroll-mt-20 px-6 py-16">
        <SectionHeader
          index="07"
          title="Logo misuse"
          bn="ভুল ব্যবহার"
          description="The mark earns trust through consistency. If a layout tempts you into any of these, use the monochrome lockup instead." />
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {misuseRules.map((m) =>
          <figure key={m.id} className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
              <div className="relative flex h-36 items-center justify-center overflow-hidden bg-ink-50">
                <MisuseTile id={m.id} />
                <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-danger text-white">
                  <X className="size-3.5" />
                </span>
              </div>
              <figcaption className="px-4 py-3 text-[13px] font-medium text-ink">{m.label}</figcaption>
            </figure>
          )}
        </div>
        <div className="mt-4 flex items-center gap-4 rounded-2xl border border-success/20 bg-success-bg px-6 py-4">
          <LogoMark size={36} />
          <p className="text-sm text-ink-700">
            <span className="font-semibold text-success">When in doubt:</span> the colour mark on white, or the monochrome lockup on anything else.
          </p>
        </div>
      </section>
    </>);

}