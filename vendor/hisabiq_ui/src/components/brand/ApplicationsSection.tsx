import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Lock, Phone } from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { LogoLockup, LogoMark } from './Logo';
import { ReceiptPreview } from './ReceiptPreview';
import { SectionHeader } from './SectionHeader';

const invoiceRows = [
['MS Angle 1.5" × 1.5"', '220 Kg', '112', '24,640'],
['Teflon Tape', '2 Box', '280', '560'],
['Gate Valve ¾"', '1 Pcs', '650', '650']];


function Frame({ title, note, children, className = '' }: {title: string;note: string;children: React.ReactNode;className?: string;}) {
  return (
    <figure className={`overflow-hidden rounded-2xl border border-ink-100 bg-white ${className}`}>
      <div className="bg-ink-50 p-6">{children}</div>
      <figcaption className="flex items-baseline justify-between gap-3 border-t border-ink-100 px-5 py-3">
        <span className="text-[13px] font-medium text-ink">{title}</span>
        <span className="text-xs text-ink-500">{note}</span>
      </figcaption>
    </figure>);

}

export function ApplicationsSection() {
  return (
    <section id="applications" className="mx-auto max-w-[1280px] scroll-mt-20 px-6 py-16">
      <SectionHeader
        index="08"
        title="Applications"
        bn="প্রয়োগ"
        description="The same ink, teal and double rule across the phone home screen, the printed invoice, the sign-in screen and an 80mm thermal receipt." />
      

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Frame title="App icon" note="iOS · Android adaptive · favicon">
          <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-8">
            <div className="flex items-end gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="overflow-hidden rounded-[26px] shadow-pop">
                  <LogoMark size={116} />
                </div>
                <span className="text-xs text-ink-600">HisabIQ</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="flex size-[84px] items-center justify-center rounded-full bg-ink shadow-pop">
                  <LogoMark size={64} />
                </div>
                <span className="text-xs text-ink-600">Android</span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-ink-100 bg-white px-3 py-2 shadow-card">
              <LogoMark size={16} />
              <span className="text-xs text-ink-600">HisabIQ — Dashboard</span>
              <span className="text-xs text-ink-300">×</span>
            </div>
          </div>
        </Frame>

        <Frame title="Invoice header" note="A4 · print & PDF">
          <div className="mx-auto max-w-[640px] rounded-sm bg-white shadow-pop ring-1 ring-ink-100">
            <div className="h-1.5 bg-ink" />
            <div className="flex flex-wrap items-start justify-between gap-6 px-8 pt-7">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-teal-50 text-xs font-bold text-teal-700">NH</span>
                  <div>
                    <p className="text-[15px] font-semibold text-ink">Nawabpur Hardware House</p>
                    <p className="font-bn text-xs text-ink-500">নবাবপুর হার্ডওয়্যার হাউস</p>
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-ink-500">142 Nawabpur Road, Dhaka 1100<br />01711-000245 · BIN 004512873-0101</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold tracking-tight text-ink">Invoice <span className="font-bn text-base font-normal text-ink-400">চালান</span></p>
                <p className="mt-1 text-sm font-medium tabular-nums text-teal-700">INV-000241</p>
                <p className="text-[11px] text-ink-500">01 Oct 2026 · Due 15 Oct 2026</p>
              </div>
            </div>
            <div className="mx-8 mt-5 grid grid-cols-2 gap-4 rounded-md bg-ink-50 px-4 py-3 text-[11.5px]">
              <div>
                <p className="text-ink-400">Bill to</p>
                <p className="font-medium text-ink">Rahman Hardware</p>
                <p className="text-ink-500">Nawabpur, Dhaka · 01711-482093</p>
              </div>
              <div className="text-right">
                <p className="text-ink-400">Previous due</p>
                <p className="font-medium tabular-nums text-ink">৳23,100</p>
              </div>
            </div>
            <table data-erp-table="" className="mx-8 mt-4 w-[calc(100%-4rem)] text-[11.5px]">
              <thead>
                <tr className="border-b border-ink-200 text-left text-ink-400">
                  <th className="py-1.5 font-medium">#</th>
                  <th className="py-1.5 font-medium">Item</th>
                  <th className="py-1.5 text-right font-medium">Qty</th>
                  <th className="py-1.5 text-right font-medium">Rate</th>
                  <th className="py-1.5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoiceRows.map((r, i) =>
                <tr key={r[0]} className="border-b border-ink-100">
                    <td className="py-1.5 tabular-nums text-ink-400">{i + 1}.</td>
                    <td className="py-1.5 text-ink">{r[0]}</td>
                    <td className="py-1.5 text-right tabular-nums">{r[1]}</td>
                    <td className="py-1.5 text-right tabular-nums">{r[2]}</td>
                    <td className="py-1.5 text-right tabular-nums">{r[3]}</td>
                  </tr>
                )}
              </tbody>
            </table>
            <div className="flex items-end justify-between px-8 pb-6 pt-4">
              <div className="flex items-center gap-1.5 text-[10px] text-ink-400">
                <LogoMark size={14} tone="mono-ink" /> Generated with HisabIQ
              </div>
              <div className="w-48 text-[11.5px]">
                <div className="flex justify-between border-b border-ink-900 pb-1 font-semibold"><span>Total</span><span className="tabular-nums">৳25,850</span></div>
                <div className="mt-0.5 border-b border-ink-900" />
              </div>
            </div>
          </div>
        </Frame>

        <Frame title="Login branding" note="Web & desktop app" className="lg:col-span-2">
          <div className="mx-auto grid max-w-[880px] overflow-hidden rounded-xl bg-white shadow-pop ring-1 ring-ink-100 md:grid-cols-2">
            <div className="relative flex min-h-[360px] flex-col justify-between overflow-hidden bg-ink p-8 text-white">
              <div className="pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden="true">
                {Array.from({ length: 16 }).map((_, i) =>
                <div key={i} className="h-7 border-b border-white" />
                )}
                <div className="absolute inset-y-0 left-12 border-l border-white" />
                <div className="absolute inset-y-0 right-24 border-l border-white" />
              </div>
              <LogoLockup size={32} tone="inverse" className="relative" />
              <div className="relative">
                <p className="font-bn text-2xl font-medium leading-snug">সহজ হিসাব,<br />স্মার্ট ব্যবসা</p>
                <p className="mt-2 text-sm text-ink-300">Sales, stock, dues and cash — in one calm place.</p>
              </div>
              <Link to="/login" className="relative text-xs text-white underline underline-offset-4">Open interactive login preview</Link>
            </div>
            <div className="flex flex-col justify-center p-8">
              <p className="text-xl font-semibold tracking-tight text-ink">Sign in</p>
              <p className="mt-1 text-sm text-ink-500">Welcome back. <span className="font-bn">আবার স্বাগতম।</span></p>
              <div className="mt-6 space-y-3">
                <label className="block text-[13px] font-medium text-ink">
                  Mobile number
                  <div className="relative mt-1.5">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                    <Input className="pl-9" type="tel" placeholder="01XXXXXXXXX" readOnly />
                  </div>
                </label>
                <label className="block text-[13px] font-medium text-ink">
                  Password
                  <div className="relative mt-1.5">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                    <Input className="pl-9 pr-9" type="password" placeholder="Enter your password" readOnly />
                    <Eye className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-400" />
                  </div>
                </label>
                <Button className="h-10 w-full">Sign in</Button>
                <p className="text-center text-xs text-ink-500">
                  New to HisabIQ? <span className="font-medium text-teal-700">Create account</span>
                </p>
              </div>
            </div>
          </div>
        </Frame>

        <Frame title="Receipt / POS header" note="80mm thermal · monochrome mark" className="lg:col-span-2">
          <div className="grid items-start gap-6 md:grid-cols-[auto_1fr]">
            <ReceiptPreview
              invoice="INV-000240"
              lines={[
              { name: 'LED Bulb 12W', qty: '1 Box', price: 1550, total: 1550 },
              { name: 'Teflon Tape', qty: '4 Pcs', price: 25, total: 100 },
              { name: 'Wire Mesh Net 3 ft', qty: '1 Gauge', price: 180, total: 180 }]
              }
              subtotal={1830}
              discount={0}
              rounding={10}
              total={1840}
              paid={1840}
              due={0}
              method="Cash" />
            
            <div className="space-y-3 text-sm text-ink-600">
              <p className="font-medium text-ink">Thermal rules</p>
              <ul className="list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed">
                <li>Monochrome mark only, minimum 7mm. Shop name leads; HisabIQ signs off in the footer.</li>
                <li>Dashed rules separate header, lines and totals — echoing the ledger rule in the mark.</li>
                <li>Line numbers <span className="tabular-nums">1., 2., 3.</span> and qty × rate on a second line keep 32-column printers readable.</li>
                <li>Total is the only bold figure. Bangla thank-you line in Hind Siliguri.</li>
              </ul>
            </div>
          </div>
        </Frame>
      </div>
    </section>);

}
