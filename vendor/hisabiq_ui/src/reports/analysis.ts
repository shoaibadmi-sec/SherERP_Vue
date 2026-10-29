import { runReport } from "./model.ts";
import type { ReportData, ReportFilters, ReportKey, ReportRow } from "./types";

export type CashScenarioInput = {
  opening: number;
  dailyIn: number;
  dailyOut: number;
  buffer: number;
  collection: number;
  collectionDay: number;
  purchase: number;
  purchaseDay: number;
};
export function runCashScenario(input: CashScenarioInput): {
  day: number;
  inflow: number;
  outflow: number;
  balance: number;
  buffer: number;
}[] {
  if (
    Object.entries(input).some(
      ([key, value]) =>
        !Number.isFinite(value) ||
        !Number.isSafeInteger(Math.round(value * 100)) ||
        (key !== "opening" && value < 0),
    ) ||
    ![input.collectionDay, input.purchaseDay].every(
      (day) => Number.isInteger(day) && day >= 1 && day <= 30,
    )
  )
    throw new Error("Enter valid amounts and days between 1 and 30.");
  let balance = Math.round(input.opening * 100);
  return Array.from({ length: 30 }, (_, index) => {
    const day = index + 1,
      inflow =
        Math.round(input.dailyIn * 100) +
        (day === input.collectionDay ? Math.round(input.collection * 100) : 0),
      outflow =
        Math.round(input.dailyOut * 100) +
        (day === input.purchaseDay ? Math.round(input.purchase * 100) : 0);
    if (!Number.isSafeInteger(inflow) || !Number.isSafeInteger(outflow))
      throw new Error("Modeled flows are too large.");
    balance += inflow - outflow;
    if (!Number.isSafeInteger(balance))
      throw new Error("The modeled balance is too large.");
    return {
      day,
      inflow: inflow / 100,
      outflow: outflow / 100,
      balance: balance / 100,
      buffer: input.buffer,
    };
  });
}
export type ReportInsight = {
  id: string;
  sourceVersion?: string;
  kind: "stock" | "collection" | "margin" | "expiry";
  title: string;
  titleBn: string;
  what: string;
  whatBn: string;
  why: string;
  whyBn: string;
  action: string;
  actionBn: string;
  benefit: string;
  benefitBn: string;
  report: ReportKey;
  sources: ReportRow[];
};
export function deriveReportInsights(
  data: ReportData,
  filters: ReportFilters,
): ReportInsight[] {
  const low = runReport("low-stock", data, filters).rows,
    dues = runReport("collections", data, {
      ...filters,
      sort: "days",
      direction: "desc",
    }).rows;
  const margin = runReport("product-profit", data, filters).rows.filter(
    (row) =>
      typeof row.values.profit === "number" &&
      typeof row.values.margin === "number" &&
      row.values.margin < 10 &&
      Number(row.values.amount) > 0,
  );
  const expiry = runReport("expiry", data, filters).rows.filter(
    (row) => row.status === "Expired" || row.status === "Expiring soon",
  );
  const result: ReportInsight[] = [];
  if (expiry.length)
    result.push({
      id: "expiry",
      kind: "expiry",
      title: "Review stock near expiry",
      titleBn: "মেয়াদের কাছাকাছি স্টক দেখুন",
      what: "Remaining batches are expired or within 30 days of expiry.",
      whatBn: "অবশিষ্ট কিছু ব্যাচের মেয়াদ শেষ বা ৩০ দিনের মধ্যে শেষ হবে।",
      why: "These batches may become unusable; expired goods must stay out of usable stock.",
      whyBn:
        "এই ব্যাচ ব্যবহার অনুপযোগী হতে পারে; মেয়াদোত্তীর্ণ পণ্য ব্যবহারযোগ্য স্টক থেকে আলাদা রাখুন।",
      action: "Inspect batches",
      actionBn: "ব্যাচ দেখুন",
      benefit:
        "Review eligible stock and supplier options before making a decision.",
      benefitBn:
        "সিদ্ধান্তের আগে ব্যবহারযোগ্য স্টক ও সরবরাহকারীর বিকল্প দেখুন।",
      report: "expiry",
      sources: expiry,
    });
  if (dues.length)
    result.push({
      id: "collection",
      kind: "collection",
      title: "Follow up on unpaid invoices",
      titleBn: "বাকি বিলের খোঁজ নিন",
      what: "Customer invoices still have an outstanding balance.",
      whatBn: "কিছু গ্রাহকের বিলে এখনো বাকি আছে।",
      why: "Older unpaid invoices tie up cash. Invoice age alone does not establish overdue terms.",
      whyBn:
        "পুরোনো বিলে টাকা আটকে আছে। শুধু বিলের বয়স দিয়ে মেয়াদোত্তীর্ণ বলা যায় না।",
      action: "Review collections",
      actionBn: "আদায়ের তালিকা দেখুন",
      benefit:
        "Inspect the invoice and customer ledger before collecting payment.",
      benefitBn: "টাকা আদায়ের আগে বিল ও গ্রাহকের খাতা দেখুন।",
      report: "collections",
      sources: dues,
    });
  if (low.length)
    result.push({
      id: "stock",
      kind: "stock",
      title: "Review the next purchase",
      titleBn: "পরের কেনাকাটা পর্যালোচনা করুন",
      what: "Some products are below their configured minimum stock.",
      whatBn: "কিছু পণ্যের স্টক নির্ধারিত সর্বনিম্নের নিচে।",
      why: "Low stock may interrupt sales; recorded demand must guide the quantity.",
      whyBn:
        "কম স্টকে বিক্রয় থামতে পারে; সংরক্ষিত চাহিদা দেখে পরিমাণ ঠিক করুন।",
      action: "Open buying analysis",
      actionBn: "ক্রয় বিশ্লেষণ খুলুন",
      benefit: "Compare demand, usable stock and costs before ordering.",
      benefitBn: "অর্ডারের আগে চাহিদা, ব্যবহারযোগ্য স্টক ও খরচ তুলনা করুন।",
      report: "reorder",
      sources: low,
    });
  if (margin.length)
    result.push({
      id: "margin",
      kind: "margin",
      title: "Review thin product margins",
      titleBn: "কম লাভের পণ্য দেখুন",
      what: "Products with known historical costs earned less than 10% gross margin.",
      whatBn: "ঐতিহাসিক খরচ জানা কিছু পণ্যে মোট লাভ ১০ শতাংশের কম।",
      why: "Discounts or higher costs can reduce the amount left to cover expenses.",
      whyBn:
        "ছাড় বা বেশি খরচে পরিচালন ব্যয়ের জন্য অবশিষ্ট লাভ কমে যেতে পারে।",
      action: "Inspect product profit",
      actionBn: "পণ্যের লাভ দেখুন",
      benefit:
        "Compare source sales and costs; a future price decision does not rewrite old sales.",
      benefitBn:
        "মূল বিক্রয় ও খরচ তুলনা করুন; নতুন দাম পুরোনো বিক্রয় বদলাবে না।",
      report: "product-profit",
      sources: margin,
    });
  return result.map((insight) => ({
    ...insight,
    sourceVersion: JSON.stringify(
      insight.sources
        .map((row) => ({
          id: row.id,
          status: row.status,
          values: row.values,
          children: row.children,
        }))
        .sort((a, b) => a.id.localeCompare(b.id)),
    ),
  }));
}
