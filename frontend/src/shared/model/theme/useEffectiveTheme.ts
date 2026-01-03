'use client';

import { useEffect, useState } from 'react';
import { useThemeStore, type AppTheme } from './store';

function getSystemTheme(): AppTheme {
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches
    ? 'dark'
    : 'light';
}

export function useEffectiveTheme(): AppTheme {
  const mode = useThemeStore((s) => s.themeMode);
  const hydrated = useThemeStore((s) => s.hydrated);

  const [systemTheme, setSystemTheme] = useState<AppTheme>(() => {
    if (typeof window === 'undefined') return 'light';
    return getSystemTheme();
  });

  useEffect(() => {
    if (!hydrated) return;

    const mql = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mql) return;

    const handler = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mql.addEventListener?.('change', handler);
    return () => mql.removeEventListener?.('change', handler);
  }, [hydrated]);

  return mode === 'system' ? systemTheme : mode;
}
