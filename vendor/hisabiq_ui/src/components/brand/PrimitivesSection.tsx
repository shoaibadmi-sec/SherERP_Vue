import React from 'react';
import {
  ArrowDownLeft,
  Banknote,
  BookOpen,
  Calculator,
  FileText,
  HandCoins,
  Package,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Scale,
  Paperclip } from
'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { StatusBadge } from '../StatusBadge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../Table';
import { SalesTrendChart } from '../dashboard/SalesTrendChart';
import { SectionHeader } from './SectionHeader';

const icons = [
{ icon: ShoppingCart, name: 'Sale' },
{ icon: Package, name: 'Product' },
{ icon: Users, name: 'Party' },
{ icon: Receipt, name: 'Expense' },
{ icon: Truck, name: 'Purchase' },
{ icon: Wallet, name: 'Cash' },
{ icon: HandCoins, name: 'Payment' },
{ icon: BookOpen, name: 'Daybook' },
{ icon: Scale, name: 'Reconcile' },
{ icon: Calculator, name: 'Calculator' },
{ icon: FileText, name: 'Invoice' },
{ icon: Paperclip, name: 'Attachment' }];


function Block({ title, children, className = '' }: {title: string;children: React.ReactNode;className?: string;}) {
  return (
    <div className={`min-w-0 overflow-hidden rounded-2xl border border-ink-100 bg-white p-6 ${className}`}>
      <p className="mb-4 text-xs font-medium uppercase tracking-wider text-ink-400">{title}</p>
      {children}
    </div>);

}

