import test from 'node:test';
import assert from 'node:assert/strict';
import { showBanglaHelper, uiGlossary, uiText, uiWord } from '../src/i18n/uiCopy.ts';

test('Bangla uses shopkeeper words, with no মাল label', () => {
  assert.equal(uiWord('Bangla', 'product'), 'পণ্য');
  assert.equal(uiWord('Bangla', 'due'), 'বাকি');
  assert.equal(uiWord('Bangla', 'totalPayable'), 'মোট দিতে হবে');
  assert.equal(uiWord('Bangla', 'supplierPay'), 'সরবরাহকারীকে টাকা দিন');
  for (const [, bangla] of Object.values(uiGlossary)) {
    assert.doesNotMatch(bangla, /মাল(?:\s|$)/);
  }
});
test('English and bilingual primary labels retain their current English copy', () => {
  assert.equal(uiWord('English', 'quantity'), 'Quantity');
  assert.equal(uiWord('English + Bangla', 'quantity'), 'Quantity');
  assert.equal(uiText('English + Bangla', 'Return items', 'পণ্য ফেরত দিন'), 'Return items');
  assert.equal(uiWord('Bangla', 'quantity'), 'পরিমাণ');
});
test('Bangla helper shows only in mixed mode', () => {
  assert.equal(showBanglaHelper('Bangla'), false);
  assert.equal(showBanglaHelper('English'), false);
  assert.equal(showBanglaHelper('English + Bangla'), true);
});
