"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/shared/i18n/lib/navigation";
import clsx from "clsx";

type Locale = "en" | "ru";

export function AppFooter() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const tFooter = useTranslations("Footer");

  return (
    <div
      className="
        flex flex-col-reverse gap-4
        md:flex-row md:items-center md:justify-between
        text-sm
        text-slate-600 dark:text-slate-300
      "
    >
      {/* Left / bottom: legal */}
      <div className="flex flex-wrap items-center gap-4">
        <span className="cursor-pointer transition-colors hover:text-slate-900 dark:hover:text-white">
          {tFooter("privacy")}
        </span>
        <span className="cursor-pointer transition-colors hover:text-slate-900 dark:hover:text-white">
          {tFooter("terms")}
        </span>
      </div>

      {/* Right / top: locale switch */}
      <div className="flex items-center gap-2">
        <FooterLocaleLink
          href={pathname}
          locale="en"
          active={locale === "en"}
        >
          EN
        </FooterLocaleLink>

        <span className="opacity-40">|</span>

        <FooterLocaleLink
          href={pathname}
          locale="ru"
          active={locale === "ru"}
        >
          RU
        </FooterLocaleLink>
      </div>
    </div>
  );
}

function FooterLocaleLink({
  href,
  locale,
  active,
  children,
}: {
  href: string;
  locale: Locale;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      locale={locale}
      className={clsx(
        "transition-colors",
        active
          ? "font-semibold text-indigo-600 dark:text-indigo-400"
          : "hover:text-indigo-600 dark:hover:text-indigo-400"
      )}
    >
      {children}
    </Link>
  );
}
