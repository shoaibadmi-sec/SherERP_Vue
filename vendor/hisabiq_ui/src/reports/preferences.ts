import { defaultReportFilters } from './model.ts';
import { reportDefinition } from './catalog.ts';
import {reportKeyForScreen} from './screens.ts';
import type { ReportFilters, ReportKey, ReportScreen } from './types';

export type SavedReportView={id:string;name:string;report:ReportKey;screen?:ReportScreen;filters:ReportFilters;columns:string[]};
export type ReportPreferences={favorites:ReportKey[];views:SavedReportView[]};
export const emptyPreferences:ReportPreferences={favorites:['reorder','receivables','product-profit'],views:[]};
export function parsePreferences(raw:string|null):ReportPreferences {
 try{
  const v=JSON.parse(raw??'null');
  if(!v||typeof v!=='object')return {...emptyPreferences};
  const favorites=Array.isArray(v.favorites)?v.favorites.filter((k:unknown)=>typeof k==='string'&&reportDefinition(k).id===k):emptyPreferences.favorites;
  const views=Array.isArray(v.views)?v.views.filter((s:unknown):s is SavedReportView=>{
   if(!s||typeof s!=='object')return false;
   const r=s as Record<string,unknown>;
   return typeof r.id==='string'&&typeof r.name==='string'&&r.name.length<=80&&typeof r.report==='string'&&reportDefinition(r.report).id===r.report&&Array.isArray(r.columns)&&r.columns.every(c=>typeof c==='string')&&!!r.filters&&typeof r.filters==='object';
  }).slice(0,20).map((s:SavedReportView)=>{const screen=reportScreenFromParams(new URLSearchParams({screen:s.screen??'',report:s.report})),report=reportKeyForScreen(screen,s.report);return {...s,screen,report,columns:reportDefinition(report).columns.filter(k=>report!==s.report||k==='label'||s.columns.includes(k)),filters:filtersFromParams(new URLSearchParams(s.filters as unknown as Record<string,string>))};}): [];
  return {favorites,views};
 }catch{return {...emptyPreferences};}
}
export function filtersFromParams(params:URLSearchParams):ReportFilters {
 const values={...defaultReportFilters};
 for(const key of Object.keys(values) as (keyof ReportFilters)[]){
  const v=params.get(key);
  if(v!==null)(values as Record<string,string>)[key]=v.slice(0,200);
 }
 if(!['none','previous'].includes(values.compare))values.compare='none';
 if(!['asc','desc'].includes(values.direction))values.direction='desc';
 return values;
}
export function paramsForReport(report:ReportKey,filters:ReportFilters,columns:string[]) {
 const p=new URLSearchParams({report,from:filters.from,to:filters.to});
 for(const [key,v]of Object.entries(filters))if(v!==defaultReportFilters[key as keyof ReportFilters])p.set(key,v);
 if(columns.length)p.set('columns',columns.join(','));
 return p;
}

const reportScreens:ReportScreen[]=['overview','sales','sales-lab','stock','dues','money','advisor','profit','buying','cashflow','customers','library'];
export function reportScreenFromParams(params:URLSearchParams):ReportScreen {
 const screen=params.get('screen') as ReportScreen;
 if(reportScreens.includes(screen))return screen;
 const report=params.get('report');
 return report&&reportDefinition(report).id===report&&report!=='overview'?'library':'overview';
}
export function paramsForReportScreen(screen:ReportScreen,report:ReportKey,filters:ReportFilters,columns:string[]) {
 const params=paramsForReport(reportKeyForScreen(screen,report),filters,columns);
 params.set('screen',screen);
 return params;
}

