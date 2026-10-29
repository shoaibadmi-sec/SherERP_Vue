/* Products-table typography contract across the ERP, including responsive rows. */
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');

function checkNativeTables(){
 const missing=[],nestedControls=[];
 const walk=dir=>{for(const e of fs.readdirSync(dir,{withFileTypes:true})){
  if(e.name==='_designSystem')continue;
  const file=path.join(dir,e.name);
  if(e.isDirectory()){walk(file);continue;}if(!file.endsWith('.tsx'))continue;
  const source=ts.createSourceFile(file,fs.readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const visit=node=>{
   if((ts.isJsxOpeningElement(node)||ts.isJsxSelfClosingElement(node))&&node.tagName.getText(source)==='table'&&
    !node.attributes.properties.some(a=>ts.isJsxAttribute(a)&&a.name.getText(source)==='data-erp-table'))missing.push(file+':'+(source.getLineAndCharacterOfPosition(node.pos).line+1));
   if(ts.isJsxElement(node)&&node.openingElement.attributes.properties.some(a=>ts.isJsxAttribute(a)&&a.name.getText(source)==='data-table-helper')){
    const controls=new Set(['input','textarea','select','Input','NumericInput','FormSelect','AppSelect','SearchSelect']);
    const inspect=child=>{
     if((ts.isJsxOpeningElement(child)||ts.isJsxSelfClosingElement(child))&&controls.has(child.tagName.getText(source)))nestedControls.push(file+':'+(source.getLineAndCharacterOfPosition(child.pos).line+1));
     ts.forEachChild(child,inspect);
    };ts.forEachChild(node,inspect);
   }
   ts.forEachChild(node,visit);
  };visit(source);
 }};walk('src');assert.deepEqual(missing,[],'Native UI tables must opt into the shared typography contract');
 assert.deepEqual(nestedControls,[],'Mark label text as helper without shrinking the controls it describes');
}
async function inspect(page,context){
 const result=await page.evaluate(()=>{
  const roots=[...document.querySelectorAll('[data-erp-table], [data-erp-table-view], [data-cart-row], [data-cart-header]')];
  const visible=el=>{const s=getComputedStyle(el),r=el.getBoundingClientRect();return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&!el.closest('[aria-hidden="true"],.sr-only');};
  const seen=new Set(),failures=[];let samples=0;
  for(const root of roots){if(!visible(root))continue;
   for(const el of [root,...root.querySelectorAll('*')]){
    if(seen.has(el)||!visible(el)||el.closest('svg'))continue;seen.add(el);
    const direct=[...el.childNodes].filter(n=>n.nodeType===Node.TEXT_NODE).map(n=>n.textContent.trim()).join(' ').trim();
    if(!direct&&!el.matches('input,textarea'))continue;
    const helper=el.closest('[data-table-helper],[data-table-badge],[data-bangla-helper],[data-slot="badge"]');
    const heading=el.closest('th,[data-cart-header]');
    const dataValue=el.matches('input,textarea,select,[role="combobox"],[data-testid="ledger-money-value"],[data-testid="ledger-running-balance"]')||el.closest('[data-testid="ledger-money-value"],[data-testid="ledger-running-balance"]');
    const expected=dataValue?'13px':helper?'11px':heading?'12px':'13px';
    const actual=getComputedStyle(el).fontSize;samples++;
    if(actual!==expected)failures.push({text:(direct||el.value||el.placeholder||'input').slice(0,55),tag:el.tagName,actual,expected,class:el.className});
   }
  }
  return {samples,failures,unmarked:[...document.querySelectorAll('#erp-main table')].filter(t=>visible(t)&&!t.hasAttribute('data-erp-table')).length,overflow:document.documentElement.scrollWidth>innerWidth};
 });
 assert.equal(result.unmarked,0,context+' native tables use the contract');
 assert.deepEqual(result.failures.slice(0,8),[],context+' typography');
 assert.equal(result.overflow,false,context+' no document overflow');return result.samples;
}
async function main(){
 checkNativeTables();
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4396,strictPort:true}});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 let samples=0,views=0;
 const routes=['dashboard','pos','counter','sales','quotations','online-sales','notifications','warranty','reconciliation','finance','daybook','accounts','audit-ledger','products','parties','purchases','vendors','purchases/new','expenses','reports?report=sales-register&from=&to=','reports?report=stock&from=&to=','settings/business','settings/personal','subscription','support'];
 try{
  for(const profile of [{width:1440,height:1000,language:'English + Bangla',theme:'light'},{width:768,height:1024,language:'English',theme:'dark'},{width:390,height:844,language:'Bangla',theme:'dark'}]){
   const context=await browser.newContext({viewport:{width:profile.width,height:profile.height},hasTouch:profile.width<1024,reducedMotion:'reduce'});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(v=>{localStorage.setItem('hisabiq-theme',v.theme);localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language:v.language,density:'Compact',terminology:'simple',dateView:'transaction'}));},profile);
   for(const route of routes){
    await page.goto('http://127.0.0.1:4396/#/app/'+route);
    await page.locator('#erp-main h1:visible').first().waitFor();await page.waitForTimeout(250);
    const label=profile.width+' '+profile.language+' '+route;
    samples+=await inspect(page,label);views++;
    if(process.env.TABLE_TYPOGRAPHY_CAPTURE==='1'&&['products','sales','parties','pos','reports?report=sales-register&from=&to='].includes(route)){
     fs.mkdirSync('.impeccable/review',{recursive:true});await page.screenshot({path:'.impeccable/review/typography-'+profile.width+'-'+route.split('?')[0]+'.png',fullPage:true});
    }
    if(route.startsWith('reports?report=sales-register')){
     await page.locator('[data-report-row]').first().getByRole('button').first().click();await page.getByRole('dialog').waitFor();
     samples+=await inspect(page,label+' details');await page.keyboard.press('Escape');
    }
   }
   assert.deepEqual(errors,[],profile.width+' no runtime errors');await context.close();
  }
  assert.ok(samples>500,'Exercise actual data, headings, helpers and badges');
  console.log('ERP table typography: '+views+' route/profile views, '+samples+' text observations; 13px data, 12px headings, 11px helpers/badges, native tables and dialog details passed.');
 }finally{await browser.close();await server.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
