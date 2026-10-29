import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const file = (path: string) => readFileSync(path, 'utf8');

test('Shared shell uses existing language preference and preserves global search and navigation actions', () => {
  const top = file('src/components/layout/TopBar.tsx');
  const nav = file('src/components/layout/ErpNavMenu.tsx');
  const search = file('src/components/layout/GlobalSearchBox.tsx');
  const sidebar = file('src/components/layout/Sidebar.tsx');
  assert.ok(top.includes('const { text, language } = useUiCopy()'));
  assert.ok(top.includes('<GlobalSearchBox />'));
  assert.ok(search.includes('navigate(item.path)'));
  assert.ok(search.includes('searchResults(records,query'));
  assert.ok(search.includes('aria-autocomplete="list"'));
  assert.ok(search.includes("event.ctrlKey||event.metaKey"));
  assert.ok(top.includes("navigate(route)"));
  assert.ok(nav.includes('getVisibleNavigation(erpNavigation'));
  assert.ok(nav.includes('resolveNavLocation(current, nav)'));
  assert.ok(nav.includes('to={child.path}'));
  assert.ok(nav.includes('personal.language === \'English + Bangla\' && bangla'));
  assert.ok(sidebar.includes("localStorage.setItem(COLLAPSED_KEY, String(collapsed))"));
});

test('Language changes display only, never theme values or sample notification identifiers', () => {
  const theme = file('src/components/layout/ThemePicker.tsx');
  const top = file('src/components/layout/TopBar.tsx');
  const sample = file('src/data/dashboard.ts');
  assert.ok(theme.includes("language = 'English'"), 'ThemePicker defaults to English in SaaS without ERP tenant context');
  assert.ok(!theme.includes('useUiCopy'), 'Shared theme cannot depend on ERP settings provider');
  assert.ok(top.includes('<ThemePicker language={language} />'));
  assert.ok(theme.includes('value={value} checked={theme === value}'));
  assert.ok(theme.includes('setTheme(value); close()'));
  assert.ok(top.includes('notificationBangla[n.id]?.title ?? n.title'));
  assert.ok(top.includes('notificationBangla[n.id]?.body ?? n.body'));
  assert.ok(sample.includes("id: 'n2', title: 'bKash payment received'"));
  assert.ok(top.includes('Sample notifications · UI preview only'));
  assert.ok(!top.includes('Notifications, 3 unread'));
  assert.ok(!top.includes('Mark all read'));
  assert.ok(top.includes('disabled aria-disabled="true"'));
});

test('Shared shell has Bangla-accessible labels without altering calculator math', () => {
  const top = file('src/components/layout/TopBar.tsx');
  const calc = file('src/components/layout/Calculator.tsx');
  const trigger = file('src/components/layout/SidebarTrigger.tsx');
  assert.ok(top.includes('ERP মেনু খুলুন'));
  assert.ok(file('src/components/layout/GlobalSearchBox.tsx').includes('খোঁজা মুছুন'));
  assert.ok(calc.includes("toast.success(text('Total copied', 'মোট কপি হয়েছে'))"));
  assert.ok(calc.includes('summarizeCalculatorLines(lines)'));
  assert.ok(calc.includes('data-calculator-total'));
  assert.ok(calc.includes("text('Calculation line ', 'হিসাবের লাইন ')"));
  assert.ok(trigger.includes("text('Expand sidebar','সাইডবার খুলুন')"));
});
