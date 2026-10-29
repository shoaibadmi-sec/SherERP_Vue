import { availableProducts, availableParties, availablePurchases } from '../data/erpDemoStore';
import { salesInvoices } from '../data/sales';
import { erpNavigation, erpRoutePaths, erpFeatureIds } from '../navigation/erpNavigation';
import { getVisibleNavigation } from '../navigation/resolveErpNavigation';
import { canManage, type SettingsPermission, type TenantSettings, type PersonalSettings } from '../settings/model';
import type { SearchResult } from './globalSearch';

/** One permission-filtered index for instant lookup and legacy bookmarked search URLs.
 * Search data is a UI preview; replace fixture sources with tenant-scoped API search later.
 */
export function globalSearchRecords(state:TenantSettings, actorId:string, language:PersonalSettings['language']):SearchResult[] {
 const groups=getVisibleNavigation(erpNavigation,{
  availablePaths:erpRoutePaths,enabledFeatures:erpFeatureIds,
  canAccess:permission=>permission==='owner'
   ? Boolean(state.sections.team.employees.find(employee=>employee.id===actorId)?.active &&
      state.sections.team.employees.find(employee=>employee.id===actorId)?.roleIds.includes('owner'))
   : canManage(state,actorId,permission as SettingsPermission)
 });
 const modules=new Map<string,SearchResult>();
 for(const group of groups) {
  for(const child of [{id:group.id,label:group.label,bn:group.bn,path:group.landingPath},...(group.children??[])]) {
   const previous=modules.get(child.path);
   const keywords=[previous?.keywords,child.label,child.bn].filter(Boolean).join(' ');
   if(previous)modules.set(child.path,{...previous,keywords});
   else modules.set(child.path,{
    id:child.id,kind:'Module',label:language==='Bangla'?(child.bn??child.label):child.label,
    helper:language==='Bangla'?child.label:(language==='English'?'':child.bn??''),
    path:child.path,keywords
   });
  }
 }
 const paths=new Set([...modules.keys()].map(path=>path.split('?')[0]));
 const records:SearchResult[]=[...modules.values()];
 if(paths.has('/app/products'))records.push(...availableProducts().map(product=>({
  id:product.id,kind:'Product' as const,label:product.name,
  helper:[product.nameBn,product.sku].filter(Boolean).join(' · '),identifiers:[product.sku],
  path:'/app/products?q='+encodeURIComponent(product.sku),
  keywords:[product.brand,product.category].filter(Boolean).join(' ')
 })));
 if(paths.has('/app/parties'))records.push(...availableParties().filter(party=>party.roles.length).map(party=>({
  id:party.id,kind:'Party' as const,label:party.name,
  helper:[party.nameBn,party.phone,...party.roles].filter(Boolean).join(' · '),identifiers:[party.phone],
  path:'/app/parties?id='+encodeURIComponent(party.id)+'&role='+encodeURIComponent(party.roles[0]),
  keywords:party.area
 })));
 if(paths.has('/app/sales'))records.push(...salesInvoices.map(invoice=>({
  id:invoice.id,kind:'Invoice' as const,label:invoice.invoice,helper:invoice.party,
  path:'/app/sales?q='+encodeURIComponent(invoice.invoice),
  keywords:[invoice.phone,...invoice.lines.map(line=>line.name)].filter(Boolean).join(' ')
 })));
 if(paths.has('/app/purchases'))records.push(...availablePurchases().map(purchase=>({
  id:purchase.id,kind:'Purchase' as const,label:purchase.ref,helper:purchase.supplier,
  path:'/app/purchases?q='+encodeURIComponent(purchase.ref),keywords:purchase.items
 })));
 return records;
}
