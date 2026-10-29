export type SearchResult = { id:string; kind:'Module'|'Product'|'Party'|'Invoice'|'Purchase'; label:string; helper:string; path:string; keywords?:string; identifiers?:readonly string[] };
export type GlobalSearchMode = 'Default'|'Advanced';

export {normalizeSearch} from './fuzzySearch.ts';
import {normalizeSearch,searchScore} from './fuzzySearch.ts';
function score(record:SearchResult,query:string,mode:GlobalSearchMode):number|null {
 return searchScore(query,[record.label,record.helper,record.keywords,...(record.identifiers??[])],{substring:mode==='Advanced',anyToken:mode==='Advanced'});
}
export function searchResults(records:readonly SearchResult[],query:string,mode:GlobalSearchMode='Default'):SearchResult[] {
 if(!normalizeSearch(query))return records.filter(record=>record.kind==='Module');
 const ranked=records.map((record,index)=>({record,index,rank:score(record,query,mode)}))
  .filter((item):item is {record:SearchResult;index:number;rank:number}=>item.rank!==null);
 return ranked.sort((a,b)=>b.rank-a.rank||
  (a.record.kind==='Module'?1:0)-(b.record.kind==='Module'?1:0)||a.index-b.index)
  .map(item=>item.record);
}
