import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppTheme = "light" | "dark";
export type ThemeMode = AppTheme | "system";

type ThemeState = {
    themeMode: ThemeMode;
    hydrated: boolean;

    setThemeMode: (mode: ThemeMode) => void;
    toggleTheme: () => void;
    setHydrated: (v: boolean) => void;
};

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            themeMode: "system",
            hydrated: false,

            setThemeMode: (mode) => set({ themeMode: mode }),

            toggleTheme: () => {
                const mode = get().themeMode;

                if (mode === "system") {
                    const isSystemDark =
                        typeof window !== "undefined" &&
                        window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;

                    set({ themeMode: isSystemDark ? "light" : "dark" });
                    return;
                }

                set({ themeMode: mode === "light" ? "dark" : "light" });
            },

            setHydrated: (v) => set({ hydrated: v }),
        }),
        {
            name: "app-theme",
            version: 2,
            partialize: (s) => ({ themeMode: s.themeMode }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true);
            },
        }
    )
);
