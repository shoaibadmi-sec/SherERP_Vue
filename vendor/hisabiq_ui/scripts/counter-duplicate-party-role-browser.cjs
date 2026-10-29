/* Adding a missing Counter relationship must reuse an exact name + phone identity. */
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires -- Playwright CLI scripts use CommonJS. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ server:{host:'127.0.0.1',port:49272,strictPort:true} });
  await server.listen();
  const browser = await chromium.launch({ executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox'] });
  const page = await browser.newPage({viewport:{width:390,height:844},hasTouch:true,reducedMotion:'reduce'});
  try {
    await page.goto('http://127.0.0.1:49272/#/app/counter');
    await page.getByRole('heading',{name:'Transaction summary'}).waitFor();
    const before=await page.evaluate(async()=>{
      const {getPartyPreviewSnapshot}=await import('/src/data/partyPreviewStore.ts');
      const state=getPartyPreviewSnapshot();
      return {party:state.parties.find(p=>p.id==='c1'),sources:state.sources};
    });
    await page.locator('[role="group"][aria-label="Counter transaction type"] button').filter({hasText:'Supplier Pay'}).tap();
    const query=page.getByRole('textbox',{name:'Search supplier'});
    const amount=page.locator('input[aria-label="Payment source amount"]');
    await amount.fill('125');
    await query.fill('Rahman Hardware');
    await page.getByText('No matching parties').waitFor();
    const quickAdd=page.getByRole('button',{name:/Add.*as supplier/});
    for(let tabs=0;tabs<4&&!(await quickAdd.evaluate(element=>element===document.activeElement));tabs++)await page.keyboard.press('Tab');
    assert.equal(await quickAdd.evaluate(element=>element===document.activeElement),true,'keyboard navigation reaches contextual Quick Add');
    await page.keyboard.press('Enter');
    const dialog=page.getByRole('dialog',{name:'Add party'});
    await dialog.waitFor();
    await dialog.getByRole('textbox',{name:'Phone'}).fill('01711-482093');
    await dialog.getByRole('checkbox',{name:'Vendor',exact:true}).check();
    await dialog.getByRole('button',{name:'Save party'}).tap();
    await dialog.waitFor({state:'hidden'});
    const identities=await page.evaluate(async()=>{
      const {getPartyPreviewSnapshot}=await import('/src/data/partyPreviewStore.ts');
      return getPartyPreviewSnapshot().parties.filter(p=>p.name==='Rahman Hardware');
    });
    assert.equal(identities.length,1,'same name and phone reuse one existing identity');
    assert.deepEqual(identities[0],{...before.party,roles:['Customer','Supplier','Vendor']},'adding relationships preserves every saved profile field and all selected roles');
    assert.deepEqual(await page.evaluate(async()=>{
      const {getPartyPreviewSnapshot}=await import('/src/data/partyPreviewStore.ts');
      return getPartyPreviewSnapshot().sources;
    }),before.sources,'role addition does not replace historical opening or transaction sources');
    assert.equal(await query.inputValue(),'Rahman Hardware','the existing person is selected as supplier');
    assert.equal(await amount.inputValue(),'125','the parent payment amount survives role addition');
    await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='Search supplier');
    console.log('Counter same-person role addition preserves the Party ID');
  } finally {
    await browser.close();
    await server.close();
  }
}

main().catch(error=>{console.error(error);process.exitCode=1;});
