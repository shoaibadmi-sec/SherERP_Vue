/* HisabIQ Fast Counter POS visual and workflow regression. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');

async function main(){
  const {createServer}=await import('vite');
  const port=Number(process.env.POS_FAST_COUNTER_PORT||49328);
  const server=await createServer({cacheDir:'.superpowers/pos-fast-counter-cache',server:{host:'127.0.0.1',port,strictPort:true}});
  await server.listen();
  const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
  let cases=0;
  try{
    for(const [width,height] of [[320,700],[390,844],[768,1024],[1440,900]])
      for(const theme of ['light','dark'])
        for(const language of ['English','English + Bangla','Bangla']){
          const context=await browser.newContext({viewport:{width,height},hasTouch:width<=1024,colorScheme:theme,reducedMotion:'reduce'});
          const page=await context.newPage(),errors=[];
          page.on('pageerror',error=>errors.push(error.message));
          await page.route('https://fonts.googleapis.com/**',route=>route.abort());
          await page.addInitScript(({theme,language})=>{
            localStorage.setItem('hisabiq-theme',theme);
            localStorage.setItem('hisabiq-erp-personal-v1',JSON.stringify({mode:'Simple',language,density:'Compact',terminology:'simple',dateView:'transaction'}));
          },{theme,language});
          const contextId=width+'px '+theme+' '+language;
          const labels=(en,bn)=>new RegExp(en+'|'+bn);
          try{
            await page.goto('http://127.0.0.1:'+port+'/#/app/pos');
            const checkout=page.locator('[data-pos-checkout]');
            await checkout.waitFor();
            const initialRows=await page.getByTestId('pos-cart-row').count();
            assert.ok(initialRows>0,contextId+' cart remains present');
            const toggle=checkout.getByTestId('pos-invoice-details-toggle');
            assert.equal(await toggle.getAttribute('aria-expanded'),'false',contextId+' invoice details start collapsed');
            const invoiceChevron=toggle.locator('svg.lucide-chevron-down');
            assert.equal(await invoiceChevron.count(),1,contextId+' invoice details uses one chevron');
            assert.doesNotMatch((await toggle.innerText()).trim(),/^[+−]/,contextId+' no plus/minus prefix in invoice details label');
            const details=checkout.locator('[data-pos-customer-fields]');
            assert.equal(await details.isVisible(),false,contextId+' optional fields hidden until requested');
            assert.ok(await checkout.getByRole('button',{name:labels('Enter customer details','ক্রেতার তথ্য দিন')}).isVisible(),contextId+' due warning has direct next action');
            const modeGroup=checkout.getByRole('group',{name:labels('Sale type','বিক্রির ধরন')});
            const regular=modeGroup.getByRole('button',{name:labels('Regular sale','সাধারণ বিক্রি')});
            const installment=modeGroup.getByRole('button',{name:labels('Installment sale','কিস্তিতে বিক্রি')});
            assert.equal(await regular.getAttribute('aria-pressed'),'true',contextId+' regular sale is active');
            assert.equal(await regular.getAttribute('data-variant'),'default',contextId+' selected mode uses shared primary Button');
            assert.equal(await installment.getAttribute('data-variant'),'outline',contextId+' inactive mode uses shared outlined Button');
            const saleColors=await modeGroup.locator('button').evaluateAll(items=>items.map(item=>getComputedStyle(item).backgroundColor));
            assert.notEqual(saleColors[0],saleColors[1],contextId+' green sale modes show selected state');
            await installment.click();
            assert.equal(await installment.getAttribute('aria-pressed'),'true',contextId+' installment mode selected');
            assert.equal(await installment.getAttribute('data-variant'),'default',contextId+' installment now uses primary Button');
            await checkout.getByText(labels('Installment terms','কিস্তির হিসাব')).first().waitFor();
            await regular.click();
            assert.equal(await regular.getAttribute('aria-pressed'),'true',contextId+' switching back restores regular mode');
            assert.equal(await checkout.getByText(labels('Installment terms','কিস্তির হিসাব')).count(),0,contextId+' installment terms hidden again');
            const payable=checkout.locator('[data-pos-payable]');
            const words=payable.locator('[data-amount-words-variant="compact"]');
            await words.waitFor();
            const style=await payable.evaluate(root=>{
              const price=root.querySelector('p');
              const words=root.querySelector('[lang="bn"]');
              const box=root.getBoundingClientRect();
              return {price:parseFloat(getComputedStyle(price).fontSize),words:parseFloat(getComputedStyle(words).fontSize),
                scroll:root.scrollWidth-root.clientWidth,left:box.left,right:box.right,viewport:innerWidth};
            });
            assert.ok(style.price>=28&&style.price<=30,contextId+' total is slightly reduced: '+JSON.stringify(style));
            assert.ok(style.words>=14&&style.words<=15,contextId+' words stay legible while slightly smaller: '+JSON.stringify(style));
            assert.ok(style.scroll<=1&&style.left>=-2&&style.right<=width+2,contextId+' payable does not overflow');

            // Contrast is measured against the *composited* surface, not a nominal palette swatch.
            // This catches inverted teal scale mistakes that only appear with html.dark.
            const contrasts=await payable.evaluate(root=>{
              const parse=str=>{
                const match=str.match(/rgba?\(([^)]+)\)/);
                if(!match)throw new Error('Unsupported CSS color: '+str);
                const fields=match[1].replace('/',',').trim().split(/[,\s]+/).filter(Boolean).map(Number);
                return [...fields.slice(0,3),fields[3]??1];
              };
              const background=el=>{
                const ancestors=[];
                for(let node=el;node;node=node.parentElement)ancestors.unshift(node);
                return ancestors.reduce((base,node)=>{
                  const rgba=parse(getComputedStyle(node).backgroundColor),alpha=rgba[3];
                  return rgba.slice(0,3).map((v,i)=>v*alpha+base[i]*(1-alpha));
                },[255,255,255]);
              };
              const luminance=rgb=>{
                const linear=rgb.slice(0,3).map(v=>{
                  const c=v/255;
                  return c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4;
                });
                return linear[0]*0.2126+linear[1]*0.7152+linear[2]*0.0722;
              };
              const ratio=el=>{
                const fg=parse(getComputedStyle(el).color);
                const a=luminance(fg),b=luminance(background(el));
                return (Math.max(a,b)+0.05)/(Math.min(a,b)+0.05);
              };
              const words=root.querySelector('[data-amount-words-variant="compact"]');
              const label=words.querySelector('p');
              const value=words.querySelector('[lang="bn"]');
              return {label:ratio(label),value:ratio(value),
                labelColor:getComputedStyle(label).color,wordsBackground:getComputedStyle(words).backgroundColor,
                payableBorder:getComputedStyle(root).borderColor};
            });
            assert.ok(contrasts.label>=4.5,contextId+' words label contrast below AA: '+JSON.stringify(contrasts));
            assert.ok(contrasts.value>=4.5,contextId+' Bangla amount contrast below AA: '+JSON.stringify(contrasts));

            await toggle.click();
            assert.equal(await toggle.getAttribute('aria-expanded'),'true',contextId+' customer details open');
            assert.match(await invoiceChevron.getAttribute('class'),/rotate-180/,contextId+' chevron rotates when details expand');
            const name=details.getByRole('textbox',{name:labels('Customer name','ক্রেতার নাম')});
            const phone=details.getByRole('textbox',{name:labels('Customer phone','ক্রেতার ফোন')});
            await name.fill('Fast Counter Test');
            await phone.fill('01799008877');
            await toggle.click();
            assert.equal(await details.isVisible(),false,contextId+' fields collapse');
            assert.match(await toggle.innerText(),/Fast Counter Test/,contextId+' compact summary reflects entered customer');
            await toggle.click();
            assert.equal(await name.inputValue(),'Fast Counter Test',contextId+' collapse preserves customer data');
            assert.equal(await phone.inputValue(),'01799008877',contextId+' collapse preserves phone');
            assert.equal(await page.getByTestId('pos-cart-row').count(),initialRows,contextId+' cart unchanged');
            await checkout.getByRole('button',{name:labels('Quick add customer','নতুন ক্রেতা যোগ করুন')}).click();
            const quickAdd=page.getByRole('dialog',{name:labels('Quick add customer','নতুন ক্রেতা যোগ করুন')});
            await quickAdd.waitFor();
            await quickAdd.getByRole('button',{name:labels('Cancel','বাতিল')}).click();
            await quickAdd.waitFor({state:'hidden'});
            assert.equal(await name.inputValue(),'Fast Counter Test',contextId+' cancel quick add keeps draft');
            // Selected customer stays a compact 36px two-line picker: full ledger due is inline.
            const customerPicker=checkout.getByTestId('pos-customer-picker-trigger');
            await customerPicker.click();
            const search=page.getByTestId('pos-customer-picker-search');
            await search.fill('Rahman');
            await search.press('Enter');
            const previousDue=checkout.locator('[data-pos-previous-balance-inline]');
            await previousDue.waitFor({state:'visible'});
            const expectedBalance=await page.evaluate(async()=>{
              const {getPartyPreviewSnapshot}=await import('/src/data/partyPreviewStore.ts');
              const {customerSettlementAsOf}=await import('/src/utils/partySettlement.ts');
              const {businessToday}=await import('/src/utils/dateRange.ts');
              const {taka}=await import('/src/utils/currency.ts');
              const snap=getPartyPreviewSnapshot();
              const customer=snap.parties.find(p=>p.name==='Rahman Hardware');
              const balance=customerSettlementAsOf(snap.sources,customer.id,businessToday()).netBalance;
              return {balance,display:taka(Math.abs(balance))};
            });
            assert.ok(expectedBalance.balance>0,contextId+' fixture has an existing customer due');
            assert.equal(await previousDue.getAttribute('data-balance-type'),'due',contextId+' due uses semantic red state');
            assert.ok((await previousDue.innerText()).includes(expectedBalance.display),contextId+' exact previous due shown');
            assert.ok((await previousDue.innerText()).includes(language==='Bangla'?'আগের বাকি':'Prev. due'),contextId+' due clearly labelled');
            assert.equal(await checkout.locator('[data-pos-previous-balance]').count(),0,contextId+' standalone due row removed');
            assert.equal(await customerPicker.locator('svg.lucide-chevron-down').count(),0,contextId+' arrow is replaced by X');
            const clearCustomer=checkout.getByTestId('pos-customer-clear-inline');
            const geometry=await checkout.evaluate(root=>{
              const picker=root.querySelector('[data-testid="pos-customer-picker-trigger"]');
              const clear=root.querySelector('[data-testid="pos-customer-clear-inline"]');
              const plus=root.querySelector('[aria-label="Quick add customer"],[aria-label="নতুন ক্রেতা যোগ করুন"]');
              const due=root.querySelector('[data-pos-previous-balance-inline]');
              const a=picker.getBoundingClientRect(),shell=picker.parentElement.getBoundingClientRect(),x=clear.getBoundingClientRect(),b=plus.getBoundingClientRect(),d=due.getBoundingClientRect();
              return {pickerHeight:shell.height,pickerRight:a.right,clearRight:x.right,plusLeft:b.left,
                dueRight:d.right,dueLeft:d.left,dueScroll:due.scrollWidth-due.clientWidth,
                clearParent:clear.parentElement===picker.parentElement,viewport:innerWidth};
            });
            assert.ok(Math.abs(geometry.pickerHeight-36)<=1,contextId+' picker follows the 36px ERP standard');
            assert.ok(geometry.clearParent&&geometry.clearRight<geometry.plusLeft,contextId+' X stays inside selector, before +');
            assert.ok(geometry.dueLeft>=0&&geometry.dueRight<=geometry.pickerRight+1&&geometry.dueScroll<=1,
              contextId+' inline due is fully visible: '+JSON.stringify(geometry));
            await customerPicker.click();
            await search.waitFor({state:'visible'});
            await search.fill('Rahman');
            await page.keyboard.press('Escape');
            await clearCustomer.click();
            await previousDue.waitFor({state:'hidden'});
            assert.equal(await clearCustomer.count(),0,contextId+' selected-customer X disappears on clear');
            assert.equal(await checkout.getByTestId('pos-customer-picker-trigger').locator('svg.lucide-chevron-down').count(),1,
              contextId+' unselected picker shows dropdown arrow');
            assert.equal(await page.getByTestId('pos-cart-row').count(),initialRows,contextId+' switching customer preserves cart');

            await checkout.getByRole('button',{name:labels('Exact','পুরো টাকা'),exact:true}).click();
            const preview=checkout.getByRole('button',{name:labels('Preview sale','বিক্রির হিসাব দেখুন')});
            assert.equal(await preview.isEnabled(),true,contextId+' fully paid sale can be previewed');
            assert.equal(await preview.getAttribute('data-variant'),'default',contextId+' checkout uses primary variant');
            // Both controls deliberately reuse Button's default primary variant.
            // An instantaneous computed background comparison is unstable while the
            // checkout CTA transitions between enabled and disabled styles.
            const primaryClasses=await preview.evaluate(action=>{
              const mode=action.closest('[data-pos-checkout]').querySelector('[role="group"][aria-label="Sale type"],[role="group"][aria-label="বিক্রির ধরন"]');
              const active=mode.querySelector('button[aria-pressed="true"]');
              return {mode:active.classList.contains('bg-primary'),action:action.classList.contains('bg-primary')};
            });
            assert.equal(primaryClasses.mode,true,contextId+' active sale mode uses primary background token');
            assert.equal(primaryClasses.action,true,contextId+' checkout action uses same primary background token');
            await preview.click();
            const review=page.getByRole('dialog',{name:labels('Review sale','বিক্রির হিসাব যাচাই')});
            await review.waitFor();
            await review.getByRole('button',{name:labels('Edit details','সংশোধন করুন')}).click();
            await review.waitFor({state:'hidden'});
            assert.equal(await page.getByTestId('pos-cart-row').count(),initialRows,contextId+' closing review preserves sale');
            assert.deepEqual(errors,[],contextId+' no runtime errors');
            cases++;
            console.log('PASS '+contextId);
          }finally{await context.close();}
        }
    console.log('Fast Counter POS passed '+cases+'/24 journeys');
  }finally{await browser.close();await server.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
