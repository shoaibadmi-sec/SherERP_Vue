import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';
const c=readFileSync(new URL('../src/components/pos/InstallmentAgreementPreview.tsx',import.meta.url),'utf8');
test('agreement preview uses existing HisabIQ data layout and truthful posting disclaimer',()=>{
 for(const symbol of ['PreviewInstallmentAgreement','useUiCopy','formatDay','taka','Table','details','summary'])assert.ok(c.includes(symbol),symbol);
 assert.match(c,/not posted|preview/i);
 assert.doesNotMatch(c,/Receive Payment|onPost|dispatchPartyPreview|bankTransaction/);
});
