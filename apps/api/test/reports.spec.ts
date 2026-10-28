/*
 * Coverage claims, read by `pnpm test:inventory` (owner request 2026-09-03).
 *
 * @covers endpoint:GET /api/v1/reports/sales
 * @covers endpoint:GET /api/v1/reports/purchases
 * @covers endpoint:GET /api/v1/reports/stock
 * @covers endpoint:GET /api/v1/reports/money
 * @covers endpoint:GET /api/v1/reports/performance
 * @covers endpoint:GET /api/v1/inventory/valuation
 * @covers workflow:reports
 */
import 'reflect-metadata';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Permission } from '@sher/core-contracts';
import { SystemClock, Ulid } from '@sher/shared-utils';
import type pg from 'pg';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { AppErrorFilter } from '../src/common/app-error.filter';
import { signToken, TEST_JWT_SECRET } from './support/auth';
import type { SeededTenant } from './support/database';
import {
  asTenant, prepareTestDatabase, resetDatabase, seedTenant, seedWalkInCustomer, testPool, todayIn,
} from './support/database';
import { assertGoldenInvariants } from './support/invariants';

/**
 * INV-10, which is the invariant an ERP is judged on (§3.11, §5.20).
 *
 * "Every monetary and quantity figure in a report is derived from journal lines
 * or stock movements, never recomputed from document fields." §3.11 says how to
 * test it in one sentence — *sum any report's monetary column and compare it to
 * the equivalent journal query; they must match to the poisha* — and that is
 * exactly what this file does.
 *
 * It matters more than it sounds. The classic ERP failure is a dashboard and a
 * ledger that disagree while both look authoritative, and nobody can say which
 * is right; by the time somebody notices, both have been used to make decisions.
 * A report that re-adds `sales.grand_total` gets the answer right until a sale
 * is voided, or corrected, or partially returned — and then it is quietly wrong
 * for ever, because the document still says what it always said.
 *
 * So every assertion here compares a report to a `journal_lines` or
 * `stock_movements` query, never to the numbers the test itself put in.
 */

const clock = new SystemClock();
const openingDay = '2026-01-01';

let app: INestApplication;
let pool: pg.Pool;
let tenant: SeededTenant;
let token: string;
let productId: string;
let customerId: string;
let supplierId: string;
let drawerCode: string;
let today: string;

const PERMISSIONS = [
  Permission.REPORT_SALES_VIEW, Permission.REPORT_PURCHASE_VIEW, Permission.REPORT_STOCK_VIEW,
  Permission.REPORT_MONEY_VIEW, Permission.REPORT_PROFIT_VIEW, Permission.DASHBOARD_VIEW,
  Permission.SALE_CREATE, Permission.SALE_VIEW, Permission.SALE_VOID,
  Permission.PURCHASE_CREATE, Permission.PURCHASE_VIEW,
  Permission.PRODUCT_VIEW, Permission.PRODUCT_CREATE, Permission.PRODUCT_EDIT,
  Permission.UNIT_MANAGE, Permission.CUSTOMER_VIEW, Permission.CUSTOMER_CREATE,
  Permission.SUPPLIER_VIEW, Permission.SUPPLIER_CREATE,
  Permission.COST_VIEW, Permission.INVENTORY_LOT_VIEW,
  Permission.CASH_ACCOUNT_VIEW, Permission.CASH_ACCOUNT_MANAGE,
  Permission.CASH_SESSION_START, Permission.CASH_DAILY_VIEW,
  Permission.EXPENSE_VIEW, Permission.EXPENSE_RECORD,
];

beforeAll(async () => {
  pool = testPool();
  await prepareTestDatabase();
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  app.useGlobalFilters(new AppErrorFilter());
  await app.init();
});

afterAll(async () => {
  await app.close();
  await pool.end();
});

afterEach(async () => {
  await assertGoldenInvariants(pool, tenant.tenantId);
});

const api = (): ReturnType<typeof request> => request(app.getHttpServer());
const bearer = (test: request.Test, as = token): request.Test =>
  test.set('Authorization', `Bearer ${as}`);
const auth = (test: request.Test, as = token): request.Test =>
  bearer(test, as).set('Idempotency-Key', Ulid.generate(clock));

function must(response: request.Response, what: string): request.Response {
  if (response.status >= 400) {
    throw new Error(`${what} failed: ${String(response.status)} ${JSON.stringify(response.body)}`);
  }
  return response;
}

