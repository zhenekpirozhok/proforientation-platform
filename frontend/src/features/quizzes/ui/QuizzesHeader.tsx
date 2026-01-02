"use client";

import { Card, Typography } from "antd";
import { useTranslations } from "next-intl";

const { Title, Text } = Typography;

export function QuizzesHeader({ total }: { total: number }) {
  const t = useTranslations("Quizzes");
  const count = Number(total);

  return (
    <div className="flex flex-col gap-4 pb-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <div className="grid grid-cols-[1fr_auto] items-start gap-x-3 gap-y-2">
          <Title className="!mb-0 !text-2xl leading-tight md:!text-4xl">
            {t("title")}
          </Title>

          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-inset ring-slate-900/5 dark:bg-slate-900 dark:text-slate-200 dark:ring-white/10 md:hidden">
            {t("availableCount", { total: count })}
          </span>

          <Text className="col-span-2 text-slate-600 dark:text-slate-300">
            {t("subtitle")}
          </Text>
        </div>
      </div>

      <Card className="hidden w-full rounded-2xl md:block md:w-[220px]">
        <div className="text-3xl font-semibold text-indigo-600 dark:text-indigo-400">
          {count}
        </div>
        <div className="text-slate-500 dark:text-slate-400">
          {t("availableQuizzes")}
        </div>
      </Card>
    </div>
  );
}
