#!/usr/bin/env node
/*
 * HisabIQ design contract guard.
 * Deliberately narrow: forbids new product-list AppSelect/FormSelect controls.
 * POS/Purchase and the shared quotation/online cart now use one product picker.
 * Visual parity requires browser tests and reviewer inspection.
 */
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const required = [
  'AGENTS.md',
  'docs/ui/transaction-cart-design-contract.md',
  'src/components/pos/CartTable.tsx',
  'src/components/pos/ProductCombobox.tsx',
  'src/components/purchases/PurchaseCart.tsx'
];

function allCodeFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => {
    const filename = path.join(dir, e.name);
    return e.isDirectory() ? allCodeFiles(filename) : /\.(?:tsx|jsx)$/.test(e.name) ? [filename] : [];
  });
}
const labelOf = (chunk) => {
  const match = chunk.match(/\blabel\s*=\s*(["'])([^"']+)\1/);
  return match?.[2] || '';
};
function isProductChooser(label,chunk) {
  const normalized=label.toLowerCase().trim();
  const staticField = /\b(?:category|brand|type|unit|status|filter|sort|settings)\b/.test(normalized);
  const looksLikePicker = /\b(?:add|choose|select|search|pick)\b/.test(normalized) && /\bproducts?\b/.test(normalized);
  const dynamicProductOptions = /\boptions\s*=\s*\{\s*(?:available)?products?\s*\.\s*map\s*\(/.test(chunk);
  return (looksLikePicker && !staticField) || dynamicProductOptions;
}
function findViolations(content,filename) {
  const matches = [];
  const tags = /<(?:AppSelect|FormSelect)\b/g;
  let match;
  while ((match=tags.exec(content))) {
    const after = content.slice(match.index,match.index+450);
    const label = labelOf(after);
    if (!isProductChooser(label,after)) continue;
    const line = content.slice(0,match.index).split('\n').length;
    matches.push({file:filename,line,label});
  }
  return matches;
}
function check(rootPath=root) {
  const missing = required.filter(filename=>!fs.existsSync(path.join(rootPath,filename)));
  const violations=allCodeFiles(path.join(rootPath,'src')).flatMap(filename => {
    const relative=path.relative(rootPath,filename).split(path.sep).join('/');
    return findViolations(fs.readFileSync(filename,'utf8'),relative);
  });
  return {missing,violations};
}
if (require.main === module) {
  const {missing,violations}=check();
  if (missing.length)console.error('Missing UI contract/canonical components:\n'+missing.map(p=>'  - '+p).join('\n'));
  if (violations.length)console.error('New non-POS product dropdown(s) found. Use the shared searchable product picker instead:\n'+
     violations.map(v=>`  - ${v.file}:${v.line} ${v.label}`).join('\n'));
  if (missing.length||violations.length)process.exitCode=1;
  else console.log('HisabIQ UI contract guard passed: canonical component references exist; no new standalone product-list selects.');
}
module.exports={check,findViolations,isProductChooser};
