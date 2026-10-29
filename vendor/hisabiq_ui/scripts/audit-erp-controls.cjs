/* Read-only source inventory across every .tsx screen/component.
 * This flags potential height drift; Playwright verifies computed pixels.
 * Usage: npm run audit:erp-controls
 * Optional: ERP_CONTROL_AUDIT_OUTPUT=/tmp/hisabiq-controls.json
 */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const base = path.join(root, 'src');
const files = [];
function walk(dir) {
  for (const d of fs.readdirSync(dir, { withFileTypes: true })) {
    if (d.name === '_designSystem') continue;
    const f = path.join(dir, d.name);
    if (d.isDirectory()) walk(f);
    else if (f.endsWith('.tsx')) files.push(f);
  }
}
walk(base);
const moduleOf = file => {
  const p = path.relative(base,file).replaceAll('\\','/');
  if (p.startsWith('saas/')) return 'SaaS (outside ERP workspace)';
  if (p.startsWith('components/brand/') || p === 'pages/BrandGuide.tsx') return 'Brand guide (outside ERP workspace)';
  const dirs=[
    ['POS / checkout', /^((pages\/Pos\.tsx)|(components\/pos\/))/],
    ['Purchases / purchase returns', /^((pages\/Purchases\.tsx)|(pages\/PurchaseEditor\.tsx)|(components\/purchases\/))/],
    ['Shared transaction cart / multi-unit', /^components\/transactions\//],
    ['Sales / returns / credit / drafts', /^((pages\/Sales\.tsx)|(components\/sales\/))/],
    ['Parties / customer & supplier ledger', /^((pages\/Parties\.tsx)|(components\/parties\/))/],
    ['Products / bundles / inventory', /^((pages\/Products\.tsx)|(components\/products\/))/],
    ['Finance / Counter', /^((pages\/Finance\.tsx)|(components\/finance\/))/],
    ['Accounts / vouchers', /^((pages\/Accounts\.tsx)|(components\/accounts\/))/],
    ['Audit ledger', /^((pages\/AuditLedger\.tsx)|(components\/audit\/))/],
    ['Daybook', /^((pages\/Daybook\.tsx)|(components\/daybook\/))/],
    ['Vendors', /^((pages\/Vendors\.tsx)|(components\/vendor\/))/],
    ['Dashboard', /^((pages\/Dashboard\.tsx)|(components\/dashboard\/))/],
    ['Product / party import', /^components\/import\//],
    ['ERP settings', /^settings\//],
    ['ERP shell / global navigation', /^components\/layout\//],
  ];
  for (const [name,re] of dirs) if (re.test(p)) return name;
  if (p.startsWith('pages/')) return p.replace('pages/','').replace('.tsx','');
  return 'ERP shared controls / utilities';
};
const tags=/\<(Button|button|Input|input|NumericInput|MoneyUnitInput|FormSelect|AppSelect|SearchSelect|QuickAddSelect|select|textarea)\b/g;
const explicit=/\b(?:min-|max-)?h-(?:[0-7]|8|9|10|11|12|14|16|\[[^\]]+\])\b|\bsize-(?:[0-7]|8|9|10|11|12|14)\b|(?:minHeight|height):\s*(?:28|32|40|44|48)\b/g;
const rows=[], aggregate = new Map();
for (const file of files) {
  const rel=path.relative(root,file).replaceAll('\\','/');
  const module=moduleOf(file);
  const src=fs.readFileSync(file,'utf8');
  const lines=src.split('\n');
  const sum=aggregate.get(module) || { files:0,sharedButtons:0,nativeButtons:0,inputs:0,flags:0 };
  sum.files++;
  for (const match of src.matchAll(tags)) {
    const tag=match[1];
    const chunk=src.slice(match.index,match.index+550).split(/>(?!\=)/)[0];
    if (/^(Button|button)$/.test(tag)) tag==='Button'?sum.sharedButtons++:sum.nativeButtons++;
    else sum.inputs++;
    const found=[...chunk.matchAll(explicit)].map(x=>x[0]);
    const drift=found.filter(x=> !/\b(?:min-|max-)?h-9\b/.test(x)&& !/\bsize-9\b/.test(x));
    if (!drift.length) continue;
    const before=src.slice(0,match.index),line=before.split('\n').length;
    const fragment=lines.slice(line-1,Math.min(line+2,lines.length)).join(' ').replace(/\s+/g,' ').slice(0,230);
    const internal=/data-number-stepper|data-calculator|input.*type=.checkbox|input.*type=.radio/.test(chunk) || /\/Calculator\.tsx$/.test(rel);
    rows.push({module,file:rel,line,tag,classes:[...new Set(drift)],status:internal?'internal exception / inspect':'requires visual review',excerpt:fragment});
    if (!internal)sum.flags++;
  }
  aggregate.set(module,sum);
}
const sorted=[...aggregate.entries()].sort((a,b)=>b[1].flags-a[1].flags||a[0].localeCompare(b[0]));
const result={gitSource:'ERP TSX modules (static inspection)', totalFiles:files.length,
  totals:{sharedButtons:sorted.reduce((n,[,x])=>n+x.sharedButtons,0),
  nativeButtons:sorted.reduce((n,[,x])=>n+x.nativeButtons,0),
  inputs:sorted.reduce((n,[,x])=>n+x.inputs,0),
  flaggedControls:rows.filter(x=>!x.status.startsWith('internal')).length},
  modules:Object.fromEntries(sorted), flags:rows};
const outfile=process.env.ERP_CONTROL_AUDIT_OUTPUT;
if(outfile){fs.mkdirSync(path.dirname(outfile),{recursive:true});fs.writeFileSync(outfile,JSON.stringify(result,null,2));}
console.log('HisabIQ control inventory: ',result.totalFiles,'TSX files; detected',result.totals.sharedButtons,
  'shared buttons,',result.totals.nativeButtons,'native buttons,',result.totals.inputs,'input/select fields');
console.log('Flagged for visual review (not automatically invalid):',result.totals.flaggedControls);
console.table(Object.fromEntries(sorted.map(([name,x])=>[name,{files:x.files,shared:x.sharedButtons,native:x.nativeButtons,inputs:x.inputs,flags:x.flags}])));
if(process.env.ERP_CONTROL_AUDIT_STRICT==='1' && result.totals.flaggedControls>0){
 console.error('Strict mode: unresolved explicit sizing candidates require visual disposition');
 process.exitCode=1;
}
