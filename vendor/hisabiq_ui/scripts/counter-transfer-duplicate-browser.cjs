/* Same-name Counter transfer endpoints retain and reverse the selected account ID. */
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Playwright CLI scripts use CommonJS. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');const server=await createServer({server:{host:'127.0.0.1',port:4396,strictPort:true}});await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});const page=await context.newPage();
  const tap=element=>element.tap();
  await page.goto('http://127.0.0.1:4396/#/app/finance');
  await page.getByRole('heading',{name:'Finance',exact:true}).waitFor();
  await tap(page.getByRole('tab',{name:'Money Accounts',exact:true}));
  await tap(page.getByRole('button',{name:/Add account/}));
  const add=page.getByRole('dialog',{name:/Add account/});
  await tap(add.getByRole('combobox',{name:'Cash'}));
  await tap(page.getByRole('option',{name:'Bank',exact:true}));
  await add.getByRole('textbox',{name:'Account name'}).fill('Dutch-Bangla Bank · 4582');
  await add.getByRole('textbox',{name:'Bank name'}).fill('Dutch-Bangla Bank');
  await add.getByRole('textbox',{name:'Account number'}).fill('•••• 9999');
  await add.getByRole('textbox',{name:'Opening balance'}).fill('500');
  await tap(add.getByRole('button',{name:'Save account'}));
  await add.waitFor({state:'hidden'});
  await tap(page.getByRole('tab',{name:'Counter',exact:true}));
  await tap(page.getByRole('button',{name:/^Bank Transfer/}));
  await tap(page.getByRole('combobox',{name:'From account'}));
  await tap(page.getByRole('option',{name:/Main Cash Counter/}));
  await tap(page.getByRole('combobox',{name:'To account'}));
  await tap(page.getByRole('option',{name:/Dutch-Bangla Bank · 4582.*9999/}));
  await page.getByRole('textbox',{name:'Transfer amount'}).fill('50');
  await tap(page.getByRole('button',{name:'Review transfer money'}));
  const review=page.getByRole('dialog',{name:'Confirm transfer money'});await review.waitFor();
  assert.match(await review.innerText(),/9999/,'review identifies the second same-name account');
  await tap(review.getByRole('button',{name:'Confirm & record'}));
  await page.getByRole('status').filter({hasText:'Recorded in preview'}).waitFor();
  await tap(page.getByRole('tab',{name:'Money Accounts',exact:true}));
  const history=page.getByText('Transfer history',{exact:true}).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
  const row=history.locator('tbody tr').filter({hasText:'TRF-000042'});await row.waitFor();
  assert.match(await row.innerText(),/9999/,'history identifies the second same-name account');
  const duplicate=page.getByText('Dutch-Bangla Bank · 4582',{exact:true}).nth(1).locator('xpath=ancestor::div[contains(@class,"rounded-xl")][1]');
  const readDuplicate=async()=>Number((await duplicate.innerText()).match(/৳([\d,]+(?:\.\d+)?)/)[1].replaceAll(',',''));
  assert.equal(await readDuplicate(),550,'only the selected duplicate account receives the transfer');
  await tap(row.getByRole('button',{name:'Actions for TRF-000042'}));
  const action=page.getByRole('dialog',{name:'Account transfer'});
  await tap(action.getByRole('button',{name:'Reverse'}));
  await tap(action.getByRole('button',{name:'Confirm reverse'}));
  assert.equal(await readDuplicate(),500,'reversal restores the same-name destination selected earlier');
  assert.match(await row.innerText(),/Reversed/);
  await context.close();
 }finally{await browser.close();await server.close();}
 console.log('Counter duplicate-name transfer and ID-safe reversal passed.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
