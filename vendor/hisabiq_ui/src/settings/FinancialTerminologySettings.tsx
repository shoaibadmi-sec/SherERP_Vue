import { useState } from "react";
import { AppSelect } from "../components/AppSelect";
import { Input, SettingCard, SettingsField, Button } from "./ui";
import {
  applyFinancialPreset,
  financialPreview,
  financialContexts,
  financialDefaults,
  financialTerms,
  financialColumns,
  financialLabel,
  type FinancialDisplay,
  type FinancialContext,
  type FinancialTerm,
  type FinancialProfile,
} from "../financial-display/model";
import { taka } from "../utils/currency";
export function FinancialTerminologySettings({
  value,
  onChange,
  disabled,
  language,
}: {
  value: FinancialDisplay;
  onChange: (value: FinancialDisplay) => void;
  disabled: boolean;
  language: string;
}) {
  const [context, setContext] = useState<FinancialContext>("Customer"),
    [query, setQuery] = useState(""),
    [showAll, setShowAll] = useState(false);
  const profile = value.contexts[context];
  const update = (patch: Partial<FinancialProfile>) =>
    onChange({
      ...value,
      contexts: { ...value.contexts, [context]: { ...profile, ...patch } },
    });
  const sample = financialPreview(context);
  const rows = sample.rows;
  const terms = (Object.keys(financialTerms) as FinancialTerm[]).filter((k) =>
    [k, ...financialTerms[k], profile.terms[k].en, profile.terms[k].bn]
      .join(" ")
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const edit = (
    key: FinancialTerm,
    field: "en" | "bn" | "helper",
    text: string,
  ) =>
    update({
      preset: "Custom",
      terms: {
        ...profile.terms,
        [key]: { ...profile.terms[key], [field]: text },
      },
    });
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <SettingsField label="Account / relationship" bn="হিসাবের ধরন">
          {(id) => (
            <AppSelect
              id={id}
              label="Account / relationship"
              value={context}
              onChange={(v) => setContext(v as FinancialContext)}
              options={[...financialContexts]}
            />
          )}
        </SettingsField>
        <SettingsField label="Naming preset" bn="নামের ধরন">
          {(id) => (
            <AppSelect
              id={id}
              label="Naming preset"
              value={profile.preset}
              disabled={disabled}
              onChange={(v) =>
                update(
                  applyFinancialPreset(
                    profile,
                    v as FinancialProfile["preset"],
                    context,
                  ),
                )
              }
              options={
                context === "Cash & bank"
                  ? ["Accounting", "Money movement", "Custom"]
                  : ["Accounting", "Local party Khata", "Custom"]
              }
            />
          )}
        </SettingsField>
        <SettingsField label="Column order" bn="কলামের অবস্থান">
          {(id) => (
            <AppSelect
              id={id}
              label="Column order"
              value={profile.order}
              disabled={disabled}
              onChange={(v) =>
                update({ order: v as FinancialProfile["order"] })
              }
              options={[
                { value: "debit-first", label: "Debit left · Credit right" },
                { value: "credit-first", label: "Credit left · Debit right" },
              ]}
            />
          )}
        </SettingsField>
        <Button
          variant="outline"
          disabled={disabled}
          onClick={() => update(financialDefaults().contexts[context])}
        >
          Reset this context
        </Button>
      </div>
      <p className="text-xs text-helper">
        Business wording applies to new displays and statements. Cash movement
        and party debit/credit have different meanings; amounts and posting
        never change.
      </p>
      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
        <SettingCard title="Labels & Bangla helpers">
          <Input
            aria-label="Search financial terms"
            placeholder="Search terms · হিসাবের নাম খুঁজুন"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {(query || showAll ? terms : terms.slice(0, 6)).map((key) => (
            <div
              key={key}
              className="space-y-2 border-b border-border pb-3"
              data-field-key={key}
            >
              <p className="text-[13px] font-medium">
                {financialTerms[key][0]}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {(["en", "bn"] as const).map((field) => (
                  <Input
                    key={field}
                    aria-label={`${financialTerms[key][0]} ${field === "en" ? "English" : "Bangla"}`}
                    maxLength={60}
                    disabled={disabled}
                    value={profile.terms[key][field]}
                    onChange={(e) => edit(key, field, e.target.value)}
                  />
                ))}
              </div>
              <Input
                aria-label={`${financialTerms[key][0]} helper`}
                placeholder="Optional explanation · সহায়ক লেখা"
                maxLength={120}
                disabled={disabled}
                value={profile.terms[key].helper}
                onChange={(e) => edit(key, "helper", e.target.value)}
              />
            </div>
          ))}
          {!query && (
            <Button variant="ghost" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Show common terms" : "Show all financial terms"}
            </Button>
          )}
          {terms.length === 0 && (
            <p className="text-xs text-helper">No matching terms.</p>
          )}
        </SettingCard>
        <div className="min-w-0 self-start xl:sticky xl:top-4">
          <SettingCard title={`${context} preview · নমুনা খাতা`}>
            <div>
              <strong>
                {context === "Cash & bank"
                  ? "Cash account"
                  : context === "Customer"
                    ? "Rahim Traders"
                    : context}
              </strong>
              <p className="text-xs text-helper">
                Opening {sample.balanceLabel} ৳2,000 · Sample entries
              </p>
            </div>
            <div tabIndex={0} role="region" aria-label={`${context} sample ledger`} className="overflow-x-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring">
              <table data-erp-table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="p-2">Date</th>
                    <th className="p-2">Description</th>
                    {financialColumns(value, context).map((k) => (
                      <th key={k} className="p-2 text-right">
                        {financialLabel(value, context, k, language)}
                      </th>
                    ))}
                    <th className="p-2 text-right">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.date} className="border-b border-border">
                      <td className="p-2">{r.date}</td>
                      <td className="p-2">{r.description}</td>
                      {financialColumns(value, context).map((k) => (
                        <td key={k} className="p-2 text-right">
                          {r[k] ? taka(r[k]) : "—"}
                        </td>
                      ))}
                      <td className="p-2 text-right">{taka(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-right text-sm font-semibold">
              Closing {sample.balanceLabel} ৳2,820
            </p>
            <p className="text-xs text-helper">
              The sample uses this account or relationship’s debit/credit
              meaning. Changing names/order preserves every value.
            </p>
          </SettingCard>
        </div>
      </div>
    </div>
  );
}
