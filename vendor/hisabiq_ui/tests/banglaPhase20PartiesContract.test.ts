import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {uiText} from '../src/i18n/uiCopy.ts';

test('Party feedback uses current three language modes with preview limitation',()=>{
 for(const [en,bn] of [
   ['Add party','নতুন পার্টি যোগ করুন'],['Import Excel / CSV','এক্সেল / CSV থেকে আনুন'],
   ['Payment recorded in preview (no bank posting)','প্রিভিউতে টাকা জমা রাখা হয়েছে। ব্যাংকে এন্ট্রি হয়নি।'],
   ['Opening balance updated in preview; previous amount retained in audit','প্রিভিউতে শুরুর জের বদলেছে। আগের টাকার হিসাব ইতিহাসে আছে।']
 ]) {
   assert.equal(uiText('English',en,bn),en);
   assert.equal(uiText('English + Bangla',en,bn),en);
   assert.equal(uiText('Bangla',en,bn),bn);
 }
});

test('Party presentation changes do not change relationship isolation, ledger dates, payments or financial source logic',()=>{
 const s=readFileSync('src/pages/Parties.tsx','utf8');
 for(const source of [
  "const partyEntries:LedgerEntry[]",
  "const normalizedRows:PartyLedgerRow[]",
  "projectPartyStatement(normalizedRows,party.id,relationship,range)",
  "computePartyBalanceSummary(state,party.id,relationship)",
  "row.sourceId?.startsWith('party-payment:')",
  "row.sourceId?.startsWith('party-refund:')",
  "row.sourceId?.startsWith('party-finance:')",
  "dispatchPartyPreview({type:'record-payment',payload})",
  "dispatchPartyPreview({type:'refund-credit',payload})",
  "dispatchPartyPreview({type:'record-finance',payload})",
  "dispatchPartyPreview({type:'set-opening',payload})",
  "dispatchPartyPreview({type:'edit-source-payment',sourceId,payload,reason})",
  "dispatchPartyPreview({type:'reverse-source',sourceId,reason})",
  "partySourceRoute(row)",
  "vendorWorkLink(party.id,tab,sourceId)",
  "setRole(value)","resetLedger()"
 ])assert.ok(s.includes(source),'financial/role invariant missing: '+source);
 assert.ok(s.includes("toast.success(uiText('Payment recorded in preview (no bank posting)'"));
 assert.ok(s.includes("toast.success(uiText('Preview transaction reversed with an audit record'"));
 assert.ok(!s.includes("dispatchPartyPreview({type:text("),'never translate store actions');
 assert.ok(!s.includes("relationship:text("),'never translate relationship identity');
});
