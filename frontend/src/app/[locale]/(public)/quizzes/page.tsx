'use client';

import { useState } from 'react';
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

type FiltersValue = {
  q: string;
  category: string;
  duration: string;
};

export default function QuizzesPage() {
  const t = useTranslations('Quizzes');
  const { locale } = useParams<{ locale: string }>();

  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  const [filters, setFilters] = useState<FiltersValue>({
    q: '',
    category: 'all',
    duration: 'any',
  });

  const {
    items,
    total,
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

  const onFiltersChange = (next: FiltersValue) => {
    setFilters(next);
    setPage(1);
  };

  const onClearFilters = () => {
    setFilters({ q: '', category: 'all', duration: 'any' });
    setPage(1);
  };

  return (
    <div className="pb-4">
      <QuizzesHeader total={total || items.length} />

      <QuizzesFilters
        value={filters}
        onChange={onFiltersChange}
        onClear={onClearFilters}
        categories={[]}
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
      ) : items.length === 0 ? (
        <QuizEmptyState />
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
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
