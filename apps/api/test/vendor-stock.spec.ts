/*
 * Coverage claims, read by `pnpm test:inventory` (owner request 2026-09-03).
 *
 * @covers workflow:vendor-stock
 * @covers endpoint:POST /api/v1/settings/value
 * @covers endpoint:POST /api/v1/vendor-stock
 * @covers endpoint:POST /api/v1/vendor-stock/returns
 * @covers endpoint:GET /api/v1/vendor-stock/settlement/:vendorPartyId
 * @covers endpoint:POST /api/v1/vendor-workspace/payments
 * @covers endpoint:POST /api/v1/sales
 * @covers permission:vendor.stock.manage
 * @covers permission:vendor.payment.record
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
 * Goods the shop holds but does not own (§5.6 M07, DR13.10).
 *
 * A vendor leaves stock to be sold on their behalf. The shop has it on the
 * shelf and can sell it, but it never bought it — so the whole module turns on
 * one accounting claim that is easy to state and easy to get wrong:
 * **consignment is excluded from stock *value*, never from stock *quantity*.**
 * Receiving it posts no journal entry at all; selling one is DR13.10's deemed
 * purchase, which raises `VENDOR_PAYABLE` against that vendor at the agreed
 * cost instead of releasing anything from `INVENTORY`; handing the unsold ones
 * back posts nothing either, because nothing was ever bought.
 *
 * The same discipline as `sales.spec.ts` and `purchases.spec.ts`: every
 * assertion reads `journal_lines` and `stock_movements` through RLS rather than
 * the response body, because a receipt that returns the right quantities and
 * quietly adds a vendor's goods to what the shop is worth is exactly the
 * failure worth catching — it would inflate the balance sheet by stock that
 * belongs to somebody else, and no screen would say so. `afterEach` re-checks
 * the golden invariants on top (§3.11), which is where INV-05 (valuation equals
 * the `INVENTORY` account, owned lots only) and INV-06 (a vendor payable names
 * its vendor) are enforced for every case here.
 */

const clock = new SystemClock();

/** The drawer is opened before the shop trades, so the balance has a date. */
const openingDay = '2026-01-01';
const DRAWER_OPENING = 100000_00;

let app: INestApplication;
let pool: pg.Pool;
let tenant: SeededTenant;
let token: string;
let productId: string;
let vendorId: string;
let drawerCode: string;

