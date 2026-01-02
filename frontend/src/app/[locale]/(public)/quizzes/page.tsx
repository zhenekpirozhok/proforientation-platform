"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Alert } from "antd";

import { useQuizzes } from "@/entities/quiz/api/useQuizzes";
import type { QuizDto, QuizPublicMetricsView } from "@/shared/api/generated/model";
import { useGetAllMetrics } from "@/shared/api/generated/api";
import { useCategories } from "@/entities/category/api/useCategories";
import type { ProfessionCategoryDto } from "@/shared/api/generated/model";

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

  const [isMobile, setIsMobile] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  const [filters, setFilters] = useState({
    q: "",
    category: "all",
    duration: "any",
  });

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const set = () => setIsMobile(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  const { data, isLoading: isQuizzesLoading, error: quizzesError } = useQuizzes({
    page,
    size: pageSize,
  });

  const { data: metrics, isLoading: isMetricsLoading, error: metricsError } =
    useGetAllMetrics({
      query: { staleTime: 60_000, gcTime: 5 * 60_000 },
    });

  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    error: categoriesError,
  } = useCategories();

  const items = useMemo(
    () => extractItems<QuizDto>(data).filter(hasNumberId),
    [data]
  );

  const total = useMemo(() => extractTotal(data), [data]);

  const metricsByQuizId = useMemo(() => {
    const map = new Map<number, QuizPublicMetricsView>();
    (metrics ?? []).forEach((m) => {
      if (typeof m.quizId === "number") map.set(m.quizId, m);
    });
    return map;
  }, [metrics]);

  const categoriesById = useMemo(() => {
    const map = new Map<number, ProfessionCategoryDto>();
    categories.forEach((c) => {
      if (typeof c.id === "number") map.set(c.id, c);
    });
    return map;
  }, [categories]);

  const applyFilters = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return (list: (QuizDto & { id: number })[]) => {
      let out = list;

      if (q) out = out.filter((x) => (x.title ?? "").toLowerCase().includes(q));

      if (filters.category !== "all") {
        out = out.filter((quiz) => {
          const m = metricsByQuizId.get(quiz.id);
          const cat = m?.categoryId;
          return cat != null && String(cat) === String(filters.category);
        });
      }

      return out;
    };
  }, [filters, metricsByQuizId]);

  const [mobileAccum, setMobileAccum] = useState<(QuizDto & { id: number })[]>([]);

  useEffect(() => {
    setPage(1);
    setMobileAccum([]);
  }, [filters.q, filters.category, filters.duration]);

  useEffect(() => {
    if (!isMobile) return;

    const next = applyFilters(items);
    setMobileAccum((prev) => {
      if (page === 1) return next;
      const seen = new Set(prev.map((x) => x.id));
      const merged = [...prev];
      for (const it of next) if (!seen.has(it.id)) merged.push(it);
      return merged;
    });
  }, [isMobile, page, items, applyFilters]);

  const filteredDesktop = useMemo(() => applyFilters(items), [items, applyFilters]);

  const listToRender = isMobile ? mobileAccum : filteredDesktop;

  const isLoading = isQuizzesLoading || isMetricsLoading || isCategoriesLoading;

  return (
    <div className="pb-4">
      <QuizzesHeader total={total || listToRender.length} />

      <QuizzesFilters
        value={filters}
        onChange={setFilters}
        onClear={() => setFilters({ q: "", category: "all", duration: "any" })}
        categories={categories}
      />

      {quizzesError ? (
        <div className="mt-6">
          <Alert type="error" message={t("error")} showIcon />
        </div>
      ) : null}

      {!quizzesError && metricsError ? (
        <div className="mt-6">
          <Alert type="warning" message="Metrics are temporarily unavailable" showIcon />
        </div>
      ) : null}

      {!quizzesError && !metricsError && categoriesError ? (
        <div className="mt-6">
          <Alert type="warning" message="Categories are temporarily unavailable" showIcon />
        </div>
      ) : null}

      {isLoading && page === 1 ? (
        <QuizGridSkeleton />
      ) : listToRender.length === 0 ? (
        <QuizEmptyState />
      ) : (
        <div className="mt-6 grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listToRender.map((q) => {
            const m = metricsByQuizId.get(q.id);
            const category =
              m?.categoryId != null ? categoriesById.get(m.categoryId) : undefined;

            return (
              <QuizCard
                key={q.id}
                locale={locale}
                quiz={q}
                metric={m}
                category={category}
              />
            );
          })}
        </div>
      )}

      {total > pageSize ? (
        <QuizzesPagination
          page={page}
          pageSize={pageSize}
          total={total}
          loading={isLoading && page > 1}
          onChange={(p) => setPage(p)}
        />
      ) : null}
    </div>
  );
}
