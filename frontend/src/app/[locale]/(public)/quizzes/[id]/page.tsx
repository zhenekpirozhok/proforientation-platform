"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "antd";

import { useQuizDetails } from "@/entities/quiz/api/useQuizDetails";
import { useCategories } from "@/entities/category/api/useCategories";
import type { ProfessionCategoryDto } from "@/shared/api/generated/model";

import { QuizDetailsHero } from "@/features/quiz-details/ui/QuizDetailsHero";
import { QuizStats } from "@/features/quiz-details/ui/QuizStats";
import { QuizTips } from "@/features/quiz-details/ui/QuizTips";
import { QuizDetailsSkeleton } from "@/features/quiz-details/ui/QuizDetailsSkeleton";

export default function QuizDetailsPage() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const quizId = Number(id);
  const t = useTranslations("QuizDetails");

  if (!Number.isFinite(quizId) || quizId <= 0) return <div>Invalid quiz id</div>;

  const { quiz, metrics, questionCount, estimatedMinutes, isLoading, error } =
    useQuizDetails(quizId);

  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const categoriesById = useMemo(() => {
    const map = new Map<number, ProfessionCategoryDto>();
    categories.forEach((c) => {
      if (typeof c.id === "number") map.set(c.id, c);
    });
    return map;
  }, [categories]);

  const categoryName =
    typeof metrics?.categoryId === "number"
      ? categoriesById.get(metrics.categoryId)?.name
      : undefined;

  if (isLoading || categoriesLoading) return <QuizDetailsSkeleton />;
  if (error || !quiz) return <div>{t("error")}</div>;

  const taken =
    typeof metrics?.attemptsTotal === "number" ? metrics.attemptsTotal : null;

  const title = quiz.title ?? t("fallbackTitle", { id: quizId });
  const description = quiz.descriptionDefault ?? "";

  return (
    <main className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6">
      <Link
        href={`/${locale}/quizzes`}
        className="text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
      >
        ← {t("back")}
      </Link>

      <div className="mt-4">
        <QuizDetailsHero
          title={title}
          description={description}
          categoryName={categoryName}
          minutes={estimatedMinutes}
        />

        <QuizStats
          questions={questionCount}
          minutes={estimatedMinutes}
          taken={taken}
          tQuestions={t("questions")}
          tMinutes={t("minutesToComplete")}
          tTaken={t("taken")}
        />

        <QuizTips
          title={t("tipsTitle")}
          items={[
            t("tip1"),
            t("tip2"),
            t("tip3"),
            t("tip4"),
          ]}
        />

        <div className="mt-10 flex justify-center">
          <Link href={`/${locale}/quizzes/${quizId}/play`}>
            <Button type="primary" size="large" className="rounded-2xl px-10">
              {t("start")} →
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
