import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lockBodyScroll} from '../src/utils/bodyScrollLock.ts';

test('nested overlays keep body locked until the final modal, sheet or nav closes', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis,'document');
  const body = {style: {overflow: 'auto'}};
  Object.defineProperty(globalThis,'document',{
    configurable:true, value:{body}
  });
  try {
    const dialogRelease = lockBodyScroll();
    assert.equal(body.style.overflow,'hidden');
    const sheetRelease = lockBodyScroll();
    const navRelease = lockBodyScroll();

    // Closing a sheet before its nested dialog MUST NOT unlock the page.
    sheetRelease();
    assert.equal(body.style.overflow,'hidden');
    sheetRelease(); // React cleanup must be safe if invoked twice.
    assert.equal(body.style.overflow,'hidden');

    dialogRelease();
    assert.equal(body.style.overflow,'hidden');
    navRelease();
    assert.equal(body.style.overflow,'auto','Original inline overflow is restored once');

    const nextRelease = lockBodyScroll();
    assert.equal(body.style.overflow,'hidden');
    nextRelease();
    assert.equal(body.style.overflow,'auto','A later modal starts cleanly');
  } finally {
    if(original) Object.defineProperty(globalThis,'document',original);
    else Reflect.deleteProperty(globalThis,'document');
  }
});

test('scrollbar stability applies to all pages and all three overlay owners', () => {
  const css=readFileSync('src/index.css','utf8');
  assert.match(css,/html\s*\{\s*scrollbar-gutter:\s*stable;/);
  assert.match(css,/@media print\s*\{\s*html\s*\{\s*scrollbar-gutter:\s*auto;/);
  for(const path of [
    'src/components/Dialog.tsx',
    'src/components/parties/PartyActionSheet.tsx',
    'src/components/layout/TopBar.tsx'
  ]){
    const source=readFileSync(path,'utf8');
    assert.match(source,/lockBodyScroll\(\)/,path);
    assert.match(source,/releaseScrollLock\(\)/,path);
    assert.doesNotMatch(source,/document\.body\.style\.overflow\s*=/,path);
  }
  const dialog=readFileSync('src/components/Dialog.tsx','utf8');
  assert.match(dialog,/previous\.focus\(\{preventScroll:true\}\)/,
    'Closing a dialog cannot scroll its opener into view and move the page');
});
