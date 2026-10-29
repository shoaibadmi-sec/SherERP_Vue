import {ModuleSettingsEntry} from '../../settings/ModuleSettingsEntry';
import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { PageBoundary } from './PageBoundary';
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CashSessionDialog } from "./CashSessionDialog";
import { CashSessionProvider } from "../../contexts/CashSessionContext";
import {
  TenantSettingsProvider,
  useTenantSettings,
} from "../../settings/TenantSettingsProvider";
import { UserPreferencesProvider } from "../../contexts/UserPreferencesContext";
import { useUiCopy } from '../../i18n/useUiCopy';

function Workspace() {
  const { personal, warning } = useTenantSettings();
  const { text, language } = useUiCopy();
  // Screen readers need the actual document language, not just translated labels.
  // The ERP owns this while mounted; the SaaS shell retains English on exit.
  useEffect(() => {
    document.documentElement.lang = language === "Bangla" ? "bn" : "en";
    return () => { document.documentElement.lang = "en"; };
  }, [language]);
  return (
    <UserPreferencesProvider>
      <CashSessionProvider>
        <div
          data-density={personal.density}
          className="erp-workspace flex min-h-screen w-full bg-background"
        >
          <a href="#erp-main" onClick={event=>{event.preventDefault();document.getElementById('erp-main')?.focus();}} className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:rounded-md focus:bg-card focus:p-3 focus:text-ink">{text('Skip to workspace','কাজের জায়গায় যান')}</a>
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <TopBar />
            <main id="erp-main" tabIndex={-1} className="min-w-0 flex-1 px-3 py-4 sm:px-4 sm:py-5 lg:px-6">
              {warning && (
                <p
                  role="alert"
                  className="mb-4 rounded-lg bg-warning-bg p-3 text-sm text-warning"
                >
                  {warning}
                </p>
              )}
              <ModuleSettingsEntry><PageBoundary><Outlet /></PageBoundary></ModuleSettingsEntry>
            </main>
          </div>
        </div>
        <CashSessionDialog />
      </CashSessionProvider>
    </UserPreferencesProvider>
  );
}

export function AppShell() {
  return (
    <TenantSettingsProvider>
      <Workspace />
    </TenantSettingsProvider>
  );
}
