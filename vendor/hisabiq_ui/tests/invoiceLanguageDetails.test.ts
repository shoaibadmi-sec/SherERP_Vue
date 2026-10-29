import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { invoiceDesignDefaults } from '../src/documents/profile.ts';
import { amountInWords } from '../src/utils/amountInWords.ts';

test('full English amount words retain taka, paisa, signs and Bangladesh grouping', () => {
  assert.equal(amountInWords(125400.5, 'English'), 'One lakh twenty-five thousand four hundred taka and fifty paisa only');
  assert.equal(amountInWords(-12.05, 'English'), 'Minus twelve taka and five paisa only');
  assert.equal(amountInWords(10000000, 'English'), 'One crore taka only');
  assert.equal(amountInWords(0, 'English'), 'Zero taka only');
  assert.equal(amountInWords(Number.NaN, 'English'), '');
});
test('all invoice templates render single-language output or actual secondary Bangla helpers', async () => {
  const server = await createServer({ server: { middlewareMode: true } });
  try {
    const { ReceiptPreview } = await server.ssrLoadModule('/src/components/brand/ReceiptPreview.tsx');
    for (const template of ['Standard', 'Classic', 'Compact']) {
      const props = { invoice: 'INV-1', customer: 'Rahim', lines: [{ name: 'Bulb', nameBn: 'বাল্ব', qty: '2 Pcs', price: 50, total: 100 }], subtotal: 100, discount: 0, rounding: 0, total: 100, paid: 100, due: 0, method: 'Cash', branding: { name: 'Shop', nameBn: 'দোকান', address: '', phone: '', logo: '', showLogo: false, footer: '', design: { ...invoiceDesignDefaults(), template, showSku: true } } };
      const render = (language: string) => renderToStaticMarkup(createElement(ReceiptPreview, { ...props, branding: { ...props.branding, design: { ...props.branding.design, language } } }));
      const english = render('English');
      assert.ok(!/[\u0980-\u09ff]/.test(english.replaceAll('৳', '')), template + ' full English has no default Bangla text');
      assert.ok(english.includes('One hundred taka only'));
      const bilingual = render('English + Bangla');
      assert.match(bilingual, /data-document-helper=""[^>]*lang="bn"/);
      assert.ok(bilingual.includes('বাল্ব'), template + ' product translation is available as helper');
      const bangla = render('Bangla');
      assert.ok(bangla.includes('পণ্যের কোড'));
      assert.ok(bangla.includes('বাল্ব'));
      assert.ok(!bangla.includes('Sales invoice'));
    }
  } finally { await server.close(); }
});
