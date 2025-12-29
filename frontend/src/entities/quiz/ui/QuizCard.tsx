"use client";

import Link from "next/link";
import { Button, Card } from "antd";
import {
  ClockCircleOutlined,
  QuestionCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import type { QuizDto } from "@/shared/api/generated/model";
import type { QuizPublicMetricsView } from "@/shared/api/generated/model";

function clampInt(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function formatTaken(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "0";
  if (n < 1_000) return String(n);
  if (n < 1_000_000) {
    const v = n / 1_000;
    return `${v.toFixed(n % 1_000 === 0 ? 0 : 1)}k`;
  }
  const v = n / 1_000_000;
  return `${v.toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
}

function minutesFromSeconds(sec?: number | null) {
  if (sec == null || !Number.isFinite(sec)) return null;
  const min = Math.round(sec / 60);
  return clampInt(min, 1, 180);
}

function pickCategoryVisual(categoryId?: number | null) {
  const palette = [
    {
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
      text: "text-indigo-700 dark:text-indigo-300",
      label: "Technology",
    },
    {
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
      text: "text-emerald-700 dark:text-emerald-300",
      label: "Healthcare",
    },
    {
      bg: "bg-violet-50 dark:bg-violet-950/40",
      text: "text-violet-700 dark:text-violet-300",
      label: "Business",
    },
    {
      bg: "bg-sky-50 dark:bg-sky-950/40",
      text: "text-sky-700 dark:text-sky-300",
      label: "Finance",
    },
    {
      bg: "bg-amber-50 dark:bg-amber-950/40",
      text: "text-amber-700 dark:text-amber-300",
      label: "Education",
    },
    {
      bg: "bg-rose-50 dark:bg-rose-950/40",
      text: "text-rose-700 dark:text-rose-300",
      label: "Creative",
    },
  ];

  if (typeof categoryId !== "number" || !Number.isFinite(categoryId)) {
    return { ...palette[0], label: "Category" };
  }
  return palette[Math.abs(categoryId) % palette.length];
}

export function QuizCard({
  locale,
  quiz,
  metric,
}: {
  locale: string;
  quiz: QuizDto & { id: number };
  metric?: QuizPublicMetricsView;
}) {
  const t = useTranslations("Quizzes");

  const title = quiz.title ?? t("fallbackTitle", { id: quiz.id });

  const description =
    (quiz as any).descriptionDefault ??
    "Discover if you have the skills and interests for a successful career path.";

  const taken =
    typeof metric?.attemptsTotal === "number" ? metric.attemptsTotal : 0;

  const questionsTotal =
    typeof metric?.questionsTotal === "number" ? metric.questionsTotal : null;

  const durationMin = minutesFromSeconds(metric?.estimatedDurationSeconds) ?? 15;

  const cat = pickCategoryVisual(metric?.categoryId);

  return (
    <Card
      className={[
        "rounded-2xl",
        "border border-slate-200/70 dark:border-slate-800/70",
        "bg-white dark:bg-slate-950",
        "transition-all",
        "hover:-translate-y-0.5 hover:shadow-lg",
      ].join(" ")}
      styles={{ body: { padding: 18 } }} 
    >

      <div className="flex items-start justify-between gap-3">
        <span
          className={[
            "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
            cat.bg,
            cat.text,
          ].join(" ")}
        >
          {cat.label}
        </span>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          <span className="inline-flex items-center gap-1">
            <ClockCircleOutlined />
            {t("min", { count: durationMin })}
          </span>

          <span className="inline-flex items-center gap-1">
            <UserOutlined />
            {t("taken", { count: formatTaken(taken) })}
          </span>

          {questionsTotal != null ? (
            <span className="inline-flex items-center gap-1">
              <QuestionCircleOutlined />
              {questionsTotal}
              {" " + t("questions")}
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-3 text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
        {title}
      </div>

      <div className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
        {description}
      </div>

      <div className="mt-5 flex gap-3">
        <Link href={`/${locale}/quizzes/${quiz.id}`} className="w-full">
          <Button type="primary" size="large" className="w-full rounded-2xl">
            {t("start")}
          </Button>
        </Link>
      </div>
    </Card>
  );
}
