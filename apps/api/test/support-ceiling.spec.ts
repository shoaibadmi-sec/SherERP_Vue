/*
 * Coverage claims, read by `pnpm test:inventory` (owner request 2026-09-03).
 *
 * @covers permission:business.reset
 * @covers permission:backup.restore
 * @covers permission:user.account.create
 * @covers permission:user.role.manage
 */
import 'reflect-metadata';

import { PERMISSION_CATALOGUE, Permission } from '@sher/core-contracts';
import { SUPPORT_FORBIDDEN_PERMISSIONS } from '@sher/adapter-postgres';
import { describe, expect, it } from 'vitest';

import { SUPPORT_FORBIDDEN_ROUTE_PREFIXES } from '../src/management/support-grant';

/**
 * The two lists that stand between a vendor support session and the two things
 * an audit trail cannot repair (§12, §13).
 *
 * **Why this file exists.** Both lists are plain arrays of strings compared with
 * `includes` and `startsWith`, which means a wrong string is not a compile
 * error, not a lint error and not a runtime error — it is silence. On
 * 2026-09-03 nine of the ten entries in the permission list were names no
 * permission has ever had (`users.create` for `user.account.create`,
 * `settings.reset_business_data` for `business.reset`), so that half of the
 * ceiling had never once refused anything; and the route list named
 * `/api/v1/settings/reset-business-data`, which is not where Reset Business
 * Data lives. Reset Business Data was therefore reachable by both halves
 * missing it at once — the exact "erase the evidence of what the session did"
 * case §13 is written to prevent.
 *
 * Nothing here starts the application: the bug was in the data, and a test that
 * reads the data is the one that would have caught it on the day it was
 * written.
 */

/** The routes each forbidden act is actually reachable at, as of Phase 19. */
const ACTS: readonly {
  readonly act: string;
  readonly route: string;
  readonly permission: string | null;
}[] = [
  { act: 'add a user', route: '/api/v1/users', permission: Permission.USER_CREATE },
  { act: 'edit a user', route: '/api/v1/users/01ARZ3NDEKTSV4RRFFQ69G5FAV', permission: Permission.USER_EDIT },
  { act: 'disable a user', route: '/api/v1/users/01ARZ3NDEKTSV4RRFFQ69G5FAV/disable', permission: Permission.USER_DISABLE },
  { act: 'change what a role may do', route: '/api/v1/roles/01ARZ3NDEKTSV4RRFFQ69G5FAV', permission: Permission.ROLE_MANAGE },
  { act: 'restore over live data', route: '/api/v1/backup/restore', permission: Permission.BACKUP_RESTORE },
  { act: 'erase the business', route: '/api/v1/backup/reset', permission: Permission.BUSINESS_RESET },
  // No permission of their own — see the note beside the permission list.
  { act: 'change a password', route: '/api/v1/settings/security/password', permission: null },
  { act: 'change a PIN', route: '/api/v1/settings/security/pin', permission: null },
  { act: 'reset a password', route: '/api/v1/auth/password/reset', permission: null },
  { act: 'replace the backup secret', route: '/api/v1/backup/secret', permission: null },
];

function routeIsForbidden(route: string): boolean {
  return SUPPORT_FORBIDDEN_ROUTE_PREFIXES.some((prefix) => route.startsWith(prefix));
}

describe('the vendor support ceiling (§13)', () => {
  it('names only permissions that exist', () => {
    // Widened to `string` deliberately: the point is to catch a value that is
    // *not* a permission code, which a `Set<Permission>` would refuse to be asked about.
    const real = new Set<string>(PERMISSION_CATALOGUE.map((entry) => entry.code));
    const invented = SUPPORT_FORBIDDEN_PERMISSIONS.filter((code) => !real.has(code));

    /*
     * The whole bug, in one assertion. A name that is not a permission code can
     * never match the code being checked, so listing it forbids nothing while
     * reading exactly like protection.
     */
    expect(invented).toEqual([]);
  });

  it('refuses every act §13 forbids, at the route or at the permission', () => {
    const unguarded = ACTS.filter(
      (entry) =>
        !routeIsForbidden(entry.route) &&
        (entry.permission === null || !SUPPORT_FORBIDDEN_PERMISSIONS.includes(entry.permission)),
    ).map((entry) => `${entry.act} (${entry.route})`);

    expect(unguarded).toEqual([]);
  });

  it('stops erasing the business at the route as well as at the permission', () => {
    /*
     * Called out on its own because it is the one that got through. `/backup/
     * reset` does not begin with `/api/v1/backup/restore`, so the restore prefix
     * never covered it, and the permission half was inert — two independent
     * mistakes lining up on the single most destructive endpoint in the product.
     */
    expect(routeIsForbidden('/api/v1/backup/reset')).toBe(true);
    expect(SUPPORT_FORBIDDEN_PERMISSIONS).toContain(Permission.BUSINESS_RESET);
  });

  it('leaves support able to do the operational work it exists for', () => {
    /*
     * A ceiling that forbade everything would be safe and useless. The owner
     * chose full operational and accounting reach, so the codes support needs in
     * order to fix a shop's books must stay off the list — including
     * `backup.export`, because taking a backup before touching anything is the
     * first thing a careful operator does.
     */
    for (const code of [
      Permission.SALE_CREATE, Permission.SALE_VOID, Permission.PURCHASE_CREATE,
      Permission.EXPENSE_RECORD, Permission.STOCK_COUNT_POST, Permission.BACKUP_EXPORT,
      Permission.SETTING_EDIT, Permission.TRANSACTION_DATE_CHANGE,
    ]) {
      expect(SUPPORT_FORBIDDEN_PERMISSIONS).not.toContain(code);
    }
  });

  it('names no route prefix that matches nothing', () => {
    /*
     * The other half of the same failure: three of the seven prefixes pointed at
     * paths that do not exist, which is why nobody noticed the fourth was
     * missing. Every prefix must cover at least one act this file knows about.
     */
    const dead = SUPPORT_FORBIDDEN_ROUTE_PREFIXES.filter(
      (prefix) => !ACTS.some((entry) => entry.route.startsWith(prefix)),
    );
    expect(dead).toEqual([]);
  });
});
