export const settingsSubsections = {
  business: [
    { id: "general", label: "General", bn: "সাধারণ" },
    { id: "contact", label: "Contact & address", bn: "যোগাযোগ ও ঠিকানা" },
    { id: "branding", label: "Logo & branding", bn: "লোগো ও ব্র্যান্ডিং" },
  ],
  invoices: [
    { id: "invoice", label: "Invoice design", bn: "বিলের ডিজাইন" },
    {
      id: "output",
      label: "Ledger & report designs",
      bn: "খাতা ও রিপোর্টের ডিজাইন",
    },
  ],
} as const;
export function businessFieldGroup(key: string) {
  return key === "logo"
    ? "branding"
    : ["phone", "email", "address", "website"].includes(key)
      ? "contact"
      : "general";
}
