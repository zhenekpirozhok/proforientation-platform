import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppTheme = "light" | "dark";

type ThemeState = {
    theme: AppTheme;
    hydrated: boolean;
    setTheme: (theme: AppTheme) => void;
    toggleTheme: () => void;
    setHydrated: (v: boolean) => void;
};

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            theme: "light",
            hydrated: false,
            setTheme: (theme) => set({ theme }),
            toggleTheme: () =>
                set({ theme: get().theme === "light" ? "dark" : "light" }),
            setHydrated: (v) => set({ hydrated: v }),
        }),
        {
            name: "app-theme",
            version: 1,
            partialize: (s) => ({ theme: s.theme }),
            onRehydrateStorage: () => (state) => {
                state?.setHydrated(true);
            },
        }
    )
);
