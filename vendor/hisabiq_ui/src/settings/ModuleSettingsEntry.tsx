import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Settings2, ArrowLeft } from "lucide-react";
import { Button } from "../components/Button";
import { SettingsPageContent } from "./TenantSettingsPage";
import type { SettingsSection } from "./model";
import { useUiCopy } from "../i18n/useUiCopy";
const modules: Record<
  string,
  {
    label: string;
    section: SettingsSection;
  }
> = {
  dashboard: { label: "Dashboard", section: "personal" },
  pos: { label: "POS", section: "sales" },
  sales: { label: "Sales", section: "sales" },
  products: { label: "Products", section: "products" },
  purchases: { label: "Purchases", section: "purchases" },
  parties: { label: "Parties", section: "financialTerminology" },
  vendors: { label: "Vendors", section: "financialTerminology" },
  finance: { label: "Finance", section: "money" },
  accounts: { label: "Accounts", section: "financialTerminology" },
  daybook: { label: "Daybook", section: "financialTerminology" },
  expenses: { label: "Expenses", section: "money" },
  reports: { label: "Reports", section: "invoices" },
  warranty: { label: "Warranty", section: "products" },
  quotations: { label: "Quotations", section: "invoices" },
  "online-sales": { label: "Online sales", section: "sales" },
};
export function ModuleSettingsEntry({
  children,
}: {
  children: React.ReactNode;
}) {
  const location = useLocation();
  const { text } = useUiCopy();
  const [moduleOpen, setOpen] = useState(false);
  useEffect(() => setOpen(false), [location.pathname]);
  const mod = modules[location.pathname.split("/")[2]];
  if (!mod) return <>{children}</>;
  return (
    <>
      <div className="mb-3 flex items-center justify-end gap-2">
        {moduleOpen && (
          <Button
            variant="outline"
            onClick={() => {
              const blocked = document.querySelector(
                "[data-settings-dirty=true]",
              );
              if (
                blocked &&
                !window.confirm(
                  text(
                    "Discard unsaved module settings?",
                    "সেটিংসের পরিবর্তন বাদ দেবেন?",
                  ),
                )
              )
                return;
              setOpen(false);
            }}
          >
            <ArrowLeft className="size-4" />
            {text("Back to", "ফিরুন")} {mod.label}
          </Button>
        )}
        <Button
          variant="ghost"
          aria-expanded={moduleOpen}
          onClick={() => setOpen(true)}
        >
          <Settings2 className="size-4" />
          {text("Settings", "সেটিংস")}
        </Button>
      </div>
      <div hidden={moduleOpen}>{children}</div>
      {moduleOpen && (
        <section aria-label={`${mod.label} settings`}>
          <SettingsPageContent
            key={location.pathname}
            sectionOverride={mod.section}
            embedded
          />
        </section>
      )}
    </>
  );
}
