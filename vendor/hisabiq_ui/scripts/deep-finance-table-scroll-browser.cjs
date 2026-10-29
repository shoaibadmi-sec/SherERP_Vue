/* Verify shared tables expose keyboard access only when they horizontally overflow. */
const {chromium}=require('playwright');
const expect=require('playwright/test').expect.configure({timeout:60000});
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const output=process.env.DEEP_AUDIT_OUTPUT||'.superpowers/deep-audit/finance-table-scroll';
const sizes=[[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
const languages=['English','English + Bangla','Bangla'];
const results=[];

async function main(){
 const {createServer}=await import('vite');
 const port=49123;
 const server=await createServer({server:{host:'127.0.0.1',port,strictPort:true}});await server.listen();
 const baseUrl='http://127.0.0.1:'+port;
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 fs.mkdirSync(output,{recursive:true});
 try{
  for(const [width,height] of sizes)for(const theme of ['light','dark'])for(const language of languages){
   const id=[width,theme,language.replaceAll(' ','')].join('-');
   const context=await browser.newContext({viewport:{width,height},hasTouch:width<=1024,reducedMotion:'reduce',colorScheme:theme});
   await context.addInitScript(({theme,language})=>{localStorage.setItem('hisabiq-theme',theme);localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));},{theme,language});
   const page=await context.newPage();page.setDefaultTimeout(60000);page.setDefaultNavigationTimeout(60000);
   await page.route('https://fonts.googleapis.com/**',r=>r.abort());
   const w=(en,bn)=>language==='Bangla'?bn:en;
   const act=e=>width<=1024?e.tap():e.click();
   const scans=[];
   try{
    await page.goto(baseUrl+'/?visit='+id+'#/app/finance',{waitUntil:'commit'});
    await expect(page.getByRole('button',{name:w('New transaction','নতুন লেনদেন'),exact:true})).toBeVisible();
    const table=page.locator('main [data-slot="table-container"]').first();
    await expect(table).toBeVisible();
    await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
    const inspect=async(state)=>{
     const data=await table.evaluate(el=>({
      tabIndex:el.tabIndex,role:el.getAttribute('role'),label:el.getAttribute('aria-label'),
      scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,
      focusRing:el.className.includes('focus-visible:ring-2')
     }));
     const overflowing=data.scrollWidth>data.clientWidth+1;
      if(overflowing){
      assert.equal(data.tabIndex,0,`${state}: overflowing wrapper should be keyboard reachable`);
      assert.equal(data.role,'region',`${state}: overflowing wrapper should expose a named region`);
      assert.equal(data.label,w('Recent loans and owner money','সাম্প্রতিক ঋণ ও মালিকের অর্থ'));
      assert.equal(data.focusRing,true,`${state}: wrapper should carry the visible focus treatment`);
      if(state==='closed'){
       const hasPrevious=await table.evaluate(el=>{
        const focusable=[...document.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]')]
         .filter(node=>node.getClientRects().length&&!node.closest('[hidden],[inert],[aria-hidden="true"]'));
        const previous=focusable[focusable.indexOf(el)-1];if(!previous)return false;previous.focus();return true;
       });
       assert.ok(hasPrevious,'a preceding keyboard target should exist');
       await page.keyboard.press('Tab');
       await expect(table).toBeFocused();
       const visibleFocus=await table.evaluate(el=>getComputedStyle(el).boxShadow!=='none'||getComputedStyle(el).outlineStyle!=='none');
       assert.equal(visibleFocus,true,'keyboard focus ring should be visibly rendered');
       const before=await table.evaluate(el=>el.scrollLeft);
       await page.keyboard.press('ArrowRight');
       const after=await table.evaluate(el=>el.scrollLeft);
       assert.ok(after>before,`${state}: ArrowRight should scroll the overflowing table`);
       await table.evaluate(el=>{el.scrollLeft=0});
       await table.locator('tbody td').first().evaluate(cell=>{
        const input=document.createElement('input');input.type='text';input.value='ABCD';input.dataset.testArrowControl='true';
        input.setAttribute('aria-label','Temporary table field');cell.append(input);
       });
       const control=table.locator('[data-test-arrow-control]');await control.focus();
       await control.evaluate(input=>input.setSelectionRange(0,0));await page.keyboard.press('ArrowRight');
       assert.equal(await control.evaluate(input=>input.selectionStart),1,'ArrowRight on an input should move its caret instead of being consumed by the scroll wrapper');
       await table.locator('[data-test-arrow-control]').evaluate(button=>button.remove());
      }
     }else{
      assert.equal(data.tabIndex,-1,`${state}: fitting wrapper should not add a tab stop`);
      assert.equal(data.role,null,`${state}: fitting wrapper should not expose a scroll region`);
     }
     const violations=await page.evaluate(async()=>{
      const r=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});
      return r.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}));
     });
     assert.deepEqual(violations,[],`${state}: whole-page axe scan`);
     scans.push({state,violations,table:data});
    };
    if(width===320)assert.ok(await table.evaluate(el=>el.scrollWidth>el.clientWidth+1),'320px phone should reproduce horizontal overflow');
    if(width===1440)assert.ok(await table.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'1440px desktop table should fit');
    await inspect('closed');
    const tx=page.getByRole('button',{name:w('New transaction','নতুন লেনদেন'),exact:true});await act(tx);
    const parent=page.getByRole('dialog');
    const amount=parent.locator('label').filter({hasText:new RegExp('^'+w('Amount','টাকা'))}).getByRole('textbox');
    await amount.fill('123.25');
    const manage=parent.getByRole('button',{name:w('Manage people','ব্যক্তি যোগ / সংশোধন'),exact:true});await act(manage);
    const nested=page.getByRole('dialog',{name:w('Finance people','হিসাবের ব্যক্তি'),exact:true});await expect(nested).toBeVisible();
    await inspect('people-dialog-open');
    await page.keyboard.press('Escape');await expect(nested).toBeHidden();await expect(manage).toBeFocused();
    await expect(amount).toHaveValue('123.25');
    await act(parent.getByRole('button',{name:w('Cancel','বাতিল'),exact:true}));await expect(parent).toBeHidden();
    results.push({id,status:'passed',scans});
   }catch(error){
    results.push({id,status:'failed',error:error.message,scans});
    console.error(id,error.message);
    await page.screenshot({path:path.join(output,id+'.png'),fullPage:true});
   }
   await context.close();console.log(id,results.at(-1).status);
  }
 }finally{fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));await browser.close();await server.close();}
 console.log(results.length+' profiles; '+results.filter(r=>r.status==='failed').length+' failed');
 assert.equal(results.filter(r=>r.status==='failed').length,0);
}

main().catch(error=>{console.error(error);process.exitCode=1});
