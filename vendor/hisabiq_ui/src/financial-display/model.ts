export const financialContexts = [
  "Cash & bank",
  "Customer",
  "Supplier",
  "Vendor",
  "Owner",
  "Lender",
  "Borrower",
  "Reports",
] as const;
export type FinancialContext = (typeof financialContexts)[number];
export type FinancialSide = "debit" | "credit";
export const financialTerms = {
  debit: ["Debit", "ডেবিট"],
  credit: ["Credit", "ক্রেডিট"],
  moneyIn: ["Money in", "জমা"],
  moneyOut: ["Money out", "খরচ"],
  receivable: ["Money to receive", "পাবো"],
  payable: ["Money to pay", "দেবো"],
  advance: ["Advance", "অগ্রিম"],
  refund: ["Refund", "ফেরত টাকা"],
  opening: ["Opening balance", "শুরুর জের"],
  closing: ["Closing balance", "শেষ জের"],
  balance: ["Balance", "জের"],
  capital: ["Capital", "মূলধন"],
  drawing: ["Owner drawing", "মালিকের উত্তোলন"],
  loan: ["Loan", "ঋণ"],
  repayment: ["Repayment", "ঋণ পরিশোধ"],
  interest: ["Interest", "সুদ"],
  discount: ["Discount", "ছাড়"],
  adjustment: ["Adjustment", "সমন্বয়"],
  transfer: ["Transfer", "স্থানান্তর"],
  deposit: ["Deposit", "জমা"],
  withdrawal: ["Withdrawal", "উত্তোলন"],
  revenue: ["Revenue", "আয়"],
  expense: ["Expense", "ব্যয়"],
  cost: ["Cost of goods sold", "বিক্রীত পণ্যের খরচ"],
  grossProfit: ["Gross profit", "মোট লাভ"],
  netProfit: ["Net profit", "নিট লাভ"],
  loss: ["Loss", "লোকসান"],
  invoice: ["Invoice", "চালান"],
  receipt: ["Receipt", "রসিদ"],
  voucher: ["Voucher", "ভাউচার"],
  installment: ["Installment due", "কিস্তি বাকি"],
} as const;
export type FinancialTerm = keyof typeof financialTerms;
export type FinancialProfile = {
  preset: "Accounting" | "Money movement" | "Local party Khata" | "Custom";
  order: "debit-first" | "credit-first";
  terms: Record<
    FinancialTerm,
    {
      en: string;
      bn: string;
      helper: string;
    }
  >;
};
export type FinancialDisplay = {
  contexts: Record<FinancialContext, FinancialProfile>;
};
export function financialDefaults(): FinancialDisplay {
  return {
    contexts: Object.fromEntries(
      financialContexts.map((c) => [
        c,
        {
          preset: "Accounting",
          order: "debit-first",
          terms: Object.fromEntries(
            Object.entries(financialTerms).map(([k, [en, bn]]) => [
              k,
              { en, bn, helper: "" },
            ]),
          ),
        },
      ]),
    ) as FinancialDisplay["contexts"],
  };
}
export function applyFinancialPreset(
  profile: FinancialProfile,
  preset: FinancialProfile["preset"],
  context: FinancialContext = "Customer",
): FinancialProfile {
  if (preset === "Money movement" && context !== "Cash & bank")
    throw Error(
      "Money movement is a cash/bank preset; party balances are not cash movement.",
    );
  const next = structuredClone(profile);
  next.preset = preset;
  if (preset === "Custom") return next;
  next.order = preset === "Local party Khata" ? "credit-first" : "debit-first";
  next.terms.debit = {
    en: preset === "Money movement" ? "Money in" : "Debit",
    bn:
      preset === "Money movement"
        ? "জমা"
        : preset === "Accounting"
          ? "ডেবিট"
          : "খরচ",
    helper: "",
  };
  next.terms.credit = {
    en: preset === "Money movement" ? "Money out" : "Credit",
    bn:
      preset === "Money movement"
        ? "খরচ"
        : preset === "Accounting"
          ? "ক্রেডিট"
          : "জমা",
    helper: "",
  };
  return next;
}
export function financialColumns(
  display: FinancialDisplay,
  context: FinancialContext,
): FinancialSide[] {
  return display.contexts[context].order === "credit-first"
    ? ["credit", "debit"]
    : ["debit", "credit"];
}
export function financialLabel(
  display: FinancialDisplay,
  context: FinancialContext,
  term: FinancialTerm,
  language: string,
): string {
  const t = display.contexts[context].terms[term];
  return language === "Bangla"
    ? t.bn
    : language === "English"
      ? t.en
      : `${t.en} · ${t.bn}`;
}
export function validateFinancialDisplay(value: unknown): string | null {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return "Invalid financial display.";
  const d = value as FinancialDisplay;
  if (
    !d.contexts ||
    Object.keys(d.contexts).some(
      (c) => !financialContexts.includes(c as FinancialContext),
    )
  )
    return "Invalid financial context.";
  for (const c of financialContexts) {
    const p = d.contexts[c];
    if (!p || !["debit-first", "credit-first"].includes(p.order))
      return "Choose valid column order.";
    if (
      !["Accounting", "Money movement", "Local party Khata", "Custom"].includes(
        p.preset,
      )
    )
      return "Choose a valid preset.";
    if (!p.terms || Object.keys(p.terms).some((k) => !(k in financialTerms)))
      return "Invalid financial term.";
    for (const k of Object.keys(financialTerms) as FinancialTerm[]) {
      const t = p.terms[k];
      if (
        !t ||
        typeof t.en !== "string" ||
        typeof t.bn !== "string" ||
        typeof t.helper !== "string" ||
        !t.en.trim() ||
        !t.bn.trim() ||
        t.en.length > 60 ||
        t.bn.length > 60 ||
        t.helper.length > 120
      )
        return "Labels require 1–60 characters; helpers allow 120.";
    }
  }
  return null;
}

