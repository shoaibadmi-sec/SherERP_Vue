import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {uiText} from '../src/i18n/uiCopy.ts';

const source=(path:string)=>readFileSync(path,'utf8');
test('Party relationship labels use the established display-only seven-role mapping',()=>{
 const copy=source('src/i18n/partyCopy.ts');
 const importCopy=source('src/i18n/partyImportCopy.ts');
 for(const [role,bn] of [
  ['Customer','ক্রেতা'],['Supplier','সরবরাহকারী'],['Vendor','ভেন্ডর'],
  ['Lender','ঋণদাতা'],['Borrower','ঋণগ্রহীতা'],['Payee','খরচের প্রাপক'],['Owner','মালিক']
 ]){
  assert.ok(copy.includes(role+":'"+bn+"'"),role);
 }
 assert.match(copy,/uiText\(language,role,partyRoleBn\[role\]\)/);
 assert.match(importCopy,/roles\.map\(role=>partyRoleLabel\(role,language\)\)\.join/);
});
test('Import errors display native Bangla only in Bangla mode; CSV source validation is unchanged',()=>{
 const copy=source('src/i18n/partyImportCopy.ts');
 for(const message of ['Party name is required.','Unknown party role.','Import accepts at most 5,000 data rows.']){
  assert.ok(copy.includes(message),message);
 }
 assert.match(copy,/if\(language!==['"]Bangla['"]\)return message/);
 assert.match(copy,/\.replaceAll\(english,bangla\)/);
 for(const file of ['src/utils/partyImport.ts','src/utils/partyIdentity.ts','src/import/partyImport.ts','src/data/partyPreviewStore.ts']){
  assert.ok(source(file).length>0);
 }
 const legacy=source('src/components/parties/PartyImportDialog.tsx');
 assert.match(legacy,/parsePartyCsv\(await file\.text\(\)\)/);
 assert.match(legacy,/onImport\(result\.valid\)/);
 assert.match(legacy,/partyImportedRoleLabels\(p\.roles,language\)/);
 assert.match(legacy,/partyImportErrorText\(language,r\.reason\)/);
});
test('Directory filters preserve keys; labels and badges follow three language modes',()=>{
 const directory=source('src/components/parties/PartyDirectory.tsx');
 const badge=source('src/components/parties/RoleBadge.tsx');
 assert.ok(directory.includes("(['All', ...partyRoles]"));
 assert.match(directory,/onRole\(r\)/);
 assert.match(directory,/partyRoleLabel\(r,language\)/);
 assert.match(directory,/onSelect\(p\.id\)/);
 assert.match(directory,/onQuery\(e\.target\.value\)/);
 assert.match(badge,/roleTone\[role\]/);
 assert.match(badge,/partyRoleLabel\(role,language\)/);
 for(const [en,bn] of [['Search parties','পার্টি খুঁজুন'],['No parties found.','কোনো পার্টি পাওয়া যায়নি।']]){
  assert.equal(uiText('English',en,bn),en);
  assert.equal(uiText('Bangla',en,bn),bn);
 }
});
test('Party Excel chooser retains source relationship and bank safety constraints',()=>{
 const s=source('src/components/parties/PartyExcelImportDialog.tsx');
 for(const key of ["selectedRole==='Customer'?'customer'","selectedRole==='Supplier'?'supplier'","value:'customer'","value:'supplier'","planPartyImport(","resolvePartyImportDecisions(","commitPartyImportBatch(plan)","getPartyPreviewSnapshot()"]){
  assert.ok(s.includes(key),key);
 }
 assert.match(s,/text\('Imported opening balances never move Cash, Bank or Mobile Banking accounts\.'/);
 assert.match(s,/onLegacyImport/);
});
