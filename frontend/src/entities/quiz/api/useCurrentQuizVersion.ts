import { useGetCurrentVersion } from '@/shared/api/generated/api';
import type { QuizVersionDto } from '@/shared/api/generated/model';

export function useCurrentQuizVersion(quizId: number) {
  const enabled = Number.isFinite(quizId) && quizId > 0;

  return useGetCurrentVersion<QuizVersionDto>(quizId, {
    query: {
      enabled,
    },
  });
}
