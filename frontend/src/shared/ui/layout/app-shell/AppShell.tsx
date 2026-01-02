"use client";

import { AppHeader } from "../app-header/AppHeader";
import { AppFooter } from "../app-footer/AppFooter";
import { PageContainer } from "../page-container/PageContainer";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col text-slate-900 dark:text-slate-100">
      <header className="shrink-0 border-b border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/70">
        <div className="mx-auto w-full max-w-[1200px] px-4 md:px-6">
          <AppHeader />
        </div>
      </header>

      <main className="flex-1 py-4 sm:py-6">
        <PageContainer>{children}</PageContainer>
      </main>

      <footer className="shrink-0 border-t border-slate-200/60 bg-white/80 backdrop-blur dark:border-slate-800/60 dark:bg-slate-950/70">
        <div className="mx-auto w-full max-w-[1200px] px-4 py-6 md:px-6">
          <AppFooter />
        </div>
      </footer>
    </div>
  );
}

