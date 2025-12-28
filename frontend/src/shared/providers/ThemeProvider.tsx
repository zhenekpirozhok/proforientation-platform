"use client";

import { ConfigProvider } from "antd";
import { useLayoutEffect, useMemo, useState } from "react";
import { darkTheme, lightTheme } from "@/shared/config/theme";
import { useThemeStore } from "@/shared/model/theme/store";
import { useEffectiveTheme } from "@/shared/model/theme/useEffectiveTheme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const hydrated = useThemeStore((s) => s.hydrated);
  const theme = useEffectiveTheme();
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    if (!hydrated) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    setReady(true);
  }, [theme, hydrated]);

  const antdTheme = useMemo(
    () => (theme === "dark" ? darkTheme : lightTheme),
    [theme]
  );

  if (!ready) return null;

  return <ConfigProvider theme={antdTheme}>{children}</ConfigProvider>;
}
