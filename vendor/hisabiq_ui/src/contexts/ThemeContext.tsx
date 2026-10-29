import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'system';
const storageKey = 'hisabiq-theme';
const isTheme = (value: unknown): value is Theme => value === 'light' || value === 'dark' || value === 'system';
const ThemeContext = createContext<{ theme: Theme; resolvedTheme: 'light' | 'dark'; setTheme: (theme: Theme) => void } | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, updateTheme] = useState<Theme>(() => {
    try { const saved = localStorage.getItem(storageKey); return isTheme(saved) ? saved : 'system'; }
    catch { return 'system'; }
  });
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const resolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme;

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemDark(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) updateTheme(isTheme(event.newValue) ? event.newValue : 'system');
    };
    window.addEventListener('storage', onStorage);
    return () => { media.removeEventListener('change', onChange); window.removeEventListener('storage', onStorage); };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolvedTheme === 'dark');
    root.dataset.theme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;
  }, [resolvedTheme]);

  const setTheme = (value: Theme) => {
    updateTheme(value);
    try { localStorage.setItem(storageKey, value); } catch { /* The selected theme still works without storage. */ }
  };
  return <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
