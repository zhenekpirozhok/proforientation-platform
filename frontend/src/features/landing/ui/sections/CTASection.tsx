"use client";

import { Button, Card } from "antd";
import { useTranslations } from "next-intl";
import { useRouter } from "@/shared/i18n/lib/navigation";

export function CTASection() {
  const t = useTranslations("Landing");
    const router = useRouter();

  return (
    <section className="mt-12">
      <Card className="rounded-[28px]">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="text-lg font-semibold">{t("ctaTitle")}</div>
            <div className="text-slate-600 dark:text-slate-300">
                {t("ctaSubtitle")}
            </div>
          </div>

          <Button type="primary" size="large" className="rounded-2xl" onClick={() => router.push('/quizzes')}>
            {t("ctaPrimary")}
          </Button>
        </div>
      </Card>
    </section>
  );
}
