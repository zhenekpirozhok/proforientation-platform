"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Alert } from "antd";

import { useQuizzes } from "@/entities/quiz/api/useQuizzes";
import type { QuizDto } from "@/shared/api/generated/model";

import { useGetAllMetrics } from "@/shared/api/generated/api";
import type { QuizPublicMetricsView } from "@/shared/api/generated/model";

import { QuizzesHeader } from "@/features/quizzes/ui/QuizzesHeader";
import { QuizzesFilters } from "@/features/quizzes/ui/QuizzesFilters";
import { QuizGridSkeleton } from "@/features/quizzes/ui/QuizGridSkeleton";
import { QuizEmptyState } from "@/features/quizzes/ui/QuizEmptyState";
import { QuizCard } from "@/entities/quiz/ui/QuizCard";
import { QuizzesPagination } from "@/features/quizzes/ui/QuizzesPagination";

type PageLike<T> = {
  content?: T[];
  items?: T[];
  totalElements?: number;
  total?: number;
};

function extractItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  const page = data as PageLike<T> | null | undefined;
  return page?.content ?? page?.items ?? [];
}

function extractTotal(data: unknown): number {
  const page = data as PageLike<unknown> | null | undefined;
  return (page?.totalElements ?? page?.total ?? 0) as number;
}

function hasNumberId(q: QuizDto): q is QuizDto & { id: number } {
  return typeof q.id === "number" && Number.isFinite(q.id);
}

export default function QuizzesPage() {
  const t = useTranslations("Quizzes");
  const { locale } = useParams<{ locale: string }>();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  const [filters, setFilters] = useState({
    q: "",
    category: "all",
    duration: "any",
  });

  const apiPage = Math.max(0, page - 1);

  const {
    data,
    isLoading: isQuizzesLoading,
    error: quizzesError,
  } = useQuizzes({ page: apiPage, size: pageSize });

  const {
    data: metrics,
    isLoading: isMetricsLoading,
    error: metricsError,
  } = useGetAllMetrics({
    query: { staleTime: 60_000, gcTime: 5 * 60_000 },
  });

  const items = useMemo(
    () => extractItems<QuizDto>(data).filter(hasNumberId),
    [data]
  );

  const total = useMemo(() => extractTotal(data), [data]);

  const metricsByQuizId = useMemo(() => {
    const map = new Map<number, QuizPublicMetricsView>();
    (metrics ?? []).forEach((m: QuizPublicMetricsView) => {
      if (typeof m.quizId === "number") map.set(m.quizId, m);
    });
    return map;
  }, [metrics]);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();

    let list = items;

    if (q) {
      list = list.filter((x) => (x.title ?? "").toLowerCase().includes(q));
    }

    if (filters.category !== "all") {
      list = list.filter((quiz) => {
        const m = metricsByQuizId.get(quiz.id);
        const cat = m?.categoryId;
        return cat != null && String(cat) === String(filters.category);
      });
    }

    return list;
  }, [items, filters, metricsByQuizId]);

  const isLoading = isQuizzesLoading || isMetricsLoading;

  return (
    <div className="pb-4">
      <QuizzesHeader total={total || filtered.length} />

      <QuizzesFilters
        value={filters}
        onChange={setFilters}
        onClear={() => setFilters({ q: "", category: "all", duration: "any" })}
      />

      {quizzesError ? (
        <div className="mt-6">
          <Alert type="error" message={t("error")} showIcon />
        </div>
      ) : null}

      {metricsError ? (
        <div className="mt-6">
          <Alert
            type="warning"
            message="Metrics are temporarily unavailable"
            showIcon
          />
        </div>
      ) : null}

      {isLoading ? (
        <QuizGridSkeleton />
      ) : filtered.length === 0 ? (
        <QuizEmptyState />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((q) => (
            <QuizCard
              key={q.id}
              locale={locale}
              quiz={q}
              metric={metricsByQuizId.get(q.id)} 
            />
          ))}
        </div>
      )}

      {total > pageSize ? (
        <QuizzesPagination
          page={page}
          pageSize={pageSize}
          total={total}
          onChange={(p) => setPage(p)}
        />
      ) : null}
    </div>
  );
}
