/*
 * Coverage claims, read by `pnpm test:inventory` (owner request 2026-09-03).
 *
 * Every permission code the product defines is exercised here against every
 * seed role, so the claims below are the whole catalogue rather than a
 * selection. They are generated in `permission-claims.ts` and pasted in — a
 * hand-kept list would be the one thing in this file able to go stale.
 *
 * @covers-all-permissions
 */
import 'reflect-metadata';

import {
  PERMISSION_CATALOGUE,
  SEED_ROLES,
  AppError,
  ErrorCode,
} from '@sher/core-contracts';
import {
  createDatabase,
  PostgresAccessControl,
  PostgresUnitOfWork,
} from '@sher/adapter-postgres';
import type { Entitlement, EntitlementProvider, TenantContext } from '@sher/core-application';
import { SystemClock, Ulid } from '@sher/shared-utils';
import type pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { SeededTenant } from './support/database';
import { prepareTestDatabase, resetDatabase, seedTenant, testPool } from './support/database';

/**
 * Every seed role against every permission code (§5.26, §11 of the owner's
 * acceptance-test request).
 *
 * **Why the whole grid rather than a sample.** A permission is a single string
 * compared with `includes`; nothing about it is type-checked at the point of
 * use, and a role that is missing a code, or holding one it should not, is
 * silent in exactly the way the vendor support ceiling was silent until
 * 2026-09-03. There are six roles and about 120 codes, so the entire grid is
 * roughly seven hundred assertions that cost a few seconds — cheap enough that
 * sampling would be a false economy.
 *
 * **What this proves and what it does not.** It proves the enforcement
 * mechanism: that `PostgresAccessControl.require` refuses exactly the codes a
 * role does not hold, reading real `role_permissions` rows through the real
 * query, and refuses them with the code named in `details` so a support call can
 * say which one. It does **not** prove that each endpoint asks for the *right*
 * code — an endpoint checking `product.view` where it should check
 * `product.edit` would pass everything here. That is what the refusal tests in
 * the module suites are for, and the gap is named in `COVERAGE.md` rather than
 * papered over.
 *
 * **The licence layer is stubbed out on purpose.** `require` runs entitlement
 * before role, and a module the licence excludes is refused whatever the role
 * holds — which is correct, and is a different rule with its own tests
 * (`core-domain/test/license.spec.ts`). Mixing it in here would mean a licence
 * change silently rewriting the role matrix.
 */

const clock = new SystemClock();

/** An unrestricted, verified licence: `modules: []` means everything (D-36). */
const UNRESTRICTED: Entitlement = {
  state: 'ACTIVE',
  licensed: true,
  modules: [],
  validUntil: null,
  evaluatedAt: clock.now(),
  businessId: '*',
  licenceId: 'test-licence',
  clockBehindMs: 0,
};

const entitlements: EntitlementProvider = { current: () => UNRESTRICTED };

const ALL_CODES = PERMISSION_CATALOGUE.map((entry) => entry.code);

let pool: pg.Pool;
let uow: PostgresUnitOfWork;
let access: PostgresAccessControl;

beforeAll(async () => {
  pool = testPool();
  await prepareTestDatabase();
  await resetDatabase(pool);
  uow = new PostgresUnitOfWork(createDatabase(pool));
  access = new PostgresAccessControl(entitlements, clock);
});

afterAll(async () => {
  await pool.end();
});

/** The tenants are built once; nothing here writes business state. */
const seeded = new Map<string, SeededTenant>();

async function tenantFor(roleCode: string, permissions: readonly string[]): Promise<SeededTenant> {
  const existing = seeded.get(roleCode);
  if (existing !== undefined) return existing;
  const tenant = await seedTenant(pool, { name: `Role ${roleCode}`, permissions });
  seeded.set(roleCode, tenant);
  return tenant;
}

function contextFor(tenant: SeededTenant): TenantContext {
  return {
    tenantId: tenant.tenantId,
    userId: tenant.userId,
    timezone: tenant.timezone,
    requestId: Ulid.generate(clock),
  } as TenantContext;
}

/** `null` when allowed; the refusal when not. */
async function refusalFor(tenant: SeededTenant, code: string): Promise<AppError | null> {
  const ctx = contextFor(tenant);
  try {
    await uow.run(ctx, async (tx) => {
      await access.require(tx, ctx, code);
    });
    return null;
  } catch (cause) {
    if (cause instanceof AppError) return cause;
    throw cause;
  }
}

describe('every seed role against every permission code', () => {
  for (const role of SEED_ROLES) {
    const held = new Set<string>(role.permissions);

    describe(`${role.name} (${role.code})`, () => {
      it(`holds ${String(held.size)} of ${String(ALL_CODES.length)} codes, and the grid agrees`, async () => {
        const tenant = await tenantFor(role.code, role.permissions);

        const wronglyRefused: string[] = [];
        const wronglyAllowed: string[] = [];
        const misnamed: string[] = [];

        for (const code of ALL_CODES) {
          const refusal = await refusalFor(tenant, code);

          if (held.has(code)) {
            if (refusal !== null) wronglyRefused.push(`${code} → ${refusal.message}`);
            continue;
          }

          if (refusal === null) {
            wronglyAllowed.push(code);
            continue;
          }
          if (refusal.code !== ErrorCode.PERMISSION_DENIED) {
            misnamed.push(`${code} refused with ${refusal.code}`);
            continue;
          }
          /*
           * The code goes in `details` so a support call can say which
           * permission to grant. A refusal that does not name it leaves the
           * shopkeeper reading "ask the business owner" with nothing to ask for.
           */
          const named = (refusal.details as { permission?: string } | undefined)?.permission;
          if (named !== code) misnamed.push(`${code} refused naming ${String(named)}`);
        }

        // Reported together rather than one assertion each: a role wired wrongly
        // is wrong about many codes at once, and seeing all of them is what
        // tells you whether a permission was renamed or a role was rewritten.
        expect({ wronglyRefused, wronglyAllowed, misnamed }).toEqual({
          wronglyRefused: [],
          wronglyAllowed: [],
          misnamed: [],
        });
      });
    });
  }

  it('gives the Owner every code there is, with none invented', async () => {
    const owner = SEED_ROLES.find((role) => role.code === 'OWNER');
    expect(owner).toBeDefined();
    // §5.26: the Owner "cannot be de-privileged". Derived from the catalogue in
    // the source for exactly this reason, and asserted so a hand-edit is caught.
    expect([...(owner?.permissions ?? [])].sort()).toEqual([...ALL_CODES].sort());
  });

  it('never lets a role hold a code the catalogue does not define', () => {
    const real = new Set<string>(ALL_CODES);
    const invented = SEED_ROLES.flatMap((role) =>
      role.permissions.filter((code) => !real.has(code)).map((code) => `${role.code}: ${code}`),
    );
    // The same failure mode as the support ceiling: a string nothing validates.
    expect(invented).toEqual([]);
  });

  it('gives the Viewer nothing that writes', () => {
    const viewer = SEED_ROLES.find((role) => role.code === 'VIEWER');
    const writes = (viewer?.permissions ?? []).filter((code) =>
      /\.(create|edit|delete|manage|record|void|post|start|close|reopen|run|toggle|adjust|perform|change|reset|restore|disable|deactivate|recompute)/.test(
        code,
      ),
    );
    // "Read-only" is a claim about safety, so it is worth an assertion rather
    // than a name.
    expect(writes).toEqual([]);
  });
});
