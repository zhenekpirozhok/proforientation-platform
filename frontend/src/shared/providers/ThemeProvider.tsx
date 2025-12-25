"use client";

import { ConfigProvider } from "antd";
import { useEffect, useMemo } from "react";
import { darkTheme, lightTheme } from "@/shared/config/theme";
import { useThemeStore } from "@/shared/model/theme/store";

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme);
  const hydrated = useThemeStore((s) => s.hydrated);
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    if (!hydrated) return;
    const storageTheme = localStorage.getItem("app-theme");
    if (!storageTheme) {
      setTheme(getSystemTheme());
    }
  }, [hydrated, setTheme]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const antdTheme = useMemo(
    () => (theme === "dark" ? darkTheme : lightTheme),
    [theme]
  );

  return <ConfigProvider theme={antdTheme}>{children}</ConfigProvider>;
}
