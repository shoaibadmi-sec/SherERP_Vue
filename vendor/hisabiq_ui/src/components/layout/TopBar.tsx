import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  Calculator as CalculatorIcon,
  ChevronDown,
  LogOut,
  Plus,
  Settings,
  User,
  Wallet,
  Languages,
  Palette,
  Menu,
  X } from
'lucide-react';
import { ThemePicker } from './ThemePicker';
import { Button } from '../Button';
import { FloatingPanel } from './FloatingPanel';
import { Calculator } from './Calculator';
import { ErpNavMenu } from './ErpNavMenu';
import { GlobalSearchBox } from './GlobalSearchBox';
import { LogoMark } from '../brand/Logo';
import { useTenantSettings } from '../../settings/TenantSettingsProvider';
import { useCashSession } from '../../contexts/CashSessionContext';
import { notifications } from '../../data/dashboard';
import { taka } from '../../utils/currency';
import { useUiCopy } from '../../i18n/useUiCopy';
import { lockBodyScroll } from '../../utils/bodyScrollLock';

/** Presentation copy for static, preview-only notification fixtures. */
const notificationBangla: Record<string, { title: string; body: string; time: string }> = {
  n1: { title: 'Gate Valve ¾" এর স্টক কম', body: '4 পিস আছে · সর্বনিম্ন 10', time: '12 মিনিট আগে' },
  n2: { title: 'bKash পেমেন্ট পাওয়া গেছে', body: 'Nur Enterprise INV-000239 এর জন্য ৳6,000 দিয়েছে', time: '1 ঘণ্টা আগে' },
  n3: { title: 'সরবরাহকারীর বিল আগামীকাল দিতে হবে', body: 'Karim Traders · PUR-000118 · ৳58,600', time: '3 ঘণ্টা আগে' },
  n4: { title: 'ক্যাশ সেশন খোলা হয়েছে', body: 'Anis শুরুর ক্যাশ ৳5,000 রেখেছেন', time: '9:02 AM' }
};

const toneDot = {
  warning: 'bg-warning',
  success: 'bg-success',
  danger: 'bg-danger',
  info: 'bg-info'
};

