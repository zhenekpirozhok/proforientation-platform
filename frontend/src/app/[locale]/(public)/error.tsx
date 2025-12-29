"use client";

import { useTranslations, useLocale } from "next-intl";
import { ErrorState } from "@/shared/ui/feedback/ErrorState";
import { ErrorActionsClient } from "@/shared/ui/feedback/ErrorActionsClient";
import { useRouter } from "@/shared/i18n/lib/navigation";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useLocale();
  const t = useTranslations("Errors");
  const router = useRouter();

  return (
    <ErrorState
      status="500"
      title={t("title")}
      subtitle={
        <span className="text-slate-600 dark:text-slate-300">
          {t("subtitle")}
        </span>
      }
      extra={
        <ErrorActionsClient
          primary={{
            label: t("retry"),
            onClick: () => reset(),
            type: "primary",
          }}
          secondary={{
            label: t("toQuizzes"),
            onClick: () => router.push("/quizzes", { locale }),
          }}
        />
      }
    />
  );
}
