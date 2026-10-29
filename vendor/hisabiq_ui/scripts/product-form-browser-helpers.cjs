const assert=require('node:assert/strict');
async function pick(page,trigger,value,create=false){
 await trigger.click();
 await page.waitForFunction(el=>el.getAttribute('aria-expanded')==='true',await trigger.elementHandle());
 const id=await trigger.getAttribute('aria-controls');
 const popup=id?page.locator('[id="'+id+'"]'):page.getByRole('listbox').last();
 await popup.waitFor();
 const option=popup.locator('[role="option"][data-value="'+value+'"]');
 if(await option.count())return option.first().click();
 assert.ok(create,'missing unit option '+value);
 await popup.getByText(/^Add new (larger )?unit$/).click();
 const quick=page.getByRole('dialog',{name:/^New (larger )?unit$/});
 await quick.locator('#qa-name').fill(value);await quick.locator('#qa-symbol').fill(value);
 await quick.getByRole('button',{name:/^Add (larger )?unit$/}).click();await quick.waitFor({state:'hidden'});
}
async function quickAdd(page,field,noun,value){
 await field.click();await page.getByText('Add new '+noun,{exact:true}).last().click();
 const quick=page.getByRole('dialog',{name:'New '+noun,exact:true});
 await quick.locator('#qa-name').fill(value);await quick.getByRole('button',{name:'Add '+noun,exact:true}).click();
 await quick.waitFor({state:'hidden'});
}
async function fillChain(page,editor,name){
 await editor.locator('#pf-name').fill(name);
 await pick(page,editor.locator('#pf-unit'),'Feet',true);
 await editor.locator('#pf-advanced-button').click();await editor.locator('#pf-multi-label').click();
 for(const [index,unit,factor]of[[0,'Pcs','120'],[1,'Box','20'],[2,'Carton','12']]){
  if(index){await editor.getByRole('button',{name:'Add another unit',exact:true}).click();}
  await editor.locator('[data-product-unit-relationship]').nth(index).waitFor();
  const row=editor.locator('[data-product-unit-relationship]').nth(index);
  await pick(page,row.getByRole('combobox'),unit,true);await row.locator('input').fill(factor);await row.locator('input').press('Tab');
  await page.waitForFunction(({unit,factor})=>Array.from(document.querySelectorAll('[data-product-unit-relationship]')).some(row=>row.querySelector('[data-value]')?.getAttribute('data-value')===unit&&row.querySelector('input')?.value===factor),{unit,factor});
 }
 await pick(page,editor.locator('#pf-sell-unit'),'Pcs');await editor.locator('#pf-sell').fill('240');
 await pick(page,editor.locator('#pf-buy-unit'),'Pcs');await editor.locator('#pf-buy').fill('180');
 await pick(page,editor.locator('#pf-opening-unit'),'Carton');await editor.locator('#pf-opening').fill('1');
 await pick(page,editor.locator('#pf-min-unit'),'Box');await editor.locator('#pf-min').fill('2');
 await pick(page,editor.locator('#pf-view'),'Carton');
 assert.ok((await editor.innerText()).includes('28,800 Feet'));
}
async function discard(page,editor){
 await editor.getByRole('button',{name:'Cancel',exact:true}).click();
 const confirm=page.getByRole('dialog',{name:'Leave without saving?',exact:true});
 if(await confirm.count())await confirm.getByRole('button',{name:'Discard',exact:true}).click();
 await editor.waitFor({state:'hidden'});
}
module.exports={pick,quickAdd,fillChain,discard};
