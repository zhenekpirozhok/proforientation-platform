import { Layout } from "antd";

const { Footer } = Layout;

export function AppFooter() {
  return (
    <Footer className="flex justify-end gap-6 text-sm text-slate-500">
      <span className="cursor-pointer">Privacy</span>
      <span className="cursor-pointer">Terms</span>
      <span>EN | RU</span>
    </Footer>
  );
}
