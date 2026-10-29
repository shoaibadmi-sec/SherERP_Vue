import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {join} from 'node:path';

const displays = [
 'src/components/finance/CounterWorkspace.tsx',
 'src/components/pos/CheckoutPanel.tsx',
 'src/components/purchases/PurchasePaymentPanel.tsx',
 'src/components/brand/ReceiptPreview.tsx',
 'src/pages/Finance.tsx',
 'src/components/parties/PartyPaymentDialog.tsx',
 'src/components/parties/PartyFinanceDialog.tsx',
 'src/components/TransactionReviewDialog.tsx',
 'src/components/parties/PartyCreditRefundDialog.tsx',
 'src/components/purchases/BillDialog.tsx'
];

test('amounts in words reuse prominent display across POS, purchase, Counter, Finance, parties and receipt',()=>{
 for(const path of displays){
  const source=readFileSync(path,'utf8');
  assert.match(source,/AmountInWordsDisplay/,path+' must use shared display');
  assert.doesNotMatch(source,/<(?:p|div)[^>]*>[^<]*\{amountInWords\(/,path+' has a tiny inline amount in words');
 }
});
test('shared amount-in-words component has full-width readable wrapped Bangla in all variants',()=>{
 const source=readFileSync('src/components/AmountInWordsDisplay.tsx','utf8');
 assert.match(source,/min-w-0 max-w-full/);
 assert.match(source,/whitespace-normal break-words/);
 assert.match(source,/font-semibold/);
 assert.match(source,/lang="bn"/);
 assert.match(source,/variant = 'default'/);
 assert.ok(source.includes("variant?: 'default' | 'compact' | 'inverse' | 'receipt'"));
});
test('Fast Counter POS uses a smaller mint words variant without changing Counter, purchase or receipt',()=>{
 const pos=readFileSync('src/components/pos/CheckoutPanel.tsx','utf8');
 const words=readFileSync('src/components/AmountInWordsDisplay.tsx','utf8');
 assert.match(pos,/data-pos-payable/);
 assert.match(pos,/data-pos-payable[^>]*bg-teal-50/);
 assert.match(pos,/<AmountInWordsDisplay amount=\{totals\.total\} variant="compact" \/>/);
 assert.doesNotMatch(pos,/bg-inverse|variant="inverse"/);
 assert.match(words,/bg-teal-50\/70/,'default words panel keeps the approved mint tone');
 assert.match(words,/compact:[\s\S]*text-\[14px\]/,'POS compact words stay readable');
 assert.match(words,/compact:[\s\S]*bg-card\/75/,'compact surface uses the shared theme card color');
 assert.match(words,/compact:[\s\S]*text-teal-800/,'compact words label uses a readable semantic teal tone');
 assert.doesNotMatch(words,/dark:text-teal-200/,'dark teal-200 is too dark for label text in HisabIQ');
 assert.match(readFileSync('src/components/purchases/PurchasePaymentPanel.tsx','utf8'),/variant="inverse"/);
 assert.match(readFileSync('src/components/brand/ReceiptPreview.tsx','utf8'),/variant="receipt"/);
});

test('all displayed money words across src go through the shared readable renderer',()=>{
 const violations:string[]=[];
 const walk=(dir:string)=>{
  for(const child of readdirSync(dir,{withFileTypes:true})){
   const path=join(dir,child.name);
   if(child.isDirectory()){walk(path);continue;}
   if(!/\.(tsx|ts)$/.test(path)||path.endsWith('utils/amountInWords.ts')||
       path.endsWith('components/AmountInWordsDisplay.tsx'))continue;
   const source=readFileSync(path,'utf8');
   if(/\bamountInWords\s*\(/.test(source))violations.push(path);
  }
 };
 walk('src');
 assert.deepEqual(violations,[],'Use AmountInWordsDisplay instead of inline small text in: '+violations.join(', '));
});
