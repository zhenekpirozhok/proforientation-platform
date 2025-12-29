"use client";

import { AppHeader } from "../app-header/AppHeader";
import { AppFooter } from "../app-footer/AppFooter";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/70">
        <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6">
          <AppHeader />
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/70">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6">
          <AppFooter />
        </div>
      </footer>
    </div>
  );
}
