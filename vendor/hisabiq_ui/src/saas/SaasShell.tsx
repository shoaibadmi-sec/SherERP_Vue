import React, { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { PageBoundary } from '../components/layout/PageBoundary';
import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Layers,
  Receipt,
  ShieldCheck,
  MessageSquare,
  Briefcase,
  LifeBuoy,
  Users,
  Megaphone,
  BarChart3,
  History,
  Settings,
  BookOpen,
  Menu,
  ArrowUpRight,
} from "lucide-react";
import { LogoLockup } from "../components/brand/Logo";
import { ThemePicker } from "../components/layout/ThemePicker";
import { useSaas } from "./SaasProvider";
import { allowed } from "./permissions";
import { Button, Select } from "./components";
import type { Permission } from "./types";
export const navigation = [
  ["overview", "My work", "আমার কাজ", LayoutDashboard, ""],
  ["tenants", "Tenants", "ব্যবসা প্রতিষ্ঠান", Building2, "tenants"],
  [
    "subscriptions",
    "Subscriptions",
    "সাবস্ক্রিপশন",
    CreditCard,
    "subscriptions",
  ],
  ["plans", "Plans", "প্ল্যান", Layers, "plans"],
  ["invoices", "Invoices", "বিল", Receipt, "billing"],
  [
    "payments",
    "Payment verification",
    "পেমেন্ট যাচাই",
    ShieldCheck,
    "payments",
  ],
  ["sms", "SMS", "বার্তা সেবা", MessageSquare, "sms"],
  ["services", "Services", "অতিরিক্ত সেবা", Briefcase, "services"],
  ["support", "Support tickets", "সহায়তা", LifeBuoy, "support"],
  ["knowledge", "Knowledge base", "সহায়িকা", BookOpen, "knowledge"],
  ["team", "Team & roles", "কর্মী ও দায়িত্ব", Users, "team"],
  ["announcements", "Announcements", "ঘোষণা", Megaphone, "announcements"],
  ["reports", "Reports", "রিপোর্ট", BarChart3, "reports"],
  ["audit", "Audit log", "কার্যক্রম", History, "audit"],
  ["settings", "Settings", "সেটিংস", Settings, "settings"],
] as const;
export function SaasShell() {
  const { state: s, actor, setActor, persistenceError } = useSaas();
  const [mobile, setMobile] = useState(false);
  const location = useLocation();
  const person = s.staff.find((e) => e.id === actor.id);
  const valid = actor.kind === "staff" && person?.status === "Active";
  return (
    <div className="saas-app flex min-h-screen bg-background text-ink">
      {mobile && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        className={`${mobile ? "flex" : "hidden"} fixed inset-y-0 left-0 z-40 w-[236px] shrink-0 flex-col border-r border-border bg-sidebar lg:sticky lg:top-0 lg:flex lg:h-screen`}
      >
        <Link
          to="/saas/overview"
          className="flex h-16 shrink-0 items-center px-5"
        >
          <LogoLockup size={26} />
        </Link>
        <div className="mx-3 mb-3 rounded-lg border border-border bg-card p-3">
          <p className="text-xs font-semibold">Platform administration</p>
          <p className="mt-1 text-[11px] text-ink-500">
            HisabIQ · Demo workspace
          </p>
        </div>
        <nav
          aria-label="Platform navigation"
          className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3"
        >
          {navigation
            .filter(
              (n) =>
                valid &&
                (!n[4] || allowed(s, actor, `${n[4]}.view` as Permission)),
            )
            .map(([path, label, bn, Icon]) => (
              <NavLink
                key={path}
                to={`/saas/${path}`}
                onClick={() => setMobile(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg px-3 py-2 ${isActive ? "bg-card text-ink shadow-card ring-1 ring-border" : "text-ink-600 hover:bg-card"}`
                }
              >
                <Icon size={16} />
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium">{label}</span>
                  <span className="block font-bn text-[10.5px] text-ink-500">
                    {bn}
                  </span>
                </span>
              </NavLink>
            ))}
        </nav>
        <Link
          to="/app/dashboard"
          className="flex items-center gap-2 border-t border-border p-4 text-xs text-ink-500"
        >
          Business workspace <ArrowUpRight size={14} />
        </Link>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation"
              className="lg:hidden"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span className="text-xs text-ink-500">
              Platform <span className="mx-2">/</span>
              <span className="text-ink">
                {navigation.find(
                  (n) => location.pathname.split("/")[2] === n[0],
                )?.[1] || "Overview"}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-3 py-2">
            <label className="flex items-center gap-2 text-[11px] text-ink-500">
              Demo staff account
              <Select
                aria-label="Demo staff account"
                value={actor.kind === "staff" ? actor.id : ""}
                onChange={(e) => {
                  if (
                    document.querySelector("dialog[open]") &&
                    !window.confirm(
                      "Close the open form and switch employee? Unsaved changes will be lost.",
                    )
                  )
                    return;
                  setActor({ kind: "staff", id: e.target.value });
                }}
              >
                <option value="" disabled>
                  Select employee
                </option>
                {s.staff
                  .filter((x) => x.status === "Active")
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
              </Select>
            </label>
            <ThemePicker />
          </div>
        </header>
        {persistenceError && (
          <div
            role="alert"
            className="m-4 rounded-lg bg-warning-bg p-3 text-xs text-warning"
          >
            {persistenceError}
          </div>
        )}
        <main key={actor.id} className="p-4 lg:p-6">
          {valid ? (
            <PageBoundary><Outlet /></PageBoundary>
          ) : (
            <div className="rounded-xl border border-border bg-card p-8">
              <h1 className="text-lg font-semibold">Staff access required</h1>
              <p className="my-3 text-sm text-ink-500">
                Choose an active demo staff account to inspect platform
                administration.
              </p>
              <Button onClick={() => setActor({ kind: "staff", id: "admin" })}>
                Use demo administrator
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
export function Guard({
  permission,
  children,
}: {
  permission: Permission;
  children: React.ReactNode;
}) {
  const { state, actor } = useSaas();
  return allowed(state, actor, permission) ? (
    <>{children}</>
  ) : (
    <div className="rounded-xl border border-border bg-card p-8">
      <h1 className="text-lg font-semibold">Access denied</h1>
      <p className="my-3 text-sm text-ink-500">
        Your roles do not include this module.
      </p>
      <Link className="text-primary underline" to="/saas/overview">
        Return to My work
      </Link>
    </div>
  );
}
