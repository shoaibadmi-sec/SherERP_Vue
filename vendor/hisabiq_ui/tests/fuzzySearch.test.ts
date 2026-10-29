import test from 'node:test';
import assert from 'node:assert/strict';
import {matchesSearch,rankSearch,normalizeSearch} from '../src/utils/fuzzySearch.ts';
test('typos, adjacent swaps and token order work across searchable fields',()=>{
 assert.ok(matchesSearch('Rahamn hardwre',['Rahman Hardware','Dhaka']));
 assert.ok(matchesSearch('cment frsh',['Fresh Cement','Building']));
 assert.ok(matchesSearch('pipe pvc',['PVC Pipe 1 inch']));
 assert.ok(matchesSearch('সিমেনট',['সিমেন্ট']));
 assert.equal(matchesSearch('cement absent',['Fresh Cement']),false);
 assert.equal(matchesSearch('zzz',['PVC Pipe']),false);
 assert.ok(matchesSearch('  ',['anything']));
});
test('numeric codes and mixed identifiers tolerate no digit edits',()=>{
 assert.equal(normalizeSearch(' INV-০০০২৪১ '),'inv-000241');
 assert.ok(matchesSearch('INV-০০০২৪১',['INV-000241']));
 for(const query of ['INV-000242','01711000002','ELC-1202'])assert.equal(matchesSearch(query,['INV-000241','01711000001','ELC-1201']),false,query);
 assert.ok(matchesSearch('1201',['ELC-1201']));
});
test('ranking favors exact names and keeps original record identities and tie order',()=>{
 const typo={id:'typo',name:'Cemant'},exact={id:'exact',name:'Cement'},other={id:'prefix',name:'Cement bag'};
 const records=[typo,other,exact],before=JSON.stringify(records);
 const result=rankSearch(records,'cement',r=>[r.name,r.id]);
 assert.strictEqual(result[0],exact);assert.strictEqual(result[2],typo);
 assert.equal(JSON.stringify(records),before);
 assert.deepEqual(rankSearch(records,'',r=>[r.name]),records);
});
test('an exact SKU or reference outranks a name prefix, including longer queries',()=>{
 const records=[{id:'prefix',name:'ELC 1201 cable',sku:'OTHER-1'},{id:'correct',name:'LED Bulb',sku:'ELC-1201'}];
 assert.equal(rankSearch(records,'ELC-1201',r=>[r.name,r.sku])[0]?.id,'correct');
 const phrase='one two three four five six seven eight nine ten';
 assert.equal(rankSearch([{id:'prefix',name:phrase+' extra',sku:''},{id:'exact',name:'Other item',sku:phrase}],phrase,r=>[r.name,r.sku])[0]?.id,'exact');
});
