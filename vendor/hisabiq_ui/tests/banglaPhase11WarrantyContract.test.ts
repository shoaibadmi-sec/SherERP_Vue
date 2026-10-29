import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {warrantyLabel,warrantyOptions} from '../src/i18n/warrantyCopy.ts';

const page=()=>readFileSync('src/pages/Warranty.tsx','utf8');

test('warranty translation is display-only and retains every source status identifier',()=>{
 const statuses=['Received','Checking','Sent to supplier','Waiting supplier','Received from supplier','Ready for customer','Resolved','Rejected'];
 const options=warrantyOptions('Bangla',statuses);
 assert.deepEqual(options.map(x=>x.value),statuses);
 assert.deepEqual(options.map(x=>x.label),['গ্রহণ করা হয়েছে','যাচাই চলছে','সরবরাহকারীর কাছে পাঠানো','সরবরাহকারীর অপেক্ষায়','সরবরাহকারীর কাছ থেকে এসেছে','ক্রেতাকে দেওয়ার জন্য প্রস্তুত','সম্পন্ন','বাতিল']);
 assert.deepEqual(warrantyOptions('Bangla',['All routes','In-house','Supplier','Manufacturer']).map(x=>x.value),['All routes','In-house','Supplier','Manufacturer']);
 assert.equal(warrantyLabel('Bangla','Warranty'),'ওয়ারেন্টি');
 assert.equal(warrantyLabel('English','Warranty'),'Warranty');
 assert.equal(warrantyLabel('English + Bangla','Warranty'),'Warranty');
 assert.equal(warrantyLabel('Bangla','WRN-000021'),'WRN-000021');
 assert.equal(warrantyLabel('Bangla','SN-098732'),'SN-098732');
});
test('source-linked intake, case transitions and CSV remain unchanged',()=>{
 const source=page();
 assert.match(source,/const openStatuses: WarrantyStatus\[\]/);
 assert.match(source,/const statusTone: Record<WarrantyStatus, StatusTone>/);
 assert.match(source,/case 'Received':/);
 assert.match(source,/case 'Checking':/);
 assert.match(source,/case 'Waiting supplier':/);
 assert.match(source,/updateCase\(item\.id, patch, action\.label\)/);
 assert.match(source,/updateCase\(item\.id, \{ status: 'Rejected', resolution: 'Rejected' \}, 'Warranty rejected'\)/);
 assert.match(source,/if \(item\.replacement && !item\.replacement\.returnedAt\)/);
 assert.match(source,/downloadReport\('hisabiq-warranty\.csv',\['Case','Received','Customer'/);
 assert.match(source,/filtered\.map\(item => \[item\.id,item\.receivedAt,item\.customer/);
 assert.match(source,/setRoute\(event\.target\.value as WarrantyRoute\)/);
 assert.match(source,/setResolution\(event\.target\.value as 'Repair' \| 'Replace' \| 'Rejected'\)/);
 assert.match(source,/printReport\(warrantyDocument\(item, language\)\)/);
 assert.match(source,/headers: \[wl\('Field'\), wl\('Value'\)\]/);
 assert.match(source,/language,/);
});
