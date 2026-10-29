import type {ErpNavGroup} from './erpNavigation.ts';

export type NavigationContext={
 availablePaths:ReadonlySet<string>;
 enabledFeatures:ReadonlySet<string>;
 canAccess:(permission:string)=>boolean;
};
export type NavLocation={groupId:string;childId?:string};
function locationParts(input:string){
 const url=new URL(input.startsWith('#')?input.slice(1):input,'https://erp.invalid');
 const pathname=url.pathname.length>1?url.pathname.replace(/\/+$/,''):url.pathname;
 return {pathname,search:url.searchParams};
}
function matchesDestination(candidate:string,actual:string){
 const a=locationParts(actual),b=locationParts(candidate);
 if(a.pathname!==b.pathname)return false;
 for(const [key,value] of b.search){if(a.search.get(key)!==value)return false;}
 return true;
}
function isPathAvailable(destination:string,paths:ReadonlySet<string>){
 return paths.has(locationParts(destination).pathname);
}
function allowed(feature:string|undefined,permission:string|undefined,ctx:NavigationContext){
 return (!feature||ctx.enabledFeatures.has(feature))&&(!permission||ctx.canAccess(permission));
}
export function getVisibleNavigation(groups:readonly ErpNavGroup[],context:NavigationContext):ErpNavGroup[]{
 return groups.flatMap(group=>{
  if(!allowed(undefined,group.permission,context))return [];
  const children=(group.children??[]).filter(c=>allowed(c.feature,c.permission,context)&&isPathAvailable(c.path,context.availablePaths));
  const hasLanding=isPathAvailable(group.landingPath,context.availablePaths);
  if(!hasLanding&&!children.length)return [];
  return [{...group,landingPath:hasLanding?group.landingPath:children[0].path,children:group.children?children:undefined}];
 });
}
/** Choose a query-specific child before the parent's landing page; never prefix-match sales-old. */
export function resolveNavLocation(path:string,groups:readonly ErpNavGroup[]):NavLocation|null{
 const current=locationParts(path);
 let best:{location:NavLocation;score:number}|null=null;
 for(const group of groups){
  for(const child of group.children??[]){
   if(matchesDestination(child.path,path)){
    const s=locationParts(child.path),score=100+(s.search.size*10)+s.pathname.length;
    if(!best||score>best.score)best={location:{groupId:group.id,childId:child.id},score};
   }
  }
  if(matchesDestination(group.landingPath,path)){
   const score=20+locationParts(group.landingPath).pathname.length;
   if(!best||score>best.score)best={location:{groupId:group.id},score};
  }
 }
 if(best)return best.location;
 // Only real nested screens inherit a parent: /app/purchases/new and /app/settings root.
 if(current.pathname==='/app/purchases/new')return {groupId:'purchases'};
 if(current.pathname==='/app/settings')return {groupId:'settings'};
 return null;
}
