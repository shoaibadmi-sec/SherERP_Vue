import { useState } from "react";
import { AppSelect } from "../components/AppSelect";
import { Button, Input, Switch, SettingsField, SettingCard } from "./ui";
import {
  outputProfileDefaults,
  type OutputProfile,
} from "../documents/outputProfile";
import { printReport } from "../utils/reportOutput";
import type { InvoiceSettings, BusinessSettings } from "./model";
export function OutputDesignSettings({
  value,
  business,
  onChange,
  disabled,
}: {
  value: InvoiceSettings;
  business: BusinessSettings;
  onChange: (v: InvoiceSettings) => void;
  disabled: boolean;
}) {
  const [kind, setKind] = useState<"ledger" | "report">("ledger");
  const p = value.profiles?.[kind] ?? outputProfileDefaults(kind);
  const update = (patch: Partial<OutputProfile>) =>
    onChange({
      ...value,
      profiles: {
        ledger: value.profiles?.ledger ?? outputProfileDefaults("ledger"),
        report: value.profiles?.report ?? outputProfileDefaults("report"),
        [kind]: { ...p, ...patch },
      },
    });
  return (
    <SettingCard title="Ledger & report print designs · খাতা ও রিপোর্টের প্রিন্ট">
      <div className="grid gap-3 sm:grid-cols-2">
        <SettingsField label="Document family" bn="বিবরণের ধরন">
          {(id) => (
            <AppSelect
              id={id}
              label="Document family"
              value={kind}
              onChange={(v) => setKind(v as typeof kind)}
              options={[
                { value: "ledger", label: "Ledger statements" },
                { value: "report", label: "Reports" },
              ]}
            />
          )}
        </SettingsField>
        <SettingsField label="Output language" bn="বিবরণের ভাষা">
          {(id) => (
            <AppSelect
              id={id}
              label="Output language"
              value={p.language}
              disabled={disabled}
              onChange={(v) =>
                update({ language: v as OutputProfile["language"] })
              }
              options={[
                { value: "English", label: "English" },
                { value: "English + Bangla", label: "English + Bangla" },
                { value: "Bangla", label: "Full Bangla" },
              ]}
            />
          )}
        </SettingsField>
        <SettingsField label="Output orientation" bn="কাগজের দিক">
          {(id) => (
            <AppSelect
              id={id}
              label="Output orientation"
              value={p.orientation}
              disabled={disabled}
              onChange={(v) =>
                update({ orientation: v as OutputProfile["orientation"] })
              }
              options={["Portrait", "Landscape"]}
            />
          )}
        </SettingsField>
        <SettingsField label="Output margins (mm)" bn="মার্জিন">
          {(id) => (
            <Input
              id={id}
              aria-label="Output margins (mm)"
              type="number"
              min={2}
              max={30}
              value={p.margin}
              disabled={disabled}
              onChange={(e) => update({ margin: Number(e.target.value) })}
            />
          )}
        </SettingsField>
      </div>
      <label className="flex items-center justify-between gap-3 text-[13px]">
        Business header
        <Switch
          aria-label="Output business header"
          checked={p.showBusiness}
          disabled={disabled}
          onCheckedChange={(v) => update({ showBusiness: v })}
        />
      </label>
      <label className="flex items-center justify-between gap-3 text-[13px]">
        Signature line
        <Switch
          aria-label="Output signature line"
          checked={p.showSignatures}
          disabled={disabled}
          onCheckedChange={(v) => update({ showSignatures: v })}
        />
      </label>
      <SettingsField label="Output footer" bn="শেষের লেখা">
        {(id) => (
          <Input
            id={id}
            disabled={disabled}
            value={p.footer}
            onChange={(e) => update({ footer: e.target.value })}
          />
        )}
      </SettingsField>
      <Button
        variant="outline"
        onClick={() =>
          printReport({
            title: kind === "ledger" ? "Ledger statement" : "Stock statement",
            businessName: business.name,
            profile: p,
            headers: ["Date", "Description", "Debit", "Credit", "Balance"],
            rows: [["27 Oct 2026", "Sample", 1250, 430, 820]],
          })
        }
      >
        Preview {kind} design
      </Button>
      <p className="text-xs text-helper">
        A4 output · Settings changes the print design; generate actual reports
        inside Reports.
      </p>
    </SettingCard>
  );
}
