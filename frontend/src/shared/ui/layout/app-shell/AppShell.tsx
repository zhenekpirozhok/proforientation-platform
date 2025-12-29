"use client";

import { Layout } from "antd";
import { AppHeader } from "../app-header/AppHeader";
import { AppFooter } from "../app-footer/AppFooter";

const { Content } = Layout;

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <Layout className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <AppHeader />

      <Content className="flex flex-1 justify-center px-4 py-6 md:px-6 bg-transparent">
        <div className="w-full max-w-[1200px]">{children}</div>
      </Content>

      <AppFooter />
    </Layout>
  );
}
