export const brandSections = [
{ id: 'component-library', label: 'Components' },
{ id: 'complete-guide', label: 'Complete guide' },
{ id: 'live-components', label: 'Live components' },
{ id: 'logo', label: 'Logo' },
{ id: 'clear-space', label: 'Clear space' },
{ id: 'color', label: 'Color' },
{ id: 'type', label: 'Typography' },
{ id: 'primitives', label: 'UI primitives' },
{ id: 'voice', label: 'Voice' },
{ id: 'misuse', label: 'Misuse' },
{ id: 'applications', label: 'Applications' }];


export type Swatch = {
  name: string;
  hex: string;
  role: string;
  contrast?: string;
  dark?: boolean;
};

export const coreColors: Swatch[] = [
{ name: 'Ledger Ink', hex: '#0B1A2C', role: 'Primary text, logo tile, dark surfaces', contrast: '17.4:1 on white', dark: true },
{ name: 'Hisab Teal', hex: '#0D7C74', role: 'Primary actions, links, the “IQ”', contrast: '5.1:1 on white · AA', dark: true },
{ name: 'Signal Mint', hex: '#3DD6B5', role: 'Intelligence signal. Dot on dark only — never text on white', contrast: '9.6:1 on Ink' },
{ name: 'Canvas', hex: '#F5F7FA', role: 'App background, table headers, wells' },
{ name: 'Paper', hex: '#FFFFFF', role: 'Cards, inputs, documents' }];


export const inkScale = [
{ step: '900', hex: '#0B1A2C' },
{ step: '700', hex: '#22364F' },
{ step: '600', hex: '#3A4D66' },
{ step: '500', hex: '#5A6B80' },
{ step: '400', hex: '#8A9BB0' },
{ step: '300', hex: '#B7C2CF' },
{ step: '200', hex: '#D5DDE6' },
{ step: '100', hex: '#E3E8EE' },
{ step: '50', hex: '#F5F7FA' }];


export const tealScale = [
{ step: '900', hex: '#073F3B' },
{ step: '700', hex: '#0A625C' },
{ step: '600', hex: '#0D7C74' },
{ step: '500', hex: '#14998F' },
{ step: '400', hex: '#3DB8AC' },
{ step: '200', hex: '#B3E3DC' },
{ step: '100', hex: '#D7F0EC' },
{ step: '50', hex: '#EAF6F4' }];


export const semanticColors = [
{ name: 'Success', hex: '#116F35', bg: '#E8F5EC', use: 'Paid, in stock, balanced cash' },
{ name: 'Warning', hex: '#974407', bg: '#FDF3E3', use: 'Partial payment, low stock, notes' },
{ name: 'Danger', hex: '#B92E25', bg: '#FCEBEA', use: 'Due, out of stock, delete, short cash' },
{ name: 'Info', hex: '#1E56D3', bg: '#EAF0FD', use: 'Suppliers, neutral system messages' }];


export const voicePrinciples = [
{ title: 'Clear over clever', bn: 'সহজ কথা', body: 'Say exactly what happened and what to do next. No puns on money.' },
{ title: 'Numbers first', bn: 'আগে সংখ্যা', body: 'Lead with the amount, party and date. ৳48,650 · Rahman Hardware · 21 days.' },
{ title: 'Calm, never alarming', bn: 'শান্ত সুর', body: 'Dues are normal business. Inform, don’t shame. No capitals or exclamation marks.' },
{ title: 'Bilingual, naturally', bn: 'দুই ভাষায়', body: 'English for UI, Bangla where it helps recall: পাবো / দেবো, বাকি, খাতা.' }];


export const voiceExamples = [
{ context: 'Overdue reminder', do: 'Rahman Hardware has ৳48,650 due for 21 days. Send a statement?', dont: 'OVERDUE!!! Collect payment from Rahman Hardware NOW' },
{ context: 'Save error', do: 'Couldn’t save the sale. Check your internet — your cart is kept.', dont: 'Error 500: Transaction failed' },
{ context: 'Low stock', do: 'Gate Valve ¾" is low · 4 Pcs left, minimum 10.', dont: 'AI predicts you will run out of inventory soon ✨' },
{ context: 'Empty state', do: 'No sales yet today. Your first sale will show here.', dont: 'Nothing to see here 🤷' }];


export const misuseRules = [
{ id: 'stretch', label: 'Don’t stretch or squash' },
{ id: 'rotate', label: 'Don’t rotate or tilt' },
{ id: 'recolor', label: 'Don’t recolor outside the palette' },
{ id: 'gradient', label: 'Don’t add gradients or glow' },
{ id: 'split', label: 'Don’t split “Hisab IQ” or change case' },
{ id: 'busy', label: 'Don’t place on busy backgrounds' },
{ id: 'sparkle', label: 'Don’t add AI sparkles or arrows' },
{ id: 'outline', label: 'Don’t outline the wordmark' }];
