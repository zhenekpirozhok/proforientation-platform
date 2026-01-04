'use client';

import { Button } from 'antd';
import { MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useThemeStore } from '@/shared/model/theme/store';
import { useEffectiveTheme } from '@/shared/model/theme/useEffectiveTheme';

export function ThemeToggle() {
  const theme = useEffectiveTheme();
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  return (
    <Button
      type="text"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      icon={theme === 'dark' ? <SunOutlined /> : <MoonOutlined />}
    />
  );
}
