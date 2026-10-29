export const invoiceSections = [
  "header",
  "customer",
  "items",
  "payments",
  "notes",
  "signatures",
  "footer",
] as const;
export type InvoiceSection = (typeof invoiceSections)[number];
export interface InvoiceDesign {
  version: 1;
  template: "Standard" | "Classic" | "Compact";
  language: "English" | "English + Bangla" | "Bangla";
  paper: "A4" | "80 mm" | "58 mm" | "Business Pad";
  orientation: "Portrait" | "Landscape";
  showLogo: boolean;
  showBusiness: boolean;
  showCustomer: boolean;
  showPhone: boolean;
  showAddress: boolean;
  showGuardian: boolean;
  showSku: boolean;
  showBarcode: boolean;
  showDiscount: boolean;
  showPayments: boolean;
  showDue: boolean;
  showWords: boolean;
  showSignatures: boolean;
  showSerial: boolean;
  showWarranty: boolean;
  topOffset: number;
  margin: number;
  footer: string;
  terms: string;
  note: string;
  message: string;
  sections: InvoiceSection[];
}
export function invoiceDesignDefaults(): InvoiceDesign {
  return {
    version: 1,
    template: "Standard",
    language: "English + Bangla",
    paper: "A4",
    orientation: "Portrait",
    showLogo: true,
    showBusiness: true,
    showCustomer: true,
    showPhone: true,
    showAddress: true,
    showGuardian: false,
    showSku: false,
    showBarcode: false,
    showDiscount: true,
    showPayments: true,
    showDue: true,
    showWords: true,
    showSignatures: true,
    showSerial: true,
    showWarranty: true,
    topOffset: 25,
    margin: 12,
    footer: "ধন্যবাদ, আবার আসবেন",
    terms: "",
    note: "",
    message: "",
    sections: [...invoiceSections],
  };
}
export function validateInvoiceDesign(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return "Invalid invoice design.";
  const d = value as InvoiceDesign,
    defaults = invoiceDesignDefaults();
  if (Object.keys(d).some((k) => !(k in defaults)))
    return "Unknown invoice design field.";
  for (const [k, v] of Object.entries(defaults)) {
    if (typeof d[k as keyof InvoiceDesign] !== typeof v) return `Invalid ${k}.`;
  }
  if (
    d.version !== 1 ||
    !["Standard", "Classic", "Compact"].includes(d.template) ||
    !["English", "English + Bangla", "Bangla"].includes(d.language) ||
    !["A4", "80 mm", "58 mm", "Business Pad"].includes(d.paper) ||
    !["Portrait", "Landscape"].includes(d.orientation)
  )
    return "Choose valid invoice design options.";
  if (
    !Number.isFinite(d.margin) ||
    d.margin < 2 ||
    d.margin > 30 ||
    !Number.isFinite(d.topOffset) ||
    d.topOffset < 0 ||
    d.topOffset > 100
  )
    return "Use margins 2–30 mm and top offset 0–100 mm.";
  for (const k of ["footer", "terms", "note", "message"] as const)
    if (d[k].length > 2000)
      return `${k} is too long (maximum 2000 characters).`;
  if (
    !Array.isArray(d.sections) ||
    d.sections.length !== invoiceSections.length ||
    new Set(d.sections).size !== invoiceSections.length ||
    d.sections.some((s) => !invoiceSections.includes(s))
  )
    return "Keep each invoice section exactly once.";
  return null;
}
export function invoicePageCss(d: InvoiceDesign): string {
  const size =
    d.paper === "A4" || d.paper === "Business Pad"
      ? `A4 ${d.orientation.toLowerCase()}`
      : `${d.paper === "58 mm" ? "58mm" : "80mm"} 297mm`;
  const margin = d.paper.includes("mm") ? 2 : d.margin;
  return `@page{size:${size};margin:${margin}mm}body{margin:0;background:#fff;color:#0b1a2c}#document-receipt{width:auto;margin:auto}${d.paper === "Business Pad" ? `.invoice-document{padding-top:${d.topOffset}mm}` : ""}`;
}
export type PresentationPatch = Partial<
  Record<
    "customerName" | "note" | "delivery" | "warrantyNote" | "message",
    string
  >
> & {
  productLabels?: Record<string, string>;
};
export function presentationRevision<T>(
  source: T,
  patch: PresentationPatch,
  actor: string,
  at: string,
) {
  if (!actor || Number.isNaN(Date.parse(at)))
    throw Error("A presentation revision requires actor and time.");
  const allowed = [
    "customerName",
    "note",
    "delivery",
    "warrantyNote",
    "message",
    "productLabels",
  ];
  if (Object.keys(patch).some((k) => !allowed.includes(k)))
    throw Error("Only allowed presentation fields can change.");
  for (const [key, v] of Object.entries(patch)) {
    if (key === "productLabels") {
      if (
        !v ||
        typeof v !== "object" ||
        Array.isArray(v) ||
        Object.values(v).some((x) => typeof x !== "string" || x.length > 2000)
      )
        throw Error("Invalid product display labels.");
    } else if (typeof v !== "string" || v.length > 2000)
      throw Error("Invalid presentation text.");
  }
  return {
    source: structuredClone(source),
    presentation: structuredClone(patch),
    actor,
    at,
  };
}
