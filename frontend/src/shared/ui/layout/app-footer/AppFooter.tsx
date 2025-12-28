"use client";

import { Layout } from "antd";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/shared/i18n/lib/navigation";
import clsx from "clsx";

const { Footer } = Layout;

export function AppFooter() {
  const locale = useLocale() as "en" | "ru";
  const pathname = usePathname();

  const tFooter = useTranslations("Footer");

  return (
    <Footer className="flex justify-end gap-6 text-sm text-slate-500">
      <span className="cursor-pointer transition-colors hover:text-slate-700">
        {tFooter("privacy")}
      </span>
      <span className="cursor-pointer transition-colors hover:text-slate-700">
        {tFooter("terms")}
      </span>

      <span className="flex items-center gap-2">
        <Link
          href={pathname}
          locale="en"
          className={clsx(
            "transition-colors",
            locale === "en"
              ? "font-semibold text-indigo-600 dark:text-indigo-400"
              : "text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
          )}
        >
          EN
        </Link>

        <span className="text-slate-400">|</span>

        <Link
          href={pathname}
          locale="ru"
          className={clsx(
            "transition-colors",
            locale === "ru"
              ? "font-semibold text-indigo-600 dark:text-indigo-400"
              : "text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
          )}
        >
          RU
        </Link>
      </span>
    </Footer>
  );
}