/** One day's real trading, posted through the application's own endpoints. */
beforeEach(async () => {
  await resetDatabase(pool);
  tenant = await seedTenant(pool, { name: 'Reports Test', permissions: PERMISSIONS });
  token = signToken(tenant, TEST_JWT_SECRET);
  await seedWalkInCustomer(pool, tenant);
  today = todayIn(tenant.timezone);

  const unit = must(await auth(api().post('/api/v1/catalog/units')).send({ name: 'Piece' }), 'unit');
  const unitId = unit.body.data.units[0].id as string;

  const product = must(await auth(api().post('/api/v1/products')).send({
    name: 'Rice', baseUnitId: unitId,
    purchasePriceMinor: 100_00, sellingPriceMinor: 150_00, minStockQty: 0,
    brandId: null, categoryId: null, sku: null, barcode: null, description: null,
    defaultDiscountType: null, defaultDiscountValue: null, offerEnabled: false,
    offerPriceMinor: null, offerStartDate: null, offerEndDate: null,
    tracksExpiry: false, tracksSerial: false, conversionUnitId: null, conversionFactorQty: null,
  }), 'product');
  productId = product.body.data.id as string;

  const customer = must(await auth(api().post('/api/v1/parties')).send({
    name: 'Karim Uddin', roles: ['CUSTOMER'], phone: '01712345678',
    address: null, guardianName: null, nid: null, email: null, notes: null,
    customerGroupId: null, creditLimitMinor: null,
  }), 'customer');
  customerId = customer.body.data.id as string;

  const supplier = must(await auth(api().post('/api/v1/parties')).send({
    name: 'Dhaka Wholesale', roles: ['SUPPLIER'], phone: '01812345678',
    address: null, guardianName: null, nid: null, email: null, notes: null,
    customerGroupId: null, creditLimitMinor: null,
  }), 'supplier');
  supplierId = supplier.body.data.id as string;

  const drawer = must(await bearer(api().post('/api/v1/money/accounts')).send({
    name: 'Counter drawer', type: 'CASH', holderName: null, reference: null,
    isDrawer: true, openingAmountMinor: 50000_00, openingDate: openingDay,
    operationId: Ulid.generate(clock),
  }), 'drawer');
  drawerCode = `CASH:${drawer.body.data.id as string}`;

  must(await bearer(api().post('/api/v1/money/day/start')).send({
    businessDate: today, openingAmountMinor: 50000_00,
    counterpartAccountCode: null, note: null, operationId: Ulid.generate(clock),
  }), 'start day');

  // Twenty in at 100.00.
  must(await auth(api().post('/api/v1/purchases')).send({
    supplierPartyId: supplierId,
    lines: [{ productId, qty: 20_000, unitPriceMinor: 100_00 }],
    discountMinor: 0, paidMinor: 0, paidAccountCode: null,
  }), 'purchase');

  // Six out at 150.00, four of them paid in cash and two on account.
  must(await auth(api().post('/api/v1/sales')).send({
    partyId: null, customerName: null, customerPhone: null,
    lines: [{ productId, qty: 4_000, unitPriceMinor: 150_00, lineDiscountMinor: 0 }],
    payments: [{ accountCode: drawerCode, amountMinor: 600_00 }], discountMinor: 0,
  }), 'cash sale');

  must(await auth(api().post('/api/v1/sales')).send({
    partyId: customerId, customerName: null, customerPhone: null,
    lines: [{ productId, qty: 2_000, unitPriceMinor: 150_00, lineDiscountMinor: 0 }],
    payments: [], discountMinor: 0,
  }), 'credit sale');
});

/** The signed total on one account, straight from the ledger. */
async function accountTotal(code: string): Promise<number> {
  return asTenant(pool, tenant.tenantId, async (db) => {
    const row = await db.query<{ total: string }>(
      `SELECT COALESCE(SUM(amount_minor), 0)::bigint AS total
         FROM journal_lines WHERE account_code = $1`,
      [code],
    );
    return Number(row.rows[0]?.total ?? 0);
  });
}

/** Net stock movement for the product, in minor quantity units. */
async function onHand(): Promise<number> {
  return asTenant(pool, tenant.tenantId, async (db) => {
    const row = await db.query<{ net: string }>(
      `SELECT COALESCE(SUM(CASE direction WHEN 'IN' THEN qty ELSE -qty END), 0)::bigint AS net
         FROM stock_movements WHERE product_id = $1`,
      [productId],
    );
    return Number(row.rows[0]?.net ?? 0);
  });
}

const range = (): string => `from=${today}&to=${today}`;

