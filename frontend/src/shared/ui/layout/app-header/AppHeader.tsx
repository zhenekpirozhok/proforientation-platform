"use client";

import { Layout, Button, Select, Avatar } from "antd";
import { MenuOutlined, SettingOutlined } from "@ant-design/icons";
import { useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";

import { MobileNavDrawer } from "./MobileNavDrawer";
import { ThemeToggle } from "@/shared/ui/theme/theme-toggle/ThemeToggle";
import { useEffectiveTheme } from "@/shared/model/theme/useEffectiveTheme";
import { Link, usePathname, useRouter } from "@/shared/i18n/lib/navigation";

import "./app-header.css";

const { Header } = Layout;

type Locale = "en" | "ru";
type NavItem = { key: string; label: string; href: string; show: boolean };

export function AppHeader() {
  const [open, setOpen] = useState(false);

  const tHeader = useTranslations("Header");
  const tCommon = useTranslations("Common");

  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const theme = useEffectiveTheme();
  const isDark = theme === "dark";

  // TODO: заменить на реальные данные
  const isAuthenticated = false;
  const isAdmin = false;

  const navItems = useMemo<NavItem[]>(
    () => [
      { key: "quizzes", label: tHeader("quizzes"), href: "/quizzes", show: true },
      { key: "profile", label: tHeader("profile"), href: "/profile", show: isAuthenticated },
      { key: "admin", label: tHeader("admin"), href: "/admin", show: isAdmin },
    ],
    [tHeader, isAuthenticated, isAdmin]
  );

  const activeHref = useMemo(() => {
    return pathname;
  }, [pathname]);

  const isActive = (href: string) => activeHref === href || activeHref.startsWith(`${href}/`);

  const onLocaleChange = (nextLocale: Locale) => {
    router.replace(pathname, { locale: nextLocale });
  };

  return (
    <Header
      style={{
        padding: 0,
        background: isDark ? "#020617" : "#FFFFFF",
        borderBottom: isDark ? "1px solid #1E293B" : "1px solid #E2E8F0",
      }}
    >
      <div className="mx-auto flex h-full max-w-[1200px] items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" locale={locale} className="flex items-center gap-2">
            <Image src="/images/logo.svg" alt={tHeader("brand")} width={28} height={28} priority />
            <span className="font-heading text-lg font-semibold text-slate-900 dark:text-slate-100">
              {tHeader("brand")}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navItems
              .filter((i) => i.show)
              .map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    locale={locale}
                    className={[
                      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "!text-[#4F46E5] dark:!text-[#818CF8]"
                        : "!text-slate-700 hover:!text-slate-900 dark:!text-slate-300 dark:hover:!text-slate-100",
                    ].join(" ")}
                  >
                    {item.label}
                  </Link>
                );
              })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <Select
              value={locale}
              onChange={onLocaleChange}
              options={[
                { value: "en", label: tCommon("english") },
                { value: "ru", label: tCommon("russian") },
              ]}
              className="cp-lang-select w-[140px]"
              classNames={{ popup: { root: "cp-lang-dropdown" } }}
              popupMatchSelectWidth={false}
              aria-label={tCommon("language")}
            />
          </div>

          <ThemeToggle />

          {isAuthenticated ? (
            <button
              type="button"
              className="hidden md:flex items-center gap-2 rounded-full px-2 py-1
                         text-slate-900 hover:bg-slate-100
                         dark:text-slate-100 dark:hover:bg-slate-900"
              aria-label={tHeader("userMenu")}
            >
              <Avatar size="small" />
              <span className="hidden md:inline">Username</span>
              <SettingOutlined />
            </button>
          ) : (
            <div className="hidden md:block">
              <Button type="primary">{tHeader("signIn")}</Button>
            </div>
          )}

          <div className="md:hidden">
            <Button
              type="text"
              aria-label="Open menu"
              icon={<MenuOutlined />}
              className="text-slate-700 dark:text-slate-200"
              onClick={() => setOpen(true)}
            />
          </div>
        </div>
      </div>

      <MobileNavDrawer open={open} onClose={() => setOpen(false)} />
    </Header>
  );
}
