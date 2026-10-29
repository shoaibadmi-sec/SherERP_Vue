import React from 'react';
import { LogoLockup, LogoMark, Wordmark } from './Logo';
import { SectionHeader } from './SectionHeader';

type Variant = {label: string;note: string;bg: string;node: React.ReactNode;border?: boolean;};

const variants: Variant[] = [
{ label: 'Horizontal · light', note: 'Default. Use on white and Canvas.', bg: '#FFFFFF', border: true, node: <LogoLockup size={44} /> },
{ label: 'Horizontal · dark', note: 'On Ledger Ink and dark photos.', bg: '#0B1A2C', node: <LogoLockup size={44} tone="inverse" /> },
{ label: 'Icon only', note: 'App icon, favicon, avatars.', bg: '#F5F7FA', node: <LogoMark size={72} /> },
{ label: 'Icon · on dark', note: 'Inverse tile on Ink.', bg: '#0B1A2C', node: <LogoMark size={72} tone="inverse" /> },
{ label: 'Monochrome · ink', note: 'Stamps, fax, 1-colour print.', bg: '#FFFFFF', border: true, node: <LogoLockup size={44} tone="mono-ink" /> },
{ label: 'Monochrome · white', note: 'Engraving, reversed print.', bg: '#3A4D66', node: <LogoLockup size={44} tone="mono-white" /> },
{ label: 'Bangla lockup', note: 'Bangla-first contexts.', bg: '#FFFFFF', border: true, node: <LogoLockup size={44} bangla /> },
{ label: 'Wordmark only', note: 'When the mark is nearby.', bg: '#EAF6F4', node: <Wordmark size={40} /> }];


