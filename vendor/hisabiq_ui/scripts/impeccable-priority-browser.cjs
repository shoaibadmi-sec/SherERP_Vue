/* Impeccable priority fixes: truthful identity and customer role eligibility on phone/desktop. */
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4293,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const errors=[];
 try{
  for(const width of [390,1440]){
   const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
   page.on('pageerror',error=>errors.push(error.message));
   const base='http://127.0.0.1:4293/#';
   await page.goto(base+'/app/dashboard');
   const heading=page.getByRole('heading',{level:1});
   await heading.waitFor();
   assert.match(await heading.innerText(),/Mahmud Hasan/,'Dashboard must use the active settings employee, not a hard-coded name');
   await page.getByRole('button',{name:/User menu MH Mahmud Hasan/}).waitFor();
   const header=await page.locator('main').innerText();
   assert.match(header,/Nawabpur Hardware House/,'Dashboard derives the current business from settings');
   assert.doesNotMatch(header,/Thursday, 1 October 2026/,'Outdated static date must not appear');
   assert.match(header,/Sample figures/,'Preview numbers must be labeled as sample data');

   await page.goto(base+'/app/pos');
   const trigger=page.getByTestId('pos-customer-picker-trigger');
   await trigger.waitFor();
   await trigger.click();
   const search=page.getByTestId('pos-customer-picker-search');
   await search.fill('Rafiq Mia');
   await page.getByText('No matching customers',{exact:true}).waitFor();
   assert.equal(await page.getByRole('button',{name:/Rafiq Mia/}).count(),0,'Borrower-only party cannot be offered as Customer');
   await search.fill('Rahman Hardwar');
   await page.getByRole('button',{name:/Rahman Hardware/}).last().click();
   assert.match(await trigger.innerText(),/Rahman Hardware/,'Active Customer remains selectable, including small spelling mistakes');
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert.ok(overflow<=2,'Page must not overflow at '+width+'px');
   await page.close();
  }
  assert.deepEqual(errors,[],'No page exceptions during priority regression');
  console.log('Impeccable Dashboard and POS role/typo regressions passed at 390/1440.');
 }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
