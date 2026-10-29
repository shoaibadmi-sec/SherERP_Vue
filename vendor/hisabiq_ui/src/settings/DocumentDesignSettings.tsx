import { useState } from "react";
import { ArrowUp, ArrowDown, Printer } from "lucide-react";
import { Button, Input, Switch, SettingsField, SettingCard } from "./ui";
import { AppSelect } from "../components/AppSelect";
import {
  ReceiptPreview,
  type ReceiptPreviewProps,
} from "../components/brand/ReceiptPreview";
import { printReceipt } from "../components/brand/printReceipt";
import {
  invoiceDesignDefaults,
  type InvoiceDesign,
  type InvoiceSection,
} from "../documents/profile";
import type { InvoiceSettings, BusinessSettings } from "./model";
export function DocumentDesignSettings({
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
  const [previewTemplate, setPreviewTemplate] = useState<
      InvoiceDesign["template"] | null
    >(null),
    [notice, setNotice] = useState("");
  const d = { ...invoiceDesignDefaults(), ...value.design };
  const update = (patch: Partial<InvoiceDesign>) => {
    const design = { ...d, ...patch };
    onChange({
      ...value,
      design,
      paper: design.paper === "Business Pad" ? "A4" : design.paper,
      showLogo: design.showLogo,
      showBangla: design.language !== "English",
      showSerial: design.showSerial,
      showWarranty: design.showWarranty,
      footer: design.footer,
    });
  };
  const sample: ReceiptPreviewProps = {
    invoice: value.prefix + "-PREVIEW",
    customer: "Rahim Traders",
    customerPhone: "01712 345678",
    customerAddress: "Natore, Rajshahi",
    lines: [
      {
        name: "LED bulb",
        nameBn: "এলইডি বাল্ব",
        sku: "LED-001",
        qty: "2 Pcs",
        price: 250,
        total: 500,
      },
      {
        name: "Electric cable",
        nameBn: "বৈদ্যুতিক তার",
        sku: "WIRE-001",
        qty: "1 Roll",
        price: 1500,
        total: 1500,
      },
    ],
    subtotal: 2000,
    discount: 0,
    rounding: 0,
    total: 2000,
    paid: 1500,
    due: 500,
    method: "Cash",
    payments: [
      { method: "Cash", amount: 1000 },
      { method: "bKash", amount: 500 },
    ],
    dateTime: "27 Oct 2026",
    branding: {
      ...business,
      showLogo: d.showLogo,
      footer: d.footer,
      design: { ...d, template: previewTemplate ?? d.template },
    },
  };
  const flags: [keyof InvoiceDesign, string, string][] = [
    ["showLogo", "Business logo", "ব্যবসার লোগো"],
    ["showBusiness", "Business information", "ব্যবসার পরিচিতি"],
    ["showCustomer", "Customer name", "ক্রেতার নাম"],
    ["showPhone", "Customer phone", "ফোন"],
    ["showAddress", "Customer address", "ঠিকানা"],
    ["showGuardian", "Guardian name", "অভিভাবক"],
    ["showSku", "SKU / product code", "পণ্যের কোড"],
    ["showBarcode", "Barcode value", "বারকোড"],
    ["showDiscount", "Discount breakdown", "ছাড়ের বিবরণ"],
    ["showPayments", "Payment breakdown", "পেমেন্টের বিবরণ"],
    ["showDue", "Due amount", "বাকি"],
    ["showWords", "Amount in words", "কথায় টাকা"],
    ["showSignatures", "Signature lines", "স্বাক্ষর"],
    ["showSerial", "Serial numbers", "সিরিয়াল"],
    ["showWarranty", "Warranty details", "ওয়ারেন্টি"],
  ];
  const move = (section: InvoiceSection, delta: number) => {
    const sections = [...d.sections],
      i = sections.indexOf(section),
      j = i + delta;
    if (j < 0 || j >= sections.length) return;
    [sections[i], sections[j]] = [sections[j], sections[i]];
    update({ sections });
  };
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <div className="space-y-4">
        <SettingCard title="Invoice design · চালানের ডিজাইন">
          <p className="text-xs text-helper">
            Choose the layout, language and paper for your invoices. The preview
            uses the same design as printing.
          </p>
          <SettingsField label="Invoice template" bn="চালানের ডিজাইন">
            {(id) => (
              <AppSelect
                id={id}
                label="Invoice template"
                value={d.template}
                disabled={disabled}
                options={["Standard", "Classic", "Compact"]}
                onChange={(v) => {
                  update({ template: v as InvoiceDesign["template"] });
                  setPreviewTemplate(null);
                }}
              />
            )}
          </SettingsField>
          <div className="grid gap-3 sm:grid-cols-2">
            <SettingsField label="Document language" bn="প্রিন্টের ভাষা">
              {(id) => (
                <AppSelect
                  id={id}
                  label="Document language"
                  value={d.language}
                  disabled={disabled}
                  onChange={(v) =>
                    update({ language: v as InvoiceDesign["language"] })
                  }
                  options={[
                    { value: "English", label: "Full English" },
                    { value: "English + Bangla", label: "English + Bangla helpers" },
                    { value: "Bangla", label: "Full Bangla" },
                  ]}
                />
              )}
            </SettingsField>
            <SettingsField label="Paper mode" bn="কাগজের ধরন">
              {(id) => (
                <AppSelect
                  id={id}
                  label="Paper mode"
                  value={d.paper}
                  disabled={disabled}
                  onChange={(v) =>
                    update({ paper: v as InvoiceDesign["paper"] })
                  }
                  options={["A4", "80 mm", "58 mm", "Business Pad"]}
                />
              )}
            </SettingsField>
            <SettingsField label="Orientation" bn="দিক">
              {(id) => (
                <AppSelect
                  id={id}
                  label="Orientation"
                  value={d.orientation}
                  disabled={disabled || d.paper.includes("mm")}
                  onChange={(v) =>
                    update({ orientation: v as InvoiceDesign["orientation"] })
                  }
                  options={["Portrait", "Landscape"]}
                />
              )}
            </SettingsField>
            <SettingsField label="Page margins (mm)" bn="মার্জিন">
              {(id) => (
                <Input
                  id={id}
                  aria-label="Page margins (mm)"
                  type="number"
                  min={2}
                  max={30}
                  disabled={disabled || d.paper.includes("mm")}
                  value={d.margin}
                  onChange={(e) => update({ margin: Number(e.target.value) })}
                />
              )}
            </SettingsField>
          </div>
          {d.paper === "Business Pad" && (
            <SettingsField
              label="Content starts below header (mm)"
              bn="প্যাডের হেডারের নিচে ফাঁকা"
              hint="The generated logo and business block are suppressed. Preview and print use this same offset."
            >
              {(id) => (
                <Input
                  id={id}
                  aria-label="Content starts below header (mm)"
                  type="number"
                  min={0}
                  max={100}
                  disabled={disabled}
                  value={d.topOffset}
                  onChange={(e) =>
                    update({ topOffset: Number(e.target.value) })
                  }
                />
              )}
            </SettingsField>
          )}
          <p className="text-xs text-helper">
            Full English, Full Bangla or English with smaller Bangla helpers — independent of app language.
            All three templates and paper sizes support these styles. Product/party names and custom notes use stored data; unavailable translations are not invented.
          </p>
        </SettingCard>
        <SettingCard title="Sections & visible fields">
          <div className="grid gap-3 sm:grid-cols-2">
            {flags.map(([key, en, bn]) => (
              <label
                key={key}
                className="flex items-start justify-between gap-3 text-[13px]"
              >
                <span>
                  {en}
                  <span className="block font-bn text-xs text-helper">
                    {bn}
                  </span>
                </span>
                <Switch
                  aria-label={en}
                  disabled={disabled}
                  checked={d[key] as boolean}
                  onCheckedChange={(v) => update({ [key]: v })}
                />
              </label>
            ))}
          </div>
          <p className="text-xs text-helper">
            Internal cost/margin is never included in customer output. Identity,
            source and financial totals are retained.
          </p>
        </SettingCard>
        <SettingCard title="Notes, terms & section order">
          {(["footer", "terms", "note", "message"] as const).map((k) => (
            <SettingsField
              key={k}
              label={
                k === "terms"
                  ? "Terms & conditions"
                  : k === "note"
                    ? "Additional note"
                    : k === "message"
                      ? "Custom message"
                      : "Footer"
              }
              bn={
                k === "terms"
                  ? "শর্তাবলী"
                  : k === "note"
                    ? "নোট"
                    : k === "message"
                      ? "বার্তা"
                      : "শেষের লেখা"
              }
            >
              {(id) => (
                <textarea
                  id={id}
                  maxLength={2000}
                  disabled={disabled}
                  className="min-h-20 w-full rounded-lg border border-input bg-card p-3 text-[13px]"
                  value={d[k]}
                  onChange={(e) => update({ [k]: e.target.value })}
                />
              )}
            </SettingsField>
          ))}
          <details>
            <summary className="cursor-pointer text-sm font-medium">
              Section order · অংশের ক্রম
            </summary>
            <ol className="mt-2 space-y-1">
              {d.sections.map((s, i) => (
                <li
                  key={s}
                  className="flex items-center justify-between gap-2 border-b border-border py-1 text-[13px]"
                >
                  <span>{s}</span>
                  <span className="flex gap-1">
                    <Button
                      aria-label={`Move ${s} up`}
                      variant="ghost"
                      disabled={disabled || i === 0}
                      onClick={() => move(s, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      aria-label={`Move ${s} down`}
                      variant="ghost"
                      disabled={disabled || i === d.sections.length - 1}
                      onClick={() => move(s, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                  </span>
                </li>
              ))}
            </ol>
          </details>
        </SettingCard>
      </div>
      <div className="min-w-0 self-start xl:sticky xl:top-4">
        <SettingCard title="Invoice preview · একই ডিজাইনে প্রিন্ট">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (!printReceipt(sample)) {
                  setNotice("Allow print popups and try again.");
                } else
                  setNotice(
                    "Print preview opened. Use the browser to Print or Save as PDF.",
                  );
              }}
            >
              <Printer className="size-4" />
              Print preview
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                setPreviewTemplate(previewTemplate ? "Standard" : "Classic")
              }
            >
              Compare design
            </Button>
          </div>
          {notice && (
            <p role="status" className="text-xs text-helper">
              {notice}
            </p>
          )}
          <div className="overflow-auto rounded-lg border border-border bg-background p-2">
            <ReceiptPreview {...sample} />
          </div>
          <p className="text-xs text-helper">
            Sample data · Preview and final output use the same renderer.
            Existing issued documents keep their captured design.
          </p>
        </SettingCard>
      </div>
    </div>
  );
}
