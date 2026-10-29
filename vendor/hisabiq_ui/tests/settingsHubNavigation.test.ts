import test from 'node:test';
import assert from 'node:assert/strict';
import {getSettingsHubItems} from '../src/settings/settingsHub.ts';
import {erpRoutePaths,erpFeatureIds} from '../src/navigation/erpNavigation.ts';
import type {NavigationContext} from '../src/navigation/resolveErpNavigation.ts';

const all:NavigationContext={availablePaths:erpRoutePaths,enabledFeatures:erpFeatureIds,canAccess:()=>true};

test('tenant settings includes only the seven approved logical destinations',()=>{
 const entries=getSettingsHubItems(all);
 assert.deepEqual(entries.map(e=>e.id),['general','users','notifications','data','subscription','appearance','security']);
 assert.deepEqual(entries.map(e=>e.path),['/app/settings/business','/app/settings/team','/app/notifications','/app/settings/data','/app/subscription','/app/settings/personal','/app/settings/security']);
 assert.ok(entries.every(e=>e.description.length>15));
});
test('Settings removes unready destinations instead of showing broken tiles',()=>{
 const onlyCore:NavigationContext={...all,availablePaths:new Set(['/app/settings/business','/app/settings/personal'])};
 assert.deepEqual(getSettingsHubItems(onlyCore).map(e=>e.id),['general','appearance']);
 const noSms:NavigationContext={...all,enabledFeatures:new Set(['quotations','online-sales'])};
 assert.equal(getSettingsHubItems(noSms).some(e=>e.id==='notifications'),false);
});
test('cashier sees ordinary personal settings, not owner subscription or provider configuration',()=>{
 const cashier:NavigationContext={...all,canAccess:p=>!['team','notifications','export','owner'].includes(p)};
 assert.deepEqual(getSettingsHubItems(cashier).map(e=>e.id),['general','appearance','security']);
});
