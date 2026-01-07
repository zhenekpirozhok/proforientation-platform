'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Alert } from 'antd';

import { useQuizzesCatalog } from '@/features/quizzes/model/useQuizzesCatalog';
import { QuizzesHeader } from '@/features/quizzes/ui/QuizzesHeader';
import { QuizzesFilters } from '@/features/quizzes/ui/QuizzesFilters';
import { QuizGridSkeleton } from '@/features/quizzes/ui/QuizGridSkeleton';
import { QuizEmptyState } from '@/features/quizzes/ui/QuizEmptyState';
import { QuizCard } from '@/entities/quiz/ui/QuizCard';
import { QuizzesPagination } from '@/features/quizzes/ui/QuizzesPagination';
import type { FiltersValue } from '@/features/quizzes/model/types';

function durationSeconds(item: any) {
  const v = item?.metric?.estimatedDurationSeconds;
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function matchesDurationFilter(item: any, duration: FiltersValue['duration']) {
  if (duration === 'any') return true;

  const s = durationSeconds(item);
  if (s == null) return false;

  const shortMax = 15 * 60;
  const midMax = 35 * 60;

  if (duration === 'short') return s <= shortMax;
  if (duration === 'mid') return s > shortMax && s <= midMax;
  if (duration === 'long') return s > midMax;

  return true;
}

export default function QuizzesPage() {
  const t = useTranslations('Quizzes');
  const { locale } = useParams<{ locale: string }>();

  const [page, setPage] = useState(1);
  const pageSize = 12;

  const [filters, setFilters] = useState<FiltersValue>({
    search: '',
    category: 'all',
    duration: 'any',
  });

  const {
    items,
    total,
    categories,
    isLoading,
    quizzesError,
    metricsError,
    categoriesError,
    refetch,
  } = useQuizzesCatalog({
    locale,
    page,
    size: pageSize,
    filters,
  });

  const visibleItems = useMemo(() => {
    return items.filter((item) => matchesDurationFilter(item, filters.duration));
  }, [items, filters.duration]);

  const onFiltersChange = (next: FiltersValue) => {
    setPage(1);
    setFilters(next);
  };

  const onClearFilters = () => {
    setPage(1);
    setFilters({ search: '', category: 'all', duration: 'any' });
  };

  const headerTotal = filters.duration === 'any' ? total || items.length : visibleItems.length;

  return (
    <div className="pb-4">
      <QuizzesHeader total={headerTotal} />

      <QuizzesFilters
        value={filters}
        onChange={onFiltersChange}
        onClear={onClearFilters}
        categories={categories}
      />

      {quizzesError ? (
        <div className="mt-6">
          <Alert
            type="error"
            message={t('error')}
            showIcon
            action={<a onClick={refetch}>{t('retry')}</a>}
          />
        </div>
      ) : null}

      {!quizzesError && metricsError ? (
        <div className="mt-6">
          <Alert type="warning" message={t('metricsUnavailable')} showIcon />
        </div>
      ) : null}

      {!quizzesError && !metricsError && categoriesError ? (
        <div className="mt-6">
          <Alert type="warning" message={t('categoriesUnavailable')} showIcon />
        </div>
      ) : null}

      {isLoading && page === 1 ? (
        <QuizGridSkeleton />
      ) : visibleItems.length === 0 ? (
        <QuizEmptyState />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item) => (
            <QuizCard
              key={item.id}
              locale={locale}
              quiz={item}
              metric={item.metric}
              category={item.category}
            />
          ))}
        </div>
      )}

      {total > pageSize ? (
        <QuizzesPagination
          page={page}
          pageSize={pageSize}
          total={total}
          loading={isLoading && page > 1}
          onChange={setPage}
        />
      ) : null}
    </div>
  );
}
