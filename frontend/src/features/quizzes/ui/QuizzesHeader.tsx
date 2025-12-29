"use client";

import { Card, Typography } from "antd";
import { useTranslations } from "next-intl";

const { Title, Text } = Typography;

export function QuizzesHeader({ total }: { total: number }) {
  const t = useTranslations("Quizzes");

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between pb-4">
      <div className="min-w-0">
        <Title className="!mb-1 !text-2xl md:!text-4xl">
          {t("title")}
        </Title>
        <Text className="text-slate-600 dark:text-slate-300">
          {t("subtitle")}
        </Text>
      </div>

      <Card className="w-full rounded-2xl md:w-[220px]">
        <div className="text-3xl font-semibold text-indigo-600 dark:text-indigo-400">
          {total}
        </div>
        <div className="text-slate-500 dark:text-slate-400">
          {t("availableQuizzes")}
        </div>
      </Card>
    </div>
  );
}