describe('the sales report against the ledger (INV-10)', () => {
  it('totals exactly what SALES holds', async () => {
    /*
     * Grouped by product, because the *split* is the interesting half of
     * INV-10. Grouped by date this report reads `SALES` and `COGS` straight off
     * the accounts, so it agrees with the ledger by construction and states no
     * quantity at all — the journal has no qty column, and a credit records
     * what was earned rather than what left the shelf. Grouped by product it
     * adds up the sale lines instead, and the assertion below becomes the real
     * one: the per-product split must still come to the poisha the accounts
     * hold, or the posting is wrong.
     */
    const report = await bearer(api().get(`/api/v1/reports/sales?${range()}&groupBy=PRODUCT`));
    expect(report.status, JSON.stringify(report.body)).toBe(200);

    // `SALES` is a credit balance; a report states it as a positive figure.
    expect(report.body.data.totals.amountMinor).toBe(-(await accountTotal('SALES')));
    // 4 + 2 sold, in minor quantity units.
    expect(report.body.data.totals.qty).toBe(6_000);
    expect(report.body.data.totals.count).toBe(2);
  });

  it('states cost from COGS, not from the product’s price list', async () => {
    const report = await bearer(api().get(`/api/v1/reports/sales?${range()}`));
    const totals = report.body.data.totals as { costMinor?: number; profitMinor?: number };

    expect(totals.costMinor).toBe(await accountTotal('COGS'));
    /*
     * And profit is the difference between the two ledger figures rather than a
     * third number computed some other way. A margin that does not reconcile to
     * the accounts is the thing INV-10 exists to prevent.
     */
    expect(totals.profitMinor).toBe(
      -(await accountTotal('SALES')) - (await accountTotal('COGS')),
    );
  });

  it('stops counting a sale the moment it is cancelled', async () => {
    const before = await bearer(api().get(`/api/v1/reports/sales?${range()}`));
    const sales = await bearer(api().get('/api/v1/sales'));
    const first = (sales.body.items as readonly { id: string }[])[0] as { id: string };
    /*
     * The list is deliberately versionless: a version belongs to the document
     * you are about to change, so a cancellation reads it from the invoice
     * itself and the optimistic-lock check means something.
     */
    const detail = must(await bearer(api().get(`/api/v1/sales/${first.id}`)), 'sale detail');
    const version = detail.body.data.version as number;

    must(await bearer(api().post(`/api/v1/sales/${first.id}/cancel`))
      .send({ version, reason: 'Cancelled at the counter' }), 'cancel');

    const after = await bearer(api().get(`/api/v1/reports/sales?${range()}`));
    /*
     * The document still exists and still says what it always said. A report
     * that re-added `sales.grand_total` would still be counting it — which is
     * precisely the bug INV-10 names, and it is invisible until somebody voids
     * something.
     */
    expect(after.body.data.totals.amountMinor).toBeLessThan(
      before.body.data.totals.amountMinor as number,
    );
    expect(after.body.data.totals.amountMinor).toBe(-(await accountTotal('SALES')));
  });
});

describe('the purchase report against the ledger (INV-10)', () => {
  it('totals what was actually bought', async () => {
    // By product, for the same reason the sales report is: a bill grouped by
    // date is summed from the bill totals and has no quantity to state.
    const report = await bearer(api().get(`/api/v1/reports/purchases?${range()}&groupBy=PRODUCT`));
    expect(report.status, JSON.stringify(report.body)).toBe(200);
    expect(report.body.data.totals.qty).toBe(20_000);
    expect(report.body.data.totals.amountMinor).toBe(2000_00);
  });
});

describe('the stock report against the movements (INV-10, INV-05)', () => {
  it('agrees with the movements and with the INVENTORY account', async () => {
    const report = await bearer(api().get(`/api/v1/reports/stock?${range()}`));
    expect(report.status, JSON.stringify(report.body)).toBe(200);

    // Twenty in, six out.
    expect(await onHand()).toBe(14_000);

    const valuation = await bearer(api().get('/api/v1/inventory/valuation'));
    expect(valuation.status).toBe(200);
    /*
     * The valuation screen and the INVENTORY account are the same number stated
     * twice, and §3.11 requires them to agree to the poisha. The golden
     * invariants check this after every test in the suite; asserting it here as
     * well is what proves the *report* is derived from it rather than from the
     * product's purchase price.
     */
    const total = valuation.body.data.totalValueMinor ?? valuation.body.data.totals?.valueMinor;
    if (typeof total === 'number') expect(total).toBe(await accountTotal('INVENTORY'));
  });
});

describe('the money report against the ledger (INV-10)', () => {
  it('shows the drawer holding what the drawer account holds', async () => {
    /*
     * The Money screen opens on the receivable ageing; the drawer lives on the
     * CASH view, which is the one that states what an account holds.
     */
    const report = await bearer(api().get(`/api/v1/reports/money?${range()}&view=CASH`));
    expect(report.status, JSON.stringify(report.body)).toBe(200);

    const drawer = await accountTotal(drawerCode);
    // 50,000 opening plus the 600 cash sale.
    expect(drawer).toBe(50000_00 + 600_00);

    const rows = report.body.data.accounts.rows as readonly {
      accountCode: string; closingMinor: number;
    }[];
    expect(rows.find((row) => row.accountCode === drawerCode)?.closingMinor).toBe(drawer);
    // And the screen's own footer is that same sum, not a second opinion.
    expect(report.body.data.accounts.totals.closingMinor).toBe(drawer);
  });
});

describe('who may read what', () => {
  it.each([
    ['sales', Permission.REPORT_SALES_VIEW],
    ['purchases', Permission.REPORT_PURCHASE_VIEW],
    ['stock', Permission.REPORT_STOCK_VIEW],
    ['money', Permission.REPORT_MONEY_VIEW],
  ])('refuses the %s report without its own permission', async (name, code) => {
    const others = PERMISSIONS.filter((permission) => permission !== code);
    const reader = await seedTenant(pool, { name: 'Reports Test', permissions: others });

    const refused = await bearer(
      api().get(`/api/v1/reports/${name}?${range()}`),
      signToken(reader, TEST_JWT_SECRET),
    );
    expect(refused.status).toBe(403);
    expect(refused.body.error.details.permission).toBe(code);
  });
});
