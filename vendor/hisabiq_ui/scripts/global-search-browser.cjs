/* eslint-env node */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4260,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
 for(const theme of ['light','dark'])for(const width of [320,390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  await context.addInitScript(selectedTheme=>localStorage.setItem('hisabiq-theme',selectedTheme),theme);
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const root='http://127.0.0.1:4260/#';
  await page.goto(root+'/app/dashboard');
  const field=page.getByRole('combobox',{name:'Global search'});
  const list=page.getByRole('listbox',{name:'Global search suggestions'});
  await field.waitFor();
  await page.keyboard.press('Control+k');
  assert(await field.evaluate(node=>document.activeElement===node));
  await field.fill('in');await list.waitFor();
  const activeRow=list.getByRole('option',{selected:true});
  async function checkSelectedContrast(){
   return await activeRow.evaluate(row=>{
    const channel=value=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d');ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return Array.from(ctx.getImageData(0,0,1,1).data).slice(0,3);};
    const brightness=rgb=>rgb.map(value=>value/255).map(value=>value<=0.04045?value/12.92:Math.pow((value+0.055)/1.055,2.4)).reduce((sum,value,index)=>sum+value*[0.2126,0.7152,0.0722][index],0);
    const background=brightness(channel(getComputedStyle(row).backgroundColor));
    const ratio=node=>{
     const foreground=brightness(channel(getComputedStyle(node).color));
     return (Math.max(background,foreground)+0.05)/(Math.min(background,foreground)+0.05);
    };
    const title=row.querySelector('span > span:first-child');
    const helper=row.querySelector('span > span:nth-child(2)');
    return {title:title?ratio(title):0,helper:helper?ratio(helper):0};
   });
  }
  const initialContrast=await checkSelectedContrast();
  assert(initialContrast.title>=4.5&&initialContrast.helper>=4.5,
    'Selected result title and helper must retain WCAG AA contrast in '+theme+': '+JSON.stringify(initialContrast));
  await field.press('ArrowDown');
  const keyboardContrast=await checkSelectedContrast();
  if(keyboardContrast.title<4.5||keyboardContrast.helper<4.5)
   console.error('Selected row diagnostics:',await activeRow.evaluate(row=>{
    const title=row.querySelector('span > span:first-child'),helper=row.querySelector('span > span:nth-child(2)');
    return {rowBg:getComputedStyle(row).backgroundColor,rowColor:getComputedStyle(row).color,
      titleColor:title&&getComputedStyle(title).color,helperColor:helper&&getComputedStyle(helper).color,
      style:row.getAttribute('style'),classes:row.className,
      theme:document.documentElement.getAttribute('data-theme'),
      accent:getComputedStyle(document.documentElement).getPropertyValue('--accent'),
      ink:getComputedStyle(document.documentElement).getPropertyValue('--ink')};
   }));
  assert(keyboardContrast.title>=4.5&&keyboardContrast.helper>=4.5,
    'Keyboard-highlighted result must retain WCAG AA contrast in '+theme+': '+JSON.stringify(keyboardContrast));
  await list.getByRole('option').last().hover();
  const hoverContrast=await checkSelectedContrast();
  assert(hoverContrast.title>=4.5&&hoverContrast.helper>=4.5,
    'Mouse-hovered result must retain WCAG AA contrast in '+theme+': '+JSON.stringify(hoverContrast));
  await field.fill('এলইডি');await list.waitFor();
  await list.getByRole('option',{name:/LED Bulb 12W/}).click();
  const product=page.getByRole('textbox',{name:'Search products'});
  await product.waitFor();assert.equal(await product.inputValue(),'ELC-1201');
  await field.fill('INV-০০০২৪১');await list.getByRole('option',{name:/INV-000241/}).click();
  await page.getByRole('button',{name:'Actions for INV-000241'}).waitFor();
  await field.fill('PUR-000118');await list.getByRole('option',{name:/PUR-000118/}).click();
  await page.getByRole('button',{name:'Actions for PUR-000118'}).waitFor();
  await field.fill('Rahman');await list.getByRole('option',{name:/Rahman Hardware/}).first().click();
  await page.waitForFunction(()=>location.hash.includes('/app/parties?id='));
  await field.fill('হিসাব মিলানো');await list.getByRole('option',{name:/Reconciliation/}).click();
  await page.waitForFunction(()=>location.hash.includes('/app/reconciliation'));
  await field.fill('zzzz-no-record');await list.getByText(/No matching records/).waitFor();
  await field.press('Escape');assert.equal(await list.count(),0);
  await field.fill('LED Bulb');await field.press('Enter');
  await page.waitForFunction(()=>location.hash.includes('/app/products?q=ELC-1201'));
  await field.fill('Rahman');await page.getByRole('button',{name:'Clear global search'}).click();
  assert.equal(await field.inputValue(),'');
  if(width===390&&theme==='light'){
   await field.fill('ulb');await list.getByText(/No matching records/).waitFor();
   await page.goto(root+'/app/settings/personal');
   const mode=page.getByRole('combobox',{name:'Search matching'});await mode.click();
   await page.getByRole('option',{name:'Advanced — broader fuzzy search'}).click();
   await page.getByRole('button',{name:'Save changes'}).click();
   await page.reload();await field.fill('ulb');await list.getByRole('option',{name:/LED Bulb 12W/}).waitFor();
   await field.fill('balb');await list.getByRole('option',{name:/LED Bulb 12W/}).waitFor();
  }
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  assert.deepEqual(errors,[]);
  await context.close();
  console.log('Instant global search and selection contrast passed '+width+'px '+theme);
 }
 }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
