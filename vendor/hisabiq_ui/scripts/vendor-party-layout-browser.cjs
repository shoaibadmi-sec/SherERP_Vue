const {chromium}=require('playwright');
const assert=require('node:assert/strict');

async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4286,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({
  executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']
 });
 const page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto('http://127.0.0.1:4286/#/app/vendors?partyId=v1&tab=ledger');
  const directory=page.getByRole('region',{name:'Vendor directory'});
  const workspace=page.getByRole('region',{name:'Selected Vendor work'});
  await directory.waitFor();
  await workspace.waitFor();
  assert.equal(await page.getByRole('region',{name:'Vendor module'}).count(),1);
  const tabs=page.getByRole('tablist',{name:'Vendor work tabs'});
  assert.equal(await tabs.getByRole('tab').count(),5);
  assert.equal(await tabs.evaluate(el=>getComputedStyle(el).display),'flex','Vendor tabs use the same horizontal text-tab layout as Parties');
  assert.equal(await tabs.getByRole('tab',{name:/Ledger/}).locator('[data-motion-tab-indicator]').count(),1,
   'Active Vendor tab uses the shared Framer Motion underline');
  assert.ok(!(await tabs.getByRole('tab',{name:/Ledger/}).getAttribute('class'))?.includes('border-b-2'),
   'Vendor tab does not stack a second button-like underline');
  assert.match(await tabs.getByRole('tab',{name:/Taken/}).getAttribute('title')??'',/Goods received/,
   'Ambiguous tab names explain the goods flow on hover');
  assert.ok(await directory.getByRole('option',{name:/Shapla Transport/}).count()>0,
   'Vendor remains in the always-visible left directory');

  // Match the shared Parties 380px/remaining desktop split and stacked mobile flow.
  for(const width of [1440,1024,768,390]){
   await page.setViewportSize({width,height:900});
   // Resolve the responsive grid before checking its geometry.
   if(width>=640) await page.waitForFunction(expected=>{
     const d=document.querySelector('[aria-label="Vendor directory"]');
     const w=document.querySelector('[aria-label="Selected Vendor work"]');
     if(!d||!w)return false;
     const a=d.getBoundingClientRect(),b=w.getBoundingClientRect();
     return expected>=1024?b.x>=a.right-2:b.y>=a.bottom-2;
   },width);
   const left=await directory.boundingBox();
   const right=await workspace.boundingBox();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
   assert.ok(overflow<=2,`Vendor page must not overflow the ${width}px viewport; overflow=${overflow}px`);
   assert.equal(await tabs.evaluate(el=>getComputedStyle(el).display),'flex',
    'Tablist stays a scrollable horizontal Party-style strip at '+width);
   for(const [trigger,copy] of [
    ['Explain Vendor payable',/Goods taken from this vendor/],
    ['Explain Vendor receivable',/Money the vendor still owes/],
    ...(width>=640?[['Explain purchase due',/Unpaid regular purchase invoices/]]:[])
   ]){
    await workspace.getByRole('button',{name:trigger}).focus();
    const tip=workspace.getByRole('tooltip').filter({hasText:copy});
    const bounds=await tip.boundingBox();
    assert.ok(bounds,trigger+' explanation must be available from keyboard and touch focus');
    assert.ok(bounds.x>=-2&&bounds.x+bounds.width<=width+2,
     trigger+' tooltip must stay on-screen at '+width+': '+JSON.stringify(bounds));
   }
   if(width<640){
    assert.equal(left,null,'Phone hides the tall directory');
    assert.ok(right,'Phone shows the full vendor workspace');
    assert.equal(await page.getByRole('button',{name:'Choose Vendor'}).count(),1);
    assert.ok(await workspace.getByTestId('vendor-mobile-ledger').isVisible(),'Phone ledger uses mobile rows');
    assert.equal(await workspace.locator('table').first().isVisible(),false,'Phone hides the wide ledger table');
    assert.ok((await workspace.getByRole('button',{name:'More Vendor actions'}).count())===1,'Secondary desktop-named actions are still accessible');
    await workspace.getByRole('button',{name:'More Vendor actions'}).click();
    const more=page.getByRole('dialog',{name:'More Vendor actions'});
    await more.waitFor();
    for(const label of ['Give Products','New purchase','Print Ledger','Edit Vendor · তথ্য বদলান']){
     assert.equal(await more.getByRole('button',{name:label,exact:true}).count(),1,
      'Mobile preserves desktop button label: '+label);
    }
    await page.keyboard.press('Escape');
    await page.getByRole('button',{name:'Choose Vendor'}).click();
    const picker=page.getByRole('dialog',{name:'Choose Vendor'});
    await picker.waitFor();
    await picker.getByRole('textbox',{name:'Search Vendors'}).fill('Padma');
    await picker.getByRole('listbox',{name:'Vendors'}).getByRole('option',{name:/Padma Electric/}).click();
    await picker.waitFor({state:'hidden'});
    assert.ok(await workspace.getByText('৳240').count()>0,'Switching vendor updates balances in place');
    await page.getByRole('button',{name:'Choose Vendor'}).click();
    const secondPicker=page.getByRole('dialog',{name:'Choose Vendor'});
    await secondPicker.getByRole('textbox',{name:'Search Vendors'}).fill('Shapla');
    await secondPicker.getByRole('listbox',{name:'Vendors'}).getByRole('option',{name:/Shapla Transport/}).click();
    await secondPicker.waitFor({state:'hidden'});
   }else{
    assert.ok(left&&right,'Tablet and desktop retain the directory and selected detail');
    if(width>=1024){
     assert.ok(right.x>=left.x+left.width-2,'Desktop Vendor detail must sit right of directory');
     if(width>=1280)assert.ok(Math.abs(left.width-380)<3,'Desktop directory must match Parties width');
    }else{
     assert.ok(right.y>=left.y+left.height-2,'Tablet Vendor detail must stack after directory');
    }
   }
  }

  await page.setViewportSize({width:1440,height:900});
  await directory.getByRole('button',{name:/Needs price/}).click();
  await directory.getByRole('option',{name:/Shapla Transport/}).click();
  assert.ok(page.url().includes('partyId='),'Vendor selection should retain deep-link state');
  await directory.waitFor();
  await workspace.waitFor();
  await workspace.getByRole('tab',{name:/Taken/}).click();
  await workspace.getByRole('region',{name:'Taken product workplace'}).waitFor();

  await workspace.getByRole('button',{name:/Edit Vendor/}).click();
  await page.getByRole('dialog',{name:/Edit party/}).waitFor();
  await page.keyboard.press('Escape');
  await page.getByRole('dialog',{name:/Edit party/}).waitFor({state:'hidden'});

  await page.getByRole('button',{name:'Add Vendor'}).click();
  await page.getByRole('dialog',{name:/Add party/}).waitFor();
  await page.keyboard.press('Escape');

  await workspace.getByRole('tab',{name:/Payments/}).click();
  await workspace.getByRole('region',{name:'Vendor payments workspace'}).waitFor();
  assert.deepEqual(errors,[]);
  console.log('Vendor uses Parties split layout with in-place add/edit, preserved sourcing and payments, responsive at 390/768/1024/1440');
 }finally{
  await browser.close();
  await server.close();
 }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
