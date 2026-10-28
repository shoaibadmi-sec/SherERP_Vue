/*
 * Coverage claims, read by `pnpm test:inventory` (owner request 2026-09-03).
 *
 * @covers permission:user.role.view
 * @covers permission:audit.event.view
 */
import 'reflect-metadata';

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { SystemClock, Ulid } from '@sher/shared-utils';
import type pg from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';
import { AppErrorFilter } from '../src/common/app-error.filter';
import { signToken, TEST_JWT_SECRET } from './support/auth';
import type { SeededTenant } from './support/database';
import { prepareTestDatabase, resetDatabase, seedTenant, testPool } from './support/database';

/**
 * Every read endpoint, asked by somebody signed in who may do nothing (§11).
 *
 * **The question this answers is not "does the role system work" — the
 * permission matrix answers that — but "did every endpoint remember to ask".**
 * A route that never calls `access.require` inherits no protection from
 * anywhere: the guard on the controller establishes *who* the caller is, and
 * nothing else in the stack decides whether they may. Such a route is invisible
 * to every other test in this repository, because every other test signs in
 * with the permissions it needs.
 *
 * So the caller here holds a valid token for a real tenant and **no permissions
 * at all**, and every endpoint must refuse. A `200` is the finding.
 *
 * **Reads only.** A sweep that fired every `POST` would be a sweep that voids
 * documents and resets businesses to see what happens, and a test that has to
 * be careful about what it destroys is a test nobody will run. Writes are
 * covered by the refusal cases in each module's own suite, where the request is
 * meaningful and the effect is asserted.
 *
 * **The list comes from the generated inventory**, so an endpoint added
 * tomorrow is swept the day it appears rather than the day somebody remembers
 * to add it here.
 */

interface InventoryEndpoint {
  readonly method: string;
  readonly path: string;
}

/*
 * Resolved from the repo root rather than from this file: `apps/api` builds to
 * CommonJS, where `import.meta` is a compile error, and vitest runs with the
 * package as its working directory.
 */
const INVENTORY = resolve(process.cwd(), '../../docs/testing/inventory.json');

/**
 * Endpoints that answer a permission-less caller on purpose, each with why.
 *
 * This list is the whole risk in this file: anything added to it stops being
 * tested. Every entry is something that must work *before* a user can hold any
 * permission, or something whose entire content is "what may you do", which
 * cannot itself require a permission without a chicken and egg.
 */
const OPEN_BY_DESIGN: ReadonlyMap<string, string> = new Map([
  ['/health', 'Liveness for a load balancer, answered before anybody signs in.'],
  ['/api/v1/me', 'Its whole content is what this user may do. Requiring a permission to read your own permissions cannot terminate.'],
  ['/api/v1/license/notice', 'The licence banner. A shop whose licence lapsed must still be told why, whatever its role holds.'],
  ['/api/v1/provider/status', 'Whether this deployment is SaaS or on-premise — a property of the installation, not of the business.'],
  ['/api/v1/offline/status', 'Phase 12.1: a cashier must be able to read why this machine cannot work offline. The route comment says so explicitly.'],
  ['/api/v1/management/status', 'Support-session state for the shell, so a shop can always see that a vendor is connected.'],
  ['/api/v1/dashboard/summary', 'Returns the business name and nothing else — the name of the shop this user is already signed in to. Asserted below rather than trusted.'],
  ['/api/v1/dashboard/cards', 'Answers every caller, and narrows itself to what each permission allows: without dashboard.view it carries the name and the date and no figures. Asserted below.'],
  ['/api/v1/settings/security', 'Whether the acting user has a password and a PIN of their own. Self-service, like /me, and about nobody else. Asserted below.'],
]);

/** The figures that must never reach somebody holding no permissions. */
const BUSINESS_FIGURES = [
  'todaySalesMinor', 'todaySaleCount', 'cashInHandMinor', 'bankBalanceMinor',
  'stockValueMinor', 'customerDueMinor', 'supplierPayableMinor', 'lowStockCount',
  'todayProfitMinor', 'recentSales', 'target',
];

const clock = new SystemClock();
let app: INestApplication;
let pool: pg.Pool;
let tenant: SeededTenant;
let token: string;

