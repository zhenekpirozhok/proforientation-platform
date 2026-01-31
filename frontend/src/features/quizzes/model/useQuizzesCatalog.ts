'use client';

import { useMemo } from 'react';
import type {
  QuizDto,
  ProfessionCategoryDto,
  Search1Params,
} from '@/shared/api/generated/model';

import { useQuizzes } from '@/entities/quiz/api/useQuizzes';
import { useGetAllMetrics } from '@/shared/api/generated/api';
import { useCategories } from '@/entities/category/api/useCategories';
import { useSearchQuizzesLocalized } from '@/entities/quiz/api/useSearchQuizzes';
import { useDebounce } from '@/shared/lib/useDebounce';

import type { QuizCatalogItem, PageLike, QuizMetric } from './types';

function extractItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  const page = data as PageLike<T> | null | undefined;
  return page?.content ?? page?.items ?? [];
}

function extractTotal(data: unknown): number {
  const page = data as PageLike<unknown> | null | undefined;
  const v = page?.totalElements ?? page?.total ?? 0;
  return typeof v === 'number' ? v : 0;
}

function hasNumberId(q: QuizDto): q is QuizDto & { id: number } {
  return typeof q.id === 'number' && Number.isFinite(q.id);
}

function pickDurationSeconds(metric?: QuizMetric) {
  return typeof metric?.estimatedDurationSeconds === 'number'
    ? metric.estimatedDurationSeconds
    : null;
}

function matchesDuration(seconds: number | null, duration: string): boolean {
  if (duration === 'any') return true;
  if (seconds == null) return false;

  const shortMax = 15 * 60;
  const midMax = 35 * 60;

  if (duration === 'short') return seconds <= shortMax;
  if (duration === 'mid') return seconds > shortMax && seconds <= midMax;
  if (duration === 'long') return seconds > midMax;

  return true;
}

function durationToRange(duration: string): {
  minDurationSec?: number;
  maxDurationSec?: number;
} {
  const shortMax = 15 * 60;
  const midMax = 35 * 60;

  if (duration === 'short') return { maxDurationSec: shortMax };
  if (duration === 'mid')
    return { minDurationSec: shortMax + 1, maxDurationSec: midMax };
  if (duration === 'long') return { minDurationSec: midMax + 1 };
  return {};
}

export function useQuizzesCatalog(params: {
  locale: string;
  page: number;
  size: number;
  filters: { search: string; category: string; duration: string };
}) {
  const rawSearch = params.filters.search.trim();
  const debouncedSearch = useDebounce(rawSearch, 350);

  const hasServerCategory = params.filters.category !== 'all';
  const hasServerDuration = params.filters.duration !== 'any';
  const hasServerSearch = debouncedSearch.length >= 2;

  const shouldSearch =
    hasServerSearch || hasServerCategory || hasServerDuration;

  const searchParams = useMemo<Search1Params | undefined>(() => {
    if (!shouldSearch) return undefined;

    const p: Search1Params = {
      page: String(params.page),
      size: String(params.size),
    };

    if (hasServerSearch) p.search = debouncedSearch;

    if (hasServerCategory) {
      const id = Number(params.filters.category);
      if (Number.isFinite(id)) p.categoryId = id;
    }

    if (hasServerDuration) {
      const r = durationToRange(params.filters.duration);
      if (typeof r.minDurationSec === 'number')
        p.minDurationSec = r.minDurationSec;
      if (typeof r.maxDurationSec === 'number')
        p.maxDurationSec = r.maxDurationSec;
    }

    return p;
  }, [
    shouldSearch,
    hasServerSearch,
    hasServerCategory,
    hasServerDuration,
    debouncedSearch,
    params.page,
    params.size,
    params.filters.category,
    params.filters.duration,
  ]);

  const listQ = useQuizzes({ page: params.page, size: params.size, locale: params.locale });
  const searchQ = useSearchQuizzesLocalized(params.locale, searchParams);
  const quizzesSource = shouldSearch ? searchQ : listQ;

  const metricsQ = useGetAllMetrics({
    query: {
      queryKey: ['api/v1/quizzes/metrics', params.locale],
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
    request: {
      headers: { 'x-locale': params.locale },
    },
  });

  const categoriesQ = useCategories(params.locale);

  const itemsAll = useMemo<QuizCatalogItem[]>(() => {
    const base = extractItems<QuizDto>(quizzesSource.data).filter(hasNumberId);

    const quizzes =
      rawSearch && !shouldSearch
        ? base.filter((x) =>
          (x.title ?? '').toLowerCase().includes(rawSearch.toLowerCase()),
        )
        : base;

    const metricsArr = Array.isArray(metricsQ.data)
      ? (metricsQ.data as unknown[])
      : [];
    const metricsByQuizId = new Map<number, QuizMetric>();

    for (const m of metricsArr) {
      if (typeof m !== 'object' || m === null) continue;
      const o = m as Record<string, unknown>;

      const quizId = typeof o.quizId === 'number' ? o.quizId : undefined;
      if (!quizId) continue;

      const metric: QuizMetric = {
        quizId,
        categoryId: typeof o.categoryId === 'number' ? o.categoryId : undefined,
        attemptsTotal:
          typeof o.attemptsTotal === 'number' ? o.attemptsTotal : undefined,
        questionsTotal:
          typeof o.questionsTotal === 'number' ? o.questionsTotal : undefined,
        estimatedDurationSeconds:
          typeof o.estimatedDurationSeconds === 'number'
            ? o.estimatedDurationSeconds
            : undefined,
        avgDurationSeconds:
          typeof o.avgDurationSeconds === 'number'
            ? o.avgDurationSeconds
            : undefined,
      };

      metricsByQuizId.set(quizId, metric);
    }

    const categoriesById = new Map<number, ProfessionCategoryDto>();
    for (const c of categoriesQ.data ?? []) {
      if (typeof c?.id === 'number') categoriesById.set(c.id, c);
    }

    return quizzes.map((q) => {
      const metric = metricsByQuizId.get(q.id);
      const category =
        metric?.categoryId != null
          ? categoriesById.get(metric.categoryId)
          : undefined;
      return { ...q, metric, category };
    });
  }, [
    quizzesSource.data,
    metricsQ.data,
    categoriesQ.data,
    rawSearch,
    shouldSearch,
  ]);

  const filtered = useMemo(() => {
    let list = itemsAll;

    if (params.filters.category !== 'all') {
      list = list.filter(
        (x) => String(x.category?.id ?? '') === params.filters.category,
      );
    }

    if (params.filters.duration !== 'any') {
      list = list.filter((x) =>
        matchesDuration(pickDurationSeconds(x.metric), params.filters.duration),
      );
    }

    return list;
  }, [itemsAll, params.filters.category, params.filters.duration]);

  const total = useMemo(() => {
    const t = extractTotal(quizzesSource.data);
    if (t) return t;
    return extractItems<QuizDto>(quizzesSource.data).length;
  }, [quizzesSource.data]);

  return {
    items: filtered,
    total,
    categories: categoriesQ.data ?? [],
    isLoading:
      quizzesSource.isLoading || metricsQ.isLoading || categoriesQ.isLoading,
    quizzesError: quizzesSource.error,
    metricsError: metricsQ.error,
    categoriesError: categoriesQ.error,
    refetch: () => {
      quizzesSource.refetch();
      metricsQ.refetch();
      categoriesQ.refetch();
    },
  };
}
