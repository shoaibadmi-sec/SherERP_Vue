/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Browser CLI uses CommonJS. */
const{chromium}=require('playwright');const assert=require('node:assert/strict');
async function main(){const{createServer}=await import('vite');const server=await createServer({server:{host:'127.0.0.1',port:4321,strictPort:true}});await server.listen();const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});try{for(const theme of ['light','dark'])for(const width of [320,390,768,1024,1440]){
 const context=await browser.newContext({viewport:{width,height:960},hasTouch:width<1024,reducedMotion:'reduce'});await context.addInitScript(t=>localStorage.setItem('hisabiq-theme',t),theme);const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));const root='http://127.0.0.1:4321/#/app/';await page.goto(root+'purchases/new');await page.getByRole('button',{name:/^Quick add LED Bulb 12W(?:\s|$)/}).click();
 const quantity=page.getByRole('textbox',{name:'Box quantity for LED Bulb 12W',exact:true});await quantity.fill('1.50');await quantity.press('ArrowUp');assert.equal(await quantity.inputValue(),'2.50');await quantity.press('ArrowDown');assert.equal(await quantity.inputValue(),'1.50');
 const cost=page.getByRole('textbox',{name:'Purchase cost for LED Bulb 12W',exact:true});await cost.fill('170.25');await cost.press('ArrowUp');assert.equal(await cost.inputValue(),'171.25');await cost.press('ArrowDown');assert.equal(await cost.inputValue(),'170.25');
 const wrapper=cost.locator('..');await cost.blur();await page.mouse.move(0,0);assert.equal(await wrapper.locator('[data-number-stepper]').evaluate(n=>Number(getComputedStyle(n).opacity)),0);
 const idle=await cost.evaluate(n=>({right:getComputedStyle(n).paddingRight,height:n.getBoundingClientRect().height}));await cost.hover();
 const hovered=await cost.evaluate(n=>({right:getComputedStyle(n).paddingRight,height:n.getBoundingClientRect().height}));
 assert.deepEqual(hovered,idle,'Hover must not move the numeric value or resize the input');
 await cost.focus();
 const focused=await cost.evaluate(n=>({right:getComputedStyle(n).paddingRight,height:n.getBoundingClientRect().height}));
 assert.deepEqual(focused,idle,'Focus must not move the numeric value or resize the input');
 const placement=await wrapper.evaluate(n=>{const a=n.getBoundingClientRect(),b=n.querySelector('[data-number-stepper]').getBoundingClientRect();return{vertical:Math.abs((a.top+a.bottom)/2-(b.top+b.bottom)/2),inside:b.top>=a.top&&b.bottom<=a.bottom};});
 assert.ok(placement.inside&&placement.vertical<=1,'Stepper arrows must be vertically centered inside the field');
 await page.waitForFunction(()=>{const n=document.querySelector('input[aria-label="Purchase cost for LED Bulb 12W"]').parentElement.querySelector('[data-number-stepper]');return Number(getComputedStyle(n).opacity)===1;});
 await page.getByRole('button',{name:'Increase Purchase cost for LED Bulb 12W',exact:true}).click();assert.equal(await cost.inputValue(),'171.25');assert.equal(await cost.evaluate(n=>document.activeElement===n),true);await page.getByRole('button',{name:'Decrease Purchase cost for LED Bulb 12W',exact:true}).click();assert.equal(await cost.inputValue(),'170.25');
 // Pointer actions must flow through React state and update actual computed totals.
 const subtotal=page.locator('[data-cart-kind="purchase"]').getByText(/Subtotal/).last();const totals=await subtotal.innerText();await page.getByRole('button',{name:'Increase Purchase cost for LED Bulb 12W',exact:true}).click();assert.notEqual(await subtotal.innerText(),totals);
 const paid=page.getByRole('textbox',{name:'Paid amount 1',exact:true});await paid.fill('12.50');await paid.press('ArrowUp');assert.equal(await paid.inputValue(),'13.50');await paid.press('ArrowDown');assert.equal(await paid.inputValue(),'12.50');
 await quantity.fill('0');await quantity.press('ArrowDown');assert.equal(await quantity.inputValue(),'0');await quantity.fill('2.');assert.equal(await quantity.inputValue(),'2.');await quantity.press('ArrowUp');assert.equal(await quantity.inputValue(),'3.');
 await quantity.press('Enter');const small=page.getByRole('textbox',{name:'Pcs quantity for LED Bulb 12W',exact:true});assert.equal(await small.evaluate(n=>document.activeElement===n),true,'Existing Enter quantity flow remains intact');await small.fill('5.25');await small.press('ArrowUp');assert.equal(await small.inputValue(),'6.25');
 await page.keyboard.press('F2');const search=page.getByRole('combobox',{name:'Search product to add to purchase'});assert.equal(await search.evaluate(n=>document.activeElement===n),true);assert.equal(await search.locator('..').locator('[data-number-stepper]').count(),0,'Search is not a numeric field');
 const bounds=await wrapper.boundingBox();const inputBounds=await cost.boundingBox();assert.ok(bounds&&inputBounds&&inputBounds.x>=bounds.x-1&&inputBounds.x+inputBounds.width<=bounds.x+bounds.width+1,'Input stays inside its original cell');
 if(process.env.NUMERIC_SCREENSHOTS){await search.press('Escape');await cost.focus();await cost.evaluate(n=>n.scrollIntoView({block:'center'}));await wrapper.locator('..').screenshot({path:process.env.NUMERIC_SCREENSHOTS+'/numeric-field-'+width+'-'+theme+'.png'});}
 await page.goto(root+'expenses');await page.getByRole('button',{name:'Add expense',exact:true}).click();const expense=page.getByRole('dialog',{name:'Add expense',exact:true});const amount=expense.getByRole('textbox',{name:'Expense amount',exact:true});await amount.fill('12.50');await amount.press('ArrowUp');assert.equal(await amount.inputValue(),'13.50');await expense.getByRole('button',{name:'Decrease Expense amount',exact:true}).click();assert.equal(await amount.inputValue(),'12.50');await expense.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.goto(root+'pos');
 const discount=page.getByRole('textbox',{name:'Discount',exact:true});
 await discount.blur();await page.mouse.move(0,0);
 const discountIdle=await discount.evaluate(n=>({right:getComputedStyle(n).paddingRight,height:n.getBoundingClientRect().height}));
 await discount.focus();
 assert.deepEqual(await discount.evaluate(n=>({right:getComputedStyle(n).paddingRight,height:n.getBoundingClientRect().height})),discountIdle,'Discount value must not shift when arrows appear');
 const single=page.locator('[data-testid="single-quantity"]').first();
 await single.locator('input').focus();
 const joined=await single.evaluate(n=>{const shell=n.getBoundingClientRect(),field=n.querySelector('[data-numeric-input]').getBoundingClientRect(),arrows=n.querySelector('[data-number-stepper]').getBoundingClientRect(),unit=n.lastElementChild.getBoundingClientRect();return{sameHeight:Math.abs(shell.height-field.height)<=3,noOverlap:arrows.right<=unit.left+1,centered:Math.abs((field.top+field.bottom)/2-(arrows.top+arrows.bottom)/2)<=1};});
 assert.ok(joined.sameHeight&&joined.noOverlap&&joined.centered,'Single quantity value, spinner and unit must stay in separate aligned areas');
 const posQuantity=page.locator('[data-testid="compound-quantity"] input').first();await posQuantity.fill('1.25');await posQuantity.press('ArrowUp');assert.equal(await posQuantity.inputValue(),'2.25');await posQuantity.press('ArrowDown');assert.equal(await posQuantity.inputValue(),'1.25');
 if(width<640){const row=page.locator('[data-cart-row="sale"][data-compound="true"]').first();const quantityBox=await row.getByTestId('compound-quantity').boundingBox();const rowBox=await row.boundingBox();assert.ok(quantityBox.width>rowBox.width*0.8,'Phone compound quantity uses a full readable row');}
 assert.deepEqual(errors,[]);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await context.close();console.log('Hover/focus steppers, exact whole-unit keys, React totals and Enter/F2 passed: '+width+'px '+theme);
 }}finally{await browser.close();await server.close();}}
main().catch(e=>{console.error(e);process.exitCode=1;});
