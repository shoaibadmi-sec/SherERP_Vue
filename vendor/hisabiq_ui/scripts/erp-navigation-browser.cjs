const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
 const {createServer}=await import('vite');
 const server=await createServer({server:{host:'127.0.0.1',port:4238,strictPort:true}});
 await server.listen();
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1330,height:890},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base='http://127.0.0.1:4238/#';
 try{
  await page.goto(base+'/app/quotations');
  const nav=page.getByRole('navigation',{name:'Main'});
  await nav.getByRole('link',{name:/Dashboard/}).waitFor();
  const firstThree=await nav.locator(':scope > div > div > a, :scope > div > div > button').evaluateAll(nodes=>nodes.slice(0,3).map(node=>node.getAttribute('href')?.split('#')[1]));
  assert.deepEqual(firstThree,['/app/dashboard','/app/pos','/app/counter'],'most-used modules come first');
  await nav.getByRole('link',{name:/Counter/}).click();
  assert.ok(page.url().includes('/app/counter'),'Counter has its own top-level route');
  await page.getByRole('group',{name:'Counter actions'}).getByRole('button',{name:/Customer Receive/}).waitFor();
  assert.equal(await nav.getByRole('link',{name:/Counter/}).getAttribute('aria-current'),'page');
  await page.goto(base+'/app/quotations');
  await nav.getByRole('link',{name:/Quotations & Estimates/}).waitFor();
  assert.equal(await nav.getByRole('link',{name:/Quotations & Estimates/}).getAttribute('aria-current'),'page');
  assert.equal(await nav.getByRole('button',{name:'Collapse Sales'}).getAttribute('aria-expanded'),'true');
  const before=page.url();
  await nav.getByRole('button',{name:'Expand Purchases'}).click();
  assert.equal(page.url(),before,'opening a group must not navigate away');
  assert.equal(await nav.getByRole('button',{name:'Collapse Purchases'}).getAttribute('aria-expanded'),'true');
  await page.keyboard.press('Enter');
  assert.equal(page.url(),before);
  assert.equal(await nav.getByRole('button',{name:'Expand Purchases'}).getAttribute('aria-expanded'),'false',
    'Enter on a focused group trigger toggles its expanded state');
  await nav.getByRole('button',{name:'Expand Purchases'}).click();

  // Clicking the text or chevron on a parent row must have identical behavior.
  const purchasesTrigger=nav.getByRole('button',{name:'Expand Purchases'});
  await nav.getByRole('button',{name:'Collapse Purchases'}).click({position:{x:82,y:20}});
  assert.equal(page.url(),before,'parent label must only collapse its group');
  assert.equal(await purchasesTrigger.getAttribute('aria-expanded'),'false');
  await purchasesTrigger.locator('svg:last-child').click();
  assert.equal(page.url(),before,'parent chevron must only expand its group');
  assert.equal(await nav.getByRole('button',{name:'Collapse Purchases'}).getAttribute('aria-expanded'),'true');
  await nav.getByRole('link',{name:/Purchase Bills/}).click();
  assert.ok(page.url().includes('/app/purchases'),'child link must navigate to its module');
  await page.goto(base+'/app/sales?tab=return');
  await page.getByRole('tab',{name:'Sales return'}).waitFor();
  assert.equal(await page.getByRole('tab',{name:'Sales return'}).getAttribute('aria-selected'),'true');
  await page.goto(base+'/app/purchases?tab=return');
  await page.getByRole('tab',{name:'Purchase return'}).waitFor();
  assert.equal(await page.getByRole('tab',{name:'Purchase return'}).getAttribute('aria-selected'),'true');
  await page.goto(base+'/app/parties?role=Supplier');
  await nav.getByRole('link',{name:'Suppliers'}).waitFor();
  assert.equal(await nav.getByRole('link',{name:'Suppliers'}).getAttribute('aria-current'),'page');
  await page.goto(base+'/app/parties?id=v1&role=Vendor');
  await nav.getByRole('link',{name:'Vendors'}).waitFor();
  assert.equal(await nav.getByRole('link',{name:'Vendors'}).getAttribute('aria-current'),'page');
  await page.goto(base+'/app/products?view=lots');
  assert.equal(await nav.getByRole('link',{name:/Stock, Lots & Adjustments/}).getAttribute('aria-current'),'page');
  await page.goto(base+'/app/notifications');
  assert.equal(await nav.getByRole('link',{name:/Notifications & SMS/}).getAttribute('aria-current'),'page');
  await page.getByRole('button',{name:'Collapse sidebar'}).click();
  const sidebar=page.locator('aside[data-sidebar="sidebar"]');
  assert.equal(await sidebar.getAttribute('data-collapsible'),'icon');
  assert.ok(await nav.getByRole('link',{name:'Dashboard'}).isVisible(),'icon-only leaf links remain usable');
  assert.ok(await nav.getByRole('button',{name:/Expand sidebar to open Sales/}).isVisible());
  await nav.getByRole('button',{name:/Expand sidebar to open Sales/}).click();
  assert.equal(await sidebar.getAttribute('data-collapsible'),'none');
  assert.equal(await nav.getByRole('button',{name:'Collapse Sales'}).getAttribute('aria-expanded'),'true');
  await nav.getByRole('link',{name:/Sales History/}).waitFor();

  await page.keyboard.press('Control+b');
  assert.equal(await sidebar.getAttribute('data-collapsible'),'icon','shadcn sidebar shortcut collapses');
  await page.reload();
  assert.equal(await sidebar.getAttribute('data-collapsible'),'icon','sidebar preference persists after refresh');
  await page.getByRole('button',{name:'Expand sidebar',exact:true}).click();
  assert.equal(await sidebar.getAttribute('data-collapsible'),'none');

  await page.setViewportSize({width:375,height:812});
  await page.goto(base+'/app/sales');
  await page.getByRole('button',{name:'Open ERP navigation'}).click();
  const drawer=page.getByRole('dialog',{name:'ERP navigation'});
  await drawer.waitFor();
  // Regression: a sticky, backdrop-blurred header must never confine the mobile sheet.
  const assertFullscreen=async(width,height)=>{
    // Dynamic viewport units settle on the next layout after a tablet resize.
    // Wait for the required geometry; preserve all fullscreen assertions below.
    await page.waitForFunction(({width,height})=>{
      const sheet=document.getElementById('erp-mobile-drawer');
      const bounds=sheet?.getBoundingClientRect();
      return innerWidth===width&&innerHeight===height&&bounds&&Math.abs(bounds.y)<2&&bounds.height>=height-2;
    },{width,height});
    const bounds=await drawer.boundingBox();
    assert.ok(bounds && Math.abs(bounds.y)<2 && bounds.height>=height-2,
      'mobile sheet must cover viewport height, not just the sticky header');
    assert.ok(bounds.width<=Math.min(320,width) + 1,
      'mobile sheet should have a comfortable max-width');
    assert.equal(await drawer.evaluate(node=>node.parentElement?.parentElement===document.body),true,
      'mobile sheet must live outside backdrop-filter header containing block');
    assert.equal(await page.evaluate(()=>document.body.style.overflow),'hidden',
      'opening a mobile sheet prevents page scrolling underneath');
    assert.ok(await page.evaluate(()=>Boolean(document.elementFromPoint(25,Math.min(250,innerHeight-20))?.closest('#erp-mobile-drawer'))),
      'sheet must intercept taps below the top bar');
  };
  await assertFullscreen(375,812);
  await page.setViewportSize({width:695,height:880});
  await assertFullscreen(695,880);
  await page.setViewportSize({width:375,height:812});
  await drawer.getByRole('link',{name:/Quotations & Estimates/}).click();
  await drawer.waitFor({state:'hidden'});
  assert.ok(page.url().includes('/app/quotations'));
  await page.getByRole('button',{name:'Open ERP navigation'}).click();
  assert.equal(await page.getByRole('dialog',{name:'ERP navigation'}).getByRole('link',{name:/Quotations & Estimates/}).getAttribute('aria-current'),'page');
  await page.keyboard.press('Escape');
  await drawer.waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>document.body.style.overflow),'',
    'closing mobile sheet restores document scrolling');
  assert.equal(await page.getByRole('button',{name:'Open ERP navigation'}).evaluate(el=>el===document.activeElement),true,
    'Escape should restore keyboard focus to the nav trigger');
  await page.setViewportSize({width:768,height:1024});
  await page.getByRole('button',{name:'Open ERP navigation'}).click();
  const mobile=page.getByRole('dialog',{name:'ERP navigation'});
  await mobile.getByRole('button',{name:'Expand Settings'}).click({position:{x:90,y:20}});
  await mobile.getByRole('link',{name:/Business & General/}).waitFor();
  assert.equal(await mobile.getByRole('button',{name:'Collapse Settings'}).getAttribute('aria-expanded'),'true');
  assert.deepEqual(errors,[]);
  console.log('ERP navigation: routes, nested active links, tab deep links, collapsed sidebar and mobile drawer passed');
 }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
