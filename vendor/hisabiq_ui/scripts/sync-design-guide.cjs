/* One authored rulebook; derive the visual reference and source inventory. */
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const read = (name) => fs.readFileSync(path.join(root, name), 'utf8');
const guide = read('docs/ui/HISABIQ-DESIGN-GUIDE.md');
const hash = crypto.createHash('sha256').update(guide).digest('hex');
const version = guide.match(/^Version ([\d.]+)/m)?.[1];
assert.ok(version, 'Guide must declare a version');
const sections = guide.split(/^## /m).slice(1).map((section) => {
  const [title, ...body] = section.trim().split('\n');
  return { id: 'guide-' + title.slice(0, 2), title, body: body.join('\n').trim() };
});
assert.equal(sections.length, 32, 'Expected all 32 guide chapters');
assert.equal(new Set(sections.map((section) => section.id)).size, 32, 'Duplicate chapter IDs');
const walk = (directory) => fs.readdirSync(path.join(root, directory), { withFileTypes: true })
  .flatMap((item) => item.isDirectory() ? walk(directory + '/' + item.name) : [directory + '/' + item.name]).sort();
const authored = walk('src').filter((name) => /\.[jt]sx?$/.test(name) && !name.includes('/_designSystem/'));
const componentFiles = authored.filter((name) => name.endsWith('.tsx'));
const icons = {};
for (const name of authored) {
  if (name === 'src/data/designIconComponents.ts') continue;
  for (const match of read(name).matchAll(/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/gs)) {
    for (const entry of match[1].split(',')) {
      const imported = entry.trim().replace(/^type\s+/, '').split(/\s+as\s+/)[0];
      if (imported && imported !== 'LucideIcon') (icons[imported] ??= []).push(name);
    }
  }
}
const theme = read('src/theme.css');
const extractChannels = (text) => Object.fromEntries([...text.matchAll(/--(color-[\w-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)]
  .map((match) => [match[1], { rgb: match.slice(2).map(Number), hex: '#' + match.slice(2).map((v) => Number(v).toString(16).padStart(2, '0')).join('').toUpperCase() }]));
const light = extractChannels(theme.match(/:root, \.theme-light\s*\{([\s\S]*?)\}/)[1]);
const dark = extractChannels(theme.match(/:root\.dark\s*\{([\s\S]*?)\}/)[1]);
assert.deepEqual(Object.keys(light).sort(), Object.keys(dark).sort(), 'Theme token roles differ');
const exportsFile = 'src/_designSystem/ds-6551b66a-cfd3-4df9-a9b1-9ead8d7fe7e9/index.d.ts';
const sharedExports = [...read(exportsFile).matchAll(/export const (\w+):/g)].map((match) => match[1]);
const bundleExports = read(exportsFile.replace('index.d.ts', 'library.js')).match(/export\s*\{([^}]+)\}\s*;/s)?.[1];
assert.ok(bundleExports, 'Cannot inventory bundled runtime exports');
const runtimeExports = bundleExports.split(',').map((entry) => entry.trim().split(/\s+as\s+/).pop()).sort();
const aliases = Object.fromEntries([...theme.matchAll(/--([\w-]+):\s*rgb\(var\(--(color-[\w-]+)\)\);/g)].map((match) => [match[1], match[2]]));
const visualSpecimens = JSON.parse(read('src/data/componentCatalog.json'));
assert.equal(new Set(visualSpecimens.map((entry) => entry.id)).size, visualSpecimens.length, 'Duplicate visual specimen ID');
for (const entry of visualSpecimens) {
  assert.ok(entry.states.length && entry.sources.length, 'Specimen needs sources and states: ' + entry.id);
  assert.ok(['existing', 'prepared'].includes(entry.status), 'Specimen must declare its availability');
  for (const source of entry.sources) assert.ok(fs.existsSync(path.join(root, source)), 'Missing specimen source: ' + source);
}
const inventory = {
  version, date: '2026-10-26', guideSha256: hash,
  source: 'docs/ui/HISABIQ-DESIGN-GUIDE.md',
  visualSpecimens,
  note: 'Generated source inventory, not a conformance certificate. Component-owned behavior and this guide govern use.',
  colors: { light, dark, aliases },
  dimensions: { control: 36, terminalTransactionAction: 48, fieldRadius: 8, buttonRadius: 10, panelRadius: 12, dialogRadius: 12, badgeRadius: 6 },
  typography: { fontSans: ['Geist', 'Hind Siliguri', 'system-ui', 'sans-serif'], fontBangla: ['Hind Siliguri', 'Geist', 'sans-serif'], tableData: 13, tableHeading: 12, tableHelperBadge: 11, tableDigits: 'proportional' },
  spacing: [4, 8, 12, 16, 20, 24, 32, 40, 48],
  breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 },
  motion: { source: 'src/motion/tokens.ts', milliseconds: Object.fromEntries([...read('src/motion/tokens.ts').matchAll(/^\s+(\w+): (\d+),/gm)].map((match) => [match[1], Number(match[2])])), ease: [0.16, 1, 0.3, 1] },
  sharedExports: { source: exportsFile, names: sharedExports },
  bundledRuntimeExports: { source: exportsFile.replace('index.d.ts', 'library.js'), names: runtimeExports, note: 'More bundled runtime exports exist than the typed ERP integration exposes. Inspect/extend types and apply the guide before introducing one.' },
  componentFiles: componentFiles.map((file) => ({ file, kind: /\/components\/|\/motion\//.test(file) ? 'component' : /Provider|Context/.test(file) ? 'provider-or-context' : /\/pages\/|\/features\/auth\//.test(file) ? 'page-or-feature' : 'authored-ui', exports: [...read(file).matchAll(/export\s+(?:async\s+)?(?:function|const|class)\s+(\w+)/g)].map((match) => match[1]), reexports: [...read(file).matchAll(/export\s+\*\s+from\s+['"]([^'"]+)/g)].map((match) => match[1]) })),
  icons: Object.fromEntries(Object.entries(icons).sort(([a], [b]) => a.localeCompare(b)).map(([name, usages]) => [name, [...new Set(usages)]])),
};
const data = {
  version: inventory.version, date: inventory.date, guideSha256: hash,
  introduction: guide.split(/^## /m)[0].trim(),
  sections,
  inventory: { componentFiles: componentFiles.length, iconNames: Object.keys(icons).length, colorRoles: Object.keys(light).length, sharedExports: sharedExports.length },
};
const outputs = {
  'docs/ui/design-system.json': JSON.stringify(inventory, null, 2) + '\n',
  'src/data/designGuide.json': JSON.stringify(data, null, 2) + '\n',
  'src/data/designIconComponents.ts': '// Generated by scripts/sync-design-guide.cjs; actual imported Lucide glyphs only.\nimport { ' + Object.keys(inventory.icons).join(', ') + " } from 'lucide-react';\nexport const designIconComponents = [\n" + Object.keys(inventory.icons).map((name) => '  { name: ' + JSON.stringify(name) + ', Icon: ' + name + ' },').join('\n') + '\n];\n',
};
for (const [name, content] of Object.entries(outputs)) {
  if (process.argv.includes('--check')) assert.equal(read(name), content, name + ' is stale; run node scripts/sync-design-guide.cjs');
  else fs.writeFileSync(path.join(root, name), content);
}
console.log(`${process.argv.includes('--check') ? 'Verified' : 'Generated'} guide v${inventory.version}: ${sections.length} chapters, ${componentFiles.length} component files, ${Object.keys(icons).length} Lucide imports, ${Object.keys(light).length} colors per theme.`);
