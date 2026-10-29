import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const src=(path:string)=>readFileSync(path,'utf8');

test('ERP HTML language follows existing personal preference and resets on unmount',()=>{
 const shell=src('src/components/layout/AppShell.tsx');
 assert.match(shell,/const \{ text, language \} = useUiCopy\(\)/);
 assert.match(shell,/document\.documentElement\.lang = language === "Bangla" \? "bn" : "en"/);
 assert.match(shell,/return \(\) => \{ document\.documentElement\.lang = "en"; \}/);
 assert.match(shell,/\}, \[language\]\)/);
 assert.match(shell,/data-density=\{personal\.density\}/);
 assert.ok(shell.includes('<Sidebar />'));
 assert.ok(shell.includes('<TopBar />'));
 assert.ok(shell.includes('<PageBoundary><Outlet /></PageBoundary>'));
});

test('Phase 28 runs all language modes, orientations and themes, collects actionable axe evidence',()=>{
 const s=src('scripts/phase28-multilingual-responsive-audit.cjs');
 for(const text of [
  "'English','English + Bangla','Bangla'",
  'width:390,height:844','width:768,height:1024',
  'width:1024,height:768','width:1440,height:900',
  "'light','dark'","'app/pos'","'app/purchases/new'",
  "'app/vendors'","'app/parties?id=c1&role=Customer'",
  'document.documentElement.lang','document.documentElement.scrollWidth',
  'page.keyboard.press(\'Enter\')','axe.run(document',
  'fs.writeFileSync(process.env.PHASE28_AUDIT_OUTPUT',
  "const blockers=problems.filter(p=>p.kind!=='axe-findings')"
 ])assert.ok(s.includes(text),text);
 // Read-only audit: no changes to the ERP's source or accounting state.
 assert.ok(!s.includes('setInputFiles'));
 assert.ok(!s.includes('.getByRole(\'button\',{name:\'Complete sale\'}).click()'));
});
