import type { LedgerEntry, Party, PartyRole } from '../types/erp';

export const partyRoles: PartyRole[] = [
'Customer',
'Supplier',
'Vendor',
'Lender',
'Borrower',
'Payee',
'Owner'];


export const parties: Party[] = [
{ id: 'c1', name: 'Rahman Hardware', nameBn: 'রহমান হার্ডওয়্যার', roles: ['Customer'], phone: '01711-482093', area: 'Nawabpur, Dhaka', balance: 48650, lastActivity: 'Today, 11:42 AM', avatarColor: '#0D7C74' },
{ id: 's1', name: 'Karim Traders', nameBn: 'করিম ট্রেডার্স', roles: ['Supplier'], phone: '01819-220415', area: 'Bangshal, Dhaka', balance: -126400, lastActivity: 'Yesterday', avatarColor: '#22364F' },
{ id: 'c2', name: 'Hossain Electric', nameBn: 'হোসেন ইলেকট্রিক', roles: ['Customer', 'Supplier'], phone: '01912-774310', area: 'Stadium Market, Dhaka', balance: 12300, lastActivity: 'Today, 9:15 AM', avatarColor: '#B45309' },
{ id: 's2', name: 'Bismillah Steel House', nameBn: 'বিসমিল্লাহ স্টিল', roles: ['Supplier'], phone: '01552-108844', area: 'Tejgaon, Dhaka', balance: -84200, lastActivity: '28 Sep 2026', avatarColor: '#3A4D66' },
{ id: 'c3', name: 'Mim Construction', nameBn: 'মিম কনস্ট্রাকশন', roles: ['Customer'], phone: '01673-551920', area: 'Mirpur 10, Dhaka', balance: 96500, lastActivity: '29 Sep 2026', avatarColor: '#0A625C' },
{ id: 'c4', name: 'Nur Enterprise', nameBn: 'নূর এন্টারপ্রাইজ', roles: ['Customer'], phone: '01815-660372', area: 'Keraniganj', balance: 7850, lastActivity: '30 Sep 2026', avatarColor: '#14998F' },
{ id: 'v1', name: 'Shapla Transport', nameBn: 'শাপলা ট্রান্সপোর্ট', roles: ['Vendor', 'Payee'], phone: '01911-305566', area: 'Gabtoli, Dhaka', balance: -6500, lastActivity: '30 Sep 2026', avatarColor: '#5A6B80' },
{ id: 'l1', name: 'Abdul Malek', nameBn: 'আব্দুল মালেক', roles: ['Lender'], phone: '01711-903214', area: 'Old Dhaka', balance: -200000, lastActivity: '15 Sep 2026', avatarColor: '#22364F' },
{ id: 'b1', name: 'Rafiq Mia', nameBn: 'রফিক মিয়া', roles: ['Borrower'], phone: '01626-447801', area: 'Jatrabari', balance: 15000, lastActivity: '20 Sep 2026', avatarColor: '#B45309' },
{ id: 'py1', name: 'DESCO (Electricity)', nameBn: 'ডেসকো', roles: ['Payee'], phone: '16120', area: 'Utility', balance: 0, lastActivity: '25 Sep 2026', avatarColor: '#2563EB' },
{ id: 'o1', name: 'Md. Anisur Rahman', nameBn: 'মোঃ আনিসুর রহমান', roles: ['Owner'], phone: '01711-000245', area: 'Proprietor', balance: -350000, lastActivity: '01 Sep 2026', avatarColor: '#0B1A2C' },
{ id: 's3', name: 'Padma Electric Supply', nameBn: 'পদ্মা ইলেকট্রিক', roles: ['Supplier', 'Vendor'], phone: '01730-118923', area: 'Nawabpur, Dhaka', balance: -32750, lastActivity: '27 Sep 2026', avatarColor: '#0D7C74' }];


