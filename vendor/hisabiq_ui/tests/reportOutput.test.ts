import test from 'node:test';import assert from 'node:assert/strict';
import {reportHtml,reportCsv} from '../src/utils/reportOutput.ts';
test('isolated print document includes exact selected rows, money direction and escaped names',()=>{
 const html=reportHtml({title:'Day Book',subtitle:'2026-10-11',headers:['Party','Money in','Money out'],rows:[['<script>"Shop"</script>',125,0]]});
 assert.ok(html.includes('&lt;script&gt;&quot;Shop&quot;&lt;/script&gt;'));assert.ok(html.includes('<td>125</td><td>0</td>'));assert.ok(!html.includes('visibility: hidden'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('2026-10-11'));
});
test('CSV preserves Bangla, quoted commas and amounts; prevents formula execution',()=>{
 const csv=reportCsv(['Party','Amount'],[['=HYPERLINK("x")',-50],['দোকান, ঢাকা',100]]);
 assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('"\'=HYPERLINK(""x"")"'));assert.ok(csv.includes('"-50"'));assert.ok(csv.includes('"দোকান, ঢাকা","100"'));
});
