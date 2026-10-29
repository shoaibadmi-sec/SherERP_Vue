import { useNavigate } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, ShoppingCart, Package, Users, ReceiptText, PieChart } from 'lucide-react';
import { Button } from '../Button';
import { LogoMark, Wordmark } from './Logo';

const screens = [
{ to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
{ to: '/app/pos', label: 'POS / Sales', icon: ShoppingCart },
{ to: '/app/products', label: 'Products', icon: Package },
{ to: '/app/parties', label: 'Parties & Ledger', icon: Users },
{ to: '/app/purchases', label: 'Purchases', icon: ReceiptText },
{ to: '/app/reports', label: 'Reports', icon: PieChart }];


export function BrandHero() {
  const navigate = useNavigate();
  return (
    <section id="top" className="mx-auto max-w-[1280px] px-6 pb-16 pt-14">
      <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-ink-100 bg-white px-3 py-1 text-xs text-ink-600 shadow-card">
            <span className="size-1.5 rounded-full bg-teal-600" /> Business management for Bangladesh SMEs
          </p>
          <Wordmark size={88} className="!text-[clamp(3rem,10vw,5.5rem)]" />
          <p className="mt-6 font-bn text-2xl font-medium text-ink">সহজ হিসাব, স্মার্ট ব্যবসা</p>
          <p className="mt-1 text-xl text-ink-500">Simple accounts. Smarter business.</p>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-[15px]">
            <span className="rounded-lg border border-ink-100 bg-white px-3 py-2 shadow-card">
              <span className="font-semibold text-ink">Hisab</span> <span className="font-bn text-ink-500">· হিসাব</span>
              <span className="block text-xs text-ink-500">the shop’s familiar account book</span>
            </span>
            <span className="text-xl text-ink-300">+</span>
            <span className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2">
              <span className="font-semibold text-teal-700">IQ</span>
              <span className="block text-xs text-teal-800">quiet intelligence on top</span>
            </span>
          </div>

          <div className="mt-10 flex flex-wrap gap-2">
            <Button size="lg" onClick={() => navigate('/app/dashboard')}>
              Explore the product <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/app/pos')}>
              Try the POS
            </Button>
          </div>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-2xl bg-ink p-10">
            <div className="pointer-events-none absolute inset-0 opacity-[0.07]" aria-hidden="true">
              {Array.from({ length: 14 }).map((_, i) =>
              <div key={i} className="h-8 border-b border-white" />
              )}
              <div className="absolute inset-y-0 left-16 border-l border-white" />
            </div>
            <div className="relative flex flex-col items-center py-6">
              <LogoMark size={168} tone="inverse" />
              <p className="mt-8 max-w-xs text-center text-sm leading-relaxed text-ink-300">
                An <span className="text-white">H</span> whose right stem becomes an <span className="text-white">i</span> — with the accountant’s
                double rule as its bridge and a single <span className="text-mint">signal dot</span> for intelligence.
              </p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {screens.map(({ to, label, icon: Icon }) =>
            <button
              key={to}
              onClick={() => navigate(to)}
              className="flex flex-col items-center gap-1.5 rounded-lg border border-ink-100 bg-white px-2 py-2.5 text-[11px] text-ink-600 shadow-card transition-colors hover:border-teal-300 hover:text-teal-700">
              
                <Icon className="size-4" /> {label}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>);

}
