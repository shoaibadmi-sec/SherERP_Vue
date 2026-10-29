import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {quotationLabel,quotationOptionLabels} from '../src/i18n/quotationCopy.ts';
import {getQuoteSnapshot,quoteDisplayStatus,quoteTotal,quoteLineTotal} from '../src/quotations/quotePreviewStore.ts';

const file=(path:string)=>readFileSync(path,'utf8');
test('quotation labels change for display only; original statuses remain persisted',()=>{
 const statuses=['Draft','Sent','Accepted','Declined','Expired'];
 const opts=quotationOptionLabels('Bangla',statuses);
 assert.deepEqual(opts.map(o=>o.value),statuses);
 assert.deepEqual(opts.map(o=>o.label),['খসড়া','পাঠানো','গৃহীত','বাতিল','মেয়াদ শেষ']);
 assert.equal(quotationLabel('English','Total'),'Total');
 assert.equal(quotationLabel('English + Bangla','Customer'),'Customer');
 assert.equal(quotationLabel('Bangla','Customer'),'ক্রেতা');
 assert.equal(quotationLabel('Bangla','QT-000041'),'QT-000041');
});
test('quotation preview numbers and status remain unchanged under Bangla display labels',()=>{
 const {quotes}=getQuoteSnapshot();
 const quote=quotes.find(q=>q.number==='QT-000041');
 assert.ok(quote);
 const before=JSON.stringify(quotes);
 const amount=quoteTotal(quote);
 assert.equal(amount,quote.lines.reduce((sum,l)=>sum+quoteLineTotal(l),0)-quote.discount);
 assert.equal(quoteDisplayStatus(quote,'2026-10-14'),'Sent');
 assert.equal(quotationLabel('Bangla','Sent'),'পাঠানো');
 assert.equal(JSON.stringify(getQuoteSnapshot().quotes),before);
});
test('Phase 10 reuses original quotation domain and in-page print rather than new posting functions',()=>{
 const page=file('src/pages/Quotations.tsx');
 assert.match(page,/quoteSubtotal\(quote\)/);
 assert.match(page,/quoteTotal\(quote\)/);
 assert.match(page,/quoteLineTotal\(line\)/);
 assert.match(page,/quoteDisplayStatus\(q\)/);
 assert.match(page,/changeQuoteStatus\(q\.id,to\)/);
 assert.match(page,/id="quotation-print"/);
 assert.match(page,/window\.print\(\)/);
 assert.match(page,/quotationLabel\(language,label\)/);
 assert.match(page,/ql\("Quotation only\. No stock reservation or financial posting\."/);
 assert.match(page,/status===s/);
 assert.ok(!page.includes('postToLedger'));
});
