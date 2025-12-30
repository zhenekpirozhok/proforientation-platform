"use client";

import Link from "next/link";
import { Button, Card } from "antd";
import {
  ClockCircleOutlined,
  QuestionCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useTranslations } from "next-intl";
import type {
  QuizDto,
  QuizPublicMetricsView,
  ProfessionCategoryDto,
} from "@/shared/api/generated/model";

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

function categoryStyles(color?: string) {
  if (!color) {
    return {
      bg: "bg-slate-100 dark:bg-slate-800/70",
      text: "text-slate-700 dark:text-slate-200",
    };
  }

  return {
    bg: "",
    text: "",
    style: {
      backgroundColor: `${color}22`,
      color,
    } as React.CSSProperties,
  };
}

export function QuizCard({
  locale,
  quiz,
  metric,
  category,
}: {
  locale: string;
  quiz: QuizDto & { id: number };
  metric?: QuizPublicMetricsView;
  category?: ProfessionCategoryDto;
}) {
  const t = useTranslations("Quizzes");

  const title = quiz.title ?? t("fallbackTitle", { id: quiz.id });

  const description =
    (quiz as any).descriptionDefault ??
    ""; 

  const taken =
    typeof metric?.attemptsTotal === "number" ? metric.attemptsTotal : 0;

  const questionsTotal =
    typeof metric?.questionsTotal === "number" ? metric.questionsTotal : null;

  const durationMin = minutesFromSeconds(metric?.estimatedDurationSeconds) ?? 15;

  const catLabel = category?.name ?? t("category");
  const catColor = category?.colorCode;
  const cat = categoryStyles(catColor);

  return (
    <Card
      className={[
        "h-full", 
        "rounded-2xl",
        "border border-slate-200/70 dark:border-slate-800/70",
        "bg-white dark:bg-slate-950",
        "transition",
        "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-slate-900/5 dark:hover:shadow-black/30",
      ].join(" ")}
      styles={{ body: { padding: 18 } }}
    >
      <div className="flex h-full flex-col">
<div className="flex items-center justify-between gap-3">
  <span
    className={[
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
      "ring-1 ring-inset ring-slate-900/5 dark:ring-white/10",
      cat.bg,
      cat.text,
    ].join(" ")}
    style={cat.style}
  >
    {catLabel}
  </span>

  <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
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
        {questionsTotal} {t("questions")}
      </span>
    ) : null}
  </div>
</div>


        <div className="mt-3 text-lg font-semibold leading-snug text-slate-900 dark:text-slate-100">
          {title}
        </div>

        <div
          className={[
            "mt-2",
            "text-sm text-slate-600 dark:text-slate-300",
            "line-clamp-3",
          ].join(" ")}
          style={{
            minHeight: "3.75rem",
          }}
        >
          {description || "\u00A0" }
        </div>

        <div className="mt-auto pt-5">
          <Link href={`/${locale}/quizzes/${quiz.id}`} className="block w-full">
            <Button type="primary" size="large" className="w-full rounded-2xl">
              {t("start")}
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