export function TopBar() {
  const { text, language } = useUiCopy();
  const { setOpen, sessionOpen, expectedCash } = useCashSession();
  const { state,actorId } = useTenantSettings();
  const activeEmployee=state.sections.team.employees.find(employee=>employee.id===actorId&&employee.active);
  const userName=activeEmployee?.name.trim()||text('User','ব্যবহারকারী');
  const initials=userName.split(/\s+/).slice(0,2).map(part=>part[0]||'').join('').toUpperCase();
  const firstRole=activeEmployee?.roleIds[0];
  const roleName=firstRole==='owner'?text('Owner','মালিক')
    :state.sections.team.roles.find(role=>role.id===firstRole)?.name??text('Staff','কর্মী');
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const headerRef = useRef<HTMLElement>(null);

  // Native focus/scrollIntoView must leave controls below the sticky header.
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const root = document.documentElement;
    const previous = root.style.scrollPaddingTop;
    const measure = () => { root.style.scrollPaddingTop = (header.getBoundingClientRect().height + 8) + 'px'; };
    const observer = new ResizeObserver(measure);
    observer.observe(header);
    measure();
    return () => { observer.disconnect(); root.style.scrollPaddingTop = previous; };
  }, []);

  const [navOpen,setNavOpen] = useState(false);
  const navTrigger = useRef<HTMLButtonElement>(null);
  const navDialog = useRef<HTMLDivElement>(null);
  const closeMobileNav = () => {
    setNavOpen(false);
    navTrigger.current?.focus({ preventScroll: true });
  };

  // A modal sidebar must lock background scrolling and keep keyboard focus inside it.
  useEffect(() => {
    if (!navOpen) return;
    const releaseScrollLock = lockBodyScroll();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMobileNav();
        return;
      }
      if (event.key !== 'Tab' || !navDialog.current) return;
      const controls = Array.from(navDialog.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )).filter(el => el.getClientRects().length > 0);
      if (!controls.length) return;
      const first = controls[0], last = controls[controls.length - 1];
      if (event.shiftKey && (document.activeElement === first || !navDialog.current.contains(document.activeElement))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !navDialog.current.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      releaseScrollLock();
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [navOpen]);

  // Never leave the mobile modal open after navigation or expanding to desktop.
  useEffect(() => setNavOpen(false), [pathname]);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const onChange = () => { if (media.matches) setNavOpen(false); };
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return (
    <>
    <header ref={headerRef} data-print-hide className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
      <div className="flex min-h-14 flex-wrap items-center gap-2 px-3 py-2 sm:h-14 sm:flex-nowrap sm:gap-3 sm:px-4 sm:py-0 lg:px-6">
        <button ref={navTrigger} type="button" aria-label={text("Open ERP navigation","ERP মেনু খুলুন")} aria-expanded={navOpen}
          aria-controls="erp-mobile-drawer" onClick={()=>setNavOpen(true)}
          className="flex size-9 shrink-0 items-center justify-center rounded-lg text-ink-600 hover:bg-ink-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500 lg:hidden">
          <Menu className="size-5"/>
        </button>
        <Link to="/app/dashboard" className="shrink-0 lg:hidden" aria-label="HisabIQ">
          <LogoMark size={28} />
        </Link>

        <GlobalSearchBox />

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <ThemePicker language={language} />
          {pathname !== '/app/pos' &&
          <Button size="sm" className="hidden md:inline-flex" onClick={() => navigate('/app/pos')}>
              <Plus className="size-4" /> {text("New sale","নতুন বিক্রি")}
            </Button>
          }

          {state.sections.money.cashSession && <button
            onClick={() => setOpen(true)}
            className="hidden h-9 items-center gap-2 rounded-lg border border-border px-2.5 text-[13px] text-ink-700 transition-colors hover:bg-ink-50 sm:flex">
            
            <span className={`size-2 rounded-full ${sessionOpen ? 'bg-success' : 'bg-ink-300'}`} aria-hidden="true" />
            <Wallet className="size-3.5 text-ink-400" aria-hidden="true" />
            {sessionOpen ?
            <>
                <span>{text('Cash','ক্যাশ')}</span>
                <span className="font-medium tabular-nums text-ink">{taka(expectedCash)}</span>
              </> :

            <span>{text('Open cash session','ক্যাশ সেশন খুলুন')}</span>
            }
          </button>}

          <FloatingPanel
            label={text("Calculator","ক্যালকুলেটর")}
            width={310}
            panelClassName="overflow-hidden"
            trigger={({ open, toggle }) =>
            <button
              onClick={toggle}
              aria-label={text("Calculator","ক্যালকুলেটর")}
              aria-expanded={open}
              className={`flex size-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink ${open ? 'bg-ink-50 text-ink' : ''}`}>
              
                <CalculatorIcon className="size-4" />
              </button>
            }>
            
            {() => <Calculator />}
          </FloatingPanel>

          <FloatingPanel
            label={text("Notifications","নোটিফিকেশন")}
            width={340}
            trigger={({ open, toggle }) =>
            <button
              onClick={toggle}
              aria-label={text("Notifications","নোটিফিকেশন")}
              aria-expanded={open}
              className={`relative flex size-9 items-center justify-center rounded-lg text-ink-500 transition-colors hover:bg-ink-50 hover:text-ink ${open ? 'bg-ink-50 text-ink' : ''}`}>
              
                <Bell className="size-4" />
                {/* Preview notices have no read-state tracking: do not imply unread messages. */}
              </button>
            }>
            
            {(close) =>
            <div>
                <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                  <p className="text-sm font-semibold">{text("Notifications","নোটিফিকেশন")}</p>
                  <button onClick={close} className="text-xs font-medium text-teal-700 hover:underline">
                    {text("Close","বন্ধ করুন")}
                  </button>
                </div>
                <p className="px-4 py-1.5 text-[11px] text-ink-500">{text("Sample notifications · UI preview only","নমুনা নোটিফিকেশন · শুধু UI প্রিভিউ")}</p>
                <ul className="max-h-80 divide-y divide-border overflow-auto">
                  {notifications.map((n) =>
                <li key={n.id} className="flex gap-3 px-4 py-3 hover:bg-ink-50">
                      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${toneDot[n.tone]}`} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-ink">{text(n.title, notificationBangla[n.id]?.title ?? n.title)}</p>
                        <p className="text-xs text-ink-500">{text(n.body, notificationBangla[n.id]?.body ?? n.body)}</p>
                      </div>
                      <span className="shrink-0 text-[11px] text-ink-400">{text(n.time, notificationBangla[n.id]?.time ?? n.time)}</span>
                    </li>
                )}
                </ul>
              </div>
            }
          </FloatingPanel>

          <FloatingPanel
            label={text("User menu","ব্যবহারকারীর মেনু")}
            width={240}
            trigger={({ open, toggle }) =>
            <button
              onClick={toggle}
              aria-expanded={open}
              aria-label={text("User menu","ব্যবহারকারীর মেনু")+" "+initials+" "+userName+" "+roleName}
              className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1.5 hover:bg-ink-50">
              
                <span className="flex size-7 items-center justify-center rounded-full bg-inverse text-[11px] font-semibold text-white">{initials}</span>{' '}
                <span className="hidden text-left leading-tight xl:block">
                  <span className="block text-[13px] font-medium text-ink">{userName}</span>{' '}
                  <span className="block text-[11px] text-ink-500">{roleName}</span>
                </span>
                <ChevronDown className="size-3.5 text-ink-400" aria-hidden="true" />
              </button>
            }>
            
            {(close) =>
            <div className="p-1.5 text-[13px]">
                <div className="px-2.5 py-2">
                  <p className="font-medium text-ink">{userName}</p>
                  <p className="text-xs text-ink-500">{activeEmployee?.email||text('Preview account','নমুনা অ্যাকাউন্ট')}</p>
                </div>
                <div className="my-1 h-px bg-ink-100" />
                {[
              { icon: User, label: text('Profile','প্রোফাইল'), route: '/app/settings/personal' },
              { icon: Languages, label: text('Language','ভাষা') + ': ' + (language === 'Bangla' ? 'বাংলা' : language === 'English + Bangla' ? 'English + বাংলা' : 'English'), route: '/app/settings/personal' },
              { icon: Settings, label: text('Business settings','ব্যবসার সেটিংস'), route: '/app/settings/business' }].
              map(({ icon: Icon, label, route }) =>
              <button key={route + label} onClick={() => { close(); navigate(route); }} className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 py-1 text-ink-700 hover:bg-ink-50">
                    <Icon className="size-4 text-ink-400" /> <span className="font-bn">{label}</span>
                  </button>
              )}
                <Link to="/design-system" onClick={close} className="flex h-9 w-full items-center gap-2 rounded-md px-2.5 py-1 text-ink-700 hover:bg-ink-50">
                  <Palette className="size-4 text-ink-400" /> {text("Brand guide","ব্র্যান্ড গাইড")}
                </Link>
                <div className="my-1 h-px bg-ink-100" />
                <button type="button" disabled aria-disabled="true"
                  title={text("Sign out is not available in the UI preview","UI প্রিভিউতে সাইন আউট চালু নেই")}
                  className="flex h-9 w-full cursor-not-allowed items-center gap-2 rounded-md px-2.5 py-1 text-ink-400 opacity-70">
                  <LogOut className="size-4" /> {text("Sign out (preview only)","সাইন আউট (শুধু প্রিভিউ)")}
                </button>
              </div>
            }
          </FloatingPanel>
        </div>
      </div>

    </header>
    {navOpen && createPortal(
      <div data-print-hide className="fixed inset-0 z-[80] lg:hidden" aria-label={text("Mobile navigation overlay","মোবাইল মেনু")}>
        <button type="button" className="fixed inset-0 bg-inverse/50" aria-label={text("Close ERP navigation","ERP মেনু বন্ধ করুন")}
          onClick={closeMobileNav}/>
        <div ref={navDialog} id="erp-mobile-drawer" role="dialog" aria-modal="true" aria-label={text("ERP navigation","ERP মেনু")}
          className="fixed inset-y-0 left-0 flex h-[100dvh] w-[min(87vw,320px)] max-w-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground shadow-xl"
          style={{backgroundColor:'var(--sidebar)'}}>
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-4">
            <span className="text-sm font-semibold text-sidebar-foreground">HisabIQ · {text("Modules","মডিউল")}</span>
            <button type="button" autoFocus aria-label={text("Close navigation","মেনু বন্ধ করুন")} onClick={closeMobileNav}
              className="flex size-9 items-center justify-center rounded-lg text-sidebar-foreground hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring">
              <X className="size-5"/>
            </button>
          </div>
          <ErpNavMenu mode="mobile" onNavigate={()=>setNavOpen(false)}/>
          <Link to="/app/support" onClick={()=>setNavOpen(false)}
            className="border-t border-sidebar-border px-5 py-3 text-sm text-sidebar-foreground">{text("Help & Support","সাহায্য ও সাপোর্ট")}</Link>
        </div>
      </div>,
      document.body
    )}
    </>);

}
