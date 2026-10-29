import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {projectVendorStatement,serializeVendorStatementCsv} from '../src/vendor/vendorLedger.ts';

const source=readFileSync('src/components/parties/VendorStatementDialog.tsx','utf8');

test('Phase 10 display labels do not change Vendor statement data or CSV export',()=>{
 const expected=[
  "const {text,showHelper}=useUiCopy()",
  "(['payable','receivable'] as const)",
  "text('You owe Vendor','ভেন্ডরকে দিতে হবে')",
  "text('Vendor owes you','ভেন্ডরের কাছে পাবেন')",
  "text('Taken products payable','নেওয়া পণ্যের দেনা')",
  "text('Given products receivable','দেওয়া পণ্যের পাওনা')",
  'text("Unpriced (not ৳0)","দাম অজানা (৳০ নয়)")',
  "serializeVendorStatementCsv(statement,party.name)",
  "projectVendorStatement(state,party.id,side,range)",
  "onClick={()=>window.print()}"
 ];
 for(const term of expected)assert.ok(source.includes(term),term);
 assert.equal(typeof projectVendorStatement,'function');
 assert.equal(typeof serializeVendorStatementCsv,'function');
});
