import type { BusinessSection, SettingsSection } from "./model";
export interface SettingField {
  key: string;
  label: string;
  bn: string;
  hint: string;
  kind:
    | "text"
    | "textarea"
    | "switch"
    | "select"
    | "number"
    | "date"
    | "time"
    | "logo";
  options?: string[];
  advanced?: boolean;
  min?: number;
  max?: number;
  live?: boolean;
}
const f = (
  key: string,
  label: string,
  bn: string,
  hint: string,
  kind: SettingField["kind"] = "text",
  extra: Partial<SettingField> = {},
): SettingField => ({ key, label, bn, hint, kind, ...extra });
export const sectionNames: Record<
  SettingsSection,
  { label: string; bn: string; description: string }
> = {
  interface:{label:"Interface & workflows",bn:"ভিউ ও কাজের ধারা",description:"Module columns and inherited business defaults. Essential identities, totals and warnings stay available."},
  financialTerminology:{label:"Names & Khata",bn:"হিসাবের নাম ও খাতা",description:"Financial labels, Bangla helpers and ledger column order. Display changes never change accounting."},
  business: {
    label: "Business profile",
    bn: "ব্যবসার পরিচিতি",
    description: "Your business details, contact information and branding.",
  },
  sales: {
    label: "Sales & POS",
    bn: "বিক্রি ও পিওএস",
    description:
      "Checkout defaults and sales policy. Compound units and multiple payments remain available.",
  },
  products: {
    label: "Products & stock",
    bn: "পণ্য ও স্টক",
    description:
      "Defaults for new products. Each product keeps its own units, conversions and tracking rules.",
  },
  purchases: {
    label: "Purchases",
    bn: "ক্রয়",
    description: "Supplier memo, attachment and purchase policy preferences.",
  },
  money: {
    label: "Money & accounts",
    bn: "টাকা ও হিসাব",
    description:
      "Payment account defaults, cash sessions and posting policies.",
  },
  invoices: {
    label: "Invoices & printing",
    bn: "বিল ও প্রিন্ট",
    description: "Preview your business branding and invoice layout.",
  },
  team: {
    label: "Employees & access",
    bn: "কর্মী ও অনুমতি",
    description:
      "Assign several roles to one employee and review their combined settings access.",
  },
  notifications: {
    label: "Notifications",
    bn: "বিজ্ঞপ্তি",
    description:
      "Review alert preferences and notification samples. This demo sends no messages.",
  },
  personal: {
    label: "My preferences",
    bn: "আমার পছন্দ",
    description:
      "Appearance and display preferences for this device, separate from business-wide settings.",
  },
  security: {
    label: "Account & security",
    bn: "অ্যাকাউন্ট ও নিরাপত্তা",
    description: "Login, recovery, PIN, trusted devices and auto-lock settings for your account.",
  },
  data: {
    label: "Data & activity",
    bn: "তথ্য ও কার্যক্রম",
    description:
      "Download a settings backup, preview imports and review saved changes.",
  },
};
export const settingsFields: Partial<Record<BusinessSection, SettingField[]>> =
  {
    business: [
      f(
        "name",
        "Business name",
        "ব্যবসার নাম",
        "Appears in the workspace and new POS receipts.",
        "text",
        { live: true },
      ),
      f(
        "nameBn",
        "Bangla business name",
        "ব্যবসার বাংলা নাম",
        "Optional Bangla name for your invoice preview.",
      ),
      f(
        "logo",
        "Business logo",
        "ব্যবসার লোগো",
        "PNG, JPEG or WebP, up to 250 KB.",
        "logo",
        { live: true },
      ),
      f(
        "phone",
        "Phone number",
        "ফোন নম্বর",
        "A customer-facing contact number.",
      ),
      f("email", "Business email", "ব্যবসার ইমেইল", "Optional contact email."),
      f(
        "address",
        "Business address",
        "ব্যবসার ঠিকানা",
        "Shown in the invoice preview.",
        "textarea",
      ),
      f(
        "website",
        "Website",
        "ওয়েবসাইট",
        "Use a full URL beginning with https://.",
        "text",
        { advanced: true },
      ),
      f(
        "financialYear",
        "Financial year",
        "অর্থবছর",
        "Reporting policy preview; historical records keep their dates.",
        "select",
        { options: ["January–December", "July–June"], advanced: true },
      ),
      f(
        "registration",
        "Registration details",
        "নিবন্ধনের তথ্য",
        "Optional business registration reference.",
        "text",
        { advanced: true },
      ),
    ],
    sales: [
      f(
        "barcode",
        "Barcode scanning",
        "বারকোড স্ক্যান",
        "Scanner preference for the POS setup preview.",
        "switch",
      ),
      f(
        "customerPhone",
        "Customer phone field",
        "ক্রেতার ফোন",
        "Include the phone field in the POS setup preview.",
        "switch",
      ),
      f(
        "guardian",
        "Guardian name field",
        "অভিভাবকের নাম",
        "Include guardian details in the setup preview.",
        "switch",
      ),
      f(
        "address",
        "Customer address field",
        "ক্রেতার ঠিকানা",
        "Include an address field in the setup preview.",
        "switch",
      ),
      f(
        "defaultPayment",
        "Default payment method",
        "পেমেন্টের ডিফল্ট মাধ্যম",
        "Starts the first payment row in a newly opened POS. You can still add other methods.",
        "select",
        { options: ["Cash", "Bank", "bKash", "Nagad"], live: true },
      ),
      f(
        "rounding",
        "Invoice rounding",
        "বিলের রাউন্ডিং",
        "Updates the POS total; quantity and unit conversions are unchanged.",
        "select",
        { options: ["Nearest ৳5", "Nearest ৳1", "No rounding"], live: true },
      ),
      f(
        "shortage",
        "Stock shortage choice",
        "স্টক ঘাটতির বিকল্প",
        "Policy preview. Negative Sale and Vendor remain explicit choices.",
        "select",
        { options: ["Ask every time", "Own stock"], advanced: true },
      ),
      f(
        "priceOverride",
        "Price override access",
        "দাম পরিবর্তনের অনুমতি",
        "Review who should be allowed to override a price.",
        "select",
        { options: ["Owner only", "Authorized employee"], advanced: true },
      ),
      f(
        "discountLimit",
        "Maximum discount (%)",
        "সর্বোচ্চ ছাড়",
        "Sales policy preview, between 0 and 100 percent.",
        "number",
        { advanced: true, min: 0, max: 100 },
      ),
      f(
        "returnDays",
        "Return window (days)",
        "ফেরতের সময়সীমা",
        "Policy preview for new sales; existing return screens keep their current behavior.",
        "number",
        { advanced: true, min: 0, max: 3650 },
      ),
    ],
    products: [
      f(
        "lowStock",
        "Low-stock alerts",
        "কম স্টকের সতর্কতা",
        "Alert preference preview. Product minimum quantities remain product-specific.",
        "switch",
      ),
      f(
        "defaultUnit",
        "Default base unit",
        "ডিফল্ট মূল একক",
        "Prefills new product forms. Configure Box/Pcs or Gauge/Gira ratios on each product.",
        "select",
        {
          options: ["Pcs", "Gira", "Kg", "Ft", "Bag", "Coil", "Pair", "L"],
          live: true,
        },
      ),
      f(
        "priceEntry",
        "Price entry unit",
        "দাম লেখার একক",
        "Selected unit keeps your existing unit-price conversion workflow.",
        "select",
        { options: ["Selected unit", "Base unit"], live: true },
      ),
      f(
        "openingUnit",
        "Opening stock unit",
        "প্রারম্ভিক স্টকের একক",
        "Default for a new product; individual products can override it.",
        "select",
        { options: ["Stock view unit", "Base unit"], live: true },
      ),
      f(
        "minimumUnit",
        "Minimum stock unit",
        "সর্বনিম্ন স্টকের একক",
        "Default for a new product.",
        "select",
        { options: ["Stock view unit", "Base unit"], live: true },
      ),
      f(
        "allocation",
        "Default lot allocation",
        "লট নির্বাচনের নিয়ম",
        "FIFO: oldest received first. FEFO: earliest expiry first. Applies to new products.",
        "select",
        { options: ["FIFO", "FEFO"], advanced: true, live: true },
      ),
      f(
        "serial",
        "Default serial tracking",
        "সিরিয়াল ট্র্যাকিং",
        "Required tracking still asks for one unique serial per whole base-unit item.",
        "select",
        {
          options: ["Off", "Optional", "Required"],
          advanced: true,
          live: true,
        },
      ),
      f(
        "warranty",
        "Warranty by default",
        "ডিফল্ট ওয়ারেন্টি",
        "Enables warranty on new product forms.",
        "switch",
        { advanced: true, live: true },
      ),
      f(
        "warrantyMonths",
        "Default warranty (months)",
        "ওয়ারেন্টির মাস",
        "Existing sold items retain their warranty snapshots.",
        "number",
        { advanced: true, min: 1, max: 1200, live: true },
      ),
      f(
        "expiry",
        "Expiry tracking by default",
        "মেয়াদ ট্র্যাকিং",
        "Prefills expiry tracking for new products.",
        "switch",
        { advanced: true, live: true },
      ),
      f(
        "expiryDays",
        "Expiry warning (days)",
        "মেয়াদের সতর্কতা",
        "Prefills the warning period for new products.",
        "number",
        { advanced: true, min: 0, max: 3650, live: true },
      ),
    ],
    purchases: [
      f(
        "memo",
        "Supplier memo reference",
        "সরবরাহকারীর মেমো",
        "Review the preferred purchase form fields.",
        "switch",
      ),
      f(
        "attachments",
        "Receipt attachments",
        "রসিদের সংযুক্তি",
        "Allow supplier receipt attachments in the purchase setup preview.",
        "switch",
      ),
      f(
        "defaultAccount",
        "Default purchase account",
        "ক্রয়ের ডিফল্ট হিসাব",
        "Purchase setup preview.",
        "select",
        {
          options: [
            "Cash counter",
            "Dutch-Bangla Bank · 4582",
            "bKash Business · 01711•••412",
          ],
        },
      ),
      f(
        "approval",
        "Purchase approval",
        "ক্রয়ের অনুমোদন",
        "Policy preview: purchases do not enter an approval queue in this demo.",
        "switch",
        { advanced: true },
      ),
      f(
        "backdateDays",
        "Backdate limit (days)",
        "পূর্বের তারিখের সীমা",
        "Review the intended purchase date policy.",
        "number",
        { advanced: true, min: 0, max: 3650 },
      ),
      f(
        "costAllocation",
        "Additional cost allocation",
        "অতিরিক্ত খরচের বণ্টন",
        "Preview how transport and other costs should be distributed.",
        "select",
        { options: ["By value", "By quantity"], advanced: true },
      ),
    ],
    money: [
      f(
        "defaultCash",
        "Default cash account",
        "ডিফল্ট নগদ হিসাব",
        "Account preference preview.",
        "select",
        { options: ["Cash counter"] },
      ),
      f(
        "defaultBank",
        "Default bank account",
        "ডিফল্ট ব্যাংক হিসাব",
        "Account preference preview.",
        "select",
        { options: ["Dutch-Bangla Bank · 4582"] },
      ),
      f(
        "defaultMobile",
        "Default mobile banking account",
        "ডিফল্ট মোবাইল ব্যাংকিং",
        "Account preference preview.",
        "select",
        {
          options: [
            "bKash Business · 01711•••412",
            "Nagad Merchant · 01819•••771",
          ],
        },
      ),
      f(
        "cashSession",
        "Use cash sessions",
        "ক্যাশ সেশন ব্যবহার",
        "Shows or hides the workspace cash-session control.",
        "switch",
        { advanced: true, live: true },
      ),
      f(
        "closeCount",
        "Cash count at closing",
        "সেশন শেষে নগদ গণনা",
        "Policy preview for closing a cash session.",
        "switch",
        { advanced: true },
      ),
      f(
        "lockDate",
        "Lock posting through date",
        "লেনদেন লক করার তারিখ",
        "Policy preview: transaction editing is not locked in this demo.",
        "date",
        { advanced: true },
      ),
      f(
        "adjustment",
        "Adjustment access",
        "সমন্বয়ের অনুমতি",
        "Review the intended permission for financial adjustments.",
        "select",
        { options: ["Owner only", "Authorized employee"], advanced: true },
      ),
    ],
    invoices: [
      f(
        "paper",
        "Default paper size",
        "ডিফল্ট কাগজের মাপ",
        "Changes the invoice layout preview.",
        "select",
        { options: ["A4", "80 mm", "58 mm"] },
      ),
      f(
        "showLogo",
        "Show business logo",
        "ব্যবসার লোগো দেখান",
        "Used in new POS receipts and this invoice preview.",
        "switch",
        { live: true },
      ),
      f(
        "showBangla",
        "Show Bangla product names",
        "পণ্যের বাংলা নাম",
        "Invoice layout preview.",
        "switch",
      ),
      f(
        "footer",
        "Invoice footer",
        "বিলের নিচের লেখা",
        "Appears on new POS receipts.",
        "textarea",
        { live: true },
      ),
      f(
        "prefix",
        "Invoice prefix",
        "বিল নম্বরের শুরু",
        "Numbering preview only. Existing invoice IDs are preserved.",
        "text",
        { advanced: true },
      ),
      f(
        "showSerial",
        "Show serial numbers",
        "সিরিয়াল নম্বর দেখান",
        "Invoice layout preview.",
        "switch",
        { advanced: true },
      ),
      f(
        "showWarranty",
        "Show warranty details",
        "ওয়ারেন্টির তথ্য দেখান",
        "Invoice layout preview.",
        "switch",
        { advanced: true },
      ),
      f(
        "showPurchaseCost",
        "Show purchase cost in staff preview",
        "কর্মীর জন্য ক্রয়মূল্য",
        "Staff-only layout preview. Customer receipts never show this cost.",
        "switch",
        { advanced: true },
      ),
      f(
        "copies",
        "Print copies",
        "প্রিন্টের কপি",
        "Print setup preview, between 1 and 5 copies.",
        "number",
        { advanced: true, min: 1, max: 5 },
      ),
    ],
    notifications: [
      f(
        "lowStock",
        "Low-stock notifications",
        "কম স্টকের বিজ্ঞপ্তি",
        "Include low stock in the alert preview.",
        "switch",
      ),
      f(
        "expiry",
        "Expiry notifications",
        "মেয়াদের বিজ্ঞপ্তি",
        "Include expiring items in the alert preview.",
        "switch",
      ),
      f(
        "dues",
        "Payment-due notifications",
        "বকেয়ার বিজ্ঞপ্তি",
        "Include customer dues in the alert preview.",
        "switch",
      ),
      f(
        "channel",
        "Notification channel",
        "বিজ্ঞপ্তির মাধ্যম",
        "SMS uses paid credits when connected. No messages are sent from this demo.",
        "select",
        { options: ["In-app only", "In-app + SMS"], advanced: true },
      ),
      f(
        "recipients",
        "Recipients",
        "প্রাপকেরা",
        "Names or roles for the notification setup preview.",
        "text",
        { advanced: true },
      ),
      f(
        "time",
        "Preferred time",
        "পছন্দের সময়",
        "Asia/Dhaka. No background schedule runs in this demo.",
        "time",
        { advanced: true },
      ),
      f(
        "expiryDays",
        "Expiry lead time (days)",
        "মেয়াদের আগের দিন",
        "Preview when expiry reminders should appear.",
        "number",
        { advanced: true, min: 0, max: 3650 },
      ),
      f(
        "dueDays",
        "Due reminder interval (days)",
        "বকেয়ার অনুস্মারক",
        "Preview reminder intervals.",
        "number",
        { advanced: true, min: 1, max: 3650 },
      ),
      f(
        "smsTemplate",
        "SMS template",
        "এসএমএসের লেখা",
        "Review the message content; previewing does not use credits.",
        "textarea",
        { advanced: true },
      ),
    ],
  };
