import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const file = (path: string) => readFileSync(path, 'utf8');

test('Phase 7 translates only cash drawer presentation and not cash session records', () => {
  const drawer = file('src/components/layout/CashSessionDialog.tsx');
  const session = file('src/contexts/CashSessionContext.tsx');
  assert.ok(drawer.includes("const { text, showHelper } = useUiCopy()"));
  assert.ok(drawer.includes("text('Cash reconciliation','ক্যাশ মিলানো')"));
  assert.ok(drawer.includes("text('Close session','সেশন বন্ধ করুন')"));
  assert.ok(drawer.includes("text('Open cash session','ক্যাশ সেশন খুলুন')"));
  assert.ok(drawer.includes('saveCount(counted,note,true)'));
  assert.ok(drawer.includes('saveCount(counted,note,false)'));
  assert.ok(drawer.includes('startSession(Number(float))'));
  assert.ok(drawer.includes('const diff = counted - expected'));
  assert.ok(drawer.includes("diff!==0&&!note.trim()"));
  assert.ok(session.includes('expectedCash=openingCash+(sampleMovements?38610+7820-3180:0)'));
  assert.ok(session.includes('setLastCount({counted,expected:expectedCash,note:note.trim(),savedAt:new Date().toISOString(),closed:close})'));
});

test('An empty count is not shown as a counted or reconciled amount', () => {
  const drawer = file('src/components/layout/CashSessionDialog.tsx');
  assert.ok(drawer.includes("hasCount ? taka(counted) : '—'"));
  assert.ok(drawer.includes("hasCount ? taka(Math.abs(diff)) : '—'"));
  assert.ok(drawer.includes('disabled={!hasCount}'));
  assert.ok(drawer.includes('disabled={!hasCount||(diff!==0&&!note.trim())}'));
  assert.ok(drawer.includes("text('Count saved in preview','নমুনা গণনা সংরক্ষিত')"));
  assert.ok(drawer.includes("text('Cash session closed in preview','নমুনা ক্যাশ সেশন বন্ধ হয়েছে')"));
});
