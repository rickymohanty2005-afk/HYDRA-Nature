import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'hydra_theme';
const listeners = new Set<() => void>();

const read = (): Theme => {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* ignore */ }
  return 'light';
};

let current: Theme = typeof window === 'undefined' ? 'light' : read();

const apply = (t: Theme) => {
  const root = document.documentElement;
  root.classList.toggle('dark', t === 'dark');
  root.style.colorScheme = t;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0E1512' : '#13382B');
};

if (typeof window !== 'undefined') apply(current);

export const setTheme = (t: Theme) => {
  current = t;
  try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
  apply(t);
  listeners.forEach((l) => l());
};

export const toggleTheme = () => setTheme(current === 'dark' ? 'light' : 'dark');

export const useTheme = () => {
  const theme = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => current,
    () => 'light' as Theme
  );
  return { theme, isDark: theme === 'dark', toggle: toggleTheme };
};
