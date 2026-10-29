import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join,relative} from 'node:path';

/** Guard future ERP search controls from silently bypassing the × clear convention.
 * The two keyboard-heavy pickers retain intentional, explicitly implemented buttons.
 */
function files(dir:string):string[]{
 return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const path=join(dir,entry.name);
  return entry.isDirectory()?files(path):entry.isFile()&&path.endsWith('.tsx')?[path]:[];
 });
}
test('all native search-like ERP fields use the shared clear input or an intentional keyboard-safe clear action',()=>{
 const allowed=new Set([
  'src/components/layout/GlobalSearchBox.tsx',
  'src/components/pos/ProductCombobox.tsx'
 ]);
 const unresolved:string[]=[];
 let nativeCount=0;
 for(const path of files('src')){
  const name=relative('.',path).replaceAll('\\','/');
  const code=readFileSync(path,'utf8');
  const nativeTags=[...code.matchAll(/<input\b[\s\S]*?\/>/g)];
  for(const match of nativeTags){
   const tag=match[0];
   if(!/(?:placeholder|aria-label)\s*=\s*["'][^"']*\b(search|find|filter|lookup|add product)\b/i.test(tag)&&
      !/(?:placeholder|aria-label)\s*=\s*\{[\s\S]*?\btext\(["']Add product["']/i.test(tag)&&
      !/type=["']search["']/.test(tag))continue;
   nativeCount++;
   if(!allowed.has(name))unresolved.push(name+': '+tag.slice(0,100));
   else if(!/aria-label=["']Clear (?:global search|product search)["']/.test(code)&&
           !/aria-label=\{text\(["']Clear product search["']/.test(code)&&
           !/aria-label=\{text\(["']Clear global search["']/.test(code))
    unresolved.push(name+': missing explicit accessible clear button');
  }
 }
 assert.ok(nativeCount>=2,'audit should find native header/POS search controls');
 assert.deepEqual(unresolved,[],'unreviewed raw searchable inputs must use shared Input');
});
test('shared Input keeps clear button and numeric input modes separate',()=>{
 const code=readFileSync('src/components/Input.tsx','utf8');
 assert.match(code,/props\.type==='number'/);
 assert.match(code,/numeric\)return <NumericInput/);
 assert.match(code,/aria-label=\{'Clear '/);
 assert.match(code,/searchLike/);
});
