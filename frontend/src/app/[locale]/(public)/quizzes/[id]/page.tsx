'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { notFound, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from 'antd';

import { useQuizDetails } from '@/entities/quiz/api/useQuizDetails';
import { useCategories } from '@/entities/category/api/useCategories';
import type { ProfessionCategoryDto } from '@/shared/api/generated/model';

import { QuizDetailsHero } from '@/features/quiz-details/ui/QuizDetailsHero';
import { QuizStats } from '@/features/quiz-details/ui/QuizStats';
import { QuizTips } from '@/features/quiz-details/ui/QuizTips';
import { QuizDetailsSkeleton } from '@/features/quiz-details/ui/QuizDetailsSkeleton';

export default function QuizDetailsPage() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const t = useTranslations('QuizDetails');

  const parsedId = Number(id);
  const validId = Number.isFinite(parsedId) && parsedId > 0;
  const quizId = validId ? parsedId : 0;

  const { quiz, metrics, questionCount, estimatedMinutes, isLoading, error } =
    useQuizDetails(quizId);

  if (!validId) notFound();

  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories(locale);

  const categoriesById = useMemo(() => {
    const map = new Map<number, ProfessionCategoryDto>();
    categories.forEach((c) => {
      if (typeof c.id === 'number') map.set(c.id, c);
    });
    return map;
  }, [categories]);

  const categoryName =
    typeof metrics?.categoryId === 'number'
      ? categoriesById.get(metrics.categoryId)?.name
      : undefined;

  if (!validId) return <div>Invalid quiz id</div>;
  if (isLoading || categoriesLoading) return <QuizDetailsSkeleton />;
  if (error || !quiz) return <div>{t('error')}</div>;

  const taken =
    typeof metrics?.attemptsTotal === 'number' ? metrics.attemptsTotal : null;

  const title = quiz.title ?? t('fallbackTitle', { id: quizId });
  const description = quiz.descriptionDefault ?? '';

  return (
    <main className="mx-auto w-full max-w-[1100px] px-4 py-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href={`/${locale}/quizzes`}
          className="inline-flex items-center gap-2 rounded-xl px-2 py-1 text-sm text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
        >
          <span aria-hidden>←</span>
          <span>{t('back')}</span>
        </Link>
      </div>

      <div className="space-y-8">
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
          tQuestions={t('questions')}
          tMinutes={t('minutesToComplete')}
          tTaken={t('taken')}
        />

        <QuizTips
          title={t('tipsTitle')}
          items={[t('tip1'), t('tip2'), t('tip3'), t('tip4')]}
        />

        <div className="hidden justify-center sm:flex">
          <Link href={`/${locale}/quizzes/${quizId}/play`}>
            <Button
              type="primary"
              size="large"
              className="rounded-2xl px-10"
              data-testid="start-quiz-button"
            >
              {t('start')} →
            </Button>
          </Link>
        </div>
      </div>

      <div className="fixed inset-x-4 bottom-4 z-50 sm:hidden">
        <Link href={`/${locale}/quizzes/${quizId}/play`} className="block">
          <Button
            type="primary"
            size="large"
            className="h-12 w-full rounded-2xl shadow-lg"
          >
            {t('start')} →
          </Button>
        </Link>
      </div>

      <div className="h-20 sm:hidden" />
    </main>
  );
}
