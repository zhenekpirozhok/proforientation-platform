import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { Link } from "@/shared/i18n/lib/navigation";
import type { AppLocale } from "@/shared/i18n/lib/routing";

export default async function NotFoundPage({
  params,
}: {
  params: { locale: AppLocale };
}) {
  const { locale } = params;
  const t = await getTranslations({ locale, namespace: "NotFound" });

  return (
    <ErrorState
      status="404"
      title={t("title")}
      subtitle={
        <span className="text-slate-600 dark:text-slate-300">
          {t("subtitle")}
        </span>
      }
      extra={
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            locale={locale}
            className="inline-flex items-center justify-center rounded-2xl bg-indigo-600 px-5 py-2.5 text-white"
          >
            {t("toHome")}
          </Link>

          <Link
            href="/quizzes"
            locale={locale}
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          >
            {t("toQuizzes")}
          </Link>
        </div>
      }
    />
  );
}
