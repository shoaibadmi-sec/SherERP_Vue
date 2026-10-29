import React from 'react';
import {Link} from 'react-router-dom';
import {Bell,Building2,Database,Palette,Users,CreditCard,ArrowUpRight,ShieldCheck} from 'lucide-react';
import {useTenantSettings} from './TenantSettingsProvider';
import {canManage,type SettingsPermission} from './model';
import {erpRoutePaths,erpFeatureIds} from '../navigation/erpNavigation';
import {getSettingsHubItems} from './settingsHub';

/** Shortcuts into canonical Settings and tenant portal routes; no duplicate SMS/billing state. */
export function TenantSettingsHub({onNavigate}:{onNavigate?:(path:string,event:React.MouseEvent<HTMLAnchorElement>)=>void}){
 const {state,actorId,personal}=useTenantSettings();
 const icons={general:Building2,users:Users,notifications:Bell,data:Database,subscription:CreditCard,appearance:Palette,security:ShieldCheck};
 const items=getSettingsHubItems({availablePaths:erpRoutePaths,enabledFeatures:erpFeatureIds,
  canAccess:p=>p==='owner'
   ?Boolean(state.sections.team.employees.find(e=>e.id===actorId)?.roleIds.includes('owner'))
   :canManage(state,actorId,p as SettingsPermission)});
 return <section role="region" aria-label="Settings shortcuts" className="rounded-xl border border-border bg-card p-3 shadow-card">
  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
   <div><h2 className="text-sm font-semibold text-ink">Settings hub</h2>
    <p className="font-bn mt-0.5 text-[11px] text-ink-500">প্রয়োজনীয় সেটিংস এক জায়গায় · Daily actions stay inside each module</p></div>
   <span className="text-[11px] text-ink-500">Simple, organized · no extra screens</span>
  </div>
  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
   {items.map(item=>{
    const Icon=icons[item.id as keyof typeof icons]??Building2;
    return <Link to={item.path} key={item.id} data-testid={'settings-hub-'+item.id}
     onClick={e=>onNavigate?.(item.path,e)}
     className="group flex min-w-0 items-start gap-2.5 rounded-lg border border-border bg-ink-50/30 p-2.5 text-left transition-colors hover:border-teal-400 hover:bg-teal-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-teal-500">
     <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-card text-teal-700"><Icon className="size-4"/></span>
     <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-1 text-[12.5px] font-semibold text-ink">
      {personal.language==='Bangla'?(item.bn??item.label):item.label}<ArrowUpRight className="size-3 shrink-0 text-ink-400 group-hover:text-teal-700"/></span>
      {personal.language!=='English'&&<span className="font-bn block text-[10.5px] text-ink-500">{personal.language==='Bangla'?item.label:item.bn}</span>}
      <span className="mt-1 block text-[11px] leading-snug text-ink-500">{item.description}</span>
     </span>
    </Link>;
   })}
  </div>
 </section>;
}
