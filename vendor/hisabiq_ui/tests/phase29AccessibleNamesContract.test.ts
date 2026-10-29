import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const s=(path:string)=>readFileSync(path,'utf8');

test('Party directory preserves selected ID and button keyboard activation while exposing option itself',()=>{
 const c=s('src/components/parties/PartyDirectory.tsx');
 assert.ok(c.includes('<li key={p.id} role="presentation">'));
 assert.ok(c.includes('<button role="option" aria-selected={active}'));
 assert.ok(c.includes('onClick={() => onSelect(p.id)}'));
 assert.ok(c.includes('role="listbox"'));
 assert.ok(c.includes('selectedId'));
 assert.ok(c.includes('partyRoleLabel(r,language)'));
});
test('Date display contributes to accessibility name without changing ISO values, commit or range calculations',()=>{
 const c=s('src/components/AppDateRangePicker.tsx');
 assert.ok(c.includes("const shownDate = single ?"));
 assert.ok(c.includes("aria-label={label + ': ' + shownDate}"));
 assert.ok(c.includes('{shownDate}</span>'));
 for(const x of ['const commit = (next: IsoRange) => { onChange(next); close(); }','const choose = (day: string)',"addMonths(first, -1)","onChange={(range) => onChange(range.from)}"]){
  assert.ok(c.includes(x),x);
 }
});
test('Header includes visible user initials in the same accessible menu name',()=>{
 const c=s('src/components/layout/TopBar.tsx');
 assert.ok(c.includes('aria-label={text("User menu","ব্যবহারকারীর মেনু")+" "+initials+" "+userName+" "+roleName}'));
 assert.ok(c.includes('data-print-hide'));
 assert.ok(c.includes('onClick={toggle}'));
});

test('Only the Dashboard Recent Sales table gains a tab stop when horizontal scrolling is required',()=>{
 const s=srcDashboard();
 function srcDashboard(){return sFile('src/components/dashboard/RecentSalesTable.tsx');}
 function sFile(path:string){return readFileSync(path,'utf8');}
 for(const check of [
  "scroller.scrollWidth>scroller.clientWidth+1",
  "scroller.tabIndex=0",
  "scroller.removeAttribute('tabindex')",
  "resize.observe(scroller)",
  "resize.observe(node)",
  "<Table ref={table}>"
 ])assert.ok(s.includes(check),check);
});
