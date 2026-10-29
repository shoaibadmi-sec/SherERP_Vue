const {chromium}=require('playwright');
const assert=require('node:assert/strict');
async function main(){
  const {createServer}=await import('vite');
  const server=await createServer({server:{host:'127.0.0.1',port:4197,strictPort:true}});
  await server.listen();
  const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:900},reducedMotion:'reduce',acceptDownloads:true});
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  try{
    await page.goto('http://127.0.0.1:4197/#/app/parties?id=c1&role=Customer');
    await page.getByRole('button',{name:'Party ledger date range'}).click();
    await page.getByRole('dialog',{name:'Party ledger date range calendar'}).waitFor();
    await page.getByRole('button',{name:'Last month'}).click();
    await page.getByRole('dialog',{name:'Party ledger date range calendar'}).getByRole('button',{name:'Apply'}).click();
    await page.getByText('Opening balance',{exact:true}).first().waitFor();
    await page.getByRole('button',{name:/Actions for INV-000241/i}).count().then(x=>assert.equal(x,0,'October invoice excluded by September range'));
    await page.getByRole('button',{name:'Print statement'}).click();
    const statement=page.getByRole('dialog',{name:'Party ledger statement'});
    await statement.waitFor();
    assert.match(await statement.innerText(),/Opening balance/);
    assert.match(await statement.innerText(),/Closing balance/);
    await page.evaluate(()=>{window.__partyPrinted=false;window.print=()=>{window.__partyPrinted=true;};});
    await statement.getByRole('button',{name:'Print'}).click();
    assert.equal(await page.evaluate(()=>window.__partyPrinted),true);
    await statement.getByRole('button',{name:'Close'}).first().click();
    await page.getByRole('button',{name:'Clear filters'}).click();
    await page.getByRole('button',{name:/Actions for INV-000241/i}).click();
    await page.getByRole('button',{name:'View',exact:true}).click();
    await page.getByRole('dialog',{name:'Party transaction details'}).waitFor();
    await page.getByRole('dialog',{name:'Party transaction details'}).getByRole('button',{name:'Close'}).first().click();
    await page.setViewportSize({width:375,height:812});
    assert.deepEqual(errors,[]);
    console.log('Party ledger date, row actions, print and mobile smoke passed');
  }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
