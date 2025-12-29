"use client";

import Link from "next/link";
import { Button, Card, Tag } from "antd";
import { ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import { useTranslations } from "next-intl";
import type { QuizDto } from "@/shared/api/generated/model";

function badgeColor(seed: number) {
  const colors = ["blue", "green", "purple", "magenta", "orange", "cyan"];
  return colors[Math.abs(seed) % colors.length] as any;
}

export function QuizCard({
  locale,
  quiz,
}: {
  locale: string;
  quiz: QuizDto & { id: number };
}) {
  const t = useTranslations("Quizzes");

  const title = quiz.title ?? t("fallbackTitle", { id: quiz.id });

  // если у тебя пока нет полей duration/taken/category — оставим “мок”,
  // а потом подключишь к реальным данным
  const durationMin = 15;
  const taken = 2300;

  return (
    <Card className="rounded-2xl transition-transform hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <Tag color={badgeColor(quiz.id)} className="rounded-full px-3 py-1">
          {quiz.categoryId ?? "Category"}
        </Tag>

        <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <ClockCircleOutlined /> {t("min", { count: durationMin })}
          </span>
          <span className="inline-flex items-center gap-1">
            <UserOutlined /> {t("taken", { count: "2.3k" as any })}
          </span>
        </div>
      </div>

      <div className="mt-3 text-lg font-semibold leading-snug">{title}</div>

      <div className="mt-2 line-clamp-3 text-slate-600 dark:text-slate-300">
        {quiz.descriptionDefault ??
          "Discover if you have the skills and interests for a successful career path."}
      </div>

      <div className="mt-5">
        <Link href={`/${locale}/quizzes/${quiz.id}`}>
          <Button type="primary" size="large" className="w-full rounded-2xl">
            {t("start")}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
