import { useQuery } from '@tanstack/react-query';
import { getCurrentVersion } from '@/shared/api/generated/api';
import type { QuizVersionDto } from '@/shared/api/generated/model';

export function useCurrentQuizVersionIdQuery(quizId: number) {
  return useQuery<number, Error>({
    queryKey: ['quiz', 'versions', 'current', quizId],
    enabled: Number.isFinite(quizId) && quizId > 0,
    queryFn: async ({ signal }) => {
      const dto = (await getCurrentVersion(quizId, {
        signal,
      })) as unknown as QuizVersionDto | null;

      if (!dto || typeof dto.id !== 'number') {
        throw new Error('Current quiz version id is missing');
      }

      return dto.id;
    },
    staleTime: 60_000,
  });
}
