import { AppShell } from "@/shared/ui/layout/app-shell/AppShell";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
