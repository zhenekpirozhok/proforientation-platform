"use client";

import { Drawer, Menu, Avatar, Select } from "antd";
import type { MenuProps } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/shared/i18n/lib/navigation";

type Props = {
  open: boolean;
  onClose: () => void;
};

type NavItem = {
  key: string;
  label: string;
  href: string;
  show: boolean;
};

export function MobileNavDrawer({ open, onClose }: Props) {
  const locale = useLocale() as "en" | "ru";
  const tDrawer = useTranslations("Drawer");
  const tCommon = useTranslations("Common");

  const router = useRouter();
  const pathname = usePathname();

  const isAuthenticated = false;
  const isAdmin = false;

  const navItems: NavItem[] = [
    { key: "quizzes", label: tDrawer("quizzes"), href: "/quizzes", show: true },
    { key: "results", label: tDrawer("results"), href: "/results", show: isAuthenticated },
    { key: "admin", label: tDrawer("admin"), href: "/admin", show: isAdmin },
  ];

  const visibleItems = navItems.filter((i) => i.show);

  const hrefByKey = new Map(visibleItems.map((i) => [i.key, i.href]));

  const menuItems: MenuProps["items"] = visibleItems.map((i) => ({
    key: i.key,
    label: i.label,
  }));

  const onMenuClick: MenuProps["onClick"] = ({ key }) => {
    const href = hrefByKey.get(String(key));
    if (!href) return;
    router.push(href);
    onClose();
  };

  const onLocaleChange = (nextLocale: "en" | "ru") => {
    router.replace(pathname, { locale: nextLocale });
    onClose();
  };

  return (
    <Drawer placement="right" open={open} onClose={onClose}>
      {isAuthenticated && (
        <div className="flex items-center gap-3 mb-6">
          <Avatar size={48} />
          <div className="font-medium">Sophia Rose</div>
        </div>
      )}

      <Menu mode="inline" items={menuItems} onClick={onMenuClick} />

      <div className="mt-6">
        <Select
          value={locale}
          onChange={onLocaleChange}
          options={[
            { value: "en", label: tCommon("english") },
            { value: "ru", label: tCommon("russian") },
          ]}
          className="w-full"
          aria-label={tCommon("language")}
        />
      </div>
    </Drawer>
  );
}
