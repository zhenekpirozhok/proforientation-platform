import { useGetById1 } from '@/shared/api/generated/api';
import type { QuizDto } from '@/shared/api/generated/model';

export function useQuiz(quizId: number, locale?: string) {
  const enabled = Number.isFinite(quizId) && quizId > 0;

  return useGetById1<QuizDto>(quizId, {
    query: {
      enabled,
      queryKey: ['quiz', quizId, locale],
    },
    request: {
      headers: locale ? { 'x-locale': locale } : undefined,
    },
  });
}
