import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {uiText} from '../src/i18n/uiCopy.ts';

const source=(path:string)=>readFileSync(path,'utf8');

test('Party Editor and Detail display copy respects English, bilingual and Bangla without altering stored data',()=>{
 const cases=[
  ['Party name','পার্টির নাম'],
  ['Relationships','সম্পর্কের ধরন'],
  ['Opening amount','শুরুর জের'],
  ['Receive payment','টাকা নিন'],
  ['Make payment','টাকা দিন'],
  ['Note deleted','নোট মুছে গেছে'],
  ['Read-only source reference in the UI preview.','এটি প্রিভিউতে লেনদেনের মূল সূত্র। এখানে বদলানো যাবে না।']
 ] as const;
 for(const [english,bangla] of cases){
  assert.equal(uiText('English',english,bangla),english);
  assert.equal(uiText('English + Bangla',english,bangla),english);
  assert.equal(uiText('Bangla',english,bangla),bangla);
 }
});

test('Role label translation is presentation only; source enum and balance direction remain unchanged',()=>{
 const copy=source('src/i18n/partyCopy.ts');
 for(const role of ['Customer','Supplier','Vendor','Lender','Borrower','Payee','Owner']){
  assert.match(copy,new RegExp(role+':'));
 }
 assert.match(copy,/uiText\(language,role,partyRoleBn\[role\]\)/);
 assert.match(copy,/language==='English \+ Bangla'\?label/);
 const editor=source('src/components/parties/PartyEditorDialog.tsx');
 for(const invariant of [
  'roles:checked', 'draft.roles.filter(item=>item!==role)',
  "partyRoles.filter(item=>item===role || draft.roles.includes(item))",
  'relationship:role,amount,side:entry.side,date:entry.date',
  'onSave(draft,changes)',
  "original.credit?'credit':'debit'"
 ]) assert.ok(editor.includes(invariant),invariant);
});

test('Opening and Party Detail retain preview-only posting and source-linked correction boundaries',()=>{
 const opening=source('src/components/parties/PartyOpeningDialog.tsx');
 const detail=source('src/components/parties/PartyDetail.tsx');
 for(const marker of [
  'onSubmit({partyId:party.id,relationship,amount:Number(amount),side,date,note:note.trim()})',
  "const names=openingDirectionLabels(relationship)",
  'partyOpeningDirectionLabel(names[value],language)'
 ]) assert.ok(opening.includes(marker),marker);
 for(const marker of [
  'onRecordPayment', 'onEditSourcePayment', 'onReverseSource',
  "source={sources.find(item=>item.id===editorRow?.sourceId)??null}",
  'onLedgerAction(action,row)', 'onAddNote(note.trim())','onDeleteNote(deleteNote.id)'
 ]) assert.ok(detail.includes(marker),marker);
 assert.match(detail,/SMS service is not connected to the UI preview/);
 assert.ok(detail.includes("relationship==='Customer'&&"),'New invoice is shown only for Customer relationships');
 assert.ok(detail.includes("disabled={party.status==='Inactive'}"),'Inactive customers cannot start a sale');
 assert.ok(detail.includes('onClick={onNewInvoice}'));
 assert.ok(detail.includes("text('New invoice','নতুন বিল')"));
});

test('Party edit stays inside More actions and Add party uses primary styling on all devices',()=>{
 const page=source('src/pages/Parties.tsx');
 const desktop=source('src/components/parties/PartyDetail.tsx');
 const responsive=source('src/components/parties/PartyDetailResponsive.tsx');
 assert.match(page, /<Button size="sm" className="shrink-0 whitespace-nowrap" onClick=\{\(\)=>setEditing\(null\)\}/,
  'Desktop Add party uses default primary button styling');
 assert.match(page, /<Button size="sm" onClick=\{\(\)=>setEditing\(null\)\}/,
  'Small-screen Add party remains a primary button');
 assert.equal((desktop.match(/onEditParty\(\);/g)??[]).length,2,
  'Vendor and other desktop profiles each expose Edit Party in More');
 assert.doesNotMatch(desktop,/onClick=\{onEditParty\}/,
  'No desktop standalone Edit Party button');
 assert.match(responsive, /id: 'edit'[\s\S]*?run: onEditParty/,
  'Responsive More action runs the existing edit handler');
 assert.doesNotMatch(responsive,/onClick=\{onEditParty\}/,
  'No standalone Edit Party button at tablet or mobile widths');
 assert.match(responsive, /party\.phone \? '' : 'col-span-2'/,
  'Party switching fills the vacant phone slot instead of restoring Edit Party');
});
