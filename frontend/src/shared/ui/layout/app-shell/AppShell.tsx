"use client";

import { Layout } from "antd";
import { AppHeader } from "../app-header/AppHeader";
import { AppFooter } from "../app-footer/AppFooter";

const { Content } = Layout;

type Props = {
  children: React.ReactNode;
};

export function AppShell({ children }: Props) {
  return (
    <Layout className="h-full min-h-screen flex flex-col">
      <AppHeader />

      <Content className="flex flex-1 justify-center px-4 py-6 md:px-6">
        <div className="w-full max-w-[1200px]">{children}</div>
      </Content>

      <AppFooter />
    </Layout>
  );
}

