import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { guideBlocks, guideMarkdown } from '../src/utils/designGuide.ts';

test('visual guide retains the entire canonical document in copy/download', () => {
  const data = JSON.parse(readFileSync(new URL('../src/data/designGuide.json', import.meta.url), 'utf8'));
  const canonical = readFileSync(new URL('../docs/ui/HISABIQ-DESIGN-GUIDE.md', import.meta.url), 'utf8');
  assert.equal(guideMarkdown(data.introduction, data.sections), canonical);
  for (const section of data.sections) {
    for (const block of guideBlocks(section.body)) {
      if (block.type === 'table') for (const row of block.rows) assert.equal(row.length, block.headings.length, section.title);
    }
  }
});

test('guide formatting preserves mixed-language text and structured table cells', () => {
  assert.deepEqual(guideBlocks('পণ্য · Product\n\n- Keep ৳120.50\n- Keep 01711\n\n| State | Rule |\n| --- | --- |\n| Error | আবার চেষ্টা করুন |'), [
    { type: 'paragraph', text: 'পণ্য · Product' },
    { type: 'list', items: ['Keep ৳120.50', 'Keep 01711'] },
    { type: 'table', headings: ['State', 'Rule'], rows: [['Error', 'আবার চেষ্টা করুন']] },
  ]);
});
