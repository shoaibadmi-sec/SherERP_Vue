import test from 'node:test';
import assert from 'node:assert/strict';
import {erpNavigation} from '../src/navigation/erpNavigation.ts';
import {getVisibleNavigation,resolveNavLocation, type NavigationContext} from '../src/navigation/resolveErpNavigation.ts';

const allPaths=new Set(erpNavigation.flatMap(g=>[g.landingPath,...(g.children??[]).map(c=>c.path)].filter(Boolean) as string[]));
const allowAll:NavigationContext={availablePaths:allPaths,enabledFeatures:new Set(['quotations','online-sales','notifications']),canAccess:()=>true};

test('approved KISS hierarchy has only two levels, POS single click and Settings last',()=>{
 assert.deepEqual(erpNavigation.map(g=>g.id),['dashboard','pos','counter','sales','purchases','vendor','products','parties','expenses','finance','warranty','reports','settings']);
 assert.equal(erpNavigation.find(g=>g.id==='pos')?.children?.length??0,0);
 assert.ok(erpNavigation.every(g=>!g.children?.some(c=>'children' in c)));
 const ids=erpNavigation.flatMap(g=>[g.id,...(g.children??[]).map(c=>c.id)]);
 assert.equal(new Set(ids).size,ids.length);
 assert.equal(erpNavigation[erpNavigation.length-1].id,'settings');
});

test('contextual destinations retain existing real routes and only canonical path templates',()=>{
 assert.deepEqual(resolveNavLocation('/app/quotations',erpNavigation),{groupId:'sales',childId:'quotations'});
 assert.deepEqual(resolveNavLocation('/app/notifications',erpNavigation),{groupId:'settings',childId:'notifications'});
 assert.deepEqual(resolveNavLocation('/app/pos',erpNavigation),{groupId:'pos'});
 assert.deepEqual(resolveNavLocation('/app/counter',erpNavigation),{groupId:'counter'});
 assert.deepEqual(resolveNavLocation('/app/sales?tab=return',erpNavigation),{groupId:'sales',childId:'sales-return'});
 assert.deepEqual(resolveNavLocation('/app/parties?role=Supplier',erpNavigation),{groupId:'parties',childId:'suppliers'});
 assert.equal(resolveNavLocation('/app/sales-old',erpNavigation),null);
 assert.equal(resolveNavLocation('/app/not-a-route',erpNavigation),null);
 assert.deepEqual(resolveNavLocation('/app/settings/team',erpNavigation),{groupId:'settings',childId:'users'});
 assert.deepEqual(resolveNavLocation('/app/purchases/new',erpNavigation),{groupId:'purchases'});
});

test('feature readiness and owner settings access gate links but not authorization',()=>{
 const unavailable:NavigationContext={availablePaths:new Set(['/app/dashboard','/app/pos','/app/sales','/app/settings/business']),enabledFeatures:new Set(),canAccess:()=>true};
 const list=getVisibleNavigation(erpNavigation,unavailable);
 assert.equal(list.find(g=>g.id==='sales')?.children?.some(c=>c.id==='quotations'),false);
 assert.equal(list.find(g=>g.id==='settings')?.children?.some(c=>c.id==='notifications'),false);
 const cashier:NavigationContext={...allowAll,canAccess:p=>!['owner','team','notifications'].includes(p)};
 const settings=getVisibleNavigation(erpNavigation,cashier).find(g=>g.id==='settings');
 assert.equal(settings?.children?.some(c=>c.id==='subscription'),false);
 assert.equal(settings?.children?.some(c=>c.id==='users'),false);
 assert.equal(settings?.children?.some(c=>c.id==='notifications'),false);
 assert.equal(settings?.children?.some(c=>c.id==='general'),true);
});
