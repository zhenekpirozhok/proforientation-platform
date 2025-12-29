"use client";

import { Card, Empty } from "antd";
import { useTranslations } from "next-intl";

export function QuizEmptyState() {
  const t = useTranslations("Quizzes");

  return (
    <Card className="mt-6 rounded-2xl">
      <div className="py-16">
        <Empty
          description={
            <div className="text-center">
              <div className="text-lg font-medium">{t("emptyTitle")}</div>
              <div className="mt-1 text-slate-500 dark:text-slate-400">
                {t("emptyHint")}
              </div>
            </div>
          }
        />
      </div>
    </Card>
  );
}
