import type { Expense, Purchase } from '../types/erp';

const receiptPhoto = "./9fe849df-3b4b-4f01-b1ff-417303e487fb.jpg";


export const purchases: Purchase[] = [
{ id: 'pu118', ref: 'PUR-000118', date: '30 Sep 2026', supplierId: 's1', supplier: 'Karim Traders', items: 'Gate Valve ¾" × 60, Teflon Tape × 20 Box', total: 58600, paid: 0, receipt: receiptPhoto },
{ id: 'pu117', ref: 'PUR-000117', date: '28 Sep 2026', supplierId: 's2', supplier: 'Bismillah Steel House', items: 'MS Angle 1.5" × 800 Kg', total: 78400, paid: 40000, payments: [{ id: 'pp117-1', method: 'Bank', amount: 30000, account: 'Dutch-Bangla Bank · 4582' }, { id: 'pp117-2', method: 'Cash', amount: 10000, account: 'Cash counter' }], receipt: receiptPhoto },
{ id: 'pu116', ref: 'PUR-000116', date: '27 Sep 2026', supplierId: 's3', supplier: 'Padma Electric Supply', items: 'LED Bulb 12W × 30 Box, Electric Wire × 6 Coil', total: 53280, paid: 20530, payments: [{ id: 'pp116-1', method: 'Bank', amount: 20530, account: 'Dutch-Bangla Bank · 4582' }] },
{ id: 'pu115', ref: 'PUR-000115', date: '20 Sep 2026', supplierId: 'c2', supplier: 'Hossain Electric', items: 'Ceiling Fan Regulator × 10', total: 2550, paid: 2550, payments: [{ id: 'pp115-1', method: 'Cash', amount: 2550, account: 'Cash counter' }], receipt: receiptPhoto },
{ id: 'pu114', ref: 'PUR-000114', date: '16 Sep 2026', supplierId: 's2', supplier: 'Bismillah Steel House', items: 'GI Wire 14 SWG × 200 Kg', total: 25200, paid: 25200 },
{ id: 'pu112', ref: 'PUR-000112', date: '08 Sep 2026', supplierId: 's1', supplier: 'Karim Traders', items: 'PVC Pipe 1" × 120 Pcs', total: 43800, paid: 43800, receipt: receiptPhoto }];


export const expenseCategories = ['Rent', 'Utilities', 'Transport', 'Salary', 'Tea & Snacks', 'Maintenance'];

export const expenses: Expense[] = [
{ id: 'e61', ref: 'EXP-000061', date: '30 Sep 2026', category: 'Transport', payee: 'Shapla Transport', payeeId: 'v1', note: 'Pickup — Bangshal to shop (3 trips)', amount: 6500, paid: 0, method: 'Cash', receipt: receiptPhoto },
{ id: 'e60', ref: 'EXP-000060', date: '30 Sep 2026', category: 'Salary', payee: 'Staff salary — September', note: '3 staff', amount: 42000, paid: 42000, method: 'Cash', payments: [{ id: 'ep60-1', method: 'Cash', amount: 30000, account: 'Cash counter' }, { id: 'ep60-2', method: 'Bank', amount: 12000, account: 'Dutch-Bangla Bank · 4582' }] },
{ id: 'e59', ref: 'EXP-000059', date: '28 Sep 2026', category: 'Rent', payee: 'Shop rent — Nawabpur', note: 'October advance', amount: 35000, paid: 35000, method: 'Bank', payments: [{ id: 'ep59-1', method: 'Bank', amount: 35000, account: 'Dutch-Bangla Bank · 4582' }], receipt: receiptPhoto },
{ id: 'e58', ref: 'EXP-000058', date: '25 Sep 2026', category: 'Utilities', payee: 'DESCO (Electricity)', payeeId: 'py1', note: 'Meter 4410-2291', amount: 4860, paid: 4860, method: 'bKash', payments: [{ id: 'ep58-1', method: 'bKash', amount: 4860, account: 'bKash Business · 01711•••412' }], receipt: receiptPhoto },
{ id: 'e57', ref: 'EXP-000057', date: '24 Sep 2026', category: 'Tea & Snacks', payee: 'Tea stall', note: 'Customers & staff', amount: 1250, paid: 1250, method: 'Cash' },
{ id: 'e56', ref: 'EXP-000056', date: '19 Sep 2026', category: 'Maintenance', payee: 'Shutter repair', note: 'Front shutter spring', amount: 2800, paid: 2800, method: 'Cash' }];