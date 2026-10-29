import test from "node:test";
import assert from "node:assert/strict";
import * as analysis from "../src/reports/analysis.ts";
import { buildReportData, defaultReportFilters } from "../src/reports/model.ts";
const filters = {
  ...defaultReportFilters,
  from: "2026-10-01",
  to: "2026-10-26",
};
const data = buildReportData({
  asOf: "2026-10-26",
  invoices: [],
  returns: [],
  purchases: [],
  expenses: [],
  products: [],
  lots: [],
  movements: [],
  transactions: [],
  warranty: [],
});
test("forecast is explicitly modeled, balances reconcile and saving cannot mutate source records", () => {
  assert.equal(typeof analysis.runCashScenario, "function");
  const before = JSON.stringify(data);
  const result = analysis.runCashScenario({
    opening: 1000,
    dailyIn: 100,
    dailyOut: 80,
    buffer: 900,
    collection: 500,
    collectionDay: 10,
    purchase: 300,
    purchaseDay: 20,
  });
  assert.equal(result.length, 30);
  assert.equal(result[9].balance, 1700);
  assert.equal(result[19].balance, 1600);
  assert.equal(result[29].balance, 1800);
  assert.equal(JSON.stringify(data), before);
  assert.throws(() =>
    analysis.runCashScenario({
      opening: NaN,
      dailyIn: 0,
      dailyOut: 0,
      buffer: 0,
      collection: 0,
      collectionDay: 10,
      purchase: 0,
      purchaseDay: 20,
    }),
  );
});
test("empty evidence yields no fabricated recommendations or costs", () => {
  assert.equal(typeof analysis.deriveReportInsights, "function");
  assert.deepEqual(analysis.deriveReportInsights(data, filters), []);
});
test("known historical cost is required for a margin recommendation", () => {
  assert.equal(typeof analysis.deriveReportInsights, "function");
  const stock = {
    id: "p",
    label: "Pipe",
    date: "2026-10-26",
    productId: "p",
    status: "In stock",
    values: { stock: 10, cost: 100 },
    children: [],
  };
  const sale = {
    id: "s",
    label: "Sale",
    date: "2026-10-10",
    productId: "p",
    status: "Paid",
    values: { quantity: 1, amount: 100, cost: null, profit: null },
  };
  assert.ok(
    !analysis
      .deriveReportInsights(
        { ...data, stock: [stock], saleLines: [sale] },
        filters,
      )
      .some((i) => i.kind === "margin"),
  );
  const withCost = analysis.deriveReportInsights(
    {
      ...data,
      stock: [stock],
      saleLines: [{ ...sale, values: { ...sale.values, cost: 98, profit: 2 } }],
    },
    filters,
  );
  assert.ok(withCost.some((i) => i.kind === "margin" && i.sources.length > 0));
});

test("internal finance transfers never inflate operating cash totals", () => {
  const transaction = {
    id: "t",
    source: "finance",
    sourceId: "t",
    reference: "TRANSFER",
    type: "Transfer",
    transactionDate: "2026-10-10",
    createdAt: "2026-10-10T12:00:00Z",
    postedBy: "Owner",
    amount: 100,
    moneyIn: 100,
    moneyOut: 100,
    accounts: ["Bank"],
    status: "Posted",
    countsTowardCashflow: false,
  };
  const recorded = buildReportData({
    asOf: "2026-10-26",
    invoices: [],
    returns: [],
    purchases: [],
    expenses: [],
    products: [],
    lots: [],
    movements: [],
    warranty: [],
    transactions: [transaction],
  } as never);
  assert.equal(recorded.cash.length, 0);
  assert.equal(recorded.finance.length, 1);
});

test('cash modeling rejects values too large for exact paisa arithmetic',()=>{
 assert.throws(()=>analysis.runCashScenario({opening:Number.MAX_SAFE_INTEGER,dailyIn:0,dailyOut:0,buffer:0,collection:0,collectionDay:1,purchase:0,purchaseDay:1}));
});
test('dismissed insight identity changes when its source quantities materially change',()=>{
 const stock={id:'p',label:'Pipe',date:'2026-10-26',productId:'p',status:'Low stock',values:{stock:1,minStock:10,cost:10}};
 const one=analysis.deriveReportInsights({...data,stock:[stock]},filters).find(i=>i.kind==='stock')!;
 const two=analysis.deriveReportInsights({...data,stock:[{...stock,values:{...stock.values,stock:2}}]},filters).find(i=>i.kind==='stock')!;
 assert.ok(one.sourceVersion);assert.notEqual(one.sourceVersion,two.sourceVersion);
});