const VENDOR_PERMISSIONS = [
  Permission.VENDOR_STOCK_MANAGE, Permission.VENDOR_VIEW, Permission.VENDOR_CREATE,
  Permission.VENDOR_PAYMENT_RECORD, Permission.SUPPLIER_VIEW,
  Permission.SALE_CREATE, Permission.SALE_VIEW,
  Permission.PRODUCT_VIEW, Permission.PRODUCT_CREATE, Permission.PRODUCT_EDIT,
  Permission.UNIT_MANAGE, Permission.CUSTOMER_VIEW, Permission.CUSTOMER_CREATE,
  Permission.COST_VIEW, Permission.INVENTORY_LOT_VIEW,
  Permission.CASH_ACCOUNT_VIEW, Permission.CASH_ACCOUNT_MANAGE,
  Permission.CASH_SESSION_START, Permission.CASH_DAILY_VIEW,
  Permission.SETTING_VIEW, Permission.SETTING_TOGGLE,
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

/** §3.11 — whatever the case proved, the golden invariants still hold. */
afterEach(async () => {
  await assertGoldenInvariants(pool, tenant.tenantId);
});

const api = (): ReturnType<typeof request> => request(app.getHttpServer());
const auth = (test: request.Test, as = token): request.Test =>
  test.set('Authorization', `Bearer ${as}`).set('Idempotency-Key', Ulid.generate(clock));

/** A setup step that fails silently turns every case below into a puzzle. */
function must(response: request.Response, what: string): request.Response {
  if (response.status >= 400) {
    throw new Error(`${what} failed: ${String(response.status)} ${JSON.stringify(response.body)}`);
  }
  return response;
}

beforeEach(async () => {
  await resetDatabase(pool);
  tenant = await seedTenant(pool, { name: 'Vendor Stock Test', permissions: VENDOR_PERMISSIONS });
  token = signToken(tenant, TEST_JWT_SECRET);
  // Every fully paid guest sale points at it (D-02).
  await seedWalkInCustomer(pool, tenant);

  /*
   * Consignment is switched off in a new shop and sits behind two parents
   * (§5.21): vendors carry the vendor ledger, and the vendor ledger carries
   * consignment. Turning a child on is refused rather than cascaded, so all
   * three are turned on here in dependency order — which is also what the owner
   * does on the Settings screen before the vendor module appears at all.
   */
  for (const key of [
    'vendor_management_enabled', 'vendor_ledger_enabled', 'vendor_consignment_enabled',
  ]) {
    must(
      await api().post('/api/v1/settings/value')
        .set('Authorization', `Bearer ${token}`)
        .send({ key, value: 'on' }),
      `turn on ${key}`,
    );
  }

  const unit = must(
    await auth(api().post('/api/v1/catalog/units')).send({ name: 'Piece' }),
    'create unit',
  );
  const unitId = unit.body.data.units[0].id as string;

  /*
   * Deliberately a product the shop has never bought. Own stock must be used
   * before a vendor's (§5.7), so a shelf with nothing owned on it is what makes
   * every quantity below unambiguously the vendor's.
   */
  const product = must(
    await auth(api().post('/api/v1/products')).send({
      name: 'Vendor Shirt', baseUnitId: unitId,
      purchasePriceMinor: 100_00, sellingPriceMinor: 150_00, minStockQty: 0,
      brandId: null, categoryId: null, sku: null, barcode: null, description: null,
      defaultDiscountType: null, defaultDiscountValue: null, offerEnabled: false,
      offerPriceMinor: null, offerStartDate: null, offerEndDate: null,
      tracksExpiry: false, tracksSerial: false, conversionUnitId: null, conversionFactorQty: null,
    }),
    'create product',
  );
  productId = product.body.data.id as string;

  const vendor = must(
    await auth(api().post('/api/v1/parties')).send({
      name: 'Rahim Garments', roles: ['VENDOR'], phone: '01912345678',
      address: null, guardianName: null, nid: null, email: null, notes: null,
      customerGroupId: null, creditLimitMinor: null,
    }),
    'create vendor',
  );
  vendorId = vendor.body.data.id as string;

  const drawer = must(
    await api().post('/api/v1/money/accounts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Counter drawer', type: 'CASH', holderName: null, reference: null,
        isDrawer: true, openingAmountMinor: DRAWER_OPENING, openingDate: openingDay,
        operationId: Ulid.generate(clock),
      }),
    'create drawer',
  );
  drawerCode = `CASH:${drawer.body.data.id as string}`;

  // Money moves in or out of the drawer only on a started day (§5.16.1).
  must(
    await api().post('/api/v1/money/day/start')
      .set('Authorization', `Bearer ${token}`)
      .send({
        businessDate: todayIn(tenant.timezone), openingAmountMinor: DRAWER_OPENING,
        counterpartAccountCode: null, note: null, operationId: Ulid.generate(clock),
      }),
    'start day',
  );
});

/** Four shirts left with the shop, owed 80.00 each when one sells. */
async function receiveVendorStock(
  overrides: Record<string, unknown> = {},
): Promise<request.Response> {
  return auth(api().post('/api/v1/vendor-stock')).send({
    vendorPartyId: vendorId, productId, qty: 4_000, vendorUnitCostMinor: 80_00,
    expiryDate: null, serials: [], note: null, ...overrides,
  });
}

