const test=require('node:test');
const assert=require('node:assert/strict');
const {findViolations,isProductChooser}=require('../scripts/check-ui-design-contract.cjs');

test('standalone AppSelect product picker is forbidden on new screens',()=>{
 const source='<AppSelect label="Add product to service order" value="" options={products.map(p=>p.name)} />';
 const v=findViolations(source,'src/pages/ServiceOrders.tsx');
 assert.equal(v.length,1);
 assert.equal(v[0].line,1);
});

test('quotation and online order product selects are no longer allowed',()=>{
 assert.equal(findViolations('<AppSelect label="Add product to quotation" />','src/pages/Quotations.tsx').length,1);
 assert.equal(findViolations('<AppSelect label="Add online order product" />','src/pages/OnlineSales.tsx').length,1);
 assert.equal(findViolations('<AppSelect label="Add product to quotation" />','src/pages/NewQuotes.tsx').length,1);
});

test('small fixed dropdowns and non-product filters are not treated as transaction pickers',()=>{
 const harmless='<AppSelect label="Order payment mode" />\\n<AppSelect label="Filter product category" />';
 assert.deepEqual(findViolations(harmless,'src/pages/Orders.tsx'),[]);
 assert.equal(isProductChooser('Search product', '<AppSelect label="Search product" />'),true);
});
