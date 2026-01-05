'use client';

import { useMemo } from 'react';
import type {
  QuizDto,
  QuizPublicMetricsView,
  ProfessionCategoryDto,
} from '@/shared/api/generated/model';

import { useQuizzes } from '@/entities/quiz/api/useQuizzes';
import { useGetAllMetrics } from '@/shared/api/generated/api';
import { useCategories } from '@/entities/category/api/useCategories';

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
  return typeof q.id === 'number' && Number.isFinite(q.id);
}

export type QuizCatalogItem = (QuizDto & { id: number }) & {
  metric?: QuizPublicMetricsView;
  category?: ProfessionCategoryDto;
};

export function useQuizzesCatalog(params: {
  locale: string;
  page: number;
  size: number;
  filters: { q: string; category: string; duration: string };
}) {
  const quizzesQ = useQuizzes({ page: params.page, size: params.size });

  const metricsQ = useGetAllMetrics({
    query: { staleTime: 60_000, gcTime: 5 * 60_000 },
  });

  const categoriesQ = useCategories(params.locale);

  const itemsAll = useMemo(() => {
    const quizzes = extractItems<QuizDto>(quizzesQ.data).filter(hasNumberId);

    const metricsByQuizId = new Map<number, QuizPublicMetricsView>();
    (metricsQ.data ?? []).forEach((m) => {
      if (typeof m.quizId === 'number') metricsByQuizId.set(m.quizId, m);
    });

    const categoriesById = new Map<number, ProfessionCategoryDto>();
    (categoriesQ.data ?? []).forEach((c) => {
      if (typeof c.id === 'number') categoriesById.set(c.id, c);
    });

    return quizzes.map<QuizCatalogItem>((q) => {
      const metric = metricsByQuizId.get(q.id);
      const category =
        metric?.categoryId != null
          ? categoriesById.get(metric.categoryId)
          : undefined;

      return { ...q, metric, category };
    });
  }, [quizzesQ.data, metricsQ.data, categoriesQ.data]);

  const filtered = useMemo(() => {
    const q = params.filters.q.trim().toLowerCase();
    let list = itemsAll;

    if (q) list = list.filter((x) => (x.title ?? '').toLowerCase().includes(q));

    if (params.filters.category !== 'all') {
      list = list.filter(
        (x) => String(x.category?.id ?? '') === params.filters.category,
      );
    }

    return list;
  }, [itemsAll, params.filters]);

  const total = useMemo(() => extractTotal(quizzesQ.data), [quizzesQ.data]);

  return {
    items: filtered,
    total,

    isLoading:
      quizzesQ.isLoading || metricsQ.isLoading || categoriesQ.isLoading,

    quizzesError: quizzesQ.error,
    metricsError: metricsQ.error,
    categoriesError: categoriesQ.error,

    refetch: () => {
      quizzesQ.refetch();
      metricsQ.refetch();
      categoriesQ.refetch();
    },
  };
}
