'use client'

import { useMemo } from 'react'
import type {
  QuizDto,
  QuizPublicMetricsView,
  ProfessionCategoryDto,
  SearchQuizzesParams,
} from '@/shared/api/generated/model'

import { useQuizzes } from '@/entities/quiz/api/useQuizzes'
import { useGetAllMetrics } from '@/shared/api/generated/api'
import { useCategories } from '@/entities/category/api/useCategories'
import { useSearchQuizzesLocalized } from '@/entities/quiz/api/useSearchQuizzes'
import { useDebounce } from '@/shared/lib/useDebounce'

type PageLike<T> = {
  content?: T[]
  items?: T[]
  totalElements?: number
  total?: number
}

function extractItems<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[]
  const page = data as PageLike<T> | null | undefined
  return page?.content ?? page?.items ?? []
}

function extractTotal(data: unknown): number {
  const page = data as PageLike<unknown> | null | undefined
  return (page?.totalElements ?? page?.total ?? 0) as number
}

function hasNumberId(q: QuizDto): q is QuizDto & { id: number } {
  return typeof q.id === 'number' && Number.isFinite(q.id)
}

export type QuizCatalogItem = (QuizDto & { id: number }) & {
  metric?: QuizPublicMetricsView
  category?: ProfessionCategoryDto
}

export function useQuizzesCatalog(params: {
  locale: string
  page: number
  size: number
  filters: { search: string; category: string; duration: string }
}) {
  const rawSearch = params.filters.search.trim()
  const debouncedSearch = useDebounce(rawSearch, 350)
  const shouldSearch = debouncedSearch.length >= 2

  const searchParams = useMemo<SearchQuizzesParams | undefined>(() => {
    if (!shouldSearch) return undefined
    return {
      search: debouncedSearch,
      page: params.page,
      size: params.size,
    }
  }, [shouldSearch, debouncedSearch, params.page, params.size])

  const listQ = useQuizzes({ page: params.page, size: params.size })
  const searchQ = useSearchQuizzesLocalized(params.locale, searchParams)
  const quizzesSource = shouldSearch ? searchQ : listQ

  const metricsQ = useGetAllMetrics({
    query: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
  })

  const categoriesQ = useCategories(params.locale)

  const itemsAll = useMemo(() => {
    const base = extractItems<QuizDto>(quizzesSource.data).filter(hasNumberId)

    const quizzes =
      rawSearch && !shouldSearch
        ? base.filter((x) =>
          (x.title ?? '').toLowerCase().includes(rawSearch.toLowerCase()),
        )
        : base

    const metricsByQuizId = new Map<number, QuizPublicMetricsView>()
      ; (metricsQ.data ?? []).forEach((m) => {
        if (typeof m.quizId === 'number') metricsByQuizId.set(m.quizId, m)
      })

    const categoriesById = new Map<number, ProfessionCategoryDto>()
      ; (categoriesQ.data ?? []).forEach((c) => {
        if (typeof c.id === 'number') categoriesById.set(c.id, c)
      })

    return quizzes.map<QuizCatalogItem>((q) => {
      const metric = metricsByQuizId.get(q.id)
      const category =
        metric?.categoryId != null ? categoriesById.get(metric.categoryId) : undefined
      return { ...q, metric, category }
    })
  }, [quizzesSource.data, metricsQ.data, categoriesQ.data, rawSearch, shouldSearch])

  const filtered = useMemo(() => {
    let list = itemsAll

    if (params.filters.category !== 'all') {
      list = list.filter((x) => String(x.category?.id ?? '') === params.filters.category)
    }

    return list
  }, [itemsAll, params.filters.category])

  const total = useMemo(() => {
    const t = extractTotal(quizzesSource.data)
    if (t) return t
    return extractItems<QuizDto>(quizzesSource.data).length
  }, [quizzesSource.data])

  return {
    items: filtered,
    total,
    categories: categoriesQ.data ?? [],

    isLoading: quizzesSource.isLoading || metricsQ.isLoading || categoriesQ.isLoading,
    quizzesError: quizzesSource.error,
    metricsError: metricsQ.error,
    categoriesError: categoriesQ.error,

    refetch: () => {
      quizzesSource.refetch()
      metricsQ.refetch()
      categoriesQ.refetch()
    },
  }
}