export const ledgerEntries: LedgerEntry[] = [
// Rahman Hardware
{ id: 'l-1', partyId: 'c1', date: '01 Sep 2026', type: 'opening', description: 'Opening balance', debit: 22400, credit: 0 },
{ id: 'l-2', partyId: 'c1', date: '06 Sep 2026', type: 'invoice', ref: 'INV-000198', description: 'PVC Pipe 1" × 40, Gate Valve ¾" × 6', debit: 20700, credit: 0 },
{ id: 'l-3', partyId: 'c1', date: '10 Sep 2026', type: 'payment', ref: 'RCV-000087', description: 'Cash received at counter', debit: 0, credit: 25000, attachment: { name: 'money-receipt-087.jpg' } },
{ id: 'l-4', partyId: 'c1', date: '18 Sep 2026', type: 'invoice', ref: 'INV-000221', description: 'LED Bulb 12W × 5 Box, Electric Wire 1.5 rm × 3 Coil', debit: 16300, credit: 0 },
{ id: 'l-5', partyId: 'c1', date: '22 Sep 2026', type: 'note', description: 'Promised to clear dues before Durga Puja. Call Mr. Habib.', debit: 0, credit: 0 },
{ id: 'l-6', partyId: 'c1', date: '24 Sep 2026', type: 'return', ref: 'RTN-000012', description: 'Returned 2 damaged Gate Valve ¾"', debit: 0, credit: 1300 },
{ id: 'l-7', partyId: 'c1', date: '27 Sep 2026', type: 'payment', ref: 'RCV-000101', description: 'bKash received (TrxID 9KJ27XQ1)', debit: 0, credit: 10000 },
{ id: 'l-8', partyId: 'c1', date: '01 Oct 2026', type: 'invoice', ref: 'INV-000241', description: 'MS Angle 1.5" × 220 Kg, Teflon Tape × 2 Box', debit: 25550, credit: 0, attachment: { name: 'INV-000241.pdf' } },
// Karim Traders
{ id: 'l-9', partyId: 's1', date: '01 Sep 2026', type: 'opening', description: 'Opening balance', debit: 0, credit: 64000 },
{ id: 'l-10', partyId: 's1', date: '08 Sep 2026', type: 'purchase', ref: 'PUR-000112', description: 'PVC Pipe 1" × 120 Pcs', debit: 0, credit: 43800, attachment: { name: 'karim-memo-112.jpg', url: "./9fe849df-3b4b-4f01-b1ff-417303e487fb.jpg" } },
{ id: 'l-11', partyId: 's1', date: '15 Sep 2026', type: 'payment', ref: 'PAY-000054', description: 'Bank transfer — DBBL', debit: 40000, credit: 0 },
{ id: 'l-12', partyId: 's1', date: '30 Sep 2026', type: 'purchase', ref: 'PUR-000118', description: 'Gate Valve ¾" × 60, Teflon Tape × 20 Box', debit: 0, credit: 58600, attachment: { name: 'karim-memo-118.jpg', url: "./9fe849df-3b4b-4f01-b1ff-417303e487fb.jpg" } },
// Hossain Electric
{ id: 'l-13', partyId: 'c2', date: '12 Sep 2026', type: 'invoice', ref: 'INV-000209', description: 'Electric Wire 1.5 rm × 4 Coil', debit: 11400, credit: 0 },
{ id: 'l-14', partyId: 'c2', date: '20 Sep 2026', type: 'purchase', ref: 'PUR-000115', description: 'Ceiling Fan Regulator × 10', debit: 0, credit: 2550 },
{ id: 'l-15', partyId: 'c2', date: '01 Oct 2026', type: 'invoice', ref: 'INV-000238', description: 'LED Bulb 12W × 2 Box', debit: 3450, credit: 0 },
// Mim Construction
{ id: 'l-16', partyId: 'c3', date: '05 Sep 2026', type: 'invoice', ref: 'INV-000195', description: 'Cement × 100 Bag', debit: 54000, credit: 0 },
{ id: 'l-17', partyId: 'c3', date: '21 Sep 2026', type: 'invoice', ref: 'INV-000224', description: 'MS Angle × 375 Kg', debit: 42500, credit: 0 },
{ id: 'l-18', partyId: 'c3', date: '29 Sep 2026', type: 'note', description: 'Site at Mirpur DOHS. Payment due on project milestone.', debit: 0, credit: 0 }];