export function LogoSection() {
  return (
    <section id="logo" className="mx-auto max-w-[1280px] scroll-mt-20 px-6 py-16">
      <SectionHeader
        index="01"
        title="Logo"
        bn="লোগো"
        description="The wordmark sets “Hisab” in Ledger Ink and “IQ” in Hisab Teal — one word, no space, capital H, I and Q. The mark compresses the same idea into a ledger-like H." />
      

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="flex min-h-[300px] flex-col justify-between rounded-2xl border border-ink-100 bg-white p-8">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-400">Primary wordmark</p>
          <div className="flex flex-1 items-center justify-center py-8">
            <Wordmark size={96} className="!text-[clamp(2.5rem,7vw,6rem)]" />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-ink-500">
            <span>Geist 650 · tracking −3.5%</span>
            <span>“IQ” 700 · Hisab Teal</span>
            <span>Never typed — always use the master file</span>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white p-8">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-400">Mark construction</p>
          <div className="mt-4 grid items-center gap-6 sm:grid-cols-[220px_1fr]">
            <div className="relative mx-auto size-[220px]">
              <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full" aria-hidden="true">
                {Array.from({ length: 9 }).map((_, i) =>
                <React.Fragment key={i}>
                    <line x1={i * 5} y1="0" x2={i * 5} y2="40" stroke="#D5DDE6" strokeWidth="0.1" />
                    <line x1="0" y1={i * 5} x2="40" y2={i * 5} stroke="#D5DDE6" strokeWidth="0.1" />
                  </React.Fragment>
                )}
              </svg>
              <LogoMark size={220} className="relative opacity-95" />
              <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full" aria-hidden="true">
                <circle cx="27.25" cy="11.6" r="4.2" fill="none" stroke="#3DD6B5" strokeWidth="0.25" strokeDasharray="0.8 0.6" />
                <rect x="14.4" y="24.4" width="11.2" height="2.8" fill="none" stroke="#3DD6B5" strokeWidth="0.25" strokeDasharray="0.8 0.6" />
                <line x1="10.5" y1="34" x2="29.5" y2="34" stroke="#0D7C74" strokeWidth="0.25" />
                <line x1="10.5" y1="33.2" x2="10.5" y2="34.8" stroke="#0D7C74" strokeWidth="0.25" />
                <line x1="29.5" y1="33.2" x2="29.5" y2="34.8" stroke="#0D7C74" strokeWidth="0.25" />
              </svg>
            </div>
            <ol className="space-y-4 text-sm">
              {[
              ['H — structure', 'Two stems and a crossbar: the columns and rows of a ledger.'],
              ['i — intelligence', 'The right stem is shortened into an “i”, topped by the Signal Mint dot.'],
              ['Double rule — the total', 'Crossbar plus a thin rule beneath it: how accountants underline a final figure.'],
              ['Tile — 10/40 radius', 'Matches the 10px UI radius so the icon sits naturally beside app controls.']].
              map(([t, d], i) =>
              <li key={t} className="flex gap-3">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[11px] font-semibold text-teal-700">{i + 1}</span>
                  <span>
                    <span className="block font-medium text-ink">{t}</span>
                    <span className="text-ink-500">{d}</span>
                  </span>
                </li>
              )}
            </ol>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {variants.map((v) =>
        <figure key={v.label} className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
            <div
            className={`flex h-40 items-center justify-center ${v.border ? 'border-b border-ink-100' : ''}`}
            style={{ background: v.bg }}>
            
              {v.node}
            </div>
            <figcaption className="px-4 py-3">
              <p className="text-[13px] font-medium text-ink">{v.label}</p>
              <p className="text-xs text-ink-500">{v.note}</p>
            </figcaption>
          </figure>
        )}
      </div>

      <div id="clear-space" className="mt-16 scroll-mt-20">
        <SectionHeader
          index="02"
          title="Clear space & minimum size"
          bn="ফাঁকা জায়গা"
          description="Keep a margin of x on every side, where x is half the mark’s height. Below the minimum sizes, the double rule and dot lose clarity." />
        
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex min-w-0 items-center justify-center overflow-x-auto rounded-2xl border border-ink-100 bg-white p-4 sm:p-10">
            <div className="relative" style={{ padding: 32 }}>
              <div
                className="absolute inset-0 rounded-md border border-dashed border-teal-500 bg-teal-50"
                aria-hidden="true" />
              
              <div className="relative bg-white">
                <LogoLockup size={64} />
              </div>
              {['top-0 left-1/2 -translate-x-1/2 h-8 w-px', 'bottom-0 left-1/2 -translate-x-1/2 h-8 w-px', 'left-0 top-1/2 -translate-y-1/2 w-8 h-px', 'right-0 top-1/2 -translate-y-1/2 w-8 h-px'].map((c) =>
              <span key={c} className={`absolute bg-teal-600 ${c}`} aria-hidden="true" />
              )}
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-teal-700">x</span>
              <span className="absolute -left-5 top-1/2 -translate-y-1/2 text-xs font-semibold text-teal-700">x</span>
              <span className="absolute -right-5 top-1/2 -translate-y-1/2 text-xs font-semibold text-teal-700">x</span>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-teal-700">x</span>
            </div>
          </div>
          <div className="space-y-4 rounded-2xl border border-ink-100 bg-white p-6">
            <p className="text-xs font-medium uppercase tracking-wider text-ink-400">Minimum sizes</p>
            <div className="flex items-end gap-6">
              {[16, 24, 32, 48].map((s) =>
              <div key={s} className="flex flex-col items-center gap-2">
                  <LogoMark size={s} />
                  <span className={`text-[11px] ${s === 16 ? 'font-semibold text-teal-700' : 'text-ink-500'}`}>{s}px</span>
                </div>
              )}
            </div>
            <p className="text-xs text-ink-500">Icon: 16px digital minimum (favicon), 6mm in print.</p>
            <div className="border-t border-ink-100 pt-4">
              <div className="flex items-end gap-6">
                <div className="flex flex-col items-start gap-2">
                  <LogoLockup size={20} />
                  <span className="text-[11px] font-semibold text-teal-700">96px wide</span>
                </div>
                <div className="flex flex-col items-start gap-2">
                  <LogoLockup size={28} />
                  <span className="text-[11px] text-ink-500">132px</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-ink-500">Horizontal lockup: 96px digital minimum, 25mm in print. Receipt printers: use monochrome.</p>
            </div>
          </div>
        </div>
      </div>
    </section>);

}