export function PrimitivesSection() {
  return (
    <section id="primitives" className="mx-auto max-w-[1280px] scroll-mt-20 px-6 py-16">
      <SectionHeader
        index="05"
        title="UI primitives"
        bn="ইউআই উপাদান"
        description="Shadcn-based components tuned to HisabIQ: 10px radius, 1px Ink-100 borders, one shadow for floating layers, teal reserved for the action that matters." />
      

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Block title="Buttons" className="lg:col-span-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button><Plus className="size-4" /> New sale</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Delete</Button>
            <Button variant="link">Link</Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="lg" data-erp-workflow-action="complete" className="h-12 px-6 text-[15px] font-semibold">Complete sale · ৳12,450</Button>
            <Button size="sm" variant="outline">Small</Button>
            <Button size="xs" variant="outline">XS</Button>
            <Button size="icon" variant="outline" aria-label="Search"><Search className="size-4" /></Button>
            <Button disabled>Disabled</Button>
          </div>
          <p className="mt-4 text-xs text-ink-500">Standard buttons and inputs use 36px. Major checkout and transaction completion actions use 48px; primary color alone does not imply larger size.</p>
        </Block>

        <Block title="Badges & status">
          <div className="flex flex-wrap gap-1.5">
            <StatusBadge tone="success" dot>Paid</StatusBadge>
            <StatusBadge tone="warning" dot>Partial</StatusBadge>
            <StatusBadge tone="danger" dot>Due</StatusBadge>
            <StatusBadge tone="info" dot>Supplier</StatusBadge>
            <StatusBadge tone="teal">Customer</StatusBadge>
            <StatusBadge tone="neutral">Draft</StatusBadge>
            <StatusBadge tone="ink">Owner</StatusBadge>
            <StatusBadge tone="warning">Low stock</StatusBadge>
          </div>
          <p className="mt-4 text-xs text-ink-500">Tinted background + dark label. Dots mark state; plain badges mark roles.</p>
        </Block>

        <Block title="Inputs">
          <div className="space-y-3">
            <label className="block text-[13px] font-medium text-ink">
              Party name <span className="font-bn text-[11px] font-normal text-ink-400">নাম</span>
              <Input className="mt-1.5" placeholder="Rahman Hardware" />
            </label>
            <label className="block text-[13px] font-medium text-ink">
              Amount
              <div className="relative mt-1.5">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-400">৳</span>
                <Input className="pl-7 text-right" defaultValue="48,650" />
              </div>
            </label>
            <label className="block text-[13px] font-medium text-ink">
              Phone
              <Input className="mt-1.5 border-danger" defaultValue="01711-48" aria-invalid="true" />
              <span className="mt-1 block text-xs text-danger">Enter an 11-digit mobile number.</span>
            </label>
          </div>
        </Block>

        <Block title="Card">
          <div className="rounded-xl border border-ink-100 bg-white p-3.5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[12.5px] font-medium text-ink-600">Receivable</p>
                <p className="font-bn text-[11px] text-ink-400">পাওনা</p>
              </div>
              <span className="flex size-7 items-center justify-center rounded-lg bg-ink-50 text-ink-700"><ArrowDownLeft className="size-3.5" /></span>
            </div>
            <p className="mt-2 text-[22px] font-semibold tracking-tight">৳1,80,300</p>
            <p className="text-[11.5px] text-ink-500">From 6 parties · পাবো</p>
          </div>
          <div className="mt-3 rounded-xl border border-ink-100 bg-ink p-3.5 text-white">
            <p className="text-sm text-ink-300">Total payable · মোট</p>
            <p className="text-right text-[28px] font-semibold">৳12,450</p>
          </div>
        </Block>

        <Block title="Chart">
          <SalesTrendChart height={168} />
          <p className="mt-2 text-xs text-ink-500">Teal for the hero series, Ink for comparison, Ink-300 for secondary. Dashed light gridlines.</p>
        </Block>

        <Block title="Table" className="lg:col-span-2">
          <div className="overflow-hidden rounded-lg border border-ink-100">
            <Table>
              <TableHeader>
                <TableRow className="bg-ink-50 hover:bg-ink-50">
                  <TableHead className="h-8 w-10 pl-3 text-xs">#</TableHead>
                  <TableHead className="h-8 text-xs">Product</TableHead>
                  <TableHead className="h-8 text-right text-xs">Qty</TableHead>
                  <TableHead className="h-8 text-xs">Unit</TableHead>
                  <TableHead className="h-8 text-right text-xs">Price</TableHead>
                  <TableHead className="h-8 pr-3 text-right text-xs">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                ['PVC Pipe 1" (20 ft)', '4', 'Pcs', '420', '1,680'],
                ['LED Bulb 12W', '2', 'Box', '1,550', '3,100'],
                ['Wire Mesh Net 3 ft', '3', 'Gauge', '180', '540']].
                map((r, i) =>
                <TableRow key={r[0]} className="text-[13px]">
                    <TableCell className="py-2 pl-3 text-ink-400">{i + 1}.</TableCell>
                    <TableCell className="py-2 font-medium">{r[0]}</TableCell>
                    <TableCell className="py-2 text-right">{r[1]}</TableCell>
                    <TableCell className="py-2 text-ink-600">{r[2]}</TableCell>
                    <TableCell className="py-2 text-right">৳{r[3]}</TableCell>
                    <TableCell className="py-2 pr-3 text-right font-semibold">৳{r[4]}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="mt-2 text-xs text-ink-500">Rows grow with content. Data 13px, headings 12px, helpers/badges 11px; numbers right-aligned and units as plain words.</p>
        </Block>

        <Block title="Iconography">
          <div className="grid grid-cols-4 gap-2">
            {icons.map(({ icon: Icon, name }) =>
            <div key={name} className="flex flex-col items-center gap-1 rounded-lg py-2 text-ink-700 hover:bg-ink-50">
                <Icon className="size-5" strokeWidth={1.75} />
                <span className="text-[10.5px] text-ink-500">{name}</span>
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-ink-500">Lucide, 1.75px stroke, 16/20px. Literal objects — no growth arrows, coins or sparkles.</p>
        </Block>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-6 rounded-2xl border border-ink-100 bg-white px-6 py-4 text-xs text-ink-500">
        <span className="flex items-center gap-2"><span className="size-4 rounded-[8px] border border-ink-200" /> Radius 8 inputs</span>
        <span className="flex items-center gap-2"><span className="size-4 rounded-[10px] border border-ink-200" /> 10 buttons</span>
        <span className="flex items-center gap-2"><span className="size-4 rounded-[12px] border border-ink-200" /> 12 cards</span>
        <span className="flex items-center gap-2"><span className="size-4 rounded-md bg-white shadow-card ring-1 ring-ink-100" /> Shadow · card</span>
        <span className="flex items-center gap-2"><span className="size-4 rounded-md bg-white shadow-pop" /> Shadow · floating</span>
        <span className="flex items-center gap-2"><Banknote className="size-4" /> Spacing on a 4px grid</span>
      </div>
    </section>);

}