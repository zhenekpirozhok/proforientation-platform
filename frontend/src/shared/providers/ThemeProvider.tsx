'use client';

import { ConfigProvider } from 'antd';
import { useLayoutEffect, useMemo } from 'react';
import { darkTheme, lightTheme } from '@/shared/assets/config/theme';
import { useThemeStore } from '@/shared/model/theme/store';
import { useEffectiveTheme } from '@/shared/model/theme/useEffectiveTheme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useThemeStore((s) => s.hydrated);
  const theme = useEffectiveTheme();

  useLayoutEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme, hydrated]);

  const antdTheme = useMemo(
    () => (theme === 'dark' ? darkTheme : lightTheme),
    [theme],
  );

  if (!hydrated) return null;

  return <ConfigProvider theme={antdTheme}>{children}</ConfigProvider>;
}
