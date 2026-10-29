/* Counter quick-add keeps an entered payment draft for Customer and Supplier roles. */
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Playwright CLI scripts use CommonJS. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const axePath = require.resolve('axe-core');

async function main() {
  const { createServer } = await import('vite');
  const port=Number(process.env.COUNTER_QUICK_ADD_PORT||49266);
  const server = await createServer({ cacheDir:'.superpowers/counter-quick-add-cache',server:{host:'127.0.0.1',port,strictPort:true} });
  await server.listen();
  const browser = await chromium.launch({ executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox'] });
  const allProfiles=[[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
  const profiles=process.env.COUNTER_QUICK_ADD_WIDTH?allProfiles.filter(([width])=>width===Number(process.env.COUNTER_QUICK_ADD_WIDTH)):allProfiles;
  let journeys=0;
  try {
    for (const [width,height] of profiles) for (const theme of ['light','dark']) for (const language of ['English','English + Bangla','Bangla']) {
      const context=await browser.newContext({viewport:{width,height},hasTouch:true,colorScheme:theme,reducedMotion:'reduce'});
      const page=await context.newPage(),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.addInitScript(({theme,language})=>{
        localStorage.setItem('hisabiq-theme',theme);
        localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));
      },{theme,language});
      const act=element=>width<=1024?element.tap():element.click();
      const bilingual=language!=='Bangla';
      const label=(en,bn)=>bilingual?new RegExp(`${en}|${bn}`):new RegExp(bn);
      const suffix=`${width}px ${theme} ${language}`;
      try {
        await page.goto(`http://127.0.0.1:${port}/#/app/counter`);
        await page.getByRole('heading',{name:label('Transaction summary','লেনদেনের সারাংশ')}).waitFor();
        await page.addScriptTag({path:axePath});
        for (const {action,role,name,phone} of [
          {action:'Customer Receive',role:'Customer',name:'Counter QA Customer',phone:'01700993001'},
          {action:'Supplier Pay',role:'Supplier',name:'Counter QA Supplier',phone:'01700993002'}
        ]) {
          if (action!=='Customer Receive') await act(page.getByRole('button',{name:new RegExp(`${action}|${role==='Supplier'?'সরবরাহকারীকে টাকা দিন':'ক্রেতার টাকা নিন'}`)}));
          const amount=page.locator('input[aria-label="Payment source amount"],input[aria-label="পেমেন্টের টাকা"]');
          await amount.fill('125');
          const query=page.getByRole('textbox',{name:label(`Search ${role.toLowerCase()}`,role==='Customer'?'ক্রেতা খুঁজুন':'সরবরাহকারী খুঁজুন')});
          await query.fill(name);
          const list=page.getByRole('listbox',{name:label('Matching parties','মিলে যাওয়া নাম')});
          await list.waitFor();
          assert.equal(await page.getByText(label('No matching parties','কোনো নাম মেলেনি')).count(),1,`${suffix} ${role} has no existing match`);
          const add=page.locator('button').filter({hasText:new RegExp(`as ${role.toLowerCase()}|${role==='Customer'?'ক্রেতা হিসেবে':'সরবরাহকারী হিসেবে'}`)});
          await add.waitFor();
          await act(add);
          const dialog=page.getByRole('dialog',{name:label('Add party','নতুন পার্টি যোগ করুন')});
          await dialog.waitFor();
          const partyName=dialog.getByRole('textbox',{name:label('Party name','পার্টির নাম')});
          assert.equal(await partyName.inputValue(),name,`${suffix} search text is carried into the shared editor`);
          assert.equal(await dialog.getByRole('checkbox',{name:label(role,role==='Customer'?'ক্রেতা':'সরবরাহকারী')}).isChecked(),true,`${suffix} ${role} is the default relationship`);
          const violations=await page.evaluate(async element=>(await window.axe.run(element)).violations.map(item=>item.id),await dialog.elementHandle());
          assert.deepEqual(violations,[],`${suffix} ${role} dialog axe checks`);
          const bounds=await dialog.boundingBox(),viewport=page.viewportSize();
          assert.ok(bounds&&viewport&&bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=viewport.width&&bounds.y+bounds.height<=viewport.height,`${suffix} ${role} dialog fits the viewport`);

          await act(dialog.getByRole('button',{name:label('Cancel','বাতিল')}));
          await dialog.waitFor({state:'hidden'});
          assert.equal(await amount.inputValue(),'125',`${suffix} ${role} payment draft survives cancel`);
          assert.equal(await query.inputValue(),name,`${suffix} ${role} search survives cancel`);
          await act(add);
          const reopened=page.getByRole('dialog',{name:label('Add party','নতুন পার্টি যোগ করুন')});
          await reopened.waitFor();
          await reopened.getByRole('textbox',{name:label('Phone','ফোন')}).fill(phone);
          await act(reopened.getByRole('button',{name:label('Save party','পার্টির তথ্য রাখুন')}));
          await reopened.waitFor({state:'hidden'});
          await page.getByText(label(`Selected ${role.toLowerCase()}`,role==='Customer'?'বাছা ক্রেতা':'বাছা সরবরাহকারী')).waitFor();
          assert.equal(await query.inputValue(),name,`${suffix} ${role} is selected after creation`);
          assert.equal(await amount.inputValue(),'125',`${suffix} ${role} payment amount survives quick-add and auto-selection`);
        }
        assert.deepEqual(errors,[],`${suffix} Counter browser errors`);
        journeys++;
        console.log(`Passed ${journeys}/${profiles.length*6}: ${suffix}`);
      } finally {
        await context.close();
      }
    }
    console.log(`Counter quick-add passed: ${journeys}/${profiles.length*6} journeys; ${journeys*2} dialog axe scans`);
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch(error=>{console.error(error);process.exitCode=1;});