beforeAll(async () => {
  pool = testPool();
  await prepareTestDatabase();
  await resetDatabase(pool);
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  app.useGlobalFilters(new AppErrorFilter());
  await app.init();

  // A real, signed-in user of a real business, holding nothing.
  tenant = await seedTenant(pool, { name: 'Holds Nothing', permissions: [] });
  token = signToken(tenant, TEST_JWT_SECRET);
});

afterAll(async () => {
  await app.close();
  await pool.end();
});

/** A syntactically valid id, so the refusal is about rights and not about shape. */
function fill(path: string): string {
  return path.replace(/:[A-Za-z]+/g, Ulid.generate(clock));
}

function readEndpoints(): readonly InventoryEndpoint[] {
  const inventory = JSON.parse(readFileSync(INVENTORY, 'utf8')) as {
    endpoints: readonly InventoryEndpoint[];
  };
  const seen = new Set<string>();
  return inventory.endpoints.filter((endpoint) => {
    if (endpoint.method !== 'GET') return false;
    if (OPEN_BY_DESIGN.has(endpoint.path)) return false;
    if (seen.has(endpoint.path)) return false;
    seen.add(endpoint.path);
    return true;
  });
}

describe('a signed-in user who may do nothing', () => {
  it('is refused by every read endpoint that is not open by design', async () => {
    const endpoints = readEndpoints();
    // If this ever reads zero the inventory has moved and the sweep is empty,
    // which would pass silently and prove nothing.
    expect(endpoints.length).toBeGreaterThan(50);

    const answered: string[] = [];
    for (const endpoint of endpoints) {
      const response = await request(app.getHttpServer())
        .get(fill(endpoint.path))
        .set('Authorization', `Bearer ${token}`);

      /*
       * Anything but success is acceptable here. `403` is the intended answer;
       * `404` is right for a record this tenant cannot see (§3.11 note: a
       * missing record and a forbidden one are deliberately indistinguishable,
       * so a probe cannot enumerate ids); `400` is right where the id shape is
       * checked first. What must never happen is data coming back.
       */
      if (response.status < 300) answered.push(`${endpoint.path} → ${String(response.status)}`);
    }

    expect(answered).toEqual([]);
  }, 120_000);

  /*
   * The three endpoints above answer rather than refuse, which is right and is
   * exactly why they need a sharper test than "did it 403". An endpoint that
   * narrows itself by permission is only safe if the narrowing works, and that
   * is a statement about the body, not the status.
   */
  it('is told the shop’s name and not one of its figures', async () => {
    const cards = await request(app.getHttpServer())
      .get('/api/v1/dashboard/cards')
      .set('Authorization', `Bearer ${token}`);
    expect(cards.status).toBe(200);

    const body = cards.body.data as Record<string, unknown>;
    // The shell needs these to draw itself at all (UI-09).
    expect(typeof body['businessName']).toBe('string');
    expect(typeof body['businessDate']).toBe('string');
    // And nothing else. Every figure is gated on its own report permission.
    expect(BUSINESS_FIGURES.filter((field) => field in body)).toEqual([]);

    const summary = await request(app.getHttpServer())
      .get('/api/v1/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(summary.status).toBe(200);
    expect(Object.keys(summary.body.data as Record<string, unknown>)).toEqual(['businessName']);
  });

  it('is told about its own credentials and nobody else’s', async () => {
    const security = await request(app.getHttpServer())
      .get('/api/v1/settings/security')
      .set('Authorization', `Bearer ${token}`);
    expect(security.status).toBe(200);

    const body = JSON.stringify(security.body);
    /*
     * Self-service, so it answers — but it must be answering about the caller
     * and must never carry a secret. A hash reaching a client is the kind of
     * thing that is only ever noticed by a test that looks.
     */
    expect(body).not.toMatch(/\$2[aby]\$|hash|password"\s*:\s*"/i);
  });

  it('is refused without a token at all', async () => {
    const anonymous = await request(app.getHttpServer()).get('/api/v1/products');
    expect(anonymous.status).toBe(401);
  });

  it('keeps every open-by-design endpoint to a defensible reason', () => {
    // Not a behaviour test — a review gate. Anything on this list is untested by
    // the sweep above, so it has to say why in words somebody can disagree with.
    for (const [path, reason] of OPEN_BY_DESIGN) {
      expect(reason.length, `${path} needs a reason`).toBeGreaterThan(40);
    }
  });
});