/** Sell `qty` of the vendor's goods across the counter at 150.00 each. */
async function sellVendorStock(qty: number, unitPriceMinor = 150_00): Promise<request.Response> {
  return auth(api().post('/api/v1/sales')).send({
    partyId: null, customerName: null, customerPhone: null,
    lines: [{
      productId, qty, unitPriceMinor, lineDiscountMinor: 0,
      source: 'VENDOR_CONSIGNMENT', vendorPartyId: vendorId,
    }],
    payments: [{ accountCode: drawerCode, amountMinor: (unitPriceMinor * qty) / 1_000 }],
    discountMinor: 0,
  });
}

/** What each account holds, read straight from the ledger through RLS. */
async function ledger(): Promise<Record<string, number>> {
  return asTenant(pool, tenant.tenantId, async (db) => {
    const rows = await db.query<{ account_code: string; total: string }>(
      `SELECT account_code, SUM(amount_minor)::bigint AS total
         FROM journal_lines GROUP BY account_code`,
    );
    return Object.fromEntries(rows.rows.map((row) => [row.account_code, Number(row.total)]));
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

/** What selling this vendor's goods has made the shop owe them (INV-06). */
async function vendorPayable(): Promise<number> {
  return asTenant(pool, tenant.tenantId, async (db) => {
    const row = await db.query<{ total: string }>(
      `SELECT COALESCE(SUM(amount_minor), 0)::bigint AS total
         FROM journal_lines WHERE account_code = 'VENDOR_PAYABLE' AND party_id = $1`,
      [vendorId],
    );
    return Number(row.rows[0]?.total ?? 0);
  });
}

/** Every lot of the product, with who owns it and what it is carried at. */
async function lots(): Promise<{ ownerType: string; qtyRemaining: number; unitCost: number }[]> {
  return asTenant(pool, tenant.tenantId, async (db) => {
    const rows = await db.query<{
      owner_type: string; qty_remaining: string; actual_unit_cost: string;
    }>(
      `SELECT owner_type, qty_remaining::bigint, actual_unit_cost::bigint
         FROM inventory_lots WHERE product_id = $1 AND deleted_at IS NULL
        ORDER BY created_at`,
      [productId],
    );
    return rows.rows.map((row) => ({
      ownerType: row.owner_type,
      qtyRemaining: Number(row.qty_remaining),
      unitCost: Number(row.actual_unit_cost),
    }));
  });
}

describe('receiving a vendor’s stock (DR13.10)', () => {
  it('puts the goods on the shelf without adding a taka to what the shop owns', async () => {
    const before = await ledger();

    const receipt = await receiveVendorStock();
    expect(receipt.status, JSON.stringify(receipt.body)).toBe(201);

    // Four shirts are physically there — DR13.10 excludes consignment from
    // value, never from quantity, and INV-04 counts these lots.
    expect(await onHand()).toBe(4_000);
    expect(await lots()).toEqual([
      { ownerType: 'VENDOR', qtyRemaining: 4_000, unitCost: 80_00 * 100 },
    ]);

    /*
     * And the books have not moved at all. The shop has bought nothing, owes
     * nothing and is worth no more than it was a moment ago: 320.00 of somebody
     * else's shirts on the shelf is exposure, not an asset.
     */
    const accounts = await ledger();
    expect(accounts).toEqual(before);
    expect(accounts['INVENTORY'] ?? 0).toBe(0);
    expect(accounts['VENDOR_PAYABLE'] ?? 0).toBe(0);
    expect(accounts['AP'] ?? 0).toBe(0);
  });

  it('is refused without vendor.stock.manage, whatever the screen shows', async () => {
    const clerk = await seedTenant(pool, {
      name: 'Vendor Stock Test', permissions: [Permission.VENDOR_VIEW],
    });
    const refused = await auth(
      api().post('/api/v1/vendor-stock'), signToken(clerk, TEST_JWT_SECRET),
    ).send({
      vendorPartyId: vendorId, productId, qty: 4_000, vendorUnitCostMinor: 80_00,
      expiryDate: null, serials: [], note: null,
    });
    // A hidden button is not security (§11): the endpoint refuses on its own.
    expect(refused.status).toBe(403);
    expect(refused.body.error.details.permission).toBe(Permission.VENDOR_STOCK_MANAGE);
  });
});

describe('selling a vendor’s item (DR13.10’s deemed purchase)', () => {
  it('owes the vendor their cost and names them on the journal line', async () => {
    must(await receiveVendorStock(), 'receive vendor stock');

    const sale = await sellVendorStock(1_000);
    expect(sale.status, JSON.stringify(sale.body)).toBe(201);

    const accounts = await ledger();
    // One shirt at 150.00 across the counter.
    expect(accounts['SALES']).toBe(-150_00);
    expect(accounts[drawerCode]).toBe(DRAWER_OPENING + 150_00);
    // It cost 80.00 — the vendor's agreed price, which is what the shop is now
    // deemed to have bought it for.
    expect(accounts['COGS']).toBe(80_00);
    /*
     * And the credit for that cost went to the vendor, not to `INVENTORY`. This
     * is the whole of DR13.10: the goods were never in the shop's stock value,
     * so releasing them cannot take anything out of it — the cost becomes a debt
     * to the vendor instead. An `INVENTORY` movement here would be the shop
     * writing down stock it never owned.
     */
    expect(accounts['INVENTORY'] ?? 0).toBe(0);
    expect(accounts['VENDOR_PAYABLE']).toBe(-80_00);
    // INV-06: the payable belongs to somebody, and it is this vendor.
    expect(await vendorPayable()).toBe(-80_00);

    // Three shirts left, and the vendor's lot is what shrank.
    expect(await onHand()).toBe(3_000);
    expect(await lots()).toEqual([
      { ownerType: 'VENDOR', qtyRemaining: 3_000, unitCost: 80_00 * 100 },
    ]);
  });

  it('owes for each one sold, and no more', async () => {
    must(await receiveVendorStock(), 'receive vendor stock');
    must(await sellVendorStock(2_000), 'sell two of the vendor’s shirts');

    const accounts = await ledger();
    expect(accounts['COGS']).toBe(160_00);
    expect(accounts['VENDOR_PAYABLE']).toBe(-160_00);
    expect(accounts['INVENTORY'] ?? 0).toBe(0);
    expect(await onHand()).toBe(2_000);
  });

  it('refuses to sell more of a vendor’s goods than they left', async () => {
    must(await receiveVendorStock(), 'receive vendor stock');

    const refused = await sellVendorStock(9_000);
    expect(refused.status).toBeGreaterThanOrEqual(400);
    expect(refused.status).toBeLessThan(500);
    // Nothing was half-done: the shelf and the vendor's account are untouched.
    expect(await onHand()).toBe(4_000);
    expect(await vendorPayable()).toBe(0);
  });
});

describe('paying the vendor', () => {
  it('clears exactly what was paid and takes it from the account named', async () => {
    must(await receiveVendorStock(), 'receive vendor stock');
    must(await sellVendorStock(2_000), 'sell two of the vendor’s shirts');
    expect(await vendorPayable()).toBe(-160_00);

    const payment = await auth(api().post('/api/v1/vendor-workspace/payments')).send({
      vendorPartyId: vendorId, intent: 'SETTLE_PAYABLE', amountMinor: 60_00,
      accountCode: drawerCode, note: null,
    });
    expect(payment.status, JSON.stringify(payment.body)).toBe(201);

    const accounts = await ledger();
    // 160.00 owed less the 60.00 handed over: the rest is still owed, and the
    // drawer is 60.00 lighter than the sale left it.
    expect(accounts['VENDOR_PAYABLE']).toBe(-100_00);
    expect(accounts[drawerCode]).toBe(DRAWER_OPENING + 300_00 - 60_00);
    expect(await vendorPayable()).toBe(-100_00);
    // Paying a vendor moves money, never goods.
    expect(await onHand()).toBe(2_000);
  });

  it('refuses to pay past what selling their goods actually owed them', async () => {
    must(await receiveVendorStock(), 'receive vendor stock');
    must(await sellVendorStock(1_000), 'sell one of the vendor’s shirts');

    const refused = await auth(api().post('/api/v1/vendor-workspace/payments')).send({
      vendorPartyId: vendorId, intent: 'SETTLE_PAYABLE', amountMinor: 500_00,
      accountCode: drawerCode, note: null,
    });
    expect(refused.status).toBe(400);
    // The debt and the drawer are exactly where the sale left them.
    expect(await vendorPayable()).toBe(-80_00);
    expect((await ledger())[drawerCode]).toBe(DRAWER_OPENING + 150_00);
  });

  it('is refused without vendor.payment.record', async () => {
    const clerk = await seedTenant(pool, {
      name: 'Vendor Stock Test', permissions: [Permission.VENDOR_VIEW],
    });
    const refused = await auth(
      api().post('/api/v1/vendor-workspace/payments'), signToken(clerk, TEST_JWT_SECRET),
    ).send({
      vendorPartyId: vendorId, intent: 'SETTLE_PAYABLE', amountMinor: 10_00,
      accountCode: drawerCode, note: null,
    });
    expect(refused.status).toBe(403);
    expect(refused.body.error.details.permission).toBe(Permission.VENDOR_PAYMENT_RECORD);
  });
});

describe('handing the unsold goods back', () => {
  it('takes them off the shelf and leaves the books exactly as they were', async () => {
    const receipt = must(await receiveVendorStock(), 'receive vendor stock');
    const receiptId = receipt.body.data.id as string;
    const before = await ledger();

    const returned = await auth(api().post('/api/v1/vendor-stock/returns')).send({
      receiptId, qty: 4_000, serialUnitIds: [], note: 'None of them sold',
    });
    expect(returned.status, JSON.stringify(returned.body)).toBe(201);

    expect(await onHand()).toBe(0);
    expect(await lots()).toEqual([
      { ownerType: 'VENDOR', qtyRemaining: 0, unitCost: 80_00 * 100 },
    ]);
    /*
     * Nothing was bought, so there is nothing to unbuy: no refund, no payable
     * and no stock value either way. The ledger is untouched from before the
     * return, which is the same claim receiving made from the other end.
     */
    const accounts = await ledger();
    expect(accounts).toEqual(before);
    expect(accounts['VENDOR_PAYABLE'] ?? 0).toBe(0);
    expect(accounts['INVENTORY'] ?? 0).toBe(0);
  });

  it('leaves the debt for the ones that did sell', async () => {
    const receipt = must(await receiveVendorStock(), 'receive vendor stock');
    const receiptId = receipt.body.data.id as string;
    must(await sellVendorStock(1_000), 'sell one of the vendor’s shirts');

    const returned = await auth(api().post('/api/v1/vendor-stock/returns')).send({
      receiptId, qty: 3_000, serialUnitIds: [], note: null,
    });
    expect(returned.status, JSON.stringify(returned.body)).toBe(201);

    // The shelf is clear, and the vendor is still owed for the one that sold —
    // returning goods can only undo goods, never a sale.
    expect(await onHand()).toBe(0);
    expect(await vendorPayable()).toBe(-80_00);
    expect((await ledger())['INVENTORY'] ?? 0).toBe(0);
  });

  it('refuses to hand back more than is still on the shelf', async () => {
    const receipt = must(await receiveVendorStock(), 'receive vendor stock');
    const receiptId = receipt.body.data.id as string;
    must(await sellVendorStock(2_000), 'sell two of the vendor’s shirts');

    const refused = await auth(api().post('/api/v1/vendor-stock/returns')).send({
      receiptId, qty: 4_000, serialUnitIds: [], note: null,
    });
    expect(refused.status).toBe(400);
    // Handing back goods that have already been sold would drive the lot
    // negative and give the vendor stock the shop no longer has.
    expect(await onHand()).toBe(2_000);
  });

  it('is refused without vendor.stock.manage', async () => {
    const receipt = must(await receiveVendorStock(), 'receive vendor stock');
    const clerk = await seedTenant(pool, {
      name: 'Vendor Stock Test', permissions: [Permission.VENDOR_VIEW],
    });
    const refused = await auth(
      api().post('/api/v1/vendor-stock/returns'), signToken(clerk, TEST_JWT_SECRET),
    ).send({ receiptId: receipt.body.data.id as string, qty: 1_000, serialUnitIds: [], note: null });
    expect(refused.status).toBe(403);
    expect(refused.body.error.details.permission).toBe(Permission.VENDOR_STOCK_MANAGE);
  });
});

describe('the settlement line the owner reads (§5.6 M07)', () => {
  it('agrees with the ledger rather than keeping its own tally of the money', async () => {
    must(await receiveVendorStock(), 'receive vendor stock');
    must(await sellVendorStock(2_000), 'sell two of the vendor’s shirts');
    must(
      await auth(api().post('/api/v1/vendor-workspace/payments')).send({
        vendorPartyId: vendorId, intent: 'SETTLE_PAYABLE', amountMinor: 60_00,
        accountCode: drawerCode, note: null,
      }),
      'pay the vendor',
    );

    const settlement = await auth(api().get(`/api/v1/vendor-stock/settlement/${vendorId}`)).send();
    expect(settlement.status, JSON.stringify(settlement.body)).toBe(200);

    /*
     * Read against the ledger, not against arithmetic repeated here: §5.6 M07
     * says the money on this line comes from the vendor's journal lines, and a
     * second tally that agreed with itself would prove nothing. What the screen
     * shows as still owed must be what `VENDOR_PAYABLE` holds for this vendor.
     */
    const owed = -(await vendorPayable());
    const body = settlement.body.data as {
      receivedQty: number; soldQty: number; returnedQty: number; onHandQty: number;
      dueMinor: number; paidMinor: number; balanceMinor: number;
    };
    expect(body.balanceMinor).toBe(owed);
    expect(body.dueMinor - body.paidMinor).toBe(owed);
    expect(body.receivedQty).toBe(4_000);
    expect(body.soldQty).toBe(2_000);
    expect(body.returnedQty).toBe(0);
    expect(body.onHandQty).toBe(await onHand());
  });
});

describe('the API refuses what the screen would not send (§6)', () => {
  it.each([
    ['no quantity', { qty: 0 }],
    ['a negative quantity', { qty: -1_000 }],
    ['a negative vendor cost', { vendorUnitCostMinor: -1 }],
    ['serials on a product that has none', { serials: ['SN-1'] }],
  ])('refuses %s', async (_case, overrides) => {
    const refused = await receiveVendorStock(overrides);
    expect(refused.status).toBe(400);
    expect(refused.body.error.code).toBe('VALIDATION_FAILED');
    expect(await onHand()).toBe(0);
  });

  it('refuses stock left by a party who is not a vendor', async () => {
    const customer = must(
      await auth(api().post('/api/v1/parties')).send({
        name: 'Karim Uddin', roles: ['CUSTOMER'], phone: '01712345678',
        address: null, guardianName: null, nid: null, email: null, notes: null,
        customerGroupId: null, creditLimitMinor: null,
      }),
      'create customer',
    );
    const refused = await receiveVendorStock({ vendorPartyId: customer.body.data.id as string });
    expect(refused.status).toBe(400);
    expect(await onHand()).toBe(0);
  });

  it('refuses a receipt with no idempotency key, however well formed', async () => {
    const refused = await api().post('/api/v1/vendor-stock')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vendorPartyId: vendorId, productId, qty: 4_000, vendorUnitCostMinor: 80_00,
        expiryDate: null, serials: [], note: null,
      });
    expect(refused.status).toBe(400);
    expect(await onHand()).toBe(0);
  });
});
