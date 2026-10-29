const { chromium } = require('playwright');
const assert = require('node:assert/strict');

async function main() {
  const { createServer } = await import('vite');
  const server = await createServer({ server: { host:'127.0.0.1',port:4196,strictPort:true }});
  await server.listen();
  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args:['--no-sandbox'] });
  const page = await browser.newPage({ viewport:{width:1280,height:900},reducedMotion:'reduce' });
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  try {
    // Detect horizontal layout shifts caused by disappearing scrollbars when
    // a long Party ledger switches to a short tab or a modal locks the body.
    // The header and workspace must keep EXACTLY the same width at each step.
    const geometryPage=await browser.newPage({viewport:{width:1440,height:620},
      reducedMotion:'reduce'});
    const geometryErrors=[];
    geometryPage.on('pageerror',e=>geometryErrors.push(e.message));
    const layout=()=>geometryPage.evaluate(()=>{
      const root=document.querySelector('.erp-workspace');
      const header=document.querySelector('header[data-print-hide]');
      const rect=root.getBoundingClientRect(),top=header.getBoundingClientRect();
      return {width:rect.width,x:rect.x,headerX:top.x,headerWidth:top.width,
        viewport:window.innerWidth,client:document.documentElement.clientWidth,
        gutter:getComputedStyle(document.documentElement).scrollbarGutter,
        scrolling:document.documentElement.scrollHeight>window.innerHeight+8};
    });
    const stable=(before,after,context)=>{
      for(const key of ['width','x','headerX','headerWidth','client'])
        assert.ok(Math.abs(after[key]-before[key])<=1,
          context+': '+key+' shifted '+before[key]+' → '+after[key]);
    };
    await geometryPage.goto('http://127.0.0.1:4196/#/app/parties?id=c1&role=Customer');
    await geometryPage.getByRole('tab',{name:/Ledger/}).waitFor();
    const initial=await layout();
    assert.equal(initial.gutter,'stable','Root reserves permanent scrollbar gutter');
    assert.ok(initial.scrolling,'Desktop ledger is longer than the test viewport');
    await geometryPage.getByRole('tab',{name:/Notes/}).click();
    const shortTab=await layout();
    stable(initial,shortTab,'Ledger to Notes');
    await geometryPage.getByRole('tab',{name:/Invoices/}).click();
    stable(initial,await layout(),'Notes to Invoices');
    await geometryPage.getByRole('tab',{name:/Ledger/}).click();
    stable(initial,await layout(),'Invoices to Ledger');
    await geometryPage.getByRole('button',{name:'Receive payment'}).first().click();
    const paymentModal=geometryPage.locator('[data-dialog-root]').first();
    await paymentModal.waitFor();
    assert.equal(await geometryPage.evaluate(()=>document.body.style.overflow),'hidden');
    stable(initial,await layout(),'Opening payment modal');
    await geometryPage.keyboard.press('Escape');
    await paymentModal.waitFor({state:'hidden'});
    stable(initial,await layout(),'Closing payment modal');
    assert.notEqual(await geometryPage.evaluate(()=>document.body.style.overflow),'hidden');
    assert.deepEqual(geometryErrors,[],'No errors during tab/modal transitions');
    await geometryPage.close();

    await page.goto('http://127.0.0.1:4196/#/app/parties');
    await page.getByRole('button',{name:/Add party/i}).click();
    const dialog=page.getByRole('dialog');
    assert.equal(await dialog.getAttribute('data-modal-motion'),'reduced',
      'Dialog instantly opens when reduced motion is requested');
    await dialog.getByLabel('Party name').fill('New Party QA');
    await dialog.getByLabel('Bangla name').fill('নতুন পার্টি');
    await dialog.getByLabel('Phone').fill('01799990000');
    await dialog.getByLabel('Area').fill('Dhaka');
    await dialog.getByRole('checkbox',{name:'Supplier'}).check();
    await dialog.getByRole('button',{name:/Save party/i}).click();
    await page.getByRole('heading',{name:'New Party QA'}).waitFor();
    assert.match(page.url(),/id=party-preview-/);
    await page.getByRole('combobox',{name:'Relationship'}).click();
    await page.getByRole('listbox',{name:'Relationship options'}).getByRole('option',{name:'Supplier',exact:true}).click();
    assert.match(page.url(),/role=Supplier/);
    await page.getByRole('button',{name:'More',exact:true}).click();
    await page.getByRole('dialog',{name:'More actions'})
      .getByRole('menuitem',{name:/Edit party/i}).click();
    await dialog.getByLabel('Phone').fill('01888880000');
    await dialog.getByRole('button',{name:/Save party/i}).click();
    await page.locator(':text-is("01888880000"):visible').first().waitFor();
    await page.getByRole('tab',{name:/Notes/}).click();
    await page.getByRole('textbox',{name:'New note'}).fill('Ask for receipt');
    await page.getByRole('textbox',{name:'New note'}).locator('..').getByRole('button',{name:'Add note'}).click();
    await page.getByText('Ask for receipt').first().waitFor();
    await page.getByRole('button',{name:/Edit note Ask for receipt/i}).click();
    await page.getByRole('textbox',{name:'Edit note'}).fill('Bring receipt');
    await page.getByRole('button',{name:/Save note/i}).click();
    await page.getByText('Bring receipt').first().waitFor();
    await page.getByRole('button',{name:/Delete note Bring receipt/i}).click();
    await page.getByRole('button',{name:'Confirm delete'}).click();
    assert.equal(await page.getByText('Bring receipt').count(),0);
    // The directory search must include the Bangla display name.
    await page.getByRole('textbox',{name:'Search parties'}).fill('নতুন');
    assert.ok(await page.getByText('New Party QA',{exact:true}).count() >= 1);
    await page.getByRole('textbox',{name:'Search parties'}).fill('');
    await page.getByRole('button',{name:/Import Excel/i}).click();
    await page.getByRole('dialog',{name:'Choose Party import type'})
      .getByRole('button',{name:'Legacy multi-role CSV'}).click();
    await page.getByLabel('Select CSV file').setInputFiles({
      name:'parties.csv',mimeType:'text/csv',
      buffer:Buffer.from('name,nameBn,phone,area,roles\nCSV Supplier QA,সিএসভি,01700990011,Sylhet,Supplier|Customer\n')
    });
    await page.getByRole('button',{name:/Import 1 parties/}).click();
    await page.locator(':text-is("CSV Supplier QA"):visible').first().waitFor();
    // Magic Patterns adaptive Party workspace: one selected profile plus a chooser on narrow viewports.
    await page.setViewportSize({width:375,height:800});
    await page.getByRole('button',{name:'Change party'}).click();
    const choose=page.getByRole('dialog',{name:'Change party'});
    await choose.getByRole('textbox',{name:'Search parties'}).fill('CSV Supplier QA');
    await choose.getByRole('option',{name:/CSV Supplier QA/}).click();
    await choose.waitFor({state:'hidden'});
    await page.getByRole('heading',{name:/CSV Supplier QA/}).waitFor();
    // Verify the exact payable example on the seeded supplier; new imports start at zero.
    await page.goto('http://127.0.0.1:4196/#/app/parties?id=s1&role=Supplier');
    await page.getByRole('heading',{name:/Karim Traders/}).waitFor();
    // Supplier screenshot contract: compact horizontal owed-card plus just the three actions.
    const supplierCard=page.locator('[data-testid="party-balance-card"]:visible').first();
    assert.equal(await supplierCard.evaluate(el=>getComputedStyle(el).display),'grid');
    assert.ok(await supplierCard.getByText('Supplier payable').isVisible());
    assert.ok(await supplierCard.getByText('You owe them',{exact:false}).isVisible());
    const supplierActions=page.getByTestId('party-mobile-actions');
    assert.equal(await supplierActions.locator('button:visible').count(),3);
    assert.ok(await supplierActions.getByRole('button',{name:'Make payment'}).isVisible());
    assert.ok(await supplierActions.getByRole('button',{name:'New invoice'}).isVisible());
    assert.ok(await supplierActions.getByRole('button',{name:'More actions'}).isVisible());
    assert.ok(!(await page.getByTestId('party-last-activity').isVisible()));
    await page.getByRole('button',{name:'More actions'}).click();
    const actionSheet=page.getByRole('dialog',{name:'More actions'});
    await actionSheet.getByRole('button',{name:/opening balance/i}).waitFor();
    const disabledRefund=actionSheet.getByRole('button',{name:/Refund credit/i});
    assert.ok(await disabledRefund.isDisabled(),'Mobile More retains the existing verified-credit gate');
    await actionSheet.getByRole('button',{name:/Print statement/}).waitFor();
    await actionSheet.getByRole('button',{name:/Edit party/}).waitFor();
    await actionSheet.getByRole('button',{name:/Send statement/}).isDisabled().then(ok=>assert.ok(ok));
    await page.keyboard.press('Escape');
    await page.getByRole('dialog',{name:'More actions'}).waitFor({state:'hidden'});
    // Switch from an empty newly imported supplier to the seeded customer ledger.
    await page.goto('http://127.0.0.1:4196/#/app/parties?id=c1&role=Customer');
    const ledgerFeed=page.getByRole('list',{name:'Transactions'});
    assert.equal(await ledgerFeed.getByRole('button',{name:'View',exact:true}).count(),0,'no standalone View buttons in ledger feed');
    await ledgerFeed.getByRole('button',{name:/View transaction/}).first().click();
    const transaction=page.getByRole('dialog',{name:'Party transaction details'});
    await transaction.waitFor();
    await transaction.getByRole('button',{name:'Close'}).first().click();

    // Screenshot-inspired Rows popup: rounded upward menu, checkmark, and real page-size updates.
    const rowsControl=page.getByRole('combobox',{name:'Rows per page'});
    await rowsControl.click();
    const rowOptions=page.getByRole('listbox',{name:'Rows per page options'});
    await rowOptions.waitFor();
    assert.equal(await rowOptions.getAttribute('data-menu-style'),'rows');
    const availableSizes=await rowOptions.locator('[role="option"]').evaluateAll(options=>
      options.map(option=>option.getAttribute('data-value')));
    assert.deepEqual(availableSizes,['5','10','25','50','100'],'Rows popup includes every configured page size');
    const rowsRect=await rowsControl.boundingBox();
    const popupRect=await rowOptions.boundingBox();
    assert.ok(rowsRect&&popupRect&&popupRect.y+popupRect.height<=rowsRect.y+4,
      'Ledger Rows menu opens above the footer when there is no space below');
    await rowOptions.getByRole('option',{name:'5',exact:true}).click();
    assert.equal(await rowsControl.getAttribute('data-value'),'5','Rows changes actual pagination size');
    await rowsControl.click();
    const selectedFive=rowOptions.getByRole('option',{name:'5',exact:true});
    assert.equal(await selectedFive.getAttribute('aria-selected'),'true','Rows selected state remains accessible');
    assert.ok(await selectedFive.locator('svg').count()>0,'Selected Rows option displays a checkmark');
    await rowOptions.getByRole('option',{name:'10',exact:true}).click();
    assert.equal(await rowsControl.getAttribute('data-value'),'10');
    await rowsControl.focus();
    await page.keyboard.press('ArrowDown');
    await rowOptions.waitFor();
    await page.keyboard.press('Escape');
    await rowOptions.waitFor({state:'hidden'});

    for(const width of [320,360,390,600,768,820,960,1000,1024,1280,1440]){
      await page.setViewportSize({width,height:900});
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
      assert.ok(overflow<=4,`Party ${width}px should not overflow horizontally (extra ${overflow}px)`);
      assert.equal(await page.getByRole('list',{name:'Transactions'}).isVisible(),width<768,`Party ${width}px uses transaction feed only on phones`);
      assert.equal(await page.locator('table').first().isVisible(),width>=768,`Party ${width}px uses compact ledger table on tablet/desktop`);
      assert.ok(await page.getByRole('button',{name:'Change party'}).isVisible(),`Change Party control is reachable at ${width}px`);
      if(width>=768){
        const heading=page.getByRole('heading',{name:'Parties & Ledger'});
        assert.ok(await heading.isVisible(),`Party page title stays visible at ${width}px`);
        assert.equal(await page.getByText('Everyone you deal with, in one place').count(),0,`No redundant introductory sentence at ${width}px`);
        const buttons=[
          page.getByRole('button',{name:'Import Excel / CSV'}),
          page.getByRole('button',{name:'Add party'}),
          page.getByRole('button',{name:'Change party'})
        ];
        for(const button of buttons)assert.ok(await button.isVisible(),`All Party header buttons visible at ${width}px`);
        const headingRect=await heading.boundingBox();
        const positions=await Promise.all(buttons.map(button=>button.boundingBox()));
        assert.ok(headingRect&&positions.every(Boolean),`Party header coordinates available at ${width}px`);
        assert.ok(positions.every(rect=>Math.abs(rect.y-positions[0].y)<3),`Header actions stay in one row at ${width}px`);
        assert.ok(positions[0].x>=headingRect.x+headingRect.width-5,`Header actions right aligned at ${width}px`);
        assert.ok(Math.abs(positions[0].y-headingRect.y)<14,`Header actions align with the title at ${width}px`);
        // Previous viewport interactions may leave the pointer hovering an action button.
        await page.mouse.move(1,1);
        for(const [index,button] of buttons.entries()){
          const color=await button.evaluate(el=>getComputedStyle(el).backgroundColor);
          if(index===1){
            assert.equal(await button.getAttribute('data-hisabiq-variant'),'default',
              `Add party is the primary action at ${width}px`);
            assert.notEqual(color,'rgb(255, 255, 255)',`Add party has a green fill at ${width}px`);
          }else{
            assert.equal(color,'rgb(255, 255, 255)',`Secondary header action background white at ${width}px`);
          }
        }
        assert.ok(await page.locator('p strong.text-emerald-700').isVisible(),`directory receivables are green at ${width}px`);
        assert.ok(await page.locator('p strong.text-danger').isVisible(),`directory payables are red at ${width}px`);
      }
      if(width<768){
        assert.ok(!(await page.getByTestId('party-last-activity').isVisible()),`Phone ${width}px hides last activity`);
        const mobileActions=page.getByTestId('party-mobile-actions');
        assert.equal(await mobileActions.locator('button:visible').count(),3,`Phone ${width}px shows only payment, invoice and More`);
        assert.ok(await mobileActions.getByRole('button',{name:'Receive payment'}).isVisible(),`Phone ${width}px primary payment stays visible`);
        assert.ok(await mobileActions.getByRole('button',{name:'New invoice'}).isVisible(),`Phone ${width}px invoice stays visible`);
        assert.ok(await mobileActions.getByRole('button',{name:'More actions'}).isVisible(),`Phone ${width}px overflow is visible`);
        assert.equal(await mobileActions.getByRole('button',{name:'Refund credit'}).count(),0,`Phone ${width}px refund is overflow-only`);
        const card=page.locator('[data-testid="party-balance-card"]:visible').first();
        assert.ok(await card.isVisible(),`Phone ${width}px balance tile is visible`);
        assert.equal(await card.evaluate(el=>getComputedStyle(el).display),'grid',`Phone ${width}px balance tile is horizontal`);
        const title=await card.locator('p').nth(0).boundingBox();
        const amount=await card.locator('p').nth(1).boundingBox();
        const cardRect=await card.boundingBox();
        const columns=await card.evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length);
        assert.ok(columns>=2 && title&&amount&&cardRect &&
          amount.x>title.x+12 && amount.x>=cardRect.x+cardRect.width*0.45,
          `Phone ${width}px card has a left label and right-aligned amount`);
      } else if(width<1024){
        assert.ok(await page.getByTestId('party-last-activity').isVisible(),`Tablet ${width}px retains last activity`);
      }
      if(width<1024){
        assert.ok(await page.locator('[data-testid="party-receivable-helper"]:visible').first().isVisible(),`Localized receivable explanation visible at ${width}px`);
      }
      if(width>=768){
        assert.ok(await page.getByRole('button',{name:'Refund credit'}).isVisible(),
          `Refund credit remains a tablet/desktop direct action at ${width}px`);
      }
      if(width>=768&&width<1024){
        assert.ok(await page.getByRole('button',{name:'Refund credit'}).isVisible(),
          `Refund credit replaces Opening balance in the tablet action row at ${width}px`);
        assert.ok(await page.getByRole('button',{name:'Add note'}).isVisible(),`Add note in tablet action row at ${width}px`);
        assert.ok(await page.getByRole('button',{name:'More'}).isVisible(),`More overflow action on tablet at ${width}px`);
        if(width===820){
          await page.getByRole('button',{name:'More'}).click();
          const menu=page.getByRole('dialog',{name:'More actions'});
          await menu.getByRole('menuitem',{name:/opening balance/i}).waitFor();
          await page.keyboard.press('Escape');
          await menu.waitFor({state:'hidden'});
        }
        assert.ok(await page.getByText('Period debit').first().isVisible(),`period totals above the tablet ledger at ${width}px`);
        if(width===820){
          for(const kind of ['in','adjustment','due']){
            const matching=page.locator('[data-testid="ledger-impact-amount"][data-impact-kind="'+kind+'"]:visible').first();
            assert.ok(await matching.isVisible(),`Tablet ${width}px shows ${kind} impact icon and caption`);
            const colors=await matching.evaluate(el=>{
              const icon=el.querySelector('[data-testid="ledger-impact-icon"]');
              const amount=el.querySelector('[data-testid="ledger-money-value"]');
              const caption=el.querySelector('[data-testid="ledger-impact-caption"]');
              return { icon: icon&&getComputedStyle(icon).color,
                amount:amount&&getComputedStyle(amount).color,
                caption:caption&&getComputedStyle(caption).color };
            });
            assert.ok(colors.icon&&colors.amount&&colors.caption,`Tablet ${kind} has icon/value/caption`);
            if(kind==='in'||kind==='adjustment')assert.notEqual(colors.icon,colors.amount,`Only ${kind} icon has semantic color`);
            else assert.notEqual(colors.caption,colors.amount,`Impact explanation stays muted for ${kind}`);
          }
        }
        const rowHeight=await page.locator('table tbody tr').first().evaluate(row=>row.getBoundingClientRect().height);
        assert.ok(rowHeight<=70,`tablet ${width}px ledger rows must be compact, got ${rowHeight}px`);
        await page.getByRole('button',{name:'Change party'}).click();
        await page.getByRole('dialog',{name:'Change party'}).waitFor();
        await page.keyboard.press('Escape');
        await page.getByRole('dialog',{name:'Change party'}).waitFor({state:'hidden'});
      }
      if(width>=1024){
        if(width===1024){
          await page.getByRole('button',{name:'More'}).click();
          const menu=page.getByRole('dialog',{name:'More actions'});
          await menu.getByRole('menuitem',{name:/opening balance/i}).waitFor();
          await page.keyboard.press('Escape');
          await menu.waitFor({state:'hidden'});
        }
        await page.getByRole('button',{name:'Change party'}).click();
        assert.ok(await page.getByRole('textbox',{name:'Search parties'}).evaluate(el=>document.activeElement===el),
          `desktop ${width}px Change Party focuses the existing directory`);
      }
    }
    // Supplier money-out impact follows the same neutral-value styling at tablet width.
    await page.setViewportSize({width:820,height:900});
    await page.goto('http://127.0.0.1:4196/#/app/parties?id=s1&role=Supplier');
    await page.getByRole('heading',{name:/Karim Traders/}).waitFor();
    const outIcon=page.locator('[data-testid="ledger-impact-amount"][data-impact-kind="out"]:visible').first();
    assert.ok(await outIcon.isVisible(),'Supplier tablet ledger shows Money out icon and caption');
    const outColors=await outIcon.evaluate(el=>({
      icon:getComputedStyle(el.querySelector('[data-testid="ledger-impact-icon"]')).color,
      value:getComputedStyle(el.querySelector('[data-testid="ledger-money-value"]')).color
    }));
    assert.notEqual(outColors.icon,outColors.value,'Money out icon is colored, amount remains neutral');
    // Distinct Magic Patterns finance actions must preselect the correct real entry.
    await page.setViewportSize({width:375,height:812});
    const roleCases=[
      {id:'l1',role:'Lender',name:'Abdul Malek',actions:[['Repay loan','Lender Debit'],['Loan received','Lender Credit']]},
      {id:'b1',role:'Borrower',name:'Rafiq Mia',actions:[['Collect repayment','Borrower Credit'],['Lend money','Borrower Debit']]},
      {id:'o1',role:'Owner',name:'Md. Anisur Rahman',actions:[['Add capital','Owner Credit'],['Owner drawing','Owner Debit']]}
    ];
    for(const fixture of roleCases){
      await page.goto('http://127.0.0.1:4196/#/app/parties?id='+fixture.id+'&role='+fixture.role);
      await page.getByRole('heading',{name:fixture.name}).waitFor();
      const actions=page.getByTestId('party-mobile-actions');
      assert.equal(await actions.locator('button:visible').count(),3,fixture.role+' has primary, secondary and More');
      for(const [label,financeType] of fixture.actions){
        await actions.getByRole('button',{name:label,exact:true}).click();
        const dialog=page.getByRole('dialog',{name:'Party finance transaction'});
        await dialog.waitFor();
        // Finance dialog initializes its type in a React effect after becoming
        // visible. Check the settled value, not its transient previous selection.
        const typeSelect=dialog.getByRole('combobox',{name:'Finance transaction type'});
        await page.waitForFunction((expected) => {
          const selector=document.querySelector('[role="dialog"][aria-label="Party finance transaction"] [role="combobox"][aria-label="Finance transaction type"]');
          return selector?.getAttribute('data-value')===expected;
        },financeType,{timeout:3000});
        assert.equal(await typeSelect.getAttribute('data-value'),
          financeType,fixture.role+' '+label+' selects audited '+financeType);
        await dialog.getByRole('button',{name:'Cancel'}).click();
        await dialog.waitFor({state:'hidden'});
      }
    }
    // Vendor Pay and Receive stay in Parties. The existing source-linked form performs settlement.
    await page.goto('http://127.0.0.1:4196/#/app/parties?id=v1&role=Vendor');
    await page.getByRole('heading',{name:'Shapla Transport'}).waitFor();
    const vendorActions=page.getByTestId('party-mobile-actions');
    await vendorActions.getByRole('button',{name:'Pay Vendor'}).click();
    const noPay=page.getByRole('dialog',{name:'Pay Vendor'});
    await noPay.waitFor();
    assert.match(page.url(),/\/app\/parties/,'Pay Vendor remains in Party module');
    assert.ok(await noPay.getByText('No priced outstanding Vendor memo for this action.',{exact:false}).isVisible(),
      'Unpriced goods cannot be paid without setting their price');
    await page.keyboard.press('Escape');
    await noPay.waitFor({state:'hidden'});
    await vendorActions.getByRole('button',{name:'Receive Money'}).click();
    const receiveDialog=page.getByRole('dialog',{name:'Receive Money'});
    await receiveDialog.waitFor();
    assert.match(page.url(),/\/app\/parties/,'Receive Money remains in Party module');
    assert.ok(await receiveDialog.getByRole('combobox',{name:'Vendor settlement memo'}).isVisible(),
      'In-modal Vendor memo selector is available');
    assert.equal(await receiveDialog.getByRole('textbox',{name:'Split amount 1'}).inputValue(),'128',
      'Receive defaults to full outstanding memo balance');
    await receiveDialog.getByRole('textbox',{name:'Split amount 1'}).fill('20');
    await receiveDialog.getByRole('button',{name:'Save Receipt'}).click();
    await receiveDialog.waitFor({state:'hidden'});
    assert.match(page.url(),/\/app\/parties/,'Saving Vendor receipt does not navigate away');
    await vendorActions.getByRole('button',{name:'Receive Money'}).click();
    const reducedDialog=page.getByRole('dialog',{name:'Receive Money'});
    await reducedDialog.waitFor();
    // VendorActionDialog seeds its split amount inside a React effect after
    // the modal appears. Wait for the settled amount, not the initial empty input.
    await page.waitForFunction(() => {
      const dialog=document.querySelector('[role="dialog"][aria-label="Receive Money"]');
      return dialog?.querySelector('input[aria-label="Split amount 1"]')?.value==='108';
    },undefined,{timeout:5000});
    assert.equal(await reducedDialog.getByRole('textbox',{name:'Split amount 1'}).inputValue(),'108',
      'Vendor receipt changes the real remaining due in the preview store');
    await page.keyboard.press('Escape');
    await reducedDialog.waitFor({state:'hidden'});
    await page.goto('http://127.0.0.1:4196/#/app/parties?id=s3&role=Vendor');
    await page.getByTestId('party-mobile-actions').getByRole('button',{name:'Pay Vendor'}).click();
    const payDialog=page.getByRole('dialog',{name:'Pay Vendor'});
    await payDialog.waitFor();
    // The seeded split amount is populated by a React effect after modal mount.
    await page.waitForFunction(() => {
      const dialog=document.querySelector('[role="dialog"][aria-label="Pay Vendor"]');
      return dialog?.querySelector('input[aria-label="Split amount 1"]')?.value==='240';
    },undefined,{timeout:5000});
    assert.equal(await payDialog.getByRole('textbox',{name:'Split amount 1'}).inputValue(),'240',
      'Vendor payment offers the existing priced memo due');
    await payDialog.getByRole('textbox',{name:'Split amount 1'}).fill('40');
    await payDialog.getByRole('button',{name:'Save Payment'}).click();
    await payDialog.waitFor({state:'hidden'});
    assert.match(page.url(),/\/app\/parties/,'Pay Vendor commits without leaving Parties');
    await page.getByTestId('party-mobile-actions').getByRole('button',{name:'Pay Vendor'}).click();
    const partialPay=page.getByRole('dialog',{name:'Pay Vendor'});
    await partialPay.waitFor();
    await page.waitForFunction(() => {
      const dialog=document.querySelector('[role="dialog"][aria-label="Pay Vendor"]');
      return dialog?.querySelector('input[aria-label="Split amount 1"]')?.value==='200';
    },undefined,{timeout:5000});
    assert.equal(await partialPay.getByRole('textbox',{name:'Split amount 1'}).inputValue(),'200',
      'Partial Vendor payment reduces the next due by the payment amount');
    await page.keyboard.press('Escape');
    await partialPay.waitFor({state:'hidden'});
    // Tablet and desktop use exactly the same modal; no dedicated Vendor page transition.
    for(const width of [820,1440]){
      await page.setViewportSize({width,height:900});
      await page.getByRole('button',{name:'Pay Vendor'}).first().click();
      const desktopPay=page.getByRole('dialog',{name:'Pay Vendor'});
      await desktopPay.waitFor();
      assert.match(page.url(),/\/app\/parties/,`Vendor payment stays in Parties at ${width}px`);
      await page.keyboard.press('Escape');
      await desktopPay.waitFor({state:'hidden'});
    }
    // New browser context starts without reduced-motion: the same shared
    // dialog opens with Magic Patterns motion and preserves Escape behavior.
    const animatedPage=await browser.newPage({viewport:{width:390,height:820},
      reducedMotion:'no-preference'});
    const animatedErrors=[];
    animatedPage.on('pageerror',error=>animatedErrors.push(error.message));
    await animatedPage.goto('http://127.0.0.1:4196/#/app/parties?id=v1&role=Vendor');
    await animatedPage.getByTestId('party-mobile-actions').getByRole('button',{name:'Pay Vendor'}).click();
    const animatedModal=animatedPage.getByRole('dialog',{name:'Pay Vendor'});
    await animatedModal.waitFor();
    assert.equal(await animatedModal.getAttribute('data-modal-motion'),'magic-patterns',
      'Framer Motion opens dialogs for users who permit animation');
    await animatedPage.keyboard.press('Escape');
    await animatedModal.waitFor({state:'hidden'});
    assert.ok(await animatedPage.getByTestId('party-mobile-actions').getByRole('button',{name:'Pay Vendor'}).isVisible(),
      'Party button is usable after modal closes');
    assert.deepEqual(animatedErrors,[],'Framer entrance must not throw');
    await animatedPage.close();
    assert.equal(errors.length,0,'browser page must not throw');
    console.log('Party profile browser flow passed');
  } finally {
    await browser.close();
    await server.close();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
