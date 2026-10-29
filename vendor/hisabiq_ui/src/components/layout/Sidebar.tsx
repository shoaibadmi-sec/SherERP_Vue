import { MOTION_MS, MOTION_EASE } from '../../motion/tokens';
import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Palette, LifeBuoy } from 'lucide-react';
import { useTenantSettings } from '../../settings/TenantSettingsProvider';
import { LogoLockup, LogoMark } from '../brand/Logo';
import { ErpNavMenu } from './ErpNavMenu';
import { SidebarTrigger } from './SidebarTrigger';
import { useUiCopy } from '../../i18n/useUiCopy';

const COLLAPSED_KEY = 'hisabiq:sidebar-collapsed';
const MotionLink = motion(Link);

function getInitialCollapsed() {
  try { return window.localStorage.getItem(COLLAPSED_KEY) === 'true'; }
  catch { return false; }
}

export function Sidebar() {
  const { text } = useUiCopy();
  const reducedMotion = useReducedMotion();
  const pressMotion = reducedMotion ? undefined : { scale: 0.985 };
  const { state } = useTenantSettings();
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const businessName = state.sections.business.name || 'Business';
  const businessInitials = businessName.trim().split(/\s+/).slice(0, 2).map(part => part[0] || '').join('').toUpperCase() || 'HQ';

  useEffect(() => {
    try { window.localStorage.setItem(COLLAPSED_KEY, String(collapsed)); }
    catch { /* Storage may be blocked; local navigation still works. */ }
  }, [collapsed]);

  // The standard shadcn SidebarTrigger shortcut works from the whole workspace.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        setCollapsed(previous => !previous);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const linkStyle = 'flex min-h-10 items-center rounded-lg text-[13px] text-ink-600 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring';
  return <motion.aside
    data-print-hide
    data-sidebar="sidebar"
    aria-label={text('Primary navigation','প্রধান নেভিগেশন')}
    data-collapsible={collapsed ? 'icon' : 'none'}
    data-motion-sidebar=""
    initial={false}
    animate={{ width: collapsed ? 64 : 256 }}
    transition={reducedMotion ? { duration: 0 } : { duration: MOTION_MS.sidebar / 1000, ease: MOTION_EASE }}
    className="group/sidebar relative sticky top-0 z-20 hidden h-screen shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar lg:flex"
  >
    <div className={'flex h-14 shrink-0 items-center ' + (collapsed ? 'justify-center px-1' : 'justify-between px-3')}>
      <Link
        to="/app/dashboard"
        aria-label={text("HisabIQ dashboard","HisabIQ ড্যাশবোর্ড")}
        title={collapsed ? text('HisabIQ dashboard','HisabIQ ড্যাশবোর্ড') : undefined}
        className="flex min-w-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        {collapsed ? <LogoMark size={28} /> : <LogoLockup size={26} />}
      </Link>
      {!collapsed &&
        <SidebarTrigger collapsed={collapsed} onToggle={() => setCollapsed(value => !value)} />}
    </div>

    {collapsed ? (
      <div className="flex shrink-0 flex-col items-center gap-1 border-b border-sidebar-border pb-3">
        <SidebarTrigger collapsed={collapsed} onToggle={() => setCollapsed(false)} />
        <span
          title={businessName + ' · ' + text('Main branch · Dhaka','মূল শাখা · ঢাকা')}
          aria-label={text('Current business: ','বর্তমান ব্যবসা: ') + businessName}
          className="mt-1 flex size-9 items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-accent text-xs font-semibold text-sidebar-primary"
        >
          {businessInitials}
        </span>
      </div>
    ) : (
      <div className="mx-3 mb-2 flex shrink-0 items-center gap-2.5 rounded-lg border border-sidebar-border bg-card px-2.5 py-2.5 shadow-card">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-xs font-semibold text-sidebar-primary">
          {businessInitials}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[13px] font-semibold text-sidebar-foreground" title={businessName}>
            {businessName}
          </span>
          <span className="mt-1 block truncate text-[11px] text-ink-500">{text('Main branch · Dhaka','মূল শাখা · ঢাকা')}</span>
        </span>
      </div>
    )}

    <ErpNavMenu mode="desktop" collapsed={collapsed} onExpandSidebar={() => setCollapsed(false)} />

    <div className={'shrink-0 space-y-0.5 border-t border-sidebar-border py-2 ' + (collapsed ? 'px-2' : 'px-3')}>
      <MotionLink to="/app/support" aria-label={text('Help & Support','সাহায্য ও সাপোর্ট')} title={collapsed ? text('Help & Support','সাহায্য ও সাপোর্ট') : undefined}
        whileTap={pressMotion} transition={{ duration: reducedMotion ? 0 : MOTION_MS.navHover / 1000, ease: MOTION_EASE }}
        className={linkStyle + ' ' + (collapsed ? 'justify-center' : 'gap-2.5 px-2.5')}>
        <LifeBuoy className="size-[18px] shrink-0 text-ink-400" aria-hidden="true" />
        {!collapsed && <span>{text('Help & Support','সাহায্য ও সাপোর্ট')}</span>}
      </MotionLink>
      <MotionLink to="/design-system" aria-label={text('Brand guide','ব্র্যান্ড গাইড')} title={collapsed ? text('Brand guide','ব্র্যান্ড গাইড') : undefined}
        whileTap={pressMotion} transition={{ duration: reducedMotion ? 0 : MOTION_MS.navHover / 1000, ease: MOTION_EASE }}
        className={linkStyle + ' ' + (collapsed ? 'justify-center' : 'gap-2.5 px-2.5')}>
        <Palette className="size-[18px] shrink-0 text-ink-400" aria-hidden="true" />
        {!collapsed && <span>{text('Brand guide','ব্র্যান্ড গাইড')}</span>}
      </MotionLink>
    </div>
    <button
      type="button"
      aria-label={text("Toggle sidebar width","সাইডবারের আকার বদলান")}
      title={text("Toggle sidebar width","সাইডবারের আকার বদলান")}
      onClick={() => setCollapsed(value => !value)}
      className="group/sidebar-resize absolute inset-y-0 -right-2 z-10 hidden w-6 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring lg:block"
    >
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 w-1 -translate-x-1/2 rounded-full group-hover/sidebar-resize:bg-sidebar-primary/15 group-focus-visible/sidebar-resize:bg-sidebar-primary/20" />
    </button>
  </motion.aside>;
}