/** Whole semantic labels only; never replace substrings, transaction enums or source identifiers. */
export function resolveFinancialText(
  display: FinancialDisplay,
  context: FinancialContext,
  english: string,
  bangla: string,
  language: string,
): string {
  const caption = english.toLowerCase();
  const alias: FinancialTerm | undefined =
    caption === "receivable" ||
    caption === `${context.toLowerCase()} receivable`
      ? "receivable"
      : caption === "payable" || caption === `${context.toLowerCase()} payable`
        ? "payable"
        : context === "Owner" &&
            [
              "capital balance",
              "owner capital",
              "owner capital balance",
            ].includes(caption)
          ? "capital"
          : undefined;
  const key =
    alias ??
    (Object.keys(financialTerms) as FinancialTerm[]).find(
      (k) => financialTerms[k][0].toLowerCase() === english.toLowerCase(),
    );
  const original = language === "Bangla" ? bangla : english;
  if (!key) return original;
  const term = display.contexts[context].terms[key],
    baseline = financialTerms[key];
  if (term.en === baseline[0] && term.bn === baseline[1] && !term.helper)
    return original;
  const primary = language === "Bangla" ? term.bn : term.en;
  return term.helper ? `${primary} · ${term.helper}` : primary;
}

/** Asymmetric preview entries use the selected relationship's actual debit/credit meaning. */
export function financialPreview(context: FinancialContext) {
  const liability = ["Supplier", "Vendor", "Owner", "Lender"].includes(context);
  const descriptions: Record<FinancialContext, [string, string]> = {
    "Cash & bank": ["Payment received", "Payment made"],
    Customer: ["Credit sale", "Payment received"],
    Supplier: ["Credit purchase", "Supplier paid"],
    Vendor: ["Goods received", "Vendor settlement"],
    Owner: ["Capital introduced", "Owner drawing"],
    Lender: ["Loan received", "Loan repayment"],
    Borrower: ["Loan issued", "Loan recovery"],
    Reports: ["Sample debit entry", "Sample credit entry"],
  };
  const balanceLabel =
    context === "Cash & bank"
      ? "cash balance"
      : liability
        ? context === "Owner"
          ? "capital balance"
          : "payable"
        : "receivable";
  return {
    balanceLabel,
    rows: [
      {
        date: "26 Oct",
        description: descriptions[context][0],
        debit: liability ? 0 : 1250,
        credit: liability ? 1250 : 0,
        balance: 3250,
      },
      {
        date: "27 Oct",
        description: descriptions[context][1],
        debit: liability ? 430 : 0,
        credit: liability ? 0 : 430,
        balance: 2820,
      },
    ],
  };
}

/** Explicit account identity; cash direction must never leak into noncash accounts. */
export function accountFinancialContext(accountId: string): FinancialContext {
  if (["asset-cash", "asset-bank", "asset-mfs"].includes(accountId))
    return "Cash & bank";
  const contexts: Record<string, FinancialContext> = {
    "asset-ar": "Customer",
    "asset-borrower": "Borrower",
    "liability-ap": "Supplier",
    "liability-loan": "Lender",
    "equity-capital": "Owner",
    "equity-withdrawal": "Owner",
  };
  return contexts[accountId] ?? "Reports";
}
