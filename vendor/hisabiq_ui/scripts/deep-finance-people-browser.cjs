/* Nested Finance preview regressions. Use real taps/clicks; retain failure traces. */
const {chromium}=require('playwright');
const {expect}=require('playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const sizes=process.env.DEEP_AUDIT_SMOKE?[[390,844]]:[[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
const languages=process.env.DEEP_AUDIT_SMOKE?['English + Bangla']:['English','English + Bangla','Bangla'];
const output=process.env.DEEP_AUDIT_OUTPUT||'.superpowers/deep-audit/finance-people';
const results=[];
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4491,strictPort:true}});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});fs.mkdirSync(output,{recursive:true});
 try{for(const [width,height] of sizes)for(const theme of ['light','dark'])for(const language of languages){
  const id=[width,theme,language.replaceAll(' ','')].join('-');
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<=1024,reducedMotion:'reduce',colorScheme:theme});
  await context.addInitScript(({theme,language})=>{localStorage.setItem('hisabiq-theme',theme);localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));},{theme,language});
  await context.tracing.start({screenshots:true,snapshots:true,sources:true});const page=await context.newPage();page.setDefaultTimeout(15000);page.setDefaultNavigationTimeout(60000);
  await page.route('https://fonts.googleapis.com/**',r=>r.abort());const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const w=(en,bn)=>language==='Bangla'?bn:en;
  const act=e=>width<=1024?e.tap():e.click();
  const button=(r,en,bn)=>r.getByRole('button',{name:w(en,bn),exact:true});
  const field=(r,en,bn)=>r.locator('label').filter({hasText:new RegExp('^'+w(en,bn))}).getByRole('textbox');
  const select=(r,en,bn)=>en==='Finance person'?r.getByRole('combobox',{name:w(en,bn),exact:true}):r.locator('label').filter({hasText:new RegExp('^'+w(en,bn))}).getByRole('combobox');
  const sourceAmount=r=>r.getByText(w('Payment sources','টাকার মাধ্যম'),{exact:true}).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]').getByRole('textbox').first();
  const choose=async(trigger,name)=>{await act(trigger);await expect(page.getByRole('listbox')).toBeVisible();await act(page.getByRole('option',{name,exact:true}));};
  const manager=()=>page.getByRole('dialog',{name:w('Finance people','হিসাবের ব্যক্তি'),exact:true});
  const tx=()=>page.getByRole('dialog',{name:new RegExp(w('New finance transaction','নতুন টাকার লেনদেন'))});
  const go=async()=>{await page.goto('http://127.0.0.1:4491/?case='+results.length+'#/app/finance',{waitUntil:'domcontentloaded'});await expect(button(page,'New transaction','নতুন লেনদেন')).toBeVisible();};
  const check=async(name,run)=>{try{await go();await run();assert.deepEqual(errors,[]);results.push({id,name,status:'passed'});}catch(e){results.push({id,name,status:'failed',error:e.message});console.error(id,name,e.message);await page.screenshot({path:path.join(output,id+'-'+name+'.png'),fullPage:true});}};
  await check('duplicate-identity',async()=>{
   await act(button(page,'Finance people','হিসাবের ব্যক্তি').first());const d=manager();
   await d.getByPlaceholder(w('Name','নাম'),{exact:true}).fill('Hafizur Rahman');await d.getByPlaceholder(w('Phone','ফোন নম্বর'),{exact:true}).fill('01999 112233');
   await act(button(d,'Add person','ব্যক্তি যোগ করুন'));await act(button(d,'Done','সম্পন্ন'));await expect(d).toBeHidden();
   await act(button(page,'New transaction','নতুন লেনদেন'));const t=tx();
   await choose(select(t,'Finance person','হিসাবের ব্যক্তি'),'Hafizur Rahman · 01999 112233');await sourceAmount(t).fill('123');
   await act(button(t,'Review transaction','লেনদেন যাচাই করুন'));await act(button(t,'Confirm finance transaction','লেনদেন নিশ্চিত করুন'));await expect(t).toBeHidden();
   await act(button(page,'Finance people','হিসাবের ব্যক্তি').first());const row=d.getByText('01999 112233',{exact:true}).locator('xpath=../..');
   await act(button(row,'Edit','সংশোধন'));await d.getByPlaceholder(w('Name','নাম'),{exact:true}).fill('Second lender renamed');await act(button(d,'Save person','তথ্য সংরক্ষণ'));await act(button(d,'Done','সম্পন্ন'));
   await act(page.getByRole('tab',{name:w('Loans & Owners','ঋণ ও মালিক'),exact:true}));await expect(page.locator('tbody tr').filter({hasText:'FIN-000189'})).toContainText('Second lender renamed');await expect(page.locator('tbody tr').filter({hasText:'FIN-000187'})).toContainText('Hafizur Rahman');
  });
  await check('inactive-and-role',async()=>{
   await act(button(page,'New transaction','নতুন লেনদেন'));const t=tx();await sourceAmount(t).fill('123');await field(t,'Reference no.','নম্বর').fill('INACTIVE-DRAFT');await act(button(t,'Manage people','ব্যক্তি যোগ / সংশোধন'));const d=manager();const row=d.getByText('Hafizur Rahman',{exact:true}).locator('xpath=../..');
   await act(button(row,'Deactivate','নিষ্ক্রিয় করুন'));await expect(button(row,'Activate','সক্রিয় করুন')).toBeVisible();await act(button(d,'Done','সম্পন্ন'));await expect(d).toBeHidden();await expect(field(t,'Amount','টাকা')).toHaveValue('123');await expect(field(t,'Reference no.','নম্বর')).toHaveValue('INACTIVE-DRAFT');await expect(select(t,'Finance person','হিসাবের ব্যক্তি')).not.toContainText('Abdul Karim');await act(button(t,'Review transaction','লেনদেন যাচাই করুন'));await expect(t.getByRole('status')).toHaveCount(0);
   await act(select(t,'Finance person','হিসাবের ব্যক্তি'));await expect(page.getByRole('listbox')).toBeVisible();await expect(page.getByRole('option',{name:/^Hafizur Rahman/})).toHaveCount(0);await expect(page.getByRole('option',{name:/^Abdul Karim/})).toHaveCount(1);
   await page.keyboard.press('Escape');await expect(t).toBeVisible();await choose(select(t,'Transaction type','লেনদেনের ধরন'),w('Borrower Debit','ঋণগ্রহীতাকে টাকা দেওয়া'));
   await act(select(t,'Finance person','হিসাবের ব্যক্তি'));await expect(page.getByRole('listbox')).toBeVisible();await expect(page.getByRole('option',{name:/^Rasel Enterprise/})).toHaveCount(1);await expect(page.getByRole('option',{name:/^Abdul Karim/})).toHaveCount(0);await page.keyboard.press('Escape');await act(button(t,'Cancel','বাতিল'));
  });
  await check('nested-people-account',async()=>{
   await act(button(page,'New transaction','নতুন লেনদেন'));const t=tx();await sourceAmount(t).fill('123.25');await field(t,'Reference no.','নম্বর').fill('NESTED-REF');await field(t,'Notes','মন্তব্য').fill('Parent draft');
   const manage=button(t,'Manage people','ব্যক্তি যোগ / সংশোধন');await act(manage);const d=manager();await expect(d).toBeVisible();await act(button(d,'Add person','ব্যক্তি যোগ করুন'));await expect(d).toBeVisible();
   await d.getByPlaceholder(w('Name','নাম'),{exact:true}).fill('Nested lender');await d.getByPlaceholder(w('Phone','ফোন নম্বর'),{exact:true}).fill('01888 123456');await expect(button(d,'Lender','ঋণদাতা')).toHaveAttribute('aria-pressed','true');await act(button(d,'Owner','মালিক'));await expect(button(d,'Owner','মালিক')).toHaveAttribute('aria-pressed','true');
   await act(button(d,'Add person','ব্যক্তি যোগ করুন'));await expect(d).toBeHidden();await expect(manage).toBeFocused();await expect(select(t,'Finance person','হিসাবের ব্যক্তি')).toContainText('Nested lender');await expect(field(t,'Amount','টাকা')).toHaveValue('123.25');
   await act(manage);await expect(d).toBeVisible();const row=d.getByText('Nested lender',{exact:true}).locator('xpath=../..');await act(button(row,'Edit','সংশোধন'));await d.getByPlaceholder(w('Name','নাম'),{exact:true}).fill('Discard me');await act(button(d,'Cancel edit','সংশোধন বাতিল'));await expect(row).toContainText('Nested lender');await page.keyboard.press('Escape');await expect(d).toBeHidden();await expect(manage).toBeFocused();
   // Finance people stays editable from the attached gear; account creation is no longer inline.
   await expect(button(t,'Add account','হিসাব যোগ করুন')).toHaveCount(0);
   await expect(manage).toHaveAttribute('aria-haspopup','dialog');
   await expect(field(t,'Reference no.','নম্বর')).toHaveValue('NESTED-REF');
   await expect(field(t,'Notes','মন্তব্য')).toHaveValue('Parent draft');
   await act(button(t,'Cancel','বাতিল'));await expect(t).toBeHidden();
   await act(button(page,'New transaction','নতুন লেনদেন'));
   await expect(t).toContainText('Nested lender');
   await expect(t).toContainText('Main Cash Counter');
   await expect(field(t,'Amount','টাকা')).toHaveValue('123.25');
   if([390,1440].includes(width)){await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const findings=await page.evaluate(async()=>{const roots=document.querySelectorAll('[data-dialog-root]');const r=await window.axe.run(roots[roots.length-1],{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}));});assert.deepEqual(findings,[],'nested parent axe');}
   await act(button(t,'Review transaction','লেনদেন যাচাই করুন'));await act(button(t,'Confirm finance transaction','লেনদেন নিশ্চিত করুন'));await act(page.getByRole('tab',{name:w('Loans & Owners','ঋণ ও মালিক'),exact:true}));const saved=page.locator('tbody tr').filter({hasText:'FIN-000189'});await expect(saved).toContainText('Nested lender');await expect(saved).toContainText('Main Cash Counter');await expect(saved).toContainText('123.25');
  });
  await check('inactive-source-correction',async()=>{
   await act(button(page,'Finance people','হিসাবের ব্যক্তি').first());const d=manager();const person=d.getByText('Hafizur Rahman',{exact:true}).locator('xpath=../..');await act(button(person,'Deactivate','নিষ্ক্রিয় করুন'));await expect(button(person,'Activate','সক্রিয় করুন')).toBeVisible();await act(button(d,'Done','সম্পন্ন'));await act(page.getByRole('tab',{name:w('Loans & Owners','ঋণ ও মালিক'),exact:true}));const row=page.locator('tbody tr').filter({hasText:'FIN-000187'});await act(button(row,'Actions for FIN-000187','কাজ FIN-000187'));const correction=page.getByRole('dialog');await act(button(correction,'Edit','সংশোধন'));const sources=correction.getByText(w('Payment sources','টাকার মাধ্যম'),{exact:true}).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');await sources.getByRole('textbox').fill('');await field(correction,'Amount','টাকা').fill('123');await act(button(correction,'Save changes','সংশোধন সংরক্ষণ'));await act(button(correction,'Close','বন্ধ করুন').first());await expect(row).toContainText('Hafizur Rahman');await expect(row).toContainText('123');await act(button(row,'Actions for FIN-000187','কাজ FIN-000187'));await expect(page.getByRole('dialog')).toContainText('Hafizur Rahman');await page.keyboard.press('Escape');
  });
  await check('same-name-account-id',async()=>{
   await act(page.getByRole('tab',{name:w('Money Accounts','টাকার হিসাব'),exact:true}));await act(button(page,'Add account','হিসাব যোগ করুন'));const d=page.getByRole('dialog');await field(d,'Account name','হিসাবের নাম').fill('Dutch-Bangla Bank · 4582');await field(d,'Opening balance','শুরুর জের').fill('1');await act(button(d,'Save account','হিসাব সংরক্ষণ'));await act(button(page,'New transaction','নতুন লেনদেন'));const t=tx();await sourceAmount(t).fill('123');const sources=t.getByText(w('Payment sources','টাকার মাধ্যম'),{exact:true}).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');await choose(sources.getByRole('combobox').nth(0),w('Bank','ব্যাংক'));await act(sources.getByRole('combobox').nth(1));await expect(page.getByRole('listbox')).toBeVisible();const options=page.getByRole('option',{name:/^Dutch-Bangla Bank · 4582/});await expect(options).toHaveCount(2);await act(options.nth(1));await act(button(t,'Review transaction','লেনদেন যাচাই করুন'));await act(button(t,'Confirm finance transaction','লেনদেন নিশ্চিত করুন'));const cards=page.locator('p').filter({hasText:/^Dutch-Bangla Bank · 4582$/}).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');await expect(cards).toHaveCount(2);await expect(cards.last()).toContainText('৳124');await expect(cards.first()).toContainText('৳2,14,650');
  });
  await context.tracing.stop(results.some(r=>r.id===id&&r.status==='failed')?{path:path.join(output,id+'.zip')}:{});await context.close();console.log(id,results.filter(r=>r.id===id).map(r=>r.name+':'+r.status).join(', '));
 }}finally{fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));await browser.close();await server.close();}
 console.log(results.length+' journeys; '+results.filter(r=>r.status==='failed').length+' failed');assert.equal(results.filter(r=>r.status==='failed').length,0);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
