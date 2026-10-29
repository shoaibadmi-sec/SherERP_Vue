import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('index.html', 'utf8');
const script = html.match(/<script id="theme-init">([\s\S]*?)<\/script>/)?.[1];

test('theme initializes before rendering and resolves preferences safely', () => {
  assert.ok(script, 'missing theme initializer');
  for (const [saved, systemDark, expected] of [
    ['dark', false, 'dark'], ['light', true, 'light'], ['system', true, 'dark'],
    ['system', false, 'light'], ['invalid', true, 'dark'], [null, false, 'light']
  ] as const) {
    const root = { dataset: {} as Record<string, string>, style: {} as Record<string, string>, classList: { toggle: (_: string, enabled: boolean) => { root.dataset.classDark = String(enabled); } } };
    vm.runInNewContext(script, { document: { documentElement: root }, localStorage: { getItem: () => saved }, window: { matchMedia: () => ({ matches: systemDark }) } });
    assert.equal(root.style.colorScheme, expected);
    assert.equal(root.dataset.classDark, String(expected === 'dark'));
  }
});

test('theme still follows the OS when browser storage is unavailable', () => {
  assert.ok(script, 'missing theme initializer');
  const root = { dataset: {}, style: {} as Record<string, string>, classList: { toggle: () => undefined } };
  vm.runInNewContext(script, { document: { documentElement: root }, localStorage: { getItem: () => { throw Error('blocked'); } }, window: { matchMedia: () => ({ matches: true }) } });
  assert.equal(root.style.colorScheme, 'dark');
});

function luminance(color: string) {
  const rgb = color.trim().split(/\s+/).map(Number).map(c => { const v = c / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; });
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2];
}
function ratio(a: string, b: string) { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); }

test('both palettes meet AA for text, button states, statuses and input boundaries', () => {
  const css = readFileSync('src/theme.css', 'utf8');
  for (const mode of ['light', 'dark']) {
    const block = css.match(new RegExp(`/\\* ${mode} palette \\*/[\\s\\S]*?\\{([\\s\\S]*?)\\}`))?.[1];
    assert.ok(block, `${mode} palette missing`);
    const tokens = Object.fromEntries([...block.matchAll(/--([\w-]+):\s*([\d ]+);/g)].map(m => [m[1].replace(/^color-/, ''), m[2]]));
    for (const fg of ['foreground', 'muted-foreground', 'helper', 'teal-600', 'teal-700', 'success', 'warning', 'danger', 'info']) {
      for (const bg of ['background', 'card', 'ink-50', 'ink-100']) {
        assert.ok(ratio(tokens[fg], tokens[bg]) >= 4.5, `${mode} ${fg}/${bg}: ${ratio(tokens[fg], tokens[bg])}`);
      }
    }
    for (const bg of ['primary', 'primary-hover']) assert.ok(ratio(tokens['primary-foreground'], tokens[bg]) >= 4.5, `${mode} primary ${bg}`);
    for (const status of ['success', 'warning', 'danger', 'info']) assert.ok(ratio(tokens[status], tokens[`${status}-bg`]) >= 4.5, `${mode} ${status} badge`);
    for (const bg of ['card', 'background', 'ink-50']) for (const fg of ['input', 'ring']) assert.ok(ratio(tokens[fg], tokens[bg]) >= 3, `${mode} ${fg}/${bg}`);
  }
});
