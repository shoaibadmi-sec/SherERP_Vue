import {erpNavigation, type ErpNavChild} from '../navigation/erpNavigation.ts';
import {getVisibleNavigation,type NavigationContext} from '../navigation/resolveErpNavigation.ts';

const summaries:Record<string,string>={
 general:'Business profile, defaults and everyday ERP preferences.',
 users:'Employees, access and role settings for this business.',
 notifications:'ERP-wide SMS event rules and templates. Preview only — no SMS sent.',
 data:'Import/export management; contextual Product and Party tools remain available.',
 subscription:'Tenant plan, invoices, billing and SMS-credit balance.',
 appearance:'Your language, light/dark theme and personal display preferences.',
 security:'Account sign-in, password recovery, PIN, trusted devices and screen lock.'
};
export type SettingsHubItem=ErpNavChild&{description:string};
export function getSettingsHubItems(context:NavigationContext):SettingsHubItem[]{
 const parent=getVisibleNavigation(erpNavigation,context).find(g=>g.id==='settings');
 return (parent?.children??[]).map(c=>({...c,description:summaries[c.id]}));
}
