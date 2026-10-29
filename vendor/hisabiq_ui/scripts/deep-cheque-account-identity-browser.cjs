/* Cheque to bank-account identity through duplicate creation and rename. */
const {chromium}=require('playwright');
const {expect}=require('playwright/test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const allSizes=[[320,700],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1280,800],[1440,900]];
const sizes=process.env.DEEP_AUDIT_ONLY_WIDTH?allSizes.filter(([width])=>width===Number(process.env.DEEP_AUDIT_ONLY_WIDTH)):process.env.DEEP_AUDIT_SMOKE?[[390,844]]:allSizes;
const allLanguages=['English','English + Bangla','Bangla'];
const languages=process.env.DEEP_AUDIT_ONLY_LANGUAGE?[process.env.DEEP_AUDIT_ONLY_LANGUAGE]:process.env.DEEP_AUDIT_SMOKE?['English + Bangla']:allLanguages;
const themes=process.env.DEEP_AUDIT_ONLY_THEME?[process.env.DEEP_AUDIT_ONLY_THEME]:['light','dark'];
const output=process.env.DEEP_AUDIT_OUTPUT||'.superpowers/deep-audit/cheque-account-identity';
const results=[];

async function main(){
  const {createServer}=await import('vite');
  const port=Number(process.env.DEEP_AUDIT_PORT||4496);
  const server=await createServer({cacheDir:`.superpowers/cheque-account-identity-cache-${port}`,server:{host:'127.0.0.1',port,strictPort:true}});
  await server.listen();
  const executablePath=process.env.PLAYWRIGHT_EXECUTABLE_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined);
  const browser=await chromium.launch({executablePath,args:['--no-sandbox']});
  fs.mkdirSync(output,{recursive:true});
  try {
    for(const [width,height] of sizes) for(const theme of themes) for(const language of languages){
      const id=[width,theme,language.replaceAll(' ','')].join('-');
      const context=await browser.newContext({viewport:{width,height},hasTouch:width<=1024,reducedMotion:'reduce',colorScheme:theme});
      await context.addInitScript(({theme,language})=>{
        localStorage.setItem('hisabiq-theme',theme);
        localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));
      },{theme,language});
      const page=await context.newPage();
      page.setDefaultTimeout(15000);
      page.setDefaultNavigationTimeout(60000);
      await page.route('https://fonts.googleapis.com/**',route=>route.abort());
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      const text=(en,bn)=>language==='Bangla'?bn:en;
      const act=element=>width<=1024?element.tap():element.click();
      const field=(dialog,en,bn)=>dialog.locator('label').filter({hasText:new RegExp('^'+text(en,bn))}).getByRole('textbox');
      const button=(root,en,bn)=>root.getByRole('button',{name:text(en,bn),exact:true});
      const dialog=()=>page.getByRole('dialog');
      const tab=async(en,bn)=>act(page.getByRole('tab',{name:text(en,bn),exact:true}));
      const visit=async()=>page.goto(`http://127.0.0.1:${port}/?case=${encodeURIComponent(id)}#/app/finance`,{waitUntil:'domcontentloaded'});
      const balance=async(name,index=0)=>{
        const card=page.getByText(name,{exact:true}).nth(index).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
        return Number((await card.locator('.text-2xl').innerText()).replace(/[৳,]/g,''));
      };
      try {
        await visit();
        const accountName='Dutch-Bangla Bank · 4582';
        await tab('Money Accounts','টাকার হিসাব');
        const originalBalance=await balance(accountName);
        await act(button(page,'Add account','হিসাব যোগ করুন'));
        let d=dialog();
        await field(d,'Account name','হিসাবের নাম').fill(accountName);
        await field(d,'Account number','হিসাব নম্বর').fill('9999');
        await field(d,'Opening balance','শুরুর জের').fill('0');
        await act(button(d,'Save account','হিসাব সংরক্ষণ'));
        await expect(d).toBeHidden();

        await tab('Cheques','চেক');
        await act(button(page,'New cheque','নতুন চেক').first());
        d=dialog();
        await field(d,'Cheque number','চেক নম্বর').fill('QA-ID-4582');
        await field(d,'Bank','ব্যাংক').fill('QA cheque issuer');
        await field(d,'Received from','কার কাছ থেকে পেয়েছি').fill('QA identity party');
        await field(d,'Amount','টাকা').fill('123');
        const accountSelect=d.locator('label').filter({hasText:new RegExp('^'+text('Bank / Money Account','ব্যাংক / টাকার হিসাব'))}).getByRole('combobox');
        await act(accountSelect);
        await expect(page.getByRole('listbox')).toBeVisible();
        await act(page.getByRole('option',{name:/9999/}));
        await act(button(d,'Save cheque','চেক সংরক্ষণ'));
        await expect(d).toBeHidden();

        // The second same-name account is deliberately renamed. Existing cheque rows
        // still belong to the original account and must retain its stable identity.
        await tab('Money Accounts','টাকার হিসাব');
        await act(page.getByRole('button',{name:text('Actions for','কাজ')+' '+accountName,exact:true}).nth(1));
        d=dialog();
        await act(button(d,'Edit','সংশোধন'));
        await field(d,'Account name','হিসাবের নাম').fill('Renamed duplicate bank');
        await act(button(d,'Save changes','সংশোধন সংরক্ষণ'));
        await expect(d).toContainText('Renamed duplicate bank');
        await expect(button(d,'Deactivate','নিষ্ক্রিয় করুন')).toHaveCount(1);
        await expect(button(d,'Close','বন্ধ করুন')).toHaveCount(language==='Bangla'?1:2);
        await act(button(d,'Deactivate','নিষ্ক্রিয় করুন'));
        await expect(d).toContainText(text('Deactivate this account?','হিসাব বন্ধ করবেন?'));
        await act(button(d,'Cancel','বাতিল'));
        if(process.env.DEEP_AUDIT_DEBUG) console.log('close geometry',id,await button(d,'Close','বন্ধ করুন').first().evaluate(element=>({button:element.getBoundingClientRect().toJSON(),dialog:element.closest('[role="dialog"]')?.getBoundingClientRect().toJSON(),dialogScrollHeight:element.closest('[role="dialog"]')?.scrollHeight,dialogClientHeight:element.closest('[role="dialog"]')?.clientHeight,scrollTop:element.closest('[role="dialog"]')?.scrollTop})));
        await act(button(d,'Close','বন্ধ করুন').first());
        await expect(d).toBeHidden();

        await tab('Cheques','চেক');
        const newChequeRow=page.locator('tbody tr').filter({hasText:'QA-ID-4582'});
        await act(newChequeRow.getByRole('button').last());
        d=dialog();
        await expect(d).toContainText('Renamed duplicate bank');
        await expect(d).not.toContainText(accountName);
        await act(button(d,'Mark deposited','জমা হয়েছে'));
        await act(button(d,'Confirm Deposited','নিশ্চিত করুন: ব্যাংকে জমা'));
        await act(button(d,'Mark cleared','ক্লিয়ার হয়েছে'));
        await act(button(d,'Confirm Cleared','নিশ্চিত করুন: ক্লিয়ার হয়েছে'));
        await expect(d).toContainText(text('Cleared','ক্লিয়ার হয়েছে'));
        await act(button(d,'Close','বন্ধ করুন').first());

        const row=page.locator('tbody tr').filter({hasText:'458923'});
        await act(row.getByRole('button').last());
        d=dialog();
        await expect(d).toContainText(accountName);
        await expect(d).not.toContainText('Renamed duplicate bank');
        await act(button(d,'Mark deposited','জমা হয়েছে'));
        await act(button(d,'Confirm Deposited','নিশ্চিত করুন: ব্যাংকে জমা'));
        await act(button(d,'Mark cleared','ক্লিয়ার হয়েছে'));
        await act(button(d,'Confirm Cleared','নিশ্চিত করুন: ক্লিয়ার হয়েছে'));
        await expect(d).toContainText(text('Cleared','ক্লিয়ার হয়েছে'));
        if([390,1440].includes(width)){
          await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
          const violations=await page.evaluate(async()=>{
            const root=document.querySelector('[data-dialog-root]');
            const result=await axe.run(root,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});
            return result.violations.map(item=>({id:item.id,nodes:item.nodes.map(node=>node.target)}));
          });
          assert.deepEqual(violations,[],'cheque detail dialog axe');
        }
        await act(button(d,'Close','বন্ধ করুন').first());
        await tab('Money Accounts','টাকার হিসাব');
        assert.equal(await balance(accountName),originalBalance+35000,'clearance moves the original account');
        assert.equal(await balance('Renamed duplicate bank'),123,'new cheque clears to the selected duplicate account');
        assert.deepEqual(errors,[],'browser runtime errors');
        results.push({id,status:'passed'});
      } catch(error) {
        results.push({id,status:'failed',error:error.message});
        console.error(id,error.message);
        await page.screenshot({path:path.join(output,id+'.png'),fullPage:false});
      } finally {
        await context.close();
      }
      console.log(id,results.at(-1).status);
    }
  } finally {
    fs.writeFileSync(path.join(output,'results.json'),JSON.stringify(results,null,2));
    await browser.close();
    await server.close();
  }
  console.log(`${results.length} journeys; ${results.filter(result=>result.status==='failed').length} failed`);
  assert.equal(results.filter(result=>result.status==='failed').length,0);
}

main().catch(error=>{console.error(error);process.exitCode=1;});
