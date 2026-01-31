import { useGetCurrentVersion } from '@/shared/api/generated/api';
import type { QuizVersionDto } from '@/shared/api/generated/model';

export function useCurrentQuizVersion(quizId: number, locale?: string) {
  const enabled = Number.isFinite(quizId) && quizId > 0;

  return useGetCurrentVersion<QuizVersionDto>(quizId, {
    query: {
      enabled,
      queryKey: ['quiz-version', quizId, locale],
    },
    request: {
      headers: locale ? { 'x-locale': locale } : undefined,
    },
  });
}
