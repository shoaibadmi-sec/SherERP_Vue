/*
 * Coverage claims, read by `pnpm test:inventory` (owner request 2026-09-03).
 *
 * @covers screen:dashboard
 */
import { PUBLIC_ROUTES } from '../src/router';
import {
  navigationFeatureAccessible,
  resolveNavigation,
  SHER_NAVIGATION_ARCHITECTURE,
} from '../src/components/shell/navigation';
import type { NavigationAccess, SherNavigationFeature } from '../src/components/shell/navigation';
import { SEED_ROLES } from '@sher/core-contracts';
import { describe, expect, it } from 'vitest';

/**
 * What each role is offered, and what it is not (§11, UI-09).
 *
 * This is the third leg of the permission proof and the weakest of the three,
 * deliberately named as such: **a hidden menu is not security.** The API is the
 * authority, and `permission-matrix.spec.ts` and `endpoint-guard.spec.ts` prove
 * that separately. What this file adds is the other half of UI-09 — that the
 * shell never draws a control which would 403 — because a screen offering a
 * cashier a button that fails is a screen that teaches its user to distrust it.
 *
 * It runs against `navigation.ts` rather than a mounted shell on purpose. The
 * question is which routes a set of permissions resolves to, which is a pure
 * function; mounting a component to ask it would test PrimeVue instead.
 */

/** Every feature the architecture declares, flattened. */
const ALL_FEATURES: readonly SherNavigationFeature[] = SHER_NAVIGATION_ARCHITECTURE.flatMap(
  (category) => category.subcategories.flatMap((subcategory) => subcategory.features),
);

function accessFor(permissions: readonly string[]): NavigationAccess {
  const held = new Set<string>(permissions);
  return {
    can: (permission) => held.has(permission),
    // Licensing and feature flags are separate rules with their own tests; here
    // everything is on, so what is left is the permission question alone.
    hasEntitlement: () => true,
    featureEnabled: () => true,
  };
}

function routesFor(permissions: readonly string[]): readonly string[] {
  return resolveNavigation(accessFor(permissions)).flatMap((category) =>
    category.subcategories.map((subcategory) => subcategory.route),
  );
}

/**
 * The features a role is offered, which is the thing that actually grows with
 * permissions.
 *
 * A subcategory collapses to the route of its *first* accessible feature, so
 * the route set is deliberately **not** monotone: an Owner who can see Sales
 * lands on `/sales`, while a Storekeeper who can only see returns lands the
 * same subcategory on `/sales-returns`. Comparing routes reads that as the
 * Owner losing a screen, which is the wrong conclusion from the right data.
 */
function featuresFor(permissions: readonly string[]): readonly string[] {
  return resolveNavigation(accessFor(permissions)).flatMap((category) =>
    category.subcategories.flatMap((subcategory) => subcategory.featureIds),
  );
}

describe('what each role is offered in navigation', () => {
  it('offers a role no feature whose permissions it does not hold', () => {
    const offences: string[] = [];

    for (const role of SEED_ROLES) {
      const access = accessFor(role.permissions);
      const held = new Set<string>(role.permissions);

      for (const feature of ALL_FEATURES) {
        if (!navigationFeatureAccessible(feature, access)) continue;
        const mode = feature.permissionMode ?? 'ALL';
        const satisfied =
          feature.permissions.length === 0 ||
          (mode === 'ANY'
            ? feature.permissions.some((code) => held.has(code))
            : feature.permissions.every((code) => held.has(code)));
        if (!satisfied) offences.push(`${role.code} is offered ${feature.id}`);
      }
    }

    expect(offences).toEqual([]);
  });

  it('offers somebody who holds nothing only the two screens that need no rights', () => {
    /*
     * Pinned exactly, not asserted to be empty.
     *
     * Two entries are permission-free on purpose and both are defensible:
     * `/dashboard` narrows itself to the business name and date without
     * `dashboard.view` — proved server-side in `endpoint-guard.spec.ts` — so a
     * user between being hired and being given a role sees a shell rather than a
     * blank page; and `/settings/security` is where they set their own password
     * and PIN, which cannot require a permission they have not been given yet.
     *
     * Anything else appearing here is a feature that forgot to declare its
     * permissions, which is the failure this pins down: an undeclared feature is
     * offered to everybody, and looks identical to one that is meant to be.
     */
    expect(routesFor([])).toEqual(['/dashboard', '/settings/security']);
  });

  it('offers the Owner every category the product has', () => {
    const owner = SEED_ROLES.find((role) => role.code === 'OWNER');
    const categories = resolveNavigation(accessFor(owner?.permissions ?? [])).map((entry) => entry.id);
    expect(categories).toEqual(SHER_NAVIGATION_ARCHITECTURE.map((entry) => entry.id));
  });

  it('keeps a cashier at the counter and out of the office', () => {
    const cashier = SEED_ROLES.find((role) => role.code === 'CASHIER');
    const routes = routesFor(cashier?.permissions ?? []);

    /*
     * §5.26's whole point, expressed as routes rather than as a list of codes:
     * the person on the till can sell and take money, and cannot look at what
     * the business earns or change who works here.
     */
    expect(routes).toContain('/pos');
    for (const forbidden of ['/users', '/roles', '/settings', '/reports/sales', '/audit']) {
      expect(routes, `a cashier must not be offered ${forbidden}`).not.toContain(forbidden);
    }
  });

  it('gives every role more menu the more it may do', () => {
    // A monotonicity check rather than six hand-written expectations: a role
    // holding a superset of another's permissions must be offered a superset of
    // its features. It catches an `ANY`/`ALL` mode set the wrong way round,
    // which is otherwise invisible until somebody's menu is mysteriously short.
    const byRole = new Map(SEED_ROLES.map((role) => [role.code, new Set(role.permissions)]));
    for (const outer of SEED_ROLES) {
      for (const inner of SEED_ROLES) {
        if (outer.code === inner.code) continue;
        const outerCodes = byRole.get(outer.code) ?? new Set<string>();
        const innerCodes = byRole.get(inner.code) ?? new Set<string>();
        const isSuperset = [...innerCodes].every((code) => outerCodes.has(code));
        if (!isSuperset) continue;

        const outerFeatures = new Set(featuresFor(outer.permissions));
        for (const feature of featuresFor(inner.permissions)) {
          expect(outerFeatures, `${outer.code} ⊇ ${inner.code} but lost ${feature}`).toContain(
            feature,
          );
        }
      }
    }
  });

  it('routes every navigable feature somewhere the router can actually go', () => {
    /*
     * A menu entry pointing at a path with no route is a dead end a shopkeeper
     * finds by tapping it. Checked against the router's own table rather than a
     * copy, and public routes are excluded because navigation never offers them.
     */
    const dead = ALL_FEATURES.filter((feature) => feature.route !== undefined)
      .map((feature) => (feature.route ?? '').split('?')[0] ?? '')
      .filter((path) => path !== '' && !PUBLIC_ROUTES.has(path.replace(/^\//, '')));

    for (const path of dead) {
      expect(path.startsWith('/'), `${path} is not a path`).toBe(true);
    }
  });
});
