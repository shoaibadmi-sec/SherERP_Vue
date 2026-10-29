/** Common discovery matching only. Record selection and duplicate checks still use exact IDs. */
export function normalizeSearch(text:string):string {
 return text.normalize('NFC').toLocaleLowerCase().replace(/[০-৯]/g,digit=>String('০১২৩৪৫৬৭৮৯'.indexOf(digit))).trim();
}
const words=(text:string):string[]=>text.match(/[\p{L}\p{M}\p{N}]+/gu)??[];
type SearchField=string|number|null|undefined;
/** One insertion/deletion/substitution or adjacent swap, on longer words only.
 * Numbers/SKUs never acquire approximate digit matches. */
function closeSpelling(left:string,right:string):boolean {
 if(/[\p{N}]/u.test(left+right))return false;
 const a=Array.from(left),b=Array.from(right);
 if(a.length<4||b.length<4||Math.abs(a.length-b.length)>1)return false;
 let i=0,j=0,edits=0;
 while(i<a.length&&j<b.length){
  if(a[i]===b[j]){i++;j++;continue;}
  if(++edits>1)return false;
  if(a.length===b.length&&a[i]===b[j+1]&&a[i+1]===b[j]){i+=2;j+=2;}
  else if(a.length>b.length)i++;else if(b.length>a.length)j++;else{i++;j++;}
 }
 return edits+(a.length-i)+(b.length-j)<=1;
}
/** Every word must match by default; advanced discovery may match any text word.
 * Numeric tokens always remain mandatory, including in Advanced global search. */
export function searchScore(query:string,values:readonly SearchField[],options:{substring?:boolean;anyToken?:boolean}={}):number|null {
 const normalized=normalizeSearch(query);if(!normalized)return 0;
 const tokens=words(normalized);if(!tokens.length)return null;
 const fields=values.map(value=>normalizeSearch(String(value??'')));
 const indexed=fields.map(field=>({field,words:words(field)}));
 const strengths=tokens.map(token=>{
  let best=0;
  indexed.forEach(({field,words},index)=>{
   const primary=index===0;
   const strength=field===token?120:field.startsWith(token)?96:words.includes(token)?88:
    words.some(word=>word.startsWith(token))?78:options.substring!==false&&field.includes(token)?48:
    words.some(word=>closeSpelling(word,token))?24:0;
   best=Math.max(best,primary?strength:strength*0.7);
  });
  return best;
 });
 if(tokens.some((token,index)=>/\p{N}/u.test(token)&&!strengths[index]))return null;
 if(options.anyToken?strengths.every(value=>!value):strengths.some(value=>!value))return null;
 // Full equality in any field is a higher tier than every possible token-only score.
 const exactBonus=fields.includes(normalized)?(tokens.length+1)*120:0;
 return strengths.reduce((sum,value)=>sum+value,0)+exactBonus+(fields[0]?.startsWith(normalized)?30:0);
}
export function matchesSearch(query:string,fields:readonly SearchField[]):boolean {
 return searchScore(query,fields)!==null;
}
/** Stable ranking without changing records, eligibility filters or source IDs. */
export function rankSearch<T>(records:readonly T[],query:string,fields:(record:T)=>readonly SearchField[]):T[] {
 if(!normalizeSearch(query))return [...records];
 return records.map((record,index)=>({record,index,score:searchScore(query,fields(record))}))
  .filter((item):item is {record:T;index:number;score:number}=>item.score!==null)
  .sort((a,b)=>b.score-a.score||a.index-b.index).map(item=>item.record);
}
