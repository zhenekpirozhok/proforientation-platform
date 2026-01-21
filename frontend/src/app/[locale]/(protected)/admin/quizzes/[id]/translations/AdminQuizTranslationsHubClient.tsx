"use client";

import { AdminQuizTranslationsHubPage } from '@/features/admin-quiz-translations/ui/AdminQuizTranslationsHubPage';
import { useSearchTranslations } from '@/entities/translation/api/useSearchTranslations';
import type { QuizTranslatableRow } from '@/features/admin-quiz-translations/model/types';

export default function AdminQuizTranslationsHubClient({ quizId }: { quizId: number }) {
  const canLoad = Number.isFinite(quizId) && quizId > 0;

  const questionsQuery = useSearchTranslations(
    canLoad ? { entityType: 'question', entityId: quizId, locale: 'all' } : undefined,
  );

  const optionsQuery = useSearchTranslations(
    canLoad ? { entityType: 'question_option', entityId: quizId, locale: 'all' } : undefined,
  );

  const questionsRows = ((questionsQuery as unknown as { data?: unknown })?.data ?? []) as QuizTranslatableRow[];
  const optionsRows = ((optionsQuery as unknown as { data?: unknown })?.data ?? []) as QuizTranslatableRow[];

  const isLoadingQuestions = (questionsQuery as unknown as { isLoading?: boolean })?.isLoading ?? false;
  const isLoadingOptions = (optionsQuery as unknown as { isLoading?: boolean })?.isLoading ?? false;

  return (
    <AdminQuizTranslationsHubPage
      quizId={quizId}
      questionsRows={questionsRows}
      optionsRows={optionsRows}
      isLoadingQuestions={isLoadingQuestions}
      isLoadingOptions={isLoadingOptions}
    />
  );
}
