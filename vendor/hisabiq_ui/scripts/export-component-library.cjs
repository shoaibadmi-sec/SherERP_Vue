/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');

async function main() {
  const root = path.resolve(__dirname, '..'), source = path.join(root, 'src');
  const out = process.argv[2] ? path.resolve(process.argv[2]) : fs.mkdtempSync(path.join(os.tmpdir(), 'hisabiq-component-library-'));
  const destination = path.join(out, 'hisabiq-library');
  fs.mkdirSync(destination, { recursive: true });
  const read = (name) => fs.readFileSync(path.join(source, name), 'utf8');
  const model = read('reports/model.ts').split('\n').filter((line) => line.startsWith('export const defaultReportFilters:') || line.startsWith('export const validDay='))
    .join('\n').replace('defaultReportFilters:ReportFilters=', 'defaultReportFilters=').replace("compare:'none'", "compare:'none' as const").replace("direction:'desc'", "direction:'desc' as const");
  const overrides = {
    'settings/TenantSettingsProvider.tsx': `import { createContext, useContext, type ReactNode } from 'react';
import type { UiLanguage } from '../i18n/uiCopy';
const personal: { language: UiLanguage } = { language: 'English + Bangla' };
const Settings = createContext({ personal });
/** Isolated design-library adapter; business preferences and transactions are untouched. */
export function TenantSettingsProvider({ children }: { children: ReactNode }) { return <Settings.Provider value={{ personal }}>{children}</Settings.Provider>; }
export function useTenantSettings() { return useContext(Settings); }
`,
    'reports/model.ts': model + '\n',
    'primitives.ts': `export { Button } from '../components/Button';
export { Input } from '../components/Input';
export { Badge } from '../components/Badge';
export { Switch } from '../components/Switch';
export { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from '../components/Dialog';
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
`,
    'utils/libraryPortal.tsx': `import { createPortal as portal } from 'react-dom';
import type { ReactNode } from 'react';
/** Keeps exported theme utilities/variables around portalled library surfaces. */
export function createPortal(children: ReactNode, container: Element | DocumentFragment, key?: string | null) {
  return portal(<div className="hisabiq-library-host hisabiq-app" style={{ display: 'contents' }}>{children}</div>, container, key);
}
`,
  };
  const queue = ['components/brand/VisualComponentLibrary.tsx'], files = new Map();
  const imports = /\b(import|export)\s+([^;]*?)\s+from\s*['"]([^'"]+)['"]/gs;
  while (queue.length) {
    const name = queue.pop();
    if (files.has(name)) continue;
    let content = overrides[name] ?? read(name);
    content = content.replaceAll('../_designSystem/ds-6551b66a-cfd3-4df9-a9b1-9ead8d7fe7e9', '../primitives');
    if (/from\s*['"]react-dom['"]/.test(content) && name !== 'utils/libraryPortal.tsx') {
      const portalPath = path.posix.relative(path.posix.dirname(name), 'utils/libraryPortal').replace(/^(?!\.)/, './');
      content = content.replace(/from\s*['"]react-dom['"]/g, "from '" + portalPath + "'");
    }
    if (name === 'components/brand/VisualComponentLibrary.tsx') content = content.replace('className="mx-auto max-w-[1280px] scroll-mt-20 px-4 py-8 sm:px-6"', 'className="hisabiq-library-host hisabiq-app mx-auto max-w-[1280px] scroll-mt-20 px-4 py-8 sm:px-6"');
    files.set(name, content);
    if (name === 'primitives.ts') continue;
    for (const match of content.matchAll(imports)) {
      const [, , clause, target] = match;
      if (clause.trim().startsWith('type ') || !target.startsWith('.')) continue;
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(name), target));
      const candidate = [resolved, resolved + '.tsx', resolved + '.ts', resolved + '.json', resolved + '/index.tsx', resolved + '/index.ts']
        .find((entry) => Object.hasOwn(overrides, entry) || fs.existsSync(path.join(source, entry)));
      if (!candidate || candidate.startsWith('../')) throw new Error('Unresolved library dependency: ' + name + ' → ' + target);
      queue.push(candidate);
    }
  }
  for (const [name, content] of files) {
    const file = path.join(destination, name); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, content);
  }
  const inventory = JSON.parse(fs.readFileSync(path.join(root, 'docs/ui/design-system.json'), 'utf8'));
  const theme = (mode) => Object.entries(inventory.colors[mode]).map(([name, value]) => '--' + name + ': ' + value.rgb.join(' ') + ';').join('\n');
  const aliases = Object.entries(inventory.colors.aliases).map(([name, value]) => '--' + name + ': rgb(var(--' + value + '));').join('\n');
  const css = read('index.css');
  const contracts = css.slice(css.indexOf('/* Stable numeric geometry:'), css.indexOf('/* POS cart:')) + css.slice(css.indexOf('/* HisabIQ source brand hierarchy:'));
  const base = (await import(pathToFileURL(path.join(root, 'tailwind.config.js')).href)).default;
  const config = { ...base, content: [destination + '/**/*.{ts,tsx}'], important: '.hisabiq-library-host', corePlugins: { preflight: false } };
  fs.writeFileSync(path.join(out, 'tailwind.library.cjs'), 'module.exports = ' + JSON.stringify(config) + ';\n');
  fs.writeFileSync(path.join(out, 'utilities.input.css'), '@tailwind utilities;\n');
  const compiled = spawnSync(process.execPath, [path.join(root, 'node_modules/tailwindcss/lib/cli.js'), '-c', path.join(out, 'tailwind.library.cjs'), '-i', path.join(out, 'utilities.input.css'), '-o', path.join(out, 'utilities.css'), '--minify'], { cwd: root, encoding: 'utf8' });
  if (compiled.status !== 0) throw new Error(compiled.stderr);
  const themeCss = '.hisabiq-library-host {\n' + theme('light') + '\n' + aliases + '\n--radius:.625rem; font-family:Geist,"Hind Siliguri",sans-serif; font-feature-settings:normal; font-variant-numeric:normal; }\n:root.dark .hisabiq-library-host {\n' + theme('dark') + '\n}\n';
  fs.writeFileSync(path.join(destination, 'styles.css'), themeCss + contracts + '\n' + fs.readFileSync(path.join(out, 'utilities.css'), 'utf8'));
  console.log(JSON.stringify({ directory: out, files: files.size + 1, adapters: ['SDK primitives', 'isolated language preview', 'pure report defaults/date validation', 'scoped portal/theme host'] }));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
